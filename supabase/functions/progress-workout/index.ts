import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/*
  Progression cycle (8-week model):
  Week 1-2: adaptation  — level 1 exercises, 2 sets, lighter
  Week 3-4: building    — +1 set or +2 reps, introduce level 2
  Week 5-6: intensify   — reduce rest (60→45), harder variations
  Week 7:   peak        — max volume
  Week 8:   deload      — same exercises, half sets, light
  Week 9+:  new cycle   — new program with different exercises
*/

function getPhase(week: number): { phase: string; adjustments: Record<string, any> } {
  const w = ((week - 1) % 8) + 1; // 1-8 within cycle
  if (w <= 2) {
    return {
      phase: "adaptation",
      adjustments: {
        max_difficulty: 1,
        sets_modifier: 0,
        reps_modifier: 0,
        rest_modifier: 0,
        description: "Fase de adaptação: cargas leves, foco em aprender movimentos",
      },
    };
  }
  if (w <= 4) {
    return {
      phase: "building",
      adjustments: {
        max_difficulty: 2,
        sets_modifier: 1,
        reps_modifier: 2,
        rest_modifier: 0,
        description: "Fase de construção: +1 série ou +2 reps, exercícios nível 2",
      },
    };
  }
  if (w <= 6) {
    return {
      phase: "intensify",
      adjustments: {
        max_difficulty: 2,
        sets_modifier: 1,
        reps_modifier: 0,
        rest_modifier: -15,
        description: "Fase de intensificação: descanso reduzido, variações mais desafiadoras",
      },
    };
  }
  if (w === 7) {
    return {
      phase: "peak",
      adjustments: {
        max_difficulty: 2,
        sets_modifier: 2,
        reps_modifier: 2,
        rest_modifier: -15,
        description: "Fase de pico: volume máximo",
      },
    };
  }
  // w === 8
  return {
    phase: "deload",
    adjustments: {
      max_difficulty: 1,
      sets_modifier: -1,
      reps_modifier: -2,
      rest_modifier: 15,
      description: "Semana de deload: mesmos exercícios, metade do volume, carga leve",
    },
  };
}

