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
  // TELA 01
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
    headline: "Mais de 87.342 mulheres já descobriram o que faltava no treino delas",
    body: "Junte-se a milhares de mulheres que transformaram sua relação com o treino.",
    buttonText: "Continuar",
  },
  // TELA 02
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
  // TELA 03
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
  // TELA 04
  {
    id: "t04",
    type: "single-select",
    question: "Você já treina ou já treinou?",
    options: [
      { id: "t04a", label: "Nunca treinei", scores: { experiencia: 0, mente: 0 } },
      { id: "t04b", label: "Já treinei, mas parei", scores: { experiencia: 1, mente: 1 } },
      { id: "t04c", label: "Treino de vez em quando", scores: { experiencia: 2, mente: 1 } },
      { id: "t04d", label: "Treino regularmente", scores: { experiencia: 3, mente: 1 } },
      { id: "t04e", label: "Treino sério há bastante tempo", scores: { experiencia: 4, mente: 1 } },
    ],
  },
  // TELA 05
  {
    id: "t05",
    type: "single-select",
    question: "Quando foi a última vez que você se sentiu bem com seu corpo?",
    options: [
      { id: "t05a", label: "Nunca me senti bem", scores: { mente: 0 } },
      { id: "t05b", label: "Faz mais de 3 anos", scores: { mente: 1 } },
      { id: "t05c", label: "Entre 1 e 3 anos atrás", scores: { mente: 2 } },
      { id: "t05d", label: "Menos de 1 ano atrás", scores: { mente: 3 } },
    ],
  },
  // TELA 06 — Pergunta diferenciadora
  {
    id: "t06",
    type: "single-select",
    question: "Quando você chega na academia, você sabe o que fazer?",
    subtitle: "Essa é a pergunta mais importante ✨",
    options: [
      { id: "t06a", label: "Fico perdida, não sei o que fazer", scores: { experiencia: 0 } },
      { id: "t06b", label: "Faço sempre a mesma coisa (esteira, abdominal...)", scores: { experiencia: 1 } },
      { id: "t06c", label: "Tenho uma ideia, mas não sei se tá certo", scores: { experiencia: 2 } },
      { id: "t06d", label: "Sei mais ou menos, mas não tenho um plano", scores: { experiencia: 3 } },
      { id: "t06e", label: "Sei exatamente o que fazer", scores: { experiencia: 4 } },
    ],
  },
  // TELA 07
  {
    id: "t07",
    type: "single-select",
    question: "Você já deixou de usar algum aparelho na academia por não saber como funciona?",
    options: [
      { id: "t07a", label: "Sim, várias vezes — tenho vergonha de perguntar", scores: { experiencia: 0 } },
      { id: "t07b", label: "Já aconteceu algumas vezes", scores: { experiencia: 1 } },
      { id: "t07c", label: "Raramente, mas já aconteceu", scores: { experiencia: 2 } },
      { id: "t07d", label: "Não, sei usar a maioria", scores: { experiencia: 3 } },
    ],
  },
  // TELA 08
  {
    id: "t08",
    type: "single-select",
    question: "Se alguém te pedisse pra explicar seu treino atual, você conseguiria?",
    options: [
      { id: "t08a", label: "Não tenho treino definido", scores: { experiencia: 0 } },
      { id: "t08b", label: "Sei mais ou menos, mas não saberia explicar direito", scores: { experiencia: 1 } },
      { id: "t08c", label: "Consigo explicar por cima", scores: { experiencia: 2 } },
      { id: "t08d", label: "Sim, consigo explicar certinho", scores: { experiencia: 3 } },
    ],
  },
  // INTERMEDIÁRIA: Conceito do Produto
  {
    id: "product1",
    type: "intermediate",
    headline: "Imagina ter uma personal trainer no seu celular te guiando exercício por exercício",
    body: "Você abre o app, ele te mostra o que fazer, como fazer, quantas vezes. É só seguir.",
    buttonText: "Entendi, quero continuar",
  },
  // TELA 09
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
  // TELA 10
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
  // TELA 11
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
  // TELA 12
  {
    id: "t12",
    type: "single-select",
    question: "Em que horário você costuma treinar?",
    options: [
      { id: "t12a", label: "De manhã", scores: {} },
      { id: "t12b", label: "Na hora do almoço", scores: {} },
      { id: "t12c", label: "À tarde", scores: {} },
      { id: "t12d", label: "À noite", scores: {} },
      { id: "t12e", label: "Varia, não tenho horário fixo", scores: {} },
    ],
  },
  // TELA 13
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
  // TELA 14
  {
    id: "t14",
    type: "multi-select",
    question: "Você sente dor ou desconforto em algum lugar?",
    options: [
      { id: "t14a", label: "Não tenho nenhuma dor", scores: {} },
      { id: "t14b", label: "Costas / coluna", scores: { corpo: -1 } },
      { id: "t14c", label: "Joelhos", scores: { corpo: -1 } },
      { id: "t14d", label: "Ombros", scores: { corpo: -1 } },
      { id: "t14e", label: "Cotovelos / punhos", scores: { corpo: -1 } },
    ],
  },
  // TELA 15
  {
    id: "t15",
    type: "multi-select",
    question: "O que te motiva a querer treinar?",
    maxSelections: 4,
    options: [
      { id: "t15a", label: "Quero me sentir bonita", scores: { mente: 1 } },
      { id: "t15b", label: "Quero ter mais energia no dia a dia", scores: { mente: 1 } },
      { id: "t15c", label: "Quero me sentir bem quando me olho no espelho", scores: { mente: 1 } },
      { id: "t15d", label: "Quero ficar mais forte", scores: { mente: 1 } },
      { id: "t15e", label: "Quero melhorar minha saúde", scores: { mente: 1 } },
    ],
  },
  // TELA 16
  {
    id: "t16",
    type: "multi-select",
    question: "O que já te fez desistir de treinar antes?",
    options: [
      { id: "t16a", label: "Não sabia o que fazer na academia", scores: { mente: -1 } },
      { id: "t16b", label: "Perdi a motivação", scores: { mente: -1 } },
      { id: "t16c", label: "Não via resultado", scores: { mente: -1 } },
      { id: "t16d", label: "Não tinha tempo", scores: { mente: -1 } },
      { id: "t16e", label: "Tinha vergonha", scores: { mente: -1 } },
      { id: "t16f", label: "Nunca desisti (nunca comecei de verdade)", scores: { mente: 3 } },
    ],
  },
  // INTERMEDIÁRIA: Superação de Objeção
  {
    id: "objection1",
    type: "intermediate",
    headline: "O problema nunca foi falta de vontade",
    body: "A maioria das mulheres desiste de treinar por um motivo simples: não tinham ninguém pra guiar. Não é preguiça. É falta de direção.\n\nCom o plano certo e alguém te mostrando cada passo, você não vai precisar de força de vontade — só de abrir o app.",
    buttonText: "Entendi",
  },
  // TELA 17
  {
    id: "t17",
    type: "single-select",
    question: "Como é seu dia a dia?",
    options: [
      { id: "t17a", label: "Fico sentada a maior parte do dia", scores: { corpo: 0 } },
      { id: "t17b", label: "Me movimento um pouco nos intervalos", scores: { corpo: 1 } },
      { id: "t17c", label: "Fico em pé / andando bastante", scores: { corpo: 2 } },
      { id: "t17d", label: "Meu trabalho é físico / fico o dia todo em movimento", scores: { corpo: 3 } },
    ],
  },
  // TELA 18
  {
    id: "t18",
    type: "single-select",
    question: "Como tá sua energia durante o dia?",
    options: [
      { id: "t18a", label: "Baixa o dia todo, vivo cansada", scores: { corpo: 0 } },
      { id: "t18b", label: "Dá uma caída depois do almoço", scores: { corpo: 1 } },
      { id: "t18c", label: "Vai e volta, depende do dia", scores: { corpo: 2 } },
      { id: "t18d", label: "Boa e estável o dia todo", scores: { corpo: 3 } },
    ],
  },
  // TELA 19
  {
    id: "t19",
    type: "single-select",
    question: "Quantas horas você dorme por noite?",
    options: [
      { id: "t19a", label: "Menos de 5 horas", scores: { corpo: 0 } },
      { id: "t19b", label: "5 a 6 horas", scores: { corpo: 1 } },
      { id: "t19c", label: "6 a 7 horas", scores: { corpo: 2 } },
      { id: "t19d", label: "7 horas ou mais", scores: { corpo: 3 } },
    ],
  },
  // TELA 20
  {
    id: "t20",
    type: "single-select",
    question: "Quanta água você bebe por dia?",
    options: [
      { id: "t20a", label: "Quase nada (menos de 3 copos)", scores: { corpo: 0 } },
      { id: "t20b", label: "Pouca (3 a 6 copos)", scores: { corpo: 1 } },
      { id: "t20c", label: "Normal (6 a 10 copos)", scores: { corpo: 2 } },
      { id: "t20d", label: "Bastante (mais de 10 copos)", scores: { corpo: 3 } },
    ],
  },
  // TELA 21 — Altura
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
  // TELA 22 — Peso atual
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
  // TELA 23 — Peso meta
  {
    id: "t23",
    type: "numeric-input",
    question: "Qual peso você gostaria de alcançar?",
    inputLabel: "Peso meta",
    inputUnit: "kg",
    inputMin: 30,
    inputMax: 200,
    inputDefault: 65,
  },
  // TELA 24 — Idade
  {
    id: "t24",
    type: "numeric-input",
    question: "Qual é sua idade?",
    inputLabel: "Idade",
    inputUnit: "anos",
    inputMin: 14,
    inputMax: 80,
    microcopy: "Sua idade ajuda a criar um plano seguro e adequado pro seu corpo.",
  },
  // TELA 25
  {
    id: "t25",
    type: "single-select",
    question: "Tem algum evento importante que você quer ficar em forma?",
    options: [
      { id: "t25a", label: "Férias / viagem de praia", scores: {} },
      { id: "t25b", label: "Aniversário", scores: {} },
      { id: "t25c", label: "Casamento", scores: {} },
      { id: "t25d", label: "Formatura", scores: {} },
      { id: "t25e", label: "Reencontro com alguém", scores: {} },
      { id: "t25f", label: "Não tenho evento específico", scores: {} },
    ],
  },
  // TELA 26 — Última pergunta (compromisso)
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

// Maximum possible points per axis
const MAX_SCORES: AxisScores = {
  corpo: 18,       // t02(3) + t17(3) + t18(3) + t19(3) + t20(3) + t14 can subtract
  experiencia: 14, // t04(4) + t06(4) + t07(3) + t08(3)
  rotina: 9,       // t09(5) + t10(4)
  mente: 11,       // t04(1) + t05(3) + t15(max 5) + t16 can subtract or add 3
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
