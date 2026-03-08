

# Plano: Fases 6 (Comunidade & Gamificacao) + 7 (Monetizacao Stripe)

## Fase 6: Comunidade & Gamificacao

### 6.1 Database: tabelas de streaks e badges
- Criar tabela `user_streaks` (user_id, current_streak, longest_streak, last_workout_date)
- Criar tabela `user_badges` (user_id, badge_type, earned_at)
- RLS: usuarios leem/inserem apenas seus proprios dados

### 6.2 Auto-post no feed apos treino
- No `AppWorkout.tsx`, na fase "complete", inserir automaticamente um post na tabela `community_posts` com resumo do treino (duracao, exercicios, series)
- Botao "Compartilhar" ja existe, mas vira opt-out em vez de opt-in

### 6.3 Sistema de streaks
- Apos cada treino concluido, atualizar `user_streaks`: se last_workout_date = ontem, incrementar streak; se = hoje, ignorar; senao, resetar pra 1
- Exibir streak no header do `AppDashboard` (icone de fogo + numero)

### 6.4 Badges
- Badges automaticos: "Primeiro Treino", "7 dias seguidos", "30 treinos", "Compartilhou na comunidade"
- Calcular e inserir badge na conclusao do treino
- Exibir badges no perfil/dashboard como icones

---

## Fase 7: Monetizacao Stripe

### 7.1 Criar produto no Stripe
- Produto: "Personal no Bolso" - R$19,90/mes (1990 centavos BRL)
- Preco recorrente mensal
- Usar ferramenta `create_stripe_product_and_price`

### 7.2 Edge Function: `create-checkout`
- Recebe usuario autenticado, cria Stripe Checkout Session com `mode: "subscription"` e `subscription_data.trial_period_days: 7`
- Success URL: `/app` | Cancel URL: `/quiz/resultado`

### 7.3 Edge Function: `check-subscription`
- Verifica se usuario tem assinatura ativa no Stripe
- Retorna `{ subscribed, subscription_end }`

### 7.4 Edge Function: `customer-portal`
- Cria sessao do Customer Portal do Stripe para gerenciar assinatura

### 7.5 Frontend: useAuth + subscription state
- Adicionar `subscribed` e `subscriptionEnd` ao AuthContext
- Chamar `check-subscription` no login e periodicamente
- Guardar estado global de assinatura

### 7.6 Paywall no App
- `AppDashboard`, `AppWorkout`, `AppCommunity`: se `!subscribed`, redirecionar para tela de paywall
- Tela de paywall simples com CTA para checkout

### 7.7 Checkout no Quiz Result
- Na pagina `QuizResult`, o botao "Comecar meus 7 dias gratis" cria conta (signup) + redireciona para Stripe Checkout
- Fluxo: signup com email/senha do quiz → redirect para checkout → sucesso → `/app`

### 7.8 Config
- Adicionar funcoes ao `supabase/config.toml` com `verify_jwt = false`

---

## Resumo de arquivos

| Acao | Arquivo |
|------|---------|
| Criar | `supabase/functions/create-checkout/index.ts` |
| Criar | `supabase/functions/check-subscription/index.ts` |
| Criar | `supabase/functions/customer-portal/index.ts` |
| Editar | `supabase/config.toml` (adicionar 3 funcoes) |
| Editar | `src/hooks/useAuth.tsx` (adicionar subscription state) |
| Editar | `src/pages/QuizResult.tsx` (signup + checkout) |
| Editar | `src/pages/AppDashboard.tsx` (paywall + streaks + badges) |
| Editar | `src/pages/AppWorkout.tsx` (auto-post + streaks + badges) |
| Editar | `src/pages/AppCommunity.tsx` (paywall guard) |
| Migration | Criar tabelas `user_streaks`, `user_badges` |
| Stripe | Criar produto + preco via ferramenta |

