import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, CheckCircle2, Home, Dumbbell, Flame, Heart } from "lucide-react";
import AnimatedExercise from "@/components/AnimatedExercise";
import { useMuscleWikiMedia } from "@/hooks/useMuscleWikiMedia";

interface HomeExercise {
  order: number;
  name: string;
  focus: string;
  sets?: number;
  reps?: string;
}

interface HomeTemplate {
  id: string;
  name_pt: string;
  category: string;
  equipment: string;
  duration_min: number;
  difficulty_level: number;
  exercises: HomeExercise[];
  format_description: string | null;
  rounds: number;
  work_seconds: number;
  rest_seconds: number;
  rest_between_rounds: number;
}

const categoryIcons: Record<string, any> = {
  circuit: Flame,
  glute: Heart,
  hiit: Flame,
  active_recovery: Heart,
  resistance_band: Dumbbell,
  dumbbell: Dumbbell,
};

const categoryLabels: Record<string, string> = {
  circuit: "Circuito",
  glute: "Glúteo",
  hiit: "HIIT",
  active_recovery: "Recuperação",
  resistance_band: "Elástico",
  dumbbell: "Halteres",
};

const equipmentLabels: Record<string, string> = {
  bodyweight: "Peso corporal",
  resistance_band: "Elástico",
  dumbbells: "Halteres",
};

