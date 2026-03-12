

## Analise: o plano atual NAO cobre esse cenario

O modelo de dados atual tem um problema fundamental para o que voce quer:

- `workout_programs` sao globais (nao tem `user_id`, nao tem conceito de "catalogo vs meus programas")
- O app simplesmente pega o primeiro programa ativo (`.limit(1)`) e mostra para todos
- Nao existe uma tabela de relacao usuario-programa ("user subscribed to program X")

### O que precisa mudar

O fluxo correto seria:

```text
┌──────────────────┐        ┌──────────────────┐
│  CATALOGO         │        │  MEUS PROGRAMAS   │
│  (criado pelo app)│───────▶│  (escolhidos pelo │
│                   │  "add" │   usuario)        │
│  Programas        │        │                   │
│  Desafios         │        │  Programa A  ✓    │
│  Novidades        │        │  Desafio 30d ✓    │
└──────────────────┘        └──────────────────┘
                                    │
                                    ▼ tap
                            ┌──────────────────┐
                            │  Treinos do       │
                            │  Programa A       │
                            │  → Exercicios     │
                            └──────────────────┘
```

### Plano revisado

**1. Nova tabela `user_programs`** para vincular usuarios a programas:
- `user_id`, `program_id`, `added_at`, `is_favorite`
- RLS: usuario so ve/edita os seus

**2. Refatorar a pagina "Meus Treinos" em 2 abas:**
- **Meus Programas**: programas que o usuario adicionou (com progresso)
- **Explorar**: catalogo de todos os programas/desafios disponiveis para adicionar

**3. Fluxo de navegacao (3 telas como planejado, mas com contexto):**
- **Tela 1 - Meus Programas**: lista dos programas adicionados pelo usuario. Botao "Explorar" para ver catalogo. Empty state: "Explore programas e adicione o seu primeiro"
- **Tela 2 - Treinos do Programa**: igual ao plano anterior (lista de treinos do programa selecionado)
- **Tela 3 - Exercicios**: igual ao plano anterior (lista editavel de exercicios)

**4. Tela de Catalogo/Explorar:**
- Cards bonitos dos programas disponiveis (com nivel, duracao, descricao)
- Botao "Adicionar aos meus" em cada card
- Badge "Novo" ou "Desafio" para programas especiais

**5. Admin continua criando programas** pela pagina `/app/manage`, mas agora esses programas vao para o catalogo global, e usuarios escolhem quais querem seguir.

### Arquivos afetados
- Nova migration: criar tabela `user_programs`
- `src/pages/AppWorkoutDashboard.tsx`: refatorar para usar `user_programs` em vez de pegar primeiro programa global
- `src/pages/AppManageWorkouts.tsx`: refatorar com o fluxo wizard (admin)
- Possivel nova pagina ou componente para "Explorar Programas"

Quer seguir com esse plano revisado?

