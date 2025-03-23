import type { NextRequest } from "next/server";

export function getUserRole(request: NextRequest): string | null {
  const role = request.cookies.get("role")?.value ?? "user"; // Default to USER

  if (role === "superAdmin" || role === "admin" || role === "user") {
    return role;
  }

  return "user"; // Default to USER if invalid role
}