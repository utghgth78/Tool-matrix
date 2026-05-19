import { NextRequest, NextResponse } from "next/server";
import { appUrl } from "@/lib/env";
import { getOAuthClient, saveGoogleTokens, verifyOAuthState } from "@/lib/google/oauth";
import { jsonError } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
  try {
    const code = request.nextUrl.searchParams.get("code");
    const state = request.nextUrl.searchParams.get("state");
    const error = request.nextUrl.searchParams.get("error");

    if (error) throw new Error(`Google OAuth failed: ${error}`);
    if (!code || !state) throw new Error("Missing OAuth callback values.");

    const uid = verifyOAuthState(state);
    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    await saveGoogleTokens(uid, tokens);

    return NextResponse.redirect(`${appUrl()}/settings?connected=google`);
  } catch (error) {
    const message = encodeURIComponent(error instanceof Error ? error.message : "OAuth failed.");
    return NextResponse.redirect(`${appUrl()}/settings?error=${message}`);
  }
}

export async function POST() {
  return jsonError(new Error("Method not allowed."), 405);
}
