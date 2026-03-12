import { useEffect, useState, useRef } from "react";
import { searchExercisesMW, getProxiedMediaUrl } from "@/services/muscleWikiService";

// ─── PT → EN exercise name map for common exercises ───
const EXERCISE_PT_EN: Record<string, string> = {
  "agachamento": "squat",
  "agachamento livre": "barbell squat",
  "agachamento smith": "smith machine squat",
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
  "ponte de glúteo": "glute bridge",
  "abdutora": "hip abduction",
  "adutora": "hip adduction",
  "panturrilha": "calf raise",
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
  "elevação frontal": "front raise",
  "rosca direta": "barbell curl",
  "rosca alternada": "dumbbell curl",
  "rosca martelo": "hammer curl",
  "rosca scott": "preacher curl",
  "tríceps pulley": "tricep pushdown",
  "tríceps testa": "skull crusher",
  "tríceps corda": "tricep rope pushdown",
  "abdominal": "crunch",
  "prancha": "plank",
  "prancha frontal": "plank",
  "afundo": "lunge",
  "avanço": "lunge",
  "búlgaro": "bulgarian split squat",
  "agachamento búlgaro": "bulgarian split squat",
  "kickback": "glute kickback",
  "glúteo kickback": "glute kickback",
  "cadeira abdutora": "hip abduction machine",
  "cadeira adutora": "hip adduction machine",
  "marcha estacionária": "march",
  "rotação de quadril": "hip circle",
  "agachamento sem peso": "bodyweight squat",
  "alongamento de quadríceps": "quad stretch",
  "alongamento posterior": "hamstring stretch",
  "borboleta": "butterfly stretch",
  "polichinelo": "jumping jack",
  "flexão": "push up",
  "flexão de braço": "push up",
  "mergulho": "dip",
  "pullover": "pullover",
  "face pull": "face pull",
  "encolhimento": "shrug",
};

// ─── In-memory cache ───
const mediaCache = new Map<string, { video?: string; image?: string }>();

export async function resolveExerciseMedia(
  name: string
): Promise<{ video?: string; image?: string }> {
  const key = name.toLowerCase().trim();
  if (mediaCache.has(key)) return mediaCache.get(key)!;

  const trySearch = async (query: string): Promise<{ video?: string; image?: string } | null> => {
    try {
      const results = await searchExercisesMW(query, 1);
      if (results.length > 0) {
        const ex = results[0];
        const video = ex.videos?.find((v) => v.gender === "female") || ex.videos?.[0];
        const result: { video?: string; image?: string } = {};
        if (video?.url) result.video = getProxiedMediaUrl(video.url);
        if (video?.og_image) result.image = video.og_image;
        if (result.video || result.image) return result;
      }
    } catch {
      // silently fail
    }
    return null;
  };

  // Try original name
  let result = await trySearch(name);

  // Try English translation
  if (!result) {
    const baseName = name.replace(/\s*\(.*\)$/, "").toLowerCase().trim();
    const enName = EXERCISE_PT_EN[baseName];
    if (enName) {
      result = await trySearch(enName);
    }
  }

  const final = result || {};
  mediaCache.set(key, final);
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

    const toResolve = names.filter((n) => !resolvedRef.current.has(n.toLowerCase().trim()));
    if (toResolve.length === 0) return;

    setLoading(true);

    Promise.allSettled(
      toResolve.map(async (name) => {
        const result = await resolveExerciseMedia(name);
        resolvedRef.current.add(name.toLowerCase().trim());
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
