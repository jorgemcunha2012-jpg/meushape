import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Home, Dumbbell, Users, TrendingUp, User,
  Bell, Sparkles, ChevronRight, Trophy, Flame,
  Target, Calendar
} from "lucide-react";
import { BodyMap } from "@/components/BodyMap";

/* ─── Types ─── */
interface WeekDay {
  day: string; name: string; duration: number;
  exercises: number; done: boolean; rest?: boolean;
  today?: boolean; workoutId?: string;
}

type MuscleStatus = "today" | "recent" | "recovering" | "none";
interface MuscleData { [key: string]: MuscleStatus; }

const MUSCLE_GROUP_MAP: Record<string, string[]> = {
  chest: ["chest", "pectorals", "peito", "peitoral"],
  shoulders: ["shoulders", "deltoids", "ombros", "deltoides", "delts"],
  arms: ["biceps", "triceps", "forearms", "braços", "bíceps", "tríceps", "antebraço"],
  back: ["back", "lats", "traps", "costas", "dorsal", "trapézio", "latíssimo"],
  abs: ["abs", "core", "abdominals", "abdome", "abdominais", "oblíquos"],
  glutes: ["glutes", "gluteus", "glúteos", "glúteo", "bumbum"],
  legs: ["quads", "quadriceps", "hamstrings", "quadríceps", "posterior", "coxa", "adductors", "abductors", "adutores", "abdutores", "pernas"],
  calves: ["calves", "panturrilha", "panturrilhas"],
};

function classifyMuscle(target: string, bodyPart: string): string[] {
  const text = `${target} ${bodyPart}`.toLowerCase();
  const matched: string[] = [];
  for (const [group, keywords] of Object.entries(MUSCLE_GROUP_MAP)) {
    if (keywords.some(kw => text.includes(kw))) matched.push(group);
  }
  return matched.length > 0 ? matched : [];
}

function getMuscleStatus(daysSinceTraining: number): MuscleStatus {
  if (daysSinceTraining === 0) return "today";
  if (daysSinceTraining <= 2) return "recent";
  if (daysSinceTraining <= 5) return "recovering";
  return "none";
}

function muscleStatusColor(status: MuscleStatus): string {
  switch (status) {
    case "today": return "#F97316";      // orange-500
    case "recent": return "#FBBF24";     // amber-400
    case "recovering": return "#D97706"; // amber-600
    default: return "#E7E5E4";           // stone-200
  }
}

/* ─── Solar palette constants ─── */
const SOLAR = {
  bg: "#F8F5F2",
  card: "#FFFFFF",
  cardBorder: "#F0EBE5",
  orange: "#EA580C",    // orange-600
  amber: "#F59E0B",     // amber-500
  coral: "#F87171",     // red-400
  terracotta: "#C2410C",// orange-700
  text: "#18181B",      // zinc-900
  textMuted: "#A1A1AA",  // zinc-400
  textSub: "#71717A",   // zinc-500
  glow: "rgba(234,88,12,0.15)",
  glowStrong: "rgba(234,88,12,0.25)",
};

