// routes.ts

// Public routes (accessible without authentication)
export const LOGIN = "/login";
export const REGISTER = "/register";
export const ROOT = "/";
export const FORGOT_PASSWORD = "/forgot-password";
export const VERIFY_OTP = "/verify-otp";
export const RESET_PASSWORD = "/reset-password";

// Add additional public routes as necessary
export const PUBLIC_ROUTES = [LOGIN, FORGOT_PASSWORD, VERIFY_OTP];

// Auth-related routes (for authentication pages)
export const AUTH_ROUTES = [
  LOGIN,
  FORGOT_PASSWORD,
  VERIFY_OTP,
  RESET_PASSWORD,
  REGISTER,
];

// Dashboard routes (require authentication)
export const PRIVATE_ROUTES = [
  "/dashboard",
  "/private",
  "/company",
  REGISTER,
  // Add other dashboard-specific routes here
];

// You can export other custom routes here as necessary
