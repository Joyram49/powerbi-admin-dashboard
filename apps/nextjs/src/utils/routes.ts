// routes.ts

// Public routes (accessible without authentication)
export const LOGIN = "/login";
export const REGISTER = "/register";
export const ROOT = "/";
export const FORGOT_PASSWORD = "/forgot-password";
export const CONFIRM_EMAIL = "/confirm";

// Add additional public routes as necessary
export const PUBLIC_ROUTES = [LOGIN, FORGOT_PASSWORD, CONFIRM_EMAIL, REGISTER];

// Auth-related routes (for authentication pages)
export const AUTH_ROUTES = [LOGIN, FORGOT_PASSWORD, REGISTER];

// Dashboard routes (require authentication)
export const PRIVATE_ROUTES = [
  "/dashboard",
  "/private",
  // Add other dashboard-specific routes here
];

// You can export other custom routes here as necessary
