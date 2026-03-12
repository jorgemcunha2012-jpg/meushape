import { cache } from "./cacheService";

const BASE = "https://api.musclewiki.com";
const API_KEY = "mw_N952p5CPQqKkdUcCyE4dTrFIG2Hd6de0AVXgp1Oyjhs";

const headers = { "X-API-Key": API_KEY };

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

// ─── Caches ───
let musclesCache: MWMuscle[] | null = null;
let categoriesCache: MWCategory[] | null = null;
let filtersCache: MWFilters | null = null;

// ─── API Functions ───

export const fetchMuscles = async (): Promise<MWMuscle[]> => {
  if (musclesCache) return musclesCache;
  const res = await fetch(`${BASE}/muscles`, { headers });
  if (!res.ok) throw new Error(`MuscleWiki muscles error: ${res.status}`);
  musclesCache = await res.json();
  return musclesCache!;
};

export const fetchCategories = async (): Promise<MWCategory[]> => {
  if (categoriesCache) return categoriesCache;
  const res = await fetch(`${BASE}/categories`, { headers });
  if (!res.ok) throw new Error(`MuscleWiki categories error: ${res.status}`);
  categoriesCache = await res.json();
  return categoriesCache!;
};

export const fetchFilters = async (): Promise<MWFilters> => {
  if (filtersCache) return filtersCache;
  const res = await fetch(`${BASE}/filters`, { headers });
  if (!res.ok) throw new Error(`MuscleWiki filters error: ${res.status}`);
  filtersCache = await res.json();
  return filtersCache!;
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
  const url = new URL(`${BASE}/exercises`);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  if (category) url.searchParams.set("category", category);
  if (muscles) url.searchParams.set("muscles", muscles);
  if (difficulty) url.searchParams.set("difficulty", difficulty);
  if (gender) url.searchParams.set("gender", gender);

  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`MuscleWiki exercises error: ${res.status}`);
  return res.json();
};

export const fetchExerciseDetail = async (id: number): Promise<MWExerciseDetail> => {
  const res = await fetch(`${BASE}/exercises/${id}`, { headers });
  if (!res.ok) throw new Error(`MuscleWiki exercise detail error: ${res.status}`);
  return res.json();
};

export const searchExercisesMW = async (query: string, limit = 20): Promise<MWExerciseDetail[]> => {
  const res = await fetch(`${BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`, { headers });
  if (!res.ok) throw new Error(`MuscleWiki search error: ${res.status}`);
  return res.json();
};

// ─── Media URL helper ───
// Videos/images need the API key header — we proxy through an edge function
export const getProxiedMediaUrl = (originalUrl: string): string => {
  if (!originalUrl) return "";
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  return `https://${projectId}.supabase.co/functions/v1/musclewiki-media?url=${encodeURIComponent(originalUrl)}`;
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
