import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function getBearerUser(request: NextRequest) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new Error("Missing authorization token.");
  return adminAuth.verifyIdToken(token);
}

export async function getSessionUser() {
  const session = (await cookies()).get("__session")?.value;
  if (!session) throw new Error("Missing session.");
  return adminAuth.verifySessionCookie(session, true);
}

export function jsonError(error: unknown, status = 400) {
  return Response.json(
    { error: error instanceof Error ? error.message : "Unexpected error." },
    { status }
  );
}

export function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
