import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Dumbbell, TrendingUp, Users, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { useEffect } from "react";

const nextSteps = [
  { icon: Dumbbell, title: "Seu primeiro treino", desc: "Comece agora com um treino personalizado para seu nível." },
  { icon: TrendingUp, title: "Acompanhe sua evolução", desc: "Veja gráficos e métricas da sua progressão semana a semana." },
  { icon: Users, title: "Entre na comunidade", desc: "Conecte-se com milhares de mulheres na mesma jornada." },
];

const QuizSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.4 }, colors: ["#FF6B2B", "#F59E0B", "#10B981"] });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-5 py-10" style={{ background: "#0A0A0A" }}>
      {/* Success Icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{ background: "rgba(16,185,129,0.15)", border: "2px solid rgba(16,185,129,0.3)" }}
      >
        <CheckCircle2 size={40} style={{ color: "#10B981" }} />
      </motion.div>

      {/* Title */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h1
          className="text-2xl font-black text-white mb-2"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Pagamento confirmado! 🎉
        </h1>
        <p className="text-sm text-white/50">
          Seu acesso está liberado. Vamos começar sua transformação!
        </p>
      </motion.div>

      {/* Confirmation Card */}
      <motion.div
        className="w-full max-w-md rounded-2xl p-5 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        style={{
          background: "linear-gradient(180deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.02) 100%)",
          border: "1px solid rgba(16,185,129,0.2)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={16} style={{ color: "#10B981" }} />
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#10B981" }}>
            Plano Ativo
          </span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/40">Plano</span>
            <span className="text-white font-semibold">Mensal — Grátis</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Status</span>
            <span className="font-semibold" style={{ color: "#10B981" }}>Ativo ✓</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Garantia</span>
            <span className="text-white/70">30 dias — dinheiro de volta</span>
          </div>
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        className="w-full max-w-md mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h3
          className="text-sm font-bold text-white mb-4"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Próximos passos
        </h3>
        <div className="space-y-3">
          {nextSteps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
              className="rounded-2xl p-4 flex gap-4 items-start"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(255,107,43,0.12)" }}
              >
                <step.icon size={20} style={{ color: "#FF6B2B" }} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-0.5">{step.title}</h4>
                <p className="text-xs text-white/50 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        className="w-full max-w-md py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg, #FF6B2B, #FF8C55)",
          fontFamily: "'Manrope', sans-serif",
          boxShadow: "0 8px 30px rgba(255,107,43,0.3)",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/app")}
      >
        Acessar meu app <ArrowRight className="w-4 h-4" />
      </motion.button>

      <p className="text-[10px] mt-3 text-center" style={{ color: "#555" }}>
        Você pode gerenciar sua assinatura a qualquer momento no perfil.
      </p>
    </div>
  );
};

export default QuizSuccess;
