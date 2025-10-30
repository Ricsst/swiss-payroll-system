import type { Request, Response, NextFunction } from "express";

// Import authTokens from routes (will be passed via closure)
let authTokensStore: Map<string, { isAuthenticated: boolean; companyKey?: string }> | null = null;

export function setAuthTokensStore(store: Map<string, { isAuthenticated: boolean; companyKey?: string }>) {
  authTokensStore = store;
}

/**
 * Authentication middleware - protects all routes except auth and public routes
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow auth routes (login, logout, status)
  if (req.path.startsWith("/api/auth/")) {
    return next();
  }

  // Check if user is authenticated via token (from header or query param)
  const token = (req.headers['x-auth-token'] as string) || (req.query.token as string);
  const tokenData = token && authTokensStore ? authTokensStore.get(token) : null;
  const isAuthenticated = tokenData?.isAuthenticated || false;

  if (!isAuthenticated) {
    // For API routes, return 401
    if (req.path.startsWith("/api/")) {
      return res.status(401).json({ 
        error: "Not authenticated. Please login first.",
        requiresAuth: true 
      });
    }
    
    // For non-API routes (HTML/assets), allow through (frontend will handle redirect)
    return next();
  }

  // User is authenticated, proceed
  next();
}
