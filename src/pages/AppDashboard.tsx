import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { 
  Calendar, Trophy, Flame, TrendingUp, 
  Dumbbell, Clock, Play, Users, LogOut, Settings,
  Loader2, Sparkles, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import SubscriptionGate from "@/components/SubscriptionGate";

interface ProgressionCycle {
  id: string;
  current_week: number;
  cycle_number: number;
  phase: string;
  program_id: string;
  last_regenerated_at: string | null;
}

interface WorkoutProgram {
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
  program_id: string;
  sort_order: number;
}

interface WeekDay {
  day: string;
  name: string;
  duration: number;
  exercises: number;
  done: boolean;
  today?: boolean;
  rest?: boolean;
  workoutId?: string;
}

const AppDashboard = () => {
  const { user, signOut, loading, subscribed, subscriptionLoading } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [weekPlan, setWeekPlan] = useState<WeekDay[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [monthlyMinutes, setMonthlyMinutes] = useState(0);
  const [profileName, setProfileName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [progressing, setProgressing] = useState(false);
  const [cycle, setCycle] = useState<ProgressionCycle | null>(null);
  const [streak, setStreak] = useState(0);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/app/login");
      return;
    }
    if (!subscriptionLoading && !subscribed && user) {
      navigate("/app/subscription");
      return;
    }
    if (user && subscribed) {
      fetchData();
    }
  }, [user, loading, subscribed, subscriptionLoading, navigate]);

  const fetchData = async () => {
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user!.id)
      .single();
    if (profile) setProfileName(profile.name);

    const { data: progs } = await supabase
      .from("workout_programs")
      .select("*")
      .eq("is_active", true);
    if (progs) setPrograms(progs);

    if (progs && progs.length > 0) {
      const { data: wks } = await supabase
        .from("workouts")
        .select("*")
        .eq("program_id", progs[0].id)
        .order("sort_order");
      if (wks) {
        setWorkouts(wks);
        buildWeekPlan(wks, progs[0]);
      }

      const { data: cycleData } = await supabase
        .from("progression_cycles")
        .select("*")
        .eq("user_id", user!.id)
        .eq("program_id", progs[0].id)
        .single();
      if (cycleData) setCycle(cycleData as unknown as ProgressionCycle);
    }

    const today = new Date().toISOString().split("T")[0];
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [todayLogs, totalCount, monthLogs, streakData] = await Promise.all([
      supabase.from("workout_logs").select("id").eq("user_id", user!.id).gte("completed_at", today),
      supabase.from("workout_logs").select("id", { count: "exact", head: true }).eq("user_id", user!.id),
      supabase.from("workout_logs").select("duration_minutes").eq("user_id", user!.id).gte("completed_at", startOfMonth.toISOString()),
      supabase.from("user_streaks").select("current_streak").eq("user_id", user!.id).single()
    ]);

    setCompletedToday(todayLogs.data?.length || 0);
    setTotalCompleted(totalCount.count || 0);
    setMonthlyMinutes(monthLogs.data?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0);
    if (streakData.data) setStreak(streakData.data.current_streak);
  };

  const buildWeekPlan = (wks: Workout[], prog: WorkoutProgram) => {
    const daysOfWeek = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const todayIndex = new Date().getDay();
    const daysPerWeek = prog.days_per_week;
    
    // Distribute workouts across the week (skip Sunday by default)
    const trainingDays = daysPerWeek <= 3 ? [1, 3, 5] : 
                         daysPerWeek <= 4 ? [1, 2, 4, 5] : 
                         daysPerWeek <= 5 ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6];

    const plan: WeekDay[] = daysOfWeek.map((day, index) => {
      const isToday = index === todayIndex;
      const isTrainingDay = trainingDays.includes(index);
      const workoutIndex = trainingDays.indexOf(index);
      const workout = isTrainingDay && wks[workoutIndex % wks.length] ? wks[workoutIndex % wks.length] : null;
      const daysBehind = (todayIndex - index + 7) % 7;
      const isDone = daysBehind > 0 && daysBehind <= 3 && isTrainingDay;

      if (isToday && workout) {
        setTodayWorkout(workout);
      }

      return {
        day,
        name: workout?.title || "Descanso",
        duration: workout ? prog.duration_minutes : 0,
        exercises: 8,
        done: isDone,
        today: isToday,
        rest: !isTrainingDay,
        workoutId: workout?.id
      };
    });
    
    setWeekPlan(plan);
  };

  const handleGenerateWorkout = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("lead_id, profile_scores")
        .eq("id", user.id)
        .single();

      let quizAnswers: Record<string, any> = {};
      let scores = profileData?.profile_scores || {};

      if (profileData?.lead_id) {
        const { data: lead } = await supabase
          .from("leads")
          .select("quiz_answers, profile_scores")
          .eq("id", profileData.lead_id)
          .single();
        if (lead) {
          quizAnswers = (lead.quiz_answers as Record<string, any>) || {};
          scores = (lead.profile_scores as Record<string, any>) || scores;
        }
      }

      if (Object.keys(quizAnswers).length === 0) {
        quizAnswers = {
          t01: "t01c", t02: "t02b", t03: "t03b", t04: "t04b",
          t09: "t09b", t10: "t10c", t11: "t11a",
          t13: ["t13b", "t13a"], t14: ["t14a"],
        };
      }

      const { data, error } = await supabase.functions.invoke("generate-workout", {
        body: { quiz_answers: quizAnswers, user_id: user.id, scores },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Seu plano de treino foi gerado! 🎉");
      fetchData();
    } catch (err: any) {
      console.error("Generate error:", err);
      toast.error(err.message || "Erro ao gerar treino. Tente novamente.");
    } finally {
      setGenerating(false);
    }
  };

  const handleProgressWorkout = async () => {
    if (!user || !programs[0]) return;
    setProgressing(true);
    try {
      const { data, error } = await supabase.functions.invoke("progress-workout", {
        body: { user_id: user.id, program_id: programs[0].id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const phaseNames: Record<string, string> = {
        adaptation: "Adaptação", building: "Construção",
        intensify: "Intensificação", peak: "Pico", deload: "Deload",
      };
      toast.success(`Semana ${data.week} — ${phaseNames[data.phase] || data.phase} 🔄`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao progredir treino.");
    } finally {
      setProgressing(false);
    }
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!subscribed) {
    return <SubscriptionGate />;
  }

  const firstName = profileName?.split(" ")[0] || user?.email?.split("@")[0] || "linda";

  const muscleHeatMapData = [
    { color: "hsl(var(--success))", label: "Treinado hoje", muscles: "Peito, Glúteos" },
    { color: "hsl(var(--warning))", label: "Últimos 2-3 dias", muscles: "Pernas" },
    { color: "hsl(25 100% 50%)", label: "Em recuperação", muscles: "Abdome" },
    { color: "hsl(var(--muted))", label: "Não treinado", muscles: "Costas, Braços" },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-5 pt-10 pb-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Olá,</p>
            <h1 className="text-2xl font-bold">
              {firstName} 👋
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 rounded-full">
              <Flame className="w-4 h-4 fill-current" />
              <span className="font-bold text-sm">{streak}</span>
            </div>
            <button onClick={() => navigate("/app/manage")} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={signOut} className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Week Strip */}
      <section className="px-5 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-1.5">
            {weekPlan.map((day, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex-1 text-center py-2.5 rounded-xl transition-all cursor-pointer ${
                  day.today 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" 
                    : day.done 
                      ? "bg-success/10 border border-success/20" 
                      : "bg-card border border-border"
                }`}
                onClick={() => day.workoutId && navigate(`/app/workout-detail/${day.workoutId}`)}
              >
                <div className={`text-[10px] font-semibold mb-1 tracking-wide ${day.today ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  {day.day}
                </div>
                {day.rest ? (
                  <div className="text-sm">😴</div>
                ) : day.done ? (
                  <div className="text-sm text-success font-bold">✓</div>
                ) : day.today ? (
                  <div className="text-sm">🔥</div>
                ) : (
                  <div className="w-1.5 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mt-1" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Workout Card */}
      {todayWorkout ? (
        <motion.section 
          className="px-5 pb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="max-w-lg mx-auto">
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/25 overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
              <div className="relative">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-primary mb-2 uppercase tracking-widest">
                      Treino de Hoje
                    </div>
                    <h3 className="text-lg font-bold mb-1">{todayWorkout.title}</h3>
                    {todayWorkout.description && (
                      <p className="text-sm text-muted-foreground">{todayWorkout.description}</p>
                    )}
                  </div>
                  <span className="text-3xl">🏋️‍♀️</span>
                </div>
                <div className="flex gap-4 mb-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {programs[0]?.duration_minutes || 45} min</span>
                  <span className="flex items-center gap-1"><Dumbbell className="w-3.5 h-3.5" /> exercícios</span>
                  <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5" /> ~300 kcal</span>
                </div>
                <motion.button
                  onClick={() => navigate(`/app/workout/${todayWorkout.id}`)}
                  className="w-full bg-primary text-primary-foreground font-bold py-3.5 rounded-xl shadow-lg shadow-primary/30 transition-all"
                  whileTap={{ scale: 0.97 }}
                >
                  Começar Treino →
                </motion.button>
              </div>
            </div>
          </div>
        </motion.section>
      ) : workouts.length === 0 ? (
        <section className="px-5 pb-4">
          <div className="max-w-lg mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              {generating ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                  <p className="font-medium mb-1">Montando seu plano com IA...</p>
                  <p className="text-sm text-muted-foreground">Pode levar alguns segundos.</p>
                </>
              ) : (
                <>
                  <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                  <p className="font-medium mb-1">Gerar seu plano de treino</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nossa IA vai montar treinos personalizados baseados no seu perfil.
                  </p>
                  <Button onClick={handleGenerateWorkout} className="rounded-full">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Gerar meu plano com IA
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* Muscle Heat Map */}
      <motion.section 
        className="px-5 pb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold">Mapa Muscular</span>
              <span className="text-xs text-muted-foreground">Última semana</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-40 flex-shrink-0">
                <svg viewBox="0 0 100 160" className="w-full h-full">
                  <ellipse cx="50" cy="14" rx="11" ry="13" className="fill-muted" />
                  <rect x="46" y="26" width="8" height="6" rx="2" className="fill-muted" />
                  <ellipse cx="50" cy="42" rx="22" ry="14" className="fill-success" opacity="0.8" />
                  <ellipse cx="26" cy="52" rx="5" ry="16" className="fill-muted" opacity="0.8" />
                  <ellipse cx="74" cy="52" rx="5" ry="16" className="fill-muted" opacity="0.8" />
                  <ellipse cx="50" cy="62" rx="16" ry="10" fill="hsl(25 100% 50%)" opacity="0.6" />
                  <ellipse cx="50" cy="78" rx="20" ry="10" className="fill-success" opacity="0.8" />
                  <ellipse cx="40" cy="105" rx="9" ry="24" className="fill-warning" opacity="0.8" />
                  <ellipse cx="60" cy="105" rx="9" ry="24" className="fill-warning" opacity="0.8" />
                  <ellipse cx="40" cy="137" rx="6" ry="14" className="fill-muted" opacity="0.8" />
                  <ellipse cx="60" cy="137" rx="6" ry="14" className="fill-muted" opacity="0.8" />
                </svg>
              </div>
              <div className="flex-1 space-y-2">
                {muscleHeatMapData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <div className="text-xs font-medium">{item.label}</div>
                      <div className="text-[10px] text-muted-foreground">{item.muscles}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Stats Grid */}
      <motion.section 
        className="px-5 pb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold">Suas Estatísticas</span>
            <button onClick={() => navigate("/app/history")} className="text-xs text-primary font-medium">Ver tudo</button>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-lg mb-1">🏋️‍♀️</div>
              <div className="text-lg font-bold">{totalCompleted}</div>
              <div className="text-[10px] text-muted-foreground">Treinos total</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-lg mb-1">🔥</div>
              <div className="text-lg font-bold">{streak} dias</div>
              <div className="text-[10px] text-muted-foreground">Streak atual</div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-lg mb-1">⏱️</div>
              <div className="text-lg font-bold">{Math.round(monthlyMinutes / 60)}h</div>
              <div className="text-[10px] text-muted-foreground">Tempo total</div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Progression */}
      {workouts.length > 0 && programs[0] && (
        <motion.section 
          className="px-5 pb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="max-w-lg mx-auto">
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">Progressão</span>
                </div>
                {cycle && (
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    Semana {cycle.current_week} • Ciclo {cycle.cycle_number}
                  </span>
                )}
              </div>

              {cycle ? (
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                      <span>{{ adaptation: "🌱 Adaptação", building: "🏗️ Construção", intensify: "🔥 Intensificação", peak: "⚡ Pico", deload: "🧘 Deload" }[cycle.phase] || cycle.phase}</span>
                      <span>{((cycle.current_week % 8 || 8) / 8 * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(cycle.current_week % 8 || 8) / 8 * 100}%` }} />
                    </div>
                  </div>
                  <Button onClick={handleProgressWorkout} variant="outline" size="sm" disabled={progressing} className="w-full rounded-xl text-xs">
                    {progressing ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Gerando...</> : <><RefreshCw className="w-3 h-3 mr-1" /> Avançar semana</>}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Complete seu primeiro treino para ativar a progressão.</p>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-xl border-t border-border z-20">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2 pb-6">
          <button className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg">🏠</span>
            <span className="text-[10px] font-semibold text-primary">Home</span>
            <div className="w-1 h-1 rounded-full bg-primary" />
          </button>
          <button onClick={() => navigate("/app/workouts")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">🏋️‍♀️</span>
            <span className="text-[10px] text-muted-foreground">Treinos</span>
          </button>
          <button onClick={() => navigate("/app/community")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">👥</span>
            <span className="text-[10px] text-muted-foreground">Social</span>
          </button>
          <button onClick={() => navigate("/app/history")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">📊</span>
            <span className="text-[10px] text-muted-foreground">Progresso</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AppDashboard;