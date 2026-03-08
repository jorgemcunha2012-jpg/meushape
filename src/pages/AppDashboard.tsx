import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dumbbell, Calendar, Trophy, Users, LogOut, ChevronRight, Flame, Settings, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

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

const AppDashboard = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [profileName, setProfileName] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/app/login");
      return;
    }
    if (user) {
      fetchData();
    }
  }, [user, loading]);

  const fetchData = async () => {
    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user!.id)
      .single();
    if (profile) setProfileName(profile.name);

    // Fetch programs
    const { data: progs } = await supabase
      .from("workout_programs")
      .select("*")
      .eq("is_active", true);
    if (progs) setPrograms(progs);

    // Fetch workouts for first program
    if (progs && progs.length > 0) {
      const { data: wks } = await supabase
        .from("workouts")
        .select("*")
        .eq("program_id", progs[0].id)
        .order("sort_order");
      if (wks) setWorkouts(wks);
    }

    // Fetch completed logs
    const today = new Date().toISOString().split("T")[0];
    const { data: todayLogs } = await supabase
      .from("workout_logs")
      .select("id")
      .eq("user_id", user!.id)
      .gte("completed_at", today);
    setCompletedToday(todayLogs?.length || 0);

    const { count } = await supabase
      .from("workout_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id);
    setTotalCompleted(count || 0);
  };

  const handleGenerateWorkout = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      // Get profile to check for quiz data
      const { data: profileData } = await supabase
        .from("profiles")
        .select("lead_id, profile_scores")
        .eq("id", user.id)
        .single();

      // Get quiz answers from lead if available
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

      // If no quiz data, use sensible defaults
      if (Object.keys(quizAnswers).length === 0) {
        quizAnswers = {
          t01: "t01c", // lose_and_tone
          t02: "t02b", // average
          t03: "t03b", // toned
          t04: "t04b", // stopped
          t09: "t09b", // 3 days
          t10: "t10c", // 45 min
          t11: "t11a", // gym
          t13: ["t13b", "t13a"], // legs + abs
          t14: ["t14a"], // no pain
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

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  const firstName = profileName?.split(" ")[0] || user?.email?.split("@")[0] || "linda";
  const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const today = dayNames[new Date().getDay()];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-8 pb-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{today}</p>
            <h1 className="font-display text-2xl font-bold text-foreground">
              Olá, {firstName}! 💪
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/app/manage")} className="text-muted-foreground hover:text-foreground p-2">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={signOut} className="text-muted-foreground hover:text-foreground p-2">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="px-4 pb-6">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <Flame className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{completedToday}</p>
            <p className="text-xs text-muted-foreground">Hoje</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{totalCompleted}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-lg font-bold text-foreground">{programs[0]?.days_per_week || 0}x</p>
            <p className="text-xs text-muted-foreground">Semana</p>
          </div>
        </div>
      </section>

      {/* Today's Workout */}
      <section className="px-4 pb-6">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-lg font-bold text-foreground mb-3">Seu Plano</h2>
          {workouts.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              {generating ? (
                <>
                  <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
                  <p className="text-foreground font-medium mb-1">Montando seu plano com IA...</p>
                  <p className="text-sm text-muted-foreground">
                    Selecionando exercícios personalizados pro seu perfil. Pode levar alguns segundos.
                  </p>
                </>
              ) : (
                <>
                  <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
                  <p className="text-foreground font-medium mb-1">Gerar seu plano de treino</p>
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
          ) : (
            <div className="space-y-3">
              {workouts.map((workout, i) => (
                <button
                  key={workout.id}
                  onClick={() => navigate(`/app/workout/${workout.id}`)}
                  className="w-full bg-card border border-border rounded-2xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-sm">
                      {String.fromCharCode(65 + i)}
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
          )}
        </div>
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around py-3">
          <button onClick={() => navigate("/app")} className="flex flex-col items-center gap-1 text-primary">
            <Dumbbell className="w-5 h-5" />
            <span className="text-xs font-medium">Treinos</span>
          </button>
          <button onClick={() => navigate("/app/history")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Histórico</span>
          </button>
          <button onClick={() => navigate("/app/community")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
            <Users className="w-5 h-5" />
            <span className="text-xs">Comunidade</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default AppDashboard;
