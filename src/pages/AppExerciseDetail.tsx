import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
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
  
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("12");
  const [restSeconds, setRestSeconds] = useState(60);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!subscriptionLoading && !subscribed && user) {
      navigate("/app/login");
      return;
    }
    if (exerciseId) fetchExercise();
  }, [exerciseId, user, subscribed, subscriptionLoading, navigate]);

  const fetchExercise = async () => {
    setLoading(true);
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
      
      const { data: curatedData } = await supabase
        .from("curated_exercises")
        .select("name_pt, simple_instruction_pt, common_mistakes_pt, gif_url")
        .eq("name_pt", exerciseData.name)
        .single();
      
      if (curatedData) setCuratedExercise(curatedData);
    }
    setLoading(false);
  };

  const handleSaveChanges = async () => {
    if (!exercise || !user) return;
    const { error } = await supabase
      .from("exercises")
      .update({ sets, reps, rest_seconds: restSeconds })
      .eq("id", exercise.id);

    if (error) { toast.error("Erro ao salvar"); return; }
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

  useEffect(() => {
    if (!exercise) return;
    setHasChanges(
      sets !== exercise.sets || reps !== exercise.reps || restSeconds !== exercise.rest_seconds
    );
  }, [sets, reps, restSeconds, exercise]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* GIF/Image Section */}
      <div className="relative">
        <div className="aspect-square max-h-[360px] bg-card overflow-hidden">
          {(curatedExercise?.gif_url || exercise?.image_url) ? (
            <img 
              src={curatedExercise?.gif_url || exercise?.image_url || ""}
              alt={exercise?.name || "Exercício"}
              className="w-full h-full object-contain bg-card"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-card">
              <Flame className="w-20 h-20 text-muted-foreground/20" />
            </div>
          )}
        </div>
        
        {/* Back button overlay */}
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-10 left-5 w-9 h-9 rounded-full bg-background/80 backdrop-blur-sm border border-border flex items-center justify-center text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Exercise Name */}
      <div className="px-5 pt-5 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold mb-1">{exercise?.name}</h1>
          {exercise?.description && (
            <p className="text-sm text-muted-foreground">{exercise.description}</p>
          )}
        </div>
      </div>

      {/* Instructions */}
      {(curatedExercise?.simple_instruction_pt) && (
        <section className="px-5 pb-4">
          <div className="max-w-lg mx-auto">
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-sm mb-1.5">Instruções</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {curatedExercise.simple_instruction_pt}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Configuration */}
      <section className="px-5 pb-4">
        <div className="max-w-lg mx-auto">
          <h2 className="font-semibold text-sm mb-3">Configuração</h2>
          
          <div className="space-y-3">
            {/* Sets */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Séries</p>
                  <p className="text-xs text-muted-foreground">Número de séries</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setSets(Math.max(1, sets - 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-lg min-w-[2ch] text-center">{sets}</span>
                <button onClick={() => setSets(Math.min(10, sets + 1))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Reps */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <RotateCcw className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Repetições</p>
                  <p className="text-xs text-muted-foreground">Reps por série</p>
                </div>
              </div>
              <input
                type="text"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-20 h-10 bg-secondary border border-border rounded-lg px-3 text-center font-bold text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Rest */}
            <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-primary" />
                <div>
                  <p className="font-semibold text-sm">Descanso</p>
                  <p className="text-xs text-muted-foreground">Entre séries</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setRestSeconds(Math.max(15, restSeconds - 15))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-sm min-w-[4ch] text-center">{formatTime(restSeconds)}</span>
                <button onClick={() => setRestSeconds(Math.min(300, restSeconds + 15))} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Common Mistakes */}
      {curatedExercise?.common_mistakes_pt && (
        <section className="px-5 pb-4">
          <div className="max-w-lg mx-auto">
            <div className="bg-warning/5 border border-warning/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-warning text-xs font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-1.5">Erros Comuns</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {curatedExercise.common_mistakes_pt}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Save Actions */}
      {hasChanges && (
        <motion.section 
          className="px-5 pb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={handleResetValues}
              className="flex-1 h-12 rounded-xl border border-border bg-card flex items-center justify-center gap-2 font-semibold text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Resetar
            </button>
            <motion.button
              onClick={handleSaveChanges}
              className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center gap-2 font-semibold text-sm shadow-lg shadow-primary/25"
              whileTap={{ scale: 0.97 }}
            >
              <Save className="w-4 h-4" />
              Salvar
            </motion.button>
          </div>
        </motion.section>
      )}
    </div>
  );
};

export default AppExerciseDetail;