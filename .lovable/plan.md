

## Plano: Integrar MuscleWiki como fonte de mídia (vídeo/imagem) em todo o app

### Problema atual
Exercícios exibidos no app (treinos gerados pela IA, aquecimento, treino em casa, alongamento, tela de execução) dependem de `curated_exercises.gif_url` ou `exercises.image_url` — a maioria está nula ou quebrada. O MuscleWiki tem 7.300+ vídeos mas só é usado na página de exploração.

### O que muda

Todos os locais que exibem exercícios passarão a buscar vídeo/imagem do MuscleWiki via `searchExercisesMW()`, usando o nome do exercício como chave de busca. Um fallback graceful (número do exercício ou emoji animado) será mantido quando não houver resultado.

### Arquivos afetados e mudanças

**1. `src/services/muscleWikiService.ts`** — Nova função utilitária
- Criar `resolveExerciseMedia(name: string): Promise<{videoUrl: string | null, imageUrl: string | null}>` que:
  - Busca no MuscleWiki via `searchExercisesMW(name, 1)` 
  - Retorna a primeira `og_image` (thumbnail) e `video url` via `getProxiedMediaUrl()`
  - Cacheia resultados em memória (Map) para evitar chamadas repetidas
  - Tenta nome original e, se falhar, tenta nome em inglês usando um mapa reverso PT→EN

**2. `src/hooks/useMuscleWikiMedia.ts`** — Novo hook React
- Hook `useMuscleWikiMedia(exerciseNames: string[])` que retorna `Record<string, {video?: string, image?: string}>`
- Busca em batch, paralelizando chamadas com `Promise.allSettled`
- Usa cache do service para não rebuscar

**3. `src/pages/AppWorkoutDetail.tsx`** — Lista de exercícios do treino
- Substituir lookup em `curated_exercises` pelo hook `useMuscleWikiMedia`
- Usar thumbnail do MuscleWiki como imagem do card

**4. `src/pages/AppWorkout.tsx`** — Tela de execução do treino
- Substituir lookup em `curated_exercises` pelo hook `useMuscleWikiMedia`
- Mostrar vídeo (ou imagem) do MuscleWiki na área de GIF durante a fase "exercise"
- Manter fallback de emoji animado quando não houver mídia

**5. `src/pages/AppExerciseDetail.tsx`** — Detalhe do exercício
- Usar `useMuscleWikiMedia` para obter vídeo/imagem
- Exibir `<video>` com controles quando houver vídeo, senão imagem estática

**6. `src/pages/AppHomeWorkout.tsx`** — Treino em casa
- Na fase de execução (work phase), substituir `AnimatedExercise` por vídeo/imagem do MuscleWiki quando disponível
- Manter `AnimatedExercise` como fallback

**7. `src/pages/AppWarmup.tsx`** — Aquecimento
- Buscar mídia MuscleWiki para cada exercício do warmup
- Exibir na tela de timer quando disponível

**8. `src/pages/AppStretching.tsx`** — Alongamento
- Buscar mídia MuscleWiki para cada stretch
- Exibir na tela de timer

**9. `supabase/functions/generate-workout/index.ts`** — Gerador de treinos IA
- Remover lógica de `fetchGifFallback` (ExerciseDB) e `resolveValidGif`
- Ao inserir exercícios, buscar no MuscleWiki API direto do edge function usando a API key do secret
- Salvar `image_url` com a URL proxied do MuscleWiki e `video_url` com o vídeo

### Detalhes técnicos

- O hook `useMuscleWikiMedia` faz as buscas client-side via API do MuscleWiki (chave pública no frontend)
- Vídeos são exibidos via `<video>` com `src` apontando para o edge function proxy (`musclewiki-media`)
- Cache em memória evita re-fetches durante a sessão
- O mapa reverso PT→EN usa `MUSCLE_PT` invertido + um mapa manual de nomes de exercícios comuns (ex: "Agachamento" → "Squat")
- No edge function, a busca é feita server-side com a API key do secret

### Escopo NÃO incluído
- Cardio protocols (não tem exercícios individuais com mídia)
- Não altera a estrutura do banco de dados

