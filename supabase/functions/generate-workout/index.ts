import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Quiz answer → structured profile mapping ───
function mapQuizToProfile(answers: Record<string, string | string[]>) {
  const get = (id: string) => answers[id] as string | undefined;
  const getMulti = (id: string) => (Array.isArray(answers[id]) ? (answers[id] as string[]) : []);

  // Goal
  const goalMap: Record<string, string> = {
    t01a: "lose_weight",
    t01b: "tone_up",
    t01c: "lose_and_tone",
    t01d: "start_training",
  };
  const goal = goalMap[get("t01") || ""] || "lose_and_tone";

  // Days per week
  const daysMap: Record<string, number> = { t09a: 2, t09b: 3, t09c: 4, t09d: 5 };
  const days_per_week = daysMap[get("t09") || ""] || 3;

  // Minutes
  const minsMap: Record<string, number> = { t10a: 20, t10b: 30, t10c: 45, t10d: 60 };
  const minutes_per_session = minsMap[get("t10") || ""] || 45;

  // Location
  const locMap: Record<string, string> = { t11a: "gym", t11b: "home", t11c: "hybrid" };
  const workout_location = locMap[get("t11") || ""] || "gym";

  // Focus areas
  const focusMap: Record<string, string> = {
    t13a: "abs",
    t13b: "legs_glutes",
    t13c: "arms",
    t13d: "back",
    t13e: "full_body",
  };
  const focus_areas = getMulti("t13").map((id) => focusMap[id] || "full_body");

  // Pain areas
  const painMap: Record<string, string> = {
    t14b: "back",
    t14c: "knees",
    t14d: "shoulders",
    t14e: "elbows",
  };
  const pain_areas = getMulti("t14")
    .filter((id) => id !== "t14a")
    .map((id) => painMap[id])
    .filter(Boolean);

  // Experience level
  const expMap: Record<string, string> = {
    t04a: "never",
    t04b: "stopped_long_ago",
    t04c: "irregular",
    t04d: "weekly",
    t04e: "daily",
  };
  const training_history = expMap[get("t04") || ""] || "never";

  // Body type
  const bodyMap: Record<string, string> = {
    t02a: "slim",
    t02b: "average",
    t02c: "slightly_overweight",
    t02d: "overweight",
  };
  const current_body = bodyMap[get("t02") || ""] || "average";

  // Desired body
  const desiredMap: Record<string, string> = {
    t03a: "slim",
    t03b: "toned",
    t03c: "strong",
  };
  const desired_body = desiredMap[get("t03") || ""] || "toned";

  // Biometrics
  const height_cm = parseInt(get("t21") || "165");
  const current_weight_kg = parseInt(get("t22") || "70");
  const goal_weight_kg = parseInt(get("t23") || "60");
  const age = parseInt(get("t24") || "28");

  return {
    goal,
    days_per_week,
    minutes_per_session,
    workout_location,
    focus_areas,
    pain_areas,
    training_history,
    current_body,
    desired_body,
    height_cm,
    current_weight_kg,
    goal_weight_kg,
    age,
  };
}

// ─── Deterministic template selection ───
interface WorkoutDay {
  title: string;
  focus: string;
  body_parts: string[];
  add_cardio: boolean;
}