const AppDashboard = () => {
  const { user, subscribed, subscriptionLoading } = useAuth();
  const navigate = useNavigate();

  const [weekPlan, setWeekPlan] = useState<WeekDay[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string>("");
  const [weeklyProgress, setWeeklyProgress] = useState(80);
  const [muscleMap, setMuscleMap] = useState<MuscleData>({
    chest: "none", shoulders: "none", arms: "none", back: "none",
    abs: "none", glutes: "none", legs: "none", calves: "none",
  });

  useEffect(() => {
    if (!subscriptionLoading && !user) { navigate("/app/login"); return; }
    if (user && subscribed) { fetchData(); fetchMuscleMap(); }
  }, [user, subscribed, subscriptionLoading, navigate]);

  /* ─── Data fetching (unchanged logic) ─── */
  const fetchMuscleMap = async () => {
    if (!user) return;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logs } = await supabase
      .from("workout_logs").select("workout_id, completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", sevenDaysAgo.toISOString())
      .order("completed_at", { ascending: false });

    if (!logs || logs.length === 0) return;

    const workoutIds = [...new Set(logs.map(l => l.workout_id))];
    const { data: exercises } = await supabase
      .from("exercises").select("name, workout_id")
      .in("workout_id", workoutIds);

    if (!exercises || exercises.length === 0) return;

    const exerciseNames = [...new Set(exercises.map(e => e.name))];
    const { data: curated } = await supabase
      .from("curated_exercises").select("name_pt, target, body_part")
      .in("name_pt", exerciseNames);

    const curatedLookup: Record<string, { target: string; body_part: string }> = {};
    curated?.forEach(c => { curatedLookup[c.name_pt] = c; });

    const workoutDateMap: Record<string, Date> = {};
    logs.forEach(l => {
      const d = new Date(l.completed_at);
      if (!workoutDateMap[l.workout_id] || d > workoutDateMap[l.workout_id])
        workoutDateMap[l.workout_id] = d;
    });

    const muscleDays: Record<string, number> = {};
    const now = new Date();
    exercises.forEach(ex => {
      const info = curatedLookup[ex.name];
      if (!info) return;
      const groups = classifyMuscle(info.target, info.body_part);
      const completedAt = workoutDateMap[ex.workout_id];
      if (!completedAt) return;
      const daysDiff = Math.floor((now.getTime() - completedAt.getTime()) / (1000 * 60 * 60 * 24));
      groups.forEach(g => {
        if (muscleDays[g] === undefined || daysDiff < muscleDays[g]) muscleDays[g] = daysDiff;
      });
    });

    const newMap: MuscleData = {
      chest: "none", shoulders: "none", arms: "none", back: "none",
      abs: "none", glutes: "none", legs: "none", calves: "none",
    };
    for (const [muscle, days] of Object.entries(muscleDays)) {
      if (muscle in newMap) newMap[muscle] = getMuscleStatus(days);
    }
    setMuscleMap(newMap);
  };

  const fetchData = async () => {
    const { data: program } = await supabase
      .from("workout_programs").select("*")
      .eq("is_active", true).limit(1).single();
    if (!program) return;

    const { data: workouts } = await supabase
      .from("workouts").select("*")
      .eq("program_id", program.id).order("sort_order");

    if (workouts) {
      const plan = generateWeekPlan(workouts);
      setWeekPlan(plan);
      const today = plan.find(d => d.today);
      if (today && today.workoutId) {
        const { data: exercises } = await supabase
          .from("exercises").select("*")
          .eq("workout_id", today.workoutId);
        setTodayWorkout({ ...today, exercises: exercises?.length || 0 });
      }
    }

    const { data: streakData } = await supabase
      .from("user_streaks").select("*")
      .eq("user_id", user!.id).single();
    if (streakData) {
      setStreak(streakData.current_streak);
      setLastWorkoutDate(streakData.last_workout_date || "");
    }

    // Calculate weekly progress from logs
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { data: weekLogs } = await supabase
      .from("workout_logs").select("id")
      .eq("user_id", user!.id)
      .gte("completed_at", weekStart.toISOString());
    const daysTarget = 5;
    setWeeklyProgress(Math.min(100, Math.round(((weekLogs?.length || 0) / daysTarget) * 100)));
  };

  const generateWeekPlan = (workouts: any[]): WeekDay[] => {
    const days = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
    const todayIndex = new Date().getDay() || 7;
    const adjustedToday = todayIndex === 0 ? 6 : todayIndex - 1;
    return days.map((day, index) => {
      const isWorkoutDay = [0, 2, 4].includes(index);
      const workoutIndex = isWorkoutDay ? Math.floor(index / 2) : 0;
      const workout = isWorkoutDay && workouts[workoutIndex % workouts.length] ? workouts[workoutIndex % workouts.length] : null;
      return {
        day, name: workout ? workout.title : "Descanso",
        duration: workout ? 45 : 0, exercises: workout ? 8 : 0,
        done: index < adjustedToday, rest: !workout,
        today: index === adjustedToday, workoutId: workout?.id,
      };
    });
  };

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Rainha";

  /* ─── Menu Grid Items ─── */
  const menuItems = [
    { icon: Dumbbell, title: "Meus Treinos", sub: "Planos personalizados", route: "/app/workouts", emoji: "💪" },
    { icon: TrendingUp, title: "Minha Evolução", sub: "Progresso & métricas", route: "/app/history", emoji: "📈" },
    { icon: Users, title: "Comunidade", sub: "Inspire & seja inspirada", route: "/app/community", emoji: "🤝" },
    { icon: Trophy, title: "Conquistas", sub: `${streak} dias de fogo`, route: "/app/history", emoji: "🏆" },
  ];

  /* ─── Bottom Nav Items ─── */
  const navItems = [
    { icon: Home, label: "Início", route: "/app", active: true },
    { icon: Dumbbell, label: "Treinos", route: "/app/workouts", active: false },
    { icon: Users, label: "Feed", route: "/app/community", active: false },
    { icon: TrendingUp, label: "Evolução", route: "/app/history", active: false },
    { icon: User, label: "Perfil", route: "/app/profile", active: false },
  ];

  return (
    <div
      className="min-h-screen pb-28 overflow-x-hidden"
      style={{ backgroundColor: SOLAR.bg, fontFamily: "'Inter', -apple-system, sans-serif" }}
    >
      {/* ═══ HEADER ═══ */}
      <header className="px-5 pt-4 pb-2">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span
              className="text-xl tracking-tight"
              style={{ fontWeight: 900, color: SOLAR.text, letterSpacing: "-0.5px" }}
            >
              MEU SHAPE
            </span>
            <Sparkles size={16} style={{ color: SOLAR.orange }} strokeWidth={2.5} />
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              className="relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95"
              style={{
                backgroundColor: SOLAR.card,
                border: `1px solid ${SOLAR.cardBorder}`,
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
            >
              <Bell size={18} style={{ color: SOLAR.textSub }} />
              <div
                className="absolute top-2 right-2 w-2 h-2 rounded-full"
                style={{ backgroundColor: SOLAR.coral }}
              />
            </button>
            <button
              className="w-10 h-10 rounded-2xl overflow-hidden transition-all active:scale-95"
              onClick={() => navigate("/app/profile")}
              style={{
                border: `2px solid ${SOLAR.orange}`,
                boxShadow: `0 0 0 3px ${SOLAR.glow}`,
              }}
            >
              <div
                className="w-full h-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: `linear-gradient(135deg, ${SOLAR.orange}, ${SOLAR.amber})`,
                  color: "#fff",
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ═══ GREETING ═══ */}
      <section className="px-5 pt-2 pb-4">
        <div className="max-w-lg mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl mb-1"
            style={{ fontWeight: 900, color: SOLAR.text, letterSpacing: "-0.3px" }}
          >
            Bora pra cima, {userName}! 🚀
          </motion.h1>
          <p className="text-sm" style={{ color: SOLAR.textMuted, fontWeight: 400 }}>
            {todayWorkout
              ? `Hoje é dia de ${todayWorkout.name.toLowerCase().includes("cardio") ? "cardio pesado" : "moer os inferiores"}!`
              : "Seu corpo agradece cada treino 💛"}
          </p>
        </div>
      </section>

      {/* ═══ WEEK STRIP ═══ */}
      <section className="px-5 mb-5">
        <div className="max-w-lg mx-auto flex gap-1.5">
          {weekPlan.map((d, i) => {
            const isToday = d.today;
            const isDone = d.done;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex-1 text-center py-2.5 rounded-2xl transition-all"
                style={{
                  backgroundColor: isToday
                    ? SOLAR.orange
                    : isDone
                    ? "#FFF7ED"
                    : SOLAR.card,
                  border: `1px solid ${isToday ? SOLAR.orange : isDone ? "#FDBA74" : SOLAR.cardBorder}`,
                  boxShadow: isToday ? `0 4px 16px ${SOLAR.glowStrong}` : "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  className="text-[9px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: isToday ? "#fff" : SOLAR.textMuted }}
                >
                  {d.day}
                </div>
                {d.rest ? (
                  <span className="text-xs">😴</span>
                ) : isDone ? (
                  <span className="text-xs" style={{ color: SOLAR.orange }}>✓</span>
                ) : isToday ? (
                  <Flame size={14} className="mx-auto" style={{ color: "#fff" }} />
                ) : (
                  <div
                    className="w-1.5 h-1.5 rounded-full mx-auto"
                    style={{ backgroundColor: SOLAR.cardBorder }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ═══ MUSCLE MAP CARD ═══ */}
      <section className="px-5 mb-5">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative overflow-hidden rounded-[2rem] p-5"
            style={{
              background: `linear-gradient(145deg, #FFF7ED 0%, #FFEDD5 40%, #FED7AA 100%)`,
              border: `1px solid rgba(251,191,36,0.3)`,
              boxShadow: `0 8px 32px ${SOLAR.glow}, inset 0 1px 0 rgba(255,255,255,0.6)`,
            }}
          >
            {/* Decorative glow orb */}
            <div
              className="absolute -top-8 -right-8 w-32 h-32 rounded-full"
              style={{
                background: `radial-gradient(circle, ${SOLAR.glowStrong} 0%, transparent 70%)`,
                filter: "blur(20px)",
              }}
            />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div>
                <h3
                  className="text-base mb-0.5"
                  style={{ fontWeight: 800, color: SOLAR.text, letterSpacing: "-0.2px" }}
                >
                  Mapa Muscular
                </h3>
                <p className="text-xs" style={{ color: SOLAR.textSub }}>
                  Últimos 7 dias de atividade
                </p>
              </div>
              <div
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{
                  backgroundColor: "rgba(234,88,12,0.12)",
                  color: SOLAR.orange,
                }}
              >
                <Target size={12} />
                {weeklyProgress}%
              </div>
            </div>

            <div className="flex items-center gap-5 relative z-10">
              {/* Body map */}
              <div className="flex-shrink-0">
                <BodyMap muscleMap={muscleMap} statusColor={muscleStatusColor} />
              </div>

              {/* Legend + Progress */}
              <div className="flex-1 space-y-2.5">
                {(() => {
                  const statusGroups: Record<MuscleStatus, string[]> = { today: [], recent: [], recovering: [], none: [] };
                  const muscleLabels: Record<string, string> = {
                    chest: "Peito", shoulders: "Ombros", arms: "Braços",
                    back: "Costas", abs: "Abdome", glutes: "Glúteos",
                    legs: "Pernas", calves: "Panturrilha",
                  };
                  Object.entries(muscleMap).forEach(([m, s]) => statusGroups[s].push(muscleLabels[m] || m));

                  const items = [
                    { status: "today" as MuscleStatus, label: "Treinado hoje", color: "#F97316" },
                    { status: "recent" as MuscleStatus, label: "Últimos 2 dias", color: "#FBBF24" },
                    { status: "recovering" as MuscleStatus, label: "Recuperando", color: "#D97706" },
                    { status: "none" as MuscleStatus, label: "Não treinado", color: "#D6D3D1" },
                  ];

                  return items
                    .filter(item => statusGroups[item.status].length > 0)
                    .map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: item.color,
                            boxShadow: item.status !== "none" ? `0 0 6px ${item.color}50` : "none",
                          }}
                        />
                        <div>
                          <div className="text-[11px] font-semibold" style={{ color: SOLAR.text }}>
                            {item.label}
                          </div>
                          <div className="text-[10px]" style={{ color: SOLAR.textMuted }}>
                            {statusGroups[item.status].join(", ")}
                          </div>
                        </div>
                      </div>
                    ));
                })()}

                {/* Weekly Goal Progress Bar */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: SOLAR.textSub }}>
                      Meta Semanal
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: SOLAR.orange }}>
                      {weeklyProgress}%
                    </span>
                  </div>
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "rgba(234,88,12,0.1)" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${weeklyProgress}%` }}
                      transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${SOLAR.amber}, ${SOLAR.orange})`,
                        boxShadow: `0 0 8px ${SOLAR.glowStrong}`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ TODAY'S WORKOUT CTA ═══ */}
      {todayWorkout && (
        <section className="px-5 mb-5">
          <div className="max-w-lg mx-auto">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              whileTap={{ scale: 0.97 }}
              onClick={() =>
                todayWorkout.workoutId
                  ? navigate(`/app/workout-detail/${todayWorkout.workoutId}`)
                  : navigate("/app/workouts")
              }
              className="w-full relative overflow-hidden rounded-[2rem] p-5 text-left transition-all"
              style={{
                background: `linear-gradient(135deg, ${SOLAR.orange} 0%, ${SOLAR.terracotta} 100%)`,
                boxShadow: `0 8px 32px ${SOLAR.glowStrong}`,
              }}
            >
              <div
                className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-30"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent)" }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={14} style={{ color: "#FDE68A" }} />
                  <span
                    className="text-[10px] uppercase tracking-widest font-bold"
                    style={{ color: "#FDE68A" }}
                  >
                    Treino de Hoje
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-1 tracking-tight">
                  {todayWorkout.name}
                </h3>
                <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {todayWorkout.duration} min · {todayWorkout.exercises} exercícios · ~320 kcal
                </p>
                <div
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(8px)",
                    color: "#fff",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                >
                  Começar Agora
                  <ChevronRight size={16} />
                </div>
              </div>
            </motion.button>
          </div>
        </section>
      )}

      {/* ═══ MENU GRID 2×2 ═══ */}
      <section className="px-5 mb-5">
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
          {menuItems.map((item, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.06 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(item.route)}
              className="relative p-4 rounded-[1.5rem] text-left transition-all group"
              style={{
                backgroundColor: SOLAR.card,
                border: `1px solid ${SOLAR.cardBorder}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: i === 0
                      ? `linear-gradient(135deg, #FFF7ED, #FFEDD5)`
                      : i === 1
                      ? "linear-gradient(135deg, #FEF3C7, #FDE68A)"
                      : i === 2
                      ? "linear-gradient(135deg, #FFF1F2, #FECDD3)"
                      : "linear-gradient(135deg, #FFF7ED, #FED7AA)",
                  }}
                >
                  <item.icon
                    size={18}
                    style={{
                      color: i === 0 ? SOLAR.orange
                        : i === 1 ? SOLAR.amber
                        : i === 2 ? SOLAR.coral
                        : SOLAR.terracotta,
                    }}
                    strokeWidth={2.5}
                  />
                </div>
                <ChevronRight
                  size={14}
                  style={{ color: SOLAR.cardBorder }}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </div>
              <p className="text-sm mb-0.5" style={{ fontWeight: 700, color: SOLAR.text }}>
                {item.title}
              </p>
              <p className="text-[11px]" style={{ color: SOLAR.textMuted }}>
                {item.sub}
              </p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ═══ HIGHLIGHT BANNER — PROJETO VERÃO ═══ */}
      <section className="px-5 mb-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 }}
            className="relative overflow-hidden rounded-[2rem] p-5"
            style={{
              background: `linear-gradient(135deg, ${SOLAR.terracotta} 0%, ${SOLAR.orange} 50%, ${SOLAR.amber} 100%)`,
              boxShadow: `0 6px 24px ${SOLAR.glowStrong}`,
            }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
              <svg viewBox="0 0 100 100" fill="none">
                <circle cx="80" cy="20" r="40" fill="rgba(255,255,255,0.3)" />
                <circle cx="60" cy="40" r="25" fill="rgba(255,255,255,0.15)" />
              </svg>
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={14} style={{ color: "#FDE68A" }} />
                <span
                  className="text-[10px] uppercase tracking-widest font-bold"
                  style={{ color: "#FDE68A" }}
                >
                  Desafio Especial
                </span>
              </div>
              <h3
                className="text-lg text-white mb-1"
                style={{ fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.5px" }}
              >
                PROJETO VERÃO 2026
              </h3>
              <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                12 semanas para transformar seu shape. Programa completo com treinos, nutrição e comunidade.
              </p>
              <div
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl"
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  color: "#fff",
                  backdropFilter: "blur(4px)",
                  border: "1px solid rgba(255,255,255,0.2)",
                }}
              >
                Quero Participar
                <Sparkles size={12} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ BOTTOM TAB BAR — Glassmorphism ═══ */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30"
        style={{
          backgroundColor: "rgba(248,245,242,0.85)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
          borderTop: `1px solid ${SOLAR.cardBorder}`,
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 pb-7">
          {navItems.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center gap-0.5 py-1 px-3 transition-all active:scale-95"
            >
              <div className="relative">
                <item.icon
                  size={20}
                  style={{
                    color: item.active ? SOLAR.orange : SOLAR.textMuted,
                    strokeWidth: item.active ? 2.5 : 1.8,
                  }}
                />
                {item.active && (
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{
                      backgroundColor: SOLAR.orange,
                      boxShadow: `0 0 6px ${SOLAR.orange}`,
                    }}
                  />
                )}
              </div>
              <span
                className="text-[10px]"
                style={{
                  color: item.active ? SOLAR.orange : SOLAR.textMuted,
                  fontWeight: item.active ? 700 : 500,
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AppDashboard;
