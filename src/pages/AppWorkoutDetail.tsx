import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Play, Timer, Dumbbell, ChevronRight, 
  Settings, Info, Flame
} from "lucide-react";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  sets: number;
  reps: string;
  rest_seconds: number;
  image_url: string | null;
  sort_order: number;
}

interface WorkoutInfo {
  id: string;
  title: string;
  description: string | null;
}

const AppWorkoutDetail = () => {
  const { workoutId } = useParams();
  const navigate = useNavigate();
  const { user, subscribed, subscriptionLoading } = useAuth();
  
  const [workout, setWorkout] = useState<WorkoutInfo | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subscriptionLoading && !subscribed && user) {
      navigate("/app/login");
      return;
    }
    if (workoutId) {
      fetchWorkout();
    }
  }, [workoutId, user, subscribed, subscriptionLoading, navigate]);

  const fetchWorkout = async () => {
    setLoading(true);
    
    // Fetch workout info
    const { data: workoutData } = await supabase
      .from("workouts")
      .select("id, title, description")
      .eq("id", workoutId!)
      .single();
    
    if (workoutData) {
      setWorkout(workoutData);
    }

    // Fetch exercises
    const { data: exerciseData } = await supabase
      .from("exercises")
      .select("*")
      .eq("workout_id", workoutId!)
      .order("sort_order");
    
    if (exerciseData) {
      setExercises(exerciseData);
    }

    setLoading(false);
  };

  const calculateEstimatedTime = () => {
    if (exercises.length === 0) return 0;
    
    // Estimate: 1.5 min per set + rest time
    return Math.round(
      exercises.reduce((acc, ex) => {
        const setTime = ex.sets * 1.5; // 1.5 min per set (including execution time)
        const restTime = (ex.sets - 1) * (ex.rest_seconds / 60); // Rest between sets
        return acc + setTime + restTime;
      }, 0) + 5 // Add 5 min for warmup/cooldown
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="px-4 pt-8 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/app/workouts")} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-xl font-bold text-foreground">
              {workout?.title || "Carregando..."}
            </h1>
          </div>
          
          {workout?.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {workout.description}
            </p>
          )}
        </div>
      </header>

      {/* Workout Stats */}
      <section className="px-4 pb-6">
        <div className="max-w-lg mx-auto">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">{exercises.length} exercícios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Timer className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">~{calculateEstimatedTime()} min</span>
                  </div>
                </div>
                
                <Button 
                  onClick={() => navigate(`/app/workout/${workoutId}`)}
                  className="rounded-full h-10 px-6"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Iniciar Treino
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Exercise List */}
      <section className="px-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-bold text-foreground">Exercícios</h2>
            <span className="text-sm text-muted-foreground">{exercises.length} total</span>
          </div>
          
          <div className="space-y-3">
            {exercises.map((exercise, index) => (
              <button
                key={exercise.id}
                onClick={() => navigate(`/app/exercise/${exercise.id}`)}
                className="w-full bg-card border border-border rounded-2xl p-4 hover:border-primary/30 transition-colors text-left group"
              >
                <div className="flex items-center gap-4">
                  {/* Exercise Number */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <span className="text-primary font-bold text-sm">{index + 1}</span>
                  </div>
                  
                  {/* Exercise Image */}
                  {exercise.image_url ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-secondary">
                      <img 
                        src={exercise.image_url} 
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <Flame className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}
                  
                  {/* Exercise Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm mb-1 truncate">
                      {exercise.name}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-medium">{exercise.sets} séries</span>
                      <span>•</span>
                      <span className="font-medium">{exercise.reps} reps</span>
                      <span>•</span>
                      <span>{exercise.rest_seconds}s descanso</span>
                    </div>
                    
                    {exercise.description && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {exercise.description}
                      </p>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/exercise/${exercise.id}`);
                      }}
                      className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
                    >
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AppWorkoutDetail;