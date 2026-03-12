import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useClickGuard } from "@/hooks/useThrottle";
import { useAuth } from "@/hooks/useAuth";
import { SolarPage, useSolar } from "@/components/SolarLayout";
import {
  listExercises,
  fetchExerciseDetail,
  fetchCategories,
  searchExercisesMW,
  MUSCLE_PT,
  CATEGORY_PT,
  DIFFICULTY_PT,
  MAIN_MUSCLES,
  getProxiedMediaUrl,
  type MWCategory,
  type MWExerciseDetail,
  type MWExerciseMinimal,
} from "@/services/muscleWikiService";
import { ArrowLeft, Search, Filter, Loader2, X, ChevronDown, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const DIFFICULTIES = ["Beginner", "Novice", "Intermediate", "Advanced"];
const LIMIT = 20;

const AppExploreMuscleWiki = () => {
  const navigate = useNavigate();
  const S = useSolar();
  const { user, subscriptionLoading } = useAuth();

  const [categories, setCategories] = useState<MWCategory[]>([]);
  const [exercises, setExercises] = useState<(MWExerciseMinimal & { detail?: MWExerciseDetail })[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);

  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MWExerciseDetail[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const { guard: clickGuard, blocked: clickBlocked } = useClickGuard(2000);

  useEffect(() => {
    if (!subscriptionLoading && !user) {
      navigate("/app/login");
      return;
    }
    loadCategories();
    loadExercises(0);
    if (user) loadFavorites();
  }, [user, subscriptionLoading]);

  const loadCategories = async () => {
    try {
      setCategories(await fetchCategories());
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

  const loadFavorites = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from("exercise_favorites" as any)
        .select("musclewiki_id")
        .eq("user_id", user.id);
      if (data) setFavorites(new Set(data.map((d: any) => d.musclewiki_id)));
    } catch {
      // Table might not exist yet
    }
  };

  const toggleFavorite = async (exerciseId: number, name: string) => {
    if (!user) return;
    const isFav = favorites.has(exerciseId);
    const newFavs = new Set(favorites);
    if (isFav) {
      newFavs.delete(exerciseId);
      await supabase
        .from("exercise_favorites" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("musclewiki_id", exerciseId);
    } else {
      newFavs.add(exerciseId);
      await supabase
        .from("exercise_favorites" as any)
        .insert({ user_id: user.id, musclewiki_id: exerciseId, exercise_name: name } as any);
    }
    setFavorites(newFavs);
  };

  const loadExercises = useCallback(
    async (newOffset: number, muscle?: string | null, category?: string | null, difficulty?: string | null) => {
      if (newOffset === 0) setLoading(true);
      else setLoadingMore(true);

      try {
        const data = await listExercises({
          limit: LIMIT,
          offset: newOffset,
          muscles: muscle ?? selectedMuscle ?? undefined,
          category: category ?? selectedCategory ?? undefined,
          difficulty: difficulty ?? selectedDifficulty ?? undefined,
        });
        setTotal(data.total);

        // Load details for each exercise
        const details = await Promise.all(
          data.results.map((ex) => fetchExerciseDetail(ex.id).catch(() => null))
        );

        const loaded = data.results.map((ex, i) => ({
          ...ex,
          detail: details[i] ?? undefined,
        }));

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
    [selectedMuscle, selectedCategory, selectedDifficulty]
  );

  const handleFilter = (muscle: string | null, category: string | null, difficulty: string | null) => {
    setSelectedMuscle(muscle);
    setSelectedCategory(category);
    setSelectedDifficulty(difficulty);
    setSearchResults(null);
    setSearchQuery("");
    setExercises([]);
    setOffset(0);
    loadExercises(0, muscle, category, difficulty);
    setShowFilters(false);
  };

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const results = await searchExercisesMW(searchQuery, 30);
      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) handleSearch();
      else setSearchResults(null);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearFilters = () => handleFilter(null, null, null);

  const displayExercises = searchResults
    ? searchResults.map((d) => ({ id: d.id, name: d.name, detail: d }))
    : exercises;

  const hasMore = offset < total && !searchResults;
  const activeFilters = (selectedMuscle ? 1 : 0) + (selectedCategory ? 1 : 0) + (selectedDifficulty ? 1 : 0);

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
              {searchResults ? searchResults.length : total}
            </span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: S.textMuted }} />
              <input
                placeholder="Buscar exercício (inglês)..."
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
                <p className="font-display text-xs mb-2" style={{ fontWeight: 700, color: S.textMuted }}>MÚSCULO</p>
                <div className="flex flex-wrap gap-2">
                  {MAIN_MUSCLES.map((m) => {
                    const active = selectedMuscle === m;
                    return (
                      <button
                        key={m}
                        onClick={() => handleFilter(active ? null : m, selectedCategory, selectedDifficulty)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                        style={{
                          background: active ? S.orange : S.card,
                          color: active ? "#fff" : S.textMuted,
                          border: `1px solid ${active ? S.orange : S.cardBorder}`,
                        }}
                      >
                        {MUSCLE_PT[m] || m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Equipment */}
              <div>
                <p className="font-display text-xs mb-2" style={{ fontWeight: 700, color: S.textMuted }}>EQUIPAMENTO</p>
                <div className="flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const active = selectedCategory === c.name;
                    return (
                      <button
                        key={c.name}
                        onClick={() => handleFilter(selectedMuscle, active ? null : c.name, selectedDifficulty)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                        style={{
                          background: active ? S.orange : S.card,
                          color: active ? "#fff" : S.textMuted,
                          border: `1px solid ${active ? S.orange : S.cardBorder}`,
                        }}
                      >
                        {CATEGORY_PT[c.name] || c.display_name} ({c.count})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <p className="font-display text-xs mb-2" style={{ fontWeight: 700, color: S.textMuted }}>DIFICULDADE</p>
                <div className="flex flex-wrap gap-2">
                  {DIFFICULTIES.map((d) => {
                    const active = selectedDifficulty === d;
                    return (
                      <button
                        key={d}
                        onClick={() => handleFilter(selectedMuscle, selectedCategory, active ? null : d)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                        style={{
                          background: active ? S.orange : S.card,
                          color: active ? "#fff" : S.textMuted,
                          border: `1px solid ${active ? S.orange : S.cardBorder}`,
                        }}
                      >
                        {DIFFICULTY_PT[d] || d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeFilters > 0 && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs" style={{ color: S.orange }}>
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
          {(loading || searching) ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin mb-2" style={{ color: S.orange }} />
              <p className="text-sm" style={{ color: S.textMuted }}>
                {searching ? "Buscando..." : "Carregando exercícios..."}
              </p>
            </div>
          ) : displayExercises.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm" style={{ color: S.textMuted }}>Nenhum exercício encontrado</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {displayExercises.map((item) => {
                  const detail = item.detail;
                  const muscles = detail?.primary_muscles?.map((m) => MUSCLE_PT[m] || m).join(", ") || "";
                  const cat = detail?.category ? (CATEGORY_PT[detail.category.toLowerCase()] || detail.category) : "";
                  const diff = detail?.difficulty ? (DIFFICULTY_PT[detail.difficulty] || detail.difficulty) : "";
                  const thumbnail = detail?.videos?.[0]?.og_image;
                  const isFav = favorites.has(item.id);

                  return (
                    <motion.div
                      key={item.id}
                      className="rounded-2xl p-3 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform"
                      style={{ background: S.card, border: `1px solid ${S.cardBorder}` }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        onClick={() => navigate(`/app/musclewiki/${item.id}`)}
                        className="flex items-center gap-3 flex-1 min-w-0"
                      >
                        {thumbnail ? (
                          <img
                            src={getProxiedMediaUrl(thumbnail)}
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
                          <p className="font-semibold text-sm truncate" style={{ color: S.text }}>
                            {item.name}
                          </p>
                          {muscles && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: S.orange }}>{muscles}</p>
                          )}
                          <div className="flex gap-2 mt-0.5">
                            {cat && <p className="text-xs truncate" style={{ color: S.textMuted }}>{cat}</p>}
                            {diff && (
                              <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${S.orange}10`, color: S.orange }}>
                                {diff}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id, item.name); }}
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      >
                        <Heart
                          className="w-4 h-4"
                          style={{ color: isFav ? "#ef4444" : S.textMuted }}
                          fill={isFav ? "#ef4444" : "none"}
                        />
                      </button>
                      <ChevronDown
                        className="w-4 h-4 -rotate-90 shrink-0"
                        style={{ color: S.textMuted }}
                        onClick={() => navigate(`/app/musclewiki/${item.id}`)}
                      />
                    </motion.div>
                  );
                })}
              </div>

              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={() => loadExercises(offset)}
                    disabled={loadingMore}
                    className="px-6 py-2.5 rounded-2xl text-sm font-semibold"
                    style={{
                      background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`,
                      color: "#fff",
                    }}
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : "Carregar mais"}
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

export default AppExploreMuscleWiki;
