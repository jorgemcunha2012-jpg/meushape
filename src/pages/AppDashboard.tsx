import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Bell, Sparkles, ChevronRight, Trophy, Flame,
  Clock, Calendar, Zap, Dumbbell, TrendingUp, Users, Target, Heart
} from "lucide-react";
import { SolarBottomNav, useSolar, type SolarPalette } from "@/components/SolarLayout";
import useEmblaCarousel from "embla-carousel-react";
import OnboardingDrawer from "@/components/OnboardingDrawer";
import illustrationTreino from "@/assets/illustration-treino.png";
import illustrationEvolucao from "@/assets/illustration-evolucao.png";
import illustrationComunidade from "@/assets/illustration-comunidade.png";
import illustrationConquistas from "@/assets/illustration-conquistas.png";

/* ─── Carousel Dot Indicator ─── */
const DotIndicator = ({ count, active, color }: { count: number; active: number; color: string }) => (
  <div className="flex items-center justify-center gap-1.5 mt-3">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="rounded-full transition-all duration-300"
        style={{
          width: i === active ? 16 : 6,
          height: 6,
          backgroundColor: i === active ? color : `${color}30`,
        }}
      />
    ))}
  </div>
);

/* ─── Challenge Data ─── */
const CHALLENGES = [
  {
    id: "leg-day",
    programId: "49665ed0-8124-4ec1-997e-5ec66b3e35a4",
    title: "LEG DAY INTENSO",
    desc: "Protocolo avançado de glúteos & posterior. 45 min de pura intensidade.",
    icon: Zap,
    accent: "#F59E0B",
  },
  {
    id: "abdomen",
    programId: null,
    title: "ABDÔMEN DE AÇO",
    desc: "Core destruidor em 30 min. Sem desculpas, sem descanso.",
    icon: Target,
    accent: "#FB7185",
  },
  {
    id: "upper",
    programId: null,
    title: "UPPER BODY INSANO",
    desc: "Peito, costas e ombros no limite. Saia maior do que entrou.",
    icon: Dumbbell,
    accent: "#60A5FA",
  },
  {
    id: "hiit",
    programId: null,
    title: "HIIT INFERNO",
    desc: "20 min que valem por 1 hora. Queime tudo, descanse depois.",
    icon: Flame,
    accent: "#F97316",
  },
  {
    id: "gluteos",
    programId: null,
    title: "GLÚTEOS ON FIRE",
    desc: "Protocolo focado em bumbum. Cada rep conta, cada série transforma.",
    icon: Heart,
    accent: "#E879F9",
  },
];

/* ─── Project Data ─── */
const PROJECTS = [
  {
    id: "verao",
    title: "PROJETO VERÃO 2026",
    desc: "12 semanas para transformar seu shape. Treinos, nutrição e comunidade.",
    weeks: "12 semanas",
  },
  {
    id: "bumbum",
    title: "PROJETO BUMBUM NA NUCA",
    desc: "8 semanas de foco total em glúteos. O espelho vai aplaudir.",
    weeks: "8 semanas",
  },
  {
    id: "abdomen",
    title: "PROJETO ABDÔMEN TRINCADO",
    desc: "6 semanas pra secar e definir o core. Shape de capa de revista.",
    weeks: "6 semanas",
  },
  {
    id: "shape",
    title: "PROJETO SHAPE COMPLETO",
    desc: "10 semanas full body. De iniciante a máquina em 70 dias.",
    weeks: "10 semanas",
  },
];