function selectTemplate(
  days: number,
  goal: string,
  focus_areas: string[]
): WorkoutDay[] {
  const addCardio = goal === "lose_weight" || goal === "lose_and_tone";
  const focusLegs =
    focus_areas.includes("legs_glutes") || focus_areas.length === 0;

  if (days <= 2) {
    return [
      {
        title: "Treino A — Corpo Inteiro (Inferior)",
        focus: "Pernas + glúteos + abdome",
        body_parts: ["upper legs", "lower legs", "waist"],
        add_cardio: addCardio,
      },
      {
        title: "Treino B — Corpo Inteiro (Superior)",
        focus: "Costas + braços + ombros + peito",
        body_parts: ["back", "upper arms", "shoulders", "chest"],
        add_cardio: addCardio,
      },
    ];
  }

  if (days === 3) {
    return [
      {
        title: "Treino A — Pernas e Glúteos",
        focus: "Agachamento, leg press, hip thrust, abdutora + abdome",
        body_parts: ["upper legs", "lower legs", "waist"],
        add_cardio: false,
      },
      {
        title: "Treino B — Superiores",
        focus: "Costas, peito, ombros, braços",
        body_parts: ["back", "chest", "shoulders", "upper arms"],
        add_cardio: false,
      },
      {
        title: "Treino C — Glúteos + Posterior" + (addCardio ? " + Cardio" : ""),
        focus: "Afundo, stiff, flexora, glúteo" + (addCardio ? " + 15 min cardio" : ""),
        body_parts: ["upper legs", "waist"],
        add_cardio: addCardio,
      },
    ];
  }

  if (days === 4) {
    return [
      {
        title: "Treino A — Pernas (Quadríceps)",
        focus: "Agachamento, leg press, extensora, afundo",
        body_parts: ["upper legs"],
        add_cardio: false,
      },
      {
        title: "Treino B — Costas + Bíceps + Abdome",
        focus: "Puxada, remada, rosca + abdome",
        body_parts: ["back", "upper arms", "waist"],
        add_cardio: false,
      },
      {
        title: "Treino C — Pernas (Glúteos)",
        focus: "Hip thrust, stiff, abdutora, kickback",
        body_parts: ["upper legs"],
        add_cardio: false,
      },
      {
        title: "Treino D — Peito + Ombros + Tríceps" + (addCardio ? " + Cardio" : ""),
        focus: "Supino, elevação lateral, tríceps" + (addCardio ? " + 15 min cardio" : ""),
        body_parts: ["chest", "shoulders", "upper arms"],
        add_cardio: addCardio,
      },
    ];
  }

  // 5+ days
  return [
    {
      title: "Treino A — Pernas (Quadríceps)",
      focus: "Agachamento, leg press, extensora",
      body_parts: ["upper legs"],
      add_cardio: false,
    },
    {
      title: "Treino B — Costas + Bíceps",
      focus: "Puxada, remada, rosca",
      body_parts: ["back", "upper arms"],
      add_cardio: false,
    },
    {
      title: "Treino C — Pernas (Glúteo + Posterior)",
      focus: "Hip thrust, stiff, flexora, abdutora",
      body_parts: ["upper legs"],
      add_cardio: false,
    },
    {
      title: "Treino D — Peito + Ombros + Tríceps",
      focus: "Supino, elevação lateral, tríceps",
      body_parts: ["chest", "shoulders", "upper arms"],
      add_cardio: false,
    },
    {
      title: "Treino E — Full Body + Cardio",
      focus: "Circuito leve + 20 min cardio",
      body_parts: ["upper legs", "back", "chest", "waist"],
      add_cardio: true,
    },
  ];
}

// ─── Equipment mapping by location ───
function getAllowedEquipment(location: string): string[] {
  if (location === "home") {
    return ["body weight", "dumbbell", "resistance band", "stability ball", "roller"];
  }
  // gym or hybrid
  return [
    "barbell", "dumbbell", "cable", "leverage machine", "smith machine",
    "ez barbell", "kettlebell", "body weight", "medicine ball",
    "stability ball", "resistance band",
  ];
}

