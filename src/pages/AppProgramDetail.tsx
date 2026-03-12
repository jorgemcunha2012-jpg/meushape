import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ChevronRight, Clock, Dumbbell, Flame, Zap, Play } from "lucide-react";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";

interface Program {
  id: string;
  title: string;
  description: string | null;
  level: string;
  days_per_week: number;
  duration_minutes: number;
}

interface Workout {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  day_of_week: number | null;
  exerciseCount?: number;
}

const levelLabel = (l: string) => {
  if (l === "beginner") return "Iniciante";
  if (l === "intermediate") return "Intermediário";
  return "Avançado";
};

const levelColor = (l: string) => {
  if (l === "beginner") return { text: "#16a34a", bg: "rgba(22,163,74,0.1)" };
  if (l === "intermediate") return { text: "#F59E0B", bg: "rgba(245,158,11,0.1)" };
  return { text: "#F87171", bg: "rgba(248,113,113,0.1)" };
};

const AppProgramDetail = () => {
  const { programId } = useParams();
  const navigate = useNavigate();
  const S = useSolar();
  const { user, subscriptionLoading } = useAuth();

  const [program, setProgram] = useState<Program | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subscriptionLoading && !user) {
      navigate("/app/login");
      return;
    }
    if (programId) fetchData();
  }, [programId, user, subscriptionLoading]);

  const fetchData = async () => {
    setLoading(true);
    const [progRes, wkRes] = await Promise.all([
      supabase.from("workout_programs").select("*").eq("id", programId!).single(),
      supabase.from("workouts").select("id, title, description, sort_order, day_of_week").eq("program_id", programId!).order("sort_order"),
    ]);

    if (progRes.data) setProgram(progRes.data);

    if (wkRes.data) {
      // Count exercises per workout
      const workoutIds = wkRes.data.map(w => w.id);
      const { data: exercises } = await supabase
        .from("exercises")
        .select("workout_id")
        .in("workout_id", workoutIds);

      const countMap: Record<string, number> = {};
      exercises?.forEach(e => {
        countMap[e.workout_id] = (countMap[e.workout_id] || 0) + 1;
      });

      setWorkouts(wkRes.data.map(w => ({ ...w, exerciseCount: countMap[w.id] || 0 })));
    }
    setLoading(false);
  };

  const todayIndex = new Date().getDay();

  const cardStyle = {
    backgroundColor: S.card,
    border: `1px solid ${S.cardBorder}`,
    borderRadius: "1.25rem",
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const lc = program ? levelColor(program.level) : { text: "", bg: "" };

  return (
    <SolarPage>
      <SolarHeader title={program?.title || "Programa"} showBack />

      {/* Program Info */}
      <section className="px-5 py-4">
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
            {program?.description && (
              <p className="text-sm mb-3" style={{ color: S.textMuted }}>{program.description}</p>
            )}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-semibold px-2.5 py-1"
                style={{ color: lc.text, background: lc.bg, borderRadius: "0.5rem" }}>
                {program ? levelLabel(program.level) : ""}
              </span>
              <span className="text-[11px] flex items-center gap-1" style={{ color: S.textMuted }}>
                <Clock className="w-3 h-3" /> {program?.duration_minutes} min
              </span>
              <span className="text-[11px] flex items-center gap-1" style={{ color: S.textMuted }}>
                <Dumbbell className="w-3 h-3" /> {program?.days_per_week}x/semana
              </span>
              <span className="text-[11px] flex items-center gap-1" style={{ color: S.textMuted }}>
                <Flame className="w-3 h-3" /> {workouts.length} treinos
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Workouts List */}
      <section className="px-5">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-sm mb-3" style={{ fontWeight: 700, color: S.text }}>Plano de Treino</h2>

          <div className="space-y-2">
            {workouts.map((wk, wi) => {
              const isToday = (wk.day_of_week ?? wk.sort_order) === todayIndex;
              return (
                <motion.button
                  key={wk.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: wi * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(`/app/workout-detail/${wk.id}`)}
                  className="w-full text-left p-4 flex items-center gap-3 transition-all"
                  style={cardStyle}
                >
                  {/* Letter badge */}
                  <div className="w-11 h-11 flex items-center justify-center text-sm shrink-0 font-display"
                    style={{
                      borderRadius: "0.85rem", fontWeight: 800,
                      background: isToday ? `linear-gradient(135deg, ${S.orange}, ${S.amber})` : `${S.orange}12`,
                      color: isToday ? "#fff" : S.orange,
                      boxShadow: isToday ? `0 4px 12px ${S.glowStrong}` : "none",
                    }}>
                    {String.fromCharCode(65 + wi)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm" style={{ fontWeight: 700, color: S.text }}>{wk.title}</p>
                    {wk.description && (
                      <p className="text-[11px] truncate mt-0.5" style={{ color: S.textMuted }}>{wk.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] flex items-center gap-1" style={{ color: S.textSub }}>
                        <Dumbbell className="w-3 h-3" /> {wk.exerciseCount} exercícios
                      </span>
                    </div>
                  </div>

                  {/* Right side */}
                  {isToday ? (
                    <span className="text-[9px] font-bold px-2.5 py-1 shrink-0"
                      style={{ borderRadius: "0.75rem", background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, color: "#fff", boxShadow: `0 2px 8px ${S.glow}` }}>
                      HOJE
                    </span>
                  ) : (
                    <ChevronRight size={16} style={{ color: S.cardBorder }} />
                  )}
                </motion.button>
              );
            })}

            {workouts.length === 0 && (
              <div className="text-center py-12" style={{ color: S.textMuted }}>
                <Dumbbell size={32} className="mx-auto mb-3" style={{ color: S.cardBorder }} />
                <p className="text-sm">Nenhum treino neste programa ainda</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </SolarPage>
  );
};

export default AppProgramDetail;
