// Load environment variables before anything else
import { config } from "dotenv";
config();

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Validate that all required database URLs are configured
function validateDatabaseConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // In development, allow fallback to DATABASE_URL for testing
  if (isDevelopment && process.env.DATABASE_URL) {
    if (!process.env.DATABASE_URL_FIRMA_A) {
      console.warn('⚠️  Development mode: Using DATABASE_URL as fallback for DATABASE_URL_FIRMA_A');
      process.env.DATABASE_URL_FIRMA_A = process.env.DATABASE_URL;
    }
    if (!process.env.DATABASE_URL_FIRMA_B) {
      console.warn('⚠️  Development mode: Using DATABASE_URL as fallback for DATABASE_URL_FIRMA_B');
      process.env.DATABASE_URL_FIRMA_B = process.env.DATABASE_URL;
    }
    if (!process.env.DATABASE_URL_FIRMA_C) {
      console.warn('⚠️  Development mode: Using DATABASE_URL as fallback for DATABASE_URL_FIRMA_C');
      process.env.DATABASE_URL_FIRMA_C = process.env.DATABASE_URL;
    }
  }
  
  const required = ['DATABASE_URL_FIRMA_A', 'DATABASE_URL_FIRMA_B', 'DATABASE_URL_FIRMA_C'];
  const missing: string[] = [];
  
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required database configuration. Please set the following environment variables:\n${missing.join('\n')}\n\nEach company must have its own separate database URL for data isolation.\n\n${isDevelopment ? 'Development mode: Set DATABASE_URL as a fallback for testing.\n' : 'Production mode: All three DATABASE_URL_FIRMA_* must be explicitly set.'}`
    );
  }

  // In production, validate that all URLs are unique (no shared databases)
  if (!isDevelopment) {
    const urls = [
      process.env.DATABASE_URL_FIRMA_A!,
      process.env.DATABASE_URL_FIRMA_B!,
      process.env.DATABASE_URL_FIRMA_C!,
    ];
    
    const uniqueUrls = new Set(urls);
    if (uniqueUrls.size !== urls.length) {
      throw new Error(
        `Database URLs must be unique for each company. Detected shared database URLs which violates data isolation requirements.`
      );
    }
  } else {
    console.warn('⚠️  Development mode: Database uniqueness validation is disabled. ALL COMPANIES SHARE THE SAME DATABASE.');
  }
}

// Run validation at startup
validateDatabaseConfig();

// Database URLs for each company (tenant) - NO FALLBACKS
const DATABASE_URLS = {
  'firma-a': process.env.DATABASE_URL_FIRMA_A!,
  'firma-b': process.env.DATABASE_URL_FIRMA_B!,
  'firma-c': process.env.DATABASE_URL_FIRMA_C!,
};

// Connection pools for each company
const pools: Record<string, Pool> = {};

// Health check: Verify all databases are accessible at startup
export async function healthCheckDatabases() {
  const results: Record<string, { success: boolean; error?: string }> = {};
  
  for (const [key, url] of Object.entries(DATABASE_URLS)) {
    try {
      const testPool = new Pool({ connectionString: url });
      // Try a simple query to verify connection
      const result = await testPool.query('SELECT 1');
      await testPool.end();
      results[key] = { success: true };
    } catch (error: any) {
      // Log full error for debugging
      console.error(`Database connection error for ${key}:`, error.stack || error.message);
      results[key] = { success: false, error: error.message };
    }
  }
  
  const failed = Object.entries(results).filter(([_, r]) => !r.success);
  if (failed.length > 0) {
    const errors = failed.map(([key, r]) => `  - ${key}: ${r.error}`).join('\n');
    throw new Error(
      `Database health check failed for the following companies:\n${errors}\n\nPlease verify database connectivity before starting the application.`
    );
  }
  
  return results;
}

// Get database connection for a specific company
export function getDbForCompany(companyKey: string) {
  const url = DATABASE_URLS[companyKey as keyof typeof DATABASE_URLS];
  
  if (!url) {
    throw new Error(`Invalid company key: ${companyKey}`);
  }

  // Create pool if it doesn't exist
  if (!pools[companyKey]) {
    pools[companyKey] = new Pool({ connectionString: url });
  }

  return drizzle(pools[companyKey], { schema });
}

// Default export for backwards compatibility (uses firma-a)
export const pool = new Pool({ connectionString: DATABASE_URLS['firma-a'] });
export const db = drizzle(pool, { schema });
