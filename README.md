# TOOL MATRIX

Futuristic cyberpunk Tool Upload & Sharing Platform built with React, Vite, Tailwind CSS, Framer Motion, ShadCN-style glass UI primitives, and Firebase.

## Features

- Dynamic tool upload and realtime public dashboard with Firestore listeners
- User login redirects to `/dashboard`
- Admin login redirects to `/matrix-control/dashboard`
- Free tools hub for traffic and engagement
- Premium Matrix marketplace flow with locked previews, upgrade popups, VIP banners, and members-only area
- Hidden admin panel routes: `/matrix-control`, `/system-core`, `/hidden-admin`
- Firebase Google login, email/password login, registration, and forgot password
- Admin-only upload, edit, delete, category, popup, membership, and settings controls
- Free and Premium Matrix membership logic
- Premium access lock popup
- Trending tools based on stored click counts
- Matrix rain, scanlines, cyber grid, neon hover effects, glassmorphism cards
- Static frontend build suitable for InfinityFree hosting

## Business Model

TOOL MATRIX is designed as a free plus premium tool sharing platform:

- Free users can browse categories, search tools, open free tools, and preview premium tools.
- Premium Matrix users unlock all premium tools, VIP access, premium dashboard effects, exclusive uploads, and unlimited access.
- Admins choose Free or Premium while uploading each tool.
- Free users clicking premium tools see an upgrade popup: `PREMIUM ACCESS REQUIRED`.

## Firebase Collections

- `tools`
- `categories`
- `users`
- `admins`
- `memberships`
- `settings`
- `popups`

## First Admin Setup

Admin email is also hardcoded in the app and rules:

`mdefankhan56@gmail.com`

Optional Firestore admin document:

- Collection: `admins`
- Document ID: your admin Gmail in lowercase, for example `admin@example.com`
- Fields: `{ "email": "admin@example.com", "role": "admin" }`

After that, visit `/matrix-control` and sign in with the same Google account.

## Main Routes

- Homepage: `/`
- User dashboard: `/dashboard`
- Admin login: `/matrix-control`
- Admin dashboard: `/matrix-control/dashboard`
- Hash fallback: `/#/matrix-control`

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

Upload the contents of `dist/` to InfinityFree `htdocs`.

For single-page routing on InfinityFree, use the included `.htaccess` file inside `public/`; Vite copies it to `dist/`.

## Firebase Rules

Deploy:

- `firestore.rules`
- `storage.rules`

These rules allow public reads for tools, categories, settings, and popups while limiting all admin writes to users listed in the `admins` collection.