// ─── Difficulty from training history ───
function getDifficultyLevel(history: string): number {
  if (history === "never" || history === "stopped_long_ago") return 1;
  if (history === "irregular" || history === "weekly") return 2;
  return 3;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { quiz_answers, user_id, scores } = await req.json();

    if (!quiz_answers || !user_id) {
      return new Response(JSON.stringify({ error: "Missing quiz_answers or user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Map quiz to profile
    const profile = mapQuizToProfile(quiz_answers);
    const diffLevel = getDifficultyLevel(profile.training_history);
    const allowedEquipment = getAllowedEquipment(profile.workout_location);

    // 2. Select template
    const template = selectTemplate(profile.days_per_week, profile.goal, profile.focus_areas);

    // 3. Fetch curated exercises
    const { data: allExercises, error: exErr } = await supabase
      .from("curated_exercises")
      .select("*")
      .eq("active", true)
      .lte("difficulty_level", diffLevel);

    if (exErr) throw exErr;

    // Filter by equipment and contraindications
    const filtered = (allExercises || []).filter((ex: any) => {
      if (!allowedEquipment.includes(ex.equipment)) return false;
      if (profile.pain_areas.some((p: string) => (ex.contraindications || []).includes(p))) return false;
      return true;
    });

    // 4. Build prompt for AI
    const exercisesByBodyPart: Record<string, any[]> = {};
    for (const ex of filtered) {
      if (!exercisesByBodyPart[ex.body_part]) exercisesByBodyPart[ex.body_part] = [];
      exercisesByBodyPart[ex.body_part].push({
        id: ex.id,
        name_pt: ex.name_pt,
        target: ex.target,
        equipment: ex.equipment,
        difficulty_level: ex.difficulty_level,
        focus_category: ex.focus_category,
        default_sets: diffLevel === 1 ? ex.default_sets_beginner : diffLevel === 2 ? ex.default_sets_intermediate : ex.default_sets_advanced,
        default_reps: diffLevel === 1 ? ex.default_reps_beginner : diffLevel === 2 ? ex.default_reps_intermediate : ex.default_reps_advanced,
        default_rest: diffLevel === 1 ? ex.default_rest_beginner : diffLevel === 2 ? ex.default_rest_intermediate : ex.default_rest_advanced,
      });
    }

    const systemPrompt = `Você é uma personal trainer especializada em treinos femininos. Sua tarefa é montar treinos personalizados selecionando exercícios de uma biblioteca curada.

REGRAS:
- Selecione 6-8 exercícios por treino (5-6 se for iniciante/start_training)
- Respeite a ordem: exercícios compostos primeiro, isolados depois
- Ajuste séries e repetições baseado no nível e objetivo
- Se objetivo inclui emagrecimento: repetições mais altas (12-15), descanso mais curto (30-45s)
- Se objetivo é definir: repetições médias (10-12), descanso normal (45-60s)
- Se é iniciante (start_training): menos exercícios, 2 séries, foco em aprender
- Priorize exercícios com priority=1
- NÃO invente exercícios — use APENAS os IDs fornecidos

Responda APENAS com o JSON, sem texto adicional.`;

    const userPrompt = `Perfil da usuária:
- Objetivo: ${profile.goal}
- Nível: ${diffLevel === 1 ? "iniciante" : diffLevel === 2 ? "intermediária" : "avançada"}
- Histórico: ${profile.training_history}
- Corpo atual: ${profile.current_body}
- Corpo desejado: ${profile.desired_body}
- Foco: ${profile.focus_areas.join(", ") || "corpo todo"}
- Dores: ${profile.pain_areas.join(", ") || "nenhuma"}
- Local: ${profile.workout_location}
- Minutos por sessão: ${profile.minutes_per_session}
- Idade: ${profile.age}, Peso: ${profile.current_weight_kg}kg, Altura: ${profile.height_cm}cm

Template do plano (${template.length} dias/semana):
${template.map((d, i) => `Dia ${i + 1}: ${d.title} — Foco: ${d.focus} — Body parts: ${d.body_parts.join(", ")}${d.add_cardio ? " (adicionar cardio no final)" : ""}`).join("\n")}

Exercícios disponíveis por body part:
${Object.entries(exercisesByBodyPart).map(([bp, exs]) => `\n[${bp}]\n${exs.map((e: any) => `- ID: ${e.id} | ${e.name_pt} (${e.equipment}) | target: ${e.target} | nível: ${e.difficulty_level} | padrão: ${e.default_sets}x${e.default_reps} descanso ${e.default_rest}s`).join("\n")}`).join("\n")}

Monte o treino. Retorne um JSON com esta estrutura exata:
{
  "program_title": "string - título do programa",
  "program_description": "string - descrição curta",
  "workouts": [
    {
      "title": "string - título do treino (ex: Treino A — Pernas e Glúteos)",
      "description": "string - descrição",
      "sort_order": 0,
      "exercises": [
        {
          "curated_exercise_id": "uuid do exercício da biblioteca",
          "name": "nome em português",
          "sets": 3,
          "reps": "12",
          "rest_seconds": 60,
          "sort_order": 0
        }
      ]
    }
  ]
}`;

    // 5. Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_workout_plan",
              description: "Create a personalized workout plan",
              parameters: {
                type: "object",
                properties: {
                  program_title: { type: "string" },
                  program_description: { type: "string" },
                  workouts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        sort_order: { type: "number" },
                        exercises: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              curated_exercise_id: { type: "string" },
                              name: { type: "string" },
                              sets: { type: "number" },
                              reps: { type: "string" },
                              rest_seconds: { type: "number" },
                              sort_order: { type: "number" },
                            },
                            required: ["curated_exercise_id", "name", "sets", "reps", "rest_seconds", "sort_order"],
                          },
                        },
                      },
                      required: ["title", "description", "sort_order", "exercises"],
                    },
                  },
                },
                required: ["program_title", "program_description", "workouts"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_workout_plan" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI error:", status, "error code:", errText);
      
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes para gerar o treino. Contate o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 503) {
        return new Response(JSON.stringify({ error: "O serviço de IA está temporariamente indisponível. Tente novamente em alguns minutos." }), {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${status} - ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return a tool call");

    const plan = JSON.parse(toolCall.function.arguments);

    // 6. Save to database
    // Create program
    const levelMap: Record<number, string> = { 1: "beginner", 2: "intermediate", 3: "advanced" };
    const { data: program, error: progErr } = await supabase
      .from("workout_programs")
      .insert({
        title: plan.program_title,
        description: plan.program_description,
        level: levelMap[diffLevel] || "beginner",
        days_per_week: profile.days_per_week,
        duration_minutes: profile.minutes_per_session,
        is_active: true,
      })
      .select()
      .single();

    if (progErr) throw progErr;

    // Build curated exercise lookup for gif_url and instructions
    const curatedMap: Record<string, any> = {};
    for (const ex of filtered) {
      curatedMap[ex.id] = ex;
    }

    // Helper: fetch GIF from ExerciseDB API as fallback
    async function fetchGifFallback(namePt: string): Promise<string | null> {
      try {
        // Normalize portuguese name to ASCII for better matching
        const normalized = namePt
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, "")
          .trim();
        const url = `https://www.exercisedb.dev/api/v1/exercises/search?q=${encodeURIComponent(normalized)}&limit=1`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const json = await res.json();
        return json?.data?.[0]?.gifUrl || null;
      } catch {
        return null;
      }
    }

    // Create workouts and exercises
    for (const wk of plan.workouts) {
      const { data: workout, error: wkErr } = await supabase
        .from("workouts")
        .insert({
          program_id: program.id,
          title: wk.title,
          description: wk.description,
          sort_order: wk.sort_order,
        })
        .select()
        .single();

      if (wkErr) throw wkErr;

      // Resolve GIFs in parallel (with fallback to ExerciseDB API)
      const exerciseInserts = await Promise.all(
        (wk.exercises || []).map(async (ex: any) => {
          const curated = curatedMap[ex.curated_exercise_id];
          let gif_url = curated?.gif_url || null;
          if (!gif_url) {
            gif_url = await fetchGifFallback(ex.name);
          }
          return {
            workout_id: workout.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            sort_order: ex.sort_order,
            image_url: gif_url,
            description: curated?.simple_instruction_pt || null,
          };
        })
      );

      if (exerciseInserts.length > 0) {
        const { error: exInsErr } = await supabase
          .from("exercises")
          .insert(exerciseInserts);
        if (exInsErr) throw exInsErr;
      }
    }

    // 7. Add program to user_programs so it shows in "Meus Treinos"
    await supabase.from("user_programs").upsert({
      user_id,
      program_id: program.id,
    }, { onConflict: "user_id,program_id" });

    // 8. Update profile with scores if provided
    if (scores) {
      await supabase
        .from("profiles")
        .update({ profile_scores: scores })
        .eq("id", user_id);
    }

    return new Response(
      JSON.stringify({ success: true, program_id: program.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-workout error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
