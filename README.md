# Tool Matrix

Tool Matrix is a bilingual English/Bengali Next.js application for selling and sharing computer studio tool packs. It includes a neon cyberpunk user dashboard, Firebase Authentication, Firestore data, Firebase Storage uploads, and an admin-only panel.

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Firebase

The project uses the Firebase configuration provided in the request. Enable these Firebase products in the Firebase Console:

- Authentication with Email/Password provider
- Firestore Database
- Storage

Create an Authentication user for the admin email:

```text
mdefankhan56@gmail.com
```

Use a strong password in Firebase Authentication. The app does not hardcode the password; the admin login uses Firebase Auth and then checks the verified email address.

Deploy the included rules:

```bash
firebase deploy --only firestore:rules,storage
```

## Firestore Collections

- `profiles/{uid}`: user profile, membership tier, restrictions
- `tools/{toolId}`: uploaded tools
- `categories/{categoryId}`: dynamic categories
- `packages/{packageId}`: membership packages
- `notifications/{notificationId}`: popup messages/ads
- `settings/ui`: editable website UI settings

The first admin visit can seed the default premium package from the Admin Packages tab.
