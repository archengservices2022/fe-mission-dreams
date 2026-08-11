# FE Mission Dreams Launch Checklist

## Required Environment

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

## Firebase

- Enable Email/Password and Google providers.
- Add the production domain to Firebase Authentication authorized domains.
- Deploy `firestore.rules`.
- Set admin custom claims only for trusted staff accounts.
- Keep subscription writes server-only through Firebase Admin or trusted server claims.

## Stripe

- Create the Pro product and recurring price.
- Set `STRIPE_PRO_PRICE_ID` to the recurring price ID.
- Create a webhook endpoint at `/api/stripe/webhook`.
- Subscribe the webhook to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`.
- Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.
- Configure the Billing Portal in Stripe before enabling the portal button in production.

## PWA And Mobile

- Verify `/manifest.webmanifest` loads.
- Verify `/icon.svg` and `/maskable-icon.svg` load.
- Verify the app can be installed from Chrome/Edge mobile.
- Verify offline reload shows the cached app shell without caching API responses.

## Release Validation

Run before deployment:

```bash
npm run lint
npm run typecheck
npm run build
```

After deployment:

- Open `/api/health` and confirm `{ "ok": true }`.
- Sign in with email/password.
- Sign in with Google.
- Complete onboarding.
- Run one Guided Practice question.
- Run one FE Mode mini-set.
- Generate each study packet.
- Start a Stripe Checkout session in test mode.
- Send a Stripe CLI test webhook to `/api/stripe/webhook`.
- Confirm Pro status updates in Firestore.
- Confirm non-admin users cannot submit admin question drafts.
