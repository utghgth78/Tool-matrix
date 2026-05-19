import { cookies } from "next/headers";

export async function POST() {
  const crossSiteBackend = Boolean(process.env.NEXT_PUBLIC_BACKEND_URL);

  (await cookies()).set("__session", "", {
    maxAge: 0,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || crossSiteBackend,
    sameSite: crossSiteBackend ? "none" : "lax",
    path: "/"
  });

  return Response.json({ ok: true });
}
