import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Check, Shield, Sparkles, Star, Lock, Loader2,
  Eye, EyeOff, User, Mail, CreditCard, Smartphone,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { trackCompleteRegistration, trackInitiateCheckout, trackAddToCart } from "@/lib/tiktokPixel";

const PLANS = [
  {
    id: "monthly",
    label: "Mensal",
    price: "R$ 19,90",
    priceSuffix: "/mês",
    perDay: "R$ 0,66/dia",
    priceId: "price_1TB0kLLKftklAHDEb6exuIBD",
    badge: "⭐ Mais Popular",
    badgeStyle: "linear-gradient(135deg, #FF6B2B, #FF8C55)",
    highlighted: true,
  },
  {
    id: "quarterly",
    label: "Trimestral",
    price: "R$ 49,90",
    priceSuffix: "/3 meses",
    perDay: "R$ 0,55/dia",
    priceId: "price_1TB0jhLKftklAHDE317bdGDb",
    badge: "Economize R$ 10",
    badgeStyle: "linear-gradient(135deg, #10B981, #34D399)",
    highlighted: false,
  },
  {
    id: "annual",
    label: "Anual",
    price: "R$ 99,90",
    priceSuffix: "/ano",
    perDay: "R$ 0,27/dia",
    priceId: "price_1TB0kfLKftklAHDETj60Kbhp",
    badge: "Melhor preço",
    badgeStyle: "linear-gradient(135deg, #8B5CF6, #A78BFA)",
    highlighted: false,
  },
];

const planFeatures = [
  "Acesso imediato",
  "Treinos personalizados",
  "Progressão automática",
  "Suporte via chat",
  "Garantia 30 dias",
];

type PaymentMethod = "card" | "pix";

const QuizCheckout = () => {
  const location = useLocation();
  const { name: passedName, answers, scores } = (location.state as any) || {};

  const [selectedPlan, setSelectedPlan] = useState("monthly");

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    const p = PLANS.find((pl) => pl.id === planId)!;
    const value = planId === "monthly" ? 19.9 : planId === "quarterly" ? 49.9 : 99.9;
    trackAddToCart(p.id, value);
  };
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
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
      await supabase.from("leads").insert({
        name: trimmedName,
        email: trimmedEmail,
        opted_in: true,
        quiz_answers: answers || {},
        profile_scores: scores || {},
      });

      const sessionId = sessionStorage.getItem("funnel_session") || crypto.randomUUID();
      sessionStorage.setItem("funnel_session", sessionId);
      await supabase.from("funnel_visits").insert({ step: "checkout_initiated", session_id: sessionId });
      await supabase.from("checkout_events").insert({ email: trimmedEmail, status: "initiated" });

      const { signUpAndCheckout } = await import("@/lib/authCheckout");
      const url = await signUpAndCheckout({
        email: trimmedEmail,
        password,
        name: trimmedName,
        priceId: plan.priceId,
      });

      // TikTok conversion events
      trackCompleteRegistration(trimmedEmail);
      const planValue = plan.id === "monthly" ? 19.9 : plan.id === "quarterly" ? 49.9 : 99.9;
      trackInitiateCheckout(plan.id, planValue);

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
        <p className="text-xs mt-2" style={{ color: "#888" }}>Acesso imediato ao seu plano personalizado.</p>
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
              onClick={() => handleSelectPlan(p.id)}
              className="w-full text-left rounded-2xl p-4 transition-all duration-200 relative"
              style={{
                background: isSelected ? "rgba(255,107,43,0.08)" : "#1a1a1a",
                border: `2px solid ${isSelected ? "#FF6B2B" : "rgba(255,255,255,0.08)"}`,
              }}
            >
              {p.badge && (
                <span
                  className="absolute -top-2.5 right-4 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: p.badgeStyle, color: "#fff", fontFamily: "'Manrope', sans-serif" }}
                >
                  {p.badge}
                </span>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>
                    {p.label}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-extrabold" style={{ color: isSelected ? "#FF6B2B" : "#ccc", fontFamily: "'Manrope', sans-serif" }}>
                      {p.price}
                    </span>
                    <span className="text-xs" style={{ color: "#888" }}>{p.priceSuffix}</span>
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

              {/* Features inside selected card */}
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-3 pt-3 space-y-1.5"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                >
                  {planFeatures.map((feat) => (
                    <div key={feat} className="flex items-center gap-2">
                      <Check className="w-3 h-3 flex-shrink-0" style={{ color: "#FF6B2B" }} />
                      <span className="text-[11px]" style={{ color: "#ccc" }}>{feat}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Payment Method */}
      <motion.div className="w-full max-w-md mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h3 className="text-sm font-bold text-white mb-3" style={{ fontFamily: "'Manrope', sans-serif" }}>
          Como você quer pagar?
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setPaymentMethod("pix")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: paymentMethod === "pix" ? "rgba(255,107,43,0.1)" : "#1a1a1a",
              border: `2px solid ${paymentMethod === "pix" ? "#FF6B2B" : "rgba(255,255,255,0.08)"}`,
              color: paymentMethod === "pix" ? "#FF6B2B" : "#888",
            }}
          >
            <Smartphone className="w-4 h-4" />
            PIX
          </button>
          <button
            onClick={() => setPaymentMethod("card")}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: paymentMethod === "card" ? "rgba(255,107,43,0.1)" : "#1a1a1a",
              border: `2px solid ${paymentMethod === "card" ? "#FF6B2B" : "rgba(255,255,255,0.08)"}`,
              color: paymentMethod === "card" ? "#FF6B2B" : "#888",
            }}
          >
            <CreditCard className="w-4 h-4" />
            Cartão
          </button>
        </div>
        {paymentMethod === "pix" && (
          <p className="text-[10px] mt-2" style={{ color: "#888" }}>
            Pagamento instantâneo via PIX. Acesso liberado assim que o pagamento for confirmado.
          </p>
        )}
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
              placeholder="Seu primeiro nome"
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
              placeholder="Seu melhor email"
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

        {/* Trust signals */}
        <div className="mt-5 space-y-2">
          {[
            { icon: Lock, text: "Pagamento 100% seguro" },
            { icon: Shield, text: "Garantia de 30 dias ou seu dinheiro de volta" },
            { icon: Smartphone, text: "Acesso imediato após o pagamento" },
            { icon: CreditCard, text: "Sem renovação automática • Cancele quando quiser" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF6B2B" }} />
              <span className="text-[11px]" style={{ color: "#888" }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-2 mt-5">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5" fill="#F59E0B" color="#F59E0B" />
            ))}
          </div>
          <span className="text-xs font-bold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>4.8/5</span>
          <span className="text-[10px]" style={{ color: "#888" }}>— Mais de 5.000 mulheres já fizeram o teste</span>
        </div>
      </motion.div>

      <p className="text-[10px] mt-4 text-center" style={{ color: "#555" }}>
        Ao continuar, você concorda com os Termos de Uso e Política de Privacidade.
      </p>
    </div>
  );
};

export default QuizCheckout;
