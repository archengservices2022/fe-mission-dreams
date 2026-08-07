# FE Mission Dreams

Mobile-first FE exam preparation platform. The first reference module is **MATH-06 — Triangle Trigonometry** for FE Mechanical.

## Local setup

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the Firebase Web App values from Firebase Project Settings.
4. Run `npm run dev`.
5. Open the local URL shown by Next.js.

## Firebase setup

Enable these Authentication providers:

- Email/Password
- Google

Create Cloud Firestore and deploy the included `firestore.rules`. The rules restrict each student's `/users/{uid}/...` data to that authenticated user.

For deployed environments, add the deployment domain to **Firebase Authentication → Settings → Authorized domains**.

## CI

The GitHub Actions workflow runs a Next.js production build. Add the `NEXT_PUBLIC_FIREBASE_*` values from `.env.example` as GitHub Actions repository secrets so CI and preview builds have the same Firebase configuration.

## Current MATH-06 prototype

- Mobile-first student interface
- Email/password and Google sign-in
- Learn lessons and flashcards
- FE-style practice questions
- Incorrect-answer diagnosis and repair guidance
- Firestore-backed progress/mastery that restores after sign-in

Content remains a reference-module prototype until the complete MATH-06 question bank passes the FE Mission Verified review process.
