import { useEffect, useState, useRef } from "react";
import { searchExercisesMW, getProxiedMediaUrl } from "@/services/muscleWikiService";
import { cache } from "@/services/cacheService";

// ─── PT → EN exercise name map for common exercises ───
const EXERCISE_PT_EN: Record<string, string> = {
  "agachamento": "squat",
  "agachamento livre": "barbell squat",
  "agachamento smith": "smith machine squat",
  "agachamento sem peso": "bodyweight squat",
  "agachamento bulgaro": "bulgarian split squat",
  "agachamento búlgaro": "bulgarian split squat",
  "leg press": "leg press",
  "leg press 45": "leg press",
  "extensora": "leg extension",
  "flexora": "leg curl",
  "cadeira extensora": "leg extension",
  "cadeira flexora": "leg curl",
  "stiff": "romanian deadlift",
  "levantamento terra": "deadlift",
  "hip thrust": "hip thrust",
  "elevação pélvica": "hip thrust",
  "elevacao pelvica": "hip thrust",
  "ponte de gluteo": "glute bridge",
  "ponte de glúteo": "glute bridge",
  "ponte de gluteos": "glute bridge",
  "ponte de glúteos": "glute bridge",
  "ponte gluteo": "glute bridge",
  "abdutora": "hip abduction",
  "adutora": "hip adduction",
  "cadeira abdutora": "hip abduction machine",
  "cadeira adutora": "hip adduction machine",
  "panturrilha": "calf raise",
  "panturrilha em pe": "standing calf raise",
  "panturrilha em pé": "standing calf raise",
  "panturrilha sentada": "seated calf raise",
  "supino reto": "bench press",
  "supino inclinado": "incline bench press",
  "supino declinado": "decline bench press",
  "crucifixo": "dumbbell fly",
  "puxada frontal": "lat pulldown",
  "puxada": "lat pulldown",
  "remada curvada": "bent over row",
  "remada baixa": "seated cable row",
  "remada cavaleiro": "t-bar row",
  "desenvolvimento": "overhead press",
  "elevação lateral": "lateral raise",
  "elevacao lateral": "lateral raise",
  "elevação frontal": "front raise",
  "elevacao frontal": "front raise",
  "rosca direta": "barbell curl",
  "rosca alternada": "dumbbell curl",
  "rosca martelo": "hammer curl",
  "rosca scott": "preacher curl",
  "tríceps pulley": "tricep pushdown",
  "triceps pulley": "tricep pushdown",
  "tríceps testa": "skull crusher",
  "triceps testa": "skull crusher",
  "tríceps corda": "tricep rope pushdown",
  "triceps corda": "tricep rope pushdown",
  "abdominal": "crunches",
  "abdominal crunch": "crunches",
  "abdominal supra": "crunches",
  "prancha": "plank",
  "prancha frontal": "plank",
  "prancha lateral": "side plank",
  "afundo": "lunge",
  "avanço": "lunge",
  "avanco": "lunge",
  "búlgaro": "bulgarian split squat",
  "bulgaro": "bulgarian split squat",
  "kickback": "glute kickback",
  "kickback de gluteo": "glute kickback",
  "kickback de glúteo": "glute kickback",
  "kickback gluteo": "glute kickback",
  "glúteo kickback": "glute kickback",
  "gluteo kickback": "glute kickback",
  "marcha estacionária": "march",
  "marcha estacionaria": "march",
  "rotação de quadril": "hip circle",
  "rotacao de quadril": "hip circle",
  "alongamento de quadríceps": "quad stretch",
  "alongamento de quadriceps": "quad stretch",
  "alongamento posterior": "hamstring stretch",
  "borboleta": "butterfly stretch",
  "polichinelo": "jumping jack",
  "flexão": "push up",
  "flexao": "push up",
  "flexão de braço": "push up",
  "flexao de braco": "push up",
  "mergulho": "dip",
  "pullover": "pullover",
  "face pull": "face pull",
  "encolhimento": "shrug",
  "passada": "lunge",
  "terra romeno": "romanian deadlift",
  "bom dia": "good morning",
  "good morning": "good morning",
  "mesa flexora": "lying leg curl",
  "hack squat": "hack squat",
  "hack": "hack squat",
  "leg curl": "leg curl",
  "leg extension": "leg extension",
  "smith": "smith machine squat",
  "remada alta": "upright row",
  "crucifixo inclinado": "incline dumbbell fly",
  "voador": "pec deck fly",
  "peck deck": "pec deck fly",
  "cross over": "cable crossover",
  "crossover": "cable crossover",
  "rosca concentrada": "concentration curl",
  "rosca inversa": "reverse curl",
  "triceps banco": "bench dip",
  "triceps frances": "overhead tricep extension",
  "tríceps francês": "overhead tricep extension",
  "abdominal infra": "reverse crunch",
  "abdominal obliquo": "oblique crunch",
  "abdominal oblíquo": "oblique crunch",
  "elevacao de pernas": "leg raise",
  "elevação de pernas": "leg raise",
  "russian twist": "russian twist",
  "superman": "superman",
  "bird dog": "bird dog",
  "dead bug": "dead bug",
  "mountain climber": "mountain climber",
  "burpee": "burpee",
  "step up": "step up",
  "calf raise": "calf raise",
  "agachamento na parede": "wall sit",
  "agachamento parede": "wall sit",
  "wall sit": "wall sit",
  "agachamento isometrico": "wall sit",
  "agachamento isométrico": "wall sit",
  "agachamento com halter": "dumbbell squat",
  "agachamento goblet": "goblet squat",
  "goblet squat": "goblet squat",
  "elevação de quadril": "hip thrust",
  "elevacao de quadril": "hip thrust",
  "gluteo em 4 apoios": "donkey kick",
  "glúteo em 4 apoios": "donkey kick",
  "donkey kick": "donkey kick",
  "abducao de quadril": "hip abduction",
  "abdução de quadril": "hip abduction",
  "aducao de quadril": "hip adduction",
  "adução de quadril": "hip adduction",
  "agachamento sumô": "sumo squat",
  "agachamento sumo": "sumo squat",
  "terra sumo": "sumo deadlift",
  "levantamento terra sumo": "sumo deadlift",
  "remada unilateral": "single arm dumbbell row",
  "puxada supinada": "reverse grip lat pulldown",
  "desenvolvimento com halteres": "dumbbell shoulder press",
  "supino com halteres": "dumbbell bench press",
  "supino reto com halteres": "dumbbell bench press",
  "rosca inclinada": "incline dumbbell curl",
  "tríceps mergulho": "dip",
  "triceps mergulho": "dip",
};

