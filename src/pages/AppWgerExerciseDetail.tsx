import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SolarPage, useSolar } from "@/components/SolarLayout";
import {
  fetchExerciseInfo,
  getPortugueseTranslation,
  getExerciseMainImage,
  MUSCLE_PT,
  EQUIPMENT_PT,
  type WgerExerciseInfo,
} from "@/services/wgerService";
import { ArrowLeft, Target, Dumbbell, Loader2, Info } from "lucide-react";

const AppWgerExerciseDetail = () => {
  const { wgerId } = useParams();
  const navigate = useNavigate();
  const S = useSolar();
  const { user, subscriptionLoading } = useAuth();

  const [info, setInfo] = useState<WgerExerciseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subscriptionLoading && !user) {
      navigate("/app/login");
      return;
    }
    if (wgerId) loadExercise(Number(wgerId));
  }, [wgerId, user, subscriptionLoading]);

  const loadExercise = async (id: number) => {
    setLoading(true);
    try {
      const data = await fetchExerciseInfo(id);
      setInfo(data);
    } catch (err) {
      console.error("Error loading exercise:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: S.bg }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: S.orange }} />
      </div>
    );
  }

  if (!info) {
    return (
      <SolarPage>
        <div className="px-5 pt-16 text-center">
          <p style={{ color: S.textMuted }}>Exercício não encontrado</p>
        </div>
      </SolarPage>
    );
  }

  const translation = getPortugueseTranslation(info);
  const mainImage = getExerciseMainImage(info);
  const name = translation?.name || "Exercício";
  const descriptionHtml = translation?.description || "";
  const muscleNames = info.muscles.map((m) => MUSCLE_PT[m.id] || m.name_en || m.name);
  const secondaryMuscles = info.muscles_secondary.map((m) => MUSCLE_PT[m.id] || m.name_en || m.name);
  const equipNames = info.equipment.map((e) => EQUIPMENT_PT[e.id] || e.name);
  const categoryName = info.category?.name || "";

  return (
    <SolarPage>
      {/* Hero */}
      <div className="relative">
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-5 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center z-10"
          style={{ background: `${S.bg}cc`, border: `1px solid ${S.cardBorder}` }}
        >
          <ArrowLeft className="w-4 h-4" style={{ color: S.text }} />
        </button>

        <div className="flex items-center justify-center py-8" style={{ background: S.bg }}>
          <div
            className="w-[65%] aspect-square rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}
          >
            {mainImage ? (
              <img src={mainImage} alt={name} className="w-full h-full object-contain" />
            ) : (
              <span className="text-6xl">🏋️</span>
            )}
          </div>
        </div>
      </div>

      {/* All images gallery */}
      {info.images.length > 1 && (
        <div className="px-5 pb-3">
          <div className="max-w-lg mx-auto flex gap-2 overflow-x-auto pb-2">
            {info.images.map((img) => (
              <img
                key={img.id}
                src={img.image}
                alt={name}
                className="w-20 h-20 rounded-xl object-cover shrink-0"
                style={{ border: `1px solid ${S.cardBorder}` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Title & Category */}
      <div className="px-5 pt-4 pb-2">
        <div className="max-w-lg mx-auto">
          <h1 className="font-display text-xl capitalize" style={{ fontWeight: 800, color: S.text }}>
            {name}
          </h1>
          {categoryName && (
            <span
              className="inline-block mt-1.5 px-3 py-1 rounded-full text-xs font-semibold"
              style={{ background: `${S.orange}15`, color: S.orange }}
            >
              {categoryName}
            </span>
          )}
        </div>
      </div>

      {/* Muscles */}
      {(muscleNames.length > 0 || secondaryMuscles.length > 0) && (
        <section className="px-5 pb-3">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${S.orange}15` }}
                >
                  <Target className="w-3.5 h-3.5" style={{ color: S.orange }} />
                </div>
                <div>
                  <h3 className="font-display text-sm mb-1" style={{ fontWeight: 700, color: S.text }}>
                    Músculos Alvo
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {muscleNames.map((m, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: `${S.orange}15`, color: S.orange }}
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                  {secondaryMuscles.length > 0 && (
                    <>
                      <p className="text-xs mt-2 mb-1" style={{ color: S.textMuted }}>
                        Músculos secundários
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {secondaryMuscles.map((m, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-full text-xs font-medium"
                            style={{ background: S.card, color: S.textMuted, border: `1px solid ${S.cardBorder}` }}
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Equipment */}
      {equipNames.length > 0 && (
        <section className="px-5 pb-3">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(22,163,74,0.1)" }}
                >
                  <Dumbbell className="w-3.5 h-3.5" style={{ color: "#16a34a" }} />
                </div>
                <div>
                  <h3 className="font-display text-sm mb-1" style={{ fontWeight: 700, color: S.text }}>
                    Equipamento
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {equipNames.map((e, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: "rgba(22,163,74,0.1)", color: "#16a34a" }}
                      >
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Muscle Images */}
      {info.muscles.length > 0 && (
        <section className="px-5 pb-3">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <h3 className="font-display text-sm mb-3" style={{ fontWeight: 700, color: S.text }}>
                Mapa Muscular
              </h3>
              <div className="flex justify-center gap-3">
                {info.muscles.slice(0, 3).map((m) => (
                  <img
                    key={m.id}
                    src={m.image_url_main}
                    alt={MUSCLE_PT[m.id] || m.name}
                    className="w-24 h-auto"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Description */}
      {descriptionHtml && descriptionHtml !== "<p></p>" && (
        <section className="px-5 pb-3">
          <div className="max-w-lg mx-auto">
            <div className="rounded-2xl p-4" style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}>
              <div className="flex items-start gap-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${S.orange}15` }}
                >
                  <Info className="w-3.5 h-3.5" style={{ color: S.orange }} />
                </div>
                <div>
                  <h3 className="font-display text-sm mb-1.5" style={{ fontWeight: 700, color: S.text }}>
                    Descrição
                  </h3>
                  <div
                    className="text-sm leading-relaxed prose-sm"
                    style={{ color: S.textMuted }}
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Videos */}
      {info.videos.length > 0 && (
        <section className="px-5 pb-6">
          <div className="max-w-lg mx-auto">
            <h3 className="font-display text-sm mb-3" style={{ fontWeight: 700, color: S.text }}>
              Vídeo
            </h3>
            {info.videos.map((v) => (
              <video
                key={v.id}
                src={v.video}
                controls
                className="w-full rounded-2xl"
                style={{ border: `1px solid ${S.cardBorder}` }}
              />
            ))}
          </div>
        </section>
      )}

      <div className="h-20" />
    </SolarPage>
  );
};

export default AppWgerExerciseDetail;
