import { type Request, type Response, type NextFunction } from "express";
import { getDbForCompany } from "../db";
import { createStorage, type DatabaseStorage } from "../storage";
import "../types/session";

// Extend Express Request to include db, storage and companyKey
declare global {
  namespace Express {
    interface Request {
      db: ReturnType<typeof getDbForCompany>;
      storage: DatabaseStorage;
      companyKey: string;
    }
  }
}

// Middleware to attach the correct database connection based on header, cookie, or session
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip tenant middleware for auth routes
  if (req.path.startsWith("/api/auth/")) {
    return next();
  }

  // Try custom header first (for Replit iframe), then cookie, then session
  const companyKey = req.headers['x-company-key'] as string || req.cookies?.companyKey || req.session.companyKey;
  
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
