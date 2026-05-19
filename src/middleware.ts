import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/queue", "/settings", "/history"];

function applyCors(request: NextRequest, response: NextResponse) {
  const origin = request.headers.get("origin")?.replace(/\/$/, "");
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
    "http://localhost:3000"
  ].filter(Boolean).map((value) => value!.replace(/\/$/, ""));

  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-cron-secret");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.headers.set("Vary", "Origin");
  }

  return response;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isApi = pathname.startsWith("/api");

  if (isApi && request.method === "OPTIONS") {
    return applyCors(request, new NextResponse(null, { status: 204 }));
  }

  if (isApi) {
    return applyCors(request, NextResponse.next());
  }

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected) return NextResponse.next();

  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has("__session");
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/queue/:path*", "/settings/:path*", "/history/:path*"]
};
