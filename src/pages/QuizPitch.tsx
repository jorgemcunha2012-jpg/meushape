import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { testimonials as allTestimonials } from "@/lib/quizResultUtils";
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  Loader2,
  ShieldCheck,
  Dumbbell,
  TrendingUp,
  BarChart3,
  Headphones,
  CheckCircle2,
  Star,
  Clock,
  Zap,
  Shield,
  PartyPopper,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import TestimonialCarousel from "@/components/quiz-result/TestimonialCarousel";
import confetti from "canvas-confetti";

const TOTAL_STEPS = 4;

const stepLabels = ["Seu Plano", "Garantia", "Oferta", "Provas"];

const benefits = [
  { icon: Dumbbell, title: "3 treinos/semana", desc: "Treinos curtos e eficientes adaptados ao seu nível e equipamento disponível." },
  { icon: TrendingUp, title: "Progressão automática", desc: "O app aumenta a intensidade conforme você evolui, sem platô." },
  { icon: BarChart3, title: "Acompanhamento de resultados", desc: "Gráficos e métricas para ver sua evolução semana a semana." },
  { icon: Headphones, title: "Suporte 24/7", desc: "Comunidade ativa e suporte para tirar dúvidas a qualquer momento." },
];

const guaranteeSteps = [
  { step: "1", title: "Teste sem risco", desc: "Se não gostar, cancele em até 30 dias." },
  { step: "2", title: "Dinheiro de volta", desc: "Reembolso integral, sem perguntas." },
];

/* ── Progress Ring ── */
const ProgressRing = ({ step, total }: { step: number; total: number }) => {
  const radius = 44;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;
  const progress = ((step + 1) / total) * 100;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-24 h-24 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx="50" cy="50" r={radius} fill="none"
          stroke="url(#ringGrad)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF6B2B" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-black text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {step + 1}/{total}
        </span>
        <span className="text-[9px] text-white/40 mt-0.5">etapas</span>
      </div>
    </div>
  );
};

