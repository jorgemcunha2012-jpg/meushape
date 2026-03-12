

## Plano: Carrosséis de Desafios Especiais e Projetos

### O que muda

Transformar as duas seções estáticas (Desafio Especial e Projeto Verão) em carrosséis horizontais com múltiplas opções, cada uma com copy motivacional forte.

### Desafios Especiais (carrossel 1)

Cards no estilo atual (fundo escuro premium), deslizáveis horizontalmente:

1. **LEG DAY INTENSO** — "Protocolo avançado de glúteos & posterior. 45 min de pura intensidade." (mantém o existente)
2. **ABDÔMEN DE AÇO** — "Core destruidor em 30 min. Sem desculpas, sem descanso."
3. **UPPER BODY INSANO** — "Peito, costas e ombros no limite. Saia maior do que entrou."
4. **HIIT INFERNO** — "20 min que valem por 1 hora. Queime tudo, descanse depois."
5. **GLÚTEOS ON FIRE** — "Protocolo focado em bumbum. Cada rep conta, cada série transforma."

### Projetos (carrossel 2)

Cards no estilo gradiente laranja atual, deslizáveis:

1. **PROJETO VERÃO 2026** — "12 semanas para transformar seu shape. Treinos, nutrição e comunidade." (existente)
2. **PROJETO BUMBUM NA NUCA** — "8 semanas de foco total em glúteos. O espelho vai aplaudir."
3. **PROJETO ABDÔMEN TRINCADO** — "6 semanas pra secar e definir o core. Shape de capa de revista."
4. **PROJETO SHAPE COMPLETO** — "10 semanas full body. De iniciante a máquina em 70 dias."

### Implementação técnica

**Arquivo:** `src/pages/AppDashboard.tsx`

- Usar `embla-carousel-react` (já instalado) para criar carrosséis nativos com scroll horizontal suave
- Cada card ocupa ~85% da largura para mostrar peek do próximo
- Indicador de dots abaixo de cada carrossel
- Manter a lógica de `acceptChallenge` para o primeiro desafio; os demais serão hardcoded por agora (sem program_id associado, botão leva ao `/app/workouts`)
- Manter estilos visuais existentes (dark cards para desafios, gradiente laranja para projetos)
- Adicionar header "Desafios Especiais" e "Projetos" com label de quantidade acima de cada carrossel

