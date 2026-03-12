const BASE = "https://wger.de/api/v2";

export interface WgerMuscle {
  id: number;
  name: string;
  name_en: string;
  is_front: boolean;
  image_url_main: string;
  image_url_secondary: string;
}

export interface WgerEquipment {
  id: number;
  name: string;
}

export interface WgerExercise {
  id: number;
  uuid: string;
  category: number;
  muscles: number[];
  muscles_secondary: number[];
  equipment: number[];
}

export interface WgerExerciseInfo {
  id: number;
  category: { id: number; name: string };
  muscles: WgerMuscle[];
  muscles_secondary: WgerMuscle[];
  equipment: WgerEquipment[];
  images: { id: number; image: string; is_main: boolean }[];
  translations: {
    id: number;
    name: string;
    description: string;
    language: number;
    aliases: { alias: string }[];
  }[];
  videos: { id: number; video: string }[];
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Cache
let musclesCache: WgerMuscle[] | null = null;
let equipmentCache: WgerEquipment[] | null = null;

export const fetchMuscles = async (): Promise<WgerMuscle[]> => {
  if (musclesCache) return musclesCache;
  const res = await fetch(`${BASE}/muscle/?format=json&limit=100`);
  if (!res.ok) throw new Error(`Wger muscles error: ${res.status}`);
  const data: PaginatedResponse<WgerMuscle> = await res.json();
  musclesCache = data.results;
  return data.results;
};

export const fetchEquipment = async (): Promise<WgerEquipment[]> => {
  if (equipmentCache) return equipmentCache;
  const res = await fetch(`${BASE}/equipment/?format=json&limit=100`);
  if (!res.ok) throw new Error(`Wger equipment error: ${res.status}`);
  const data: PaginatedResponse<WgerEquipment> = await res.json();
  equipmentCache = data.results;
  return data.results;
};

export const searchExercises = async (
  params: {
    language?: number;
    limit?: number;
    offset?: number;
    muscles?: number;
    equipment?: number;
    category?: number;
  } = {}
): Promise<PaginatedResponse<WgerExercise>> => {
  const { language = 2, limit = 20, offset = 0, muscles, equipment, category } = params;
  const url = new URL(`${BASE}/exercise/`);
  url.searchParams.set("language", String(language));
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("format", "json");
  if (muscles) url.searchParams.set("muscles", String(muscles));
  if (equipment) url.searchParams.set("equipment", String(equipment));
  if (category) url.searchParams.set("category", String(category));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Wger exercises error: ${res.status}`);
  return res.json();
};

export const fetchExerciseInfo = async (id: number): Promise<WgerExerciseInfo> => {
  const res = await fetch(`${BASE}/exerciseinfo/${id}/?format=json`);
  if (!res.ok) throw new Error(`Wger exerciseinfo error: ${res.status}`);
  return res.json();
};

// Helpers
export const getPortugueseTranslation = (info: WgerExerciseInfo) => {
  const pt = info.translations.find((t) => t.language === 2);
  return pt || info.translations[0] || null;
};

export const getExerciseMainImage = (info: WgerExerciseInfo): string | null => {
  const main = info.images.find((i) => i.is_main);
  return main?.image || info.images[0]?.image || null;
};

// Muscle name translation map
export const MUSCLE_PT: Record<number, string> = {
  2: "Deltóide Anterior",
  1: "Bíceps",
  11: "Posterior de Coxa",
  13: "Braquial",
  7: "Panturrilha",
  8: "Glúteos",
  12: "Latíssimo do Dorso",
  14: "Oblíquos",
  4: "Peitoral",
  3: "Deltóide Posterior",
  10: "Quadríceps",
  6: "Reto Abdominal",
  15: "Serrátil Anterior",
  9: "Trapézio",
  5: "Tríceps",
};

export const EQUIPMENT_PT: Record<number, string> = {
  1: "Barra",
  8: "Banco",
  3: "Halter",
  4: "Colchonete",
  9: "Banco Inclinado",
  10: "Kettlebell",
  6: "Barra Fixa",
  11: "Elástico",
  2: "Barra EZ",
  5: "Bola Suíça",
  7: "Sem equipamento",
};
