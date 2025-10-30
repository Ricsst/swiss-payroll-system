import { type Request, type Response, type NextFunction } from "express";
import { getDbForCompany } from "../db";
import { createStorage } from "../storage";
import "../types/session";

// Import authTokens from routes (will be passed via closure)
let authTokensStore: Map<string, { isAuthenticated: boolean; companyKey?: string }> | null = null;

export function setTenantAuthTokensStore(store: Map<string, { isAuthenticated: boolean; companyKey?: string }>) {
  authTokensStore = store;
}

// Middleware to attach the correct database connection based on header, cookie, or session
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip tenant middleware for auth routes
  if (req.path.startsWith("/api/auth/")) {
    return next();
  }

  // Try to get company from auth token first (from header or query param), then custom header
  const token = (req.headers['x-auth-token'] as string) || (req.query.token as string);
  let companyKey: string | undefined;
  
  if (token && authTokensStore) {
    const tokenData = authTokensStore.get(token);
    if (tokenData) {
      companyKey = tokenData.companyKey;
    }
  }
  
  // Fallback to custom header or query param
  if (!companyKey) {
    companyKey = (req.headers['x-company-key'] as string) || (req.query.company as string);
  }
  
  // If no company selected, allow only specific routes
  if (!companyKey) {
    // Allow access to tenant selection endpoints
    if (req.path === "/api/tenant" || req.path === "/api/tenant/current" || req.path === "/api/tenant/companies" || req.path === "/api/tenant/logout") {
      return next();
    }
    
    // For all other API routes, require tenant selection
    if (req.path.startsWith("/api/")) {
      return res.status(403).json({ 
        error: "No company selected. Please select a company first.",
        requiresTenantSelection: true 
      });
    }
    
    // Allow non-API routes (for frontend)
    return next();
  }

  try {
    // Attach the database connection for the selected company
    req.db = getDbForCompany(companyKey);
    req.storage = createStorage(req.db);
    req.companyKey = companyKey;
    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
