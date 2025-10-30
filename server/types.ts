import "express-session";

// Extend Express Session to include our custom properties
declare module "express-session" {
  interface SessionData {
    isAuthenticated?: boolean;
    companyKey?: string;
  }
}

// Extend Express Request to include our custom properties
declare global {
  namespace Express {
    interface Request {
      db?: any;
      storage?: any;
      companyKey?: string;
    }
  }
}
