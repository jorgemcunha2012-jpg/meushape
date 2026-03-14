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
    <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-5">
        <div className="max-w-lg mx-auto text-center animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-rose-soft px-3 py-1.5 rounded-full text-xs text-primary font-medium mb-5">
            <Sparkles className="w-3.5 h-3.5" />
            Quiz gratuito • 3 min
          </div>

          <h1 className="font-display text-3xl font-bold text-foreground leading-tight mb-4">
            Descubra por que você
            <span className="text-primary"> não tá tendo resultado</span> no treino
          </h1>

          <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-xs mx-auto">
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

          <p className="text-[11px] text-muted-foreground mt-3">
            82% das mulheres treinam errado sem saber
          </p>
        </div>
      </section>

      {/* Trust badges */}
      <section className="px-5 pb-6 shrink-0">
        <div className="max-w-lg mx-auto flex justify-center">
          {[
            { icon: Timer, label: "Apenas 3 min" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 p-3 bg-card rounded-xl border border-border">
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-[10px] text-muted-foreground text-center font-medium">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
