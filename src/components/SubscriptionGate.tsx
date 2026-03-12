import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Lock, Loader2, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const SubscriptionGate = () => {
  const { subscriptionLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Erro ao abrir checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-2">
          Assinatura necessária
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Assine por R$ 0,00/mês e tenha acesso a todos os seus treinos personalizados.
        </p>
        <div className="inline-flex items-center gap-1 bg-rose-soft text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <Star className="w-3 h-3" /> R$ 0,00/mês após o teste
        </div>
        <Button
          size="lg"
          onClick={handleCheckout}
          disabled={loading}
          className="w-full rounded-full py-6 text-base font-semibold shadow-lg"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>Pagar R$ 19,90 e começar agora <ArrowRight className="w-5 h-5 ml-1" /></>
          )}
        </Button>
        <button
          onClick={() => navigate("/app/login")}
          className="text-sm text-muted-foreground hover:text-foreground mt-4 block mx-auto"
        >
          Já tem assinatura? Entrar
        </button>
      </div>
    </div>
  );
};

export default SubscriptionGate;
