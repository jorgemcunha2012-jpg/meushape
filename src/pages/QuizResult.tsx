import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { calculateAxisScores, diagnosisTexts, generateSummary, type AxisScores } from "@/lib/quizData";
import { ArrowRight, CheckCircle2, Shield, Star } from "lucide-react";

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, email, answers } = (location.state as any) || {};

  const scores = calculateAxisScores(answers || {});
  const firstName = name?.split(" ")[0] || "linda";
  const summary = generateSummary(scores);

  const handleCheckout = () => {
    // TODO: Stripe checkout
    alert("Checkout com Stripe será integrado aqui!");
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
                    {/* Bar */}
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

            {/* Summary */}
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

      {/* Pricing */}
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
              Depois, apenas R$ XX,XX/mês. Cancele quando quiser.
            </p>

            <Button
              size="lg"
              onClick={handleCheckout}
              className="w-full rounded-full py-6 text-base font-semibold shadow-lg"
            >
              Começar meus 7 dias grátis
              <ArrowRight className="w-5 h-5 ml-1" />
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
