import "express-session";

declare module "express-session" {
  interface SessionData {
    companyKey?: string; // 'firma-a', 'firma-b', or 'firma-c'
  }
}

export {};
