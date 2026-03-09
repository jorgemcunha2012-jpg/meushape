import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

interface WeekDay {
  day: string;
  name: string;
  duration: number;
  exercises: number;
  done: boolean;
  rest?: boolean;
  today?: boolean;
  workoutId?: string;
}

type MuscleStatus = "today" | "recent" | "recovering" | "none";

interface MuscleData {
  [key: string]: MuscleStatus;
}

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
    if (keywords.some(kw => text.includes(kw))) {
      matched.push(group);
    }
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
    case "today": return "hsl(var(--success))";
    case "recent": return "hsl(var(--warning))";
    case "recovering": return "hsl(var(--orange))";
    default: return "hsl(var(--muted))";
  }
}

const AppDashboard = () => {
  const { user, subscribed, subscriptionLoading } = useAuth();
  const navigate = useNavigate();
  
  const [weekPlan, setWeekPlan] = useState<WeekDay[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string>("");
  const [muscleMap, setMuscleMap] = useState<MuscleData>({
    chest: "none", shoulders: "none", arms: "none", back: "none",
    abs: "none", glutes: "none", legs: "none", calves: "none",
  });

  useEffect(() => {
    if (!subscriptionLoading && !user) {
      navigate("/app/login");
      return;
    }
    if (user && subscribed) {
      fetchData();
      fetchMuscleMap();
    }
  }, [user, subscribed, subscriptionLoading, navigate]);

  const fetchMuscleMap = async () => {
    if (!user) return;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 1. Get workout logs from last 7 days
    const { data: logs } = await supabase
      .from("workout_logs")
      .select("workout_id, completed_at")
      .eq("user_id", user.id)
      .gte("completed_at", sevenDaysAgo.toISOString())
      .order("completed_at", { ascending: false });

    if (!logs || logs.length === 0) return;

    // 2. Get exercises for those workouts
    const workoutIds = [...new Set(logs.map(l => l.workout_id))];
    const { data: exercises } = await supabase
      .from("exercises")
      .select("name, workout_id")
      .in("workout_id", workoutIds);

    if (!exercises || exercises.length === 0) return;

    // 3. Get curated data for muscle mapping
    const exerciseNames = [...new Set(exercises.map(e => e.name))];
    const { data: curated } = await supabase
      .from("curated_exercises")
      .select("name_pt, target, body_part")
      .in("name_pt", exerciseNames);

    const curatedLookup: Record<string, { target: string; body_part: string }> = {};
    curated?.forEach(c => { curatedLookup[c.name_pt] = c; });

    // 4. Build workout_id -> latest completed_at map
    const workoutDateMap: Record<string, Date> = {};
    logs.forEach(l => {
      const d = new Date(l.completed_at);
      if (!workoutDateMap[l.workout_id] || d > workoutDateMap[l.workout_id]) {
        workoutDateMap[l.workout_id] = d;
      }
    });

    // 5. Map muscles to days since last trained
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
        if (muscleDays[g] === undefined || daysDiff < muscleDays[g]) {
          muscleDays[g] = daysDiff;
        }
      });
    });

    // 6. Convert to statuses
    const newMap: MuscleData = {
      chest: "none", shoulders: "none", arms: "none", back: "none",
      abs: "none", glutes: "none", legs: "none", calves: "none",
    };
    for (const [muscle, days] of Object.entries(muscleDays)) {
      if (muscle in newMap) {
        newMap[muscle] = getMuscleStatus(days);
      }
    }
    setMuscleMap(newMap);
  };

  const fetchData = async () => {
    const { data: program } = await supabase
      .from("workout_programs")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!program) return;

    const { data: workouts } = await supabase
      .from("workouts")
      .select("*")
      .eq("program_id", program.id)
      .order("sort_order");

    if (workouts) {
      const plan = generateWeekPlan(workouts);
      setWeekPlan(plan);
      
      const today = plan.find(d => d.today);
      if (today && today.workoutId) {
        const { data: exercises } = await supabase
          .from("exercises")
          .select("*")
          .eq("workout_id", today.workoutId);
        
        setTodayWorkout({
          ...today,
          exercises: exercises?.length || 0
        });
      }
    }

    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (streakData) {
      setStreak(streakData.current_streak);
      setLastWorkoutDate(streakData.last_workout_date || "");
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
        day,
        name: workout ? workout.title : "Descanso",
        duration: workout ? 45 : 0,
        exercises: workout ? 8 : 0,
        done: index < adjustedToday,
        rest: !workout,
        today: index === adjustedToday,
        workoutId: workout?.id
      };
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24" style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Status Bar Simulation */}
      <div className="flex justify-between items-center px-7 pt-3 pb-0">
        <span className="text-white text-sm font-semibold">9:41</span>
        <div className="flex items-center gap-1 text-white text-xs">
          <span>●●●●</span>
          <span>📶</span>
          <span>🔋</span>
        </div>
      </div>

      {/* Header */}
      <header className="px-5 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-2">Meu Shape</h1>
          <p className="text-sm text-muted-foreground">
            {streak > 0 ? `🔥 ${streak} dias consecutivos` : "Vamos começar sua jornada!"}
          </p>
        </div>
      </header>

      {/* Week Strip */}
      <section className="px-5 mb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-1">
            {weekPlan.map((d, i) => (
              <div 
                key={i} 
                className={`flex-1 text-center py-3 px-1 rounded-3xl transition-all ${
                  d.today 
                    ? "bg-primary text-primary-foreground shadow-lg" 
                    : d.done 
                    ? "bg-success/10 border border-success/20" 
                    : "bg-card border border-border"
                }`}
                style={{
                  boxShadow: d.today ? '0 4px 20px hsla(var(--accent-glow))' : 'none'
                }}
              >
                <div className={`text-[10px] font-semibold mb-1 uppercase tracking-wider ${d.today ? "text-white" : "text-muted-foreground"}`}>
                  {d.day}
                </div>
                {d.rest ? (
                  <div className="text-sm">😴</div>
                ) : d.done ? (
                  <div className="text-sm text-success">✓</div>
                ) : d.today ? (
                  <div className="text-sm">🔥</div>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground mx-auto" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Today's Workout */}
      {todayWorkout && (
        <section className="px-5 mb-4">
          <div className="max-w-lg mx-auto">
            <div 
              className="relative p-5 rounded-2xl border overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, hsla(var(--primary)) / 0.13, hsla(var(--primary)) / 0.03)',
                borderColor: 'hsla(var(--primary)) / 0.27',
                boxShadow: '0 4px 20px hsla(var(--accent-glow))'
              }}
            >
              <div 
                className="absolute -top-5 -right-5 w-24 h-24 rounded-full"
                style={{
                  background: 'hsla(var(--accent-glow))',
                  filter: 'blur(40px)'
                }}
              />
              
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="flex-1">
                  <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-1.5">
                    Treino de Hoje
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-1 tracking-tight">{todayWorkout.name}</h3>
                  <p className="text-sm text-muted-foreground">{todayWorkout.name.includes("Cardio") ? "Caminhada com inclinação progressiva" : "Foco em força e definição"}</p>
                </div>
                <span className="text-4xl">
                  {todayWorkout.name.includes("Cardio") ? "🏃‍♀️" : "🏋️‍♀️"}
                </span>
              </div>
              
              <div className="flex gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-1">
                  <span className="text-xs">⏱️</span>
                  <span className="text-xs text-muted-foreground">{todayWorkout.duration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs">🔥</span>
                  <span className="text-xs text-muted-foreground">{todayWorkout.name.includes("Cardio") ? "280" : "320"} kcal</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs">📊</span>
                  <span className="text-xs text-muted-foreground">{todayWorkout.name.includes("Cardio") ? "5 fases" : `${todayWorkout.exercises} exercícios`}</span>
                </div>
              </div>
              
              <button 
                onClick={() => todayWorkout.workoutId ? navigate(`/app/workout-detail/${todayWorkout.workoutId}`) : navigate("/app/workouts")}
                className="w-full py-3.5 px-6 bg-primary text-primary-foreground rounded-2xl font-bold text-base transition-all relative z-10"
                style={{
                  boxShadow: '0 4px 20px hsla(var(--accent-glow))',
                  letterSpacing: '0.3px'
                }}
              >
                Começar Treino →
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Muscle Heat Map - Dynamic */}
      <section className="px-5 mb-4">
        <div className="max-w-lg mx-auto">
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-foreground font-sans">Mapa Muscular</h3>
              <span className="text-xs text-muted-foreground">Últimos 7 dias</span>
            </div>
            <div className="flex items-center gap-4">
              {/* SVG Silhouette */}
              <div className="relative w-20 h-32 flex-shrink-0">
                <svg viewBox="0 0 100 160" className="w-full h-full">
                  <ellipse cx="50" cy="14" rx="11" ry="13" fill="hsl(var(--muted))" />
                  <rect x="46" y="26" width="8" height="6" rx="2" fill="hsl(var(--muted))" />
                  <ellipse cx="50" cy="42" rx="22" ry="14" fill={muscleStatusColor(muscleMap.chest)} opacity="0.85" />
                  <ellipse cx="26" cy="48" rx="5" ry="16" fill={muscleStatusColor(muscleMap.arms)} opacity="0.85" transform="rotate(-8, 26, 48)" />
                  <ellipse cx="74" cy="48" rx="5" ry="16" fill={muscleStatusColor(muscleMap.arms)} opacity="0.85" transform="rotate(8, 74, 48)" />
                  <ellipse cx="38" cy="34" rx="8" ry="6" fill={muscleStatusColor(muscleMap.shoulders)} opacity="0.85" />
                  <ellipse cx="62" cy="34" rx="8" ry="6" fill={muscleStatusColor(muscleMap.shoulders)} opacity="0.85" />
                  <ellipse cx="50" cy="62" rx="16" ry="10" fill={muscleStatusColor(muscleMap.abs)} opacity="0.85" />
                  <ellipse cx="50" cy="78" rx="20" ry="10" fill={muscleStatusColor(muscleMap.glutes)} opacity="0.85" />
                  <ellipse cx="40" cy="105" rx="9" ry="24" fill={muscleStatusColor(muscleMap.legs)} opacity="0.85" />
                  <ellipse cx="60" cy="105" rx="9" ry="24" fill={muscleStatusColor(muscleMap.legs)} opacity="0.85" />
                  <ellipse cx="40" cy="137" rx="6" ry="14" fill={muscleStatusColor(muscleMap.calves)} opacity="0.85" />
                  <ellipse cx="60" cy="137" rx="6" ry="14" fill={muscleStatusColor(muscleMap.calves)} opacity="0.85" />
                </svg>
              </div>
              {/* Legend */}
              <div className="flex-1 space-y-2">
                {(() => {
                  const statusGroups: Record<MuscleStatus, string[]> = { today: [], recent: [], recovering: [], none: [] };
                  const muscleLabels: Record<string, string> = {
                    chest: "Peito", shoulders: "Ombros", arms: "Braços",
                    back: "Costas", abs: "Abdome", glutes: "Glúteos",
                    legs: "Pernas", calves: "Panturrilha",
                  };
                  Object.entries(muscleMap).forEach(([m, s]) => statusGroups[s].push(muscleLabels[m] || m));

                  return [
                    { status: "today" as MuscleStatus, label: "Treinado hoje", color: "hsl(var(--success))" },
                    { status: "recent" as MuscleStatus, label: "Últimos 2 dias", color: "hsl(var(--warning))" },
                    { status: "recovering" as MuscleStatus, label: "Em recuperação", color: "hsl(var(--orange))" },
                    { status: "none" as MuscleStatus, label: "Não treinado", color: "hsl(var(--muted))" },
                  ]
                    .filter(item => statusGroups[item.status].length > 0)
                    .map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                        <div>
                          <div className="text-xs font-medium text-foreground">{item.label}</div>
                          <div className="text-xs text-muted-foreground">{statusGroups[item.status].join(", ")}</div>
                        </div>
                      </div>
                    ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="px-5 mb-8">
        <div className="max-w-lg mx-auto grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/app/workouts")}
            className="p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🏋️‍♀️</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Meus Treinos</p>
            <p className="text-xs text-muted-foreground">Planos personalizados</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/app/history")}
            className="p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">📊</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Progresso</p>
            <p className="text-xs text-muted-foreground">Histórico e evolução</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/app/community")}
            className="p-4 rounded-2xl bg-card border border-border text-left hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">👥</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">Comunidade</p>
            <p className="text-xs text-muted-foreground">Compartilhe conquistas</p>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            className="p-4 rounded-2xl bg-card border border-border text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🏆</span>
              <span className="text-xs font-semibold bg-primary/20 text-primary px-2 py-1 rounded-md">
                {streak}
              </span>
            </div>
            <p className="text-sm font-semibold text-foreground">Conquistas</p>
            <p className="text-xs text-muted-foreground">Sequência atual</p>
          </motion.button>
        </div>
      </section>

      {/* Bottom Navigation - Meu Shape Style */}
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
          <button onClick={() => navigate("/app/profile")} className="flex flex-col items-center gap-1 py-1 px-3">
            <span className="text-lg opacity-50 grayscale">👤</span>
            <span className="text-[10px] text-muted-foreground">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AppDashboard;
