export const LOGIN = "/login";
export const REGISTER = "/register";
export const FORGOT_PASSWORD = "/forgot-password";
export const RESET_PASSWORD = "/reset-password";
export const VERIFY_OTP = "/verify-otp";
export const REPORT = "/report";

// Add additional public routes as necessary
export const PUBLIC_ROUTES = [
  LOGIN,
  FORGOT_PASSWORD,
  VERIFY_OTP,
  RESET_PASSWORD,
  REGISTER,
];
// Add role base routing
interface ROLE_ROUTES_TYPES {
  superAdmin: string;
  admin: string;
  user: string;
}
export const ROLE_ROUTES: ROLE_ROUTES_TYPES = {
  superAdmin: "/super-admin",
  admin: "/admin",
  user: "/user",
};

export const PRIVATE_ROUTES = ["/private", "/company", "/success", REPORT];
