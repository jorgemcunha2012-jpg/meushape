import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle2, Timer } from "lucide-react";
import { useMuscleWikiMedia } from "@/hooks/useMuscleWikiMedia";

interface Stretch {
  id: string;
  name_pt: string;
  type: string;
  target_muscles: string[];
  duration_seconds: number;
  per_side: boolean;
  reps: number | null;
  instruction_pt: string | null;
  sort_order: number;
}

const AppStretching = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "mobility"; // dynamic, static, mobility
  const split = searchParams.get("split") || "";

  const [stretches, setStretches] = useState<Stretch[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [side, setSide] = useState<"left" | "right">("left");
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user && !isAdmin) navigate("/app/login");
    if (user || isAdmin) fetchStretches();
  }, [user, loading, isAdmin]);

  const fetchStretches = async () => {
    let query = supabase
      .from("stretches")
      .select("*")
      .eq("type", type)
      .eq("active", true)
      .order("sort_order");

    if (type === "dynamic" && split) {
      query = query.contains("before_splits", [split]);
    } else if (type === "static" && split) {
      query = query.contains("after_splits", [split]);
    }

    const { data } = await query;
    if (data && data.length > 0) {
      setStretches(data);
      setTimeLeft(data[0].duration_seconds || 30);
    }
  };

  const current = stretches[currentIndex];

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        // Time's up
        if (current?.per_side && side === "left") {
          setSide("right");
          return current.duration_seconds;
        }
        // Move to next
        if (currentIndex < stretches.length - 1) {
          const next = stretches[currentIndex + 1];
          setCurrentIndex(currentIndex + 1);
          setSide("left");
          return next.duration_seconds || 30;
        }
        // All done
        setIsRunning(false);
        setCompleted(true);
        return 0;
      }
      return prev - 1;
    });
  }, [current, currentIndex, side, stretches]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, tick]);

  const handleSkip = () => {
    if (current?.per_side && side === "left") {
      setSide("right");
      setTimeLeft(current.duration_seconds);
      return;
    }
    if (currentIndex < stretches.length - 1) {
      const next = stretches[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      setSide("left");
      setTimeLeft(next.duration_seconds || 30);
    } else {
      setCompleted(true);
      setIsRunning(false);
    }
  };

  const typeLabels: Record<string, string> = {
    dynamic: "Alongamento Dinâmico",
    static: "Alongamento Estático",
    mobility: "Sessão de Mobilidade",
  };

  if (loading) return null;

  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Sessão completa! 🧘‍♀️</h1>
        <p className="text-muted-foreground text-center mb-6">
          {type === "dynamic" ? "Você está aquecida e pronta pro treino!" :
           type === "static" ? "Músculos relaxados. Boa recuperação!" :
           "Mobilidade feita! Seu corpo agradece."}
        </p>
        <Button onClick={() => navigate(-1)} className="rounded-full">Voltar</Button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <Timer className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-foreground font-medium mb-2">Nenhum alongamento encontrado</p>
        <p className="text-muted-foreground text-sm mb-4">Tente outro tipo ou split.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-full">Voltar</Button>
      </div>
    );
  }

  const progress = ((currentIndex + (current.per_side && side === "right" ? 0.5 : 0)) / stretches.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-display text-sm font-bold text-foreground">{typeLabels[type]}</h1>
            <p className="text-xs text-muted-foreground">{currentIndex + 1} de {stretches.length}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <p className="text-xs text-primary font-medium uppercase tracking-wider mb-2">
          {current.per_side ? `Lado ${side === "left" ? "esquerdo" : "direito"}` : ""}
        </p>
        <h2 className="font-display text-2xl font-bold text-foreground text-center mb-4">
          {current.name_pt}
        </h2>

        {/* Timer circle */}
        <div className="relative w-40 h-40 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke="hsl(var(--primary))" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - timeLeft / (current.duration_seconds || 30))}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {current.reps ? (
              <span className="text-3xl font-bold text-foreground">{current.reps} reps</span>
            ) : (
              <span className="text-4xl font-bold text-foreground">{timeLeft}s</span>
            )}
          </div>
        </div>

        {/* Instruction */}
        {current.instruction_pt && (
          <p className="text-muted-foreground text-center text-sm max-w-sm mb-8 leading-relaxed">
            {current.instruction_pt}
          </p>
        )}

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
          <Button
            size="lg"
            variant="outline"
            onClick={handleSkip}
            className="rounded-full w-12 h-12"
          >
            <SkipForward className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AppStretching;
