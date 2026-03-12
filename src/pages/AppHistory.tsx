import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, Dumbbell, Clock, Flame } from "lucide-react";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";

interface WorkoutLog {
  id: string;
  completed_at: string;
  duration_minutes: number | null;
  workout_id: string;
  workouts: { title: string } | null;
}

const AppHistory = () => {
  const S = useSolar();
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [totalWorkouts, setTotalWorkouts] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    if (!loading && !user && !isAdmin) { navigate("/app/login"); return; }
    if (user || isAdmin) fetchLogs();
  }, [user, loading, isAdmin]);

  const fetchLogs = async () => {
    if (isAdmin) { setLogs([]); return; }
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

  const daysAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Hoje";
    if (diff === 1) return "Ontem";
    return `${diff} dias atrás`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

  const cardStyle = {
    backgroundColor: S.card,
    border: `1px solid ${S.cardBorder}`,
    borderRadius: "1.5rem",
    boxShadow: `0 2px 12px rgba(234,88,12,0.04)`,
  };

  const stats = [
    { icon: Dumbbell, label: "Treinos", value: totalWorkouts, gradient: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", iconColor: S.orange },
    { icon: Clock, label: "Total", value: `${Math.round(totalMinutes / 60)}h`, gradient: "linear-gradient(135deg, #EFF6FF, #DBEAFE)", iconColor: "#3B82F6" },
    { icon: Flame, label: "Sequência", value: "🔥", gradient: "linear-gradient(135deg, #FEF3C7, #FDE68A)", iconColor: S.amber },
  ];

  return (
    <SolarPage>
      {/* Header */}
      <header
        className="sticky top-0 z-20 px-5 pt-4 pb-3"
        style={{
          backgroundColor: "rgba(253,252,251,0.8)",
          backdropFilter: "blur(20px) saturate(1.6)",
          WebkitBackdropFilter: "blur(20px) saturate(1.6)",
        }}
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate("/app")}
            className="w-9 h-9 flex items-center justify-center transition-all active:scale-95"
            style={{
              borderRadius: "0.75rem",
              backgroundColor: S.card,
              border: `1px solid ${S.cardBorder}`,
              boxShadow: `0 2px 8px rgba(234,88,12,0.06)`,
            }}
          >
            <ArrowLeft size={16} style={{ color: S.textSub }} />
          </button>
          <h1 className="font-display text-xl" style={{ fontWeight: 800, color: S.text, letterSpacing: "-0.02em" }}>
            Progresso
          </h1>
        </div>
      </header>

      {/* Stats */}
      <section className="px-5 py-4">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-2.5">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-3.5 text-center"
              style={cardStyle}
            >
              <div
                className="w-9 h-9 flex items-center justify-center mx-auto mb-2"
                style={{ borderRadius: "0.75rem", background: stat.gradient }}
              >
                <stat.icon size={16} style={{ color: stat.iconColor }} strokeWidth={2.5} />
              </div>
              <div className="font-display text-lg" style={{ fontWeight: 800, color: S.text }}>{stat.value}</div>
              <div className="text-[11px]" style={{ color: S.textMuted }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Logs */}
      <section className="px-5">
        <div className="max-w-lg mx-auto">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.12em] mb-4"
            style={{ color: S.textSub }}
          >
            Histórico de Treinos
          </p>
          {logs.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-4xl mb-3 block">🏆</span>
              <p className="font-display text-sm mb-1" style={{ fontWeight: 700, color: S.text }}>
                Nenhum treino ainda
              </p>
              <p className="text-[12px]" style={{ color: S.textMuted }}>
                Complete seu primeiro treino e ele aparecerá aqui!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {logs.map((log, i) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 p-4"
                  style={cardStyle}
                >
                  <div
                    className="w-11 h-11 flex items-center justify-center shrink-0 text-lg"
                    style={{ borderRadius: "0.75rem", background: "linear-gradient(135deg, #FFF7ED, #FFEDD5)" }}
                  >
                    🏋️‍♀️
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm" style={{ fontWeight: 700, color: S.text }}>
                      {(log.workouts as any)?.title || "Treino"}
                    </p>
                    <p className="text-[11px]" style={{ color: S.textMuted }}>
                      {daysAgo(log.completed_at)} · {formatDate(log.completed_at)}
                    </p>
                  </div>
                  {log.duration_minutes && (
                    <div className="text-right">
                      <span className="font-display text-sm" style={{ fontWeight: 800, color: S.text }}>
                        {log.duration_minutes}
                      </span>
                      <span className="text-[11px] ml-0.5" style={{ color: S.textMuted }}>min</span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </SolarPage>
  );
};

export default AppHistory;