/* ─── Challenge Carousel Component ─── */
const ChallengeCarousel = ({
  S, challengeAccepted, acceptChallenge, navigate,
}: {
  S: SolarPalette;
  challengeAccepted: boolean;
  acceptChallenge: () => void;
  navigate: (path: string) => void;
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true, dragFree: false });
  const [activeIndex, setActiveIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  return (
    <section className="mb-6">
      <div className="max-w-lg mx-auto px-5 mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm" style={{ fontWeight: 800, color: S.text, letterSpacing: "-0.02em" }}>
          🔥 Desafios Especiais
        </h2>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${S.orange}18`, color: S.orange }}>
          {CHALLENGES.length} disponíveis
        </span>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {CHALLENGES.map((c, i) => {
            const Icon = c.icon;
            const isLegDay = c.programId !== null;
            return (
              <div key={c.id} className="flex-[0_0_85%] min-w-0 pl-4 first:pl-5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="relative overflow-hidden p-5"
                  style={{
                    borderRadius: "2rem",
                    background: "linear-gradient(135deg, #18181B 0%, #27272A 60%, #3F3F46 100%)",
                    boxShadow: `0 8px 32px rgba(0,0,0,0.25), 0 0 40px ${c.accent}15`,
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(ellipse at 80% 20%, ${c.accent}1A 0%, transparent 60%)`,
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ borderRadius: "2rem", border: "1px solid rgba(255,255,255,0.08)" }}
                  />
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${c.accent}, ${c.accent}CC)`,
                          boxShadow: `0 0 20px ${c.accent}40`,
                        }}
                      >
                        <Icon size={16} style={{ color: "#fff" }} strokeWidth={2.5} />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-[0.15em]" style={{ color: c.accent }}>
                        Desafio Especial
                      </span>
                    </div>
                    <h3
                      className="font-display text-xl text-white mb-1.5"
                      style={{ fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.04em" }}
                    >
                      {c.title}
                    </h3>
                    <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {c.desc}
                    </p>
                    <button
                      onClick={() => {
                        if (isLegDay) {
                          acceptChallenge();
                        } else {
                          toast({ title: "🔥 Em breve!", description: `${c.title} estará disponível em breve.` });
                        }
                      }}
                      disabled={isLegDay && challengeAccepted}
                      className="inline-flex items-center gap-2 text-xs font-bold px-5 py-2.5 transition-all active:scale-95 disabled:opacity-60"
                      style={{
                        borderRadius: "1.25rem",
                        background: `linear-gradient(135deg, ${c.accent}, ${c.accent}CC)`,
                        color: "#fff",
                        boxShadow: `0 4px 20px ${c.accent}40`,
                      }}
                    >
                      {isLegDay && challengeAccepted ? "Desafio Aceito ✓" : "Aceitar Desafio"}
                      <Sparkles size={12} />
                    </button>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
      <DotIndicator count={CHALLENGES.length} active={activeIndex} color={S.orange} />
    </section>
  );
};

/* ─── Project Carousel Component ─── */
const ProjectCarousel = ({
  S, navigate,
}: {
  S: SolarPalette;
  navigate: (path: string) => void;
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true, dragFree: false });
  const [activeIndex, setActiveIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setActiveIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const gradients = [
    `linear-gradient(135deg, ${S.terracotta} 0%, ${S.orange} 50%, ${S.amber} 100%)`,
    `linear-gradient(135deg, #B91C1C 0%, #DC2626 50%, ${S.coral} 100%)`,
    `linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #A78BFA 100%)`,
    `linear-gradient(135deg, #0D9488 0%, #14B8A6 50%, #2DD4BF 100%)`,
  ];

  return (
    <section className="mb-6">
      <div className="max-w-lg mx-auto px-5 mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm" style={{ fontWeight: 800, color: S.text, letterSpacing: "-0.02em" }}>
          🏆 Projetos
        </h2>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${S.orange}18`, color: S.orange }}>
          {PROJECTS.length} projetos
        </span>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {PROJECTS.map((p, i) => (
            <div key={p.id} className="flex-[0_0_85%] min-w-0 pl-4 first:pl-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="relative overflow-hidden p-5"
                style={{
                  borderRadius: "2rem",
                  background: gradients[i],
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
                      {p.weeks}
                    </span>
                  </div>
                  <h3
                    className="font-display text-lg text-white mb-1"
                    style={{ fontWeight: 900, fontStyle: "italic", letterSpacing: "-0.04em" }}
                  >
                    {p.title}
                  </h3>
                  <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {p.desc}
                  </p>
                  <button
                    onClick={() => {
                      toast({ title: "🏆 Em breve!", description: `${p.title} estará disponível em breve.` });
                    }}
                    className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 transition-all active:scale-95"
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
                  </button>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
      <DotIndicator count={PROJECTS.length} active={activeIndex} color={S.orange} />
    </section>
  );
};

/* ─── Types ─── */
interface WeekDay {
  day: string; name: string; duration: number;
  exercises: number; done: boolean; rest?: boolean;
  today?: boolean; workoutId?: string;
}

interface WeekLog {
  workoutTitle: string;
  durationMin: number;
  completedAt: string;
}

function relativeDay(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  const weekDays = ["domingo", "2ª feira", "3ª feira", "4ª feira", "5ª feira", "6ª feira", "sábado"];
  return weekDays[d.getDay()];
}

const AppDashboard = () => {
  const S = useSolar();
  const { user, subscribed, subscriptionLoading } = useAuth();
  const navigate = useNavigate();

  const [weekPlan, setWeekPlan] = useState<WeekDay[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string>("");
  const [weekStats, setWeekStats] = useState({ done: 0, totalMin: 0, goal: 5 });
  const [recentLogs, setRecentLogs] = useState<WeekLog[]>([]);
  const [prevWeekStats, setPrevWeekStats] = useState<{ done: number; totalMin: number } | null>(null);
  const [lastWorkoutTitle, setLastWorkoutTitle] = useState<string>("");
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [challengeAccepted, setChallengeAccepted] = useState(false);

  const CHALLENGE_PROGRAM_ID = "49665ed0-8124-4ec1-997e-5ec66b3e35a4";

  const acceptChallenge = async () => {
    if (!user || challengeAccepted) return;
    const { data: existing } = await supabase
      .from("user_programs")
      .select("id")
      .eq("user_id", user.id)
      .eq("program_id", CHALLENGE_PROGRAM_ID)
      .maybeSingle();
    if (existing) {
      setChallengeAccepted(true);
      navigate(`/app/program/${CHALLENGE_PROGRAM_ID}`);
      return;
    }
    const { error } = await supabase
      .from("user_programs")
      .insert({ user_id: user.id, program_id: CHALLENGE_PROGRAM_ID });
    if (error) {
      toast({ title: "Erro", description: "Não foi possível aceitar o desafio.", variant: "destructive" });
      return;
    }
    setChallengeAccepted(true);
    toast({ title: "🔥 Desafio aceito!", description: "LEG DAY INTENSO adicionado aos seus treinos." });
    navigate(`/app/program/${CHALLENGE_PROGRAM_ID}`);
  };

  useEffect(() => {
    if (!subscriptionLoading && !user) { navigate("/app/login"); return; }
    if (user && subscribed) { fetchData(); checkChallengeStatus(); }
    if (user) checkOnboarding();
  }, [user, subscribed, subscriptionLoading, navigate]);

  const checkChallengeStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_programs")
      .select("id")
      .eq("user_id", user.id)
      .eq("program_id", CHALLENGE_PROGRAM_ID)
      .maybeSingle();
    if (data) setChallengeAccepted(true);
  };

  const checkOnboarding = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_answers")
      .eq("id", user.id)
      .single();
    const answers = data?.onboarding_answers as Record<string, any> | null;
    if (!answers || Object.keys(answers).length === 0 || !answers.goal) {
      setShowOnboarding(true);
    }
  };

  const fetchData = async () => {
    const { data: program } = await supabase
      .from("workout_programs").select("*")
      .eq("is_active", true).limit(1).single();
    if (!program) return;

    const daysGoal = program.days_per_week || 5;

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
    weekStart.setHours(0, 0, 0, 0);

    const prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevWeekEnd = new Date(weekStart);

    const calStart = new Date();
    calStart.setDate(calStart.getDate() - 35);
    calStart.setHours(0, 0, 0, 0);

    const [weekLogsRes, prevWeekLogsRes, calLogsRes] = await Promise.all([
      supabase
        .from("workout_logs").select("id, completed_at, duration_minutes, workout_id")
        .eq("user_id", user!.id)
        .gte("completed_at", weekStart.toISOString())
        .order("completed_at", { ascending: false }),
      supabase
        .from("workout_logs").select("id, completed_at, duration_minutes, workout_id")
        .eq("user_id", user!.id)
        .gte("completed_at", prevWeekStart.toISOString())
        .lt("completed_at", prevWeekEnd.toISOString())
        .order("completed_at", { ascending: false }),
      supabase
        .from("workout_logs").select("completed_at")
        .eq("user_id", user!.id)
        .gte("completed_at", calStart.toISOString()),
    ]);

    const weekLogs = weekLogsRes.data;
    const prevWeekLogs = prevWeekLogsRes.data;
    const calLogs = calLogsRes.data;

    const doneDates = new Set<string>();
    calLogs?.forEach(l => {
      doneDates.add(new Date(l.completed_at).toISOString().split("T")[0]);
    });
    weekLogs?.forEach(l => {
      doneDates.add(new Date(l.completed_at).toISOString().split("T")[0]);
    });
    setCompletedDates(doneDates);

    if (prevWeekLogs && prevWeekLogs.length > 0) {
      const prevDone = prevWeekLogs.length;
      const prevTotalMin = prevWeekLogs.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
      setPrevWeekStats({ done: prevDone, totalMin: prevTotalMin });

      const lastLog = prevWeekLogs[0];
      const { data: lastW } = await supabase
        .from("workouts").select("title").eq("id", lastLog.workout_id).single();
      if (lastW) setLastWorkoutTitle(lastW.title);
    }

    const done = weekLogs?.length || 0;
    const totalMin = weekLogs?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
    setWeekStats({ done, totalMin, goal: daysGoal });

    if (weekLogs && weekLogs.length > 0) {
      const wIds = [...new Set(weekLogs.map(l => l.workout_id))];
      const { data: wData } = await supabase
        .from("workouts").select("id, title").in("id", wIds);
      const titleMap: Record<string, string> = {};
      wData?.forEach(w => { titleMap[w.id] = w.title; });

      setRecentLogs(
        weekLogs.slice(0, 3).map(l => ({
          workoutTitle: titleMap[l.workout_id] || "Treino",
          durationMin: l.duration_minutes || 0,
          completedAt: l.completed_at,
        }))
      );
    }
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
    { icon: Dumbbell, title: "Meus Treinos", sub: "Planos & desafios ativos", route: "/app/meus-treinos", illustration: illustrationTreino },
    { icon: TrendingUp, title: "Minha Evolução", sub: "Progresso & métricas", route: "/app/history", illustration: illustrationEvolucao },
    { icon: Users, title: "Comunidade", sub: "Inspire & seja inspirado", route: "/app/community", illustration: illustrationComunidade },
    { icon: Trophy, title: "Conquistas", sub: `${streak} dias de fogo`, route: "/app/history", illustration: illustrationConquistas },
  ];

  const weekProgressPct = weekStats.goal > 0 ? Math.min(100, Math.round((weekStats.done / weekStats.goal) * 100)) : 0;

  return (
    <div
      className="min-h-screen pb-28 overflow-x-hidden"
      style={{ backgroundColor: S.bg, fontFamily: "'Inter', sans-serif" }}
    >
      {/* ═══ HEADER — Sticky Glassmorphism ═══ */}
      <header
        className="sticky top-0 z-20 px-5 pt-4 pb-3"
        style={{
          background: `linear-gradient(to bottom, ${S.orange}, ${S.bg})`,
          backdropFilter: "blur(20px) saturate(1.6)",
          WebkitBackdropFilter: "blur(20px) saturate(1.6)",
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
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
          </div>
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

      {/* ═══ WEEKLY CALENDAR STRIP ═══ */}
      <section className="px-5 mb-5">
        <div className="max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="p-4"
            style={{
              borderRadius: "1.25rem",
              backgroundColor: S.card,
              border: `1px solid ${S.cardBorder}`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm" style={{ fontWeight: 800, color: S.text }}>
                Sua Semana
              </h3>
              <div className="flex items-center gap-2">
                {streak > 0 && (
                  <span className="text-[11px] font-bold" style={{ color: S.orange }}>🔥 {streak}</span>
                )}
                <span className="text-[11px] font-bold" style={{ color: S.textMuted }}>
                  {weekStats.done}/{weekStats.goal}
                </span>
              </div>
            </div>

            {/* 7-day linear strip */}
            {(() => {
              const today = new Date();
              const todayDow = today.getDay();
              const mondayOffset = todayDow === 0 ? -6 : 1 - todayDow;
              const monday = new Date(today);
              monday.setDate(today.getDate() + mondayOffset);
              monday.setHours(0, 0, 0, 0);
              const todayStr = today.toISOString().split("T")[0];

              const labels = ["S", "T", "Q", "Q", "S", "S", "D"];
              const plannedDows = [1, 3, 5];

              return (
                <div className="flex items-center justify-between gap-1">
                  {labels.map((label, i) => {
                    const d = new Date(monday);
                    d.setDate(d.getDate() + i);
                    const dateStr = d.toISOString().split("T")[0];
                    const isDone = completedDates.has(dateStr);
                    const isToday = dateStr === todayStr;
                    const isFuture = dateStr > todayStr;
                    const isPlanned = isFuture && plannedDows.includes(d.getDay());
                    const isPastMissed = dateStr < todayStr && !isDone && plannedDows.includes(d.getDay());

                    return (
                      <div key={i} className="flex flex-col items-center gap-1 flex-1">
                        <span className="text-[9px] font-bold" style={{ color: S.textMuted }}>{label}</span>
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-bold"
                          style={{
                            backgroundColor: isDone
                              ? S.orange
                              : isToday
                                ? `${S.orange}18`
                                : isPlanned
                                  ? `${S.orange}0A`
                                  : "transparent",
                            color: isDone
                              ? "#fff"
                              : isToday
                                ? S.orange
                                : isPlanned
                                  ? S.orange
                                  : isPastMissed
                                    ? `${S.textMuted}60`
                                    : S.textMuted,
                            border: isToday
                              ? `2px solid ${S.orange}`
                              : isPlanned
                                ? `1px dashed ${S.orange}40`
                                : "1px solid transparent",
                            opacity: !isDone && !isToday && !isPlanned && dateStr < todayStr ? 0.4 : 1,
                          }}
                        >
                          {isDone ? "✓" : d.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Motivational line */}
            <p className="text-[11px] text-center mt-3" style={{ color: S.textMuted }}>
              {recentLogs.length > 0
                ? `${recentLogs[0].workoutTitle} · ${relativeDay(recentLogs[0].completedAt)} · ${recentLogs[0].durationMin} min ✓`
                : prevWeekStats
                  ? prevWeekStats.done >= 3
                    ? `Semana passada: ${prevWeekStats.done} treinos — bora superar! 🔥`
                    : `Bora começar a semana com tudo! 💪`
                  : "Nova semana, novas conquistas! 💪"
              }
            </p>
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
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(item.route)}
              className="relative text-left overflow-hidden transition-all"
              style={{
                borderRadius: "1.5rem",
                backgroundColor: S.card,
                border: `2px solid ${S.cardBorder}`,
                boxShadow: `0 2px 12px rgba(0,0,0,0.04)`,
              }}
            >
              <div
                className="w-full h-24 flex items-center justify-center overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${S.orange}08, ${S.amber}12)` }}
              >
                <img
                  src={item.illustration}
                  alt={item.title}
                  className="h-20 w-20 object-contain"
                />
              </div>
              <div className="p-3 pt-2.5">
                <p className="font-display text-sm mb-0.5" style={{ fontWeight: 700, color: S.text }}>
                  {item.title}
                </p>
                <p className="text-[11px] font-medium" style={{ color: S.textMuted }}>
                  {item.sub}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </section>


      {/* ═══ DESAFIOS ESPECIAIS — Carrossel ═══ */}
      <ChallengeCarousel
        S={S}
        challengeAccepted={challengeAccepted}
        acceptChallenge={acceptChallenge}
        navigate={navigate}
      />

      {/* ═══ PROJETOS — Carrossel ═══ */}
      <ProjectCarousel S={S} navigate={navigate} />

      <SolarBottomNav />

      {user && (
        <OnboardingDrawer
          open={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          userId={user.id}
        />
      )}
    </div>
  );
};

export default AppDashboard;
