import { cache } from "./cacheService";

// All MuscleWiki API calls are proxied through our edge function to avoid CORS issues
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const PROXY_BASE = `https://${PROJECT_ID}.supabase.co/functions/v1/musclewiki-media`;

/** Build a proxied API URL for a given MuscleWiki endpoint */
function proxyUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(PROXY_BASE);
  url.searchParams.set("endpoint", endpoint);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v) url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

// ─── Types ───

export interface MWExerciseMinimal {
  id: number;
  name: string;
}

export interface MWVideo {
  url: string;
  angle: string;
  gender: string;
  og_image: string;
}

export interface MWExerciseDetail {
  id: number;
  name: string;
  primary_muscles: string[];
  category: string;
  force: string;
  grips: string[];
  mechanic: string;
  difficulty: string;
  steps: string[];
  videos: MWVideo[];
}

export interface MWMuscle {
  name: string;
  count: number;
}

export interface MWCategory {
  name: string;
  display_name: string;
  count: number;
}

export interface MWFilters {
  muscles: string[];
  difficulties: string[];
  forces: string[];
  mechanics: string[];
  grips: string[];
  categories: string[];
}

interface MWListResponse {
  total: number;
  limit: number;
  offset: number;
  count: number;
  results: MWExerciseMinimal[];
}

// ─── API Functions (with cache) ───

export const fetchMuscles = async (): Promise<MWMuscle[]> => {
  return cache.fetchWithCache("mw:muscles", async () => {
    const res = await fetch(proxyUrl("muscles"));
    if (!res.ok) throw new Error(`MuscleWiki muscles error: ${res.status}`);
    return res.json();
  }, cache.TTL.LONG);
};

export const fetchCategories = async (): Promise<MWCategory[]> => {
  return cache.fetchWithCache("mw:categories", async () => {
    const res = await fetch(proxyUrl("categories"));
    if (!res.ok) throw new Error(`MuscleWiki categories error: ${res.status}`);
    return res.json();
  }, cache.TTL.LONG);
};

export const fetchFilters = async (): Promise<MWFilters> => {
  return cache.fetchWithCache("mw:filters", async () => {
    const res = await fetch(proxyUrl("filters"));
    if (!res.ok) throw new Error(`MuscleWiki filters error: ${res.status}`);
    return res.json();
  }, cache.TTL.LONG);
};

export const listExercises = async (params: {
  limit?: number;
  offset?: number;
  category?: string;
  muscles?: string;
  difficulty?: string;
  gender?: string;
}): Promise<MWListResponse> => {
  const { limit = 20, offset = 0, category, muscles, difficulty, gender } = params;
  const cacheKey = `mw:list:${limit}:${offset}:${category || ""}:${muscles || ""}:${difficulty || ""}:${gender || ""}`;

  return cache.fetchWithCache(cacheKey, async () => {
    const res = await fetch(proxyUrl("exercises", {
      limit: String(limit),
      offset: String(offset),
      ...(category && { category }),
      ...(muscles && { muscles }),
      ...(difficulty && { difficulty }),
      ...(gender && { gender }),
    }));
    if (!res.ok) throw new Error(`MuscleWiki exercises error: ${res.status}`);
    return res.json();
  }, cache.TTL.MEDIUM);
};

export const fetchExerciseDetail = async (id: number): Promise<MWExerciseDetail> => {
  return cache.fetchWithCache(`mw:exercise:${id}`, async () => {
    const res = await fetch(proxyUrl(`exercises/${id}`));
    if (!res.ok) throw new Error(`MuscleWiki exercise detail error: ${res.status}`);
    return res.json();
  }, cache.TTL.LONG);
};

export const searchExercisesMW = async (query: string, limit = 20): Promise<MWExerciseDetail[]> => {
  const cacheKey = `mw:search:${query.toLowerCase().trim()}:${limit}`;
  return cache.fetchWithCache(cacheKey, async () => {
    const res = await fetch(proxyUrl("search", { q: query, limit: String(limit) }));
    if (!res.ok) throw new Error(`MuscleWiki search error: ${res.status}`);
    return res.json();
  }, cache.TTL.SHORT);
};

