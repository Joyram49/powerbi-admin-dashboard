import { cookies } from "next/headers";

export async function GET() {
  cookies().set("test-cookie", "test-value", { httpOnly: false });
  return Response.json({ message: "Cookie set" });
}
