import type { NextRequest } from "next/server";

export function getUserRole(request: NextRequest): string | null {
  const role = request.cookies.get("role")?.value ?? "USER"; // Default to USER

  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "USER") {
    return role;
  }

  return "USER"; // Default to USER if invalid role
}
 