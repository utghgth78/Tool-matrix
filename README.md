# TubeFlow AI

TubeFlow AI is a free-tier-friendly YouTube automation platform built with Next.js 15, React, TypeScript, TailwindCSS, Firebase Authentication, Firestore, Google OAuth, Google Drive API, YouTube Data API v3, and Gemini.

It avoids Redis, Docker, VPS hosting, BullMQ, and paid queue systems. Firestore is the durable queue, and `/api/upload-next` is safe to call from cron-job.org, Vercel Cron, GitHub Actions, or Render cron.

## Features

- Google login with Firebase Authentication
- Separate Google OAuth connection for Drive scanning and YouTube uploads
- Encrypted refresh-token storage
- Protected dashboard routes
- Dark responsive SaaS dashboard
- Drive folder scanning for `mp4`, `mov`, `mkv`, `avi`, and `webm`
- Firestore upload queue with duplicate prevention and retry support
- One-at-a-time YouTube uploads
- Cron-compatible automation endpoint
- Gemini metadata generation for SEO title, description, tags, and hashtags
- Firestore security rules and indexes

## Project Structure

```txt
src/
  app/          Next.js pages and API routes
  components/   dashboard UI components
  hooks/        Firebase auth, settings, queue, notifications
  lib/          server/client integrations and business logic
  services/     service re-exports for scalable architecture
  utils/        utility re-exports
  styles/       style notes; global CSS is in app/globals.css
```

## Environment Variables

Copy `.env.example` to `.env.local`.

The user-facing requirements are included:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

GEMINI_API_KEY=
```

Production secure backend routes also need:

```env
GOOGLE_REDIRECT_URI=https://your-backend-domain.com/api/oauth/google/callback
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
TOKEN_ENCRYPTION_KEY=
CRON_SECRET=
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.com
NEXT_PUBLIC_BACKEND_URL=https://your-render-domain.com
```

`TOKEN_ENCRYPTION_KEY` can be any long random secret. Use at least 32 characters.

## Firebase Setup

1. Create a Firebase project.
2. Enable Authentication, then enable Google as a sign-in provider.
3. Create a Firestore database in production mode.
4. Create a Firebase service account and add `FIREBASE_CLIENT_EMAIL` plus `FIREBASE_PRIVATE_KEY` to your deployment environment.
5. Deploy rules and indexes:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## Google Cloud Setup

1. In the same Google Cloud project, enable:
   - YouTube Data API v3
   - Google Drive API
2. Create an OAuth client for a web application.
3. Add authorized redirect URI:
   - Local: `http://localhost:3000/api/oauth/google/callback`
   - Render: `https://your-render-domain.com/api/oauth/google/callback`
4. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - your Vercel frontend URL
   - your Render backend URL

## Gemini Setup

Create a free Gemini API key in Google AI Studio and set `GEMINI_API_KEY`.

The app defaults to `gemini-1.5-flash`. You can override with `GEMINI_MODEL`.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Deployment

### Frontend on Vercel

1. Import this repository into Vercel.
2. Add all `NEXT_PUBLIC_*` variables.
3. If API routes run on Render, set:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-render-domain.com
NEXT_PUBLIC_APP_URL=https://your-vercel-domain.com
```

4. Deploy.

### Backend on Render Free Tier

This repository can also run as the backend service on Render.

1. Create a Render Web Service.
2. Use:

```bash
Build Command: npm install && npm run build
Start Command: npm run start
```

3. Add all server environment variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `TOKEN_ENCRYPTION_KEY`
   - `CRON_SECRET`
   - `GEMINI_API_KEY`
   - all `NEXT_PUBLIC_FIREBASE_*`
   - `NEXT_PUBLIC_APP_URL`

Render free services may sleep. Cron calls wake the service, but the first request can be slower.

## Cron Automation

Call this endpoint every few minutes:

```txt
POST https://your-backend-domain.com/api/upload-next
```

Headers:

```txt
x-cron-secret: your-cron-secret
```

Vercel Cron can call `GET /api/upload-next`; the route supports both `GET` and `POST`.

Related API routes:

- `POST /api/drive/scan`
- `POST /api/metadata/generate`
- `POST /api/uploads/:videoId/upload`
- `POST /api/uploads/:videoId/schedule`
- `POST /api/uploads/:videoId/status`
- `POST /api/uploads/:videoId/retry`
- `POST /api/upload-next`

GitHub Actions example:

```yaml
name: TubeFlow Upload Cron
on:
  schedule:
    - cron: "*/5 * * * *"
jobs:
  upload:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST "$TUBEFLOW_BACKEND_URL/api/upload-next" \
            -H "x-cron-secret: $TUBEFLOW_CRON_SECRET"
```

## Queue Model

Videos are stored in `videos/{uid}_{driveFileId}`. That document id prevents duplicate imports for the same user and Drive file.

Statuses:

- `pending`
- `metadata_ready`
- `scheduled`
- `uploading`
- `uploaded`
- `failed`

The cron route uses a Firestore lock at `locks/upload-next`, so concurrent cron calls do not upload multiple videos at once.

## Notes for Free-Tier Limits

- YouTube uploads can take longer than typical serverless limits for large files. Render free tier is the better backend target for long uploads.
- YouTube Data API has daily quota limits. Uploading videos consumes quota quickly.
- Google OAuth apps in testing mode are limited to test users until verified.
- Firestore rules block client writes to upload completion fields; only backend Admin SDK routes can mark videos uploaded.
