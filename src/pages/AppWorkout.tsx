import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ArrowRight, Check, Timer, RotateCcw, Play, Pause,
  ChevronRight, Trophy, Share2, MessageSquare, Flame, X
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { updateStreak, checkAndAwardBadges } from "@/lib/streaksAndBadges";

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

type Phase = "overview" | "warmup" | "exercise" | "rest" | "cooldown" | "complete" | "feedback";

const AppWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [workout, setWorkout] = useState<WorkoutInfo | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [phase, setPhase] = useState<Phase>("overview");
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [setsCompleted, setSetsCompleted] = useState<Record<string, number>>({});

  // Timer
  const [timer, setTimer] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerTarget, setTimerTarget] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Workout timer
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);

  // Feedback
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (workoutId) fetchWorkout();
  }, [workoutId]);

  // Countdown timer
  useEffect(() => {
    if (timerRunning && timer > 0) {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setTimerRunning(false);
            // Auto-advance from rest
            if (phase === "rest") {
              const ex = exercises[currentExIdx];
              if (currentSet < ex.sets) {
                setCurrentSet((s) => s + 1);
                setPhase("exercise");
              } else {
                // Move to next exercise
                if (currentExIdx < exercises.length - 1) {
                  setCurrentExIdx((i) => i + 1);
                  setCurrentSet(1);
                  setPhase("exercise");
                } else {
                  setPhase("cooldown");
                }
              }
            }
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, timer > 0, phase]);

  // Workout elapsed time
  useEffect(() => {
    if (!workoutStartTime) return;
    const interval = setInterval(() => {
      setWorkoutDuration(Math.floor((Date.now() - workoutStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutStartTime]);

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

  const startWorkout = () => {
    setWorkoutStartTime(new Date());
    setPhase("warmup");
  };

  const startExercises = () => {
    setCurrentExIdx(0);
    setCurrentSet(1);
    setPhase("exercise");
  };

  const completeSet = () => {
    const ex = exercises[currentExIdx];
    const newCompleted = { ...setsCompleted };
    newCompleted[ex.id] = (newCompleted[ex.id] || 0) + 1;
    setSetsCompleted(newCompleted);

    if (currentSet < ex.sets) {
      // Start rest timer
      setTimerTarget(ex.rest_seconds);
      setTimer(ex.rest_seconds);
      setTimerRunning(true);
      setPhase("rest");
    } else {
      // Exercise done, move to next or cooldown
      if (currentExIdx < exercises.length - 1) {
        // Rest before next exercise
        setTimerTarget(ex.rest_seconds);
        setTimer(ex.rest_seconds);
        setTimerRunning(true);
        setPhase("rest");
      } else {
        setPhase("cooldown");
      }
    }
  };

  const skipRest = () => {
    setTimerRunning(false);
    setTimer(0);
    const ex = exercises[currentExIdx];
    if (currentSet < ex.sets) {
      setCurrentSet((s) => s + 1);
      setPhase("exercise");
    } else if (currentExIdx < exercises.length - 1) {
      setCurrentExIdx((i) => i + 1);
      setCurrentSet(1);
      setPhase("exercise");
    } else {
      setPhase("cooldown");
    }
  };

  const finishWorkout = async () => {
    setPhase("feedback");
  };

  const submitFeedback = async () => {
    if (!user || !workoutId) return;

    const durationMin = Math.round(workoutDuration / 60);
    const { data: log, error } = await supabase
      .from("workout_logs")
      .insert({
        user_id: user.id,
        workout_id: workoutId,
        duration_minutes: durationMin,
        notes: feedback ? `Feedback: ${feedback}` : null,
        feedback: feedback,
      } as any)
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
        completed: (setsCompleted[ex.id] || 0) >= ex.sets,
        sets_completed: setsCompleted[ex.id] || 0,
      }));
      await supabase.from("exercise_logs").insert(exerciseLogs);
      
      // Update streak and badges
      const newStreak = await updateStreak(user.id);
      
      // Get total completed workouts count
      const { count } = await supabase
        .from("workout_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
        
      const awarded = await checkAndAwardBadges(user.id, count || 1, newStreak);
      if (awarded.length > 0) {
        toast.success(`Você ganhou ${awarded.length} nova(s) conquista(s)! 🏆`);
      }

      // Auto-post to community
      const summary = `Concluí um treino de ${durationMin} minutos com ${exercises.length} exercícios e ${Object.values(setsCompleted).reduce((a, b) => a + b, 0)} séries! 💪🔥`;
      await supabase.from("community_posts").insert({
        user_id: user.id,
        content: summary
      });
    }

    setPhase("complete");
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const currentEx = exercises[currentExIdx];
  const nextEx = exercises[currentExIdx + 1];
  const totalExercises = exercises.length;
  const completedCount = Object.values(setsCompleted).filter(
    (v, i) => v >= (exercises[i]?.sets || 0)
  ).length;
  const progressPercent = totalExercises > 0
    ? Math.round(((currentExIdx + (currentSet - 1) / (currentEx?.sets || 1)) / totalExercises) * 100)
    : 0;

  // ─── Overview ───
  if (phase === "overview") {
    return (
      <div className="min-h-screen bg-background">
        <header className="px-4 pt-6 pb-2">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => navigate("/app")} className="text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-xl font-bold text-foreground">
              {workout?.title || "Carregando..."}
            </h1>
          </div>
        </header>

        <section className="px-4 py-6">
          <div className="max-w-lg mx-auto">
            {workout?.description && (
              <p className="text-muted-foreground text-sm mb-6">{workout.description}</p>
            )}

            <div className="flex items-center gap-4 mb-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-primary" />
                {exercises.length} exercícios
              </span>
              <span className="flex items-center gap-1">
                <Timer className="w-4 h-4 text-primary" />
                ~{Math.round(exercises.reduce((acc, ex) => acc + ex.sets * 1.5 + ex.sets * ex.rest_seconds / 60, 0))} min
              </span>
            </div>

            <div className="space-y-3 mb-8">
              {exercises.map((ex, i) => (
                <div key={ex.id} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-xs">{i + 1}</span>
                  </div>
                  {ex.image_url && (
                    <img src={ex.image_url} alt={ex.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{ex.name}</p>
                    <p className="text-xs text-muted-foreground">{ex.sets}×{ex.reps} • {ex.rest_seconds}s</p>
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={startWorkout} size="lg" className="w-full rounded-xl h-14 text-base font-semibold">
              <Play className="w-5 h-5 mr-2" /> Começar Treino
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // ─── Warmup ───
  if (phase === "warmup") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-lg mx-auto text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Flame className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Aquecimento</h2>
          <p className="text-muted-foreground mb-2">3 minutos para preparar seu corpo</p>
          <div className="bg-card border border-border rounded-2xl p-6 text-left space-y-3 mb-8">
            <p className="text-sm text-foreground">🦵 30s de polichinelo</p>
            <p className="text-sm text-foreground">🔄 30s de rotação de braços</p>
            <p className="text-sm text-foreground">🦿 30s de agachamento sem peso</p>
            <p className="text-sm text-foreground">🚶 1 min de caminhada no lugar</p>
            <p className="text-sm text-foreground">🧘 30s de alongamento dinâmico</p>
          </div>
          <Button onClick={startExercises} size="lg" className="w-full rounded-xl h-14 text-base font-semibold">
            Tô pronta! Vamos treinar <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Exercise ───
  if (phase === "exercise" && currentEx) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-sm">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => navigate("/app")} className="text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              {currentExIdx + 1}/{totalExercises} • {formatTime(workoutDuration)}
            </span>
            <span className="text-sm font-bold text-primary">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-1 rounded-none" />
        </header>

        <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-4 pb-6">
          {/* GIF */}
          {currentEx.image_url ? (
            <div className="mt-4 rounded-2xl overflow-hidden bg-secondary aspect-square max-h-[360px] flex items-center justify-center animate-fade-in">
              <img
                src={currentEx.image_url}
                alt={currentEx.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="mt-4 rounded-2xl bg-secondary aspect-square max-h-[360px] flex items-center justify-center">
              <Flame className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Exercise info */}
          <div className="mt-6 text-center animate-fade-in">
            <h2 className="font-display text-xl font-bold text-foreground mb-1">
              {currentEx.name}
            </h2>
            {currentEx.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-sm mx-auto">
                {currentEx.description}
              </p>
            )}

            {/* Set counter */}
            <div className="flex items-center justify-center gap-3 my-6">
              {Array.from({ length: currentEx.sets }).map((_, i) => (
                <div
                  key={i}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    i < currentSet - 1
                      ? "bg-primary text-primary-foreground"
                      : i === currentSet - 1
                      ? "bg-primary/20 text-primary border-2 border-primary scale-110"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {i < currentSet - 1 ? <Check className="w-4 h-4" /> : i + 1}
                </div>
              ))}
            </div>

            <p className="text-lg font-bold text-foreground">
              Série {currentSet} de {currentEx.sets} — <span className="text-primary">{currentEx.reps} reps</span>
            </p>
          </div>

          {/* Action */}
          <div className="mt-auto pt-6">
            <Button
              onClick={completeSet}
              size="lg"
              className="w-full rounded-xl h-14 text-base font-semibold"
            >
              <Check className="w-5 h-5 mr-2" /> Completei essa série
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Rest ───
  if (phase === "rest") {
    const restPercent = timerTarget > 0 ? ((timerTarget - timer) / timerTarget) * 100 : 0;
    const previewEx = currentSet < (currentEx?.sets || 0) ? currentEx : nextEx;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-lg mx-auto w-full text-center animate-fade-in">
          {/* Circular timer */}
          <div className="relative w-48 h-48 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" className="stroke-secondary" strokeWidth="6" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                className="stroke-primary"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - restPercent / 100)}`}
                style={{ transition: "stroke-dashoffset 1s linear" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold font-mono text-foreground">{formatTime(timer)}</span>
              <span className="text-xs text-muted-foreground mt-1">Descanso</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setTimerRunning(!timerRunning)}
              className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              {timerRunning ? <Pause className="w-5 h-5 text-foreground" /> : <Play className="w-5 h-5 text-foreground" />}
            </button>
            <button
              onClick={() => { setTimer(timerTarget); setTimerRunning(true); }}
              className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <RotateCcw className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Preview next */}
          {previewEx && (
            <div className="bg-card border border-border rounded-2xl p-4 text-left">
              <p className="text-xs text-muted-foreground mb-2">
                {currentSet < (currentEx?.sets || 0) ? "Próxima série" : "Próximo exercício"}
              </p>
              <div className="flex items-center gap-3">
                {previewEx.image_url && (
                  <img src={previewEx.image_url} alt={previewEx.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                )}
                <div>
                  <p className="font-semibold text-sm text-foreground">{previewEx.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {currentSet < (currentEx?.sets || 0)
                      ? `Série ${currentSet + 1} de ${currentEx?.sets}`
                      : `${previewEx.sets}×${previewEx.reps}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={skipRest}
            variant="ghost"
            className="mt-6 text-primary font-medium"
          >
            Pular descanso <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Cooldown ───
  if (phase === "cooldown") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-lg mx-auto text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🧘</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Volta à calma</h2>
          <p className="text-muted-foreground mb-2">2 minutos de alongamento</p>
          <div className="bg-card border border-border rounded-2xl p-6 text-left space-y-3 mb-8">
            <p className="text-sm text-foreground">🦵 30s alongamento de quadríceps</p>
            <p className="text-sm text-foreground">🦿 30s alongamento de posterior</p>
            <p className="text-sm text-foreground">💪 30s alongamento de braços</p>
            <p className="text-sm text-foreground">🧘 30s respiração profunda</p>
          </div>
          <Button onClick={finishWorkout} size="lg" className="w-full rounded-xl h-14 text-base font-semibold">
            Finalizar Treino <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
    );
  }

  // ─── Feedback ───
  if (phase === "feedback") {
    const feedbackOptions = [
      { label: "Fácil demais 😴", value: "too_easy" },
      { label: "Tava bom 👌", value: "just_right" },
      { label: "Tava pesado 😰", value: "too_hard" },
      { label: "Senti dor 🤕", value: "felt_pain" },
    ];

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-lg mx-auto w-full text-center animate-fade-in">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Como foi o treino?
          </h2>
          <p className="text-muted-foreground text-sm mb-8">
            Seu feedback ajusta o próximo treino automaticamente
          </p>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {feedbackOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFeedback(opt.value)}
                className={`p-4 rounded-2xl border-2 text-sm font-medium transition-all ${
                  feedback === opt.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/30"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Button
            onClick={submitFeedback}
            size="lg"
            className="w-full rounded-xl h-14 text-base font-semibold"
          >
            Salvar e Concluir
          </Button>
        </div>
      </div>
    );
  }

  // ─── Complete ───
  if (phase === "complete") {
    const totalSets = Object.values(setsCompleted).reduce((a, b) => a + b, 0);
    const durationMin = Math.round(workoutDuration / 60);

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="max-w-lg mx-auto w-full text-center animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-12 h-12 text-primary" />
          </div>
          <h2 className="font-display text-3xl font-bold text-foreground mb-2">
            Treino concluído! 🎉
          </h2>
          <p className="text-muted-foreground mb-8">Parabéns, você arrasou!</p>

          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{durationMin}</p>
              <p className="text-xs text-muted-foreground">min</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalExercises}</p>
              <p className="text-xs text-muted-foreground">exercícios</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{totalSets}</p>
              <p className="text-xs text-muted-foreground">séries</p>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/app/community")}
              variant="outline"
              size="lg"
              className="w-full rounded-xl h-12 text-base"
            >
              <Share2 className="w-4 h-4 mr-2" /> Compartilhar na comunidade
            </Button>
            <Button
              onClick={() => navigate("/app")}
              size="lg"
              className="w-full rounded-xl h-12 text-base font-semibold"
            >
              Voltar pro Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AppWorkout;