function applyFeedbackAdjustments(
  adjustments: Record<string, any>,
  recentFeedback: string[]
): Record<string, any> {
  const adj = { ...adjustments };
  const feedbackCounts: Record<string, number> = {};
  for (const fb of recentFeedback) {
    feedbackCounts[fb] = (feedbackCounts[fb] || 0) + 1;
  }

  // If majority says too_easy, increase
  if ((feedbackCounts["too_easy"] || 0) >= 2) {
    adj.sets_modifier = (adj.sets_modifier || 0) + 1;
    adj.reps_modifier = (adj.reps_modifier || 0) + 2;
    adj.feedback_note = "Aumentamos a intensidade porque seus últimos treinos estavam fáceis";
  }
  // If majority says too_hard, decrease
  if ((feedbackCounts["too_hard"] || 0) >= 2) {
    adj.sets_modifier = (adj.sets_modifier || 0) - 1;
    adj.rest_modifier = (adj.rest_modifier || 0) + 15;
    adj.feedback_note = "Reduzimos a intensidade pra você se adaptar melhor";
  }
  // If felt pain, flag it
  if ((feedbackCounts["felt_pain"] || 0) >= 1) {
    adj.avoid_pain_exercises = true;
    adj.feedback_note = "Removemos exercícios que podem causar desconforto";
  }

  return adj;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, program_id } = await req.json();
    if (!user_id || !program_id) {
      return new Response(JSON.stringify({ error: "Missing user_id or program_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get or create progression cycle
    let { data: cycle } = await supabase
      .from("progression_cycles")
      .select("*")
      .eq("user_id", user_id)
      .eq("program_id", program_id)
      .single();

    if (!cycle) {
      const { data: newCycle, error: cycleErr } = await supabase
        .from("progression_cycles")
        .insert({ user_id, program_id, current_week: 1, cycle_number: 1, phase: "adaptation" })
        .select()
        .single();
      if (cycleErr) throw cycleErr;
      cycle = newCycle;
    }

    // Advance week
    const nextWeek = cycle.current_week + 1;
    const { phase, adjustments } = getPhase(nextWeek);
    const isNewCycle = nextWeek > 8 && ((nextWeek - 1) % 8) === 0;
    const cycleNumber = isNewCycle ? cycle.cycle_number + 1 : cycle.cycle_number;

    // 2. Get recent feedback from last 3-5 workout logs
    const { data: recentLogs } = await supabase
      .from("workout_logs")
      .select("feedback")
      .eq("user_id", user_id)
      .not("feedback", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5);

    const recentFeedback = (recentLogs || [])
      .map((l: any) => l.feedback)
      .filter(Boolean) as string[];

    const finalAdjustments = applyFeedbackAdjustments(adjustments, recentFeedback);

    // 3. Get current program info
    const { data: program } = await supabase
      .from("workout_programs")
      .select("*")
      .eq("id", program_id)
      .single();

    if (!program) throw new Error("Program not found");

    // 4. Get current workouts to know the structure
    const { data: currentWorkouts } = await supabase
      .from("workouts")
      .select("id, title, description, sort_order")
      .eq("program_id", program_id)
      .order("sort_order");

    // 5. Get curated exercises
    const maxDiff = finalAdjustments.max_difficulty || 2;
    const { data: allExercises } = await supabase
      .from("curated_exercises")
      .select("*")
      .eq("active", true)
      .lte("difficulty_level", maxDiff);

    // 6. Get user profile for pain areas
    const { data: profileData } = await supabase
      .from("profiles")
      .select("profile_scores")
      .eq("id", user_id)
      .single();

    // Get lead for quiz answers
    const { data: lead } = await supabase
      .from("profiles")
      .select("lead_id")
      .eq("id", user_id)
      .single();

    let painAreas: string[] = [];
    if (lead?.lead_id) {
      const { data: leadData } = await supabase
        .from("leads")
        .select("quiz_answers")
        .eq("id", lead.lead_id)
        .single();
      if (leadData?.quiz_answers) {
        const answers = leadData.quiz_answers as Record<string, any>;
        const painMap: Record<string, string> = { t14b: "back", t14c: "knees", t14d: "shoulders", t14e: "elbows" };
        const painIds = Array.isArray(answers.t14) ? answers.t14 : [];
        painAreas = painIds.filter((id: string) => id !== "t14a").map((id: string) => painMap[id]).filter(Boolean);
      }
    }

    // Filter exercises
    const filtered = (allExercises || []).filter((ex: any) => {
      if (painAreas.some((p) => (ex.contraindications || []).includes(p))) return false;
      if (finalAdjustments.avoid_pain_exercises && (ex.contraindications || []).length > 0) return false;
      return true;
    });

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
      });
    }

    // 7. Build AI prompt
    const systemPrompt = `Você é uma personal trainer especializada em progressão de treinos femininos.
Semana ${nextWeek} do ciclo ${cycleNumber}. Fase: ${phase}.

AJUSTES DESTA SEMANA:
- ${finalAdjustments.description}
${finalAdjustments.feedback_note ? `- Feedback: ${finalAdjustments.feedback_note}` : ""}
- Modificador de séries: ${finalAdjustments.sets_modifier > 0 ? "+" : ""}${finalAdjustments.sets_modifier}
- Modificador de reps: ${finalAdjustments.reps_modifier > 0 ? "+" : ""}${finalAdjustments.reps_modifier}
- Modificador de descanso: ${finalAdjustments.rest_modifier > 0 ? "+" : ""}${finalAdjustments.rest_modifier}s

${phase === "deload" ? "DELOAD: Use os MESMOS exercícios da semana anterior mas com METADE das séries e carga leve." : ""}
${isNewCycle ? "NOVO CICLO: Escolha exercícios DIFERENTES dos últimos ciclos para variar estímulo." : "Mantenha a maioria dos exercícios mas pode trocar 1-2 por variações."}

REGRAS:
- 6-8 exercícios por treino
- Compostos primeiro, isolados depois
- Use APENAS IDs de exercícios fornecidos
- Responda APENAS com JSON`;

    const userPrompt = `Treinos atuais do programa "${program.title}":
${(currentWorkouts || []).map((w: any) => `- ${w.title}: ${w.description || ""}`).join("\n")}

Exercícios disponíveis:
${Object.entries(exercisesByBodyPart).map(([bp, exs]) =>
  `[${bp}]\n${(exs as any[]).map((e) => `- ID: ${e.id} | ${e.name_pt} (${e.equipment}) | target: ${e.target} | nível: ${e.difficulty_level}`).join("\n")}`
).join("\n\n")}

Base de séries (antes dos ajustes): ${maxDiff === 1 ? "2 séries, 12-15 reps, 60s descanso" : "3 séries, 10-12 reps, 45s descanso"}

Gere os treinos atualizados. JSON:
{
  "workouts": [
    {
      "title": "string",
      "description": "string",
      "sort_order": 0,
      "exercises": [
        {
          "curated_exercise_id": "uuid",
          "name": "nome PT",
          "sets": 3,
          "reps": "12",
          "rest_seconds": 45,
          "sort_order": 0
        }
      ]
    }
  ]
}`;

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
              name: "update_workout_plan",
              description: "Update workout plan for the new week",
              parameters: {
                type: "object",
                properties: {
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
                required: ["workouts"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "update_workout_plan" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Tente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return tool call");

    const plan = JSON.parse(toolCall.function.arguments);

    // 8. Delete old workouts + exercises for this program
    const oldWorkoutIds = (currentWorkouts || []).map((w: any) => w.id);
    if (oldWorkoutIds.length > 0) {
      // Delete exercises first
      for (const wid of oldWorkoutIds) {
        await supabase.from("exercises").delete().eq("workout_id", wid);
      }
      await supabase.from("workouts").delete().eq("program_id", program_id);
    }

    // 9. Create new workouts
    const curatedMap: Record<string, any> = {};
    for (const ex of filtered) curatedMap[ex.id] = ex;

    for (const wk of plan.workouts) {
      const { data: workout, error: wkErr } = await supabase
        .from("workouts")
        .insert({
          program_id,
          title: wk.title,
          description: wk.description,
          sort_order: wk.sort_order,
        })
        .select()
        .single();

      if (wkErr) throw wkErr;

      const exerciseInserts = (wk.exercises || []).map((ex: any) => {
        const curated = curatedMap[ex.curated_exercise_id];
        return {
          workout_id: workout.id,
          name: ex.name,
          sets: ex.sets,
          reps: ex.reps,
          rest_seconds: ex.rest_seconds,
          sort_order: ex.sort_order,
          image_url: curated?.gif_url || null,
          description: curated?.simple_instruction_pt || null,
        };
      });

      if (exerciseInserts.length > 0) {
        await supabase.from("exercises").insert(exerciseInserts);
      }
    }

    // 10. Update cycle
    await supabase
      .from("progression_cycles")
      .update({
        current_week: nextWeek,
        cycle_number: cycleNumber,
        phase,
        last_regenerated_at: new Date().toISOString(),
      })
      .eq("id", cycle.id);

    return new Response(
      JSON.stringify({
        success: true,
        week: nextWeek,
        cycle: cycleNumber,
        phase,
        adjustments: finalAdjustments,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("progress-workout error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
