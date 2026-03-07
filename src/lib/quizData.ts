export interface QuizOption {
  id: string;
  label: string;
  scores: {
    iniciante: number;
    intermediaria: number;
    avancada: number;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  subtitle?: string;
  options: QuizOption[];
}

export interface QuizProfile {
  id: "iniciante" | "intermediaria" | "avancada";
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
}

// Placeholder questions — will be replaced with actual transcript content
export const quizQuestions: QuizQuestion[] = [
  {
    id: "q1",
    question: "Com que frequência você treina atualmente?",
    subtitle: "Seja honesta, sem julgamentos 💪",
    options: [
      { id: "q1a", label: "Nunca ou quase nunca", scores: { iniciante: 3, intermediaria: 0, avancada: 0 } },
      { id: "q1b", label: "1 a 2 vezes por semana", scores: { iniciante: 2, intermediaria: 1, avancada: 0 } },
      { id: "q1c", label: "3 a 4 vezes por semana", scores: { iniciante: 0, intermediaria: 3, avancada: 1 } },
      { id: "q1d", label: "5 ou mais vezes por semana", scores: { iniciante: 0, intermediaria: 1, avancada: 3 } },
    ],
  },
  {
    id: "q2",
    question: "Qual é o seu principal objetivo?",
    subtitle: "Escolha o que mais te motiva ✨",
    options: [
      { id: "q2a", label: "Começar a me exercitar", scores: { iniciante: 3, intermediaria: 0, avancada: 0 } },
      { id: "q2b", label: "Perder peso e tonificar", scores: { iniciante: 1, intermediaria: 3, avancada: 0 } },
      { id: "q2c", label: "Ganhar massa muscular", scores: { iniciante: 0, intermediaria: 1, avancada: 3 } },
      { id: "q2d", label: "Melhorar performance", scores: { iniciante: 0, intermediaria: 1, avancada: 3 } },
    ],
  },
  {
    id: "q3",
    question: "Como você descreveria sua experiência com treinos?",
    options: [
      { id: "q3a", label: "Sou totalmente iniciante", scores: { iniciante: 3, intermediaria: 0, avancada: 0 } },
      { id: "q3b", label: "Já treinei antes mas parei", scores: { iniciante: 1, intermediaria: 3, avancada: 0 } },
      { id: "q3c", label: "Treino regularmente", scores: { iniciante: 0, intermediaria: 2, avancada: 2 } },
      { id: "q3d", label: "Treino há anos consistentemente", scores: { iniciante: 0, intermediaria: 0, avancada: 3 } },
    ],
  },
  {
    id: "q4",
    question: "Onde você prefere treinar?",
    subtitle: "Seu ambiente ideal 🏠",
    options: [
      { id: "q4a", label: "Em casa, sem equipamentos", scores: { iniciante: 3, intermediaria: 1, avancada: 0 } },
      { id: "q4b", label: "Em casa, com alguns equipamentos", scores: { iniciante: 1, intermediaria: 3, avancada: 0 } },
      { id: "q4c", label: "Na academia", scores: { iniciante: 0, intermediaria: 1, avancada: 3 } },
      { id: "q4d", label: "Tanto faz", scores: { iniciante: 1, intermediaria: 1, avancada: 1 } },
    ],
  },
  {
    id: "q5",
    question: "Quanto tempo você pode dedicar por treino?",
    subtitle: "Tempo real, não ideal ⏰",
    options: [
      { id: "q5a", label: "15 a 20 minutos", scores: { iniciante: 3, intermediaria: 1, avancada: 0 } },
      { id: "q5b", label: "30 a 45 minutos", scores: { iniciante: 1, intermediaria: 3, avancada: 1 } },
      { id: "q5c", label: "45 a 60 minutos", scores: { iniciante: 0, intermediaria: 1, avancada: 3 } },
      { id: "q5d", label: "Mais de 1 hora", scores: { iniciante: 0, intermediaria: 0, avancada: 3 } },
    ],
  },
];

export const quizProfiles: Record<string, QuizProfile> = {
  iniciante: {
    id: "iniciante",
    title: "Desbravadora",
    subtitle: "Seu perfil é de quem está começando essa jornada incrível!",
    description:
      "Você está dando os primeiros passos — e isso é lindo! Seu plano será focado em criar o hábito, com treinos curtos, acessíveis e progressivos. Vamos construir sua base juntas.",
    emoji: "🌱",
  },
  intermediaria: {
    id: "intermediaria",
    title: "Evoluída",
    subtitle: "Você já tem uma base e está pronta pra subir de nível!",
    description:
      "Você já conhece a rotina de treinos e quer ir além. Seu plano terá desafios na medida certa para você continuar evoluindo com consistência e resultado.",
    emoji: "🔥",
  },
  avancada: {
    id: "avancada",
    title: "Imparável",
    subtitle: "Você é dedicada e busca performance de verdade!",
    description:
      "Treinar já faz parte da sua vida. Seu plano será intenso, variado e estratégico para que você quebre barreiras e alcance o próximo nível.",
    emoji: "💎",
  },
};

export function calculateProfile(answers: Record<string, string>): string {
  const scores = { iniciante: 0, intermediaria: 0, avancada: 0 };

  for (const [questionId, optionId] of Object.entries(answers)) {
    const question = quizQuestions.find((q) => q.id === questionId);
    if (!question) continue;
    const option = question.options.find((o) => o.id === optionId);
    if (!option) continue;
    scores.iniciante += option.scores.iniciante;
    scores.intermediaria += option.scores.intermediaria;
    scores.avancada += option.scores.avancada;
  }

  const maxScore = Math.max(scores.iniciante, scores.intermediaria, scores.avancada);
  if (scores.avancada === maxScore) return "avancada";
  if (scores.intermediaria === maxScore) return "intermediaria";
  return "iniciante";
}
