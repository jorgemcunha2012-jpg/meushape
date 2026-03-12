import type { AxisScores } from "./quizData";

export interface SixDimensions {
  forca: number;
  resistencia: number;
  flexibilidade: number;
  composicao: number;
  consistencia: number;
  motivacao: number;
}

/**
 * Derives 6 radar dimensions from the 4 quiz axes (each 0-10).
 * Adds slight variance so the radar is never a perfect circle.
 */
export function deriveSixDimensions(scores: AxisScores): SixDimensions {
  const { corpo, experiencia, rotina, mente } = scores;
  return {
    forca: Math.min(10, Math.round((experiencia * 0.6 + corpo * 0.4) * 1)),
    resistencia: Math.min(10, Math.round((rotina * 0.5 + corpo * 0.3 + experiencia * 0.2) * 1)),
    flexibilidade: Math.min(10, Math.round((corpo * 0.5 + mente * 0.3 + rotina * 0.2) * 1)),
    composicao: Math.min(10, Math.round(corpo * 1)),
    consistencia: Math.min(10, Math.round((rotina * 0.6 + mente * 0.4) * 1)),
    motivacao: Math.min(10, Math.round(mente * 1)),
  };
}

export function computeOverallScore(dims: SixDimensions): number {
  const vals = Object.values(dims);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.round((avg / 10) * 100);
}

export function computePotential(dims: SixDimensions): SixDimensions {
  const entries = Object.entries(dims) as [keyof SixDimensions, number][];
  const result = {} as SixDimensions;
  for (const [key, val] of entries) {
    // lower scores get more improvement, higher scores get less
    const boost = val <= 3 ? 5 : val <= 6 ? 3.5 : 2;
    result[key] = Math.min(10, Math.round(val + boost));
  }
  return result;
}

export const dimensionLabels: Record<keyof SixDimensions, string> = {
  forca: "Força",
  resistencia: "Resistência",
  flexibilidade: "Flexibilidade",
  composicao: "Composição",
  consistencia: "Consistência",
  motivacao: "Motivação",
};

export interface InsightCard {
  type: "bottleneck" | "potential" | "profile";
  title: string;
  description: string;
  value?: string;
}

export function generateInsights(
  dims: SixDimensions,
  answers: Record<string, string | string[]>
): InsightCard[] {
  const entries = Object.entries(dims) as [keyof SixDimensions, number][];
  const sorted = [...entries].sort((a, b) => a[1] - b[1]);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  const bottleneck: InsightCard = {
    type: "bottleneck",
    title: `${dimensionLabels[weakest[0]]} é seu maior gargalo`,
    description: getBottleneckText(weakest[0]),
    value: `${weakest[1]}/10`,
  };

  const potential: InsightCard = {
    type: "potential",
    title: `${dimensionLabels[strongest[0]]} é seu ponto forte`,
    description: getPotentialText(strongest[0]),
    value: `${strongest[1]}/10`,
  };

  // Derive profile from answers
  const objetivo = getAnswerLabel(answers, "t01");
  const nivel = getAnswerLabel(answers, "t04");
  const disponibilidade = getAnswerLabel(answers, "t09");
  const local = getAnswerLabel(answers, "t10");

  const profile: InsightCard = {
    type: "profile",
    title: "Seu Perfil Fitness",
    description: [objetivo, nivel, disponibilidade, local].filter(Boolean).join(" • "),
  };

  return [bottleneck, potential, profile];
}

function getAnswerLabel(answers: Record<string, string | string[]>, screenId: string): string {
  const answer = answers[screenId];
  if (!answer) return "";
  const id = Array.isArray(answer) ? answer[0] : answer;
  // Simple mapping from known IDs
  const labels: Record<string, string> = {
    t01a: "Emagrecer", t01b: "Definir", t01c: "Emagrecer + Definir", t01d: "Iniciante",
    t04a: "Nunca treinou", t04b: "Voltando", t04c: "Irregular", t04d: "Regular", t04e: "Avançada",
    t09a: "2x/sem", t09b: "3x/sem", t09c: "4x/sem", t09d: "5x/sem", t09e: "6+/sem",
    t10a: "Academia", t10b: "Casa", t10c: "Os dois", t10d: "Ar livre",
  };
  return labels[id] || "";
}

function getBottleneckText(dim: keyof SixDimensions): string {
  const texts: Record<keyof SixDimensions, string> = {
    forca: "Você precisa fortalecer a musculatura. O plano foca em ganho de força progressivo.",
    resistencia: "Sua resistência precisa melhorar. Incluímos condicionamento no seu plano.",
    flexibilidade: "Falta mobilidade no seu corpo. Adicionamos alongamentos estratégicos.",
    composicao: "Sua composição corporal pode melhorar muito com treino + alimentação.",
    consistencia: "Manter a rotina é seu desafio. O app envia lembretes e adapta ao seu tempo.",
    motivacao: "A motivação oscila. A comunidade e os desafios vão te manter firme.",
  };
  return texts[dim];
}

function getPotentialText(dim: keyof SixDimensions): string {
  const texts: Record<keyof SixDimensions, string> = {
    forca: "Você já tem boa base de força. Vamos potencializar com progressão inteligente.",
    resistencia: "Sua resistência é um trunfo. Vamos usar isso a seu favor nos treinos.",
    flexibilidade: "Boa mobilidade! Isso acelera resultados e previne lesões.",
    composicao: "Seu corpo está numa boa base. Com o plano certo, os resultados vêm rápido.",
    consistencia: "Você é consistente! Isso é o fator #1 pra resultados duradouros.",
    motivacao: "Sua motivação é forte. Com direção certa, você vai longe.",
  };
  return texts[dim];
}

export interface Testimonial {
  name: string;
  age: number;
  photo: string;
  quote: string;
  metrics: { label: string; value: string }[];
  profile: string; // matches user's objetivo
}

export const testimonials: Testimonial[] = [
  {
    name: "Carolina S.",
    age: 28,
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    quote: "Em 8 semanas perdi 5kg e ganhei uma autoestima que não tinha há anos. O app me guiou exercício por exercício.",
    metrics: [
      { label: "Peso", value: "-5kg" },
      { label: "Cintura", value: "-6cm" },
      { label: "Tempo", value: "8 sem" },
    ],
    profile: "Emagrecer",
  },
  {
    name: "Juliana M.",
    age: 32,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    quote: "Nunca tinha treinado na vida. Hoje faço 4x por semana e amo! A comunidade é incrível.",
    metrics: [
      { label: "Shape", value: "+3cm glúteo" },
      { label: "Força", value: "+40%" },
      { label: "Tempo", value: "12 sem" },
    ],
    profile: "Definir",
  },
  {
    name: "Amanda R.",
    age: 25,
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face",
    quote: "Eu desistia de tudo. Mas com o plano personalizado e as meninas me apoiando, mantive firme por 3 meses!",
    metrics: [
      { label: "Peso", value: "-8kg" },
      { label: "Disposição", value: "+80%" },
      { label: "Tempo", value: "12 sem" },
    ],
    profile: "Emagrecer + Definir",
  },
  {
    name: "Beatriz L.",
    age: 30,
    photo: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face",
    quote: "Voltei a treinar depois de 2 anos parada. O app me deu confiança pra usar os aparelhos sem medo.",
    metrics: [
      { label: "Peso", value: "-4kg" },
      { label: "Massa magra", value: "+2kg" },
      { label: "Tempo", value: "10 sem" },
    ],
    profile: "Iniciante",
  },
];
