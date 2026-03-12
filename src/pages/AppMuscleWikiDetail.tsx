import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SolarPage, useSolar } from "@/components/SolarLayout";
import {
  fetchExerciseDetail,
  getProxiedMediaUrl,
  MUSCLE_PT,
  CATEGORY_PT,
  DIFFICULTY_PT,
  type MWExerciseDetail,
} from "@/services/muscleWikiService";
import { ArrowLeft, Target, Dumbbell, Loader2, ListOrdered, Play, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const AppMuscleWikiDetail = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const S = useSolar();
  const { user, subscriptionLoading } = useAuth();

  const [exercise, setExercise] = useState<MWExerciseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(0);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!subscriptionLoading && !user) {
      navigate("/app/login");
      return;
    }
    if (exerciseId) {
      loadExercise(Number(exerciseId));
      checkFavorite(Number(exerciseId));
    }
  }, [exerciseId, user, subscriptionLoading]);

  const loadExercise = async (id: number) => {
    setLoading(true);
    try {
      setExercise(await fetchExerciseDetail(id));
    } catch (err) {
      console.error("Error loading exercise:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async (id: number) => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("exercise_favorites" as any)
        .select("id")
        .eq("user_id", user.id)
        .eq("musclewiki_id", id)
        .maybeSingle();
      setIsFav(!!data);
    } catch {}
  };

  const toggleFavorite = async () => {
    if (!user || !exercise) return;
    if (isFav) {
      await supabase.from("exercise_favorites" as any).delete().eq("user_id", user.id).eq("musclewiki_id", exercise.id);
      setIsFav(false);
    } else {
      await supabase.from("exercise_favorites" as any).insert({ user_id: user.id, musclewiki_id: exercise.id, exercise_name: exercise.name } as any);
      setIsFav(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: S.bg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: S.orange }} />
      </div>
    );
  }

  if (!exercise) {
    return (
      <SolarPage>
        <div className="px-5 pt-16 text-center">
          <p style={{ color: S.textMuted }}>Exercício não encontrado</p>
        </div>
      </SolarPage>
    );
  }

  const videos = exercise.videos || [];
  const femaleVideos = videos.filter((v) => v.gender === "female");
  const maleVideos = videos.filter((v) => v.gender === "male");
  const displayVideos = femaleVideos.length > 0 ? femaleVideos : maleVideos.length > 0 ? maleVideos : videos;

  return (
    <SolarPage>
      {/* Header */}
      <div className="relative">
        <div className="absolute top-4 left-5 right-5 flex justify-between z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center"
            style={{ background: `${S.bg}cc`, border: `1px solid ${S.cardBorder}` }}
          >
            <ArrowLeft className="w-4 h-4" style={{ color: S.text }} />
          </button>
          <button
            onClick={toggleFavorite}
            className="w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center"
            style={{ background: `${S.bg}cc`, border: `1px solid ${S.cardBorder}` }}
          >
            <Heart className="w-4 h-4" style={{ color: isFav ? "#ef4444" : S.text }} fill={isFav ? "#ef4444" : "none"} />
          </button>
        </div>

        {/* Video Player */}
        {displayVideos.length > 0 ? (
          <div className="flex items-center justify-center py-4" style={{ background: S.bg }}>
            <div className="w-full max-w-lg mx-auto px-5">
              <video
                key={displayVideos[activeVideo]?.url}
                src={getProxiedMediaUrl(displayVideos[activeVideo]?.url)}
                autoPlay
                loop
                muted
                playsInline
                className="w-full rounded-2xl"
                style={{ border: `1px solid ${S.cardBorder}`, maxHeight: 350 }}
              />
              {/* Video angle selector */}
              {displayVideos.length > 1 && (
                <div className="flex gap-2 mt-2 justify-center">
                  {displayVideos.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveVideo(i)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                      style={{
                        background: i === activeVideo ? S.orange : S.card,
                        color: i === activeVideo ? "#fff" : S.textMuted,
                        border: `1px solid ${i === activeVideo ? S.orange : S.cardBorder}`,
                      }}
                    >
                      {v.angle === "front" ? "Frontal" : v.angle === "side" ? "Lateral" : v.angle}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12" style={{ background: S.bg }}>
            <span className="text-6xl">🏋️</span>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="px-5 pt-4 pb-2">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-xl" style={{ fontWeight: 800, color: S.text }}>
            {exercise.name}
          </h1>
          <div className="flex flex-wrap gap-2 mt-2">
            {exercise.difficulty && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${S.orange}15`, color: S.orange }}>
                {DIFFICULTY_PT[exercise.difficulty] || exercise.difficulty}
              </span>
            )}
            {exercise.force && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${S.card}`, color: S.textMuted, border: `1px solid ${S.cardBorder}` }}>
                {exercise.force === "Push" ? "Empurrar" : exercise.force === "Pull" ? "Puxar" : exercise.force === "Hold" ? "Segurar" : exercise.force}
              </span>
            )}
            {exercise.mechanic && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold"
                style={{ background: `${S.card}`, color: S.textMuted, border: `1px solid ${S.cardBorder}` }}>
                {exercise.mechanic === "Compound" ? "Composto" : exercise.mechanic === "Isolation" ? "Isolamento" : exercise.mechanic}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Muscles */}
      {exercise.primary_muscles.length > 0 && (
        <section className="px-5 py-3">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${S.orange}15` }}>
                  <Target className="w-3.5 h-3.5" style={{ color: S.orange }} />
                </div>
                <div>
                  <h3 className="font-display text-sm mb-1" style={{ fontWeight: 700, color: S.text }}>
                    Músculos Alvo
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {exercise.primary_muscles.map((m, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: `${S.orange}15`, color: S.orange }}>
                        {MUSCLE_PT[m] || m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Equipment */}
      {exercise.category && (
        <section className="px-5 pb-3">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(22,163,74,0.1)" }}>
                  <Dumbbell className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />
                </div>
                <div>
                  <h3 className="font-display text-sm mb-1" style={{ fontWeight: 700, color: S.text }}>Equipamento</h3>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}>
                    {CATEGORY_PT[exercise.category.toLowerCase()] || exercise.category}
                  </span>
                  {exercise.grips.length > 0 && (
                    <p className="text-xs mt-2" style={{ color: S.textMuted }}>
                      Pegada: {exercise.grips.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Instructions */}
      {exercise.steps.length > 0 && (
        <section className="px-5 pb-3">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${S.orange}15` }}>
                  <ListOrdered className="w-3.5 h-3.5" style={{ color: S.orange }} />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-sm mb-2" style={{ fontWeight: 700, color: S.text }}>
                    Instruções
                  </h3>
                  <ol className="space-y-2">
                    {exercise.steps.map((step, i) => (
                      <li key={i} className="flex gap-2 text-sm" style={{ color: S.textMuted }}>
                        <span className="font-bold shrink-0" style={{ color: S.orange }}>{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* All video angles */}
      {videos.length > 2 && (
        <section className="px-5 pb-3">
          <div className="max-w-lg mx-auto">
            <h3 className="font-display text-sm mb-3" style={{ fontWeight: 700, color: S.text }}>
              <Play className="w-4 h-4 inline mr-1" style={{ color: S.orange }} />
              Todos os Ângulos ({videos.length} vídeos)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {videos.map((v, i) => (
                <div key={i} className="rounded-xl overflow-hidden"
                  style={{ border: `1px solid ${S.cardBorder}` }}>
                  <video
                    src={getProxiedMediaUrl(v.url)}
                    autoPlay loop muted playsInline
                    className="w-full aspect-video object-cover"
                  />
                  <div className="px-2 py-1 text-[10px] font-medium" style={{ background: S.card, color: S.textMuted }}>
                    {v.gender === "female" ? "♀" : "♂"} {v.angle === "front" ? "Frontal" : "Lateral"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="h-20" />
    </SolarPage>
  );
};

export default AppMuscleWikiDetail;
