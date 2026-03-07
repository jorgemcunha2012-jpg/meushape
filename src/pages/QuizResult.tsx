import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { quizProfiles } from "@/lib/quizData";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const QuizResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profileId, name } = (location.state as any) || {};

  const profile = quizProfiles[profileId] || quizProfiles.iniciante;
  const firstName = name?.split(" ")[0] || "linda";

  const handleCheckout = () => {
    // TODO: Stripe checkout integration
    alert("Checkout com Stripe será integrado aqui!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-lg mx-auto w-full text-center animate-fade-in-up">
        {/* Profile emoji */}
        <div className="text-6xl mb-6">{profile.emoji}</div>

        <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
          {firstName}, você é{" "}
          <span className="text-primary">{profile.title}</span>!
        </h1>

        <p className="text-lg text-muted-foreground mb-6">{profile.subtitle}</p>

        <div className="bg-card border border-border rounded-2xl p-6 mb-8 text-left">
          <p className="text-foreground leading-relaxed">{profile.description}</p>
        </div>

        {/* Benefits */}
        <div className="text-left mb-8 space-y-3">
          <h3 className="font-display text-lg font-semibold text-foreground mb-4 text-center">
            O que você vai receber:
          </h3>
          {[
            "Plano de treino personalizado para o seu perfil",
            "Treinos novos toda semana",
            "Acompanhamento do seu progresso",
            "7 dias grátis para experimentar",
          ].map((benefit) => (
            <div key={benefit} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <span className="text-foreground text-sm">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Button
          size="lg"
          onClick={handleCheckout}
          className="w-full rounded-full py-6 text-base font-semibold shadow-lg"
        >
          Começar meus 7 dias grátis
          <ArrowRight className="w-5 h-5 ml-1" />
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Cancele quando quiser. Sem compromisso.
        </p>
      </div>
    </div>
  );
};

export default QuizResult;
