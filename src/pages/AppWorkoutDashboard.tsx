import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, Calendar, Dumbbell, Clock, ChevronRight, 
  Trophy, Flame, TrendingUp, Play
} from "lucide-react";

interface WorkoutProgram {
  id: string;
  title: string;
  description: string | null;
  level: string;
  days_per_week: number;
}

interface Workout {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface ProgressionCycle {
  id: string;
  current_week: number;
  cycle_number: number;
  phase: string;
  program_id: string;
}

interface LastWorkout {
  id: string;
  title: string;
  completed_at: string;
  duration_minutes: number | null;
}

const AppWorkoutDashboard = () => {
  const { user, subscribed, subscriptionLoading } = useAuth();
  const navigate = useNavigate();
  
  const [program, setProgram] = useState<WorkoutProgram | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [cycle, setCycle] = useState<ProgressionCycle | null>(null);
  const [lastWorkout, setLastWorkout] = useState<LastWorkout | null>(null);
  const [todayWorkout, setTodayWorkout] = useState<Workout | null>(null);
  const [completedToday, setCompletedToday] = useState(false);
  const [streak, setStreak] = useState(0);
  
  useEffect(() => {
    if (!subscriptionLoading && !subscribed && user) {
      navigate("/app/login");
      return;
    }
    if (user && subscribed) {
      fetchData();
    }
  }, [user, subscribed, subscriptionLoading, navigate]);

  const fetchData = async () => {
    if (!user) return;

    // Get active program
    const { data: programs } = await supabase
      .from("workout_programs")
      .select("*")
      .eq("is_active", true)
      .limit(1);

    if (!programs || programs.length === 0) {
      navigate("/app");
      return;
    }

    const activeProgram = programs[0];
    setProgram(activeProgram);

    // Get workouts for this program
    const { data: workoutData } = await supabase
      .from("workouts")
      .select("*")
      .eq("program_id", activeProgram.id)
      .order("sort_order");
    
    if (workoutData) setWorkouts(workoutData);

    // Get progression cycle
    const { data: cycleData } = await supabase
      .from("progression_cycles")
      .select("*")
      .eq("user_id", user.id)
      .eq("program_id", activeProgram.id)
      .single();
    
    if (cycleData) setCycle(cycleData as unknown as ProgressionCycle);

    // Get last workout
    const { data: lastWorkoutData } = await supabase
      .from("workout_logs")
      .select(`
        id,
        completed_at,
        duration_minutes,
        workouts!workout_logs_workout_id_fkey(
          id,
          title
        )
      `)
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(1);

    if (lastWorkoutData && lastWorkoutData.length > 0) {
      const log = lastWorkoutData[0];
      setLastWorkout({
        id: log.id,
        title: (log.workouts as any)?.title || "Treino",
        completed_at: log.completed_at,
        duration_minutes: log.duration_minutes
      });
    }

    // Check if completed workout today
    const today = new Date().toISOString().split("T")[0];
    const { data: todayLogs } = await supabase
      .from("workout_logs")
      .select("id")
      .eq("user_id", user.id)
      .gte("completed_at", today);
    
    setCompletedToday((todayLogs?.length || 0) > 0);

    // Get current streak
    const { data: streakData } = await supabase
      .from("user_streaks")
      .select("current_streak")
      .eq("user_id", user.id)
      .single();
    
    if (streakData) setStreak(streakData.current_streak);

    // Determine today's workout (simple rotation based on day of week)
    if (workoutData && workoutData.length > 0) {
      const dayOfWeek = new Date().getDay(); // 0 = Sunday
      const workoutIndex = dayOfWeek % workoutData.length;
      setTodayWorkout(workoutData[workoutIndex]);
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };

  const formatLastWorkoutDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Hoje";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Ontem";
    } else {
      return new Intl.DateTimeFormat('pt-BR', {
        day: 'numeric',
        month: 'short'
      }).format(date);
    }
  };

  const today = new Date();
  const phaseNames: Record<string, string> = {
    adaptation: "🌱 Adaptação",
    building: "🏗️ Construção", 
    intensify: "🔥 Intensificação",
    peak: "⚡ Pico",
    deload: "🧘 Deload"
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/app")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-xl font-bold text-foreground">Treinos</h1>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{formatDate(today)}</span>
          </div>
        </div>
      </header>

      {/* Today's Workout */}
      <section className="px-4 pb-6">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-lg font-bold text-foreground mb-3">Treino de Hoje</h2>
          
          {todayWorkout ? (
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-foreground">
                      {todayWorkout.title}
                    </CardTitle>
                    {todayWorkout.description && (
                      <CardDescription className="text-sm mt-1">
                        {todayWorkout.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full">
                    <Flame className="w-3 h-3 fill-current" />
                    <span className="text-xs font-bold">{streak}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Dumbbell className="w-3 h-3" />
                      {program?.level || "Nível"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      ~45 min
                    </span>
                  </div>
                  
                  {completedToday ? (
                    <div className="flex items-center gap-1 text-primary text-xs font-medium">
                      <Trophy className="w-3 h-3" />
                      Concluído
                    </div>
                  ) : (
                    <Button 
                      onClick={() => navigate(`/app/workout/${todayWorkout.id}`)}
                      size="sm"
                      className="rounded-full h-8 px-4"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Iniciar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Nenhum treino programado para hoje</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Last Workout Info */}
      {lastWorkout && (
        <section className="px-4 pb-6">
          <div className="max-w-lg mx-auto">
            <h3 className="font-display text-sm font-bold text-foreground mb-3">Último Treino</h3>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{lastWorkout.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatLastWorkoutDate(lastWorkout.completed_at)}
                      {lastWorkout.duration_minutes && ` • ${lastWorkout.duration_minutes} min`}
                    </p>
                  </div>
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Progression */}
      {cycle && (
        <section className="px-4 pb-6">
          <div className="max-w-lg mx-auto">
            <h3 className="font-display text-sm font-bold text-foreground mb-3">Progressão</h3>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      {phaseNames[cycle.phase] || cycle.phase}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                    Semana {cycle.current_week} • Ciclo {cycle.cycle_number}
                  </span>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progresso da fase</span>
                  <span>{((cycle.current_week % 8 || 8) / 8 * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${(cycle.current_week % 8 || 8) / 8 * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* All Workouts */}
      <section className="px-4 pb-6">
        <div className="max-w-lg mx-auto">
          <h3 className="font-display text-sm font-bold text-foreground mb-3">Todos os Treinos</h3>
          
          <div className="space-y-2">
            {workouts.map((workout, index) => (
              <button
                key={workout.id}
                onClick={() => navigate(`/app/workout-detail/${workout.id}`)}
                className="w-full bg-card border border-border rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-primary font-bold text-sm">
                    {String.fromCharCode(65 + index)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{workout.title}</p>
                  {workout.description && (
                    <p className="text-xs text-muted-foreground truncate">{workout.description}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AppWorkoutDashboard;