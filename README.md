# FE Mission Dreams

FE Mission Dreams is a production-oriented web app for students preparing for the NCEES FE Mechanical exam. The current codebase implements Phases 1-14: foundation, student accounts, dashboard, question system, learning modes, adaptive engine, study planner, recall system, error notebook, mock exams, AI tutor, PDFs/flashcards, payments/admin, and launch polish.

FE Mission Dreams is an independent exam-prep product and is not affiliated with, endorsed by, or sponsored by NCEES. FE® and NCEES® are trademarks of the National Council of Examiners for Engineering and Surveying.

See [docs/technical-spec.md](docs/technical-spec.md) for the system architecture, Firestore schema, page map, component map, API design, mastery algorithm, study-plan algorithm, and phased implementation plan.
See [docs/launch-checklist.md](docs/launch-checklist.md) for production environment, Firebase, Stripe, PWA, and release validation steps.
See [docs/question-bank-production-plan.md](docs/question-bank-production-plan.md) for the 150-250 question-per-discipline content standard.

## Current Phase

Phase 14: Launch.

Implemented:

- Next.js with TypeScript and React
- Firebase Authentication with email/password and Google
- Student profile onboarding with FE discipline, exam date, study hours, and diagnostic scores
- Firestore progress persistence for signed-in students
- FE Mechanical subject roadmap across all 14 exam areas
- Dashboard metrics for days until exam, readiness, accuracy, weak/strong areas, study streak, and next activity
- Today's plan generated from exam date, available study time, diagnostic scores, subject weighting, progress, and weak skills
- Saved daily checklist state in Firestore
- Multiple-choice and numeric-entry question support
- Strict grading with numeric tolerances
- Question metadata for formula, units, solving time, common mistakes, and handbook keywords
- Phase 4 seed questions for vector components, Law of Cosines, axial stress, and thermal efficiency
- Learn Mode with lessons, formulas, reference review, and flashcards
- Guided Practice with optional hints, strict grading, immediate explanations, and repair guidance
- FE Mode mini-sets with no hints/formulas/topic labels during the set, optional handbook access, and explanations only after completion
- Adaptive mastery score using recent accuracy, lifetime accuracy, response time, mistake severity, and minimum-attempt evidence
- Response-time tracking and average seconds per question
- Automatic mistake-category tracking for wrong answers
- Firestore writes to `mastery/{uid}/topics/{moduleId}`
- Saved daily study plan snapshots at `studyPlans/{uid}/days/{date}`
- Planner regeneration when exam date, study hours, diagnostics, progress, or weak skills change
- Activity priority scores and rationale shown on the dashboard
- Daily recall queue from missed skills, formulas, and stale low-evidence topics
- Self-graded recall cards with reveal, remembered, and missed states
- Recall sessions saved to `dailySessions/{uid}_{date}_recall`
- Automatic error notebook entries for wrong Guided Practice and FE Mode answers
- Error filters by skill and mistake category
- Repeated mistake counts, submitted answer, correct answer, explanation, and repair action
- Firestore persistence at `errorLogs/{uid}/items/{errorId}`
- Timed 10, 20, and 50-question mock exam modes
- Flag-for-review, question navigator, strict grading, and post-exam explanations
- Mock exam weak-topic and mistake-category summary
- Mock exam results saved to `mockExams/{uid}/exams/{examId}`
- Server-side `/api/tutor` endpoint that keeps AI keys off the client
- Tutor context includes mode, subject, topic, mastery, exam date, weak skills, and mistake categories
- FE Mode-aware tutor behavior that avoids formulas/hints unless explicitly requested
- Built-in fallback tutor response when `OPENAI_API_KEY` is not configured
- Flashcard self-grading with Again/Got it confidence tracking
- Flashcard confidence persistence at `flashcards/{uid}/cards/{cardId}`
- Print-ready formula-sheet packets
- Print-ready daily recall packets from the active recall queue
- Print-ready weak-topic repair packets with practice prompts, answers, worked solutions, and repair notes
- Stripe Checkout route for Pro subscription upgrades
- Stripe Billing Portal route for subscription management
- Stripe webhook route for trusted subscription status updates
- Firebase Admin token verification for server-side billing and admin routes
- Dashboard Free/Pro status card with upgrade/manage billing actions
- Admin-only question draft form backed by `adminReviews`
- PWA manifest, install icons, and production service worker
- Mobile metadata and install-friendly app configuration
- Security headers in `next.config.ts`
- `/api/health` deployment health check
- Robots and sitemap metadata routes
- CI workflow for lint, typecheck, and production build
- Production launch checklist
- Traffic-light readiness labels with a minimum-attempt guard
- Firestore security rules for public content, student-owned records, subscriptions, and admin review data
- `.env.example` without hardcoded secrets

Planned next:

- Production deployment
- Full content expansion across all FE Mechanical subjects
- Automated grading, planner, and route tests

## Local Setup

1. Install Node.js 20 or later.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Fill in Firebase Web App values from Firebase Project Settings.
5. Add Firebase Admin service account values for server routes: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
6. Add Stripe values for billing: `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_APP_URL`.
7. For UI preview without Firebase, set `NEXT_PUBLIC_PREVIEW_SKIP_AUTH=true`.
8. Run `npm run dev`.
9. Open the local URL shown by Next.js.

## Firebase Setup

Enable these Firebase Authentication providers:

- Email/Password
- Google

Create Cloud Firestore and deploy `firestore.rules`.

Student-owned data is restricted by `uid`. Admin-only content and review workflows require a custom auth claim:

```json
{ "admin": true }
```

Trusted server writes, such as Stripe webhooks, should use a backend-controlled custom auth claim or Admin SDK path. Client code must never write subscription state directly.

## Validation

Run before merging each phase:

```bash
npm run lint
npm run typecheck
npm run build
```

Tests should be added as Phase 2 and Phase 3 introduce grading, mastery scoring, randomized question generation, and planner behavior.
