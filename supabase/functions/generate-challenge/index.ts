import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildChallengePrompt(onboarding: Record<string, any>, exercises: any[]) {
  const level = onboarding.training_history || "irregular";
  const location = onboarding.workout_location || "gym";
  const painAreas = onboarding.pain_areas || [];
  const focusAreas = onboarding.focus_areas || [];

  const exerciseList = exercises.map((e: any) =>
    `- ID: ${e.id} | ${e.name_pt} (${e.equipment}) | target: ${e.target} | body: ${e.body_part}`
  ).join("\n");

  return {
    system: `Você é uma personal trainer especializada em criar desafios fitness intensos e motivadores para mulheres.

REGRAS DO DESAFIO:
- Crie um desafio de 7-14 dias com treinos curtos e intensos (20-30 min)
- 3-5 treinos por semana, focados em alta intensidade
- Cada treino deve ter 5-7 exercícios
- Use circuitos, supersets ou AMRAP (as many reps as possible)
- Inclua progressão: primeiros treinos mais leves, últimos mais intensos
- Nomeie o desafio de forma motivadora (ex: "Desafio Glúteos de Aço 🔥", "14 Dias para Definir ⚡")
- NÃO invente exercícios — use APENAS os IDs fornecidos
- Respeite dores/restrições da aluna

Responda APENAS com o JSON via tool call.`,
    user: `Perfil da aluna:
- Nível: ${level}
- Local: ${location}
- Foco: ${focusAreas.join(", ") || "corpo todo"}
- Dores/restrições: ${painAreas.join(", ") || "nenhuma"}

Exercícios disponíveis:
${exerciseList}

Monte um desafio fitness intenso e motivador.`,
  };
}