/* ── Step Dots ── */
const StepDots = ({ step, total, labels }: { step: number; total: number; labels: string[] }) => (
  <div className="flex items-center justify-center gap-2 mt-3">
    {labels.map((_, i) => (
      <motion.div
        key={i}
        className="w-2 h-2 rounded-full"
        animate={{
          background: i <= step ? "#FF6B2B" : "rgba(255,255,255,0.15)",
          scale: i === step ? 1.3 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
    ))}
  </div>
);

/* ── Main Component ── */
const QuizPitch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, email, answers } = (location.state as any) || {};
  const firstName = name?.split(" ")[0] || "linda";

  const [step, setStep] = useState(0);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState(1); // 1=forward, -1=back

  // Confetti on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.3 }, colors: ["#FF6B2B", "#F59E0B", "#10B981"] });
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Mini confetti on step complete
  const fireStepConfetti = useCallback(() => {
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.5 }, colors: ["#FF6B2B", "#F59E0B"] });
  }, []);

  const goNext = () => {
    if (step < TOTAL_STEPS - 1) {
      setCompletedSteps((prev) => new Set(prev).add(step));
      fireStepConfetti();
      setDirection(1);
      setStep(step + 1);
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  };

  const handleCheckout = async () => {
    if (!email || !password || password.length < 6) {
      toast.error("Crie uma senha com pelo menos 6 caracteres.");
      return;
    }
    setCheckingOut(true);
    // Track checkout event
    supabase.from("checkout_events").insert({ email, status: "initiated" }).then();
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email, password,
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

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0a0a0a" }}>
      {/* Header */}
      <section className="px-5 pt-8 pb-2">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <PartyPopper size={16} style={{ color: "#FF6B2B" }} />
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#FF6B2B" }}>
              Missão em andamento
            </p>
          </div>
          <ProgressRing step={step} total={TOTAL_STEPS} />
          <StepDots step={step} total={TOTAL_STEPS} labels={stepLabels} />
        </motion.div>
      </section>

      {/* Content */}
      <section className="flex-1 px-5 pb-4 pt-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          {/* ── STEP 0: Pitch ── */}
          {step === 0 && (
            <motion.div
              key="pitch"
              custom={direction}
              variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-lg font-black text-white mb-1 text-center" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {firstName}, seu plano inclui:
              </h2>
              <p className="text-xs text-white/40 text-center mb-1">Tudo personalizado pra você</p>
              <p className="text-[10px] text-center mb-4" style={{ color: "#10B981" }}>
                ✓ Usado por mais de 5.200 mulheres • 87% viram resultados em 30 dias
              </p>
              <div className="space-y-3">
                {benefits.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="rounded-2xl p-4 flex gap-4 items-start"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(255,107,43,0.12)" }}>
                      <b.icon size={20} style={{ color: "#FF6B2B" }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white mb-0.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>{b.title}</h3>
                      <p className="text-xs text-white/50 leading-relaxed">{b.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 1: Garantia ── */}
          {step === 1 && (
            <motion.div
              key="garantia"
              custom={direction}
              variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }}
            >
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-3" style={{ background: "rgba(16,185,129,0.12)", border: "2px solid rgba(16,185,129,0.3)" }}>
                  <ShieldCheck size={40} style={{ color: "#10B981" }} />
                </div>
                <h2 className="text-lg font-black text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>Garantia de 30 dias</h2>
                <p className="text-xs text-white/40 mt-1 text-center">Seu dinheiro de volta se não gostar. Sem burocracia.</p>
              </motion.div>
              <div className="space-y-3">
                {guaranteeSteps.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="rounded-2xl p-4 flex gap-4 items-start"
                    style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-black" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>
                      {s.step}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white mb-0.5">{s.title}</h4>
                      <p className="text-xs text-white/50">{s.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── STEP 2: Preço ── */}
          {step === 2 && (
            <motion.div
              key="preco"
              custom={direction}
              variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center"
            >

              <motion.div
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }}
                className="w-full rounded-2xl p-6 text-center"
                style={{ background: "linear-gradient(180deg, rgba(255,107,43,0.08) 0%, rgba(255,107,43,0.02) 100%)", border: "1px solid rgba(255,107,43,0.2)" }}
              >

                <h3 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>Acesso Imediato</h3>

                <p className="text-xs text-white/40 mb-5">Grátis por tempo limitado • Garantia de 30 dias.</p>

                <div className="space-y-2 text-left mb-5">
                  {["Treinos personalizados por IA", "Progressão automática semanal", "Comunidade exclusiva", "Suporte 24/7", "Garantia de 30 dias"].map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                      <span className="text-xs text-white/70">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl py-2.5 px-4 mb-2 flex items-center justify-center gap-2"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)" }}>
                  <Zap size={14} style={{ color: "#10B981" }} />
                  <span className="text-xs font-bold" style={{ color: "#10B981" }}>Economia de R$ 80,00/mês</span>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── STEP 3: Provas ── */}
          {step === 3 && (
            <motion.div
              key="provas"
              custom={direction}
              variants={variants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-lg font-black text-white mb-1 text-center" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Resultados reais
              </h2>
              <p className="text-xs text-white/40 text-center mb-4">Mulheres com perfil parecido com o seu</p>

              {/* Social proof numbers */}
              <div className="grid grid-cols-3 gap-2 mb-5">
                {[
                  { value: "5.200+", label: "mulheres ativas", color: "#FF6B2B" },
                  { value: "87%", label: "resultados em 30d", color: "#10B981" },
                  { value: "4.8 ⭐", label: "avaliação média", color: "#F59E0B" },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="rounded-xl py-3 text-center"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <p className="text-sm font-black" style={{ color: stat.color, fontFamily: "'Montserrat', sans-serif" }}>{stat.value}</p>
                    <p className="text-[9px] text-white/40 mt-0.5">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              <TestimonialCarousel testimonials={allTestimonials} />

              {/* Final CTA with password */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-6">
                <div className="mb-4 text-left">
                  <label className="text-[10px] text-white/30 mb-1 block">Crie uma senha para acessar</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
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

                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={checkingOut || password.length < 6}
                  className="w-full rounded-full py-6 text-sm font-bold"
                  style={{
                    background: password.length >= 6 ? "linear-gradient(135deg, #FF6B2B, #F59E0B)" : "rgba(255,255,255,0.1)",
                    color: password.length >= 6 ? "#fff" : "rgba(255,255,255,0.3)",
                    boxShadow: password.length >= 6 ? "0 8px 30px rgba(255,107,43,0.3)" : "none",
                  }}
                >
                  {checkingOut ? (
                    <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Processando...</>
                  ) : (
                    <>Começar agora — Grátis <ArrowRight className="w-4 h-4 ml-1" /></>
                  )}
                </Button>

                <div className="flex items-center justify-center gap-3 mt-3 text-[10px] text-white/30">
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Garantia 30 dias</span>
                  <span>•</span>
                  <span>Cancele a qualquer momento</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Navigation Footer */}
      <div className="sticky bottom-0 px-5 pb-6 pt-3" style={{ background: "linear-gradient(0deg, #0a0a0a 70%, transparent)" }}>
        {step < TOTAL_STEPS - 1 ? (
          <div className="flex gap-3">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={goPrev}
                className="flex-none px-4 rounded-full border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="lg"
              onClick={goNext}
              className="flex-1 rounded-full py-6 text-sm font-bold"
              style={{ background: "linear-gradient(135deg, #FF6B2B, #F59E0B)", color: "#fff", boxShadow: "0 8px 30px rgba(255,107,43,0.3)" }}
            >
              Próximo <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        ) : (
          step === TOTAL_STEPS - 1 && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={goPrev}
                className="flex-none px-4 rounded-full border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              {/* spacer — main CTA is inline above */}
              <div className="flex-1" />
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default QuizPitch;
