import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Timer, RotateCcw, Play, Pause } from "lucide-react";
import { toast } from "sonner";

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

const AppWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workout, setWorkout] = useState<WorkoutInfo | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [restTarget, setRestTarget] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (workoutId) fetchWorkout();
  }, [workoutId]);

  // Rest timer
  useEffect(() => {
    if (!timerRunning || restTimer === null) return;
    if (restTimer <= 0) {
      setTimerRunning(false);
      toast.info("⏰ Descanso acabou! Bora pro próximo!");
      return;
    }
    const interval = setInterval(() => setRestTimer((t) => (t || 0) - 1), 1000);
    return () => clearInterval(interval);
  }, [timerRunning, restTimer]);

  const fetchWorkout = async () => {
    const { data: wk } = await supabase
      .from("workouts")
      .select("id, title, description")
      .eq("id", workoutId!)
      .single();
    if (wk) setWorkout(wk);

    const { data: exs } = await supabase
      .from("exercises")
      .select("*")
      .eq("workout_id", workoutId!)
      .order("sort_order");
    if (exs) setExercises(exs);
  };

  const toggleExercise = (id: string) => {
    setCompletedExercises((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startRest = (seconds: number) => {
    setRestTarget(seconds);
    setRestTimer(seconds);
    setTimerRunning(true);
  };

  const finishWorkout = async () => {
    if (!user || !workoutId) return;

    const { data: log, error } = await supabase
      .from("workout_logs")
      .insert({ user_id: user.id, workout_id: workoutId })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao salvar treino");
      return;
    }

    if (log) {
      const exerciseLogs = exercises.map((ex) => ({
        workout_log_id: log.id,
        exercise_id: ex.id,
        completed: completedExercises.has(ex.id),
        sets_completed: completedExercises.has(ex.id) ? ex.sets : 0,
      }));
      await supabase.from("exercise_logs").insert(exerciseLogs);
    }

    toast.success("Treino concluído! 🎉");
    navigate("/app");
  };

  const progress = exercises.length > 0
    ? Math.round((completedExercises.size / exercises.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/app")} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-foreground">
              {workout?.title || "Carregando..."}
            </h1>
            {workout?.description && (
              <p className="text-xs text-muted-foreground">{workout.description}</p>
            )}
          </div>
          <span className="text-sm font-bold text-primary">{progress}%</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Rest Timer */}
      {timerRunning && restTimer !== null && (
        <div className="sticky top-[65px] z-10 bg-primary text-primary-foreground px-4 py-3">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4" />
              <span className="font-semibold text-sm">Descanso</span>
            </div>
            <span className="text-2xl font-bold font-mono">
              {Math.floor(restTimer / 60)}:{String(restTimer % 60).padStart(2, "0")}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setTimerRunning(false)}>
                <Pause className="w-5 h-5" />
              </button>
              <button onClick={() => { setRestTimer(restTarget); setTimerRunning(true); }}>
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercises */}
      <section className="px-4 py-6">
        <div className="max-w-lg mx-auto space-y-4">
          {exercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum exercício cadastrado ainda.</p>
            </div>
          ) : (
            exercises.map((ex, i) => {
              const done = completedExercises.has(ex.id);
              return (
                <div
                  key={ex.id}
                  className={`bg-card border rounded-2xl p-4 transition-all ${
                    done ? "border-primary/40 bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleExercise(ex.id)}
                      className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        done
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {done && <Check className="w-4 h-4" />}
                    </button>
                    <div className="flex-1">
                      <p className={`font-semibold text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {i + 1}. {ex.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {ex.sets} séries × {ex.reps} reps • {ex.rest_seconds}s descanso
                      </p>
                      {ex.description && (
                        <p className="text-xs text-muted-foreground mt-1">{ex.description}</p>
                      )}
                      {ex.image_url && (
                        <img
                          src={ex.image_url}
                          alt={ex.name}
                          className="mt-3 rounded-xl w-full h-40 object-cover"
                        />
                      )}
                    </div>
                  </div>
                  {/* Rest timer button */}
                  {!done && (
                    <button
                      onClick={() => startRest(ex.rest_seconds)}
                      className="mt-3 ml-11 flex items-center gap-2 text-xs text-primary font-medium hover:underline"
                    >
                      <Play className="w-3 h-3" /> Iniciar descanso ({ex.rest_seconds}s)
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Finish button */}
      {exercises.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border p-4">
          <div className="max-w-lg mx-auto">
            <Button
              onClick={finishWorkout}
              size="lg"
              className="w-full rounded-xl h-12 text-base font-semibold"
              disabled={completedExercises.size === 0}
            >
              Finalizar Treino ({completedExercises.size}/{exercises.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppWorkout;