function buildProjectPrompt(onboarding: Record<string, any>, exercises: any[]) {
  const level = onboarding.training_history || "irregular";
  const location = onboarding.workout_location || "gym";
  const painAreas = onboarding.pain_areas || [];
  const focusAreas = onboarding.focus_areas || [];
  const goal = onboarding.goal || "tone_up";
  const daysPerWeek = onboarding.days_per_week || 3;

  const exerciseList = exercises.map((e: any) =>
    `- ID: ${e.id} | ${e.name_pt} (${e.equipment}) | target: ${e.target} | body: ${e.body_part}`
  ).join("\n");

  return {
    system: `Você é uma personal trainer especializada em criar projetos de transformação corporal para mulheres.

REGRAS DO PROJETO:
- Crie um projeto de 4 semanas (28 dias) com periodização
- ${daysPerWeek} treinos por semana, 40-50 min cada
- Cada treino deve ter 6-8 exercícios
- Semana 1-2: Fase de adaptação (volume moderado, aprendizado)
- Semana 3: Fase de intensificação (aumento de volume/carga)
- Semana 4: Fase de pico (máxima intensidade) + deload nos últimos dias
- Varie os treinos entre as semanas para evitar platô
- Nomeie o projeto de forma inspiradora (ex: "Projeto Corpo Novo em 4 Semanas 🏆", "Transformação Total 💪")
- NÃO invente exercícios — use APENAS os IDs fornecidos
- Respeite dores/restrições da aluna

Responda APENAS com o JSON via tool call.`,
    user: `Perfil da aluna:
- Objetivo: ${goal}
- Nível: ${level}
- Local: ${location}
- Dias/semana: ${daysPerWeek}
- Foco: ${focusAreas.join(", ") || "corpo todo"}
- Dores/restrições: ${painAreas.join(", ") || "nenhuma"}

Exercícios disponíveis:
${exerciseList}

Monte um projeto de transformação completo de 4 semanas.`,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, generation_type, onboarding, scores } = await req.json();

    if (!user_id || !generation_type) {
      return new Response(JSON.stringify({ error: "Missing user_id or generation_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["challenge", "project"].includes(generation_type)) {
      return new Response(JSON.stringify({ error: "Invalid generation_type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Determine difficulty
    const history = onboarding?.training_history || "irregular";
    const diffLevel = ["never", "stopped_long_ago"].includes(history) ? 1 : ["irregular", "weekly"].includes(history) ? 2 : 3;

    // Determine equipment
    const location = onboarding?.workout_location || "gym";
    const allowedEquipment = location === "home"
      ? ["body weight", "dumbbell", "resistance band", "stability ball", "roller"]
      : ["barbell", "dumbbell", "cable", "leverage machine", "smith machine", "ez barbell", "kettlebell", "body weight", "medicine ball", "stability ball", "resistance band"];

    // Fetch exercises
    const { data: allExercises, error: exErr } = await supabase
      .from("curated_exercises")
      .select("id, name_pt, target, body_part, equipment, difficulty_level, focus_category, contraindications")
      .eq("active", true)
      .lte("difficulty_level", diffLevel);

    if (exErr) throw exErr;

    const painAreas = onboarding?.pain_areas || [];
    const filtered = (allExercises || []).filter((ex: any) => {
      if (!allowedEquipment.includes(ex.equipment)) return false;
      if (painAreas.some((p: string) => (ex.contraindications || []).includes(p))) return false;
      return true;
    });

    // Build prompts
    const prompts = generation_type === "challenge"
      ? buildChallengePrompt(onboarding || {}, filtered)
      : buildProjectPrompt(onboarding || {}, filtered);

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: prompts.system },
          { role: "user", content: prompts.user },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_program",
              description: "Create a workout program (challenge or project)",
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
        tool_choice: { type: "function", function: { name: "create_program" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      if (status === 429) return new Response(JSON.stringify({ error: "429" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "402" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return a tool call");

    const plan = JSON.parse(toolCall.function.arguments);

    // Save to database
    const levelMap: Record<number, string> = { 1: "beginner", 2: "intermediate", 3: "advanced" };
    const daysPerWeek = generation_type === "challenge"
      ? Math.min(plan.workouts?.length || 3, 5)
      : onboarding?.days_per_week || 3;

    const { data: program, error: progErr } = await supabase
      .from("workout_programs")
      .insert({
        title: plan.program_title,
        description: plan.program_description,
        level: levelMap[diffLevel] || "beginner",
        days_per_week: daysPerWeek,
        duration_minutes: generation_type === "challenge" ? 25 : 45,
        program_type: generation_type,
        is_active: true,
      })
      .select()
      .single();

    if (progErr) throw progErr;

    // Build curated exercise lookup
    const curatedMap: Record<string, any> = {};
    for (const ex of filtered) curatedMap[ex.id] = ex;

    // ─── MuscleWiki media resolution ───
    const MUSCLEWIKI_API_KEY = Deno.env.get("MUSCLEWIKI_API_KEY");
    const projectId = Deno.env.get("SUPABASE_URL")?.replace("https://", "").replace(".supabase.co", "") || "";

    const EXERCISE_PT_EN: Record<string, string> = {
      "agachamento": "squat", "agachamento livre": "barbell squat", "agachamento smith": "smith machine squat",
      "agachamento sem peso": "bodyweight squat", "agachamento bulgaro": "bulgarian split squat",
      "leg press": "leg press", "leg press 45": "leg press", "extensora": "leg extension", "flexora": "leg curl",
      "cadeira extensora": "leg extension", "cadeira flexora": "leg curl", "stiff": "romanian deadlift",
      "levantamento terra": "deadlift", "hip thrust": "hip thrust", "elevacao pelvica": "hip thrust",
      "ponte de gluteo": "glute bridge", "ponte de gluteos": "glute bridge", "abdutora": "hip abduction",
      "adutora": "hip adduction", "cadeira abdutora": "hip abduction machine", "cadeira adutora": "hip adduction machine",
      "panturrilha": "calf raise", "panturrilha em pe": "standing calf raise", "panturrilha sentada": "seated calf raise",
      "supino reto": "bench press", "supino inclinado": "incline bench press", "supino declinado": "decline bench press",
      "crucifixo": "dumbbell fly", "crucifixo inclinado": "incline dumbbell fly",
      "puxada frontal": "lat pulldown", "puxada": "lat pulldown",
      "remada curvada": "bent over row", "remada baixa": "seated cable row", "remada cavaleiro": "t-bar row",
      "remada alta": "upright row", "desenvolvimento": "overhead press",
      "elevacao lateral": "lateral raise", "elevacao frontal": "front raise",
      "rosca direta": "barbell curl", "rosca alternada": "dumbbell curl", "rosca martelo": "hammer curl",
      "rosca scott": "preacher curl", "rosca concentrada": "concentration curl",
      "triceps pulley": "tricep pushdown", "triceps testa": "skull crusher", "triceps corda": "tricep rope pushdown",
      "triceps frances": "overhead tricep extension",
      "abdominal": "crunch", "abdominal infra": "reverse crunch", "abdominal obliquo": "oblique crunch",
      "prancha": "plank", "prancha frontal": "plank",
      "afundo": "lunge", "avanco": "lunge", "passada": "lunge",
      "bulgaro": "bulgarian split squat", "kickback": "glute kickback", "gluteo kickback": "glute kickback",
      "terra romeno": "romanian deadlift", "mesa flexora": "lying leg curl",
      "hack squat": "hack squat", "voador": "pec deck fly", "cross over": "cable crossover",
      "crossover": "cable crossover", "face pull": "face pull", "encolhimento": "shrug",
      "flexao": "push up", "mergulho": "dip", "pullover": "pullover",
      "elevacao de pernas": "leg raise", "superman": "superman", "bird dog": "bird dog",
      "good morning": "good morning", "bom dia": "good morning",
    };

    function normalizeForLookup(name: string): string {
      return name.replace(/\s*\(.*\)$/, "").toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    function findEnName(namePt: string): string | null {
      const norm = normalizeForLookup(namePt);
      if (EXERCISE_PT_EN[norm]) return EXERCISE_PT_EN[norm];
      const singular = norm.replace(/s$/, "");
      if (EXERCISE_PT_EN[singular]) return EXERCISE_PT_EN[singular];
      return null;
    }

    async function resolveMuscleWikiMedia(namePt: string): Promise<{ image_url: string | null; video_url: string | null }> {
      if (!MUSCLEWIKI_API_KEY) return { image_url: null, video_url: null };
      try {
        const enName = findEnName(namePt);
        const queries = enName
          ? [enName, namePt.replace(/\s*\(.*\)$/, "")]
          : [namePt, namePt.replace(/\s*\(.*\)$/, "")];

        for (const q of queries) {
          const res = await fetch(
            `https://api.musclewiki.com/search?q=${encodeURIComponent(q)}&limit=1`,
            { headers: { "X-API-Key": MUSCLEWIKI_API_KEY } }
          );
          if (!res.ok) continue;
          const results = await res.json();
          if (results.length > 0) {
            const ex = results[0];
            const video = ex.videos?.find((v: any) => v.gender === "female") || ex.videos?.[0];
            const videoUrl = video?.url
              ? `https://${projectId}.supabase.co/functions/v1/musclewiki-media?url=${encodeURIComponent(video.url)}`
              : null;
            const imageUrl = video?.og_image || null;
            if (videoUrl || imageUrl) return { image_url: imageUrl, video_url: videoUrl };
          }
        }
      } catch (e) {
        console.warn("MuscleWiki search failed for:", namePt, e);
      }
      return { image_url: null, video_url: null };
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

      // Resolve MuscleWiki media in parallel
      const exerciseInserts = await Promise.all(
        (wk.exercises || []).map(async (ex: any) => {
          const curated = curatedMap[ex.curated_exercise_id];
          const mwMedia = await resolveMuscleWikiMedia(ex.name);
          return {
            workout_id: workout.id,
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            rest_seconds: ex.rest_seconds,
            sort_order: ex.sort_order,
            image_url: mwMedia.image_url,
            video_url: mwMedia.video_url,
            description: curated?.simple_instruction_pt || null,
          };
        })
      );

      if (exerciseInserts.length > 0) {
        const { error: exInsErr } = await supabase.from("exercises").insert(exerciseInserts);
        if (exInsErr) throw exInsErr;
      }
    }

    // Add to user_programs
    await supabase.from("user_programs").upsert({
      user_id,
      program_id: program.id,
    }, { onConflict: "user_id,program_id" });

    return new Response(
      JSON.stringify({ success: true, program_id: program.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-challenge error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
