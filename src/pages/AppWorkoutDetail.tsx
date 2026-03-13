import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Play, Clock, Dumbbell, Flame, ChevronRight, Lightbulb } from "lucide-react";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";
import { useMuscleWikiMedia } from "@/hooks/useMuscleWikiMedia";
import ExerciseThumbnail from "@/components/ExerciseThumbnail";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  sets: number;
  reps: string;
  rest_seconds: number;
  image_url: string | null;
  sort_order: number;
}

interface WorkoutInfo {
  id: string;
  title: string;
  description: string | null;
}

/** Fallback tips for common exercises when curated data is unavailable */
const FALLBACK_TIPS: Record<string, string> = {
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
function findFallbackTip(name: string): string | null {
  const normalized = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s*\(.*\)$/, "");
  for (const [key, tip] of Object.entries(FALLBACK_TIPS)) {
    if (normalized.includes(key)) return tip;
  }
  return null;
}

const AppWorkoutDetail = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const S = useSolar();
  const { user, subscribed, subscriptionLoading } = useAuth();

  const [workout, setWorkout] = useState<WorkoutInfo | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState<Record<string, string>>({});

  const exerciseNames = useMemo(() => exercises.map(e => e.name), [exercises]);
  const { media: mwMedia, loading: mediaLoading } = useMuscleWikiMedia(exerciseNames);

  useEffect(() => {
    if (!subscriptionLoading && !user) {
      navigate("/app/login");
      return;
    }
    if (workoutId) fetchWorkout();
  }, [workoutId, user, subscribed, subscriptionLoading, navigate]);

  const fetchWorkout = async () => {
    setLoading(true);
    const [workoutRes, exerciseRes] = await Promise.all([
      supabase.from("workouts").select("id, title, description").eq("id", workoutId!).single(),
      supabase.from("exercises").select("*").eq("workout_id", workoutId!).order("sort_order"),
    ]);

    if (workoutRes.data) setWorkout(workoutRes.data);
    if (exerciseRes.data) {
      setExercises(exerciseRes.data);
      fetchTips(exerciseRes.data);
    }
    setLoading(false);
  };

  const fetchTips = async (exs: Exercise[]) => {
    const names = exs.map(e => e.name);
    const baseNames = exs.map(e => e.name.replace(/\s*\(.*\)$/, ""));
    const allNames = [...new Set([...names, ...baseNames])];

    const { data: curated } = await supabase
      .from("curated_exercises")
      .select("name_pt, common_mistakes_pt")
      .in("name_pt", allNames)
      .not("common_mistakes_pt", "is", null);

    const tipsMap: Record<string, string> = {};

    if (curated) {
      const curatedByName = new Map(curated.map(c => [c.name_pt, c.common_mistakes_pt!]));
      for (const ex of exs) {
        const tip = curatedByName.get(ex.name) || curatedByName.get(ex.name.replace(/\s*\(.*\)$/, ""));
        if (tip) tipsMap[ex.id] = tip;
      }
    }

    // Fill fallback tips
    for (const ex of exs) {
      if (!tipsMap[ex.id]) {
        const fallback = findFallbackTip(ex.name);
        if (fallback) tipsMap[ex.id] = fallback;
      }
    }

    setTips(tipsMap);
  };

  const estimatedTime = exercises.length > 0
    ? Math.round(exercises.reduce((acc, ex) => acc + ex.sets * 1.5 + (ex.sets - 1) * (ex.rest_seconds / 60), 0) + 10)
    : 0;

  const totalSets = exercises.reduce((a, e) => a + e.sets, 0);

  const cardStyle = {
    backgroundColor: S.card,
    border: `1px solid ${S.cardBorder}`,
    borderRadius: "1.25rem",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const stats = [
    { icon: Clock, label: "Duração", value: `~${estimatedTime}`, unit: "min", color: "#3B82F6" },
    { icon: Dumbbell, label: "Exercícios", value: `${exercises.length}`, unit: "", color: S.orange },
    { icon: Flame, label: "Calorias", value: `~${Math.round(estimatedTime * 7)}`, unit: "kcal", color: "#F59E0B" },
  ];

  return (
    <SolarPage>
      <SolarHeader title={workout?.title || "Treino"} showBack />

      {/* Stats Strip */}
      <section className="px-5 py-4">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl gap-2"
              style={{
                background: S.card,
                border: `1px solid ${S.cardBorder}`,
                boxShadow: `0 2px 12px ${S.glow}`,
              }}>
              <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              <div className="flex flex-col items-center gap-0.5">
                <span className="font-display text-lg leading-tight tracking-tight" style={{ fontWeight: 800, color: S.text }}>
                  {stat.value}
                  {stat.unit && <span className="text-xs font-semibold ml-0.5" style={{ color: S.textMuted }}>{stat.unit}</span>}
                </span>
                <span className="text-[11px] font-semibold leading-tight" style={{ color: S.textMuted }}>{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Exercises List */}
      <section className="px-5 pb-28">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-sm mb-3" style={{ fontWeight: 700, color: S.text }}>Exercícios</h2>

          <div className="space-y-2">
            {exercises.map((exercise, index) => {
              const mw = mwMedia[exercise.name];
              const tip = tips[exercise.id];

              return (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <button
                    onClick={() => navigate(`/app/exercise/${exercise.id}`)}
                    className="w-full flex items-center gap-3 p-3 text-left group transition-colors"
                    style={{
                      ...cardStyle,
                      cursor: "pointer",
                      ...(tip ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderBottom: "none" } : {}),
                    }}
                  >
                    <ExerciseThumbnail
                      name={exercise.name}
                      index={index}
                      media={mw}
                      imageUrl={exercise.image_url}
                      mediaLoading={mediaLoading}
                    />

                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm mb-0.5 truncate" style={{ fontWeight: 700, color: S.text }}>
                        {exercise.name.replace(/\s*\(.*\)$/, "")}
                      </h3>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-sm font-display" style={{ fontWeight: 800, color: S.orange }}>
                        {exercise.sets}×{exercise.reps}
                      </span>
                      <ChevronRight className="w-4 h-4" style={{ color: S.cardBorder }} />
                    </div>
                  </button>

                  {/* Golden Tip */}
                  {tip && (
                    <div
                      className="flex items-start gap-2 px-3 py-2.5"
                      style={{
                        background: "rgba(245,158,11,0.06)",
                        border: `1px solid ${S.cardBorder}`,
                        borderTop: "1px solid rgba(245,158,11,0.15)",
                        borderBottomLeftRadius: "1.25rem",
                        borderBottomRightRadius: "1.25rem",
                      }}
                    >
                      <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "#F59E0B" }} />
                      <p className="text-[11px] leading-snug" style={{ color: S.textMuted }}>
                        <span className="font-bold" style={{ color: "#F59E0B" }}>Dica: </span>
                        {tip}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Start Button */}
      <div className="fixed bottom-20 left-0 right-0 px-5 z-10">
        <div className="max-w-lg mx-auto">
          <motion.button
            onClick={() => navigate(`/app/workout/${workoutId}`)}
            className="w-full py-4 rounded-2xl text-base font-display"
            style={{
              fontWeight: 700, color: "#fff",
              background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`,
              boxShadow: `0 4px 16px ${S.glowStrong}`,
            }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Começar Treino
            </div>
          </motion.button>
        </div>
      </div>
    </SolarPage>
  );
};

export default AppWorkoutDetail;
