import { NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google/oauth";
import { getSessionUser, jsonError } from "@/lib/server/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    return NextResponse.redirect(getGoogleAuthUrl(user.uid));
  } catch (error) {
    return jsonError(error, 401);
  }
}
