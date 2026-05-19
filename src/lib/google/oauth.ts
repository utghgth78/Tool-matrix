import { createHmac, timingSafeEqual } from "crypto";
import { google } from "googleapis";
import { FieldValue } from "firebase-admin/firestore";
import { appUrl, requiredEnv } from "@/lib/env";
import { adminDb } from "@/lib/firebase/admin";
import { decryptSecret, encryptSecret } from "@/lib/security/encryption";

const scopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube"
];

export function redirectUri() {
  return process.env.GOOGLE_REDIRECT_URI || `${appUrl()}/api/oauth/google/callback`;
}

export function getOAuthClient() {
  return new google.auth.OAuth2(
    requiredEnv("GOOGLE_CLIENT_ID"),
    requiredEnv("GOOGLE_CLIENT_SECRET"),
    redirectUri()
  );
}

export function createOAuthState(uid: string) {
  const timestamp = Date.now().toString();
  const raw = `${uid}.${timestamp}`;
  const signature = createHmac("sha256", requiredEnv("GOOGLE_CLIENT_SECRET")).update(raw).digest("base64url");
  return Buffer.from(`${raw}.${signature}`).toString("base64url");
}

export function verifyOAuthState(state: string) {
  const decoded = Buffer.from(state, "base64url").toString("utf8");
  const [uid, timestamp, signature] = decoded.split(".");
  if (!uid || !timestamp || !signature) throw new Error("Invalid OAuth state.");

  const raw = `${uid}.${timestamp}`;
  const expected = createHmac("sha256", requiredEnv("GOOGLE_CLIENT_SECRET")).update(raw).digest("base64url");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
    throw new Error("Invalid OAuth signature.");
  }

  if (Date.now() - Number(timestamp) > 10 * 60 * 1000) throw new Error("OAuth state expired.");
  return uid;
}

export function getGoogleAuthUrl(uid: string) {
  return getOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state: createOAuthState(uid)
  });
}

export async function saveGoogleTokens(uid: string, tokens: {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
  scope?: string;
  token_type?: string | null;
}) {
  const existing = await adminDb.doc(`users/${uid}/integrations/google`).get();
  const current = existing.data();
  const refreshToken = tokens.refresh_token || (current?.refreshToken ? decryptSecret(current.refreshToken) : undefined);

  if (!refreshToken) throw new Error("Google did not return a refresh token. Reconnect and approve offline access.");

  const payload: Record<string, unknown> = {
    refreshToken: encryptSecret(refreshToken),
    expiryDate: tokens.expiry_date || null,
    scope: tokens.scope || current?.scope || scopes.join(" "),
    tokenType: tokens.token_type || "Bearer",
    updatedAt: FieldValue.serverTimestamp()
  };

  if (tokens.access_token || current?.accessToken) {
    payload.accessToken = tokens.access_token ? encryptSecret(tokens.access_token) : current?.accessToken;
  }

  await adminDb.doc(`users/${uid}/integrations/google`).set(
    payload,
    { merge: true }
  );

  await adminDb.doc(`users/${uid}`).set(
    {
      googleConnected: true,
      youtubeConnected: true,
      driveConnected: true,
      updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );
}

export async function getAuthorizedGoogleClient(uid: string) {
  const snap = await adminDb.doc(`users/${uid}/integrations/google`).get();
  if (!snap.exists) throw new Error("Connect Google Drive and YouTube in Settings first.");

  const data = snap.data();
  if (!data?.refreshToken) throw new Error("Google refresh token is missing.");

  const client = getOAuthClient();
  client.setCredentials({
    refresh_token: decryptSecret(data.refreshToken),
    access_token: data.accessToken ? decryptSecret(data.accessToken) : undefined,
    expiry_date: data.expiryDate || undefined
  });

  client.on("tokens", async (tokens) => {
    if (tokens.access_token || tokens.refresh_token) {
      await saveGoogleTokens(uid, tokens);
    }
  });

  return client;
}
