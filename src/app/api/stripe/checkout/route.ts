import { NextResponse } from "next/server";
import { adminDb, verifyBearerToken } from "@/lib/server/firebase-admin";
import { getAppUrl, getStripe } from "@/lib/server/stripe";

export async function POST(request: Request) {
  try {
    const decoded = await verifyBearerToken(request);
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) return NextResponse.json({ error: "STRIPE_PRO_PRICE_ID is not configured." }, { status: 500 });

    const appUrl = getAppUrl();
    const existing = await adminDb().doc(`subscriptions/${decoded.uid}`).get();
    const stripeCustomerId = existing.data()?.stripeCustomerId as string | undefined;
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      customer_email: stripeCustomerId ? undefined : decoded.email,
      client_reference_id: decoded.uid,
      success_url: `${appUrl}/?billing=success`,
      cancel_url: `${appUrl}/?billing=cancelled`,
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { uid: decoded.uid },
      subscription_data: {
        metadata: { uid: decoded.uid },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout could not be created.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
