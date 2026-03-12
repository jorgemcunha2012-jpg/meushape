

## Plano: Vinculacao Lead-Perfil + Onboarding no App + Edicao de Dados no Perfil

### Contexto do problema

1. O `handle_new_user` trigger cria o perfil mas **nao vincula ao lead** pelo email
2. Se o usuario nunca fez o quiz, nao tem dados para a IA gerar treinos personalizados
3. O usuario nao consegue editar seus dados (objetivo, dias, local, etc.) depois de criados

### O que sera feito

**1. Migration: vincular lead ao perfil automaticamente no signup**
- Alterar a funcao `handle_new_user` para buscar o lead pelo email e setar `lead_id` + `profile_scores` no perfil
- Script SQL (via insert tool) para vincular perfis existentes que ja tem lead com mesmo email

**2. Adicionar coluna `onboarding_answers` na tabela `profiles`**
- JSONB para guardar as respostas de onboarding (objetivo, dias, local, foco, dores, biometria)
- Essas respostas sao usadas como input para a IA, independente de ter feito o quiz ou nao
- Se o usuario fez o quiz, as respostas do lead sao copiadas para `onboarding_answers` na vinculacao

**3. Popup de onboarding no app (quando nao tem dados)**
- Ao entrar no app, verificar se `profiles.onboarding_answers` esta vazio
- Se vazio, mostrar um dialog/drawer de onboarding com perguntas estrategicas:
  - Objetivo (emagrecer, definir, etc.)
  - Dias por semana
  - Local (academia/casa/ambos)
  - Areas de foco (multi-select)
  - Dores/restricoes
  - Dados biometricos (altura, peso, idade)
- Respostas salvas em `profiles.onboarding_answers`

**4. Edicao dos dados no Perfil**
- Adicionar secao "Meus Dados de Treino" na pagina AppProfile
- Cards editaveis com: objetivo, dias/semana, local, areas de foco, peso, altura, idade
- Ao salvar, atualiza `profiles.onboarding_answers`
- Permite ao usuario gerar novos treinos com dados diferentes

**5. AIWorkoutWizard usa `onboarding_answers` como fonte primaria**
- Em

<lov-plan>

## Plano: Vinculacao Lead-Perfil + Onboarding no App + Edicao de Dados no Perfil

### Contexto do problema

1. O `handle_new_user` trigger cria o perfil mas **nao vincula ao lead** pelo email
2. Se o usuario nunca fez o quiz, nao tem dados para a IA gerar treinos personalizados
3. O usuario nao consegue editar seus dados (objetivo, dias, local, etc.) depois de criados

### O que sera feito

**1. Migration: vincular lead ao perfil automaticamente no signup**
- Alterar a funcao `handle_new_user` para buscar o lead pelo email e setar `lead_id` + `profile_scores` no perfil
- Script SQL (via insert tool) para vincular perfis existentes que ja tem lead com mesmo email

**2. Adicionar coluna `onboarding_answers` na tabela `profiles`**
- JSONB para guardar as respostas de onboarding (objetivo, dias, local, foco, dores, biometria)
- Essas respostas sao usadas como input para a IA, independente de ter feito o quiz ou nao
- Se o usuario fez o quiz, as respostas do lead sao copiadas para `onboarding_answers` na vinculacao

**3. Popup de onboarding no app (quando nao tem dados)**
- Ao entrar no app, verificar se `profiles.onboarding_answers` esta vazio/null
- Se vazio, mostrar um drawer de onboarding com perguntas estrategicas:
  - Objetivo (emagrecer, definir, botar shape, comecar a treinar)
  - Dias por semana (2-5)
  - Local (academia/casa/ambos)
  - Areas de foco (multi-select: abdome, pernas/gluteos, bracos, costas, corpo inteiro)
  - Dores/restricoes (multi-select: nenhuma, costas, joelhos, ombros, cotovelos)
  - Dados biometricos (altura, peso atual, peso meta, idade)
- Respostas salvas em `profiles.onboarding_answers`
- Aparece como drawer fullscreen no primeiro acesso, nao bloqueia o app mas eh insistente

**4. Edicao dos dados no Perfil**
- Nova secao "Meus Dados de Treino" na pagina AppProfile (entre Estatisticas e Conquistas)
- Cards editaveis mostrando: objetivo, dias/semana, local, areas de foco, peso, altura, idade
- Tap em qualquer card abre drawer com o mesmo form de onboarding pre-preenchido
- Ao salvar, atualiza `profiles.onboarding_answers`

**5. AIWorkoutWizard simplificado**
- Em vez das 3 perguntas do wizard, agora ele le direto de `profiles.onboarding_answers`
- Se `onboarding_answers` existe, gera direto (1 clique: "Gerar meu treino com IA")
- Se nao existe, abre o onboarding primeiro, depois gera

### Fluxo completo

```text
Signup → handle_new_user busca lead por email
  ├─ Lead encontrado → copia quiz_answers para onboarding_answers
  │                     seta lead_id e profile_scores
  │                     → App: dados prontos, pode gerar treino direto
  └─ Lead nao encontrado → onboarding_answers = null
                           → App: popup de onboarding aparece
                           → Usuario responde → dados salvos
                           → Pode gerar treino com IA
```

### Arquivos afetados
- **Migration**: alterar `handle_new_user`, adicionar coluna `onboarding_answers`
- **Script SQL**: vincular perfis existentes
- **Novo componente**: `src/components/OnboardingDrawer.tsx` (perguntas de onboarding)
- **`src/pages/AppDashboard.tsx`**: verificar onboarding e mostrar drawer
- **`src/pages/AppProfile.tsx`**: adicionar secao "Meus Dados de Treino" editavel
- **`src/components/AIWorkoutWizard.tsx`**: simplificar para usar onboarding_answers direto
- **`supabase/functions/generate-workout/index.ts`**: aceitar onboarding_answers como input alternativo

