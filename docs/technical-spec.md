# FE Mission Dreams Technical Specification

## System Architecture

FE Mission Dreams is a Next.js TypeScript application with Firebase and Stripe behind server-side API boundaries.

- Web app: Next.js App Router, React, TypeScript, responsive CSS/Tailwind-ready component primitives.
- Authentication: Firebase Authentication with Google and email/password.
- Data: Firestore for student profiles, attempts, mastery, study plans, subscriptions, content review, and admin metadata.
- Assets: Firebase Storage for diagnostic uploads and generated PDF packets.
- Payments: Stripe Checkout, Customer Portal, and webhooks. Subscription state is written only by trusted server routes.
- AI tutor: server-side route that receives current topic, mode, mastery, attempts, and mistake history. Keys stay server-only.
- Content workflow: admin-authored and AI-generated questions remain draft/review until approved.

## Firestore Schema

Public content:

- `subjects/{subjectId}`: FE discipline, title, order, question weighting, active status.
- `topics/{topicId}`: subject, topic/subtopic metadata, importance, handbook keywords.
- `questions/{questionId}`: original FE-style prompt, type, randomized variable template, answer, tolerance, solution, formula, units, difficulty, status.

Student-owned data:

- `users/{uid}`: account summary and role.
- `profiles/{uid}`: discipline, exam date, available study hours, diagnostic scores.
- `subscriptions/{uid}`: Stripe customer/subscription identifiers, tier, status, period dates.
- `attempts/{attemptId}`: one graded response with mode, answer, correctness, time, and mistake category.
- `mastery/{uid}/topics/{topicId}`: mastery score, recent results, accuracy, average response time, mistake category counts.
- `studyPlans/{uid}/days/{date}`: recall, lesson, guided practice, FE mode, and error review activities.
- `dailySessions/{sessionId}`: started/completed session state and activity completion.
- `errorLogs/{uid}/items/{errorId}`: wrong answer record and repeated mistake counter.
- `mockExams/{uid}/exams/{examId}`: timed exam state, score, flagged questions, subject results.
- `flashcards/{uid}/cards/{cardId}`: personal formula/concept recall cards.

Admin data:

- `adminReviews/{reviewId}`: generated content, reviewer decision, notes, publish target.
- `usageStats/{statId}`: aggregate, non-sensitive usage metrics.

## Page Map

- `/`: authenticated student dashboard or sign-in.
- `/onboarding`: discipline, exam date, study hours, diagnostic entry/upload.
- `/subjects`: FE Mechanical subject map.
- `/subjects/[subjectId]`: topics and readiness for one subject.
- `/learn/[topicId]`: Learn Mode concept, formula, variables, units, handbook guidance, worked example.
- `/practice/[topicId]`: Guided Practice Mode with limited hints and immediate solution.
- `/fe-mode`: mixed FE-style practice with reference handbook access and explanations after completion.
- `/recall`: daily spaced-repetition recall.
- `/errors`: personal error notebook with topic and mistake filters.
- `/mock-exams`: quiz and simulation launcher/results.
- `/settings`: profile, exam date, subscription portal.
- `/admin`: content management, question import, AI review queue, usage summary.

## Component Map

- Auth: `AuthGuard`, `AuthForm`, `ProviderButton`, `PasswordField`.
- Dashboard: `DashboardMetrics`, `ReadinessTrafficLight`, `TodayPlan`, `SubjectReadinessGrid`, `WeakTopicList`.
- Curriculum: `SubjectRoadmap`, `TopicList`, `ModuleHome`, `ReferenceHandbookPanel`.
- Learning: `LearnLesson`, `FormulaBlock`, `WorkedExample`, `FlashcardDeck`.
- Practice: `QuestionCard`, `AnswerInput`, `HintPanel`, `StrictGraderResult`, `SolutionReview`.
- Planning: `DailyPlanCard`, `ActivityChecklist`, `RecallQueue`.
- Analytics: `MasteryRing`, `AccuracyTrend`, `MistakeCategoryChart`.
- Admin: `QuestionEditor`, `BulkImportPanel`, `ReviewQueue`, `ApprovalActions`.

## API Design

- `POST /api/tutor`: server-side AI tutoring response. Validates mode, subject, topic, recent attempts, and mistake context.
- `POST /api/questions/generate`: admin-only AI question generation into review state.
- `POST /api/questions/grade`: strict grading for numeric and selected-response answers.
- `POST /api/study-plan/generate`: creates or refreshes a personalized plan.
- `POST /api/stripe/checkout`: creates a Checkout session for Pro.
- `POST /api/stripe/portal`: creates a Customer Portal session.
- `POST /api/stripe/webhook`: verifies Stripe signature and writes subscription state.
- `POST /api/pdf/study-packet`: generates a weak-topic or daily recall packet.

All API routes use server-side validation with Zod before reading or writing Firestore.

## Mastery Algorithm

Mastery is topic-scoped and uses recent performance more heavily than older work.

1. Require at least five attempts before a topic can be marked ready.
2. Compute lifetime accuracy and recent accuracy over the most recent ten attempts.
3. Weight recent accuracy at 65%, lifetime accuracy at 25%, and response-time confidence at 10%.
4. Penalize repeated severe mistakes: concept misunderstanding, wrong formula, and unit conversion.
5. Update readiness:
   - Below 50: Weak
   - 50-69: Developing
   - 70-79: Nearly ready
   - 80+ with sufficient attempts and recent consistency: Ready

## Study-Plan Algorithm

The planner uses days remaining, available weekly hours, diagnostic scores, mastery, subject question weighting, and recency.

Priority score:

`priority = subjectWeight * weakness * urgency * staleReviewBoost`

Each day contains:

- Recall session from previous misses and stale formulas.
- One concept lesson for the highest-priority weak topic.
- Guided practice while support is useful.
- FE Mode practice once a topic shows early understanding.
- Error review for repeated mistake categories.

The plan is regenerated after graded sessions and never allocates equal time to every subject by default.

## Phased Implementation Plan

1. Foundation: Next.js/TypeScript project, Firebase structure, navigation, responsive UI.
2. Student accounts: Google/email login, saved profile, exam date, FE discipline.
3. Dashboard: exam countdown, today's plan, readiness percentage, weak/strong subjects, progress.
4. Question system: question database, multiple-choice/numeric answers, grading, solutions.
5. Learning modes: Learn, Guided Practice, and FE Mode.
6. Adaptive engine: accuracy, weak topics, mistakes, response time, mastery.
7. Study planner: daily plans based on exam date and weaknesses.
8. Recall system: tomorrow-morning recall, spaced repetition, forgotten formulas.
9. Error Notebook: formula errors, units, arithmetic, concept errors, and repeated mistakes.
10. Mock exams: 10/20/50-question tests and full simulation path.
11. AI Tutor: concise tutoring with mode-aware support.
12. PDFs/Flashcards: formula sheets, recall PDFs, study packets, flashcards.
13. Payments/Admin: Stripe Free/Pro, admin question editor, content approval.
14. Launch: PWA/mobile polish, security, testing, deployment.

At the end of every phase: run lint, TypeScript checks, tests, and production build.
