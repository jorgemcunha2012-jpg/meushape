import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Timer, Target, Users } from "lucide-react";

const trackVisit = (step: string) => {
  const sessionId = sessionStorage.getItem("funnel_session") || crypto.randomUUID();
  sessionStorage.setItem("funnel_session", sessionId);
  supabase.from("funnel_visits").insert({ step, session_id: sessionId }).then();
};

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    trackVisit("landing");
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-rose-soft px-4 py-2 rounded-full text-sm text-primary font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Quiz gratuito • 3 min
          </div>

          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-tight mb-6">
            Descubra por que você
            <span className="text-primary"> não tá tendo resultado</span> no treino
          </h1>

          <p className="text-lg text-muted-foreground mb-10 leading-relaxed max-w-md mx-auto">
            Faça o teste e receba seu diagnóstico fitness personalizado com um plano feito pra você.
          </p>

          <Button
            size="lg"
            className="rounded-full px-10 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate("/quiz")}
          >
            Fazer o teste grátis
            <ArrowRight className="w-5 h-5 ml-1" />
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            82% das mulheres treinam errado sem saber
          </p>
        </div>
      </section>

      {/* Trust badges */}
      <section className="px-4 pb-16">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-4">
          {[
            { icon: Timer, label: "Apenas 3 min" },
            { icon: Target, label: "Diagnóstico real" },
            { icon: Users, label: "87 mil+ mulheres" },
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
