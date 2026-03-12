import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Play, Clock, Dumbbell, Flame, ChevronRight, Zap } from "lucide-react";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";

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

interface CuratedExercise {
  name_pt: string;
  gif_url: string | null;
  target: string;
  body_part: string;
}

interface WorkoutInfo {
  id: string;
  title: string;
  description: string | null;
}

const AppWorkoutDetail = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { user, subscribed, subscriptionLoading } = useAuth();

  const [workout, setWorkout] = useState<WorkoutInfo | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [curatedMap, setCuratedMap] = useState<Record<string, CuratedExercise>>({});
  const [loading, setLoading] = useState(true);

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
      // Fetch curated data for GIFs
      const names = exerciseRes.data.map(e => e.name);
      if (names.length > 0) {
        const { data: curated } = await supabase
          .from("curated_exercises")
          .select("name_pt, gif_url, target, body_part")
          .in("name_pt", names);
        if (curated) {
          const map: Record<string, CuratedExercise> = {};
          curated.forEach(c => { map[c.name_pt] = c; });
          setCuratedMap(map);
        }
      }
    }
    setLoading(false);
  };

  const estimatedTime = exercises.length > 0
    ? Math.round(exercises.reduce((acc, ex) => acc + ex.sets * 1.5 + (ex.sets - 1) * (ex.rest_seconds / 60), 0) + 10)
    : 0;

  const muscleTags = [...new Set(exercises.map(e => e.description).filter(Boolean))].slice(0, 5);
  const totalSets = exercises.reduce((a, e) => a + e.sets, 0);

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
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
            {new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(new Date())}
          </p>
          <h1 className="text-2xl font-bold tracking-tight mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
            {workout?.title}
          </h1>
          {workout?.description && (
            <p className="text-sm text-muted-foreground">{workout.description}</p>
          )}
        </div>
      </header>

      {/* Stats Row */}
      <section className="px-5 py-4">
        <div className="max-w-lg mx-auto flex gap-3">
          {[
            { icon: Clock, label: "Duração", value: `~${estimatedTime} min`, color: "text-info" },
            { icon: Dumbbell, label: "Exercícios", value: `${exercises.length}`, color: "text-primary" },
            { icon: Flame, label: "Calorias", value: `~${Math.round(estimatedTime * 7)} kcal`, color: "text-warning" },
            { icon: Zap, label: "Séries", value: `${totalSets}`, color: "text-success" },
          ].map((stat, i) => (
            <div key={i} className="flex-1 bg-card border border-border rounded-2xl p-3 text-center">
              <stat.icon className={`w-4 h-4 mx-auto mb-1.5 ${stat.color}`} />
              <p className="text-base font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Muscle Tags */}
      {muscleTags.length > 0 && (
        <section className="px-5 pb-3">
          <div className="max-w-lg mx-auto flex gap-2 flex-wrap">
            {muscleTags.map((tag, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
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
            { label: "Aquecimento", time: "~3 min", colorClass: "bg-warning" },
            { label: "Treino", time: `~${Math.max(1, estimatedTime - 6)} min`, colorClass: "bg-primary" },
            { label: "Alongamento", time: "~3 min", colorClass: "bg-purple" },
          ].map((p, i) => (
            <div key={i} className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
              <div className={`w-2 h-2 rounded-full mx-auto mb-2 ${p.colorClass}`} />
              <div className="text-xs font-semibold">{p.label}</div>
              <div className="text-[10px] text-muted-foreground">{p.time}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Exercises List */}
      <section className="px-5">
        <div className="max-w-lg mx-auto">
          <h2 className="text-sm font-semibold mb-3 font-sans">Exercícios</h2>

          <div className="space-y-2">
            {exercises.map((exercise, index) => {
              const curated = curatedMap[exercise.name];
              const thumbUrl = curated?.gif_url || exercise.image_url;

              return (
                <motion.button
                  key={exercise.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => navigate(`/app/exercise/${exercise.id}`)}
                  className="w-full flex items-center gap-3 p-3 bg-card border border-border rounded-2xl text-left group hover:border-primary/30 transition-colors"
                >
                  {/* Thumbnail or Number */}
                  {thumbUrl ? (
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-secondary shrink-0">
                      <img src={thumbUrl} alt={exercise.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {index + 1}
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-0.5 truncate font-sans">{exercise.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {curated?.target || exercise.description || ""}
                    </p>
                  </div>

                  {/* Sets x Reps */}
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <span className="text-sm font-bold text-primary">
                        {exercise.sets}×{exercise.reps}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
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
            className="w-full font-bold py-4 rounded-2xl text-base text-primary-foreground bg-primary shadow-lg shadow-primary/25"
            whileTap={{ scale: 0.97 }}
          >
            <div className="flex items-center justify-center gap-2 font-sans">
              <Play className="w-4 h-4" />
              Começar Treino
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default AppWorkoutDetail;
