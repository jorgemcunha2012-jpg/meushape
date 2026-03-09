import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";

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

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "plano", label: "Meu Plano", icon: "📋" },
  { id: "cardio", label: "Cardio", icon: "🏃‍♀️" },
  { id: "casa", label: "Em Casa", icon: "🏠" },
  { id: "along", label: "Alongamento", icon: "🧘‍♀️" },
];

const levelLabel = (level: number) => {
  if (level <= 1) return "Iniciante";
  if (level <= 2) return "Intermediário";
  return "Avançado";
};

const levelColor = (level: number) => {
  if (level <= 1) return { text: "#16C79A", bg: "rgba(22,199,154,0.13)" };
  if (level <= 2) return { text: "#F5A623", bg: "rgba(245,166,35,0.13)" };
  return { text: "#E94560", bg: "rgba(233,69,96,0.13)" };
};

const cardioIcon = (type: string) => {
  if (type === "hiit") return "🔥";
  if (type === "liss") return "🚶‍♀️";
  return "🏃‍♀️";
};

const AppWorkoutDashboard = () => {
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
    if (!subscriptionLoading && !subscribed && user) {
      navigate("/app/login");
      return;
    }
    if (user && subscribed) {
      fetchAllData();
    }
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
      if (cycleRes.data) {
        setCyclePhase(cycleRes.data.phase);
        setCycleWeek(cycleRes.data.current_week);
      }
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

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-10 pb-2">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/app")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold">Treinos</h1>
        </div>
      </header>

      {/* Tab Bar — Meu Shape style */}
      <section className="px-5 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {TABS.map(t => (
              <motion.button
                key={t.id}
                onClick={() => setTab(t.id)}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all"
                style={{
                  background: tab === t.id ? "hsl(var(--primary))" : "hsl(var(--card))",
                  color: tab === t.id ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                  border: tab === t.id ? "none" : "1px solid hsl(var(--border))",
                  boxShadow: tab === t.id ? "0 4px 16px hsla(350 85% 60% / 0.25)" : "none",
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
              <p className="text-xs text-muted-foreground mb-4">
                Semana {cycleWeek} — {phaseNames[cyclePhase] || cyclePhase}
              </p>
            )}
            <div className="space-y-2">
              {workouts.map((workout, i) => {
                const isToday = (workout.day_of_week ?? workout.sort_order) === todayIndex;
                return (
                  <motion.button
                    key={workout.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/app/workout-detail/${workout.id}`)}
                    className="w-full flex items-center gap-3 py-3.5 border-b border-border text-left"
                  >
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                      style={{
                        background: isToday ? "hsl(var(--primary))" : "hsl(var(--card))",
                        color: isToday ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                        border: isToday ? "none" : "1px solid hsl(var(--border))",
                        boxShadow: isToday ? "0 4px 12px hsla(350 85% 60% / 0.3)" : "none",
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm mb-0.5">{workout.title}</p>
                      {workout.description && (
                        <p className="text-xs text-muted-foreground truncate">{workout.description}</p>
                      )}
                    </div>
                    {isToday ? (
                      <span 
                        className="text-xs font-bold px-2.5 py-1 rounded-lg"
                        style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
                      >
                        HOJE
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                  </motion.button>
                );
              })}
              {workouts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
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
            <p className="text-xs text-muted-foreground mb-4">Protocolos de cardio guiado com velocidade e inclinação em tempo real</p>
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
                    className="w-full rounded-2xl p-4 text-left transition-all"
                    style={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-2xl">{cardioIcon(protocol.protocol_type)}</span>
                      <span 
                        className="text-[10px] font-semibold px-2 py-1 rounded-md"
                        style={{ color: lc.text, background: lc.bg }}
                      >
                        {levelLabel(protocol.difficulty_level)}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-0.5 text-foreground">{protocol.name_pt}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{protocol.equipment}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>⏱️ {protocol.total_duration_min} min</span>
                      {protocol.estimated_calories && <span>🔥 {protocol.estimated_calories} kcal</span>}
                    </div>
                  </motion.button>
                );
              })}
              {cardioProtocols.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
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
            <p className="text-xs text-muted-foreground mb-4">Treinos completos sem precisar de academia</p>
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
                    className="w-full rounded-2xl p-4 text-left"
                    style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-2xl">💪</span>
                      <span 
                        className="text-[10px] font-semibold px-2 py-1 rounded-md"
                        style={{ color: lc.text, background: lc.bg }}
                      >
                        {levelLabel(template.difficulty_level)}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm mb-0.5 text-foreground">{template.name_pt}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{template.category}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span>⏱️ {template.duration_min} min</span>
                      <span>🎯 {template.equipment}</span>
                    </div>
                  </motion.button>
                );
              })}
              {homeTemplates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
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
            <p className="text-xs text-muted-foreground mb-4">Alongamento e mobilidade — baseado no seu treino</p>
            <div className="space-y-3">
              {stretches.map((stretch, i) => (
                <motion.div
                  key={stretch.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-2xl p-4"
                  style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">🧘‍♀️</span>
                    <span 
                      className="text-[10px] font-semibold px-2 py-1 rounded-md"
                      style={{ color: "#6C63FF", background: "rgba(108,99,255,0.13)" }}
                    >
                      {stretch.type}
                    </span>
                  </div>
                  <h3 className="font-bold text-sm mb-0.5 text-foreground">{stretch.name_pt}</h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {stretch.target_muscles.join(", ")}
                  </p>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>⏱️ {stretch.duration_seconds}s</span>
                  </div>
                </motion.div>
              ))}
              {stretches.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <span className="text-3xl mb-3 block">🧘‍♀️</span>
                  <p className="text-sm">Nenhum alongamento disponível</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border z-20">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 pb-6">
          <button onClick={() => navigate("/app")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">🏠</span>
            <span className="text-[10px] text-muted-foreground">Home</span>
          </button>
          <button className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg">🏋️‍♀️</span>
            <span className="text-[10px] font-semibold text-primary">Treinos</span>
            <div className="w-1 h-1 rounded-full bg-primary" />
          </button>
          <button onClick={() => navigate("/app/community")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">👥</span>
            <span className="text-[10px] text-muted-foreground">Social</span>
          </button>
          <button onClick={() => navigate("/app/history")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">📊</span>
            <span className="text-[10px] text-muted-foreground">Progresso</span>
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

export default AppWorkoutDashboard;
