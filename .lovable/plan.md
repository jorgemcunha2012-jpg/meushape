

## Plano: Tela de Loading do Quiz — Redesign com animações e prova social

### O que muda

A tela atual é estática e monótona (anel de progresso + texto pulsante). A nova versão será uma experiência em **3 fases sequenciais** que mantém o lead engajado durante os ~3 segundos de "processamento":

### Layout (tela única, sem scroll, 390x844)

**Fase 1 (0–40%)** — Análise
- Anel de progresso animado (mantém)
- Ícones das dimensões (força, flexibilidade, etc.) aparecem um a um ao redor do anel com animação de fade+scale
- Mensagens de status mudam a cada ~600ms

**Fase 2 (40–75%)** — Prova social
- O anel reduz de tamanho e sobe
- Abaixo surge um mini carrossel de depoimentos (2 cards visíveis) com auto-scroll, usando os testimonials já existentes em `quizResultUtils.ts`
- Badge "12.000+ mulheres transformadas" aparece com fade-in

**Fase 3 (75–100%)** — Finalização
- Mensagem muda para "Seu plano está quase pronto!"
- Checkmarks animados aparecem listando o que foi personalizado (exercícios, tempo, nível)
- Ao completar 100%, transição suave para `/quiz/email`

### Detalhes técnicos

- **Arquivo editado**: `src/pages/QuizLoading.tsx` (reescrita completa)
- **Imports**: Reutiliza `testimonials` de `@/lib/quizResultUtils`, fotos de `@/assets/testimonial-*.png`, e `Star` de lucide-react
- **Animações**: CSS transitions + keyframes do Tailwind já existentes (`animate-fade-in`, `animate-scale-in`), sem adicionar framer-motion
- **Timing**: Intervalo de 50ms para progresso (total ~2.5s), mensagens mudam a cada 600ms, testimonials auto-scroll a cada 2s
- **Logo MeuShape** no topo para manter consistência com o quiz

