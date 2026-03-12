import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Play, Clock, Dumbbell, Flame, ChevronRight, Zap } from "lucide-react";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";
import { useMuscleWikiMedia } from "@/hooks/useMuscleWikiMedia";

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

const AppWorkoutDetail = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const S = useSolar();
  const { user, subscribed, subscriptionLoading } = useAuth();

  const [workout, setWorkout] = useState<WorkoutInfo | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

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
    if (exerciseRes.data) setExercises(exerciseRes.data);
    setLoading(false);
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
    { icon: Zap, label: "Séries", value: `${totalSets}`, unit: "", color: "#22C55E" },
  ];

  return (
    <SolarPage>
      <SolarHeader title={workout?.title || "Treino"} showBack />

      {/* Stats Strip */}
      <section className="px-5 py-3">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-2">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center py-2.5 px-1 rounded-xl"
              style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <stat.icon className="w-4 h-4 mb-1" style={{ color: stat.color }} />
              <span className="font-display text-sm leading-none" style={{ fontWeight: 800, color: S.text }}>
                {stat.value}{stat.unit && <span className="text-[9px] font-semibold" style={{ color: S.textMuted }}> {stat.unit}</span>}
              </span>
              <span className="text-[9px] mt-0.5 font-semibold" style={{ color: S.textMuted }}>{stat.label}</span>
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
              const thumbUrl = mw?.image || exercise.image_url;

              return (
                <motion.button
                  key={exercise.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => navigate(`/app/exercise/${exercise.id}`)}
                  className="w-full flex items-center gap-3 p-3 text-left group transition-colors"
                  style={{ ...cardStyle, cursor: "pointer" }}
                >
                  {/* Thumbnail or Number */}
                  {thumbUrl ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                      style={{ background: `${S.orange}12`, border: `1px solid ${S.cardBorder}` }}>
                      <img
                        src={thumbUrl}
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (parent) {
                            parent.classList.add("flex", "items-center", "justify-center");
                            parent.innerHTML = `<span style="font-weight:800;color:${S.orange}" class="font-display text-sm">${index + 1}</span>`;
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm shrink-0 font-display"
                      style={{
                        fontWeight: 800, background: `${S.orange}12`, color: S.orange,
                        border: `1px solid ${S.cardBorder}`,
                      }}>
                      {index + 1}
                    </div>
                  )}

                  {/* Info */}
                   <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm mb-0.5 truncate" style={{ fontWeight: 700, color: S.text }}>
                      {exercise.name.replace(/\s*\(.*\)$/, "")}
                    </h3>
                  </div>

                  {/* Sets x Reps */}
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-sm font-display" style={{ fontWeight: 800, color: S.orange }}>
                      {exercise.sets}×{exercise.reps}
                    </span>
                    <ChevronRight className="w-4 h-4" style={{ color: S.cardBorder }} />
                  </div>
                </motion.button>
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
