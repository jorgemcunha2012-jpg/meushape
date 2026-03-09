import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { X, ArrowRight, Play, Pause, RotateCcw, Share2 } from "lucide-react";
import { toast } from "sonner";
import { updateStreak, checkAndAwardBadges } from "@/lib/streaksAndBadges";

// ==========================================
// TYPES
// ==========================================
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

interface WarmupExercise {
  name: string;
  duration: number;
  instruction: string;
}

interface CooldownStretch {
  name: string;
  duration: number;
  instruction: string;
}

type Phase = "warmup" | "exercise" | "rest" | "cooldown" | "feedback" | "complete";

// ==========================================
// TIMER HOOK
// ==========================================
function useTimer(initialSeconds: number, onComplete?: () => void) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            setRunning(false);
            onCompleteRef.current?.();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, seconds]);

  const start = () => setRunning(true);
  const pause = () => setRunning(false);
  const reset = (s: number) => {
    setSeconds(s);
    setRunning(false);
  };
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return { seconds, running, start, pause, reset, formatted: formatTime(seconds) };
}

// ==========================================
// COLORS
// ==========================================
const C = {
  accent: "#E94560",
  accentGlow: "rgba(233,69,96,0.25)",
  green: "#16C79A",
  greenGlow: "rgba(22,199,154,0.2)",
  yellow: "#F5A623",
  purple: "#6C63FF",
  blue: "#3B82F6",
  orange: "#FF6B35",
};

// ==========================================
// DEFAULT WARMUP & COOLDOWN
// ==========================================
const DEFAULT_WARMUP: WarmupExercise[] = [
  { name: "Marcha estacionária", duration: 60, instruction: "Joelhos altos, braços acompanhando" },
  { name: "Rotação de quadril", duration: 45, instruction: "Círculos amplos, 20s cada lado" },
  { name: "Agachamento sem peso", duration: 45, instruction: "5 reps com pausa de 3s embaixo" },
  { name: "Ponte de glúteo", duration: 30, instruction: "10 reps, aperta o bumbum lá em cima" },
];

const DEFAULT_COOLDOWN: CooldownStretch[] = [
  { name: "Alongamento de quadríceps", duration: 45, instruction: "Em pé, puxa o pé atrás. 20s cada lado." },
  { name: "Alongamento posterior", duration: 45, instruction: "Sentada, pernas estendidas, inclina pra frente." },
  { name: "Borboleta", duration: 45, instruction: "Sentada, solas dos pés juntas, empurra joelhos pro chão." },
  { name: "Respiração profunda", duration: 45, instruction: "Inspira 4s, segura 4s, solta 6s. Relaxa o corpo." },
];

