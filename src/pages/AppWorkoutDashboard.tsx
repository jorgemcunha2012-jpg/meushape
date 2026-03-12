import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ChevronRight, Plus, ClipboardList, Zap, Home, StretchHorizontal } from "lucide-react";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";
import illustrationTreino from "@/assets/illustration-treino.png";
import illustrationCardio from "@/assets/illustration-cardio.png";
import illustrationCasa from "@/assets/illustration-casa.png";
import illustrationAlong from "@/assets/illustration-alongamento.png";

interface Workout {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  day_of_week: number | null;
}

interface CardioProtocol {
  id: string;
  name_pt: string;
  protocol_type: string;
  total_duration_min: number;
  difficulty_level: number;
  estimated_calories: number | null;
  equipment: string;
}

interface HomeTemplate {
  id: string;
  name_pt: string;
  category: string;
  duration_min: number;
  difficulty_level: number;
  equipment: string;
}

interface StretchSession {
  id: string;
  name_pt: string;
  type: string;
  duration_seconds: number;
  target_muscles: string[];
}

type TabId = "plano" | "cardio" | "casa" | "along";

const TABS: { id: TabId; label: string; icon: typeof ClipboardList; illustration: string }[] = [
  { id: "plano", label: "Meu Plano", icon: ClipboardList, illustration: illustrationTreino },
  { id: "cardio", label: "Cardio", icon: Zap, illustration: illustrationCardio },
  { id: "casa", label: "Em Casa", icon: Home, illustration: illustrationCasa },
  { id: "along", label: "Alongamento", icon: StretchHorizontal, illustration: illustrationAlong },
];

const levelLabel = (level: number) => {
  if (level <= 1) return "Iniciante";
  if (level <= 2) return "Intermediário";
  return "Avançado";
};

const levelColor = (level: number) => {
  if (level <= 1) return { text: "#16a34a", bg: "rgba(22,163,74,0.1)" };
  if (level <= 2) return { text: "#F59E0B", bg: "rgba(245,158,11,0.1)" };
  return { text: "#F87171", bg: "rgba(248,113,113,0.1)" };
};

const cardioIcon = (type: string) => {
  if (type === "hiit") return "🔥";
  if (type === "liss") return "🚶‍♀️";
  return "🏃‍♀️";
};

