import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calculateAxisScores, diagnosisTexts, generateSummary, type AxisScores } from "@/lib/quizData";
import { ArrowRight, CheckCircle2, Shield, Star, Lock, Loader2 } from "lucide-react";
import { toast } from "sonner";

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, email, answers, bodyAnalysis } = (location.state as any) || {};

  const scores = calculateAxisScores(answers || {});
  const firstName = name?.split(" ")[0] || "linda";
  const summary = generateSummary(scores);

  const [password, setPassword] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!email || !password || password.length < 6) {
      toast.error("Crie uma senha com pelo menos 6 caracteres.");
      return;
    }

    setCheckingOut(true);
    try {
      // 1. Sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: window.location.origin + "/app",
        },
      });

      // If user already exists, try sign in
      if (signUpError?.message?.includes("already registered")) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else if (signUpError) {
        throw signUpError;
      }

      // 2. Create checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Erro ao processar. Tente novamente.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="px-4 pt-12 pb-8">
        <div className="max-w-lg mx-auto text-center animate-fade-in-up">
          <p className="text-sm text-primary font-medium mb-2">Seu Diagnóstico Fitness</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
            {firstName}, seu plano de treino personalizado tá pronto!
          </h1>
          <p className="text-muted-foreground">
            Baseado nas suas respostas, montamos seu diagnóstico completo.
          </p>
        </div>
      </section>

      {/* Body Analysis Section */}
      {bodyAnalysis && bodyAnalysis.body_type !== "indefinido" && (
        <section className="px-4 pb-8">
          <div className="max-w-lg mx-auto">
            <div className="bg-card border border-primary/20 rounded-2xl p-6">
              <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                📸 Sua Análise Corporal
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Biotipo estimado</span>
                  <span className="text-sm font-semibold text-foreground capitalize">{bodyAnalysis.body_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">% Gordura estimado</span>
                  <span className="text-sm font-semibold text-foreground">{bodyAnalysis.estimated_bf_range}</span>
                </div>
                {bodyAnalysis.strengths && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">💪 Pontos fortes</span>
                    <p className="text-sm text-foreground">{bodyAnalysis.strengths}</p>
                  </div>
                )}
                {bodyAnalysis.focus_areas && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">🎯 Foco sugerido</span>
                    <p className="text-sm text-foreground">{bodyAnalysis.focus_areas}</p>
                  </div>
                )}
                {bodyAnalysis.posture_notes && (
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1">🧘 Postura</span>
                    <p className="text-sm text-foreground">{bodyAnalysis.posture_notes}</p>
                  </div>
                )}
                {bodyAnalysis.recommendation && (
                  <div className="mt-2 pt-3 border-t border-border">
                    <p className="text-sm text-primary font-medium">✨ {bodyAnalysis.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Radar / Bar Chart */}
      <section className="px-4 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="space-y-5">
              {diagnosisTexts.map((diag) => {
                const score = scores[diag.axis as keyof AxisScores];
                return (
                  <div key={diag.axis}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span>{diag.emoji}</span> {diag.label}
                      </span>
                      <span className="text-sm font-bold text-primary">{score}/10</span>
                    </div>
                    <div className="h-3 bg-secondary rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${score * 10}%`,
                          backgroundColor: score <= 3
                            ? "hsl(0, 70%, 60%)"
                            : score <= 6
                            ? "hsl(40, 80%, 55%)"
                            : "hsl(140, 60%, 45%)",
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {diag.getText(score)}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-foreground font-medium text-sm leading-relaxed">
                💡 {summary}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="px-4 pb-8">
        <div className="max-w-lg mx-auto">
          <h3 className="font-display text-xl font-bold text-foreground mb-4 text-center">
            O que você recebe
          </h3>
          <div className="space-y-3">
            {[
              "Plano de treino personalizado pro seu nível",
              "Vídeo de cada exercício mostrando como fazer",
              "Contagem de repetição e tempo de descanso",
              "Treinos que evoluem com você toda semana",
              "Treinos complementares em casa quando necessário",
              "Comunidade de mulheres treinando juntas",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-foreground text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing + Signup */}
      <section className="px-4 pb-8">
        <div className="max-w-lg mx-auto">
          <div className="bg-card border-2 border-primary rounded-2xl p-6 text-center">
            <div className="inline-flex items-center gap-1 bg-rose-soft text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
              <Star className="w-3 h-3" /> OFERTA DE BOAS-VINDAS
            </div>
            <h3 className="font-display text-2xl font-bold text-foreground mb-1">
              7 dias grátis
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Depois, apenas R$ 19,90/mês. Cancele quando quiser.
            </p>

            {/* Password field */}
            <div className="mb-4 text-left">
              <label className="text-xs text-muted-foreground mb-1 block">Crie uma senha para acessar o app</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12 rounded-xl"
                  minLength={6}
                />
              </div>
            </div>

            <Button
              size="lg"
              onClick={handleCheckout}
              disabled={checkingOut || password.length < 6}
              className="w-full rounded-full py-6 text-base font-semibold shadow-lg"
            >
              {checkingOut ? (
                <><Loader2 className="w-5 h-5 mr-1 animate-spin" /> Processando...</>
              ) : (
                <>Começar meus 7 dias grátis <ArrowRight className="w-5 h-5 ml-1" /></>
              )}
            </Button>

            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" /> Garantia 30 dias
              </span>
              <span>•</span>
              <span>Cancele a qualquer momento</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Se você seguir o plano por 30 dias e não sentir diferença, devolvemos seu dinheiro. Sem burocracia.
          </p>
        </div>
      </section>
    </div>
  );
};

export default QuizResult;
