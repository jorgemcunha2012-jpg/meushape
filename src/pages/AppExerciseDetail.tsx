import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Minus, RotateCcw, Clock,
  Info, Save, AlertTriangle, Weight
} from "lucide-react";
import { SolarPage, useSolar } from "@/components/SolarLayout";
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useMuscleWikiMedia } from "@/hooks/useMuscleWikiMedia";

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
  target: string;
  body_part: string;
}

interface WeightLog {
  weight_kg: number;
  created_at: string;
}

const stripParentheses = (name: string) => name.replace(/\s*\(.*\)$/, "");

const AppExerciseDetail = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const S = useSolar();
  const { user, subscriptionLoading } = useAuth();

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [curatedExercise, setCuratedExercise] = useState<CuratedExercise | null>(null);
  const [loading, setLoading] = useState(true);

  const exerciseNames = useMemo(() => exercise ? [exercise.name] : [], [exercise]);
  const { media: mwMedia, loading: mediaLoading } = useMuscleWikiMedia(exerciseNames);

  const [reps, setReps] = useState("12");
  const [restSeconds, setRestSeconds] = useState(60);
  const [hasChanges, setHasChanges] = useState(false);

  // Weight tracking
  const [currentWeight, setCurrentWeight] = useState<string>("");
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [weightSaved, setWeightSaved] = useState(true);

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
      setReps(exerciseData.reps);
      setRestSeconds(exerciseData.rest_seconds);

      const baseName = stripParentheses(exerciseData.name);
      let { data: curatedData } = await supabase
        .from("curated_exercises")
        .select("name_pt, simple_instruction_pt, common_mistakes_pt, target, body_part")
        .eq("name_pt", exerciseData.name)
        .single();

      if (!curatedData && baseName !== exerciseData.name) {
        const { data: fallback } = await supabase
          .from("curated_exercises")
          .select("name_pt, simple_instruction_pt, common_mistakes_pt, target, body_part")
          .eq("name_pt", baseName)
          .single();
        curatedData = fallback;
      }

      if (curatedData) setCuratedExercise(curatedData);

      // Fetch weight logs
      if (user) {
        const exerciseName = baseName;
        const { data: logs } = await supabase
          .from("exercise_weight_logs")
          .select("weight_kg, created_at")
          .eq("user_id", user.id)
          .eq("exercise_name", exerciseName)
          .order("created_at", { ascending: true });

        if (logs && logs.length > 0) {
          setWeightLogs(logs);
          setCurrentWeight(String(logs[logs.length - 1].weight_kg));
          setWeightSaved(true);
        }
      }
    }
    setLoading(false);
  };

  const handleSaveChanges = async () => {
    if (!exercise || !user) return;
    const { error } = await supabase
      .from("exercises")
      .update({ reps, rest_seconds: restSeconds })
      .eq("id", exercise.id);

    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Alterações salvas!");
    setHasChanges(false);
    setExercise({ ...exercise, reps, rest_seconds: restSeconds });
  };

  const handleResetValues = () => {
    if (!exercise) return;
    setReps(exercise.reps);
    setRestSeconds(exercise.rest_seconds);
    setHasChanges(false);
  };

  const handleSaveWeight = async () => {
    if (!exercise || !user || !currentWeight) return;
    const weightNum = parseFloat(currentWeight);
    if (isNaN(weightNum) || weightNum <= 0) {
      toast.error("Insira um peso válido");
      return;
    }

    const exerciseName = stripParentheses(exercise.name);
    const { error } = await supabase
      .from("exercise_weight_logs")
      .insert({ user_id: user.id, exercise_name: exerciseName, weight_kg: weightNum });

    if (error) { toast.error("Erro ao salvar peso"); return; }
    toast.success("Peso registrado!");
    setWeightSaved(true);

    // Refresh logs
    const { data: logs } = await supabase
      .from("exercise_weight_logs")
      .select("weight_kg, created_at")
      .eq("user_id", user.id)
      .eq("exercise_name", exerciseName)
      .order("created_at", { ascending: true });
    if (logs) setWeightLogs(logs);
  };

  useEffect(() => {
    if (!exercise) return;
    setHasChanges(reps !== exercise.reps || restSeconds !== exercise.rest_seconds);
  }, [reps, restSeconds, exercise]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
  };

  const chartData = useMemo(() =>
    weightLogs.map(l => ({
      date: new Date(l.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      peso: l.weight_kg,
    })),
    [weightLogs]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const mw = exercise ? mwMedia[exercise.name] : undefined;
  const isMediaPending = mediaLoading && !mw;
  const videoUrl = mw?.video;
  const mediaUrl = mw?.image || exercise?.image_url;
  const displayName = exercise ? stripParentheses(exercise.name) : "";

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
            {isMediaPending ? (
              <div className="w-full h-full"
                style={{ background: `linear-gradient(90deg, ${S.cardBorder}00 0%, ${S.cardBorder}80 50%, ${S.cardBorder}00 100%)`, backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
            ) : videoUrl ? (
              <video
                src={videoUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
                style={{ background: S.card }}
              />
            ) : mediaUrl ? (
              <img
                src={mediaUrl}
                alt={displayName}
                className="w-full h-full object-contain"
                style={{ background: S.card }}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Stats bar below GIF */}
      <div className="px-5 -mt-1 mb-2">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-3">
          <div className="px-4 py-2 rounded-2xl flex items-center gap-3"
            style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
            <div className="text-center">
              <p className="text-lg font-bold leading-none" style={{ color: S.orange }}>{exercise?.sets}</p>
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
            {displayName}
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

      {/* Weight Input */}
      <section className="px-5 pb-3">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-sm mb-3" style={{ fontWeight: 700, color: S.text }}>Carga</h2>
          <div className="rounded-2xl p-4 flex items-center justify-between"
            style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: `${S.orange}12` }}>
                <Weight className="w-4 h-4" style={{ color: S.orange }} />
              </div>
              <p className="font-display text-sm" style={{ fontWeight: 600, color: S.text }}>Peso (kg)</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={currentWeight}
                placeholder="0"
                onChange={(e) => { setCurrentWeight(e.target.value); setWeightSaved(false); }}
                className="w-20 h-10 rounded-xl px-3 text-center font-bold text-sm focus:outline-none focus:ring-2"
                style={{
                  background: S.card, border: `1px solid ${S.cardBorder}`,
                  color: S.text, "--tw-ring-color": S.orange,
                } as any}
              />
              {!weightSaved && currentWeight && (
                <motion.button
                  onClick={handleSaveWeight}
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${S.orange}, ${S.amber})` }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Save className="w-4 h-4 text-white" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Weight Chart */}
      {chartData.length >= 2 && (
        <section className="px-5 pb-3">
          <div className="max-w-lg mx-auto">
            <h2 className="font-display text-sm mb-3" style={{ fontWeight: 700, color: S.text }}>Evolução de Carga</h2>
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: S.textMuted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: S.textMuted }} axisLine={false} tickLine={false} width={35}
                    domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{ background: S.card, border: `1px solid ${S.cardBorder}`, borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: S.textMuted }}
                    formatter={(value: number) => [`${value} kg`, "Peso"]}
                  />
                  <Line type="monotone" dataKey="peso" stroke={S.orange} strokeWidth={2.5} dot={{ r: 3, fill: S.orange }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      )}

      {/* Configuration */}
      <section className="px-5 pb-3">
        <div className="max-w-lg mx-auto">
          <h2 className="font-display text-sm mb-3" style={{ fontWeight: 700, color: S.text }}>Ajustar</h2>

          <div className="space-y-2">
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
