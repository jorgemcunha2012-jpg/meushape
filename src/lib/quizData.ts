// 4-axis scoring system: Corpo, Experiência, Rotina, Mente
export interface AxisScores {
  corpo: number;
  experiencia: number;
  rotina: number;
  mente: number;
}

export interface QuizOption {
  id: string;
  label: string;
  scores: Partial<AxisScores>;
}

export type ScreenType =
  | "single-select"    // auto-advance on selection
  | "multi-select"     // multiple selection + Continue button
  | "numeric-input"    // numeric input + Continue button
  | "intermediate";    // text/image screen + Continue button

export interface QuizScreen {
  id: string;
  type: ScreenType;
  question?: string;
  subtitle?: string;
  // For intermediate screens
  headline?: string;
  body?: string;
  buttonText?: string;
  // For single/multi select
  options?: QuizOption[];
  // For numeric input
  inputLabel?: string;
  inputUnit?: string;
  inputMin?: number;
  inputMax?: number;
  inputDefault?: number;
  microcopy?: string;
  // For multi-select
  maxSelections?: number;
}

export const quizScreens: QuizScreen[] = [
  // P1: Objetivo
  {
    id: "t01",
    type: "single-select",
    question: "Qual é seu objetivo principal?",
    options: [
      { id: "t01a", label: "Quero emagrecer", scores: {} },
      { id: "t01b", label: "Quero botar shape / definir o corpo", scores: {} },
      { id: "t01c", label: "Quero emagrecer E botar shape", scores: {} },
      { id: "t01d", label: "Quero começar a treinar (não sei por onde)", scores: {} },
    ],
  },
  // INTERMEDIÁRIA: Prova Social
  {
    id: "social1",
    type: "intermediate",
    headline: "Mais de 5.000 mulheres já descobriram o treino certo pro seu corpo",
    body: "Suas respostas vão criar um plano feito só pra você.",
    buttonText: "Continuar",
  },
  // P2: Corpo hoje
  {
    id: "t02",
    type: "single-select",
    question: "Como é seu corpo hoje?",
    subtitle: "Sem julgamentos — é só pra personalizar seu plano 💛",
    options: [
      { id: "t02a", label: "Magra", scores: { corpo: 3 } },
      { id: "t02b", label: "Normal", scores: { corpo: 2 } },
      { id: "t02c", label: "Um pouco acima do peso", scores: { corpo: 1 } },
      { id: "t02d", label: "Bem acima do peso", scores: { corpo: 0 } },
    ],
  },
  // P3: Como quer ficar
  {
    id: "t03",
    type: "single-select",
    question: "Como você quer ficar?",
    options: [
      { id: "t03a", label: "Sequinha", scores: {} },
      { id: "t03b", label: "Definida / tonificada", scores: {} },
      { id: "t03c", label: "Forte / com músculo visível", scores: {} },
    ],
  },
  // P4: Já treina? (3 options)
  {
    id: "t04",
    type: "single-select",
    question: "Você já treina ou já treinou?",
    options: [
      { id: "t04a", label: "Nunca treinei", scores: { experiencia: 0, mente: 0 } },
      { id: "t04b", label: "Já treinei, mas parei", scores: { experiencia: 1, mente: 1 } },
      { id: "t04d", label: "Treino atualmente", scores: { experiencia: 3, mente: 1 } },
    ],
  },
  // P5: O que fez desistir (multi-select, 5 options)
  {
    id: "t16",
    type: "multi-select",
    question: "O que já te fez desistir de treinar antes?",
    options: [
      { id: "t16a", label: "Não sabia o que fazer", scores: { mente: -1 } },
      { id: "t16b", label: "Perdi a motivação", scores: { mente: -1 } },
      { id: "t16c", label: "Não via resultado", scores: { mente: -1 } },
      { id: "t16d", label: "Não tinha tempo", scores: { mente: -1 } },
      { id: "t16f", label: "Nunca comecei de verdade", scores: { mente: 3 } },
    ],
  },
  // INTERMEDIÁRIA: Superação de Objeção
  {
    id: "objection1",
    type: "intermediate",
    headline: "O problema nunca foi falta de vontade",
    body: "A maioria desiste por um motivo simples: não tinha o plano certo. Com alguém te mostrando cada passo, você não precisa de motivação — só de abrir o app.",
    buttonText: "Continuar",
  },
  // P6: Onde treinar
  {
    id: "t11",
    type: "single-select",
    question: "Onde você quer treinar?",
    options: [
      { id: "t11a", label: "Na academia", scores: {} },
      { id: "t11b", label: "Em casa", scores: {} },
      { id: "t11c", label: "Tanto faz", scores: {} },
    ],
  },
  // P7: Dias por semana
  {
    id: "t09",
    type: "single-select",
    question: "Quantos dias por semana você consegue treinar?",
    options: [
      { id: "t09a", label: "1 a 2 dias", scores: { rotina: 1 } },
      { id: "t09b", label: "3 dias", scores: { rotina: 3 } },
      { id: "t09c", label: "4 dias", scores: { rotina: 4 } },
      { id: "t09d", label: "5 ou mais dias", scores: { rotina: 5 } },
    ],
  },
  // P8: Tempo por dia
  {
    id: "t10",
    type: "single-select",
    question: "Quanto tempo você tem pra treinar por dia?",
    options: [
      { id: "t10a", label: "Até 20 minutos", scores: { rotina: 1 } },
      { id: "t10b", label: "30 minutos", scores: { rotina: 2 } },
      { id: "t10c", label: "45 minutos", scores: { rotina: 3 } },
      { id: "t10d", label: "1 hora ou mais", scores: { rotina: 4 } },
    ],
  },
  // P9: Partes do corpo (multi-select)
  {
    id: "t13",
    type: "multi-select",
    question: "Quais partes do corpo você mais quer trabalhar?",
    options: [
      { id: "t13a", label: "Barriga / abdome", scores: {} },
      { id: "t13b", label: "Pernas e glúteos (bumbum)", scores: {} },
      { id: "t13c", label: "Braços", scores: {} },
      { id: "t13d", label: "Costas", scores: {} },
      { id: "t13e", label: "Corpo todo igual", scores: {} },
    ],
  },
  // P10: Dor/desconforto (4 options, removed "Cotovelos / punhos")
  {
    id: "t14",
    type: "multi-select",
    question: "Você sente dor ou desconforto em algum lugar?",
    options: [
      { id: "t14a", label: "Não tenho nenhuma dor", scores: {} },
      { id: "t14b", label: "Costas / coluna", scores: { corpo: -1 } },
      { id: "t14c", label: "Joelhos", scores: { corpo: -1 } },
      { id: "t14d", label: "Ombros", scores: { corpo: -1 } },
    ],
  },
  // P11: Altura
  {
    id: "t21",
    type: "numeric-input",
    question: "Qual é sua altura?",
    inputLabel: "Altura",
    inputUnit: "cm",
    inputMin: 100,
    inputMax: 220,
    microcopy: "Seus dados são usados só pra criar seu plano. Não compartilhamos com ninguém.",
  },
  // P12: Peso atual
  {
    id: "t22",
    type: "numeric-input",
    question: "Qual é seu peso atual?",
    inputLabel: "Peso",
    inputUnit: "kg",
    inputMin: 30,
    inputMax: 250,
    inputDefault: 65,
  },
  // P13: Peso meta (default changed to 60)
  {
    id: "t23",
    type: "numeric-input",
    question: "Qual peso você gostaria de alcançar?",
    inputLabel: "Peso meta",
    inputUnit: "kg",
    inputMin: 30,
    inputMax: 200,
    inputDefault: 60,
  },
  // P14: Acredita que consegue
  {
    id: "t26",
    type: "single-select",
    question: "Você acredita que consegue chegar lá?",
    options: [
      { id: "t26a", label: "Com certeza! Tô motivada 💪", scores: {} },
      { id: "t26b", label: "Tenho dúvida, mas quero tentar", scores: {} },
      { id: "t26c", label: "Não sei... mas quero acreditar", scores: {} },
    ],
  },
];

