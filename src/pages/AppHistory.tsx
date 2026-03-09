import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

interface WorkoutLog {
  id: string;
  completed_at: string;
  duration_minutes: number | null;
  workout_id: string;
  workouts: { title: string } | null;
}

const AppHistory = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    if (!loading && !user && !isAdmin) {
      navigate("/app/login");
      return;
    }
    if (user || isAdmin) fetchLogs();
  }, [user, loading, isAdmin]);

  const fetchLogs = async () => {
    if (isAdmin) {
      setLogs([]);
      return;
    }
    
    const { data } = await supabase
      .from("workout_logs")
      .select("id, completed_at, duration_minutes, workout_id, workouts(title)")
      .eq("user_id", user!.id)
      .order("completed_at", { ascending: false })
      .limit(50);
    if (data) {
      setLogs(data as any);
      setTotalWorkouts(data.length);
      setTotalMinutes(data.reduce((sum, l) => sum + (l.duration_minutes || 0), 0));
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const daysAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Hoje";
    if (diff === 1) return "Ontem";
    return `${diff} dias atrás`;
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-10 pb-2">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/app")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Progresso</h1>
          </div>
        </div>
      </header>

      {/* Stats bar */}
      <section className="px-5 py-4">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          <div className="rounded-2xl p-3 text-center" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="text-xl font-bold text-foreground">{totalWorkouts}</div>
            <div className="text-xs text-muted-foreground">Treinos</div>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="text-xl font-bold text-foreground">{Math.round(totalMinutes / 60)}h</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="rounded-2xl p-3 text-center" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <div className="text-xl font-bold" style={{ color: "#E94560" }}>🔥</div>
            <div className="text-xs text-muted-foreground">Sequência</div>
          </div>
        </div>
      </section>

      {/* Logs */}
      <section className="px-5">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-muted-foreground mb-4 font-semibold uppercase tracking-wide">Histórico de Treinos</p>
          {logs.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl mb-3 block">🏆</span>
              <p className="text-foreground font-semibold mb-1">Nenhum treino ainda</p>
              <p className="text-sm text-muted-foreground">
                Complete seu primeiro treino e ele aparecerá aqui!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 rounded-2xl p-4"
                  style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                >
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-lg"
                    style={{ background: "rgba(233,69,96,0.1)" }}
                  >
                    🏋️‍♀️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {(log.workouts as any)?.title || "Treino"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {daysAgo(log.completed_at)} · {formatDate(log.completed_at)}
                    </p>
                  </div>
                  {log.duration_minutes && (
                    <div className="text-right">
                      <span className="text-sm font-semibold text-foreground">{log.duration_minutes}</span>
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border z-20">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 pb-6">
          <button onClick={() => navigate("/app")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">🏠</span>
            <span className="text-[10px] text-muted-foreground">Home</span>
          </button>
          <button onClick={() => navigate("/app/workouts")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">🏋️‍♀️</span>
            <span className="text-[10px] text-muted-foreground">Treinos</span>
          </button>
          <button onClick={() => navigate("/app/community")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">👥</span>
            <span className="text-[10px] text-muted-foreground">Social</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg">📊</span>
            <span className="text-[10px] font-semibold text-primary">Progresso</span>
            <div className="w-1 h-1 rounded-full bg-primary" />
          </button>
          <button className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">👤</span>
            <span className="text-[10px] text-muted-foreground">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AppHistory;
