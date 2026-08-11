import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  const firebaseClientConfigured = Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  );
  const firebaseAdminConfigured = Boolean(
    (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY,
  );
  const stripeConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY &&
    process.env.STRIPE_PRO_PRICE_ID &&
    process.env.STRIPE_WEBHOOK_SECRET,
  );

  return NextResponse.json({
    ok: true,
    service: "fe-mission-dreams",
    checkedAt: new Date().toISOString(),
    config: {
      appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
      firebaseClient: firebaseClientConfigured,
      firebaseAdmin: firebaseAdminConfigured,
      stripe: stripeConfigured,
      aiTutor: Boolean(process.env.OPENAI_API_KEY),
      previewMode: process.env.NEXT_PUBLIC_PREVIEW_SKIP_AUTH === "true",
    },
  });
}