// ==========================================
// MAIN WORKOUT COMPONENT
// ==========================================
const AppWorkout = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Data
  const [workout, setWorkout] = useState<WorkoutInfo | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [warmupExercises, setWarmupExercises] = useState<WarmupExercise[]>(DEFAULT_WARMUP);
  const [cooldownStretches, setCooldownStretches] = useState<CooldownStretch[]>(DEFAULT_COOLDOWN);

  // Flow state
  const [phase, setPhase] = useState<Phase>("warmup");
  const [warmupStep, setWarmupStep] = useState(0);
  const [exIndex, setExIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [cooldownStep, setCooldownStep] = useState(0);
  const [setsCompleted, setSetsCompleted] = useState<Record<string, number>>({});
  const [feedback, setFeedback] = useState<string | null>(null);

  // Workout timer
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);

  // Current exercise data
  const currentEx = exercises[exIndex];
  const totalExercises = exercises.length;

  useEffect(() => {
    if (workoutId) fetchWorkout();
    setWorkoutStartTime(new Date());
  }, [workoutId]);

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

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const totalProgress = totalExercises > 0
    ? Math.round(((exIndex + currentSet / (currentEx?.sets || 1)) / totalExercises) * 100)
    : 0;

  // Save workout to database
  const saveWorkout = async () => {
    if ((!user && !isAdmin) || !workoutId) return;
    if (isAdmin) {
      setPhase("complete");
      return;
    }

    const durationMin = Math.round(workoutDuration / 60);
    const { data: log, error } = await supabase
      .from("workout_logs")
      .insert({
        user_id: user!.id,
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

      const newStreak = await updateStreak(user!.id);
      const { count } = await supabase
        .from("workout_logs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      const awarded = await checkAndAwardBadges(user!.id, count || 1, newStreak);
      if (awarded.length > 0) {
        toast.success(`Você ganhou ${awarded.length} nova(s) conquista(s)! 🏆`);
      }

      // Auto-post to community
      const summary = `Concluí o treino "${workout?.title}" em ${durationMin} minutos! 💪🔥`;
      await supabase.from("community_posts").insert({
        user_id: user!.id,
        content: summary,
      });
    }

    setPhase("complete");
  };

  // ==========================================
  // WARMUP PHASE
  // ==========================================
  const WarmupPhase = () => {
    const current = warmupExercises[warmupStep];
    const timer = useTimer(current.duration, () => {
      if (warmupStep < warmupExercises.length - 1) {
        setWarmupStep((s) => s + 1);
      } else {
        setPhase("exercise");
      }
    });

    useEffect(() => {
      timer.reset(current.duration);
    }, [warmupStep]);

    return (
      <div className="min-h-screen bg-background px-5 pt-4 pb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: C.yellow }}>
            ☀️ Aquecimento
          </div>
          <span className="text-xs text-muted-foreground">
            {warmupStep + 1} de {warmupExercises.length}
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1 mb-6">
          {warmupExercises.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-colors"
              style={{ backgroundColor: i <= warmupStep ? C.yellow : "hsl(var(--border))" }}
            />
          ))}
        </div>

        {/* Animation area */}
        <div
          className="w-full h-52 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${C.yellow}11, ${C.yellow}05)`,
            border: `1px solid ${C.yellow}22`,
          }}
        >
          <div
            className="absolute -top-8 -right-8 w-28 h-28 rounded-full"
            style={{ background: `${C.yellow}15`, filter: "blur(40px)" }}
          />
          <div className="text-center relative z-10">
            <div className="text-5xl mb-2">🏃‍♀️</div>
            <div className="text-lg font-bold text-foreground">{current.name}</div>
          </div>
        </div>

        {/* Instruction */}
        <div className="p-4 rounded-2xl bg-card border border-border mb-6">
          <p className="text-sm text-foreground leading-relaxed">{current.instruction}</p>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
            {timer.formatted}
          </div>
        </div>

        {/* Buttons */}
        {!timer.running ? (
          <button
            onClick={timer.start}
            className="w-full py-4 rounded-2xl font-bold text-base"
            style={{ backgroundColor: C.yellow, color: "#0D0D12" }}
          >
            {warmupStep === 0 ? "Começar Aquecimento ▶" : "Iniciar ▶"}
          </button>
        ) : (
          <button
            onClick={() => {
              if (warmupStep < warmupExercises.length - 1) setWarmupStep((s) => s + 1);
              else setPhase("exercise");
            }}
            className="w-full py-4 rounded-2xl font-semibold text-sm"
            style={{ background: "transparent", border: `1px solid ${C.yellow}66`, color: C.yellow }}
          >
            Pular →
          </button>
        )}
      </div>
    );
  };

  // ==========================================
  // EXERCISE PHASE
  // ==========================================
  const ExercisePhase = () => {
    if (!currentEx) return null;

    const handleCompleteSet = () => {
      // Mark set as completed
      const newCompleted = { ...setsCompleted };
      newCompleted[currentEx.id] = (newCompleted[currentEx.id] || 0) + 1;
      setSetsCompleted(newCompleted);

      if (currentSet < currentEx.sets - 1) {
        // More sets → go to rest
        setPhase("rest");
      } else if (exIndex < totalExercises - 1) {
        // Next exercise → go to rest
        setPhase("rest");
      } else {
        // All exercises done → cooldown
        setPhase("cooldown");
      }
    };

    return (
      <div className="min-h-screen bg-background">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-5 py-3">
            <button onClick={() => navigate("/app")} className="text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              {exIndex + 1}/{totalExercises} • {formatTime(workoutDuration)}
            </span>
            <span className="text-sm font-bold" style={{ color: C.accent }}>
              {totalProgress}%
            </span>
          </div>
          <div className="h-1 bg-border">
            <div
              className="h-1 transition-all duration-500"
              style={{ width: `${totalProgress}%`, backgroundColor: C.accent }}
            />
          </div>
        </div>

        <div className="px-5 pb-8">
          {/* GIF Area */}
          <div
            className="w-full aspect-square max-h-60 rounded-2xl flex items-center justify-center mt-4 mb-4 relative overflow-hidden"
            style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
          >
            <div
              className="absolute -bottom-5 -left-5 w-24 h-24 rounded-full"
              style={{ background: C.accentGlow, filter: "blur(40px)" }}
            />
            {currentEx.image_url ? (
              <img
                src={currentEx.image_url}
                alt={currentEx.name}
                className="w-full h-full object-contain relative z-10"
              />
            ) : (
              <div className="text-center relative z-10">
                <div className="text-5xl mb-2">🏋️‍♀️</div>
                <div className="text-xs text-muted-foreground">GIF do exercício</div>
              </div>
            )}
          </div>

          {/* Exercise name + muscle */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">{currentEx.name}</h2>
            {currentEx.description && (
              <p className="text-sm text-muted-foreground">{currentEx.description}</p>
            )}
          </div>

          {/* Sets counter circles */}
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: currentEx.sets }, (_, i) => (
              <div
                key={i}
                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{
                  backgroundColor:
                    i < currentSet ? C.green : i === currentSet ? C.accent : "hsl(var(--secondary))",
                  border: i === currentSet ? `2px solid ${C.accent}` : "1px solid hsl(var(--border))",
                  color:
                    i < currentSet ? "#0D0D12" : i === currentSet ? "#fff" : "hsl(var(--muted-foreground))",
                }}
              >
                {i < currentSet ? "✓" : i + 1}
              </div>
            ))}
          </div>

          {/* Current set info */}
          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-1">
              Série {currentSet + 1} de {currentEx.sets}
            </p>
            <p className="text-3xl font-bold text-foreground">{currentEx.reps} reps</p>
          </div>

          {/* Complete set button */}
          <button
            onClick={handleCompleteSet}
            className="w-full py-4 rounded-2xl font-bold text-base mb-3"
            style={{ backgroundColor: C.accent, color: "#fff", boxShadow: `0 4px 20px ${C.accentGlow}` }}
          >
            {currentSet < currentEx.sets - 1
              ? "Completei essa série ✓"
              : exIndex < totalExercises - 1
              ? "Completei! Próximo exercício →"
              : "Último exercício! Finalizar 🎉"}
          </button>

          <button className="w-full py-3 text-sm font-medium" style={{ color: C.blue }}>
            Esse exercício tá difícil? Trocar por outro
          </button>
        </div>
      </div>
    );
  };

  // ==========================================
  // REST PHASE
  // ==========================================
  const RestPhase = () => {
    const restSeconds = currentEx?.rest_seconds || 45;
    const timer = useTimer(restSeconds, handleRestComplete);

    useEffect(() => {
      timer.start();
    }, []);

    function handleRestComplete() {
      if (currentSet < (currentEx?.sets || 1) - 1) {
        setCurrentSet((s) => s + 1);
      } else if (exIndex < totalExercises - 1) {
        setExIndex((i) => i + 1);
        setCurrentSet(0);
      }
      setPhase("exercise");
    }

    const pct = restSeconds > 0 ? ((restSeconds - timer.seconds) / restSeconds) * 100 : 0;

    // Determine next exercise info
    const nextEx = currentSet < (currentEx?.sets || 1) - 1 ? currentEx : exercises[exIndex + 1];
    const nextSetNum = currentSet < (currentEx?.sets || 1) - 1 ? currentSet + 2 : 1;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        {/* Circular timer */}
        <div className="relative w-48 h-48 mb-8">
          <svg width="192" height="192" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="96" cy="96" r="86" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
            <circle
              cx="96"
              cy="96"
              r="86"
              fill="none"
              stroke={C.green}
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 86}`}
              strokeDashoffset={`${2 * Math.PI * 86 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
              {timer.formatted}
            </span>
            <span className="text-sm text-muted-foreground">Descanse</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => (timer.running ? timer.pause() : timer.start())}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
          >
            {timer.running ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          <button
            onClick={() => timer.reset(restSeconds)}
            className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Next exercise preview */}
        {nextEx && (
          <div className="w-full p-4 rounded-2xl bg-card border border-border mb-6">
            <div className="text-xs text-muted-foreground mb-2">Próximo:</div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0">
                🏋️‍♀️
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{nextEx.name}</p>
                <p className="text-xs text-muted-foreground">
                  Série {nextSetNum} de {nextEx.sets}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Skip button */}
        <button
          onClick={handleRestComplete}
          className="py-3 px-8 rounded-2xl font-semibold text-sm"
          style={{ background: "transparent", border: `1px solid ${C.green}44`, color: C.green }}
        >
          Pular descanso →
        </button>
      </div>
    );
  };

  // ==========================================
  // COOLDOWN PHASE
  // ==========================================
  const CooldownPhase = () => {
    const current = cooldownStretches[cooldownStep];
    const timer = useTimer(current.duration, () => {
      if (cooldownStep < cooldownStretches.length - 1) {
        setCooldownStep((s) => s + 1);
      } else {
        setPhase("feedback");
      }
    });

    useEffect(() => {
      timer.reset(current.duration);
    }, [cooldownStep]);

    return (
      <div className="min-h-screen bg-background px-5 pt-4 pb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: C.purple }}>
            🧘‍♀️ Volta à Calma
          </div>
          <span className="text-xs text-muted-foreground">
            {cooldownStep + 1} de {cooldownStretches.length}
          </span>
        </div>

        <div className="flex gap-1 mb-6">
          {cooldownStretches.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-colors"
              style={{ backgroundColor: i <= cooldownStep ? C.purple : "hsl(var(--border))" }}
            />
          ))}
        </div>

        <div
          className="w-full h-48 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${C.purple}11, ${C.purple}05)`,
            border: `1px solid ${C.purple}22`,
          }}
        >
          <div className="text-center">
            <div className="text-5xl mb-2">🧘‍♀️</div>
            <div className="text-lg font-bold text-foreground">{current.name}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border mb-6">
          <p className="text-sm text-foreground leading-relaxed">{current.instruction}</p>
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-foreground" style={{ fontVariantNumeric: "tabular-nums" }}>
            {timer.formatted}
          </div>
        </div>

        {!timer.running ? (
          <button
            onClick={timer.start}
            className="w-full py-4 rounded-2xl font-bold text-base"
            style={{ backgroundColor: C.purple, color: "#fff" }}
          >
            Iniciar ▶
          </button>
        ) : (
          <button
            onClick={() => {
              if (cooldownStep < cooldownStretches.length - 1) setCooldownStep((s) => s + 1);
              else setPhase("feedback");
            }}
            className="w-full py-4 rounded-2xl font-semibold text-sm"
            style={{ background: "transparent", border: `1px solid ${C.purple}44`, color: C.purple }}
          >
            Pular →
          </button>
        )}
      </div>
    );
  };

  // ==========================================
  // FEEDBACK PHASE
  // ==========================================
  const FeedbackPhase = () => {
    const options = [
      { emoji: "😅", label: "Fácil", value: "too_easy", color: C.green },
      { emoji: "💪", label: "Bom", value: "just_right", color: C.blue },
      { emoji: "🥵", label: "Pesado", value: "too_hard", color: C.orange },
      { emoji: "😣", label: "Senti dor", value: "felt_pain", color: C.accent },
    ];

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <h2 className="text-2xl font-bold text-foreground mb-2">Como foi o treino?</h2>
        <p className="text-sm text-muted-foreground mb-8">Seu feedback ajusta o próximo treino</p>

        <div className="grid grid-cols-4 gap-2 w-full mb-8">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFeedback(opt.value)}
              className="p-3 rounded-2xl text-center transition-all"
              style={{
                background: feedback === opt.value ? `${opt.color}22` : "hsl(var(--card))",
                border: feedback === opt.value ? `2px solid ${opt.color}` : "1px solid hsl(var(--border))",
              }}
            >
              <div className="text-2xl mb-1">{opt.emoji}</div>
              <div className="text-xs text-muted-foreground">{opt.label}</div>
            </button>
          ))}
        </div>

        <button
          onClick={saveWorkout}
          className="w-full py-4 rounded-2xl font-bold text-base"
          style={{ backgroundColor: C.accent, color: "#fff", boxShadow: `0 4px 20px ${C.accentGlow}` }}
        >
          Salvar e Concluir
        </button>
      </div>
    );
  };

  // ==========================================
  // COMPLETION PHASE
  // ==========================================
  const CompletionPhase = () => {
    const totalSets = Object.values(setsCompleted).reduce((a, b) => a + b, 0);
    const durationMin = Math.round(workoutDuration / 60);

    return (
      <div className="min-h-screen bg-background px-5 pt-10 pb-8 text-center relative overflow-hidden">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-6xl mb-4">
          🎉
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Treino Completo!</h2>
        <p className="text-sm text-muted-foreground mb-8">Você arrasou! 💪</p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: "⏱️", value: `${durationMin}`, label: "min" },
            { icon: "💪", value: `${totalExercises}`, label: "exercícios" },
            { icon: "🔥", value: "~320", label: "kcal" },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-2xl bg-card border border-border">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Volume */}
        <div className="p-4 rounded-2xl bg-card border border-border mb-6">
          <p className="text-sm font-semibold text-foreground mb-1">Volume Total</p>
          <p className="text-2xl font-bold" style={{ color: C.green }}>
            {totalSets} séries
          </p>
        </div>

        {/* Share card */}
        <div
          className="p-5 rounded-2xl mb-4 text-left"
          style={{
            background: `linear-gradient(135deg, ${C.accent}22, ${C.purple}22)`,
            border: `1px solid ${C.accent}33`,
          }}
        >
          <p className="text-sm font-semibold text-foreground mb-1">Compartilhar na Comunidade</p>
          <p className="text-xs text-muted-foreground mb-3">Mostre que você treinou hoje!</p>
          <button
            onClick={() => navigate("/app/community")}
            className="w-full py-3 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: C.accent, color: "#fff" }}
          >
            <Share2 className="w-4 h-4 inline mr-2" />
            Postar na Comunidade
          </button>
        </div>

        <button
          onClick={() => navigate("/app")}
          className="w-full py-4 rounded-2xl font-semibold text-sm bg-secondary text-foreground"
        >
          Voltar pro app
        </button>
      </div>
    );
  };

  // ==========================================
  // RENDER PHASE
  // ==========================================
  if (phase === "warmup") return <WarmupPhase />;
  if (phase === "exercise") return <ExercisePhase />;
  if (phase === "rest") return <RestPhase />;
  if (phase === "cooldown") return <CooldownPhase />;
  if (phase === "feedback") return <FeedbackPhase />;
  if (phase === "complete") return <CompletionPhase />;

  return null;
};

export default AppWorkout;
