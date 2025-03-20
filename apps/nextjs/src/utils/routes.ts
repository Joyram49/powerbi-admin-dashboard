// routes.ts

// Public routes (accessible without authentication)
export const LOGIN = "/login";
export const REGISTER = "/register";
export const ROOT = "/";
export const FORGOT_PASSWORD = "/forgot-password";
export const CONFIRM_EMAIL = "/confirm";
export const DASHBOARD = "/dashboard";
export const USER_DASHBOARD = "/dashboard/user";
export const ADMIN_DASHBOARD = "/dashboard/admin";
export const SUPER_ADMIN_DASHBOARD = "/dashboard/super-admin";

// Add additional public routes as necessary
export const PUBLIC_ROUTES = [
  LOGIN,
  FORGOT_PASSWORD,
  CONFIRM_EMAIL,
  REGISTER,
  DASHBOARD,
  USER_DASHBOARD,
  ADMIN_DASHBOARD,
  SUPER_ADMIN_DASHBOARD,
];

// Dashboard routes (require authentication)
export const PRIVATE_ROUTES = [
  "/private",
  // Add other dashboard-specific routes here
];

// You can export other custom routes here as necessary
