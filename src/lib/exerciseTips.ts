/** Fallback tips for common exercises when curated data is unavailable */
export const FALLBACK_TIPS: Record<string, string> = {
  "agachamento": "Mantenha os joelhos alinhados com os pés e não deixe os joelhos passarem à frente dos dedos.",
  "supino": "Não deixe os cotovelos abrirem demais — mantenha em 45° para proteger os ombros.",
  "rosca": "Evite balançar o corpo para levantar o peso. Use apenas a força dos bíceps.",
  "prancha": "Não deixe o quadril cair nem subir demais. Corpo deve formar uma linha reta.",
  "ponte": "Aperte os glúteos no topo e não hiperextenda a lombar.",
  "abdut": "Controle a descida — não deixe o peso bater. Foco na contração lateral.",
  "adut": "Mantenha a postura ereta e controle o movimento sem usar impulso.",
  "kickback": "Não balance a perna. Contraia o glúteo no topo e controle a descida.",
  "abdominal": "Não puxe o pescoço com as mãos. Olhe para o teto e use o abdômen.",
  "crunch": "Não puxe o pescoço com as mãos. Suba contraindo o abdômen.",
  "stiff": "Mantenha leve flexão nos joelhos e costas retas durante todo o movimento.",
  "leg press": "Não trave os joelhos na extensão completa. Desça até 90°.",
  "extensora": "Controle a descida — não deixe o peso cair. Contraia o quadríceps no topo.",
  "flexora": "Não levante o quadril do banco. Controle a fase negativa.",
  "puxada": "Puxe com os cotovelos, não com as mãos. Ombros para baixo.",
  "remada": "Mantenha as costas retas e puxe o peso em direção ao umbigo.",
  "desenvolvimento": "Não arqueie as costas. Mantenha o core contraído.",
  "elevação lateral": "Não suba acima dos ombros e mantenha leve flexão nos cotovelos.",
  "elevacao lateral": "Não suba acima dos ombros e mantenha leve flexão nos cotovelos.",
  "hip thrust": "Aperte os glúteos no topo por 1 segundo. Queixo no peito.",
  "afundo": "Joelho de trás desce em direção ao chão, tronco reto.",
  "avanco": "Joelho de trás desce em direção ao chão, tronco reto.",
  "panturrilha": "Suba até a ponta dos pés e segure 1 segundo. Desça devagar.",
  "flexao": "Cotovelos a 45° do corpo, não abertos. Core contraído.",
  "mergulho": "Não desça além de 90° nos cotovelos para proteger os ombros.",
  "pullover": "Não flexione demais os cotovelos. Sinta a abertura no peito.",
  "crucifixo": "Leve flexão nos cotovelos e desça até sentir o alongamento no peito.",
  "terra": "Costas retas, barra próxima ao corpo. Empurre o chão com os pés.",
  "lunge": "Mantenha o tronco ereto e o joelho da frente alinhado com o tornozelo.",
  "burpee": "Controle a descida ao chão — não se jogue. Mantenha o core firme.",
  "polichinelo": "Aterrisse com os joelhos levemente flexionados para absorver o impacto.",
  "mountain": "Mantenha o quadril baixo e alinhado. Não suba demais.",
  "superman": "Suba braços e pernas ao mesmo tempo, segure 2 segundos.",
  "bird dog": "Estenda braço e perna opostos mantendo o tronco estável.",
  "dead bug": "Mantenha a lombar colada no chão durante todo o movimento.",
  "russian twist": "Gire o tronco, não apenas os braços. Core sempre contraído.",
  "plank": "Corpo em linha reta. Não deixe o quadril subir ou cair.",
  "wall sit": "Joelhos a 90°, costas coladas na parede, não descanse as mãos nas coxas.",
  "donkey kick": "Não balance — contraia o glúteo no topo e controle a descida.",
  "face pull": "Puxe em direção ao rosto com os cotovelos altos. Ombros para trás.",
  "encolhimento": "Suba os ombros em direção às orelhas. Sem rotação.",
  "good morning": "Costas retas, flexione no quadril. Leve flexão nos joelhos.",
  "bulgaro": "Mantenha o tronco ereto e desça controlando. Joelho da frente não ultrapassa o pé.",
  "hack": "Costas coladas no encosto, desça até 90° nos joelhos.",
  "voador": "Mantenha leve flexão nos cotovelos e controle a abertura.",
  "cross": "Cruze as mãos à frente mantendo leve flexão nos cotovelos.",
  "triceps": "Mantenha os cotovelos próximos ao corpo. Não use impulso.",
  "passada": "Mantenha o tronco ereto e o joelho da frente alinhado com o tornozelo.",
};

/** Find a fallback tip by matching exercise name keywords */
export function findFallbackTip(name: string): string | null {
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s*\(.*\)$/, "");
  for (const [key, tip] of Object.entries(FALLBACK_TIPS)) {
    if (normalized.includes(key)) return tip;
  }
  return null;
}
