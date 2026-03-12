import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Minus, RotateCcw, Clock,
  Info, Flame, Save, Target, AlertTriangle
} from "lucide-react";
import { SolarPage, useSolar } from "@/components/SolarLayout";
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
  target: string;
  body_part: string;
}

const AppExerciseDetail = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const S = useSolar();
  const { user, subscriptionLoading } = useAuth();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [curatedExercise, setCuratedExercise] = useState<CuratedExercise | null>(null);
  const [loading, setLoading] = useState(true);

  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("12");
  const [restSeconds, setRestSeconds] = useState(60);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!subscriptionLoading && !user) {
      navigate("/app/login");
      return;
    }
    if (exerciseId) fetchExercise();
  }, [exerciseId, user, subscriptionLoading, navigate]);

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

      const baseName = exerciseData.name.replace(/\s*\(.*\)$/, "");
      let { data: curatedData } = await supabase
        .from("curated_exercises")
        .select("name_pt, simple_instruction_pt, common_mistakes_pt, gif_url, target, body_part")
        .eq("name_pt", exerciseData.name)
        .single();

      if (!curatedData && baseName !== exerciseData.name) {
        const { data: fallback } = await supabase
          .from("curated_exercises")
          .select("name_pt, simple_instruction_pt, common_mistakes_pt, gif_url, target, body_part")
          .eq("name_pt", baseName)
          .single();
        curatedData = fallback;
      }

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
    setExercise({ ...exercise, sets, reps, rest_seconds: restSeconds });
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

  const mediaUrl = curatedExercise?.gif_url || exercise?.image_url;

  return (
    <SolarPage>
      {/* GIF Hero */}
      <div className="relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-5 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center z-10"
          style={{ background: `${S.bg}cc`, border: `1px solid ${S.cardBorder}` }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: S.text }} />
        </button>

        <div className="flex items-center justify-center py-6" style={{ background: S.bg }}>
          <div className="w-[55%] aspect-square rounded-2xl overflow-hidden"
            style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
            {mediaUrl && (
              <img
                src={mediaUrl}
                alt={exercise?.name || "Exercício"}
                className="w-full h-full object-contain"
                style={{ background: S.card }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Stats bar below GIF */}
      <div className="px-5 -mt-1 mb-2">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-3">
          {curatedExercise?.target && (
            <span className="px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: `${S.orange}18`, color: S.orange }}>
              {curatedExercise.target}
            </span>
          )}
          <div className="px-4 py-2 rounded-2xl flex items-center gap-3"
            style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
            <div className="text-center">
              <p className="text-lg font-bold leading-none" style={{ color: S.orange }}>{sets}</p>
              <p className="text-[9px] mt-0.5" style={{ color: S.textMuted }}>séries</p>
            </div>
            <span className="text-sm font-bold" style={{ color: S.textMuted }}>×</span>
            <div className="text-center">
              <p className="text-lg font-bold leading-none" style={{ color: S.orange }}>{reps}</p>
              <p className="text-[9px] mt-0.5" style={{ color: S.textMuted }}>reps</p>
            </div>
            <div className="w-px h-6" style={{ background: S.cardBorder }} />
            <div className="text-center">
              <p className="text-sm font-bold leading-none" style={{ color: S.textMuted }}>
                <Clock className="w-3 h-3 inline mr-0.5 -mt-0.5" />{formatTime(restSeconds)}
              </p>
              <p className="text-[9px] mt-0.5" style={{ color: S.textMuted }}>descanso</p>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="px-5 pt-5 pb-2">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-xl" style={{ fontWeight: 800, color: S.text }}>
            {exercise?.name}
          </h1>
          {exercise?.description && (
            <p className="text-sm mt-1" style={{ color: S.textMuted }}>{exercise.description}</p>
          )}
        </div>
      </div>

      {/* Instructions */}
      {curatedExercise?.simple_instruction_pt && (
        <section className="px-5 pb-3">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${S.orange}15` }}>
                  <Info className="w-3.5 h-3.5" style={{ color: S.orange }} />
                </div>
                <div>
                  <h3 className="font-display text-sm mb-1.5" style={{ fontWeight: 700, color: S.text }}>Como executar</h3>
                  <p className="text-sm leading-relaxed" style={{ color: S.textMuted }}>
                    {curatedExercise.simple_instruction_pt}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Configuration */}
      <section className="px-5 pb-3">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-sm mb-3" style={{ fontWeight: 700, color: S.text }}>Ajustar</h2>

          <div className="space-y-2">
            {/* Sets */}
            <div className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${S.orange}12` }}>
                  <Target className="w-4 h-4" style={{ color: S.orange }} />
                </div>
                <p className="font-display text-sm" style={{ fontWeight: 600, color: S.text }}>Séries</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setSets(Math.max(1, sets - 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
                  <Minus className="w-3.5 h-3.5" style={{ color: S.textMuted }} />
                </button>
                <span className="font-bold text-lg min-w-[2ch] text-center" style={{ color: S.text }}>{sets}</span>
                <button onClick={() => setSets(Math.min(10, sets + 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
                  <Plus className="w-3.5 h-3.5" style={{ color: S.textMuted }} />
                </button>
              </div>
            </div>

            {/* Reps */}
            <div className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(22,163,74,0.1)" }}>
                  <RotateCcw className="w-4 h-4" style={{ color: "#16a34a" }} />
                </div>
                <p className="font-display text-sm" style={{ fontWeight: 600, color: S.text }}>Repetições</p>
              </div>
              <input
                type="text"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-20 h-10 rounded-xl px-3 text-center font-bold text-sm focus:outline-none focus:ring-2"
                style={{
                  background: S.card, border: `1px solid ${S.cardBorder}`,
                  color: S.text, "--tw-ring-color": S.orange,
                } as any}
              />
            </div>

            {/* Rest */}
            <div className="rounded-2xl p-4 flex items-center justify-between"
              style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(245,158,11,0.1)" }}>
                  <Clock className="w-4 h-4" style={{ color: "#F59E0B" }} />
                </div>
                <p className="font-display text-sm" style={{ fontWeight: 600, color: S.text }}>Descanso</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setRestSeconds(Math.max(15, restSeconds - 15))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
                  <Minus className="w-3.5 h-3.5" style={{ color: S.textMuted }} />
                </button>
                <span className="font-bold text-sm min-w-[4ch] text-center" style={{ color: S.text }}>
                  {formatTime(restSeconds)}
                </span>
                <button onClick={() => setRestSeconds(Math.min(300, restSeconds + 15))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
                  <Plus className="w-3.5 h-3.5" style={{ color: S.textMuted }} />
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
            <div className="rounded-2xl p-4"
              style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(245,158,11,0.15)" }}>
                  <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />
                </div>
                <div>
                  <h3 className="font-display text-sm mb-1.5" style={{ fontWeight: 700, color: S.text }}>Erros Comuns</h3>
                  <p className="text-sm leading-relaxed" style={{ color: S.textMuted }}>
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
        <motion.div
          className="fixed bottom-20 left-0 right-0 px-5 z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-lg mx-auto flex gap-3">
            <button
              onClick={handleResetValues}
              className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-display text-sm"
              style={{ fontWeight: 600, background: S.card, border: `1px solid ${S.cardBorder}`, color: S.textMuted }}
            >
              <RotateCcw className="w-4 h-4" />
              Resetar
            </button>
            <motion.button
              onClick={handleSaveChanges}
              className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-display text-sm"
              style={{
                fontWeight: 700, color: "#fff",
                background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`,
                boxShadow: `0 4px 16px ${S.glowStrong}`,
              }}
              whileTap={{ scale: 0.97 }}
            >
              <Save className="w-4 h-4" />
              Salvar
            </motion.button>
          </div>
        </motion.div>
      )}
    </SolarPage>
  );
};

export default AppExerciseDetail;
