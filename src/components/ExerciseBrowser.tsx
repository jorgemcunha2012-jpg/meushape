import { useState, useCallback, memo } from "react";
import { searchExercisesMW, type MWExerciseDetail } from "@/services/muscleWikiService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, X, Loader2 } from "lucide-react";

export interface SelectedExercise {
  name: string;
  instructions: string;
  category: string;
  muscles: string[];
}

interface ExerciseBrowserProps {
  onSelect: (exercise: SelectedExercise) => void;
  onClose: () => void;
}

const ExerciseBrowser = memo(({ onSelect, onClose }: ExerciseBrowserProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MWExerciseDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchExercisesMW(query, 20);
      setResults(data);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (ex: MWExerciseDetail) => {
    onSelect({
      name: ex.name,
      instructions: ex.steps?.join(" ") || "",
      category: ex.category || "",
      muscles: ex.primary_muscles || [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-foreground">Buscar Exercício</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Ex: squat, bicep curl, push up..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="rounded-xl h-11 px-4">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Buscar"}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Buscando exercícios...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map((ex) => (
              <div
                key={ex.id}
                className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3"
              >
                <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <span className="text-3xl">🏋️</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-sm">{ex.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ex.primary_muscles?.join(", ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {ex.category} • {ex.difficulty}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelect(ex)}
                  className="shrink-0 rounded-full"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : searched ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">Nenhum exercício encontrado para "{query}"</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              Busque exercícios em inglês (ex: "squat", "bench press", "deadlift")
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExerciseBrowser;
