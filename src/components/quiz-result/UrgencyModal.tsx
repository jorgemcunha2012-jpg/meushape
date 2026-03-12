import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UrgencyModalProps {
  firstName: string;
  bottleneck: string;
  onCTA: () => void;
}

const UrgencyModal = ({ firstName, bottleneck, onCTA }: UrgencyModalProps) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setOpen(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: "#111" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <div className="flex justify-end p-3 pb-0">
              <button onClick={() => setOpen(false)} className="text-white/30 hover:text-white/60">
                <X size={20} />
              </button>
            </div>

            <div className="px-5 pb-6">
              {/* Headline */}
              <h3
                className="text-lg font-black text-white mb-4"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {firstName}, não deixe pra depois
              </h3>

              {/* Negative stat */}
              <div
                className="flex items-start gap-3 rounded-xl p-3 mb-3"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <AlertTriangle size={18} className="shrink-0 mt-0.5" color="#EF4444" />
                <p className="text-xs text-red-300 leading-relaxed">
                  <strong>87% das mulheres</strong> que adiam o início perdem a motivação em menos de 2 semanas.
                  Seu gargalo em <strong>{bottleneck}</strong> só tende a piorar sem ação.
                </p>
              </div>

              {/* Positive stat */}
              <div
                className="flex items-start gap-3 rounded-xl p-3 mb-5"
                style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}
              >
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" color="#10B981" />
                <p className="text-xs text-emerald-300 leading-relaxed">
                  Com o plano personalizado, mulheres como você melhoram <strong>em média 40%</strong> nas
                  primeiras 4 semanas. Treinos guiados + comunidade = consistência.
                </p>
              </div>

              {/* CTA */}
              <Button
                onClick={() => {
                  setOpen(false);
                  onCTA();
                }}
                className="w-full rounded-full py-6 text-sm font-bold"
                style={{
                  background: "linear-gradient(135deg, #FF6B2B, #F59E0B)",
                  color: "#fff",
                }}
              >
                Começar agora — 7 dias grátis
                <ArrowRight size={16} className="ml-1" />
              </Button>

              <p className="text-[10px] text-white/30 text-center mt-3">
                Cancele quando quiser • Garantia de 30 dias
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UrgencyModal;