/**
 * Normalize a PT exercise name for lookup:
 * - lowercase, trim, strip parenthetical, remove accents, remove trailing 's'
 */
function normalizeName(name: string): string {
  return name
    .replace(/\s*\(.*\)$/, "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // strip accents
}

/**
 * Look up English name from PT name using multiple normalization strategies
 */
function findEnglishName(name: string): string | null {
  const raw = name.replace(/\s*\(.*\)$/, "").toLowerCase().trim();
  
  // Try exact match first (with accents)
  if (EXERCISE_PT_EN[raw]) return EXERCISE_PT_EN[raw];
  
  // Try without accents
  const noAccents = normalizeName(name);
  if (EXERCISE_PT_EN[noAccents]) return EXERCISE_PT_EN[noAccents];
  
  // Try without trailing 's' (plural)
  const singular = noAccents.replace(/s$/, "");
  if (EXERCISE_PT_EN[singular]) return EXERCISE_PT_EN[singular];
  
  // Try with trailing 's' (singular → plural)
  if (EXERCISE_PT_EN[noAccents + "s"]) return EXERCISE_PT_EN[noAccents + "s"];
  
  // Try partial match (first 2+ words)
  const words = noAccents.split(/\s+/);
  if (words.length >= 2) {
    for (let len = words.length; len >= 2; len--) {
      const partial = words.slice(0, len).join(" ");
      if (EXERCISE_PT_EN[partial]) return EXERCISE_PT_EN[partial];
      const partialSingular = partial.replace(/s$/, "");
      if (EXERCISE_PT_EN[partialSingular]) return EXERCISE_PT_EN[partialSingular];
    }
  }
  
  return null;
}

export async function resolveExerciseMedia(
  name: string
): Promise<{ video?: string; image?: string }> {
  const key = normalizeName(name);
  const cacheKey = `mw:media:v2:${key}`;

  // Check IndexedDB cache first (7 days TTL for hits)
  const cached = await cache.get<{ video?: string; image?: string }>(cacheKey);
  if (cached !== null && (cached.video || cached.image)) return cached;

  /**
   * Check if a MuscleWiki result name is relevant to the search query.
   * Compares normalized words to ensure meaningful overlap.
   */
  const isRelevantResult = (resultName: string, query: string): boolean => {
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9\s]/g, "").trim();
    const resultWords = new Set(normalize(resultName).split(/\s+/).filter(w => w.length > 2));
    const queryWords = normalize(query).split(/\s+/).filter(w => w.length > 2);
    if (queryWords.length === 0) return true;
    // At least one significant query word must appear in the result
    const matchCount = queryWords.filter(w => resultWords.has(w)).length;
    return matchCount >= 1 && matchCount >= Math.ceil(queryWords.length * 0.4);
  };

  const trySearch = async (query: string): Promise<{ video?: string; image?: string } | null> => {
    try {
      const results = await searchExercisesMW(query, 5);
      // Find the first result that actually matches the query
      for (const ex of results) {
        if (!isRelevantResult(ex.name, query)) continue;
        const video = ex.videos?.find((v) => v.gender === "female") || ex.videos?.[0];
        const result: { video?: string; image?: string } = {};
        if (video?.url) result.video = getProxiedMediaUrl(video.url);
        if (video?.og_image) result.image = getProxiedMediaUrl(video.og_image);
        if (result.video || result.image) return result;
      }
    } catch {
      // silently fail
    }
    return null;
  };

  // Strategy 1: Try English translation first (most reliable)
  const enName = findEnglishName(name);
  let result: { video?: string; image?: string } | null = null;
  
  if (enName) {
    result = await trySearch(enName);
  }

  // Strategy 2: Try original name
  if (!result) {
    result = await trySearch(name.replace(/\s*\(.*\)$/, "").trim());
  }
  
  // Strategy 3: Try first 2 words of English name
  if (!result && enName) {
    const words = enName.split(/\s+/);
    if (words.length >= 2) {
      result = await trySearch(words.slice(0, 2).join(" "));
    }
  }

  const final = result || {};
  // 7 days for hits, 5 min for misses (retry sooner)
  const ttl = (final.video || final.image) ? cache.TTL.VERY_LONG : cache.TTL.SHORT;
  await cache.set(cacheKey, final, ttl);
  return final;
}

/**
 * Hook: resolves MuscleWiki media (video/image) for a list of exercise names.
 * Returns Record<name, {video?, image?}>
 */
export function useMuscleWikiMedia(names: string[]) {
  const [media, setMedia] = useState<Record<string, { video?: string; image?: string }>>({});
  const [loading, setLoading] = useState(false);
  const resolvedRef = useRef(new Set<string>());

  useEffect(() => {
    if (names.length === 0) return;

    const toResolve = names.filter((n) => !resolvedRef.current.has(normalizeName(n)));
    if (toResolve.length === 0) return;

    setLoading(true);

    Promise.allSettled(
      toResolve.map(async (name) => {
        const result = await resolveExerciseMedia(name);
        resolvedRef.current.add(normalizeName(name));
        return { name, result };
      })
    ).then((results) => {
      const newMedia: Record<string, { video?: string; image?: string }> = {};
      for (const r of results) {
        if (r.status === "fulfilled") {
          newMedia[r.value.name] = r.value.result;
        }
      }
      setMedia((prev) => ({ ...prev, ...newMedia }));
      setLoading(false);
    });
  }, [names.join(",")]);

  return { media, loading };
}
