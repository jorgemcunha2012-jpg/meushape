import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SolarPage, SolarHeader, SolarBottomNav, useSolar } from "@/components/SolarLayout";
import { Search, ChevronDown, ChevronUp, Dumbbell } from "lucide-react";
import { searchExercisesMW, fetchExerciseDetail, MUSCLE_PT, type MWExerciseDetail } from "@/services/muscleWikiService";
import { getProxiedMediaUrl } from "@/services/muscleWikiService";

function AdminExercisesContent() {
  const s = useSolar();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MWExerciseDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<MWExerciseDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) navigate("/app");
  }, [isAdmin, navigate]);

  // Debounced search
  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchExercisesMW(query, 10);
        setResults(data);
      } catch { setResults([]); }
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [query]);

  const toggleExpand = useCallback(async (id: number) => {
    if (expandedId === id) { setExpandedId(null); setDetail(null); return; }
    setExpandedId(id);
    setDetailLoading(true);
    try {
      const d = await fetchExerciseDetail(id);
      setDetail(d);
    } catch { setDetail(null); }
    setDetailLoading(false);
  }, [expandedId]);

  const videoUrl = detail?.videos?.[0]?.url ? getProxiedMediaUrl(detail.videos[0].url) : null;

  return (
    <div className="px-4 pb-24 pt-2 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Pesquisar exercícios (ex: bench press, squat...)"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card text-foreground placeholder:text-muted-foreground text-sm focus:outline-none"
          style={{ border: `1px solid ${s.cardBorder}` }}
        />
      </div>

      {loading && <p className="text-center text-muted-foreground text-sm">Buscando...</p>}

      {!loading && results.length === 0 && query.length >= 2 && (
        <p className="text-center text-muted-foreground text-sm">Nenhum resultado encontrado</p>
      )}

      {/* Results */}
      <div className="space-y-2">
        {results.map(ex => {
          const isOpen = expandedId === ex.id;
          const muscles = (ex.primary_muscles || []).map(m => MUSCLE_PT[m] || m).join(", ");
          return (
            <div
              key={ex.id}
              className="rounded-xl bg-card overflow-hidden"
              style={{ border: `1px solid ${s.cardBorder}` }}
            >
              <button
                onClick={() => toggleExpand(ex.id)}
                className="w-full flex items-center gap-3 p-3 text-left"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${s.orange}18`, color: s.orange }}
                >
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{ex.name}</p>
                  {muscles && <p className="text-xs text-muted-foreground truncate">{muscles}</p>}
                  <p className="text-xs mt-0.5" style={{ color: s.orange }}>3 séries × 12 reps • 60s descanso</p>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>

              {isOpen && (
                <div className="px-3 pb-3 space-y-3" style={{ borderTop: `1px solid ${s.cardBorder}` }}>
                  {detailLoading ? (
                    <p className="text-xs text-muted-foreground py-4 text-center">Carregando detalhe...</p>
                  ) : detail ? (
                    <>
                      {videoUrl && (
                        <video
                          src={videoUrl}
                          className="w-full rounded-lg mt-3"
                          style={{ maxHeight: 280 }}
                          controls
                          muted
                          playsInline
                          loop
                          autoPlay
                        />
                      )}
                      {detail.steps?.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-foreground">Execução:</p>
                          {detail.steps.map((step, i) => (
                            <p key={i} className="text-xs text-muted-foreground">{i + 1}. {step}</p>
                          ))}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {detail.category && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{detail.category}</span>}
                        {detail.difficulty && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{detail.difficulty}</span>}
                        {detail.force && <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{detail.force}</span>}
                      </div>
                    </>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function AppAdminExercises() {
  return (
    <SolarPage>
      <SolarHeader title="Biblioteca de Exercícios" showBack />
      <AdminExercisesContent />
      <SolarBottomNav />
    </SolarPage>
  );
}