const AppHomeWorkout = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { templateId } = useParams();

  const [templates, setTemplates] = useState<HomeTemplate[]>([]);
  const [selected, setSelected] = useState<HomeTemplate | null>(null);

  // Workout state
  const [round, setRound] = useState(1);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [phase, setPhase] = useState<"work" | "rest" | "round_rest">("work");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [started, setStarted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user && !isAdmin) navigate("/app/login");
    if (user || isAdmin) fetchTemplates();
  }, [user, loading, isAdmin]);

  const fetchTemplates = async () => {
    const { data } = await supabase
      .from("home_workout_templates")
      .select("*")
      .eq("active", true)
      .order("difficulty_level");
    if (data) {
      const parsed = data.map((t: any) => ({
        ...t,
        exercises: typeof t.exercises === "string" ? JSON.parse(t.exercises) : t.exercises,
      }));
      setTemplates(parsed);
      if (templateId) {
        const found = parsed.find((t: any) => t.id === templateId);
        if (found) setSelected(found);
      }
    }
  };

  const startWorkout = () => {
    if (!selected) return;
    setStarted(true);
    setRound(1);
    setExerciseIndex(0);
    setPhase("work");
    setTimeLeft(selected.work_seconds || 30);
    setIsRunning(true);
  };

  const tick = useCallback(() => {
    if (!selected) return;
    setTimeLeft((prev) => {
      if (prev <= 1) {
        if (phase === "work") {
          if (exerciseIndex < selected.exercises.length - 1) {
            setPhase("rest");
            return selected.rest_seconds || 15;
          }
          if (round < selected.rounds) {
            setPhase("round_rest");
            return selected.rest_between_rounds || 60;
          }
          setIsRunning(false);
          setCompleted(true);
          return 0;
        }
        if (phase === "rest") {
          setExerciseIndex((i) => i + 1);
          setPhase("work");
          return selected.work_seconds || 30;
        }
        if (phase === "round_rest") {
          setRound((r) => r + 1);
          setExerciseIndex(0);
          setPhase("work");
          return selected.work_seconds || 30;
        }
        return 0;
      }
      return prev - 1;
    });
  }, [selected, phase, exerciseIndex, round]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, tick]);

  if (loading) return null;

  // Template selection
  if (!selected) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-lg font-bold text-foreground">Treino em Casa</h1>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
          {templates.map((t) => {
            const Icon = categoryIcons[t.category] || Home;
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{t.name_pt}</p>
                    <p className="text-xs text-muted-foreground">
                      {categoryLabels[t.category]} • {equipmentLabels[t.equipment] || t.equipment} • {t.duration_min} min
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Completed
  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Treino em casa feito! 🏠💪</h1>
        <p className="text-muted-foreground text-center mb-6">{selected.name_pt} — {selected.rounds} rodadas</p>
        <Button onClick={() => navigate("/app")} className="rounded-full">Voltar ao início</Button>
      </div>
    );
  }

  // Pre-start (show exercises list)
  if (!started) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSelected(null)} className="text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-sm font-bold text-foreground">{selected.name_pt}</h1>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-6">
          {selected.format_description && (
            <p className="text-sm text-muted-foreground mb-4 bg-card border border-border rounded-xl p-3">
              {selected.format_description}
            </p>
          )}
          <div className="space-y-2 mb-6">
            {selected.exercises.map((ex, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">{ex.focus}</p>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={startWorkout} className="w-full rounded-full py-6 text-base font-semibold">
            <Play className="w-5 h-5 mr-2" /> Começar treino
          </Button>
        </div>
      </div>
    );
  }

  // Active workout
  const currentExercise = selected.exercises[exerciseIndex];
  const totalExInRound = selected.exercises.length;
  const overallProgress = ((((round - 1) * totalExInRound + exerciseIndex) / (selected.rounds * totalExInRound)) * 100);

  const allExerciseNames = useMemo(() => selected.exercises.map(e => e.name), [selected]);
  const { media: mwMedia } = useMuscleWikiMedia(allExerciseNames);
  const currentMedia = currentExercise ? mwMedia[currentExercise.name] : undefined;
  const maxTime = phase === "work" ? selected.work_seconds : phase === "rest" ? selected.rest_seconds : selected.rest_between_rounds;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setIsRunning(false); setStarted(false); }} className="text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-sm font-bold text-foreground">{selected.name_pt}</h1>
              <p className="text-xs text-muted-foreground">Rodada {round}/{selected.rounds}</p>
            </div>
          </div>
        </div>
        <div className="h-1 bg-secondary">
          <div className="h-full bg-primary transition-all" style={{ width: `${overallProgress}%` }} />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        {/* Phase badge */}
        <span className={`text-xs font-semibold px-3 py-1 rounded-full mb-4 ${
          phase === "work" ? "bg-success/10 text-success" :
          phase === "rest" ? "bg-info/10 text-info" :
          "bg-warning/10 text-warning"
        }`}>
          {phase === "work" ? "TRABALHO" : phase === "rest" ? "DESCANSO" : "DESCANSO ENTRE RODADAS"}
        </span>

        {/* Animated illustration during work phase */}
        {phase === "work" && currentExercise && (
          <>
            <AnimatedExercise
              name={currentExercise.name}
              focus={currentExercise.focus}
              className="h-40 mb-4 max-w-sm"
            />
            <h2 className="font-display text-2xl font-bold text-foreground text-center mb-1">
              {currentExercise.name}
            </h2>
            <p className="text-muted-foreground text-sm mb-4">{currentExercise.focus}</p>
          </>
        )}

        {phase !== "work" && (
          <h2 className="font-display text-xl font-bold text-foreground text-center mb-6">
            {phase === "rest" ? "Respira..." : `Prepara pra rodada ${round + 1}!`}
          </h2>
        )}

        {/* Circular Timer */}
        <div className="relative w-36 h-36 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
            <circle cx="50" cy="50" r="45" fill="none"
              stroke={phase === "work" ? "hsl(var(--primary))" : "hsl(var(--info))"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - timeLeft / maxTime)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-foreground tabular-nums">{timeLeft}s</span>
          </div>
        </div>

        <Button
          size="lg"
          variant={isRunning ? "outline" : "default"}
          onClick={() => setIsRunning(!isRunning)}
          className="rounded-full w-16 h-16"
        >
          {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </Button>

        {/* Upcoming */}
        {phase === "work" && exerciseIndex < selected.exercises.length - 1 && (
          <div className="mt-6 bg-card border border-border rounded-xl px-4 py-3 w-full max-w-sm">
            <p className="text-xs text-muted-foreground mb-1">Próximo:</p>
            <p className="text-sm font-medium text-foreground">{selected.exercises[exerciseIndex + 1].name}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppHomeWorkout;
