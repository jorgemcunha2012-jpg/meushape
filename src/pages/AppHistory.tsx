import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Dumbbell, Users, Trophy } from "lucide-react";

interface WorkoutLog {
  id: string;
  completed_at: string;
  duration_minutes: number | null;
  workout_id: string;
  workouts: { title: string } | null;
}

const AppHistory = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/app/login");
      return;
    }
    if (user) fetchLogs();
  }, [user, loading]);

  const fetchLogs = async () => {
    const { data } = await supabase
      .from("workout_logs")
      .select("id, completed_at, duration_minutes, workout_id, workouts(title)")
      .eq("user_id", user!.id)
      .order("completed_at", { ascending: false })
      .limit(50);
    if (data) setLogs(data as any);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-4 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-2xl font-bold text-foreground">Histórico</h1>
          <p className="text-sm text-muted-foreground">Seus treinos completados</p>
        </div>
      </header>

      <section className="px-4">
        <div className="max-w-lg mx-auto">
          {logs.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium mb-1">Nenhum treino ainda</p>
              <p className="text-sm text-muted-foreground">
                Complete seu primeiro treino e ele aparecerá aqui!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Dumbbell className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">
                      {(log.workouts as any)?.title || "Treino"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(log.completed_at)} às {formatTime(log.completed_at)}
                    </p>
                  </div>
                  {log.duration_minutes && (
                    <span className="text-xs text-muted-foreground">{log.duration_minutes}min</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="max-w-lg mx-auto flex items-center justify-around py-3">
          <button onClick={() => navigate("/app")} className="flex flex-col items-center gap-1 text-muted-foreground hover:text-foreground">
            <Dumbbell className="w-5 h-5" />
            <span className="text-xs">Treinos</span>
          </button>
          <button onClick={() => navigate("/app/history")} className="flex flex-col items-center gap-1 text-primary">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-medium">Histórico</span>
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

export default AppHistory;
