import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Shield, Star, Lock } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const Paywall = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      navigate("/app/login");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">
          Assine para continuar
        </h1>
        <p className="text-muted-foreground text-sm mb-8">
          Desbloqueie seus treinos personalizados — grátis por tempo limitado.
        </p>

        <div className="space-y-3 text-left mb-8">
          {[
            "Plano de treino personalizado com IA",
            "Treinos que evoluem toda semana",
            "Comunidade de mulheres treinando juntas",
            "Vídeo de cada exercício",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <span className="text-foreground text-sm">{item}</span>
            </div>
          ))}
        </div>

        <div className="bg-card border-2 border-primary rounded-2xl p-6 mb-6">
          <div className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-3">
            <Star className="w-3 h-3" /> ACESSO IMEDIATO
          </div>
          <p className="text-2xl font-bold text-foreground">R$ 0,00<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
          <p className="text-xs text-muted-foreground mt-1">Grátis por tempo limitado</p>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={loading}
          size="lg"
          className="w-full rounded-full py-6 text-base font-semibold"
        >
          {loading ? "Processando..." : "Pagar R$ 19,90 e começar agora"}
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
    </div>
  );
};

export default Paywall;