// Maximum possible points per axis (updated for reduced questions)
const MAX_SCORES: AxisScores = {
  corpo: 3,        // t02(3) + t14 can subtract
  experiencia: 3,  // t04(3)
  rotina: 9,       // t09(5) + t10(4)
  mente: 4,        // t04(1) + t16 can subtract or add 3
};

export function calculateAxisScores(answers: Record<string, string | string[]>): AxisScores {
  const raw: AxisScores = { corpo: 0, experiencia: 0, rotina: 0, mente: 0 };

  for (const [screenId, answer] of Object.entries(answers)) {
    const screen = quizScreens.find((s) => s.id === screenId);
    if (!screen || !screen.options) continue;

    const selectedIds = Array.isArray(answer) ? answer : [answer];
    for (const optId of selectedIds) {
      const option = screen.options.find((o) => o.id === optId);
      if (!option) continue;
      for (const [axis, value] of Object.entries(option.scores)) {
        raw[axis as keyof AxisScores] += value as number;
      }
    }
  }

  // Normalize to 0-10 scale
  return {
    corpo: Math.round(Math.max(0, Math.min(10, (raw.corpo / MAX_SCORES.corpo) * 10))),
    experiencia: Math.round(Math.max(0, Math.min(10, (raw.experiencia / MAX_SCORES.experiencia) * 10))),
    rotina: Math.round(Math.max(0, Math.min(10, (raw.rotina / MAX_SCORES.rotina) * 10))),
    mente: Math.round(Math.max(0, Math.min(10, (raw.mente / MAX_SCORES.mente) * 10))),
  };
}

