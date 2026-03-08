

# Plano: Analise Corporal por Foto no Funil (com controle anti-abuso)

## Estrategia anti-abuso

Controle em 3 camadas:
1. **Database**: Tabela `body_analyses` com constraint `UNIQUE(email)` — apenas 1 analise por email
2. **Edge Function**: Antes de chamar a IA, verifica se ja existe analise para aquele email. Se sim, retorna o resultado salvo
3. **Frontend**: Apos upload, desabilita botao e mostra resultado cacheado. Usa `localStorage` como fallback visual

## Fluxo no funil

```text
Quiz → Loading → Email/Nome → [NOVO] Upload Foto → Loading Analise → Resultado (com diagnostico corporal)
```

A etapa de foto fica entre o email e o resultado. O lead ja forneceu email, entao podemos vincular.

## 1. Database Migration

Nova tabela `body_analyses`:
- `id` uuid PK
- `email` text UNIQUE NOT NULL (1 analise por email)
- `lead_id` uuid nullable (FK leads)
- `image_path` text (caminho no storage)
- `analysis_result` jsonb (resultado da IA: body_type, estimated_bf, recommendations)
- `model_used` text
- `created_at` timestamptz

Storage bucket `body-photos` (privado) com RLS para insert apenas.

## 2. Edge Function: `analyze-body`

- Recebe: `email`, `image_base64` (ou URL do storage)
- **Primeiro**: consulta `body_analyses` pelo email. Se existe, retorna resultado salvo (sem chamar IA)
- **Se nao existe**: envia imagem para Lovable AI (google/gemini-2.5-pro) com prompt estruturado usando tool calling para retornar JSON tipado (body_type, estimated_bf_range, posture_notes, recommendations)
- Salva resultado na tabela e retorna
- Rate limit adicional: rejeita se `created_at` do registro existente < 24h (caso queira permitir re-analise futura)

## 3. Nova pagina: `QuizBodyAnalysis.tsx`

- Upload de foto (frente ou lateral) com preview
- Botao "Analisar meu corpo" — desabilitado apos envio
- Loading com mensagens progressivas enquanto IA processa
- Se email ja tem analise, mostra resultado direto sem upload
- Navega para `/quiz/resultado` com dados da analise no state

## 4. Pagina QuizResult atualizada

- Nova secao acima do diagnostico de quiz: "Sua Analise Corporal"
- Mostra: tipo corporal estimado, faixa de % gordura, observacoes posturais
- Integra com o diagnostico existente do quiz

## 5. Rota e navegacao

- Nova rota: `/quiz/analise-corporal`
- `QuizEmail` → navega para `/quiz/analise-corporal` em vez de `/quiz/resultado`
- `QuizBodyAnalysis` → navega para `/quiz/resultado`
- Botao "Pular" disponivel para quem nao quer enviar foto

## Arquivos

| Acao | Arquivo |
|------|---------|
| Migration | Criar tabela `body_analyses` + bucket `body-photos` |
| Criar | `supabase/functions/analyze-body/index.ts` |
| Criar | `src/pages/QuizBodyAnalysis.tsx` |
| Editar | `src/pages/QuizEmail.tsx` (redirecionar para analise corporal) |
| Editar | `src/pages/QuizResult.tsx` (exibir resultado da analise) |
| Editar | `src/App.tsx` (nova rota) |
| Editar | `supabase/config.toml` (nova funcao) |

