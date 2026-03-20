

## Plano: Menu de Exercícios exclusivo para Admin (gravação de tela)

### O que será feito

Nova página `/app/admin-exercises` acessível **apenas** pelo admin (verificação via `isAdmin` do `useAuth`). A página terá:

- Barra de pesquisa simples (busca na API MuscleWiki via `searchExercisesMW`)
- Lista de resultados com thumbnail (via `ExerciseThumbnail`), nome, músculos, e série básica (3x12)
- Ao clicar num exercício, expande inline mostrando vídeo/imagem maior + instruções
- Redirecionamento para `/app` se não for admin

### Economia de API

1. **Cache agressivo**: os resultados de busca já passam pelo `cacheService` existente — buscas repetidas não consomem API
2. **Debounce na pesquisa**: só dispara após 800ms sem digitar (evita chamadas a cada tecla)
3. **Limite de resultados**: máximo 10 por busca (menos chamadas de detalhe)
4. **Lazy detail**: só busca o detalhe completo (vídeo/imagem) quando o usuário clica para expandir, não para todos de uma vez

### Arquivos

| Arquivo | Ação |
|---|---|
| `src/pages/AppAdminExercises.tsx` | **Criar** — página com busca + lista + expansão inline |
| `src/App.tsx` | **Editar** — adicionar rota `/app/admin-exercises` |

### Detalhes técnicos

- Guard de acesso: `if (!isAdmin) navigate("/app")` no useEffect
- Usa `searchExercisesMW` (já existe) para busca
- Usa `fetchExerciseDetail` para detalhe ao expandir (com cache)
- Usa `ExerciseThumbnail` + `useMuscleWikiMedia` para mídia
- Série padrão exibida: "3 séries × 12 reps • 60s descanso"
- Design consistente com SolarLayout existente

