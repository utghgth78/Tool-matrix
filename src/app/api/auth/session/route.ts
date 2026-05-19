import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { jsonError } from "@/lib/server/auth";

export async function POST(request: Request) {
  try {
    const { token } = (await request.json()) as { token?: string };
    if (!token) throw new Error("Missing Firebase ID token.");

    await adminAuth.verifyIdToken(token);
    const expiresIn = 5 * 24 * 60 * 60 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn });
    const crossSiteBackend = Boolean(process.env.NEXT_PUBLIC_BACKEND_URL);

    (await cookies()).set("__session", sessionCookie, {
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" || crossSiteBackend,
      sameSite: crossSiteBackend ? "none" : "lax",
      path: "/"
    });

    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error, 401);
  }
}
