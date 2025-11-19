# Copilot / AI agent instructions for CompareFunding.io

Purpose: Give AI coding agents quick, practical guidance for making meaningful code edits, tests, and feature additions in this repo. Focus on the unique patterns used here (Firebase wrappers, Mailgun, OpenAI, roles, and file upload flows).

Summary - Big picture
- Single-page React app built with Vite + TypeScript + React 18. Uses Firebase for Auth/Firestore/Storage and Mailgun + OpenAI for integrations.
- Frontend: `src/` (pages, components, contexts, services). Most app logic lives in `src/pages` and shared helpers in `src/services`.
- Serverless: `functions/` contains backend helpers (Firebase Cloud Functions templates). The primary backend APIs are Firestore + Firebase Authentication.

Getting started / Common tasks
- Install and run locally: `npm install` then `npm run dev` (Vite dev server; port 8080 by default).
- Build & preview: `npm run build` and `npm run preview`.
- Generating sitemap: `npm run generate-sitemap` (used in build script).
- Mailgun test script: `npm run test-mailgun` for CLI validation; also `MailgunTest` page at `/mailgun-test` for UI checks.
- Deploy (Firebase): `npm run deploy:full` (production) or `npm run deploy:coming-soon`.

Environment & secrets
- Environment variables live in `.env`, `.env.development` or `.env.coming-soon`. Required variables include:
  - `VITE_FIREBASE_*` (all standard Firebase keys)
  - `VITE_OPEN_AI_API_KEY` (OpenAI key, used in-browser in several places)
  - `VITE_MAILGUN_API_KEY` (Mailgun key; repo uses a sandbox domain by default)
  - `VITE_CREDITSAFE_USERNAME` / `VITE_CREDITSAFE_PASSWORD` (optional external data source)
- Always avoid committing secret keys. Examples in `.env` are local test values and must be replaced with dev/prod keys.

Key patterns & conventions (do not change these lightly)
- Firebase helper wrappers: `src/firebase.ts` exports functions like `getDocument`, `getDocuments`, `createDocument`, `updateDocument`, `deleteDocument`. These helper functions return `{ data, error }` objects to standardize error handling across the UI.
  - Typical usage: `const { data, error } = await getDocuments('applications', [{field: 'user_id', operator: '==', value: currentUser.uid}], [{field: 'created_at', direction: 'desc'}], 10);`
  - For single doc writes with an ID: `createDocument('businesses', businessData, uid)`.
  - `getDocuments` accepts arrays of `{ field, operator, value }` and `sortOptions` arrays of `{ field, direction }`.
  - If Firestore throws a composite index error, `handleIndexError` prints a link to the Firebase Console. Prefer adding the recommended index.
- Timestamps: Use `serverTimestamp()` for top-level timestamps. Inside arrays (e.g., `interested_lenders`) use JavaScript `new Date()` because Firestore doesn’t support serverTimestamp in nested array elements.
- Auth & roles: `src/contexts/AuthContext.tsx` is the centralized auth wrapper. The app ensures a `users` Firestore doc in `users/{uid}` and assigns `role` fields (business/lender/business_owner). Use `useAuth()` to access `user`, `isLoading`, `signUp` etc.
- Routing: Protected routes use `components/PrivateRoute.tsx` and `Routes` are declared in `src/App.tsx`.

Integration specifics
- Mailgun: `src/services/mailgunService.ts` abstracts all email sending and templates. It uses a sandbox domain by default; sandbox domains impose restrictions (authorized recipients). Use `MailgunTest` page or `scripts/test-mailgun.js` to validate deliveries.
- OpenAI: We use the OpenAI JS client in the browser in places like `src/services/openai/profitAndLoss.ts` and `src/pages/SignUpJourney/BusinessDetailsForm.tsx`. Keys are read via `import.meta.env.VITE_OPEN_AI_API_KEY`. Note the repo uses `dangerouslyAllowBrowser: true` for some clients to enable UI-side calls; be careful with key leakage.
  - The OpenAI profit-and-loss extractor expects highly structured JSON output; examples and validation are in `src/services/openai/profitAndLoss.ts`.
  - If you're modifying prompts or parsing logic, respect the `convertStringNumbersToNumbers` and `validateExtractedData` helpers.
