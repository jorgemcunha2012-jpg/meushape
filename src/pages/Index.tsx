import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Timer, Target } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-rose-soft px-4 py-2 rounded-full text-sm text-primary font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Quiz gratuito • 2 min
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
            Descubra seu perfil
            <span className="text-primary"> de treino ideal</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-md mx-auto">
            Responda algumas perguntas rápidas e receba um plano personalizado para o seu momento.
          </p>

          <Button
            size="lg"
            className="rounded-full px-10 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate("/quiz")}
          >
            Começar agora
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </section>

      {/* Trust badges */}
      <section className="px-4 pb-16">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-4">
          {[
            { icon: Timer, label: "Apenas 2 min" },
            { icon: Target, label: "100% personalizado" },
            { icon: Sparkles, label: "Resultado imediato" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl border border-border">
              <Icon className="w-5 h-5 text-primary" />
              <span className="text-xs text-muted-foreground text-center font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
