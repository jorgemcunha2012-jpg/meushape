import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExerciseBrowser, { type SelectedExercise } from "@/components/ExerciseBrowser";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import {
  Plus, Trash2, Search, Dumbbell, ChevronRight, Pencil, Check, X, Sparkles,
} from "lucide-react";
import AIWorkoutWizard from "@/components/AIWorkoutWizard";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose,
} from "@/components/ui/drawer";

/* ─── Types ─── */
interface Program {
  id: string; title: string; description: string | null;
  level: string; days_per_week: number; duration_minutes: number; is_active: boolean;
}
interface Workout {
  id: string; program_id: string; title: string;
  description: string | null; sort_order: number;
}
interface Exercise {
  id: string; workout_id: string; name: string; description: string | null;
  sets: number; reps: string; rest_seconds: number;
  image_url: string | null; sort_order: number;
}

type Step = "programs" | "workouts" | "exercises";

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
};

const levelLabel = (l: string) =>
  l === "beginner" ? "Iniciante" : l === "intermediate" ? "Intermediário" : "Avançado";

const AppManageWorkouts = () => {
  const S = useSolar();
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("programs");
  const [direction, setDirection] = useState(1);

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showBrowser, setShowBrowser] = useState(false);
  const [showAIWizard, setShowAIWizard] = useState(false);

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<"program" | "workout">("program");
  const [formTitle, setFormTitle] = useState("");
  const [formLevel, setFormLevel] = useState("beginner");
  const [formDays, setFormDays] = useState(3);

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  useEffect(() => {
    if (!loading && !user && !isAdmin) navigate("/app/login");
    if (user || isAdmin) fetchPrograms();
  }, [user, loading, isAdmin]);

  const fetchPrograms = async () => {
    const { data } = await supabase.from("workout_programs").select("*").order("created_at", { ascending: false });
    if (data) setPrograms(data);
  };

  const fetchWorkouts = useCallback(async (programId: string) => {
    const { data } = await supabase.from("workouts").select("*").eq("program_id", programId).order("sort_order");
    if (data) setWorkouts(data);
  }, []);

  const fetchExercises = useCallback(async (workoutId: string) => {
    const { data } = await supabase.from("exercises").select("*").eq("workout_id", workoutId).order("sort_order");
    if (data) setExercises(data);
  }, []);

  const goTo = (s: Step, dir: number) => { setDirection(dir); setStep(s); };

  const openProgramDrawer = () => {
    setDrawerType("program"); setFormTitle(""); setFormLevel("beginner"); setFormDays(3);
    setDrawerOpen(true);
  };
  const openWorkoutDrawer = () => {
    setDrawerType("workout"); setFormTitle("");
    setDrawerOpen(true);
  };

  const handleDrawerSubmit = async () => {
    if (!formTitle.trim()) return;
    if (drawerType === "program") {
      const { error } = await supabase.from("workout_programs").insert({
        title: formTitle, level: formLevel, days_per_week: formDays,
      });
      if (error) { toast.error("Erro ao criar programa"); return; }
      toast.success("Programa criado!");
      fetchPrograms();
    } else {
      if (!selectedProgram) return;
      const { error } = await supabase.from("workouts").insert({
        program_id: selectedProgram.id, title: formTitle, sort_order: workouts.length,
      });
      if (error) { toast.error("Erro ao criar treino"); return; }
      toast.success("Treino criado!");
      fetchWorkouts(selectedProgram.id);
    }
    setDrawerOpen(false);
  };

  const selectProgram = (prog: Program) => {
    setSelectedProgram(prog);
    fetchWorkouts(prog.id);
    goTo("workouts", 1);
  };

  const selectWorkout = (wk: Workout) => {
    setSelectedWorkout(wk);
    fetchExercises(wk.id);
    goTo("exercises", 1);
  };

  const addExerciseFromDB = async (ex: SelectedExercise) => {
    if (!selectedWorkout) return;
    const { error } = await supabase.from("exercises").insert({
      workout_id: selectedWorkout.id, name: ex.name,
      description: ex.instructions || null,
      image_url: null, sets: 3, reps: "12", rest_seconds: 60,
      sort_order: exercises.length,
    });
    if (error) { toast.error("Erro ao adicionar"); return; }
    toast.success(`${ex.name} adicionado!`);
    setShowBrowser(false);
    fetchExercises(selectedWorkout.id);
  };

  const deleteExercise = async (id: string) => {
    await supabase.from("exercises").delete().eq("id", id);
    if (selectedWorkout) fetchExercises(selectedWorkout.id);
  };
  const deleteWorkout = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("workouts").delete().eq("id", id);
    if (selectedProgram) fetchWorkouts(selectedProgram.id);
  };
  const deleteProgram = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("workout_programs").delete().eq("id", id);
    fetchPrograms();
  };

  const updateExercise = async (id: string, field: string, value: any) => {
    await supabase.from("exercises").update({ [field]: value }).eq("id", id);
    if (selectedWorkout) fetchExercises(selectedWorkout.id);
  };

  const startRename = (id: string, current: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id); setEditingValue(current);
  };
  const saveRename = async (table: string) => {
    if (!editingId || !editingValue.trim()) return;
    await supabase.from(table as "workout_programs").update({ title: editingValue } as any).eq("id", editingId);
    setEditingId(null);
    if (table === "workout_programs") fetchPrograms();
    else if (selectedProgram) fetchWorkouts(selectedProgram.id);
  };

  const cardStyle = {
    backgroundColor: S.card,
    border: `1px solid ${S.cardBorder}`,
    borderRadius: "1.25rem",
    boxShadow: `0 2px 12px rgba(234,88,12,0.04)`,
  };

  const headerTitle =
    step === "programs" ? "Gerenciar Treinos"
      : step === "workouts" ? selectedProgram?.title || "Treinos"
        : selectedWorkout?.title || "Exercícios";

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <SolarPage>
      <SolarHeader
        title={headerTitle}
        showBack
        rightContent={
          step === "programs" ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={openProgramDrawer}
              className="w-9 h-9 flex items-center justify-center"
              style={{ borderRadius: "0.75rem", background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 2px 12px ${S.glowStrong}` }}>
              <Plus size={18} style={{ color: "#fff" }} strokeWidth={2.5} />
            </motion.button>
          ) : step === "workouts" ? (
            <motion.button whileTap={{ scale: 0.9 }} onClick={openWorkoutDrawer}
              className="w-9 h-9 flex items-center justify-center"
              style={{ borderRadius: "0.75rem", background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 2px 12px ${S.glowStrong}` }}>
              <Plus size={18} style={{ color: "#fff" }} strokeWidth={2.5} />
            </motion.button>
          ) : (
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowBrowser(true)}
              className="w-9 h-9 flex items-center justify-center"
              style={{ borderRadius: "0.75rem", background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 2px 12px ${S.glowStrong}` }}>
              <Search size={18} style={{ color: "#fff" }} strokeWidth={2.5} />
            </motion.button>
          )
        }
      />

      {/* Back breadcrumb for inner steps */}
      {step !== "programs" && (
        <div className="px-5 pt-2">
          <button
            onClick={() => goTo(step === "exercises" ? "workouts" : "programs", -1)}
            className="text-xs font-medium flex items-center gap-1 transition-colors"
            style={{ color: S.orange }}
          >
            ← {step === "exercises" ? "Voltar aos treinos" : "Voltar aos programas"}
          </button>
        </div>
      )}

      <div className="max-w-lg mx-auto px-5 py-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ─── STEP 1: Programs ─── */}
          {step === "programs" && !showAIWizard && (
            <motion.div key="programs" custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", duration: 0.25 }}>

              {programs.length === 0 ? (
                <div className="space-y-4">
                  <EmptyState
                    icon={<Dumbbell size={40} style={{ color: S.orange }} />}
                    title="Nenhum programa criado"
                    subtitle="Gere um programa completo com IA ou crie manualmente"
                    buttonLabel="Gerar com IA"
                    onAction={() => setShowAIWizard(true)}
                    S={S}
                  />
                  <div className="text-center">
                    <button onClick={openProgramDrawer} className="text-xs font-medium" style={{ color: S.textMuted }}>
                      ou criar manualmente
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {programs.map((prog, i) => (
                    <motion.button key={prog.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectProgram(prog)}
                      className="w-full text-left p-4 flex items-center gap-3 transition-all"
                      style={cardStyle}
                    >
                      <div className="w-11 h-11 flex items-center justify-center shrink-0"
                        style={{ borderRadius: "0.75rem", background: `linear-gradient(135deg, ${S.orange}18, ${S.amber}18)` }}>
                        <Dumbbell size={18} style={{ color: S.orange }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingId === prog.id ? (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <Input value={editingValue} onChange={e => setEditingValue(e.target.value)}
                              className="h-7 text-xs rounded-lg" autoFocus />
                            <button onClick={() => saveRename("workout_programs")} className="p-1"><Check size={14} style={{ color: S.orange }} /></button>
                            <button onClick={() => setEditingId(null)} className="p-1"><X size={14} style={{ color: S.textMuted }} /></button>
                          </div>
                        ) : (
                          <>
                            <p className="font-display text-sm" style={{ fontWeight: 700, color: S.text }}>{prog.title}</p>
                            <p className="text-[11px]" style={{ color: S.textMuted }}>
                              {levelLabel(prog.level)} • {prog.days_per_week}x/semana
                            </p>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => startRename(prog.id, prog.title, e)} className="p-1.5 transition-colors" style={{ color: S.textMuted }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={(e) => deleteProgram(prog.id, e)} className="p-1.5 transition-colors hover:text-destructive" style={{ color: S.textMuted }}>
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight size={16} style={{ color: S.cardBorder }} />
                      </div>
                    </motion.button>
                  ))}

                  {/* AI generate button */}
                  <motion.button whileTap={{ scale: 0.97 }}
                    onClick={() => setShowAIWizard(true)}
                    className="w-full p-3.5 flex items-center justify-center gap-2 text-xs font-semibold transition-all"
                    style={{ ...cardStyle, border: `2px dashed ${S.cardBorder}`, color: S.orange }}>
                    <Sparkles size={14} /> Gerar programa com IA
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── AI Wizard (inline in programs step) ─── */}
          {step === "programs" && showAIWizard && (
            <motion.div key="ai-wizard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <AIWorkoutWizard
                userId={user!.id}
                isAdmin={isAdmin}
                onComplete={() => { setShowAIWizard(false); fetchPrograms(); }}
                onCancel={() => setShowAIWizard(false)}
              />
            </motion.div>
          )}

          {/* ─── STEP 2: Workouts ─── */}
          {step === "workouts" && (
            <motion.div key="workouts" custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", duration: 0.25 }}>

              {workouts.length === 0 ? (
                <EmptyState
                  icon={<Dumbbell size={40} style={{ color: S.orange }} />}
                  title="Nenhum treino ainda"
                  subtitle="Adicione os treinos da semana para este programa"
                  buttonLabel="Adicionar Treino"
                  onAction={openWorkoutDrawer}
                  S={S}
                />
              ) : (
                <div className="space-y-2.5">
                  {workouts.map((wk, i) => (
                    <motion.button key={wk.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => selectWorkout(wk)}
                      className="w-full text-left p-4 flex items-center gap-3 transition-all"
                      style={cardStyle}
                    >
                      <div className="w-11 h-11 flex items-center justify-center text-xs shrink-0 font-display"
                        style={{ borderRadius: "0.75rem", fontWeight: 800, background: "#FFF7ED", color: S.orange }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingId === wk.id ? (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <Input value={editingValue} onChange={e => setEditingValue(e.target.value)}
                              className="h-7 text-xs rounded-lg" autoFocus />
                            <button onClick={() => saveRename("workouts")} className="p-1"><Check size={14} style={{ color: S.orange }} /></button>
                            <button onClick={() => setEditingId(null)} className="p-1"><X size={14} style={{ color: S.textMuted }} /></button>
                          </div>
                        ) : (
                          <p className="font-display text-sm" style={{ fontWeight: 700, color: S.text }}>{wk.title}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => startRename(wk.id, wk.title, e)} className="p-1.5" style={{ color: S.textMuted }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={(e) => deleteWorkout(wk.id, e)} className="p-1.5 hover:text-destructive" style={{ color: S.textMuted }}>
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight size={16} style={{ color: S.cardBorder }} />
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ─── STEP 3: Exercises ─── */}
          {step === "exercises" && (
            <motion.div key="exercises" custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ type: "tween", duration: 0.25 }}>

              {exercises.length === 0 ? (
                <EmptyState
                  icon={<Search size={40} style={{ color: S.orange }} />}
                  title="Nenhum exercício"
                  subtitle="Busque exercícios do MuscleWiki"
                  buttonLabel="Buscar Exercícios"
                  onAction={() => setShowBrowser(true)}
                  S={S}
                />
              ) : (
                <div className="space-y-3">
                  {exercises.map((ex, i) => (
                    <motion.div key={ex.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4" style={cardStyle}>
                      <div className="flex gap-3">
                        {ex.image_url && (
                          <img src={ex.image_url} alt={ex.name}
                            className="w-16 h-16 rounded-xl object-cover shrink-0"
                            style={{ backgroundColor: S.card, border: `1px solid ${S.cardBorder}` }}
                            loading="lazy" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-display text-xs capitalize" style={{ fontWeight: 700, color: S.text }}>
                              {i + 1}. {ex.name}
                            </p>
                            <button onClick={() => deleteExercise(ex.id)} className="p-1 shrink-0 hover:text-destructive" style={{ color: S.textMuted }}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            <div>
                              <label className="text-[10px]" style={{ color: S.textMuted }}>Séries</label>
                              <Input type="number" value={ex.sets}
                                onChange={(e) => updateExercise(ex.id, "sets", parseInt(e.target.value) || 3)}
                                className="h-7 text-xs rounded-lg" />
                            </div>
                            <div>
                              <label className="text-[10px]" style={{ color: S.textMuted }}>Reps</label>
                              <Input value={ex.reps}
                                onChange={(e) => updateExercise(ex.id, "reps", e.target.value)}
                                className="h-7 text-xs rounded-lg" />
                            </div>
                            <div>
                              <label className="text-[10px]" style={{ color: S.textMuted }}>Descanso</label>
                              <Input type="number" value={ex.rest_seconds}
                                onChange={(e) => updateExercise(ex.id, "rest_seconds", parseInt(e.target.value) || 60)}
                                className="h-7 text-xs rounded-lg" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* Add more button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setShowBrowser(true)}
                    className="w-full p-4 flex items-center justify-center gap-2 text-sm font-semibold transition-all"
                    style={{ ...cardStyle, border: `2px dashed ${S.cardBorder}`, color: S.orange }}
                  >
                    <Plus size={16} /> Adicionar Exercício
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Drawer for creating program/workout ─── */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>
              {drawerType === "program" ? "Novo Programa" : "Novo Treino"}
            </DrawerTitle>
            <DrawerDescription>
              {drawerType === "program"
                ? "Crie um programa de treino para o catálogo"
                : `Adicione um treino ao programa "${selectedProgram?.title}"`}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome</label>
              <Input placeholder={drawerType === "program" ? "Ex: Hipertrofia 4x" : "Ex: Treino A - Superior"}
                value={formTitle} onChange={e => setFormTitle(e.target.value)}
                className="rounded-xl" autoFocus />
            </div>

            {drawerType === "program" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Nível</label>
                  <Select value={formLevel} onValueChange={setFormLevel}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Dias/semana</label>
                  <Select value={String(formDays)} onValueChange={v => setFormDays(Number(v))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6].map(d => (
                        <SelectItem key={d} value={String(d)}>{d}x</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <DrawerFooter>
            <Button onClick={handleDrawerSubmit} className="rounded-xl w-full"
              style={{ background: `linear-gradient(135deg, ${S.orange}, ${S.amber})` }}>
              <Plus size={16} className="mr-1" />
              {drawerType === "program" ? "Criar Programa" : "Criar Treino"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="rounded-xl w-full">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* MuscleWiki Browser Modal */}
      {showBrowser && (
        <ExerciseBrowser
          onSelect={addExerciseFromDB}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </SolarPage>
  );
};

/* ─── Empty State Component ─── */
const EmptyState = ({ icon, title, subtitle, buttonLabel, onAction, S }: {
  icon: React.ReactNode; title: string; subtitle: string;
  buttonLabel: string; onAction: () => void; S: any;
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-20 h-20 flex items-center justify-center mb-4"
      style={{ borderRadius: "1.5rem", background: `linear-gradient(135deg, ${S.orange}12, ${S.amber}12)` }}>
      {icon}
    </div>
    <p className="font-display text-base mb-1" style={{ fontWeight: 700, color: S.text }}>{title}</p>
    <p className="text-sm mb-6" style={{ color: S.textMuted, maxWidth: 260 }}>{subtitle}</p>
    <Button onClick={onAction} className="rounded-xl px-6"
      style={{ background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, boxShadow: `0 4px 16px ${S.glowStrong}` }}>
      <Plus size={16} className="mr-1" /> {buttonLabel}
    </Button>
  </div>
);

export default AppManageWorkouts;
