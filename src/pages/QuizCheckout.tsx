import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

const plans = [
  {
    id: "weekly",
    label: "Semanal",
    pricePerDay: "1,41",
    fullPrice: "R$ 9,90 por semana",
    badge: null,
  },
  {
    id: "monthly",
    label: "Mensal",
    pricePerDay: "0,66",
    fullPrice: "R$ 19,90 por mês",
    badge: "Mais Popular",
  },
  {
    id: "quarterly",
    label: "Trimestral",
    pricePerDay: "0,56",
    fullPrice: "R$ 49,90 por trimestre • Economize R$ 10",
    badge: null,
  },
  {
    id: "yearly",
    label: "Anual",
    pricePerDay: "0,27",
    fullPrice: "R$ 99,90 por ano • Economize R$ 139",
    badge: "Melhor Valor",
  },
];

const ProgressRing = () => {
  const size = 64;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = 2 / 4;
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
            2/4
          </span>
        </div>
      </div>
      <span
        className="text-[10px] font-bold tracking-[0.2em] uppercase"
        style={{ color: "#FF6B2B", fontFamily: "'Manrope', sans-serif" }}
      >
        Escolha seu plano
      </span>
    </div>
  );
};

const QuizCheckout = () => {
  const [selected, setSelected] = useState("monthly");
  const navigate = useNavigate();
  const location = useLocation();

  const handleContinue = () => {
    navigate("/quiz/pitch", { state: { ...location.state, plan: selected } });
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

      {/* Title */}
      <motion.div
        className="text-center mt-6 mb-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "'Manrope', sans-serif" }}
        >
          Qual plano você prefere?
        </h1>
        <p className="text-sm mt-2" style={{ color: "#888" }}>
          Todos incluem acesso completo. Quanto mais tempo, maior a economia.
        </p>
      </motion.div>

      {/* Plan Cards */}
      <div className="w-full max-w-md flex flex-col gap-3 mt-6">
        {plans.map((plan, i) => {
          const isSelected = selected === plan.id;
          return (
            <motion.button
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
              onClick={() => setSelected(plan.id)}
              className="relative w-full rounded-xl p-4 flex items-center justify-between text-left transition-all duration-200"
              style={{
                background: "#1a1a1a",
                border: `1.5px solid ${isSelected ? "#FF6B2B" : "#2a2a2a"}`,
              }}
              whileHover={{ borderColor: "#FF6B2B" }}
            >
              {/* Badge */}
              {plan.badge && (
                <span
                  className="absolute -top-2.5 left-4 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{
                    background: plan.badge === "Melhor Valor"
                      ? "linear-gradient(135deg, #FF6B2B, #FF8C55)"
                      : "linear-gradient(135deg, #FF6B2B, #FF8C55)",
                    color: "#fff",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {plan.badge}
                </span>
              )}

              {/* Left content */}
              <div className="flex flex-col gap-0.5">
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "#aaa", fontFamily: "'Manrope', sans-serif" }}
                >
                  {plan.label}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-2xl font-extrabold"
                    style={{ color: "#FF6B2B", fontFamily: "'Manrope', sans-serif" }}
                  >
                    R$ {plan.pricePerDay}
                  </span>
                  <span className="text-xs" style={{ color: "#666" }}>
                    por dia
                  </span>
                </div>
                <span className="text-[11px] mt-0.5" style={{ color: "#666" }}>
                  {plan.fullPrice}
                </span>
              </div>

              {/* Radio */}
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                style={{
                  borderColor: isSelected ? "#FF6B2B" : "#444",
                  background: isSelected ? "#FF6B2B" : "transparent",
                }}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 rounded-full bg-white"
                  />
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Trust Signals */}
      <motion.div
        className="w-full max-w-md mt-6 flex flex-col gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        {[
          "7 dias grátis com cartão vinculado",
          "Cancele quando quiser sem penalidades",
          "Garantia 30 dias • Dinheiro de volta",
        ].map((text) => (
          <div key={text} className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF6B2B" }} />
            <span className="text-xs" style={{ color: "#888" }}>
              {text}
            </span>
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
        Continuar <ArrowRight className="w-4 h-4" />
      </motion.button>
    </div>
  );
};

export default QuizCheckout;
