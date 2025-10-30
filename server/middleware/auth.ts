import type { Request, Response, NextFunction } from "express";

/**
 * Authentication middleware - protects all routes except auth and public routes
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Allow auth routes (login, logout, status)
  if (req.path.startsWith("/api/auth/")) {
    return next();
  }

  // Check if user is authenticated
  if (!req.session.isAuthenticated) {
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
