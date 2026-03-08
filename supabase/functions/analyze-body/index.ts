import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, image_base64 } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ANTI-ABUSE: Check if analysis already exists for this email
    const { data: existing } = await supabase
      .from("body_analyses")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (existing?.analysis_result && Object.keys(existing.analysis_result).length > 0) {
      console.log("Returning cached analysis for:", email);
      return new Response(
        JSON.stringify({ analysis: existing.analysis_result, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!image_base64) {
      return new Response(JSON.stringify({ error: "Imagem é obrigatória" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upload image to storage
    const imageBuffer = Uint8Array.from(atob(image_base64.replace(/^data:image\/\w+;base64,/, "")), (c) =>
      c.charCodeAt(0)
    );
    const imagePath = `${crypto.randomUUID()}.jpg`;

    await supabase.storage.from("body-photos").upload(imagePath, imageBuffer, {
      contentType: "image/jpeg",
      upsert: false,
    });

    // Call Lovable AI with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `Você é uma especialista em avaliação corporal feminina. Analise a foto enviada e forneça uma avaliação visual gentil, motivadora e profissional. 
            
IMPORTANTE: 
- Seja respeitosa e empática. Nunca use linguagem negativa sobre o corpo.
- Base suas estimativas em padrões visuais gerais. Deixe claro que é uma estimativa visual.
- Foque em pontos positivos e oportunidades de melhoria.
- Use linguagem brasileira informal mas profissional.
- Se a imagem não for de um corpo humano ou não for adequada, retorne body_type "indefinido" e uma mensagem educada.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analise esta foto corporal e forneça sua avaliação estruturada.",
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${image_base64.replace(/^data:image\/\w+;base64,/, "")}`,
                },
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "body_analysis_result",
              description: "Retorna o resultado estruturado da análise corporal visual.",
              parameters: {
                type: "object",
                properties: {
                  body_type: {
                    type: "string",
                    enum: ["ectomorfo", "mesomorfo", "endomorfo", "misto", "indefinido"],
                    description: "Biotipo estimado visualmente",
                  },
                  estimated_bf_range: {
                    type: "string",
                    description: "Faixa estimada de percentual de gordura, ex: '20-25%'",
                  },
                  posture_notes: {
                    type: "string",
                    description: "Observações sobre postura (ombros, quadril, coluna) de forma gentil",
                  },
                  strengths: {
                    type: "string",
                    description: "Pontos fortes observados no físico (ex: boa base muscular nas pernas)",
                  },
                  focus_areas: {
                    type: "string",
                    description: "Áreas que podem ser trabalhadas com treino, de forma motivadora",
                  },
                  recommendation: {
                    type: "string",
                    description: "Recomendação curta e motivadora de 1-2 frases sobre tipo de treino ideal",
                  },
                },
                required: [
                  "body_type",
                  "estimated_bf_range",
                  "posture_notes",
                  "strengths",
                  "focus_areas",
                  "recommendation",
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "body_analysis_result" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI error:", status, errText);
      throw new Error("Erro na análise de IA");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let analysisResult;

    if (toolCall?.function?.arguments) {
      analysisResult = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to extract from content
      analysisResult = {
        body_type: "indefinido",
        estimated_bf_range: "N/A",
        posture_notes: "Não foi possível analisar a imagem com precisão.",
        strengths: "Continue se cuidando!",
        focus_areas: "Treino regular vai te ajudar muito.",
        recommendation: "Consulte um profissional para uma avaliação mais detalhada.",
      };
    }

    // Save to database (upsert with email unique constraint)
    const { error: insertError } = await supabase.from("body_analyses").upsert(
      {
        email,
        image_path: imagePath,
        analysis_result: analysisResult,
        model_used: "google/gemini-2.5-pro",
      },
      { onConflict: "email" }
    );

    if (insertError) {
      console.error("DB insert error:", insertError);
    }

    return new Response(
      JSON.stringify({ analysis: analysisResult, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-body error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
