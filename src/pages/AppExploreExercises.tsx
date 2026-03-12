import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SolarPage, useSolar } from "@/components/SolarLayout";
import {
  searchExercises,
  fetchExerciseInfo,
  fetchMuscles,
  fetchEquipment,
  getPortugueseTranslation,
  getExerciseMainImage,
  MUSCLE_PT,
  EQUIPMENT_PT,
  type WgerMuscle,
  type WgerEquipment,
  type WgerExercise,
  type WgerExerciseInfo,
} from "@/services/wgerService";
import { ArrowLeft, Search, Filter, Loader2, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoadedExercise {
  exercise: WgerExercise;
  info: WgerExerciseInfo;
  name: string;
  image: string | null;
}

const AppExploreExercises = () => {
  const navigate = useNavigate();
  const S = useSolar();
  const { user, subscriptionLoading } = useAuth();

  const [muscles, setMuscles] = useState<WgerMuscle[]>([]);
  const [equipment, setEquipment] = useState<WgerEquipment[]>([]);
  const [exercises, setExercises] = useState<LoadedExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const [selectedMuscle, setSelectedMuscle] = useState<number | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const LIMIT = 20;

  useEffect(() => {
    if (!subscriptionLoading && !user) {
      navigate("/app/login");
      return;
    }
    loadFilters();
    loadExercises(0, null, null);
  }, [user, subscriptionLoading]);

  const loadFilters = async () => {
    try {
      const [m, e] = await Promise.all([fetchMuscles(), fetchEquipment()]);
      setMuscles(m);
      setEquipment(e);
    } catch (err) {
      console.error("Error loading filters:", err);
    }
  };

  const loadExercises = useCallback(
    async (newOffset: number, muscle: number | null, equip: number | null) => {
      if (newOffset === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        const data = await searchExercises({
          limit: LIMIT,
          offset: newOffset,
          muscles: muscle ?? undefined,
          equipment: equip ?? undefined,
        });
        setTotal(data.count);

        // Load info for each exercise
        const loaded: LoadedExercise[] = [];
        const infos = await Promise.all(data.results.map((ex) => fetchExerciseInfo(ex.id).catch(() => null)));

        data.results.forEach((ex, i) => {
          const info = infos[i];
          if (!info) return;
          const translation = getPortugueseTranslation(info);
          if (!translation || !translation.name) return;
          loaded.push({
            exercise: ex,
            info,
            name: translation.name,
            image: getExerciseMainImage(info),
          });
        });

        if (newOffset === 0) setExercises(loaded);
        else setExercises((prev) => [...prev, ...loaded]);
        setOffset(newOffset + LIMIT);
      } catch (err) {
        console.error("Error loading exercises:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const handleFilter = (muscle: number | null, equip: number | null) => {
    setSelectedMuscle(muscle);
    setSelectedEquipment(equip);
    setExercises([]);
    setOffset(0);
    loadExercises(0, muscle, equip);
    setShowFilters(false);
  };

  const clearFilters = () => handleFilter(null, null);

  const filteredExercises = searchQuery
    ? exercises.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : exercises;

  const hasMore = offset < total;
  const activeFilters = (selectedMuscle ? 1 : 0) + (selectedEquipment ? 1 : 0);

  return (
    <SolarPage>
      {/* Header */}
      <div
        className="sticky top-0 z-20 px-5 pt-4 pb-3"
        style={{ background: S.headerBg, backdropFilter: "blur(20px)" }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}
            >
              <ArrowLeft className="w-4 h-4" style={{ color: S.text }} />
            </button>
            <h1 className="font-display text-lg" style={{ fontWeight: 800, color: S.text }}>
              Explorar Exercícios
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${S.orange}15`, color: S.orange }}>
              {total}
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: S.textMuted }} />
              <input
                placeholder="Buscar exercício..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 rounded-xl pl-10 pr-3 text-sm focus:outline-none focus:ring-2"
                style={{
                  background: S.card,
                  border: `1px solid ${S.cardBorder}`,
                  color: S.text,
                  "--tw-ring-color": S.orange,
                } as any}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: activeFilters > 0 ? `${S.orange}15` : S.card,
                border: `1px solid ${activeFilters > 0 ? S.orange : S.cardBorder}`,
              }}
            >
              <Filter className="w-4 h-4" style={{ color: activeFilters > 0 ? S.orange : S.textMuted }} />
              {activeFilters > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center text-white"
                  style={{ background: S.orange }}
                >
                  {activeFilters}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden px-5"
          >
            <div className="max-w-lg mx-auto py-3 space-y-4">
              {/* Muscles */}
              <div>
                <p className="font-display text-xs mb-2" style={{ fontWeight: 700, color: S.textMuted }}>
                  MÚSCULO
                </p>
                <div className="flex flex-wrap gap-2">
                  {muscles.map((m) => {
                    const active = selectedMuscle === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => handleFilter(active ? null : m.id, selectedEquipment)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                        style={{
                          background: active ? S.orange : S.card,
                          color: active ? "#fff" : S.textMuted,
                          border: `1px solid ${active ? S.orange : S.cardBorder}`,
                        }}
                      >
                        {MUSCLE_PT[m.id] || m.name_en || m.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <p className="font-display text-xs mb-2" style={{ fontWeight: 700, color: S.textMuted }}>
                  EQUIPAMENTO
                </p>
                <div className="flex flex-wrap gap-2">
                  {equipment.map((e) => {
                    const active = selectedEquipment === e.id;
                    return (
                      <button
                        key={e.id}
                        onClick={() => handleFilter(selectedMuscle, active ? null : e.id)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                        style={{
                          background: active ? S.orange : S.card,
                          color: active ? "#fff" : S.textMuted,
                          border: `1px solid ${active ? S.orange : S.cardBorder}`,
                        }}
                      >
                        {EQUIPMENT_PT[e.id] || e.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeFilters > 0 && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs"
                  style={{ color: S.orange }}
                >
                  <X className="w-3 h-3" /> Limpar filtros
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise List */}
      <div className="px-5 py-4">
        <div className="max-w-lg mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin mb-2" style={{ color: S.orange }} />
              <p className="text-sm" style={{ color: S.textMuted }}>Carregando exercícios...</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm" style={{ color: S.textMuted }}>Nenhum exercício encontrado</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {filteredExercises.map((item) => {
                  const muscleNames = item.info.muscles
                    .map((m) => MUSCLE_PT[m.id] || m.name_en || m.name)
                    .join(", ");
                  const equipNames = item.info.equipment
                    .map((e) => EQUIPMENT_PT[e.id] || e.name)
                    .join(", ");

                  return (
                    <motion.div
                      key={item.exercise.id}
                      onClick={() => navigate(`/app/explore/${item.exercise.id}`)}
                      className="rounded-2xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                      style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover shrink-0"
                          style={{ background: S.bg }}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${S.orange}10` }}
                        >
                          <span className="text-2xl">🏋️</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm capitalize truncate" style={{ color: S.text }}>
                          {item.name}
                        </p>
                        {muscleNames && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: S.orange }}>
                            {muscleNames}
                          </p>
                        )}
                        {equipNames && (
                          <p className="text-xs truncate" style={{ color: S.textMuted }}>
                            {equipNames}
                          </p>
                        )}
                      </div>
                      <ChevronDown className="w-4 h-4 -rotate-90 shrink-0" style={{ color: S.textMuted }} />
                    </motion.div>
                  );
                })}
              </div>

              {/* Load More */}
              {hasMore && !searchQuery && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => loadExercises(offset, selectedMuscle, selectedEquipment)}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-2xl text-sm font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`,
                      color: "#fff",
                    }}
                  >
                    {loadingMore ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Carregar mais"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </SolarPage>
  );
};

export default AppExploreExercises;
