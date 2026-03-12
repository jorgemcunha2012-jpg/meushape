import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle2, Zap } from "lucide-react";
import { useMuscleWikiMedia } from "@/hooks/useMuscleWikiMedia";

interface WarmupExercise {
  phase: string;
  name: string;
  duration: string;
}

interface WarmupRoutine {
  id: string;
  name_pt: string;
  split_type: string;
  exercises: WarmupExercise[];
  total_duration_min: number;
}

const phaseColors: Record<string, string> = {
  "Cardio leve": "bg-orange-500/10 text-orange-600",
  Mobilidade: "bg-blue-500/10 text-blue-600",
  "Ativação": "bg-green-500/10 text-green-600",
};

const AppWarmup = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const split = searchParams.get("split") || "legs";
  const returnTo = searchParams.get("returnTo");

  const [routine, setRoutine] = useState<WarmupRoutine | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user && !isAdmin) navigate("/app/login");
    if (user || isAdmin) fetchRoutine();
  }, [user, loading, isAdmin]);

  const fetchRoutine = async () => {
    const { data } = await supabase
      .from("warmup_routines")
      .select("*")
      .eq("split_type", split)
      .eq("active", true)
      .single();
    if (data) {
      const parsed = {
        ...data,
        exercises: typeof data.exercises === "string" ? JSON.parse(data.exercises) : data.exercises,
      } as WarmupRoutine;
      setRoutine(parsed);
      setTimeLeft(parseDuration(parsed.exercises[0]?.duration || "30s"));
    }
  };

  const parseDuration = (dur: string): number => {
    if (dur.includes("min")) return parseInt(dur) * 60 || 120;
    if (dur.includes("reps")) return 30; // estimate 30s for rep-based
    return parseInt(dur) || 30;
  };

  const current = routine?.exercises[currentIndex];
  const exerciseNames = useMemo(() => routine?.exercises.map(e => e.name) || [], [routine]);
  const { media: mwMedia, loading: mediaLoading } = useMuscleWikiMedia(exerciseNames);
  const currentMedia = current ? mwMedia[current.name] : undefined;

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        if (routine && currentIndex < routine.exercises.length - 1) {
          const next = routine.exercises[currentIndex + 1];
          setCurrentIndex(currentIndex + 1);
          return parseDuration(next.duration);
        }
        setIsRunning(false);
        setCompleted(true);
        return 0;
      }
      return prev - 1;
    });
  }, [routine, currentIndex]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, tick]);

  const handleSkip = () => {
    if (routine && currentIndex < routine.exercises.length - 1) {
      const next = routine.exercises[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      setTimeLeft(parseDuration(next.duration));
    } else {
      setCompleted(true);
      setIsRunning(false);
    }
  };

  if (loading) return null;

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Aquecida! 🔥</h1>
        <p className="text-muted-foreground text-center mb-6">
          Agora sim, bora treinar com tudo!
        </p>
        <Button onClick={() => returnTo ? navigate(returnTo) : navigate(-1)} className="rounded-full">
          Ir pro treino →
        </Button>
      </div>
    );
  }

  if (!routine || !current) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Zap className="w-8 h-8 text-muted-foreground animate-pulse" />
      </div>
    );
  }

  const progress = ((currentIndex + 1) / routine.exercises.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-sm font-bold text-foreground">{routine.name_pt}</h1>
            <p className="text-xs text-muted-foreground">{currentIndex + 1} de {routine.exercises.length} • ~{routine.total_duration_min} min</p>
          </div>
        </div>
        <div className="h-1 bg-secondary">
          <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full mb-4 ${phaseColors[current.phase] || "bg-primary/10 text-primary"}`}>
          {current.phase}
        </span>

        {/* MuscleWiki media */}
        {mediaLoading && !currentMedia ? (
          <div className="h-36 w-48 rounded-2xl mb-4 bg-muted shimmer-loading" />
        ) : currentMedia?.video ? (
          <video src={currentMedia.video} autoPlay loop muted playsInline className="h-36 rounded-2xl object-contain mb-4" />
        ) : currentMedia?.image ? (
          <img src={currentMedia.image} alt={current.name} className="h-36 rounded-2xl object-contain mb-4" />
        ) : null}

        <h2 className="font-display text-2xl font-bold text-foreground text-center mb-2">
          {current.name}
        </h2>
        <p className="text-muted-foreground text-sm mb-6">{current.duration}</p>

        {/* Timer */}
        <div className="relative w-36 h-36 mb-8">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - timeLeft / parseDuration(current.duration))}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold text-foreground">{timeLeft}s</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <Button
            size="lg"
            variant={isRunning ? "outline" : "default"}
            onClick={() => setIsRunning(!isRunning)}
            className="rounded-full w-16 h-16"
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
          </Button>
          <Button size="lg" variant="outline" onClick={handleSkip} className="rounded-full w-12 h-12">
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>

        {/* Upcoming */}
        {currentIndex < routine.exercises.length - 1 && (
          <div className="mt-8 bg-card border border-border rounded-xl px-4 py-3 w-full max-w-sm">
            <p className="text-xs text-muted-foreground mb-1">Próximo:</p>
            <p className="text-sm font-medium text-foreground">{routine.exercises[currentIndex + 1].name}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppWarmup;