const AppWorkoutDashboard = () => {
  const S = useSolar();
  const { user, subscribed, subscriptionLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabId>("plano");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [cardioProtocols, setCardioProtocols] = useState<CardioProtocol[]>([]);
  const [homeTemplates, setHomeTemplates] = useState<HomeTemplate[]>([]);
  const [stretches, setStretches] = useState<StretchSession[]>([]);
  const [cyclePhase, setCyclePhase] = useState("");
  const [cycleWeek, setCycleWeek] = useState(0);

  useEffect(() => {
    if (!subscriptionLoading && !user) { navigate("/app/login"); return; }
    if (user && subscribed) fetchAllData();
  }, [user, subscribed, subscriptionLoading, navigate]);

  const fetchAllData = async () => {
    const [programRes, cardioRes, homeRes, stretchRes] = await Promise.all([
      supabase.from("workout_programs").select("*").eq("is_active", true).limit(1),
      supabase.from("cardio_protocols").select("*").eq("active", true),
      supabase.from("home_workout_templates").select("*").eq("active", true),
      supabase.from("stretches").select("*").eq("active", true).order("sort_order").limit(10),
    ]);

    if (programRes.data && programRes.data.length > 0) {
      const prog = programRes.data[0];
      const [workoutRes, cycleRes] = await Promise.all([
        supabase.from("workouts").select("*").eq("program_id", prog.id).order("sort_order"),
        supabase.from("progression_cycles").select("phase, current_week").eq("user_id", user!.id).eq("program_id", prog.id).single(),
      ]);
      if (workoutRes.data) setWorkouts(workoutRes.data);
      if (cycleRes.data) { setCyclePhase(cycleRes.data.phase); setCycleWeek(cycleRes.data.current_week); }
    }

    if (cardioRes.data) setCardioProtocols(cardioRes.data);
    if (homeRes.data) setHomeTemplates(homeRes.data);
    if (stretchRes.data) setStretches(stretchRes.data);
  };

  const todayIndex = new Date().getDay();
  const phaseNames: Record<string, string> = {
    adaptation: "Adaptação", building: "Construção",
    intensify: "Intensificação", peak: "Pico", deload: "Deload",
  };

  /* ─── Shared card style ─── */
  const cardStyle = {
    backgroundColor: S.card,
    border: `1px solid ${S.cardBorder}`,
    borderRadius: "1.5rem",
    boxShadow: `0 2px 12px rgba(234,88,12,0.04)`,
  };

  return (
    <SolarPage>
      <SolarHeader
        title="Treinos"
        showBack
        rightContent={
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate("/app/manage")}
            className="w-9 h-9 flex items-center justify-center transition-all"
            style={{
              borderRadius: "0.75rem",
              background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`,
              boxShadow: `0 2px 12px ${S.glowStrong}`,
            }}
          >
            <Plus size={18} style={{ color: "#fff" }} strokeWidth={2.5} />
          </motion.button>
        }
      />

      {/* Tab Bar */}
      <section className="px-5 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {TABS.map(t => (
              <motion.button
                key={t.id}
                onClick={() => setTab(t.id)}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all"
                style={{
                  borderRadius: "1.25rem",
                  background: tab === t.id
                    ? `linear-gradient(135deg, ${S.orange}, ${S.amber})`
                    : S.card,
                  color: tab === t.id ? "#fff" : S.textMuted,
                  border: tab === t.id ? "none" : `1px solid ${S.cardBorder}`,
                  boxShadow: tab === t.id ? `0 4px 16px ${S.glowStrong}` : `0 1px 4px rgba(234,88,12,0.04)`,
                }}
              >
                <span className="text-sm">{t.icon}</span>
                {t.label}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* TAB: Meu Plano */}
      {tab === "plano" && (
        <section className="px-5">
          <div className="max-w-lg mx-auto">
            {cyclePhase && (
              <p className="text-xs mb-4" style={{ color: S.textMuted }}>
                Semana {cycleWeek} — {phaseNames[cyclePhase] || cyclePhase}
              </p>
            )}
            <div className="space-y-2.5">
              {workouts.map((workout, i) => {
                const isToday = (workout.day_of_week ?? workout.sort_order) === todayIndex;
                return (
                  <motion.button
                    key={workout.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/app/workout-detail/${workout.id}`)}
                    className="w-full flex items-center gap-3 p-4 text-left transition-all"
                    style={cardStyle}
                  >
                    <div
                      className="w-11 h-11 flex items-center justify-center text-xs shrink-0 font-display"
                      style={{
                        borderRadius: "0.75rem",
                        fontWeight: 800,
                        background: isToday ? `linear-gradient(135deg, ${S.orange}, ${S.amber})` : "#FFF7ED",
                        color: isToday ? "#fff" : S.orange,
                        boxShadow: isToday ? `0 4px 16px ${S.glowStrong}` : "none",
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm mb-0.5" style={{ fontWeight: 700, color: S.text }}>
                        {workout.title}
                      </p>
                      {workout.description && (
                        <p className="text-[11px] truncate" style={{ color: S.textMuted }}>{workout.description}</p>
                      )}
                    </div>
                    {isToday ? (
                      <span
                        className="text-[10px] font-bold px-3 py-1"
                        style={{
                          borderRadius: "0.75rem",
                          background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`,
                          color: "#fff",
                          boxShadow: `0 2px 8px ${S.glow}`,
                        }}
                      >
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
                  <span className="text-3xl mb-3 block">📋</span>
                  <p className="text-sm">Nenhum plano de treino disponível</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TAB: Cardio */}
      {tab === "cardio" && (
        <section className="px-5">
          <div className="max-w-lg mx-auto">
            <p className="text-xs mb-4" style={{ color: S.textMuted }}>
              Protocolos de cardio guiado com velocidade e inclinação em tempo real
            </p>
            <div className="space-y-3">
              {cardioProtocols.map((protocol, i) => {
                const lc = levelColor(protocol.difficulty_level);
                return (
                  <motion.button
                    key={protocol.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/app/cardio/${protocol.id}`)}
                    className="w-full p-4 text-left transition-all"
                    style={cardStyle}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-2xl">{cardioIcon(protocol.protocol_type)}</span>
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1"
                        style={{ color: lc.text, background: lc.bg, borderRadius: "0.5rem" }}
                      >
                        {levelLabel(protocol.difficulty_level)}
                      </span>
                    </div>
                    <h3 className="font-display text-sm mb-0.5" style={{ fontWeight: 700, color: S.text }}>
                      {protocol.name_pt}
                    </h3>
                    <p className="text-[11px] mb-2" style={{ color: S.textMuted }}>{protocol.equipment}</p>
                    <div className="flex gap-3 text-[11px]" style={{ color: S.textSub }}>
                      <span>⏱️ {protocol.total_duration_min} min</span>
                      {protocol.estimated_calories && <span>🔥 {protocol.estimated_calories} kcal</span>}
                    </div>
                  </motion.button>
                );
              })}
              {cardioProtocols.length === 0 && (
                <div className="text-center py-12" style={{ color: S.textMuted }}>
                  <span className="text-3xl mb-3 block">🏃‍♀️</span>
                  <p className="text-sm">Nenhum protocolo de cardio disponível</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TAB: Em Casa */}
      {tab === "casa" && (
        <section className="px-5">
          <div className="max-w-lg mx-auto">
            <p className="text-xs mb-4" style={{ color: S.textMuted }}>Treinos completos sem precisar de academia</p>
            <div className="space-y-3">
              {homeTemplates.map((template, i) => {
                const lc = levelColor(template.difficulty_level);
                return (
                  <motion.button
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/app/home-workout/${template.id}`)}
                    className="w-full p-4 text-left"
                    style={cardStyle}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-2xl">💪</span>
                      <span
                        className="text-[10px] font-semibold px-2.5 py-1"
                        style={{ color: lc.text, background: lc.bg, borderRadius: "0.5rem" }}
                      >
                        {levelLabel(template.difficulty_level)}
                      </span>
                    </div>
                    <h3 className="font-display text-sm mb-0.5" style={{ fontWeight: 700, color: S.text }}>
                      {template.name_pt}
                    </h3>
                    <p className="text-[11px] mb-2" style={{ color: S.textMuted }}>{template.category}</p>
                    <div className="flex gap-3 text-[11px]" style={{ color: S.textSub }}>
                      <span>⏱️ {template.duration_min} min</span>
                      <span>🎯 {template.equipment}</span>
                    </div>
                  </motion.button>
                );
              })}
              {homeTemplates.length === 0 && (
                <div className="text-center py-12" style={{ color: S.textMuted }}>
                  <span className="text-3xl mb-3 block">🏠</span>
                  <p className="text-sm">Nenhum treino em casa disponível</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* TAB: Alongamento */}
      {tab === "along" && (
        <section className="px-5">
          <div className="max-w-lg mx-auto">
            <p className="text-xs mb-4" style={{ color: S.textMuted }}>Alongamento e mobilidade — baseado no seu treino</p>
            <div className="space-y-3">
              {stretches.map((stretch, i) => (
                <motion.div
                  key={stretch.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4"
                  style={cardStyle}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">🧘‍♀️</span>
                    <span
                      className="text-[10px] font-semibold px-2.5 py-1"
                      style={{ color: "#7C3AED", background: "rgba(124,58,237,0.1)", borderRadius: "0.5rem" }}
                    >
                      {stretch.type}
                    </span>
                  </div>
                  <h3 className="font-display text-sm mb-0.5" style={{ fontWeight: 700, color: S.text }}>
                    {stretch.name_pt}
                  </h3>
                  <p className="text-[11px] mb-2" style={{ color: S.textMuted }}>
                    {stretch.target_muscles.join(", ")}
                  </p>
                  <div className="flex gap-3 text-[11px]" style={{ color: S.textSub }}>
                    <span>⏱️ {stretch.duration_seconds}s</span>
                  </div>
                </motion.div>
              ))}
              {stretches.length === 0 && (
                <div className="text-center py-12" style={{ color: S.textMuted }}>
                  <span className="text-3xl mb-3 block">🧘‍♀️</span>
                  <p className="text-sm">Nenhum alongamento disponível</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </SolarPage>
  );
};

export default AppWorkoutDashboard;
