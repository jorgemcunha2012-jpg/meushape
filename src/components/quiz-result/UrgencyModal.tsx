import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
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
                className="text-lg font-black text-white mb-3"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {firstName}, seu plano tá pronto
              </h3>

              <p className="text-sm text-white/60 leading-relaxed mb-5">
                Seu gargalo em <strong className="text-white/80">{bottleneck}</strong> tende a piorar sem ação. Com o plano personalizado, os primeiros resultados aparecem nas primeiras 4 semanas.
              </p>

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
                Escolher meu plano
                <ArrowRight size={16} className="ml-1" />
              </Button>

              <p className="text-[10px] text-white/30 text-center mt-3">
                Garantia de 30 dias • Cancele quando quiser
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UrgencyModal;
