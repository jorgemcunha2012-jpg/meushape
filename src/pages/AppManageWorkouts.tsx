import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ExerciseBrowser from "@/components/ExerciseBrowser";
import type { ExerciseDB } from "@/types/exercise";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Search, Dumbbell, ChevronDown, ChevronUp,
} from "lucide-react";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";

interface Program {
  id: string;
  title: string;
  description: string | null;
  level: string;
  days_per_week: number;
  duration_minutes: number;
  is_active: boolean;
}

interface Workout {
  id: string;
  program_id: string;
  title: string;
  description: string | null;
  sort_order: number;
}

interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  description: string | null;
  sets: number;
  reps: string;
  rest_seconds: number;
  image_url: string | null;
  sort_order: number;
}

const AppManageWorkouts = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showBrowser, setShowBrowser] = useState(false);

  // New program form
  const [newProgramTitle, setNewProgramTitle] = useState("");
  const [newProgramLevel, setNewProgramLevel] = useState("beginner");
  const [newProgramDays, setNewProgramDays] = useState(3);

  // New workout form
  const [newWorkoutTitle, setNewWorkoutTitle] = useState("");

  useEffect(() => {
    if (!loading && !user && !isAdmin) navigate("/app/login");
    if (user || isAdmin) fetchPrograms();
  }, [user, loading, isAdmin]);

  useEffect(() => {
    if (selectedProgram) fetchWorkouts();
  }, [selectedProgram]);

  useEffect(() => {
    if (selectedWorkout) fetchExercises();
  }, [selectedWorkout]);

  const fetchPrograms = async () => {
    const { data } = await supabase
      .from("workout_programs")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPrograms(data);
  };

  const fetchWorkouts = async () => {
    const { data } = await supabase
      .from("workouts")
      .select("*")
      .eq("program_id", selectedProgram!)
      .order("sort_order");
    if (data) setWorkouts(data);
  };

  const fetchExercises = async () => {
    const { data } = await supabase
      .from("exercises")
      .select("*")
      .eq("workout_id", selectedWorkout!)
      .order("sort_order");
    if (data) setExercises(data);
  };

  const createProgram = async () => {
    if (!newProgramTitle.trim()) return;
    const { error } = await supabase.from("workout_programs").insert({
      title: newProgramTitle,
      level: newProgramLevel,
      days_per_week: newProgramDays,
    });
    if (error) { toast.error("Erro ao criar programa"); return; }
    toast.success("Programa criado!");
    setNewProgramTitle("");
    fetchPrograms();
  };

  const createWorkout = async () => {
    if (!newWorkoutTitle.trim() || !selectedProgram) return;
    const { error } = await supabase.from("workouts").insert({
      program_id: selectedProgram,
      title: newWorkoutTitle,
      sort_order: workouts.length,
    });
    if (error) { toast.error("Erro ao criar treino"); return; }
    toast.success("Treino criado!");
    setNewWorkoutTitle("");
    fetchWorkouts();
  };

  const addExerciseFromDB = async (ex: ExerciseDB) => {
    if (!selectedWorkout) return;
    const { error } = await supabase.from("exercises").insert({
      workout_id: selectedWorkout,
      name: ex.name,
      description: ex.instructions?.join(" ") || null,
      image_url: ex.gifUrl,
      sets: 3,
      reps: "12",
      rest_seconds: 60,
      sort_order: exercises.length,
    });
    if (error) { toast.error("Erro ao adicionar exercício"); return; }
    toast.success(`${ex.name} adicionado!`);
    setShowBrowser(false);
    fetchExercises();
  };

  const deleteExercise = async (id: string) => {
    await supabase.from("exercises").delete().eq("id", id);
    fetchExercises();
  };

  const deleteWorkout = async (id: string) => {
    await supabase.from("workouts").delete().eq("id", id);
    if (selectedWorkout === id) { setSelectedWorkout(null); setExercises([]); }
    fetchWorkouts();
  };

  const deleteProgram = async (id: string) => {
    await supabase.from("workout_programs").delete().eq("id", id);
    if (selectedProgram === id) { setSelectedProgram(null); setWorkouts([]); setExercises([]); }
    fetchPrograms();
  };

  const updateExercise = async (id: string, field: string, value: any) => {
    await supabase.from("exercises").update({ [field]: value }).eq("id", id);
    fetchExercises();
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <SolarPage>
      <SolarHeader title="Gerenciar Treinos" showBack />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Programs Section */}
        <section>
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Programas</h2>
          
          {/* New Program Form */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                placeholder="Nome do programa"
                value={newProgramTitle}
                onChange={(e) => setNewProgramTitle(e.target.value)}
                className="rounded-xl"
              />
              <Select value={newProgramLevel} onValueChange={setNewProgramLevel}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Iniciante</SelectItem>
                  <SelectItem value="intermediate">Intermediário</SelectItem>
                  <SelectItem value="advanced">Avançado</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={createProgram} className="rounded-xl">
                <Plus className="w-4 h-4 mr-1" /> Criar Programa
              </Button>
            </div>
          </div>

          {/* Programs List */}
          <div className="space-y-2">
            {programs.map((prog) => (
              <button
                key={prog.id}
                onClick={() => { setSelectedProgram(prog.id); setSelectedWorkout(null); setExercises([]); }}
                className={`w-full text-left bg-card border rounded-2xl p-4 flex items-center justify-between transition-colors ${
                  selectedProgram === prog.id ? "border-primary" : "border-border hover:border-primary/30"
                }`}
              >
                <div>
                  <p className="font-semibold text-foreground text-sm">{prog.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {prog.level === "beginner" ? "Iniciante" : prog.level === "intermediate" ? "Intermediário" : "Avançado"} • {prog.days_per_week}x/semana
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); deleteProgram(prog.id); }} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {selectedProgram === prog.id ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Workouts Section */}
        {selectedProgram && (
          <section className="animate-fade-in">
            <h2 className="font-display text-lg font-bold text-foreground mb-4">
              Treinos do Programa
            </h2>

            <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex gap-3">
              <Input
                placeholder="Ex: Treino A - Superior"
                value={newWorkoutTitle}
                onChange={(e) => setNewWorkoutTitle(e.target.value)}
                className="rounded-xl flex-1"
              />
              <Button onClick={createWorkout} className="rounded-xl shrink-0">
                <Plus className="w-4 h-4 mr-1" /> Criar
              </Button>
            </div>

            <div className="space-y-2">
              {workouts.map((wk) => (
                <button
                  key={wk.id}
                  onClick={() => setSelectedWorkout(wk.id)}
                  className={`w-full text-left bg-card border rounded-2xl p-4 flex items-center justify-between transition-colors ${
                    selectedWorkout === wk.id ? "border-primary" : "border-border hover:border-primary/30"
                  }`}
                >
                  <p className="font-semibold text-foreground text-sm">{wk.title}</p>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); deleteWorkout(wk.id); }} className="text-muted-foreground hover:text-destructive p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Exercises Section */}
        {selectedWorkout && (
          <section className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-foreground">Exercícios</h2>
              <Button onClick={() => setShowBrowser(true)} className="rounded-xl" size="sm">
                <Search className="w-4 h-4 mr-1" /> Buscar na ExerciseDB
              </Button>
            </div>

            {exercises.length === 0 ? (
              <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center">
                <Dumbbell className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-medium mb-1">Nenhum exercício</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Busque exercícios com GIF na ExerciseDB
                </p>
                <Button onClick={() => setShowBrowser(true)} variant="outline" className="rounded-xl">
                  <Search className="w-4 h-4 mr-1" /> Buscar Exercícios
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map((ex, i) => (
                  <div key={ex.id} className="bg-card border border-border rounded-2xl p-4">
                    <div className="flex gap-3">
                      {ex.image_url && (
                        <img
                          src={ex.image_url}
                          alt={ex.name}
                          className="w-20 h-20 rounded-xl object-cover bg-secondary shrink-0"
                          loading="lazy"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="font-semibold text-foreground text-sm capitalize">
                            {i + 1}. {ex.name}
                          </p>
                          <button onClick={() => deleteExercise(ex.id)} className="text-muted-foreground hover:text-destructive p-1 shrink-0">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Editable fields */}
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          <div>
                            <label className="text-xs text-muted-foreground">Séries</label>
                            <Input
                              type="number"
                              value={ex.sets}
                              onChange={(e) => updateExercise(ex.id, "sets", parseInt(e.target.value) || 3)}
                              className="h-8 text-xs rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Reps</label>
                            <Input
                              value={ex.reps}
                              onChange={(e) => updateExercise(ex.id, "reps", e.target.value)}
                              className="h-8 text-xs rounded-lg"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">Descanso (s)</label>
                            <Input
                              type="number"
                              value={ex.rest_seconds}
                              onChange={(e) => updateExercise(ex.id, "rest_seconds", parseInt(e.target.value) || 60)}
                              className="h-8 text-xs rounded-lg"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* ExerciseDB Browser Modal */}
      {showBrowser && (
        <ExerciseBrowser
          onSelect={addExerciseFromDB}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
};

export default AppManageWorkouts;