// ─── Media URL helper ───
export const getProxiedMediaUrl = (originalUrl: string): string => {
  if (!originalUrl) return "";
  return `${PROXY_BASE}?url=${encodeURIComponent(originalUrl)}`;
};

// ─── Translation helpers ───
export const MUSCLE_PT: Record<string, string> = {
  "Abdominals": "Abdominais",
  "Anterior Deltoid": "Deltóide Anterior",
  "Biceps": "Bíceps",
  "Calves": "Panturrilhas",
  "Chest": "Peito",
  "Feet": "Pés",
  "Forearms": "Antebraços",
  "Front Shoulders": "Ombros Frontais",
  "Gastrocnemius": "Gastrocnêmio",
  "Glutes": "Glúteos",
  "Gluteus Maximus": "Glúteo Máximo",
  "Gluteus Medius": "Glúteo Médio",
  "Groin": "Virilha",
  "Hamstrings": "Posteriores",
  "Inner Quadriceps": "Quadríceps Interno",
  "Inner Thigh": "Coxa Interna",
  "Lateral Deltoid": "Deltóide Lateral",
  "Lateral Hamstrings": "Posterior Lateral",
  "Lats": "Latíssimo",
  "Long Head Bicep": "Bíceps Cabeça Longa",
  "Long Head Tricep": "Tríceps Cabeça Longa",
  "Lower Abdominals": "Abdômen Inferior",
  "Lower Traps": "Trapézio Inferior",
  "Lower back": "Lombar",
  "Medial Hamstrings": "Posterior Medial",
  "Mid and Lower Chest": "Peitoral Médio/Inferior",
  "Neck": "Pescoço",
  "Obliques": "Oblíquos",
  "Outer Quadricep": "Quadríceps Externo",
  "Posterior Deltoid": "Deltóide Posterior",
  "Quads": "Quadríceps",
  "Rear Shoulders": "Ombros Posteriores",
  "Rectus Femoris": "Reto Femoral",
  "Short Head Bicep": "Bíceps Cabeça Curta",
  "Shoulders": "Ombros",
  "Soleus": "Sóleo",
  "Tibialis": "Tibial",
  "Traps": "Trapézio",
  "Traps (mid-back)": "Trapézio Médio",
  "Triceps": "Tríceps",
  "Upper Abdominals": "Abdômen Superior",
  "Upper Pectoralis": "Peitoral Superior",
  "Upper Traps": "Trapézio Superior",
  "Wrist Extensors": "Extensores do Punho",
  "Wrist Flexors": "Flexores do Punho",
};

export const CATEGORY_PT: Record<string, string> = {
  "band": "Elástico",
  "barbell": "Barra",
  "bodyweight": "Peso Corporal",
  "bosu-ball": "Bosu",
  "cables": "Cabos",
  "cardio": "Cardio",
  "dumbbells": "Halteres",
  "kettlebells": "Kettlebell",
  "machine": "Máquina",
  "medicine-ball": "Bola Medicinal",
  "medicineball": "Bola Medicinal",
  "pilates": "Pilates",
  "plate": "Anilha",
  "recovery": "Recuperação",
  "smith-machine": "Smith",
  "stretches": "Alongamentos",
  "trx": "TRX",
  "vitruvian": "Vitruvian",
  "yoga": "Yoga",
};

export const DIFFICULTY_PT: Record<string, string> = {
  "Beginner": "Iniciante",
  "Novice": "Novato",
  "Intermediate": "Intermediário",
  "Advanced": "Avançado",
};

// Main muscles for simplified filter (most popular groups)
export const MAIN_MUSCLES = [
  "Chest", "Lats", "Shoulders", "Biceps", "Triceps",
  "Quads", "Hamstrings", "Glutes", "Calves", "Abdominals",
  "Obliques", "Lower back", "Forearms", "Traps",
];
