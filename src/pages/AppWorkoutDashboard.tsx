import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Plus, Zap, Home, StretchHorizontal,
  Compass, Star, Dumbbell, BookmarkPlus, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";
import { toast } from "sonner";
import AIWorkoutWizard from "@/components/AIWorkoutWizard";

/* ─── Types ─── */
interface Program {
  id: string; title: string; description: string | null;
  level: string; days_per_week: number; duration_minutes: number; is_active: boolean;
}
interface Workout {
  id: string; title: string; description: string | null;
  sort_order: number; day_of_week: number | null; program_id: string;
}
interface CardioProtocol {
  id: string; name_pt: string; protocol_type: string;
  total_duration_min: number; difficulty_level: number;
  estimated_calories: number | null; equipment: string;
}
interface HomeTemplate {
  id: string; name_pt: string; category: string;
  duration_min: number; difficulty_level: number; equipment: string;
}
interface StretchSession {
  id: string; name_pt: string; type: string;
  duration_seconds: number; target_muscles: string[];
}

type TabId = "meus" | "cardio" | "casa" | "along";

const levelLabel = (l: string | number) => {
  const v = typeof l === "number" ? l : l === "beginner" ? 1 : l === "intermediate" ? 2 : 3;
  if (v <= 1) return "Iniciante";
  if (v <= 2) return "Intermediário";
  return "Avançado";
};
const levelColor = (l: string | number) => {
  const v = typeof l === "number" ? l : l === "beginner" ? 1 : l === "intermediate" ? 2 : 3;
  if (v <= 1) return { text: "#16a34a", bg: "rgba(22,163,74,0.1)" };
  if (v <= 2) return { text: "#F59E0B", bg: "rgba(245,158,11,0.1)" };
  return { text: "#F87171", bg: "rgba(248,113,113,0.1)" };
};

