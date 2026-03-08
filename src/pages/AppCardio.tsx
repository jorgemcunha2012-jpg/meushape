import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, CheckCircle2, Loader2, Flame, Timer, Gauge } from "lucide-react";

interface Phase {
  phase_name: string;
  start_min?: number;
  end_min?: number;
  duration_seconds?: number;
  speed_kmh?: number;
  incline_pct?: number;
  level?: number;
  resistance_level?: number;
  instruction_pt: string;
  is_interval?: boolean;
}

interface CardioProtocol {
  id: string;
  name_pt: string;
  protocol_type: string;
  equipment: string;
  difficulty_level: number;
  total_duration_min: number;
  estimated_calories: number | null;
  phases: Phase[];
}

const AppCardio = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { protocolId } = useParams();

  const [protocols, setProtocols] = useState<CardioProtocol[]>([]);
  const [selected, setSelected] = useState<CardioProtocol | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [intervalCount, setIntervalCount] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate("/app/login");
    if (user) fetchProtocols();
  }, [user, loading]);

  const fetchProtocols = async () => {
    const { data } = await supabase
      .from("cardio_protocols")
      .select("*")
      .eq("active", true)
      .order("difficulty_level");
    if (data) {
      const parsed = data.map((p: any) => ({
        ...p,
        phases: typeof p.phases === "string" ? JSON.parse(p.phases) : p.phases,
      }));
      setProtocols(parsed);
      if (protocolId) {
        const found = parsed.find((p: any) => p.id === protocolId);
        if (found) setSelected(found);
      }
    }
  };

  // Determine current phase based on elapsed time
  const getCurrentPhase = useCallback((): { phase: Phase; phaseTimeLeft: number; phaseIndex: number } | null => {
    if (!selected) return null;
    const phases = selected.phases;
    let elapsed = totalSeconds;

    // Handle interval-based protocols (HIIT)
    const hasIntervals = phases.some((p) => p.is_interval);
    if (hasIntervals) {
      // Build a timeline from phases
      const timeline: { phase: Phase; startSec: number; endSec: number }[] = [];
      let t = 0;
      for (const p of phases) {
        if (p.is_interval) {
          // Repeat intervals 10 times
          for (let i = 0; i < 10; i++) {
            const dur = p.duration_seconds || 30;
            timeline.push({ phase: { ...p, phase_name: `${p.phase_name} (${i + 1}/10)` }, startSec: t, endSec: t + dur });
            t += dur;
          }
        } else if (p.start_min !== undefined && p.end_min !== undefined) {
          timeline.push({ phase: p, startSec: p.start_min * 60, endSec: p.end_min * 60 });
          t = Math.max(t, p.end_min * 60);
        }
      }
      // Find current
      for (let i = 0; i < timeline.length; i++) {
        if (elapsed >= timeline[i].startSec && elapsed < timeline[i].endSec) {
          return { phase: timeline[i].phase, phaseTimeLeft: timeline[i].endSec - elapsed, phaseIndex: i };
        }
      }
      return null;
    }

    // Regular timed phases
    for (let i = 0; i < phases.length; i++) {
      const p = phases[i];
      if (p.start_min !== undefined && p.end_min !== undefined) {
        const startSec = p.start_min * 60;
        const endSec = p.end_min * 60;
        if (elapsed >= startSec && elapsed < endSec) {
          return { phase: p, phaseTimeLeft: endSec - elapsed, phaseIndex: i };
        }
      }
    }
    return null;
  }, [selected, totalSeconds]);

  const tick = useCallback(() => {
    setTotalSeconds((prev) => {
      const next = prev + 1;
      if (selected && next >= selected.total_duration_min * 60) {
        setIsRunning(false);
        setCompleted(true);
      }
      return next;
    });
  }, [selected]);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(tick, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, tick]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const equipmentLabels: Record<string, string> = {
    treadmill: "🏃‍♀️ Esteira",
    elliptical: "🔵 Elíptico",
    stair_climber: "🪜 Escada",
    bike: "🚴‍♀️ Bicicleta",
  };

  const typeLabels: Record<string, string> = {
    liss: "LISS",
    miss: "MISS",
    hiit: "HIIT",
    incline_walking: "Incline Walk",
  };

  if (loading) return null;

  // Protocol selection
  if (!selected) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-lg font-bold text-foreground">Cardio Guiado</h1>
          </div>
        </header>
        <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
          {protocols.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="w-full bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{p.name_pt}</p>
                  <p className="text-xs text-muted-foreground">
                    {equipmentLabels[p.equipment]} • {typeLabels[p.protocol_type]} • {p.total_duration_min} min
                    {p.estimated_calories && ` • ~${p.estimated_calories} kcal`}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Completed
  if (completed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <CheckCircle2 className="w-16 h-16 text-primary mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Cardio finalizado! 🔥</h1>
        <p className="text-muted-foreground text-center mb-2">
          {selected.name_pt} — {selected.total_duration_min} min
        </p>
        {selected.estimated_calories && (
          <p className="text-primary font-bold mb-6">~{selected.estimated_calories} kcal queimadas</p>
        )}
        <Button onClick={() => navigate("/app")} className="rounded-full">Voltar ao início</Button>
      </div>
    );
  }

  // Active session
  const currentPhase = getCurrentPhase();
  const elapsed = totalSeconds;
  const totalSec = selected.total_duration_min * 60;
  const progressPct = Math.min((elapsed / totalSec) * 100, 100);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => { setIsRunning(false); setSelected(null); setTotalSeconds(0); }} className="text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-sm font-bold text-foreground">
                {typeLabels[selected.protocol_type]} — {equipmentLabels[selected.equipment]?.split(" ")[1]}
              </h1>
            </div>
          </div>
          <span className="text-sm font-mono font-bold text-foreground">{formatTime(elapsed)}</span>
        </div>
        <div className="h-1 bg-secondary">
          <div className="h-full bg-primary transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {currentPhase ? (
          <>
            <p className="text-xs text-primary font-medium uppercase tracking-wider mb-3">
              {currentPhase.phase.phase_name}
            </p>

            {/* Settings display */}
            <div className="flex gap-4 mb-6">
              {currentPhase.phase.speed_kmh && (
                <div className="bg-card border border-border rounded-xl px-4 py-3 text-center">
                  <Gauge className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{currentPhase.phase.speed_kmh}</p>
                  <p className="text-xs text-muted-foreground">km/h</p>
                </div>
              )}
              {currentPhase.phase.incline_pct !== undefined && currentPhase.phase.incline_pct !== null && (
                <div className="bg-card border border-border rounded-xl px-4 py-3 text-center">
                  <span className="text-primary text-sm">⛰️</span>
                  <p className="text-lg font-bold text-foreground">{currentPhase.phase.incline_pct}%</p>
                  <p className="text-xs text-muted-foreground">inclinação</p>
                </div>
              )}
              {currentPhase.phase.level && (
                <div className="bg-card border border-border rounded-xl px-4 py-3 text-center">
                  <Flame className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-lg font-bold text-foreground">{currentPhase.phase.level}</p>
                  <p className="text-xs text-muted-foreground">nível</p>
                </div>
              )}
            </div>

            {/* Phase timer */}
            <div className="relative w-36 h-36 mb-6">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
                <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--primary))" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - (currentPhase.phaseTimeLeft / ((currentPhase.phase.duration_seconds || ((currentPhase.phase.end_min! - currentPhase.phase.start_min!) * 60)) || 60)))}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-foreground">{formatTime(currentPhase.phaseTimeLeft)}</span>
              </div>
            </div>

            {/* Instruction */}
            <p className="text-muted-foreground text-center text-sm max-w-sm leading-relaxed mb-8">
              {currentPhase.phase.instruction_pt}
            </p>
          </>
        ) : (
          <p className="text-muted-foreground">Preparando...</p>
        )}

        {/* Play/Pause */}
        <Button
          size="lg"
          variant={isRunning ? "outline" : "default"}
          onClick={() => setIsRunning(!isRunning)}
          className="rounded-full w-16 h-16"
        >
          {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
        </Button>
      </div>
    </div>
  );
};

export default AppCardio;
