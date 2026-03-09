import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft, Plus, Minus, RotateCcw, Clock, 
  Info, Flame, Save, Target
} from "lucide-react";
import { toast } from "sonner";

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  sets: number;
  reps: string;
  rest_seconds: number;
  image_url: string | null;
  workout_id: string;
}

interface CuratedExercise {
  name_pt: string;
  simple_instruction_pt: string | null;
  common_mistakes_pt: string | null;
  gif_url: string | null;
}

const AppExerciseDetail = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { user, subscribed, subscriptionLoading } = useAuth();
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [curatedExercise, setCuratedExercise] = useState<CuratedExercise | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Editable values
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("12");
  const [restSeconds, setRestSeconds] = useState(60);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!subscriptionLoading && !subscribed && user) {
      navigate("/app/login");
      return;
    }
    if (exerciseId) {
      fetchExercise();
    }
  }, [exerciseId, user, subscribed, subscriptionLoading, navigate]);

  const fetchExercise = async () => {
    setLoading(true);
    
    // Fetch exercise data
    const { data: exerciseData } = await supabase
      .from("exercises")
      .select("*")
      .eq("id", exerciseId!)
      .single();
    
    if (exerciseData) {
      setExercise(exerciseData);
      setSets(exerciseData.sets);
      setReps(exerciseData.reps);
      setRestSeconds(exerciseData.rest_seconds);
      
      // Try to find curated exercise with matching name
      const { data: curatedData } = await supabase
        .from("curated_exercises")
        .select("name_pt, simple_instruction_pt, common_mistakes_pt, gif_url")
        .eq("name_pt", exerciseData.name)
        .single();
      
      if (curatedData) {
        setCuratedExercise(curatedData);
      }
    }

    setLoading(false);
  };

  const handleSaveChanges = async () => {
    if (!exercise || !user) return;

    const { error } = await supabase
      .from("exercises")
      .update({
        sets,
        reps,
        rest_seconds: restSeconds
      })
      .eq("id", exercise.id);

    if (error) {
      toast.error("Erro ao salvar alterações");
      return;
    }

    toast.success("Alterações salvas!");
    setHasChanges(false);
  };

  const handleResetValues = () => {
    if (!exercise) return;
    
    setSets(exercise.sets);
    setReps(exercise.reps);
    setRestSeconds(exercise.rest_seconds);
    setHasChanges(false);
  };

  // Track changes
  useEffect(() => {
    if (!exercise) return;
    
    const changed = 
      sets !== exercise.sets ||
      reps !== exercise.reps ||
      restSeconds !== exercise.rest_seconds;
    
    setHasChanges(changed);
  }, [sets, reps, restSeconds, exercise]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
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
      <header className="px-4 pt-8 pb-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display text-lg font-bold text-foreground">
              {exercise?.name || "Carregando..."}
            </h1>
          </div>
        </div>
      </header>

      {/* Exercise GIF/Image */}
      <section className="px-4 pb-6">
        <div className="max-w-lg mx-auto">
          <div className="aspect-square max-h-[320px] rounded-2xl overflow-hidden bg-secondary mb-4">
            {(curatedExercise?.gif_url || exercise?.image_url) ? (
              <img 
                src={curatedExercise?.gif_url || exercise?.image_url || ""}
                alt={exercise?.name || "Exercício"}
                className="w-full h-full object-contain"
                style={{ imageRendering: 'auto' }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Flame className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Exercise Description */}
      {(exercise?.description || curatedExercise?.simple_instruction_pt) && (
        <section className="px-4 pb-6">
          <div className="max-w-lg mx-auto">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground text-sm mb-2">Instruções</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {curatedExercise?.simple_instruction_pt || exercise?.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Exercise Parameters */}
      <section className="px-4 pb-6">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Configuração</h2>
          
          <div className="space-y-4">
            {/* Sets */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Séries</p>
                      <p className="text-xs text-muted-foreground">Número de séries</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSets(Math.max(1, sets - 1))}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-foreground" />
                    </button>
                    
                    <span className="font-bold text-foreground text-lg min-w-[2ch] text-center">
                      {sets}
                    </span>
                    
                    <button
                      onClick={() => setSets(Math.min(10, sets + 1))}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reps */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Repetições</p>
                      <p className="text-xs text-muted-foreground">Reps por série</p>
                    </div>
                  </div>
                  
                  <input
                    type="text"
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="w-20 h-10 bg-secondary border border-border rounded-lg px-3 text-center font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="12"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Rest Time */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground text-sm">Descanso</p>
                      <p className="text-xs text-muted-foreground">Entre séries</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setRestSeconds(Math.max(15, restSeconds - 15))}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <Minus className="w-4 h-4 text-foreground" />
                    </button>
                    
                    <span className="font-bold text-foreground text-sm min-w-[4ch] text-center">
                      {formatTime(restSeconds)}
                    </span>
                    
                    <button
                      onClick={() => setRestSeconds(Math.min(300, restSeconds + 15))}
                      className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                    >
                      <Plus className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      {curatedExercise?.common_mistakes_pt && (
        <section className="px-4 pb-6">
          <div className="max-w-lg mx-auto">
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-orange-600 text-xs font-bold">!</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900 text-sm mb-2">Erros Comuns</h3>
                    <p className="text-sm text-orange-700 leading-relaxed">
                      {curatedExercise.common_mistakes_pt}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Action Buttons */}
      {hasChanges && (
        <section className="px-4 pb-6">
          <div className="max-w-lg mx-auto">
            <div className="flex gap-3">
              <Button
                onClick={handleResetValues}
                variant="outline"
                className="flex-1 rounded-xl h-12"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Resetar
              </Button>
              
              <Button
                onClick={handleSaveChanges}
                className="flex-1 rounded-xl h-12"
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default AppExerciseDetail;