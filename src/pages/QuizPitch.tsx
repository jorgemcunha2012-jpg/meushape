import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { testimonials as allTestimonials } from "@/lib/quizResultUtils";
import {
  ArrowRight,
  Lock,
  Loader2,
  Shield,
  ShieldCheck,
  Dumbbell,
  TrendingUp,
  BarChart3,
  Headphones,
  CheckCircle2,
  Star,
  Clock,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import TestimonialCarousel from "@/components/quiz-result/TestimonialCarousel";

type TabKey = "pitch" | "garantia" | "preco" | "provas";

const tabs: { key: TabKey; label: string }[] = [
  { key: "pitch", label: "Pitch" },
  { key: "garantia", label: "Garantia" },
  { key: "preco", label: "Preço" },
  { key: "provas", label: "Provas" },
];

const benefits = [
  {
    icon: Dumbbell,
    title: "3 treinos/semana",
    desc: "Treinos curtos e eficientes adaptados ao seu nível e equipamento disponível.",
  },
  {
    icon: TrendingUp,
    title: "Progressão automática",
    desc: "O app aumenta a intensidade conforme você evolui, sem platô.",
  },
  {
    icon: BarChart3,
    title: "Acompanhamento de resultados",
    desc: "Gráficos e métricas para você ver sua evolução semana a semana.",
  },
  {
    icon: Headphones,
    title: "Suporte 24/7",
    desc: "Comunidade ativa e suporte para tirar dúvidas a qualquer momento.",
  },
];

const guaranteeSteps = [
  { step: "1", title: "Comece grátis", desc: "7 dias para testar tudo sem compromisso." },
  { step: "2", title: "Teste sem risco", desc: "Se não gostar, cancele em até 30 dias." },
  { step: "3", title: "Dinheiro de volta", desc: "Reembolso integral, sem perguntas." },
];

const QuizPitch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, email, answers } = (location.state as any) || {};
  const firstName = name?.split(" ")[0] || "linda";

  const [activeTab, setActiveTab] = useState<TabKey>("pitch");
  const [password, setPassword] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  const scrollToCTA = () => {
    ctaRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCheckout = async () => {
    if (!email || !password || password.length < 6) {
      toast.error("Crie uma senha com pelo menos 6 caracteres.");
      return;
    }
    setCheckingOut(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.location.href = data.url;
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Erro ao processar. Tente novamente.");
    } finally {
      setCheckingOut(false);
    }
  };

  const CTABlock = ({ showPassword = false }: { showPassword?: boolean }) => (
    <div ref={showPassword ? ctaRef : undefined} className="mt-6">
      {showPassword && (
        <div className="mb-4 text-left">
          <label className="text-[10px] text-white/30 mb-1 block">Crie uma senha para acessar</label>
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
        </div>
      )}
      <Button
        size="lg"
        onClick={showPassword ? handleCheckout : scrollToCTA}
        disabled={showPassword ? checkingOut || password.length < 6 : false}
        className="w-full rounded-full py-6 text-sm font-bold shadow-lg"
        style={{
          background:
            showPassword && password.length < 6
              ? "rgba(255,255,255,0.1)"
              : "linear-gradient(135deg, #FF6B2B, #F59E0B)",
          color:
            showPassword && password.length < 6 ? "rgba(255,255,255,0.3)" : "#fff",
          boxShadow: "0 8px 30px rgba(255,107,43,0.3)",
        }}
      >
        {checkingOut && showPassword ? (
          <>
            <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processando...
          </>
        ) : (
          <>
            Começar Agora <ArrowRight className="w-4 h-4 ml-1" />
          </>
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <section className="px-5 pt-10 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p
            className="text-xs font-semibold tracking-widest uppercase mb-2"
            style={{ color: "#FF6B2B" }}
          >
            Seu Plano Personalizado
          </p>
          <h1
            className="text-2xl font-black text-white mb-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {firstName}, tudo pronto
          </h1>
          <p className="text-sm text-white/50">
            Veja o que preparamos pra você
          </p>
        </motion.div>
      </section>

      {/* Tabs */}
      <nav className="px-5 mb-4">
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: activeTab === tab.key ? "#FF6B2B" : "transparent",
                color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.4)",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <section className="px-5 pb-6">
        <AnimatePresence mode="wait">
          {/* ── PITCH ── */}
          {activeTab === "pitch" && (
            <motion.div
              key="pitch"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-3">
                {benefits.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-2xl p-4 flex gap-4 items-start"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: "rgba(255,107,43,0.12)" }}
                    >
                      <b.icon size={20} style={{ color: "#FF6B2B" }} />
                    </div>
                    <div>
                      <h3
                        className="text-sm font-bold text-white mb-1"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {b.title}
                      </h3>
                      <p className="text-xs text-white/50 leading-relaxed">
                        {b.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <CTABlock />
            </motion.div>
          )}

          {/* ── GARANTIA ── */}
          {activeTab === "garantia" && (
            <motion.div
              key="garantia"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {/* Badge */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center mb-6"
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
                  style={{ background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.3)" }}
                >
                  <ShieldCheck size={40} style={{ color: "#10B981" }} />
                </div>
                <h3
                  className="text-lg font-black text-white"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Garantia de 30 dias
                </h3>
                <p className="text-xs text-white/40 mt-1 text-center">
                  Seu dinheiro de volta se não gostar. Sem burocracia.
                </p>
              </motion.div>

              {/* Steps */}
              <div className="space-y-3">
                {guaranteeSteps.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="rounded-2xl p-4 flex gap-4 items-start"
                    style={{
                      background: "rgba(16,185,129,0.04)",
                      border: "1px solid rgba(16,185,129,0.1)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
                    >
                      {s.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-0.5">{s.title}</h4>
                      <p className="text-xs text-white/50">{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <CTABlock />
            </motion.div>
          )}

          {/* ── PREÇO ── */}
          {activeTab === "preco" && (
            <motion.div
              key="preco"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              {/* Urgency badge */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold mb-6"
                style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444" }}
              >
                <Clock size={12} /> Oferta válida por 48h
              </motion.div>

              {/* Price card */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="w-full rounded-2xl p-6 text-center"
                style={{
                  background: "linear-gradient(180deg, rgba(255,107,43,0.08) 0%, rgba(255,107,43,0.02) 100%)",
                  border: "1px solid rgba(255,107,43,0.2)",
                }}
              >
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold mb-4"
                  style={{ background: "rgba(255,107,43,0.15)", color: "#FF6B2B" }}>
                  <Star size={10} /> OFERTA DE BOAS-VINDAS
                </div>

                <h3
                  className="text-2xl font-black text-white mb-1"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  7 dias grátis
                </h3>

                <div className="flex items-center justify-center gap-3 mb-2">
                  <span className="text-white/30 line-through text-lg">R$ 99,90</span>
                  <span
                    className="text-3xl font-black"
                    style={{ color: "#FF6B2B", fontFamily: "'Montserrat', sans-serif" }}
                  >
                    R$ 19,90
                  </span>
                  <span className="text-white/40 text-xs">/mês</span>
                </div>

                <p className="text-xs text-white/40 mb-5">
                  Cancele quando quiser. Sem compromisso.
                </p>

                {/* Included */}
                <div className="space-y-2 text-left mb-5">
                  {[
                    "Treinos personalizados por IA",
                    "Progressão automática semanal",
                    "Comunidade exclusiva",
                    "Suporte 24/7",
                    "Garantia de 30 dias",
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                      <span className="text-xs text-white/70">{item}</span>
                    </div>
                  ))}
                </div>

                {/* Savings */}
                <div
                  className="rounded-xl py-2.5 px-4 mb-4 flex items-center justify-center gap-2"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}
                >
                  <Zap size={14} style={{ color: "#10B981" }} />
                  <span className="text-xs font-bold" style={{ color: "#10B981" }}>
                    Economia de R$ 80,00/mês
                  </span>
                </div>

                {/* Password + CTA */}
                <div className="mb-4 text-left">
                  <label className="text-[10px] text-white/30 mb-1 block">
                    Crie uma senha para acessar
                  </label>
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
                </div>

                <Button
                  ref={ctaRef as any}
                  size="lg"
                  onClick={handleCheckout}
                  disabled={checkingOut || password.length < 6}
                  className="w-full rounded-full py-6 text-sm font-bold"
                  style={{
                    background:
                      password.length >= 6
                        ? "linear-gradient(135deg, #FF6B2B, #F59E0B)"
                        : "rgba(255,255,255,0.1)",
                    color: password.length >= 6 ? "#fff" : "rgba(255,255,255,0.3)",
                    boxShadow: password.length >= 6 ? "0 8px 30px rgba(255,107,43,0.3)" : "none",
                  }}
                >
                  {checkingOut ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processando...
                    </>
                  ) : (
                    <>
                      Começar meus 7 dias grátis <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-white/30">
                  <span className="flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Garantia 30 dias
                  </span>
                  <span>•</span>
                  <span>Cancele a qualquer momento</span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── PROVAS ── */}
          {activeTab === "provas" && (
            <motion.div
              key="provas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-xs text-white/40 text-center mb-4">
                Mulheres com perfil parecido com o seu
              </p>
              <TestimonialCarousel testimonials={allTestimonials} />
              <CTABlock />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default QuizPitch;