// Diagnosis texts per axis per range
export interface DiagnosisText {
  axis: string;
  label: string;
  emoji: string;
  getText: (score: number) => string;
}

export const diagnosisTexts: DiagnosisText[] = [
  {
    axis: "corpo",
    label: "Seu Corpo Hoje",
    emoji: "🫀",
    getText: (score) => {
      if (score <= 3) return "Seu corpo tá pedindo socorro — falta sono, energia e movimento no seu dia. O treino vai mudar isso, mas a gente começa devagar.";
      if (score <= 6) return "Seu corpo tá ok, mas dá pra melhorar bastante. Algumas mudanças simples já vão fazer diferença.";
      return "Seu corpo já tá numa base boa. Com o treino certo, o resultado vem rápido.";
    },
  },
  {
    axis: "experiencia",
    label: "Sua Experiência",
    emoji: "🏋️‍♀️",
    getText: (score) => {
      if (score <= 3) return "Você não sabe o que fazer na academia — e tudo bem. É exatamente pra isso que o Personal no Bolso existe. Ele te guia exercício por exercício.";
      if (score <= 6) return "Você tem uma noção, mas falta direção. O app vai organizar tudo e te mostrar os exercícios certos pro seu objetivo.";
      return "Você já manja de treino. O app vai otimizar e fazer você evoluir mais rápido com progressão inteligente.";
    },
  },
  {
    axis: "rotina",
    label: "Sua Rotina",
    emoji: "📅",
    getText: (score) => {
      if (score <= 4) return "Sua rotina tá apertada, mas a gente adapta. Treinos curtos e eficientes que cabem no seu tempo.";
      if (score <= 7) return "Você tem tempo pra treinar — só precisa de um plano que use esse tempo direito.";
      return "Sua rotina permite treinar bastante. O plano vai aproveitar cada minuto disponível.";
    },
  },
  {
    axis: "mente",
    label: "Sua Cabeça",
    emoji: "🧠",
    getText: (score) => {
      if (score <= 3) return "A parte emocional tá pesando. Você já desistiu antes e tem medo de acontecer de novo. A comunidade de mulheres dentro do app vai te ajudar a manter firme.";
      if (score <= 6) return "Você tem motivação, mas já oscilou antes. O app mantendo você no trilho + as minas da comunidade te apoiando = consistência.";
      return "Sua cabeça tá no lugar. Você só precisa do plano certo e vai voar.";
    },
  },
];

export function generateSummary(scores: AxisScores): string {
  const weakest = Object.entries(scores).reduce((min, [key, val]) =>
    val < min[1] ? [key, val] : min, ["corpo", 10] as [string, number]);

  const axisLabels: Record<string, string> = {
    corpo: "cuidar do corpo",
    experiencia: "saber o que fazer no treino",
    rotina: "encaixar o treino na rotina",
    mente: "manter a motivação",
  };

  return `Seu maior desafio é ${axisLabels[weakest[0]]}. É exatamente isso que o Personal no Bolso resolve.`;
}
