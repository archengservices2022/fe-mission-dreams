import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { adminDb } from "@/lib/server/firebase-admin";
import { getStripe } from "@/lib/server/stripe";

export const runtime = "nodejs";

async function uidForSubscription(subscription: Stripe.Subscription) {
  if (subscription.metadata.uid) return subscription.metadata.uid;

  const existing = await adminDb()
    .collection("subscriptions")
    .where("stripeSubscriptionId", "==", subscription.id)
    .limit(1)
    .get();

  return existing.docs[0]?.id;
}

async function writeSubscription(uid: string, data: {
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  status?: string | null;
  currentPeriodEnd?: number | null;
}) {
  await adminDb().doc(`subscriptions/${uid}`).set({
    uid,
    tier: data.status === "active" || data.status === "trialing" ? "pro" : "free",
    status: data.status || "incomplete",
    stripeCustomerId: data.stripeCustomerId || null,
    stripeSubscriptionId: data.stripeSubscriptionId || null,
    currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd * 1000).toISOString() : null,
    updatedAt: new Date().toISOString(),
  }, { merge: true });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!secret || !signature) {
    return NextResponse.json({ error: "Stripe webhook secret or signature is missing." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const uid = session.client_reference_id || session.metadata?.uid;

    if (uid) {
      await writeSubscription(uid, {
        stripeCustomerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
        stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
        status: "active",
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionWithPeriod = subscription as Stripe.Subscription & { current_period_end?: number };
    const uid = await uidForSubscription(subscription);

    if (uid) {
      await writeSubscription(uid, {
        stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscriptionWithPeriod.current_period_end,
      });
    }
  }

  return NextResponse.json({ received: true });
}