- PDF & Document uploads: `src/services/documentService.ts` handles uploads to Firebase Storage and stores `shared_documents` in Firestore. File validation enforces allowed types and max size (20MB). PDF extraction and generation are in `src/services/openai/profitAndLoss.ts` and `src/services/pdf/*`.
- CreditSafe: `functions/src/creditsafe.ts` and `src/components/CreditScore/*` demonstrate the third-party credit lookup flow. These require `VITE_CREDITSAFE_USERNAME` and `VITE_CREDITSAFE_PASSWORD`.
- Stripe: `src/firebase.ts` contains helpers to manage Stripe-based payment intent documents (namespaced under Firestore). No server-side Stripe secret is included in this repo; avoid adding it in the client.

Conventions for changes & writing code
- Use the helper wrappers in `src/firebase.ts` for Firestore operations unless you have a valid reason for direct `getDocs`/`updateDoc` calls. The wrappers normalize behavior across components.
- When reading or writing user data, update the `users` collection (or `lender_profiles`/`businesses`) consistently. Role resolution is covered in `AuthContext` and may be updated from multiple places (SignUp, SSO onboarding).
- When updating API keys or endpoint domains for Mailgun/CreditSafe/Stripe, update both `src/services/*` and the `.env` files used for local testing.
- Avoid directly mutating objects returned from `getDocuments()` or `getDocument()`; those results are plain JS objects. Use `updateDocument` to write changes.

Debugging & testing tips
- To test Mailgun emails in local/dev, use the `/mailgun-test` page after adding test keys to `.env`.
- For email templates, modify `src/services/emailTemplates.ts`. Unit test by calling the template function directly and checking the `html` and `text` fields.
- Composite Firestore index errors contain a link to create the index. Use the `handleIndexError` helper in `src/firebase.ts` to find the link.
- OpenAI: When debugging extractions, the service logs the raw response; printed logs in `profitAndLoss.ts` will show the received structure and any cleaning attempts. Use `validateExtractedData` to check why a response failed.
- If adding routes, ensure they are wrapped in `PrivateRoute` when they are user-only pages and appear in the correct side (Business vs Lender) in `src/App.tsx`.

Small examples
- Read applications for a user:
```ts
const { data: apps } = await getDocuments('applications', [{ field: 'user_id', operator: '==', value: currentUser.uid }]);
```
- Create a businesses profile with a specific document id:
```ts
const { data: profile } = await createDocument('businesses', profileData, user.uid);
```
- Use OpenAI to parse a PDF in `DocumentUpload` (example): this calls `analyzeFinancialDocument(file)` in `src/services/openai/profitAndLoss.ts`.

Files to inspect for examples and more context
- `src/firebase.ts` - Primary Firestore helper utilities and conventions.
- `src/services/mailgunService.ts` - All Mailgun integrations & templates.
- `src/services/openai/profitAndLoss.ts` - PDF and financial extraction + OpenAI prompt & parsing logic.
- `src/services/documentService.ts` - Storage & shared documents patterns.
- `src/contexts/AuthContext.tsx` - Auth and role resolution patterns.
- `src/App.tsx` - Routing + protected routes list.
- `src/pages/MailgunTest.tsx` & `src/services/emailDebugger.ts` - Useful for debugging email and Mailgun tests.

If you need to change behavior:
- Do not leak production secrets into client code. Key changes that would normally be server-side (Stripe secret, OpenAI or Mailgun secret) need careful design and review.
- Always add or update Firestore indexes if composite queries fail during local testing.
- Keep UI-safe logging for debugging but avoid printing secret values or API keys.

Questions / Clarifications
- If a requested change includes backend secret usage, ask: should this be moved to server functions or limited to an internal, verified usage? Example: OpenAI model calls are allowed client-side in the current model, but adding new server side usage should follow the functions folder pattern.

Thanks! Please tell me which part should be expanded (OpenAI prompts, Mailgun tests, Firestore index rules, deployment steps) and I’ll refine further.