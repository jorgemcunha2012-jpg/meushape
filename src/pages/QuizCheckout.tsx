import { useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Shield, CreditCard, Sparkles, Star, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

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
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius} fill="none"
            stroke="#FF6B2B" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>3/4</span>
        </div>
      </div>
      <span className="text-[10px] font-bold tracking-[0.2em] uppercase" style={{ color: "#FF6B2B", fontFamily: "'Manrope', sans-serif" }}>
        Pagamento
      </span>
    </div>
  );
};

const timelineSteps = [
  { day: "Hoje", title: "Comece agora — Grátis", description: "Acesso imediato a todos os treinos, programas e funcionalidades.", active: true },
  { day: "30 dias", title: "Teste tudo com garantia total", description: "Explore todas as funcionalidades sem compromisso.", active: false },
  { day: "Dia 31", title: "Renovação automática", description: "Plano gratuito por tempo limitado. Aproveite!", active: false },
];

const QuizCheckout = () => {
  const location = useLocation();
  const { name, email } = (location.state as any) || {};

  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  const handleCheckout = async () => {
    if (!email) {
      toast.error("Email não encontrado. Refaça o quiz.");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Crie uma senha com pelo menos 6 caracteres.");
      return;
    }

    setCheckingOut(true);
    try {
      // Sign up or sign in
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo: window.location.origin + "/app" },
      });
      if (signUpError?.message?.includes("already registered")) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else if (signUpError) {
        throw signUpError;
      }

      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Erro ao processar. Tente novamente.");
    } finally {
      setCheckingOut(false);
    }
  };

  const isReady = password.length >= 6;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8" style={{ background: "#0A0A0A", fontFamily: "'DM Sans', sans-serif" }}>
      {/* Progress Ring */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <ProgressRing />
      </motion.div>

      {/* Badge */}
      <motion.div className="mt-6 mb-2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <span
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold"
          style={{ background: "linear-gradient(135deg, rgba(255,107,43,0.2), rgba(255,107,43,0.08))", color: "#FF6B2B", border: "1px solid rgba(255,107,43,0.3)", fontFamily: "'Manrope', sans-serif" }}
        >
          <Sparkles className="w-3.5 h-3.5" /> Acesso Imediato
        </span>
      </motion.div>

      {/* Title */}
      <motion.div className="text-center mt-2 mb-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>Comece hoje por apenas</h1>
        <div className="flex items-baseline justify-center gap-1.5 mt-3">
          <span className="text-4xl font-extrabold" style={{ color: "#FF6B2B", fontFamily: "'Manrope', sans-serif" }}>R$ 0,00</span>
          <span className="text-sm" style={{ color: "#888" }}>/mês</span>
        </div>
        <p className="text-xs mt-2" style={{ color: "#666" }}>Garantia de 30 dias • Dinheiro de volta</p>
      </motion.div>

      {/* Price Card */}
      <motion.div
        className="w-full max-w-md mt-6 rounded-2xl p-5"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
        style={{ background: "#1a1a1a", border: "1.5px solid #FF6B2B" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#aaa", fontFamily: "'Manrope', sans-serif" }}>Plano Mensal</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-extrabold" style={{ color: "#FF6B2B", fontFamily: "'Manrope', sans-serif" }}>R$ 0,66</span>
              <span className="text-xs" style={{ color: "#666" }}>por dia</span>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: "linear-gradient(135deg, #FF6B2B, #FF8C55)", color: "#fff", fontFamily: "'Manrope', sans-serif" }}>
            Melhor oferta
          </div>
        </div>
        <div className="space-y-2">
          {["Treinos personalizados com IA", "Programas completos de academia e casa", "Cardio, alongamento e aquecimento", "Comunidade exclusiva"].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF6B2B" }} />
              <span className="text-xs" style={{ color: "#ccc" }}>{item}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Timeline */}
      <motion.div className="w-full max-w-md mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <h3 className="text-sm font-bold text-white mb-4" style={{ fontFamily: "'Manrope', sans-serif" }}>Como funciona</h3>
        <div className="relative">
          <div className="absolute left-[11px] top-3 bottom-3 w-px" style={{ background: "rgba(255,107,43,0.2)" }} />
          <div className="flex flex-col gap-5">
            {timelineSteps.map((step, i) => (
              <motion.div key={step.day} className="flex gap-3.5" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}>
                <div className="w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 relative z-10" style={{ background: step.active ? "#FF6B2B" : "#1a1a1a", border: `2px solid ${step.active ? "#FF6B2B" : "rgba(255,107,43,0.3)"}` }}>
                  {step.active && <Check className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: step.active ? "#FF6B2B" : "#666", fontFamily: "'Manrope', sans-serif" }}>{step.day}</span>
                  <p className="text-sm font-semibold text-white mt-0.5">{step.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#888" }}>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Rating & Reviews */}
      <motion.div className="w-full max-w-md mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.55 }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4" fill="#F59E0B" color="#F59E0B" />
            ))}
          </div>
          <span className="text-sm font-bold text-white" style={{ fontFamily: "'Manrope', sans-serif" }}>4.8</span>
          <span className="text-xs" style={{ color: "#888" }}>de 5</span>
          <span className="text-xs" style={{ color: "#666" }}>(2.3k reviews)</span>
        </div>
        <div className="space-y-2">
          {[
            { name: "Carolina S.", result: "Perdeu 5kg em 8 semanas" },
            { name: "Juliana M.", result: "+40% de força em 12 semanas" },
            { name: "Amanda R.", result: "Perdeu 8kg e manteve a rotina por 3 meses" },
          ].map((t, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.08 }}
              className="flex items-center gap-2 rounded-xl py-2.5 px-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#10B981" }} />
              <span className="text-xs" style={{ color: "#ccc" }}>
                <span className="font-bold text-white">{t.name}</span> — {t.result}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Trust Signals */}
      <motion.div className="w-full max-w-md mt-4 flex flex-col gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.7 }}>
        {[
          { icon: Shield, text: "Garantia de 30 dias — dinheiro de volta" },
          { icon: CreditCard, text: "Cartão de crédito" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#FF6B2B" }} />
            <span className="text-xs" style={{ color: "#888" }}>{text}</span>
          </div>
        ))}
      </motion.div>

      {/* Password + CTA */}
      <motion.div className="w-full max-w-md mt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
        <div className="mb-4 text-left">
          <label className="text-[10px] text-white/30 mb-1 block">Crie uma senha para acessar o app</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
            <Input
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-white/20"
              minLength={6}
            />
          </div>
          {email && (
            <p className="text-[10px] text-white/20 mt-1">
              Conta: {email}
            </p>
          )}
        </div>

        <motion.button
          className="w-full py-4 rounded-xl text-white font-bold text-base flex items-center justify-center gap-2"
          style={{
            background: isReady ? "linear-gradient(135deg, #FF6B2B, #FF8C55)" : "rgba(255,255,255,0.1)",
            color: isReady ? "#fff" : "rgba(255,255,255,0.3)",
            fontFamily: "'Manrope', sans-serif",
            boxShadow: isReady ? "0 8px 30px rgba(255,107,43,0.3)" : "none",
          }}
          whileHover={isReady ? { scale: 1.02 } : {}}
          whileTap={isReady ? { scale: 0.98 } : {}}
          onClick={handleCheckout}
          disabled={!isReady || checkingOut}
        >
          {checkingOut ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
          ) : (
            <>Começar agora — Grátis <ArrowRight className="w-4 h-4" /></>
          )}
        </motion.button>

        <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-white/30">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Garantia 30 dias</span>
          <span>•</span>
          <span>Cancele a qualquer momento</span>
        </div>
      </motion.div>

      <p className="text-[10px] mt-3 text-center" style={{ color: "#555" }}>
        Ao continuar, você concorda com os Termos de Uso e Política de Privacidade.
      </p>
    </div>
  );
};

export default QuizCheckout;
