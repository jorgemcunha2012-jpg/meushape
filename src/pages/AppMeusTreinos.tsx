import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useGenerationLimits, type GenerationType } from "@/hooks/useGenerationLimits";
import { SolarPage, SolarHeader, useSolar } from "@/components/SolarLayout";
import { motion } from "framer-motion";
import { Dumbbell, Zap, Trophy, Lock, ShoppingCart, Sparkles, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import AIGenerationWizard from "@/components/AIGenerationWizard";

const EXTRA_PRICE_ID = "price_1TAEyoLKftklAHDET9mWGjee";

interface ActiveProgram {
  id: string;
  title: string;
  description: string | null;
  days_per_week: number;
  duration_minutes: number;
  level: string;
  program_type: string;
}

interface ExtraPurchase {
  id: string;
  purchase_type: string;
  program_id: string | null;
  purchased_at: string;
  status: string;
  program?: ActiveProgram;
}

const typeConfig: Record<GenerationType, { label: string; icon: typeof Dumbbell; emoji: string; period: string }> = {
  plan: { label: "Plano de Treino", icon: Dumbbell, emoji: "🏋️‍♀️", period: "semana" },
  challenge: { label: "Desafio Especial", icon: Zap, emoji: "🔥", period: "mês" },
  project: { label: "Projeto", icon: Trophy, emoji: "🏆", period: "mês" },
};

const AppMeusTreinos = () => {
  const S = useSolar();
  const { user, subscriptionLoading } = useAuth();
  const navigate = useNavigate();
  const limits = useGenerationLimits(user?.id);

  const [activePrograms, setActivePrograms] = useState<Record<GenerationType, ActiveProgram | null>>({
    plan: null, challenge: null, project: null,
  });
  const [extras, setExtras] = useState<ExtraPurchase[]>([]);
  const [purchaseModal, setPurchaseModal] = useState<GenerationType | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [generatingType, setGeneratingType] = useState<"challenge" | "project" | null>(null);

  useEffect(() => {
    if (!subscriptionLoading && !user) navigate("/app/login");
    if (user) fetchData();
  }, [user, subscriptionLoading, limits.loading]);

  const fetchData = async () => {
    if (!user || limits.loading) return;

    // Fetch active programs for each type
    const programIds = (["plan", "challenge", "project"] as GenerationType[])
      .map(t => limits[t].activeProgramId)
      .filter(Boolean) as string[];

    if (programIds.length > 0) {
      const { data: programs } = await supabase
        .from("workout_programs")
        .select("*")
        .in("id", programIds);

      if (programs) {
        const map: Record<GenerationType, ActiveProgram | null> = { plan: null, challenge: null, project: null };
        for (const type of ["plan", "challenge", "project"] as GenerationType[]) {
          const pid = limits[type].activeProgramId;
          if (pid) {
            const prog = programs.find(p => p.id === pid);
            if (prog) map[type] = prog as ActiveProgram;
          }
        }
        setActivePrograms(map);
      }
    }

    // Fetch extras
    const { data: purchases } = await supabase
      .from("user_purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("purchased_at", { ascending: false });

    if (purchases && purchases.length > 0) {
      const extraProgramIds = purchases.map(p => p.program_id).filter(Boolean) as string[];
      let extraPrograms: ActiveProgram[] = [];
      if (extraProgramIds.length > 0) {
        const { data } = await supabase.from("workout_programs").select("*").in("id", extraProgramIds);
        if (data) extraPrograms = data as ActiveProgram[];
      }
      setExtras(purchases.map(p => ({
        ...p,
        program: extraPrograms.find(pr => pr.id === p.program_id),
      })));
    }
  };

  const handlePurchaseExtra = async (type: GenerationType) => {
    if (!user) return;
    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-extra-purchase", {
        body: { purchase_type: type },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast.error("Erro ao iniciar compra. Tente novamente.");
      console.error(err);
    } finally {
      setPurchasing(false);
      setPurchaseModal(null);
    }
  };

  const handleGenerateNew = (type: GenerationType) => {
    const limit = limits[type];
    if (!limit.canGenerate) {
      setPurchaseModal(type);
      return;
    }
    if (type === "plan") {
      navigate("/app/workouts");
    } else {
      setGeneratingType(type);
    }
  };

  const cardStyle = {
    backgroundColor: S.card,
    border: `1px solid ${S.cardBorder}`,
    borderRadius: "1.25rem",
    boxShadow: "0 2px 12px rgba(234,88,12,0.04)",
  };

  const formatRenewalDate = (lastAt: string | null, type: GenerationType): string => {
    if (!lastAt) return "Disponível agora";
    const last = new Date(lastAt);
    const cooldown = type === "plan" ? 7 : 30;
    const renewalDate = new Date(last.getTime() + cooldown * 24 * 60 * 60 * 1000);
    return renewalDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
  };

  return (
    <SolarPage>
      <SolarHeader title="Meus Treinos" showBack />

      <section className="px-5 py-4">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Active items */}
          {(["plan", "challenge", "project"] as GenerationType[]).map((type, i) => {
            const config = typeConfig[type];
            const limit = limits[type];
            const program = activePrograms[type];
            const Icon = config.icon;

            return (
              <motion.div
                key={type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                style={cardStyle}
                className="overflow-hidden"
              >
                {/* Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                      style={{ background: `linear-gradient(135deg, ${S.orange}15, ${S.amber}15)` }}
                    >
                      {config.emoji}
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-sm" style={{ fontWeight: 700, color: S.text }}>
                        {config.label}
                      </p>
                      <p className="text-[10px]" style={{ color: S.textMuted }}>
                        1 por {config.period}
                      </p>
                    </div>
                    {!limit.canGenerate && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: `${S.orange}12` }}>
                        <Clock size={10} style={{ color: S.orange }} />
                        <span className="text-[10px] font-semibold" style={{ color: S.orange }}>
                          {limit.daysUntilNext}d
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Active program */}
                  {program ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => navigate(`/app/program/${program.id}`)}
                      className="w-full text-left p-3 rounded-xl flex items-center gap-3"
                      style={{ background: `${S.orange}08`, border: `1px solid ${S.orange}15` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: S.text }}>
                          {program.title}
                        </p>
                        {program.description && (
                          <p className="text-[11px] truncate" style={{ color: S.textMuted }}>
                            {program.description}
                          </p>
                        )}
                        <p className="text-[10px] mt-1" style={{ color: S.textSub }}>
                          {program.days_per_week}x/sem • {program.duration_minutes} min
                        </p>
                      </div>
                      <ChevronRight size={16} style={{ color: S.cardBorder }} />
                    </motion.button>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs" style={{ color: S.textMuted }}>
                        Nenhum {config.label.toLowerCase()} ativo
                      </p>
                    </div>
                  )}
                </div>

                {/* Action footer */}
                <div className="px-4 pb-4 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 rounded-xl text-xs h-9"
                    onClick={() => handleGenerateNew(type)}
                    disabled={!limit.canGenerate && type !== "plan"}
                    style={
                      limit.canGenerate
                        ? { background: `linear-gradient(135deg, ${S.orange}, ${S.amber})`, color: "#fff" }
                        : undefined
                    }
                    variant={limit.canGenerate ? "default" : "outline"}
                  >
                    {limit.canGenerate ? (
                      <>
                        <Sparkles size={12} className="mr-1" />
                        Gerar Novo
                      </>
                    ) : (
                      <>
                        <Lock size={12} className="mr-1" />
                        Em {limit.daysUntilNext} dias
                      </>
                    )}
                  </Button>

                  {!limit.canGenerate && type !== "plan" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs h-9"
                      onClick={() => setPurchaseModal(type)}
                    >
                      <ShoppingCart size={12} className="mr-1" />
                      R$ 9,90
                    </Button>
                  )}
                </div>

                {/* Renewal info */}
                {limit.lastGeneratedAt && (
                  <div className="px-4 pb-3">
                    <p className="text-[10px]" style={{ color: S.textSub }}>
                      Próximo disponível: {formatRenewalDate(limit.lastGeneratedAt, type)}
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}

          {/* Extras Section */}
          {extras.length > 0 && (
            <div className="pt-2">
              <h2 className="font-display text-sm mb-3 px-1" style={{ fontWeight: 800, color: S.text }}>
                ⭐ Extras Comprados
              </h2>
              <div className="space-y-2">
                {extras.map((extra) => (
                  <motion.button
                    key={extra.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => extra.program_id && navigate(`/app/program/${extra.program_id}`)}
                    className="w-full text-left p-4 flex items-center gap-3"
                    style={cardStyle}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
                      style={{ background: `linear-gradient(135deg, ${S.orange}15, ${S.amber}15)` }}>
                      {extra.purchase_type === "challenge" ? "🔥" : "🏆"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: S.text }}>
                        {extra.program?.title || `${extra.purchase_type === "challenge" ? "Desafio" : "Projeto"} Extra`}
                      </p>
                      <p className="text-[10px]" style={{ color: S.textMuted }}>
                        Comprado em {new Date(extra.purchased_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <ChevronRight size={16} style={{ color: S.cardBorder }} />
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Generation Wizard Dialog */}
      <Dialog open={!!generatingType} onOpenChange={() => setGeneratingType(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl p-0 overflow-hidden">
          {generatingType && (
            <AIGenerationWizard
              userId={user!.id}
              type={generatingType}
              onComplete={() => {
                setGeneratingType(null);
                limits.refresh();
                fetchData();
              }}
              onCancel={() => setGeneratingType(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Purchase Modal */}
      <Dialog open={!!purchaseModal} onOpenChange={() => setPurchaseModal(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              {purchaseModal === "challenge" ? "🔥 Desafio Extra" : "🏆 Projeto Extra"}
            </DialogTitle>
            <DialogDescription>
              Você já gerou seu {purchaseModal === "challenge" ? "desafio" : "projeto"} deste mês.
              Compre um extra por apenas <strong className="text-foreground">R$ 9,90</strong>!
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-xl bg-muted/50 text-center">
            <p className="text-3xl font-bold text-foreground mb-1">R$ 9,90</p>
            <p className="text-xs text-muted-foreground">Pagamento único via Stripe</p>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setPurchaseModal(null)} className="flex-1 rounded-xl">
              Cancelar
            </Button>
            <Button
              onClick={() => purchaseModal && handlePurchaseExtra(purchaseModal)}
              disabled={purchasing}
              className="flex-1 rounded-xl"
              style={{ background: `linear-gradient(135deg, ${S.orange}, ${S.amber})` }}
            >
              {purchasing ? "Processando..." : "Comprar Extra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SolarPage>
  );
};

export default AppMeusTreinos;
