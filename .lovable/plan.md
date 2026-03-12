

## Analise: O que o mercado fitness faz no dashboard

Apps de referencia (Hevy, Strong, Fitbod, Nike Training Club) seguem um padrao claro:

- **Dashboard**: visao semanal (7 dias), streak, CTA do treino do dia, stats rapidos
- **Historico/Evolucao**: calendario mensal completo para explorar o passado
- **Nenhum** desses apps usa mapa muscular no dashboard principal

O dashboard atual ja tem uma **week strip** (SEG-DOM) que e exatamente o padrao do mercado. O problema e o card do Mapa Muscular que ocupa espaco com visual ruim e a "Meta Semanal" arbitraria (treinos/5).

## Plano Revisado

### 1. Substituir o card "Mapa Muscular" por um card "Resumo da Semana"

Card compacto com visual Solar contendo:

- **3 stats em linha**: Treinos na semana (ex: 3/5), Tempo total (ex: 135 min), Streak atual (ex: 7 dias)
- **Barra de progresso semanal** real: baseada nos treinos feitos vs. `days_per_week` do programa ativo (nao mais um "5" hardcoded)
- **Mini lista dos ultimos 2-3 treinos da semana** com nome, data relativa ("hoje", "ontem", "3a feira") e duracao

### 2. O que remover

- Import do `MuscleMap`
- Todo o bloco de tipos/funcoes do mapa muscular: `MuscleStatus`, `MuscleData`, `MUSCLE_GROUP_MAP`, `classifyMuscle`, `getMuscleStatus`, `muscleStatusColor`, `fetchMuscleMap`, `muscleLabels`, `statusGroups`, `legendItems`
- Estado `muscleMap` e `weeklyProgress`
- Toda a secao JSX "MUSCLE MAP CARD" (lines 373-479)

### 3. O que adicionar

- Estado `weekStats` com: treinos feitos, tempo total, meta semanal (do programa)
- Estado `recentLogs` com ultimos 3 workout_logs da semana (nome do workout + duracao + data)
- Query: `workout_logs` da semana atual com join em `workouts` para pegar titulo
- Meta semanal real: `days_per_week` do programa ativo (ja buscado no `fetchData`)

### 4. Visual do novo card

```text
┌─────────────────────────────────────┐
│  Sua Semana                         │
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐        │
│  │  3  │  │ 135 │  │  7  │        │
│  │treinos│ │ min │  │ dias│        │
│  └─────┘  └─────┘  └─────┘        │
│                                     │
│  ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░  3/5 treinos  │
│                                     │
│  ● Inferior A · ontem · 48 min     │
│  ● Superior B · 3a feira · 42 min  │
└─────────────────────────────────────┘
```

- Border radius 3rem, glassmorphism sutil
- Stats com numeros grandes em laranja, labels pequenos em muted
- Barra de progresso com gradiente amber→orange
- Lista de treinos recentes com bolinhas laranja e texto limpo

### 5. Calendario mensal fica no Historico

Se quiser, podemos depois adicionar um calendario mensal completo na pagina `/app/history` -- que e onde faz sentido no mercado.

### Arquivo afetado
- `src/pages/AppDashboard.tsx` (unico arquivo)

