import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { X, ArrowRight, Play, Pause, RotateCcw, Share2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { updateStreak, checkAndAwardBadges } from "@/lib/streaksAndBadges";
import { useMuscleWikiMedia } from "@/hooks/useMuscleWikiMedia";
import { proxyImageUrl } from "@/lib/mediaUtils";
import { setHasNewWorkout } from "@/services/cacheService";
import { findFallbackTip } from "@/lib/exerciseTips";

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

interface CuratedExercise {
  name_pt: string;
  target: string;
  body_part: string;
  common_mistakes_pt: string | null;
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
  const [curatedMap, setCuratedMap] = useState<Record<string, CuratedExercise>>({});
  const [warmupExercises] = useState<WarmupExercise[]>(DEFAULT_WARMUP);
  const [cooldownStretches] = useState<CooldownStretch[]>(DEFAULT_COOLDOWN);

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
  const exerciseNames = useMemo(() => exercises.map(e => e.name), [exercises]);
  const { media: mwMedia } = useMuscleWikiMedia(exerciseNames);

  useEffect(() => {
    if (workoutId) fetchWorkout();
    setWorkoutStartTime(new Date());
  }, [workoutId]);

  useEffect(() => {
    if (!workoutStartTime) return;
    const interval = setInterval(() => {
      setWorkoutDuration(Math.floor((Date.now() - workoutStartTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [workoutStartTime]);

  const fetchWorkout = async () => {
    const [wkRes, exRes] = await Promise.all([
      supabase.from("workouts").select("id, title, description").eq("id", workoutId!).single(),
      supabase.from("exercises").select("*").eq("workout_id", workoutId!).order("sort_order"),
    ]);
    if (wkRes.data) setWorkout(wkRes.data);
    if (exRes.data) {
      setExercises(exRes.data);
      const names = exRes.data.map((e) => e.name);
      if (names.length > 0) {
        const { data: curated } = await supabase
          .from("curated_exercises")
          .select("name_pt, target, body_part, common_mistakes_pt")
          .in("name_pt", names);
        if (curated) {
          const map: Record<string, CuratedExercise> = {};
          curated.forEach((c) => { map[c.name_pt] = c; });
          setCuratedMap(map);
        }
      }
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const totalProgress = totalExercises > 0
    ? Math.round(((exIndex + currentSet / (currentEx?.sets || 1)) / totalExercises) * 100)
    : 0;

  const saveWorkout = async () => {
    if ((!user && !isAdmin) || !workoutId) return;
    if (isAdmin) { setPhase("complete"); return; }

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

    if (error) { toast.error("Erro ao salvar treino"); return; }

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
      if (awarded.length > 0) toast.success(`Você ganhou ${awarded.length} nova(s) conquista(s)! 🏆`);

      const summary = `Concluí o treino "${workout?.title}" em ${durationMin} minutos! 💪🔥`;
      await supabase.from("community_posts").insert({ user_id: user!.id, content: summary });
    }
    setHasNewWorkout(true);
    setPhase("complete");
  };

  // WARMUP PHASE
  const WarmupPhase = () => {
    const current = warmupExercises[warmupStep];
    const timer = useTimer(current.duration, () => {
      if (warmupStep < warmupExercises.length - 1) setWarmupStep((s) => s + 1);
      else setPhase("exercise");
    });

    useEffect(() => { timer.reset(current.duration); }, [warmupStep]);

    return (
      <div className="min-h-screen bg-background px-5 pt-4 pb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-warning">
            ☀️ Aquecimento
          </div>
          <span className="text-xs text-muted-foreground">
            {warmupStep + 1} de {warmupExercises.length}
          </span>
        </div>

        <div className="flex gap-1 mb-6">
          {warmupExercises.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${i <= warmupStep ? "bg-warning" : "bg-border"}`}
            />
          ))}
        </div>

        <div className="w-full h-52 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden bg-warning/5 border border-warning/10">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-warning/10 blur-[40px]" />
          <div className="text-center relative z-10">
            <div className="text-5xl mb-2">🏃‍♀️</div>
            <div className="text-lg font-bold text-foreground">{current.name}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border mb-6">
          <p className="text-sm text-foreground leading-relaxed">{current.instruction}</p>
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-foreground tabular-nums">{timer.formatted}</div>
        </div>

        {!timer.running ? (
          <button
            onClick={timer.start}
            className="w-full py-4 rounded-2xl font-bold text-base bg-warning text-warning-foreground"
          >
            {warmupStep === 0 ? "Começar Aquecimento ▶" : "Iniciar ▶"}
          </button>
        ) : (
          <button
            onClick={() => {
              if (warmupStep < warmupExercises.length - 1) setWarmupStep((s) => s + 1);
              else setPhase("exercise");
            }}
            className="w-full py-4 rounded-2xl font-semibold text-sm border border-warning/40 text-warning bg-transparent"
          >
            Pular →
          </button>
        )}
      </div>
    );
  };

  // EXERCISE PHASE
  const ExercisePhase = () => {
    if (!currentEx) return null;

    const curated = curatedMap[currentEx.name];
    const mw = mwMedia[currentEx.name];
    const videoUrl = mw?.video;
    const imageUrl = mw?.image || proxyImageUrl(currentEx.image_url);

    const handleCompleteSet = () => {
      const newCompleted = { ...setsCompleted };
      newCompleted[currentEx.id] = (newCompleted[currentEx.id] || 0) + 1;
      setSetsCompleted(newCompleted);

      if (currentSet < currentEx.sets - 1) {
        setPhase("rest");
      } else if (exIndex < totalExercises - 1) {
        setPhase("rest");
      } else {
        setPhase("cooldown");
      }
    };

    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-5 py-3">
            <button onClick={() => navigate("/app")} className="text-muted-foreground">
              <X className="w-5 h-5" />
            </button>
            <span className="text-xs text-muted-foreground font-medium">
              {exIndex + 1}/{totalExercises} • {formatTime(workoutDuration)}
            </span>
            <span className="text-sm font-bold text-primary">
              {totalProgress}%
            </span>
          </div>
          <div className="h-1 bg-border">
            <div
              className="h-1 bg-primary transition-all duration-500"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>

        <div className="px-5 pb-8">
          <div className="w-full aspect-square max-h-60 rounded-2xl flex items-center justify-center mt-4 mb-4 relative overflow-hidden bg-card border border-border">
            <div className="absolute -bottom-5 -left-5 w-24 h-24 rounded-full bg-primary/15 blur-[40px]" />
            {videoUrl ? (
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain relative z-10"
              />
            ) : imageUrl ? (
              <img
                src={imageUrl}
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

          <div className="mb-4">
            <h2 className="text-xl font-bold text-foreground tracking-tight mb-1">{currentEx.name}</h2>
            {(curated?.target || currentEx.description) && (
              <p className="text-sm text-muted-foreground">{curated?.target || currentEx.description}</p>
            )}
          </div>

          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: currentEx.sets }, (_, i) => (
              <div
                key={i}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  i < currentSet
                    ? "bg-success text-success-foreground"
                    : i === currentSet
                    ? "bg-primary text-primary-foreground border-2 border-primary"
                    : "bg-secondary border border-border text-muted-foreground"
                }`}
              >
                {i < currentSet ? "✓" : i + 1}
              </div>
            ))}
          </div>

          <div className="text-center mb-6">
            <p className="text-sm text-muted-foreground mb-1">
              Série {currentSet + 1} de {currentEx.sets}
            </p>
            <p className="text-3xl font-bold text-foreground">{currentEx.reps} reps</p>
          </div>

          <button
            onClick={handleCompleteSet}
            className="w-full py-4 rounded-2xl font-bold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25 mb-3"
          >
            {currentSet < currentEx.sets - 1
              ? "Completei essa série ✓"
              : exIndex < totalExercises - 1
              ? "Completei! Próximo exercício →"
              : "Último exercício! Finalizar 🎉"}
          </button>

          <button className="w-full py-3 text-sm font-medium text-info">
            Esse exercício tá difícil? Trocar por outro
          </button>
        </div>
      </div>
    );
  };

  // REST PHASE
  const RestPhase = () => {
    const restSeconds = currentEx?.rest_seconds || 45;
    const timer = useTimer(restSeconds, handleRestComplete);

    useEffect(() => { timer.start(); }, []);

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
    const nextEx = currentSet < (currentEx?.sets || 1) - 1 ? currentEx : exercises[exIndex + 1];
    const nextSetNum = currentSet < (currentEx?.sets || 1) - 1 ? currentSet + 2 : 1;

    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <div className="relative w-48 h-48 mb-8">
          <svg width="192" height="192" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="96" cy="96" r="86" fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
            <circle
              cx="96" cy="96" r="86" fill="none"
              stroke="hsl(var(--success))"
              strokeWidth="6"
              strokeDasharray={`${2 * Math.PI * 86}`}
              strokeDashoffset={`${2 * Math.PI * 86 * (1 - pct / 100)}`}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-foreground tabular-nums">{timer.formatted}</span>
            <span className="text-sm text-muted-foreground">Descanse</span>
          </div>
        </div>

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

        {nextEx && (
          <div className="w-full p-4 rounded-2xl bg-card border border-border mb-6">
            <div className="text-xs text-muted-foreground mb-2">Próximo:</div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {nextSetNum}
              </div>
              <div>
                <p className="font-medium text-foreground">{nextEx.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentSet < (currentEx?.sets || 1) - 1 ? "Próxima série" : "Próximo exercício"}
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            if (currentSet < (currentEx?.sets || 1) - 1) {
              setCurrentSet((s) => s + 1);
            } else if (exIndex < totalExercises - 1) {
              setExIndex((i) => i + 1);
              setCurrentSet(0);
            } else {
              setPhase("cooldown");
              return;
            }
            setPhase("exercise");
          }}
          className="flex items-center gap-2 text-sm font-semibold text-primary"
        >
          Pular descanso <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // COOLDOWN PHASE
  const CooldownPhase = () => {
    const current = cooldownStretches[cooldownStep];
    const timer = useTimer(current.duration, () => {
      if (cooldownStep < cooldownStretches.length - 1) setCooldownStep((s) => s + 1);
      else setPhase("feedback");
    });

    useEffect(() => { timer.reset(current.duration); }, [cooldownStep]);

    return (
      <div className="min-h-screen bg-background px-5 pt-4 pb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-info">
            🧘‍♀️ Resfriamento
          </div>
          <span className="text-xs text-muted-foreground">
            {cooldownStep + 1} de {cooldownStretches.length}
          </span>
        </div>

        <div className="flex gap-1 mb-6">
          {cooldownStretches.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${i <= cooldownStep ? "bg-info" : "bg-border"}`}
            />
          ))}
        </div>

        <div className="w-full h-52 rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden bg-info/5 border border-info/10">
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-info/10 blur-[40px]" />
          <div className="text-center relative z-10">
            <div className="text-5xl mb-2">🧘‍♀️</div>
            <div className="text-lg font-bold text-foreground">{current.name}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border mb-6">
          <p className="text-sm text-foreground leading-relaxed">{current.instruction}</p>
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl font-bold text-foreground tabular-nums">{timer.formatted}</div>
        </div>

        {!timer.running ? (
          <button
            onClick={timer.start}
            className="w-full py-4 rounded-2xl font-bold text-base bg-info text-info-foreground"
          >
            {cooldownStep === 0 ? "Começar Resfriamento ▶" : "Iniciar ▶"}
          </button>
        ) : (
          <button
            onClick={() => {
              if (cooldownStep < cooldownStretches.length - 1) setCooldownStep((s) => s + 1);
              else setPhase("feedback");
            }}
            className="w-full py-4 rounded-2xl font-semibold text-sm border border-info/40 text-info bg-transparent"
          >
            Pular →
          </button>
        )}
      </div>
    );
  };

  // FEEDBACK PHASE
  const FeedbackPhase = () => {
    const options = [
      { emoji: "😅", label: "Fácil", value: "too_easy", className: "border-success bg-success/10" },
      { emoji: "💪", label: "Bom", value: "just_right", className: "border-info bg-info/10" },
      { emoji: "🥵", label: "Pesado", value: "too_hard", className: "border-warning bg-warning/10" },
      { emoji: "😣", label: "Senti dor", value: "felt_pain", className: "border-destructive bg-destructive/10" },
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
              className={`p-3 rounded-2xl text-center transition-all border ${
                feedback === opt.value ? opt.className + " border-2" : "bg-card border-border"
              }`}
            >
              <div className="text-2xl mb-1">{opt.emoji}</div>
              <div className="text-xs text-muted-foreground">{opt.label}</div>
            </button>
          ))}
        </div>

        <button
          onClick={saveWorkout}
          className="w-full py-4 rounded-2xl font-bold text-base bg-primary text-primary-foreground shadow-lg shadow-primary/25"
        >
          Salvar e Concluir
        </button>
      </div>
    );
  };

  // COMPLETION PHASE
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

        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: "⏱️", value: `${durationMin}`, label: "min" },
            { icon: "💪", value: `${totalExercises}`, label: "exercícios" },
            { icon: "🔥", value: `~${Math.round(durationMin * 7)}`, label: "kcal" },
          ].map((s, i) => (
            <div key={i} className="p-4 rounded-2xl bg-card border border-border">
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border mb-6">
          <p className="text-sm font-semibold text-foreground mb-1">Volume Total</p>
          <p className="text-2xl font-bold text-success">{totalSets} séries</p>
        </div>

        <div className="p-5 rounded-2xl mb-4 text-left bg-gradient-to-br from-primary/10 to-purple/10 border border-primary/20">
          <p className="text-sm font-semibold text-foreground mb-1">Compartilhar na Comunidade</p>
          <p className="text-xs text-muted-foreground mb-3">Mostre que você treinou hoje!</p>
          <button
            onClick={() => navigate("/app/community")}
            className="w-full py-3 rounded-xl font-semibold text-sm bg-primary text-primary-foreground"
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

  // RENDER
  return (
    <div>
      {phase === "warmup" && <WarmupPhase />}
      {phase === "exercise" && <ExercisePhase />}
      {phase === "rest" && <RestPhase />}
      {phase === "cooldown" && <CooldownPhase />}
      {phase === "feedback" && <FeedbackPhase />}
      {phase === "complete" && <CompletionPhase />}
    </div>
  );
};

export default AppWorkout;