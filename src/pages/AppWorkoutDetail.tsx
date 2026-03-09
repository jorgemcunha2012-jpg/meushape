import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Clock, Dumbbell, Flame, ChevronRight } from "lucide-react";

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

// Meu Shape colors
const C = {
  accent: "#E94560",
  accentGlow: "rgba(233,69,96,0.25)",
  yellow: "#F5A623",
  purple: "#6C63FF",
};

const AppWorkoutDetail = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { user, subscribed, subscriptionLoading } = useAuth();

  const [workout, setWorkout] = useState<WorkoutInfo | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subscriptionLoading && !subscribed && user) {
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

  // Collect unique muscle targets from exercise descriptions
  const muscleTags = [...new Set(exercises.map((e) => e.description).filter(Boolean))].slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="px-5 pt-10 pb-2">
        <div className="max-w-lg mx-auto">
          <button
            onClick={() => navigate("/app/workouts")}
            className="w-9 h-9 rounded-full bg-card/80 flex items-center justify-center text-muted-foreground hover:text-foreground mb-4"
            style={{ border: "1px solid hsl(var(--border))" }}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div
            className="text-xs font-semibold mb-2 uppercase tracking-widest"
            style={{ color: C.accent, letterSpacing: "1px" }}
          >
            {new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(new Date())}
          </div>
          <h1 className="text-2xl font-bold mb-1 tracking-tight">{workout?.title}</h1>

          <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> ~{estimatedTime} min
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3.5 h-3.5" /> {exercises.length} exercícios
            </span>
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> ~320 kcal
            </span>
          </div>
        </div>
      </header>

      {/* Muscle Tags */}
      {muscleTags.length > 0 && (
        <section className="px-5 py-4">
          <div className="max-w-lg mx-auto flex gap-2 flex-wrap">
            {muscleTags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: `${C.accent}15`, color: C.accent }}
              >
                {tag}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Phase Overview */}
      <section className="px-5 pb-4">
        <div className="max-w-lg mx-auto flex gap-2">
          {[
            { label: "Aquecimento", time: "~3 min", color: C.yellow },
            { label: "Treino", time: `~${estimatedTime - 6} min`, color: C.accent },
            { label: "Alongamento", time: "~3 min", color: C.purple },
          ].map((p, i) => (
            <div
              key={i}
              className="flex-1 p-3 rounded-xl text-center"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
            >
              <div
                className="w-2 h-2 rounded-full mx-auto mb-2"
                style={{ backgroundColor: p.color }}
              />
              <div className="text-xs font-semibold text-foreground">{p.label}</div>
              <div className="text-[10px] text-muted-foreground">{p.time}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Exercises List */}
      <section className="px-5">
        <div className="max-w-lg mx-auto">
          <h2 className="text-sm font-semibold mb-3">Exercícios</h2>

          <div className="space-y-0">
            {exercises.map((exercise, index) => (
              <motion.button
                key={exercise.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => navigate(`/app/exercise/${exercise.id}`)}
                className="w-full flex items-center gap-3 py-3 border-b text-left group"
                style={{ borderColor: "hsl(var(--border))" }}
              >
                {/* Number */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                  style={{
                    background: "hsl(var(--secondary))",
                    border: "1px solid hsl(var(--border))",
                    color: C.accent,
                  }}
                >
                  {index + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm mb-0.5 truncate">{exercise.name}</h3>
                  {exercise.description && (
                    <p className="text-xs text-muted-foreground truncate">{exercise.description}</p>
                  )}
                </div>

                {/* Sets x Reps */}
                <div className="text-right shrink-0">
                  <span className="text-sm font-semibold">
                    {exercise.sets}×{exercise.reps}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Start Button - Fixed */}
      <div className="fixed bottom-20 left-0 right-0 px-5 z-10">
        <div className="max-w-lg mx-auto">
          <motion.button
            onClick={() => navigate(`/app/workout/${workoutId}`)}
            className="w-full font-bold py-4 rounded-xl text-base text-white"
            style={{
              backgroundColor: C.accent,
              boxShadow: `0 4px 20px ${C.accentGlow}`,
            }}
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex items-center justify-center gap-2">
              <Play className="w-4 h-4" />
              Começar Treino →
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AppWorkoutDetail;