const AppWorkoutDashboard = () => {
  const S = useSolar();
  const { user, subscribed, subscriptionLoading } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabId>("meus");
  const [showExplorer, setShowExplorer] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);

  // User's programs with their workouts
  const [programsWithWorkouts, setProgramsWithWorkouts] = useState<
    { program: Program; workouts: Workout[] }[]
  >([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [addedProgramIds, setAddedProgramIds] = useState<Set<string>>(new Set());

  const [cardioProtocols, setCardioProtocols] = useState<CardioProtocol[]>([]);
  const [homeTemplates, setHomeTemplates] = useState<HomeTemplate[]>([]);
  const [stretches, setStretches] = useState<StretchSession[]>([]);

  const [cyclePhase, setCyclePhase] = useState("");
  const [cycleWeek, setCycleWeek] = useState(0);

  useEffect(() => {
    if (!subscriptionLoading && !user) { navigate("/app/login"); return; }
    if (user && subscribed) fetchAllData();
  }, [user, subscribed, subscriptionLoading]);

  const fetchAllData = async () => {
    if (!user) return;
    const [upRes, allProgRes, cardioRes, homeRes, stretchRes] = await Promise.all([
      supabase.from("user_programs").select("id, program_id, is_favorite").eq("user_id", user.id),
      supabase.from("workout_programs").select("*").eq("is_active", true),
      supabase.from("cardio_protocols").select("*").eq("active", true),
      supabase.from("home_workout_templates").select("*").eq("active", true),
      supabase.from("stretches").select("*").eq("active", true).order("sort_order").limit(10),
    ]);

    const programs: Program[] = allProgRes.data || [];
    setAllPrograms(programs);

    if (upRes.data && upRes.data.length > 0) {
      const ids = new Set(upRes.data.map(up => up.program_id));
      setAddedProgramIds(ids);

      // Fetch all workouts for all user programs at once
      const programIds = upRes.data.map(up => up.program_id);
      const { data: allWorkouts } = await supabase
        .from("workouts").select("*")
        .in("program_id", programIds)
        .order("sort_order");

      const grouped = upRes.data
        .map(up => {
          const prog = programs.find(p => p.id === up.program_id);
          if (!prog) return null;
          const wks = (allWorkouts || []).filter(w => w.program_id === up.program_id);
          return { program: prog, workouts: wks };
        })
        .filter(Boolean) as { program: Program; workouts: Workout[] }[];

      setProgramsWithWorkouts(grouped);

      // Load cycle for first program
      const { data: cycleData } = await supabase
        .from("progression_cycles")
        .select("phase, current_week")
        .eq("user_id", user.id)
        .eq("program_id", programIds[0])
        .single();
      if (cycleData) { setCyclePhase(cycleData.phase); setCycleWeek(cycleData.current_week); }
    } else {
      setAddedProgramIds(new Set());
      setProgramsWithWorkouts([]);
    }

    if (cardioRes.data) setCardioProtocols(cardioRes.data);
    if (homeRes.data) setHomeTemplates(homeRes.data);
    if (stretchRes.data) setStretches(stretchRes.data);
  };

  const addProgram = async (programId: string) => {
    if (!user) return;
    const { error } = await supabase.from("user_programs").insert({
      user_id: user.id, program_id: programId,
    });
    if (error) { toast.error("Erro ao adicionar"); return; }
    toast.success("Programa adicionado!");
    fetchAllData();
  };

  const removeProgram = async (programId: string) => {
    if (!user) return;
    await supabase.from("user_programs").delete()
      .eq("user_id", user.id).eq("program_id", programId);
    toast.success("Programa removido");
    fetchAllData();
  };

  const todayIndex = new Date().getDay();
  const phaseNames: Record<string, string> = {
    adaptation: "Adaptação", building: "Construção",
    intensify: "Intensificação", peak: "Pico", deload: "Deload",
  };

  const cardStyle = {
    backgroundColor: S.card,
    border: `1px solid ${S.cardBorder}`,
    borderRadius: "1.25rem",
    boxShadow: `0 2px 12px rgba(234,88,12,0.04)`,
  };

  const TABS: { id: TabId; label: string; icon: typeof Star }[] = [
    { id: "meus", label: "Meus Treinos", icon: Star },
    { id: "cardio", label: "Cardio", icon: Zap },
    { id: "casa", label: "Em Casa", icon: Home },
    { id: "along", label: "Along.", icon: StretchHorizontal },
  ];

  return (
    <SolarPage>
      <SolarHeader
        title="Treinos"
        showBack
        rightContent={
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/app/manage")}
            className="w-9 h-9 flex items-center justify-center"
            style={{ borderRadius: "0.75rem", background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 2px 12px ${S.glowStrong}` }}>
            <Plus size={18} style={{ color: "#fff" }} strokeWidth={2.5} />
          </motion.button>
        }
      />

      {/* Tab Bar */}
      <section className="px-5 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {TABS.map(t => (
              <motion.button key={t.id} onClick={() => { setTab(t.id); setShowExplorer(false); }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  borderRadius: "1rem",
                  background: tab === t.id ? `linear-gradient(135deg, ${S.orange}, ${S.amber})` : S.card,
                  color: tab === t.id ? "#fff" : S.textMuted,
                  border: tab === t.id ? "none" : `1px solid ${S.cardBorder}`,
                  boxShadow: tab === t.id ? `0 4px 16px ${S.glowStrong}` : "none",
                }}>
                <t.icon size={13} strokeWidth={2.5} />
                {t.label}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TAB: Meus Treinos ─── */}
      {tab === "meus" && !showExplorer && !showAIWizard && (
        <section className="px-5">
          <div className="max-w-lg mx-auto">
            {cyclePhase && programsWithWorkouts.length > 0 && (
              <p className="text-xs mb-3" style={{ color: S.textMuted }}>
                Semana {cycleWeek} — {phaseNames[cyclePhase] || cyclePhase}
              </p>
            )}

            {programsWithWorkouts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-20 h-20 flex items-center justify-center mb-4"
                  style={{ borderRadius: "1.5rem", background: `linear-gradient(135deg, ${S.orange}12, ${S.amber}12)` }}>
                  <Dumbbell size={40} style={{ color: S.orange }} />
                </div>
                <p className="font-display text-base mb-1" style={{ fontWeight: 700, color: S.text }}>
                  Nenhum treino ainda
                </p>
                <p className="text-sm mb-6" style={{ color: S.textMuted, maxWidth: 260 }}>
                  Gere um plano personalizado com IA ou explore programas prontos
                </p>
                <div className="flex flex-col gap-2.5 w-full max-w-[260px]">
                  <Button onClick={() => setShowAIWizard(true)} className="rounded-xl w-full"
                    style={{ background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 4px 16px ${S.glowStrong}` }}>
                    <Sparkles size={16} className="mr-1" /> Gerar com IA
                  </Button>
                  <Button onClick={() => setShowExplorer(true)} variant="outline" className="rounded-xl w-full">
                    <Compass size={16} className="mr-1" /> Explorar Programas
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {programsWithWorkouts.map((group, gi) => {
                  const prog = group.program;
                  const lc = levelColor(prog.level);
                  return (
                    <div key={prog.id}>
                      {/* Program header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="font-display text-xs" style={{ fontWeight: 700, color: S.text }}>{prog.title}</p>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5"
                            style={{ color: lc.text, background: lc.bg, borderRadius: "0.4rem" }}>
                            {levelLabel(prog.level)}
                          </span>
                        </div>
                        <span className="text-[10px]" style={{ color: S.textMuted }}>{prog.days_per_week}x/sem</span>
                      </div>

                      {/* Workouts list */}
                      <div className="space-y-2">
                        {group.workouts.map((wk, wi) => {
                          const isToday = (wk.day_of_week ?? wk.sort_order) === todayIndex;
                          return (
                            <motion.button key={wk.id}
                              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: (gi * 0.05) + (wi * 0.03) }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => navigate(`/app/workout-detail/${wk.id}`)}
                              className="w-full text-left p-3.5 flex items-center gap-3 transition-all"
                              style={cardStyle}
                            >
                              <div className="w-10 h-10 flex items-center justify-center text-xs shrink-0 font-display"
                                style={{
                                  borderRadius: "0.75rem", fontWeight: 800,
                                  background: isToday ? `linear-gradient(135deg, ${S.orange}, ${S.amber})` : `${S.orange}12`,
                                  color: isToday ? "#fff" : S.orange,
                                  boxShadow: isToday ? `0 4px 12px ${S.glowStrong}` : "none",
                                }}>
                                {String.fromCharCode(65 + wi)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-display text-sm" style={{ fontWeight: 700, color: S.text }}>{wk.title}</p>
                                {wk.description && (
                                  <p className="text-[11px] truncate" style={{ color: S.textMuted }}>{wk.description}</p>
                                )}
                              </div>
                              {isToday ? (
                                <span className="text-[9px] font-bold px-2.5 py-1"
                                  style={{ borderRadius: "0.75rem", background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, color: "#fff", boxShadow: `0 2px 8px ${S.glow}` }}>
                                  HOJE
                                </span>
                              ) : (
                                <ChevronRight size={16} style={{ color: S.cardBorder }} />
                              )}
                            </motion.button>
                          );
                        })}
                        {group.workouts.length === 0 && (
                          <p className="text-xs py-3 text-center" style={{ color: S.textMuted }}>
                            Nenhum treino neste programa ainda
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Bottom actions */}
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAIWizard(true)}
                    className="flex-1 p-3 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all"
                    style={{ ...cardStyle, border: `2px dashed ${S.cardBorder}`, color: S.orange }}>
                    <Sparkles size={14} /> Gerar com IA
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => setShowExplorer(true)}
                    className="flex-1 p-3 flex items-center justify-center gap-1.5 text-xs font-semibold transition-all"
                    style={{ ...cardStyle, border: `2px dashed ${S.cardBorder}`, color: S.textMuted }}>
                    <Compass size={14} /> Explorar
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── AI Wizard ─── */}
      {tab === "meus" && showAIWizard && (
        <section className="px-5">
          <div className="max-w-lg mx-auto">
            <AIWorkoutWizard
              userId={user!.id}
              onComplete={() => { setShowAIWizard(false); fetchAllData(); }}
              onCancel={() => setShowAIWizard(false)}
            />
          </div>
        </section>
      )}

      {/* ─── Inline Explorer ─── */}
      {tab === "meus" && showExplorer && (
        <section className="px-5">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="font-display text-sm" style={{ fontWeight: 700, color: S.text }}>Explorar Programas</p>
              <button onClick={() => setShowExplorer(false)}
                className="text-xs font-medium flex items-center gap-1" style={{ color: S.orange }}>
                ← Voltar
              </button>
            </div>

            {allPrograms.length === 0 ? (
              <div className="text-center py-12" style={{ color: S.textMuted }}>
                <Compass size={32} className="mx-auto mb-3" style={{ color: S.cardBorder }} />
                <p className="text-sm">Nenhum programa disponível no momento</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allPrograms.map((prog, i) => {
                  const isAdded = addedProgramIds.has(prog.id);
                  const lc = levelColor(prog.level);
                  return (
                    <motion.div key={prog.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4" style={cardStyle}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h3 className="font-display text-sm" style={{ fontWeight: 700, color: S.text }}>{prog.title}</h3>
                          {prog.description && (
                            <p className="text-[11px] mt-0.5" style={{ color: S.textMuted }}>{prog.description}</p>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold px-2.5 py-1 shrink-0 ml-2"
                          style={{ color: lc.text, background: lc.bg, borderRadius: "0.5rem" }}>
                          {levelLabel(prog.level)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex gap-3 text-[11px]" style={{ color: S.textSub }}>
                          <span>📅 {prog.days_per_week}x/sem</span>
                          <span>⏱️ {prog.duration_minutes} min</span>
                        </div>
                        {isAdded ? (
                          <Button size="sm" variant="outline" className="rounded-xl text-xs h-8 px-3"
                            onClick={() => removeProgram(prog.id)}>
                            ✓ Adicionado
                          </Button>
                        ) : (
                          <Button size="sm" className="rounded-xl text-xs h-8 px-3"
                            onClick={() => addProgram(prog.id)}
                            style={{ background: `linear-gradient(135deg, ${S.orange}, ${S.amber})` }}>
                            <BookmarkPlus size={13} className="mr-1" /> Adicionar
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── TAB: Cardio ─── */}
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
                  <motion.button key={protocol.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/app/cardio/${protocol.id}`)}
                    className="w-full p-4 text-left" style={cardStyle} whileTap={{ scale: 0.97 }}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-2xl">{protocol.protocol_type === "hiit" ? "🔥" : "🚶‍♀️"}</span>
                      <span className="text-[10px] font-semibold px-2.5 py-1"
                        style={{ color: lc.text, background: lc.bg, borderRadius: "0.5rem" }}>
                        {levelLabel(protocol.difficulty_level)}
                      </span>
                    </div>
                    <h3 className="font-display text-sm mb-0.5" style={{ fontWeight: 700, color: S.text }}>{protocol.name_pt}</h3>
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

      {/* ─── TAB: Em Casa ─── */}
      {tab === "casa" && (
        <section className="px-5">
          <div className="max-w-lg mx-auto">
            <p className="text-xs mb-4" style={{ color: S.textMuted }}>Treinos completos sem precisar de academia</p>
            <div className="space-y-3">
              {homeTemplates.map((template, i) => {
                const lc = levelColor(template.difficulty_level);
                return (
                  <motion.button key={template.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => navigate(`/app/home-workout/${template.id}`)}
                    className="w-full p-4 text-left" style={cardStyle} whileTap={{ scale: 0.97 }}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-2xl">💪</span>
                      <span className="text-[10px] font-semibold px-2.5 py-1"
                        style={{ color: lc.text, background: lc.bg, borderRadius: "0.5rem" }}>
                        {levelLabel(template.difficulty_level)}
                      </span>
                    </div>
                    <h3 className="font-display text-sm mb-0.5" style={{ fontWeight: 700, color: S.text }}>{template.name_pt}</h3>
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

      {/* ─── TAB: Alongamento ─── */}
      {tab === "along" && (
        <section className="px-5">
          <div className="max-w-lg mx-auto">
            <p className="text-xs mb-4" style={{ color: S.textMuted }}>Alongamento e mobilidade</p>
            <div className="space-y-3">
              {stretches.map((stretch, i) => (
                <motion.div key={stretch.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4" style={cardStyle}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">🧘‍♀️</span>
                    <span className="text-[10px] font-semibold px-2.5 py-1"
                      style={{ color: "#7C3AED", background: "rgba(124,58,237,0.1)", borderRadius: "0.5rem" }}>
                      {stretch.type}
                    </span>
                  </div>
                  <h3 className="font-display text-sm mb-0.5" style={{ fontWeight: 700, color: S.text }}>{stretch.name_pt}</h3>
                  <p className="text-[11px] mb-2" style={{ color: S.textMuted }}>{stretch.target_muscles.join(", ")}</p>
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
