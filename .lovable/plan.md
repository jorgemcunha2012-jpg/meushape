

# Quiz Funnel Overhaul — Implementation Plan

This is a large restructuring of the entire quiz funnel based on the uploaded prompt document. The work spans 7 major changes across landing, quiz, loading, body analysis removal, results, checkout, and confirmation pages.

---

## Summary of Changes

1. **Landing page** — Update copy, CTA, and social proof
2. **Quiz** — Reduce from 26 to 14 questions + name, reorder, add/update intermediate screens, update progress bar
3. **Loading** — Change "12.000+" to "5.000+"
4. **Remove body analysis** — Skip `/quiz/analise-corporal`, go directly to results
5. **Results page** — Remove signup form, replace with simple CTA to new checkout page; update urgency modal copy; update social proof numbers
6. **New checkout page** — 3 pricing tiers (monthly/quarterly/annual), PIX + card options, signup form, trust signals
7. **Confirmation page** — Update `/quiz/success` copy

---

## Technical Details

### 1. Landing (`src/pages/Index.tsx`)
- Replace headline, subheadline, CTA text, badge, and footer text per spec
- Badge: "Quiz gratuito • 2 min" (already close, just remove "3 min" → "2 min")
- CTA: "Descobrir meu treino →"
- Footer: "Mais de 5.000 mulheres já fizeram o teste" + "Apenas 2 min" badge

### 2. Quiz (`src/lib/quizData.ts` + `src/pages/Quiz.tsx`)

**quizData.ts — New 17-screen array (14 questions + 2 intermediates + name):**
- P1: Objetivo (4 options, same as current t01)
- Intermediate after P1: "Mais de 5.000 mulheres já descobriram o treino certo pro seu corpo"
- P2: Corpo hoje (4 options, same as t02)
- P3: Como quer ficar (3 options, same as t03)
- P4: Já treina? — **Reduce to 3 options** (remove "Treino de vez em quando" and "Treino sério há bastante tempo")
- P5: O que fez desistir (multi-select, 5 options — reworked from t16, remove "Tinha vergonha", rename last to "Nunca comecei de verdade")
- Intermediate after P5: "O problema nunca foi falta de vontade" (updated copy)
- P6: Onde treinar (same as t11)
- P7: Dias por semana (same as t09)
- P8: Tempo por dia (same as t10)
- P9: Partes do corpo (multi-select, same as t13)
- P10: Dor/desconforto — **Remove "Cotovelos / punhos"** (4 options only)
- P11: Altura (numeric, same as t21)
- P12: Peso atual (numeric, same as t22)
- P13: Peso meta (numeric, **change default from 65 to 60**)
- P14: Acredita que consegue (same as t26, 3 options)
- P15: Nome (text field — already handled in Quiz.tsx)

**Remove these screens entirely:** t05, t06, t07, t08, product1 intermediate, t12, t15, t17, t18, t19, t20, t24, t25

**Quiz.tsx:** Update progress to reflect 15 steps (14 questions + name). The intermediate screens count as part of the flow but not in the "question count".

Update `MAX_SCORES` and `calculateAxisScores` to match the reduced question set.

### 3. Loading (`src/pages/QuizLoading.tsx`)
- Change "12.000+ mulheres transformadas" → "5.000+ mulheres já fizeram o teste"
- Change CTA to navigate directly to `/quiz/resultado` (skip body analysis)

### 4. Remove Body Analysis
- Change QuizLoading CTA: navigate to `/quiz/resultado` instead of `/quiz/analise-corporal`
- Keep the route/page file but it becomes unreachable (or remove it)

### 5. Results Page (`src/pages/QuizResult.tsx`)
- **Remove** the signup form (name, email, password fields and checkout logic)
- **Replace** with simple CTA block: "Seu plano personalizado tá pronto." + button "Escolher meu plano →" that navigates to `/checkout` passing `{ answers, name }` as state
- **Update** social proof: "5.000+" instead of "5.200+", remove "87% viram resultados em 30 dias"
- **Update** UrgencyModal copy via props or component edit

### 6. UrgencyModal (`src/components/quiz-result/UrgencyModal.tsx`)
- Update title: "{firstName}, seu plano tá pronto"
- Update body: Remove statistics, simplify to spec copy
- Update CTA: "Escolher meu plano →"
- Update footer: "Garantia de 30 dias • Cancele quando quiser"

### 7. New Checkout Page (`src/pages/QuizCheckout.tsx` — rewrite existing)
- **URL:** `/checkout` (add new route, keep old `/quiz/checkout` redirecting or replace)
- Header: "Escolha seu plano, {Name}"
- 3 pricing cards (monthly R$19.90, quarterly R$49.90, annual R$99.90)
- Payment method selection: PIX and Card tabs
- Signup form: name (pre-filled), email, password
- Trust signals and social proof footer

**Stripe:** Need to create 2 new prices:
- Quarterly: R$49.90/3 months on product `prod_U6z1CITogpkEvB`
- Annual: R$99.90/year on product `prod_U6z1CITogpkEvB`
- Monthly already exists: `price_1T8l31LKftklAHDE4PyBMu0K`

**Edge function `create-checkout`:** Update to accept a `price_id` parameter from the frontend so it can handle different plan selections.

**PIX support:** This requires Stripe to have PIX enabled on the account. Will add `payment_method_types: ["card", "boleto"]` or use Stripe's built-in PIX support via checkout session. Need to verify Stripe account capabilities.

### 8. Confirmation Page (`src/pages/QuizSuccess.tsx`)
- Update title: "Parabéns, {Name}! Seu acesso foi ativado 🎉"
- Update subtitle and CTA per spec
- Need to pass name via state or retrieve from auth session

### 9. Routing (`src/App.tsx`)
- Add `/checkout` route pointing to new QuizCheckout
- Keep or redirect `/quiz/checkout`

---

## Implementation Order

1. Create Stripe prices (quarterly + annual)
2. Update `quizData.ts` (restructure questions)
3. Update `Quiz.tsx` (progress bar for new count)
4. Update `Index.tsx` (landing copy)
5. Update `QuizLoading.tsx` (social proof + skip body analysis)
6. Update `QuizResult.tsx` (remove form, add CTA to checkout)
7. Update `UrgencyModal.tsx` (new copy)
8. Rewrite `QuizCheckout.tsx` (3 plans, payment methods, signup)
9. Update `create-checkout` edge function (accept price_id)
10. Update `QuizSuccess.tsx` (new copy)
11. Update `App.tsx` (routing)

---

## Questions Before Implementation

I need to clarify a few points before proceeding:

- **PIX integration**: Stripe PIX requires specific account configuration. The current Stripe account may not have PIX enabled. Should I implement PIX as a visual option that redirects to Stripe Checkout (which handles PIX natively if enabled), or build a custom PIX flow?
- **"Sem renovação automática"** is mentioned in trust signals, but the plans are subscriptions with auto-renewal. This contradicts the checkout mode. Should I keep `mode: "subscription"` or switch to `mode: "payment"`?

