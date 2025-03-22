// routes.ts
// Public routes (accessible without authentication)
import { env } from "~/env";

export const LOGIN = "/login";
export const REGISTER = "/register";
export const ROOT = "/";
export const FORGOT_PASSWORD = "/forgot-password";
export const VERIFY_OTP = "/verify-otp";
export const RESET_PASSWORD = "/reset-password";
export const DASHBOARD = "/dashboard";

// Add additional public routes as necessary
export const PUBLIC_ROUTES = [LOGIN, FORGOT_PASSWORD, VERIFY_OTP, REGISTER];

// During development, dashboard routes are public
export const isDevelopment = env.NODE_ENV === "development";

// Function to check if a route is public
export const isPublicRoute = (pathname: string) => {
  if (PUBLIC_ROUTES.includes(pathname)) return true;

  // In development mode, make dashboard routes public
  if (
    isDevelopment &&
    (pathname === DASHBOARD ||
      pathname.startsWith(`${DASHBOARD}/`) ||
      pathname.startsWith(`${DASHBOARD}/companies/add`) ||
      pathname.startsWith(`${DASHBOARD}/companies`))
  ) {
    return true;
  }

  return false;
};

// Dashboard routes (require authentication in production)
export const PRIVATE_ROUTES = [
  "/private",
  // Add other dashboard-specific routes here
];

// You can export other custom routes here as necessary
