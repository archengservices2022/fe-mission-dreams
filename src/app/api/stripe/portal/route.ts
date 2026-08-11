import { NextResponse } from "next/server";
import { adminDb, verifyBearerToken } from "@/lib/server/firebase-admin";
import { getAppUrl, getStripe } from "@/lib/server/stripe";

export async function POST(request: Request) {
  try {
    const decoded = await verifyBearerToken(request);
    const subscription = await adminDb().doc(`subscriptions/${decoded.uid}`).get();
    const stripeCustomerId = subscription.data()?.stripeCustomerId as string | undefined;

    if (!stripeCustomerId) {
      return NextResponse.json({ error: "No Stripe customer is linked to this account yet." }, { status: 400 });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getAppUrl()}/?billing=portal`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Billing portal could not be opened.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
