import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  Bell, Sparkles, ChevronRight, Trophy, Flame,
  Target, Calendar, Zap, Dumbbell, TrendingUp, Users
} from "lucide-react";
import { BodyMap } from "@/components/BodyMap";
import { SolarBottomNav, useSolar } from "@/components/SolarLayout";

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
    case "today": return "#F97316";
    case "recent": return "#FBBF24";
    case "recovering": return "#D97706";
    default: return "#E7E5E4";
  }
}

/* S is now imported from SolarLayout */

const AppDashboard = () => {
  const S = useSolar();
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

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Jorge";

  const menuItems = [
    { icon: Dumbbell, title: "Meus Treinos", sub: "Planos personalizados", route: "/app/workouts", gradient: "linear-gradient(135deg, #FFF7ED, #FFEDD5)", iconColor: S.orange },
    { icon: TrendingUp, title: "Minha Evolução", sub: "Progresso & métricas", route: "/app/history", gradient: "linear-gradient(135deg, #FEF3C7, #FDE68A)", iconColor: S.amber },
    { icon: Users, title: "Comunidade", sub: "Inspire & seja inspirado", route: "/app/community", gradient: "linear-gradient(135deg, #FFF1F2, #FECDD3)", iconColor: S.coral },
    { icon: Trophy, title: "Conquistas", sub: `${streak} dias de fogo`, route: "/app/history", gradient: "linear-gradient(135deg, #FFF7ED, #FED7AA)", iconColor: S.terracotta },
  ];

  // navItems removed — using shared SolarBottomNav

  /* ─── Muscle legend helper ─── */
  const muscleLabels: Record<string, string> = {
    chest: "Peito", shoulders: "Ombros", arms: "Braços",
    back: "Costas", abs: "Abdome", glutes: "Glúteos",
    legs: "Pernas", calves: "Panturrilha",
  };
  const statusGroups: Record<MuscleStatus, string[]> = { today: [], recent: [], recovering: [], none: [] };
  Object.entries(muscleMap).forEach(([m, s]) => statusGroups[s].push(muscleLabels[m] || m));

  const legendItems = [
    { status: "today" as MuscleStatus, label: "Treinado hoje", color: "#F97316" },
    { status: "recent" as MuscleStatus, label: "Últimos 2 dias", color: "#FBBF24" },
    { status: "recovering" as MuscleStatus, label: "Recuperando", color: "#D97706" },
    { status: "none" as MuscleStatus, label: "Não treinado", color: "#D6D3D1" },
  ].filter(item => statusGroups[item.status].length > 0);

  return (
    <div
      className="min-h-screen pb-28 overflow-x-hidden"
      style={{ backgroundColor: S.bg, fontFamily: "'Inter', sans-serif" }}
    >
      {/* ═══ HEADER — Sticky Glassmorphism ═══ */}
      <header
        className="sticky top-0 z-20 px-5 pt-4 pb-3"
        style={{
          backgroundColor: "rgba(253,252,251,0.8)",
          backdropFilter: "blur(20px) saturate(1.6)",
          WebkitBackdropFilter: "blur(20px) saturate(1.6)",
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          {/* Logo — Montserrat Black Italic */}
          <div className="flex items-center gap-1.5">
            <span
              className="font-display text-[22px]"
              style={{
                fontWeight: 900,
                fontStyle: "italic",
                color: S.text,
                letterSpacing: "-0.05em",
              }}
            >
              MEUSHAPE
            </span>
            <Sparkles size={14} style={{ color: S.orange }} strokeWidth={2.5} />
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              className="relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95"
              style={{
                backgroundColor: S.card,
                border: `1px solid ${S.cardBorder}`,
                boxShadow: `0 2px 8px rgba(234,88,12,0.06)`,
              }}
            >
              <Bell size={18} style={{ color: S.textSub }} />
              <div
                className="absolute top-2 right-2.5 w-2 h-2 rounded-full"
                style={{ backgroundColor: S.coral }}
              />
            </button>
            <button
              className="w-10 h-10 rounded-2xl overflow-hidden transition-all active:scale-95"
              onClick={() => navigate("/app/profile")}
              style={{
                border: `2px solid ${S.orange}`,
                boxShadow: `0 0 0 3px ${S.glow}`,
              }}
            >
              <div
                className="w-full h-full flex items-center justify-center font-display text-sm"
                style={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`,
                  color: "#fff",
                }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* ═══ HERO GREETING ═══ */}
      <section className="px-5 pt-4 pb-3">
        <div className="max-w-lg mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-display text-[26px] mb-1"
            style={{
              fontWeight: 800,
              letterSpacing: "-0.03em",
              background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Bora pra cima, {userName}! 🚀
          </motion.h1>
          <p
            className="text-[13px]"
            style={{ color: S.textMuted, fontWeight: 400, letterSpacing: "0.02em" }}
          >
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
                className="flex-1 text-center py-2.5 transition-all"
                style={{
                  borderRadius: "1rem",
                  backgroundColor: isToday ? S.orange : isDone ? "#FFF7ED" : S.card,
                  border: `1px solid ${isToday ? S.orange : isDone ? "#FDBA74" : S.cardBorder}`,
                  boxShadow: isToday
                    ? `0 4px 20px ${S.glowStrong}`
                    : `0 1px 4px rgba(234,88,12,0.04)`,
                }}
              >
                <div
                  className="text-[9px] font-bold uppercase tracking-wider mb-0.5"
                  style={{ color: isToday ? "#fff" : S.textMuted, fontFamily: "'Inter', sans-serif" }}
                >
                  {d.day}
                </div>
                {d.rest ? (
                  <span className="text-xs">😴</span>
                ) : isDone ? (
                  <span className="text-xs" style={{ color: S.orange }}>✓</span>
                ) : isToday ? (
                  <Flame size={14} className="mx-auto" style={{ color: "#fff" }} />
                ) : (
                  <div
                    className="w-1.5 h-1.5 rounded-full mx-auto"
                    style={{ backgroundColor: S.cardBorder }}
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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="relative overflow-hidden p-5"
            style={{
              borderRadius: "3rem",
              background: "linear-gradient(145deg, #FFF7ED 0%, #FFEDD5 40%, #FED7AA 100%)",
              border: "1px solid rgba(251,191,36,0.25)",
              boxShadow: `0 8px 40px ${S.glow}, inset 0 1px 0 rgba(255,255,255,0.7)`,
            }}
          >
            {/* Decorative blur orb */}
            <div
              className="absolute -top-10 -right-10 w-40 h-40 rounded-full"
              style={{
                background: `radial-gradient(circle, ${S.glowStrong} 0%, transparent 70%)`,
                filter: "blur(30px)",
              }}
            />

            <div className="flex justify-between items-start mb-3 relative z-10">
              <div>
                <h3
                  className="font-display text-base mb-0.5"
                  style={{ fontWeight: 800, color: S.text, letterSpacing: "-0.02em" }}
                >
                  Mapa Muscular
                </h3>
                <p className="text-[11px]" style={{ color: S.textSub }}>
                  Últimos 7 dias de atividade
                </p>
              </div>
              <div
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold"
                style={{
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(234,88,12,0.12)",
                  color: S.orange,
                }}
              >
                <Target size={12} />
                {weeklyProgress}%
              </div>
            </div>

            <div className="flex items-center gap-5 relative z-10">
              <div className="flex-shrink-0">
                <BodyMap muscleMap={muscleMap} statusColor={muscleStatusColor} />
              </div>

              <div className="flex-1 space-y-2.5">
                {legendItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: item.color,
                        boxShadow: item.status !== "none" ? `0 0 8px ${item.color}60` : "none",
                      }}
                    />
                    <div>
                      <div className="text-[11px] font-semibold" style={{ color: S.text }}>
                        {item.label}
                      </div>
                      <div className="text-[10px]" style={{ color: S.textMuted }}>
                        {statusGroups[item.status].join(", ")}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Weekly Goal Progress */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: S.textSub }}>
                      Meta Semanal
                    </span>
                    <span className="text-[10px] font-bold" style={{ color: S.orange }}>
                      {weeklyProgress}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(234,88,12,0.1)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${weeklyProgress}%` }}
                      transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${S.amber}, ${S.orange})`,
                        boxShadow: `0 0 10px ${S.glowStrong}`,
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
              className="w-full relative overflow-hidden p-5 text-left transition-all"
              style={{
                borderRadius: "3rem",
                background: `linear-gradient(135deg, ${S.orange} 0%, ${S.terracotta} 100%)`,
                boxShadow: `0 12px 40px ${S.glowStrong}`,
              }}
            >
              <div
                className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full opacity-30"
                style={{ background: "radial-gradient(circle, rgba(255,255,255,0.4), transparent)" }}
              />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={14} style={{ color: "#FDE68A" }} />
                  <span
                    className="text-[10px] uppercase tracking-[0.15em] font-bold"
                    style={{ color: "#FDE68A" }}
                  >
                    Treino de Hoje
                  </span>
                </div>
                <h3
                  className="font-display text-xl text-white mb-1"
                  style={{ fontWeight: 800, letterSpacing: "-0.02em" }}
                >
                  {todayWorkout.name}
                </h3>
                <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {todayWorkout.duration} min · {todayWorkout.exercises} exercícios · ~320 kcal
                </p>
                <div
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-all"
                  style={{
                    borderRadius: "1.5rem",
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
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.3 + i * 0.1,
                duration: 0.5,
                type: "spring",
                stiffness: 260,
                damping: 20,
              }}
              whileHover={{
                y: -4,
                scale: 1.03,
                boxShadow: `0 12px 32px rgba(234,88,12,0.15), 0 0 0 1px ${S.orange}20`,
                transition: { duration: 0.25 },
              }}
              whileTap={{ scale: 0.95, y: 0 }}
              onClick={() => navigate(item.route)}
              className="relative p-4 text-left group overflow-hidden"
              style={{
                borderRadius: "1.5rem",
                backgroundColor: S.card,
                border: `1px solid ${S.cardBorder}`,
                boxShadow: `0 2px 12px rgba(234,88,12,0.05)`,
              }}
            >
              {/* Hover glow orb */}
              <motion.div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
                initial={{ opacity: 0, scale: 0.5 }}
                whileHover={{ opacity: 1, scale: 1 }}
                style={{
                  background: `radial-gradient(circle, ${item.iconColor}18 0%, transparent 70%)`,
                  filter: "blur(12px)",
                }}
              />

              <div className="flex items-center justify-between mb-3 relative z-10">
                <motion.div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: item.gradient }}
                  whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
                >
                  <item.icon size={18} style={{ color: item.iconColor }} strokeWidth={2.5} />
                </motion.div>
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <ChevronRight size={14} style={{ color: S.cardBorder }} />
                </motion.div>
              </div>
              <p className="font-display text-sm mb-0.5 relative z-10" style={{ fontWeight: 700, color: S.text }}>
                {item.title}
              </p>
              <p className="text-[11px]" style={{ color: S.textMuted }}>
                {item.sub}
              </p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ═══ PREMIUM CTA — LEG DAY INTENSO ═══ */}
      <section className="px-5 mb-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.55 }}
            className="relative overflow-hidden p-6"
            style={{
              borderRadius: "3rem",
              background: "linear-gradient(135deg, #18181B 0%, #27272A 60%, #3F3F46 100%)",
              boxShadow: `0 8px 32px rgba(0,0,0,0.25), 0 0 60px ${S.glow}`,
            }}
          >
            {/* Subtle gradient overlay */}
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at 80% 20%, rgba(234,88,12,0.12) 0%, transparent 60%)`,
                pointerEvents: "none",
              }}
            />
            {/* Inner border glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                borderRadius: "3rem",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`,
                    boxShadow: `0 0 20px ${S.glowStrong}`,
                  }}
                >
                  <Zap size={16} style={{ color: "#fff" }} strokeWidth={2.5} />
                </div>
                <span
                  className="text-[10px] uppercase font-bold tracking-[0.15em]"
                  style={{ color: S.amber }}
                >
                  Desafio Especial
                </span>
              </div>
              <h3
                className="font-display text-xl text-white mb-1.5"
                style={{ fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.04em" }}
              >
                LEG DAY INTENSO
              </h3>
              <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                Protocolo avançado de glúteos & posterior. 45 min de pura intensidade.
              </p>
              <button
                className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 transition-all active:scale-95"
                style={{
                  borderRadius: "1.25rem",
                  background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`,
                  color: "#fff",
                  boxShadow: `0 4px 20px ${S.glowStrong}`,
                }}
              >
                Aceitar Desafio
                <Sparkles size={12} />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ HIGHLIGHT — PROJETO VERÃO ═══ */}
      <section className="px-5 mb-6">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.65 }}
            className="relative overflow-hidden p-5"
            style={{
              borderRadius: "3rem",
              background: `linear-gradient(135deg, ${S.terracotta} 0%, ${S.orange} 50%, ${S.amber} 100%)`,
              boxShadow: `0 6px 28px ${S.glowStrong}`,
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
                <span className="text-[10px] uppercase tracking-[0.15em] font-bold" style={{ color: "#FDE68A" }}>
                  Programa Completo
                </span>
              </div>
              <h3
                className="font-display text-lg text-white mb-1"
                style={{ fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.04em" }}
              >
                PROJETO VERÃO 2026
              </h3>
              <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                12 semanas para transformar seu shape. Treinos, nutrição e comunidade.
              </p>
              <div
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2"
                style={{
                  borderRadius: "1rem",
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

      <SolarBottomNav />
    </div>
  );
};

export default AppDashboard;
