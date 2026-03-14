

## Current Flow
Quiz → Loading → **Email/Signup** → Body Analysis → Result (has password + checkout)

## Desired Flow
Quiz → Loading → Body Analysis (optional) → Result → **Signup (at CTA/checkout)** → App

## Plan

### 1. Update QuizLoading navigation
Change the CTA button from navigating to `/quiz/email` to `/quiz/analise-corporal`, passing only `{ answers }`.

### 2. Update QuizBodyAnalysis
- Remove dependency on `email` for the analysis (currently requires email to call edge function and cache). Instead, store the analysis result in component state/sessionStorage temporarily.
- Navigate to `/quiz/resultado` with `{ answers, bodyAnalysis }` (no name/email needed yet).
- Remove the "already analyzed" check based on email in localStorage.

### 3. Update QuizResult
- Remove the requirement for `email` in the redirect guard (currently redirects if `!email && !answers`; change to just `!answers`).
- The existing password input + checkout CTA section at the bottom already does signup. Expand it to also collect **name** and **email** fields (not just password).
- On checkout: insert lead, sign up user, then proceed to Stripe checkout.
- Remove `name`/`email` from `location.state` expectations since they won't exist yet.

### 4. Update QuizEmail page
- Keep the route/component for now but it becomes unused in the main flow. Can optionally remove the route or repurpose it later.

### 5. Update analyze-body edge function call
- In QuizBodyAnalysis, the edge function currently requires `email`. Need to check if it's truly required or can be made optional (pass a placeholder or skip the email field).

### Technical Details

**QuizLoading.tsx** (line 194): Change navigate target from `/quiz/email` to `/quiz/analise-corporal`.

**QuizBodyAnalysis.tsx**: Remove `email` from location.state destructuring. Use sessionStorage for caching instead of email-keyed localStorage. Pass analysis to result page without email.

**QuizResult.tsx**: Add name + email inputs alongside the existing password field in the CTA section (lines 354-395). Move the lead insert + signUp logic here. Update the redirect guard on line 40.

