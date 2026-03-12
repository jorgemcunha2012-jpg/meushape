import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Shield, CreditCard, Sparkles } from "lucide-react";

const ProgressRing = () => {
  const size = 64;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = 3 / 4;
  const offset = circumference - progress * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={stroke}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#FF6B2B"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
            3/4
          </span>
        </div>
      </div>
      <span
        className="text-[10px] font-bold tracking-[0.2em] uppercase"
        style={{ color: "#FF6B2B", fontFamily: "'Manrope', sans-serif" }}
      >
        Pagamento
      </span>
    </div>
  );
};

const timelineSteps = [
  {
    day: "Hoje",
    title: "Pague R$ 19,90 e comece agora",
    description: "Acesso imediato a todos os treinos, programas e funcionalidades.",
    active: true,
  },
  {
    day: "30 dias",
    title: "Teste tudo com garantia total",
    description: "Se não gostar, cancele e receba seu dinheiro de volta. Sem perguntas.",
    active: false,
  },
  {
    day: "Dia 31",
    title: "Renovação automática",
    description: "Se continuou, próxima cobrança de R$ 19,90. Cancele quando quiser.",
    active: false,
  },
];

const QuizCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleContinue = () => {
    navigate("/quiz/pitch", { state: { ...location.state, plan: "monthly" } });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Progress Ring */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ProgressRing />
      </motion.div>

      {/* Acesso Imediato Badge */}
      <motion.div
        className="mt-6 mb-2"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <span
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, rgba(255,107,43,0.2), rgba(255,107,43,0.08))",
            color: "#FF6B2B",
            border: "1px solid rgba(255,107,43,0.3)",
            fontFamily: "'Manrope', sans-serif",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" /> Acesso Imediato
        </span>
      </motion.div>

      {/* Title */}
      <motion.div
        className="text-center mt-2 mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Comece hoje por apenas
        </h1>
        <div className="flex items-baseline justify-center gap-1.5 mt-3">
          <span
            className="text-4xl font-extrabold"
            style={{ color: "#FF6B2B", fontFamily: "'Manrope', sans-serif" }}
          >
            R$ 19,90
          </span>
          <span className="text-sm" style={{ color: "#888" }}>/mês</span>
        </div>
        <p className="text-xs mt-2" style={{ color: "#666" }}>
          Garantia de 30 dias • Dinheiro de volta
        </p>
      </motion.div>

      {/* Price Card */}
      <motion.div
        className="w-full max-w-md mt-6 rounded-2xl p-5"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        style={{
          background: "#1a1a1a",
          border: "1.5px solid #FF6B2B",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#aaa", fontFamily: "'Manrope', sans-serif" }}
            >
              Plano Mensal
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span
                className="text-2xl font-extrabold"
                style={{ color: "#FF6B2B", fontFamily: "'Manrope', sans-serif" }}
              >
                R$ 0,66
              </span>
              <span className="text-xs" style={{ color: "#666" }}>por dia</span>
            </div>
          </div>
          <div
            className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{
              background: "linear-gradient(135deg, #FF6B2B, #FF8C55)",
              color: "#fff",
              fontFamily: "'Manrope', sans-serif",
            }}
          >
            Pagar Agora
          </div>
        </div>

        <div className="space-y-2">
          {[
            "Treinos personalizados com IA",
            "Programas completos de academia e casa",
            "Cardio, alongamento e aquecimento",
            "Comunidade exclusiva",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF6B2B" }} />
              <span className="text-xs" style={{ color: "#ccc" }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div
        className="w-full max-w-md mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3
          className="text-sm font-bold text-white mb-4"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Como funciona
        </h3>
        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-[11px] top-3 bottom-3 w-px"
            style={{ background: "rgba(255,107,43,0.2)" }}
          />

          <div className="flex flex-col gap-5">
            {timelineSteps.map((step, i) => (
              <motion.div
                key={step.day}
                className="flex gap-3.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
              >
                {/* Dot */}
                <div
                  className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative z-10"
                  style={{
                    background: step.active ? "#FF6B2B" : "#1a1a1a",
                    border: `2px solid ${step.active ? "#FF6B2B" : "rgba(255,107,43,0.3)"}`,
                  }}
                >
                  {step.active && <Check className="w-3 h-3 text-white" />}
                </div>

                <div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: step.active ? "#FF6B2B" : "#666",
                      fontFamily: "'Manrope', sans-serif",
                    }}
                  >
                    {step.day}
                  </span>
                  <p className="text-sm font-semibold text-white mt-0.5">{step.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#888" }}>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Trust Signals */}
      <motion.div
        className="w-full max-w-md mt-6 flex flex-col gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {[
          { icon: Shield, text: "Garantia de 30 dias — dinheiro de volta" },
          { icon: CreditCard, text: "Cartão de crédito ou PIX" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF6B2B" }} />
            <span className="text-xs" style={{ color: "#888" }}>{text}</span>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.button
        className="w-full max-w-md mt-8 py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(135deg, #FF6B2B, #FF8C55)",
          fontFamily: "'Manrope', sans-serif",
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleContinue}
      >
        Pagar R$ 19,90 agora <ArrowRight className="w-4 h-4" />
      </motion.button>

      <p className="text-[10px] mt-3 text-center" style={{ color: "#555" }}>
        Ao continuar, você concorda com os Termos de Uso e Política de Privacidade.
      </p>
    </div>
  );
};

export default QuizCheckout;
