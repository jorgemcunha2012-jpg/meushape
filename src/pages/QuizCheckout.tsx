import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Check, Shield, Sparkles, Star, Lock, Loader2,
  Eye, EyeOff, User, Mail, CreditCard,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const PLANS = [
  {
    id: "monthly",
    label: "Mensal",
    price: "R$ 19,90",
    perDay: "R$ 0,66/dia",
    priceId: "price_1TB0kLLKftklAHDEb6exuIBD",
    badge: null,
  },
  {
    id: "quarterly",
    label: "Trimestral",
    price: "R$ 49,90",
    perDay: "R$ 0,55/dia",
    priceId: "price_1TB0jhLKftklAHDE317bdGDb",
    badge: "Popular",
  },
  {
    id: "annual",
    label: "Anual",
    price: "R$ 99,90",
    perDay: "R$ 0,27/dia",
    priceId: "price_1TB0kfLKftklAHDETj60Kbhp",
    badge: "Melhor oferta",
  },
];

const features = [
  "Treinos personalizados com IA",
  "Programas completos de academia e casa",
  "Cardio, alongamento e aquecimento",
  "Comunidade exclusiva",
];

const QuizCheckout = () => {
  const location = useLocation();
  const { name: passedName, answers, scores } = (location.state as any) || {};

  const [selectedPlan, setSelectedPlan] = useState("annual");
  const [ctaName, setCtaName] = useState(passedName || "");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const firstName = (ctaName || "").trim().split(" ")[0] || "";
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canCheckout = isEmailValid && ctaName.trim().length > 1 && password.length >= 6;

  const plan = PLANS.find((p) => p.id === selectedPlan)!;

  const handleCheckout = async () => {
    if (!canCheckout) return;
    setCheckingOut(true);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = ctaName.trim();

    try {
      // Insert lead
      await supabase.from("leads").insert({
        name: trimmedName,
        email: trimmedEmail,
        opted_in: true,
        quiz_answers: answers || {},
        profile_scores: scores || {},
      });

      // Track
      const sessionId = sessionStorage.getItem("funnel_session") || crypto.randomUUID();
      sessionStorage.setItem("funnel_session", sessionId);
      await supabase.from("funnel_visits").insert({ step: "checkout_initiated", session_id: sessionId });
      await supabase.from("checkout_events").insert({ email: trimmedEmail, status: "initiated" });

      // Auth + checkout
      const { signUpAndCheckout } = await import("@/lib/authCheckout");
      const url = await signUpAndCheckout({
        email: trimmedEmail,
        password,
        name: trimmedName,
        priceId: plan.priceId,
      });
      window.location.href = url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Erro ao processar. Tente novamente.");
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-8"
      style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Badge */}
      <motion.div className="mb-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
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
      <motion.div className="text-center mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
          {firstName ? `Escolha seu plano, ${firstName}` : "Escolha seu plano"}
        </h1>
        <p className="text-xs mt-2" style={{ color: "#666" }}>Garantia de 30 dias • Cancele quando quiser</p>
      </motion.div>

      {/* Plan Cards */}
      <motion.div
        className="w-full max-w-md space-y-3 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {PLANS.map((p) => {
          const isSelected = selectedPlan === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className="w-full text-left rounded-2xl p-4 transition-all duration-200 relative"
              style={{
                background: isSelected ? "rgba(255,107,43,0.08)" : "#1a1a1a",
                border: `2px solid ${isSelected ? "#FF6B2B" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {p.badge && (
                <span
                  className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    background: p.id === "annual"
                      ? "linear-gradient(135deg, #FF6B2B, #FF8C55)"
                      : "linear-gradient(135deg, #10B981, #34D399)",
                    color: "#fff",
                    fontFamily: "'Manrope', sans-serif",
                  }}
                >
                  {p.badge}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {p.label}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-xl font-extrabold" style={{ color: isSelected ? "#FF6B2B" : "#ccc", fontFamily: "'Manrope', sans-serif" }}>
                      {p.price}
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: "#888" }}>{p.perDay}</span>
                </div>
                <div
                  className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                  style={{
                    borderColor: isSelected ? "#FF6B2B" : "rgba(255,255,255,0.2)",
                    background: isSelected ? "#FF6B2B" : "transparent",
                  }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* Features */}
      <motion.div className="w-full max-w-md mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <div className="space-y-2">
          {features.map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF6B2B" }} />
              <span className="text-xs" style={{ color: "#ccc" }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Rating */}
      <motion.div className="w-full max-w-md mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        <div className="flex items-center justify-center gap-2">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4" fill="#F59E0B" color="#F59E0B" />
            ))}
          </div>
          <span className="text-sm font-bold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>4.8</span>
          <span className="text-xs" style={{ color: "#888" }}>de 5</span>
          <span className="text-xs" style={{ color: "#666" }}>(2.3k reviews)</span>
        </div>
      </motion.div>

      {/* Signup Form */}
      <motion.div className="w-full max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h3 className="text-sm font-bold text-white mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Crie sua conta
        </h3>

        {/* Name */}
        <div className="mb-3">
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input
              placeholder="Seu nome"
              value={ctaName}
              onChange={(e) => setCtaName(e.target.value)}
              className="pl-10 h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20"
              maxLength={100}
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-3">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20"
              maxLength={255}
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-5">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Crie uma senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20"
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* CTA Button */}
        <motion.button
          className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2"
          style={{
            background: canCheckout ? "linear-gradient(135deg, #FF6B2B, #FF8C55)" : "rgba(255,255,255,0.1)",
            color: canCheckout ? "#fff" : "rgba(255,255,255,0.3)",
            fontFamily: "'Manrope', sans-serif",
            boxShadow: canCheckout ? "0 8px 30px rgba(255,107,43,0.3)" : "none",
          }}
          whileHover={canCheckout ? { scale: 1.02 } : {}}
          whileTap={canCheckout ? { scale: 0.98 } : {}}
          onClick={handleCheckout}
          disabled={!canCheckout || checkingOut}
        >
          {checkingOut ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
          ) : (
            <>Começar agora <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>

        {/* Trust */}
        <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-white/30">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Garantia 30 dias</span>
          <span>•</span>
          <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> Pagamento seguro</span>
        </div>
      </motion.div>

      <p className="text-[10px] mt-4 text-center" style={{ color: "#555" }}>
        Ao continuar, você concorda com os Termos de Uso e Política de Privacidade.
      </p>
    </div>
  );
};

export default QuizCheckout;
