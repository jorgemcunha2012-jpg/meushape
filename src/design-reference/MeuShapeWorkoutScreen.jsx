import { useState, useEffect, useRef } from "react";

// ==========================================
// MEU SHAPE — Tela de Treino Guiado
// Fluxo completo: Aquecimento → Exercícios → Descanso → Volta à calma → Resumo
// ==========================================

const C = {
  bg: "#0D0D12",
  card: "#16161F",
  surface: "#1A1A25",
  accent: "#E94560",
  accentGlow: "rgba(233,69,96,0.25)",
  green: "#16C79A",
  greenGlow: "rgba(22,199,154,0.2)",
  yellow: "#F5A623",
  orange: "#FF6B35",
  purple: "#6C63FF",
  blue: "#3B82F6",
  text: "#FFFFFF",
  textMuted: "#8B8B9E",
  textDim: "#5A5A6E",
  border: "#2A2A3A",
};

// Mock exercises with ExerciseDB-style GIF URLs (using placeholder animations)
const WORKOUT = {
  title: "Pernas e Glúteos",
  day: "Sexta-feira",
  warmup: {
    duration: 300, // 5 min
    exercises: [
      { name: "Marcha estacionária", duration: 120, instruction: "Joelhos altos, braços acompanhando" },
      { name: "Rotação de quadril", duration: 60, instruction: "Círculos amplos, 30s cada lado" },
      { name: "Agachamento sem peso", duration: 60, instruction: "5 reps com pausa de 3s embaixo" },
      { name: "Ponte de glúteo", duration: 60, instruction: "15 reps, aperta o bumbum lá em cima" },
    ]
  },
  exercises: [
    {
      id: 1, name: "Agachamento com Haltere", namePt: "Agachamento com Haltere",
      muscle: "Glúteos, Quadríceps", sets: 3, reps: "12-15", restSeconds: 45,
      weight: "8kg", gifUrl: "https://v2.exercisedb.io/image/jMArHPVVdJSwKb",
      instruction: "Segura um haltere em cada mão, pés na largura do ombro. Desce como se fosse sentar numa cadeira. Sobe apertando o bumbum.",
      commonMistake: "Não deixa o joelho passar da ponta do pé. Mantém a coluna reta.",
    },
    {
      id: 2, name: "Hip Thrust no Banco", namePt: "Elevação de Quadril no Banco",
      muscle: "Glúteos", sets: 3, reps: "12", restSeconds: 45,
      weight: "20kg", gifUrl: "https://v2.exercisedb.io/image/WnZHqSjSHqPxjm",
      instruction: "Costas apoiadas no banco, barra na cintura. Sobe o quadril até alinhar com os ombros. Aperta o bumbum 1 segundo lá em cima.",
      commonMistake: "Não hiperestende a lombar. O movimento é no quadril, não na coluna.",
    },
    {
      id: 3, name: "Afundo Búlgaro", namePt: "Afundo Búlgaro",
      muscle: "Glúteos, Quadríceps", sets: 3, reps: "10 cada", restSeconds: 60,
      weight: "6kg", gifUrl: "https://v2.exercisedb.io/image/pvk47Hj-Fw5-FI",
      instruction: "Pé de trás no banco. Desce até o joelho quase tocar o chão. Empurra o chão com o pé da frente pra subir.",
      commonMistake: "Mantém o tronco reto. Não inclina pra frente.",
    },
    {
      id: 4, name: "Cadeira Extensora", namePt: "Cadeira Extensora",
      muscle: "Quadríceps", sets: 3, reps: "12-15", restSeconds: 45,
      weight: "25kg", gifUrl: "https://v2.exercisedb.io/image/dU1Lp1d7QZH0eY",
      instruction: "Ajusta o encosto pra suas costas ficarem bem apoiadas. Estende as pernas até quase travar o joelho. Volta devagar.",
      commonMistake: "Não faz o movimento rápido. Controla a descida.",
    },
    {
      id: 5, name: "Cadeira Flexora", namePt: "Cadeira Flexora",
      muscle: "Posterior da Coxa", sets: 3, reps: "12", restSeconds: 45,
      weight: "20kg", gifUrl: "https://v2.exercisedb.io/image/GZhnxdNOlITKdH",
      instruction: "Deita de barriga pra baixo. Puxa o rolo até o bumbum. Volta devagar controlando.",
      commonMistake: "Não levanta o quadril do banco. Só a perna mexe.",
    },
    {
      id: 6, name: "Abdutora", namePt: "Abdutora (Máquina)",
      muscle: "Glúteo Médio", sets: 3, reps: "15", restSeconds: 30,
      weight: "30kg", gifUrl: "https://v2.exercisedb.io/image/m8HIBYelKK4k-H",
      instruction: "Senta na máquina, costas apoiadas. Abre as pernas empurrando pra fora. Volta devagar.",
      commonMistake: "Mantém as costas no encosto. Não inclina o corpo pra ajudar.",
    },
    {
      id: 7, name: "Panturrilha em Pé", namePt: "Panturrilha em Pé",
      muscle: "Panturrilha", sets: 3, reps: "15", restSeconds: 30,
      weight: "Máquina", gifUrl: "https://v2.exercisedb.io/image/Gv0HxPkG8XFNLQ",
      instruction: "Sobe na ponta dos pés o mais alto que conseguir. Pausa 1 segundo lá em cima. Desce devagar.",
      commonMistake: "Não faz meia repetição. Desce o calcanhar abaixo da plataforma pra alongar.",
    },
    {
      id: 8, name: "Prancha Frontal", namePt: "Prancha Frontal",
      muscle: "Core, Abdome", sets: 2, reps: "30s", restSeconds: 30,
      weight: null, gifUrl: "https://v2.exercisedb.io/image/cH-H8L3VjdKalc",
      instruction: "Apoio nos cotovelos e pontas dos pés. Corpo reto como uma tábua. Respira normal, não prende.",
      commonMistake: "Não deixa o quadril cair nem subir. Reta, reta, reta.",
    },
  ],
  cooldown: {
    duration: 300,
    stretches: [
      { name: "Alongamento de quadríceps", duration: 60, instruction: "Em pé, puxa o pé atrás. 30s cada lado." },
      { name: "Alongamento posterior", duration: 60, instruction: "Sentada, pernas estendidas, inclina pra frente." },
      { name: "Borboleta", duration: 60, instruction: "Sentada, solas dos pés juntas, empurra joelhos pro chão." },
      { name: "Pombo (pigeon)", duration: 60, instruction: "Uma perna dobrada na frente, outra esticada atrás. 30s cada." },
      { name: "Child's pose", duration: 60, instruction: "De joelhos, senta nos calcanhares, braços estendidos. Relaxa." },
    ]
  }
};

// ==========================================
// TIMER HOOK
// ==========================================
function useTimer(initialSeconds, onComplete) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (running && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            onCompleteRef.current?.();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, seconds]);

  const start = () => setRunning(true);
  const reset = (s) => { setSeconds(s); setRunning(false); };
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return { seconds, running, start, reset, formatted: formatTime(seconds) };
}

// ==========================================
// PHONE FRAME
// ==========================================
function PhoneFrame({ children }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#08080C", padding: "20px", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ width: 390, height: 844, background: C.bg, borderRadius: 44, overflow: "hidden", position: "relative", boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }}>
        <div style={{ height: 50, padding: "14px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10 }}>
          <span style={{ color: C.text, fontSize: 15, fontWeight: 600 }}>9:41</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: C.text, fontSize: 12 }}>●●●●</span>
            <span style={{ color: C.text, fontSize: 12 }}>🔋</span>
          </div>
        </div>
        <div style={{ height: "calc(100% - 50px)", overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PHASE: WARMUP
// ==========================================
function WarmupPhase({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = WORKOUT.warmup.exercises[step];
  const timer = useTimer(current.duration, () => {
    if (step < WORKOUT.warmup.exercises.length - 1) {
      setStep(s => s + 1);
    } else {
      onComplete();
    }
  });

  useEffect(() => { timer.reset(current.duration); }, [step]);

  return (
    <div style={{ padding: "0 20px 30px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0 16px" }}>
        <div style={{ fontSize: 12, color: C.yellow, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>☀️ Aquecimento</div>
        <div style={{ fontSize: 12, color: C.textMuted }}>{step + 1} de {WORKOUT.warmup.exercises.length}</div>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {WORKOUT.warmup.exercises.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? C.yellow : C.border, transition: "background 0.3s" }} />
        ))}
      </div>

      {/* Animation area */}
      <div style={{ width: "100%", height: 220, borderRadius: 20, background: `linear-gradient(135deg, ${C.yellow}11, ${C.yellow}05)`, border: `1px solid ${C.yellow}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -30, right: -30, width: 120, height: 120, background: `${C.yellow}15`, borderRadius: "50%", filter: "blur(40px)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏃‍♀️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{current.name}</div>
        </div>
      </div>

      {/* Instruction */}
      <div style={{ padding: 16, borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{current.instruction}</div>
      </div>

      {/* Timer */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 56, fontWeight: 700, color: C.text, letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>{timer.formatted}</div>
      </div>

      {/* Buttons */}
      {!timer.running ? (
        <button onClick={timer.start} style={{ width: "100%", padding: "16px 0", borderRadius: 14, background: C.yellow, border: "none", color: C.bg, fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          {step === 0 ? "Começar Aquecimento" : "Iniciar"} ▶
        </button>
      ) : (
        <button onClick={() => { if (step < WORKOUT.warmup.exercises.length - 1) { setStep(s => s + 1); } else { onComplete(); } }} style={{ width: "100%", padding: "16px 0", borderRadius: 14, background: "transparent", border: `1px solid ${C.yellow}66`, color: C.yellow, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Pular →
        </button>
      )}
    </div>
  );
}

// ==========================================
// PHASE: EXERCISE
// ==========================================
function ExercisePhase({ exerciseIndex, setIndex, currentSet, setCurrentSet, onAllDone }) {
  const ex = WORKOUT.exercises[exerciseIndex];
  const totalExercises = WORKOUT.exercises.length;
  const isTimeBased = typeof ex.reps === "string" && ex.reps.includes("s");
  const totalProgress = ((exerciseIndex * ex.sets + currentSet) / (totalExercises * 3)) * 100;

  return (
    <div style={{ padding: "0 20px 30px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0 12px" }}>
        <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
          Exercício {exerciseIndex + 1} de {totalExercises}
        </div>
        <div style={{ fontSize: 12, color: C.textMuted }}>
          {Math.round(totalProgress)}% completo
        </div>
      </div>

      {/* Overall progress bar */}
      <div style={{ height: 3, borderRadius: 2, background: C.border, marginBottom: 20 }}>
        <div style={{ height: 3, borderRadius: 2, background: C.accent, width: `${totalProgress}%`, transition: "width 0.5s" }} />
      </div>

      {/* GIF Area */}
      <div style={{ width: "100%", height: 240, borderRadius: 20, background: C.card, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, background: C.accentGlow, borderRadius: "50%", filter: "blur(40px)" }} />
        {/* In production: <img src={ex.gifUrl} /> */}
        <div style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🏋️‍♀️</div>
          <div style={{ fontSize: 11, color: C.textDim }}>GIF do exercício aqui</div>
          <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>ExerciseDB: {ex.gifUrl.split("/").pop()}</div>
        </div>
        {/* Weight badge */}
        {ex.weight && (
          <div style={{ position: "absolute", top: 12, right: 12, padding: "5px 10px", borderRadius: 8, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>⚖️ {ex.weight}</span>
          </div>
        )}
      </div>

      {/* Exercise name + muscle */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: C.text, letterSpacing: -0.5, marginBottom: 4 }}>{ex.namePt}</div>
        <div style={{ fontSize: 13, color: C.textMuted }}>{ex.muscle}</div>
      </div>

      {/* Instruction */}
      <div style={{ padding: 14, borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, marginBottom: 12 }}>
        <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{ex.instruction}</div>
      </div>

      {/* Common mistake */}
      <div style={{ padding: 14, borderRadius: 14, background: `${C.accent}0A`, border: `1px solid ${C.accent}22`, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 14 }}>⚠️</span>
          <div style={{ fontSize: 12, color: C.accent, lineHeight: 1.5 }}>{ex.commonMistake}</div>
        </div>
      </div>

      {/* Sets counter */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
        {Array.from({ length: ex.sets }, (_, i) => (
          <div key={i} style={{
            width: 44, height: 44, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center",
            background: i < currentSet ? C.green : i === currentSet ? C.accent : C.surface,
            border: i === currentSet ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
            fontSize: 14, fontWeight: 700,
            color: i < currentSet ? C.bg : i === currentSet ? "#fff" : C.textDim,
            transition: "all 0.3s",
          }}>
            {i < currentSet ? "✓" : i + 1}
          </div>
        ))}
      </div>

      {/* Current set info */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 14, color: C.textMuted, marginBottom: 6 }}>Série {currentSet + 1} de {ex.sets}</div>
        <div style={{ fontSize: 40, fontWeight: 700, color: C.text, letterSpacing: -1 }}>
          {isTimeBased ? ex.reps : `${ex.reps} reps`}
        </div>
        {ex.weight && <div style={{ fontSize: 14, color: C.yellow, fontWeight: 600, marginTop: 4 }}>Carga sugerida: {ex.weight}</div>}
      </div>

      {/* Complete set button */}
      <button
        onClick={() => {
          if (currentSet < ex.sets - 1) {
            setCurrentSet(currentSet + 1);
          } else if (exerciseIndex < totalExercises - 1) {
            setIndex(exerciseIndex + 1);
            setCurrentSet(0);
          } else {
            onAllDone();
          }
        }}
        style={{ width: "100%", padding: "16px 0", borderRadius: 14, background: C.accent, border: "none", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 20px ${C.accentGlow}`, marginBottom: 12 }}
      >
        {currentSet < ex.sets - 1 ? "Completei essa série ✓" : exerciseIndex < totalExercises - 1 ? "Completei! Próximo exercício →" : "Último exercício! Finalizar 🎉"}
      </button>

      {/* Swap exercise */}
      <button style={{ width: "100%", padding: "12px 0", borderRadius: 14, background: "transparent", border: "none", color: C.blue, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
        Esse exercício tá difícil? Trocar por outro
      </button>
    </div>
  );
}

// ==========================================
// PHASE: REST
// ==========================================
function RestPhase({ seconds, nextExercise, nextSet, onSkip }) {
  const timer = useTimer(seconds, onSkip);

  useEffect(() => { timer.start(); }, []);

  const pct = ((seconds - timer.seconds) / seconds) * 100;

  return (
    <div style={{ padding: "0 20px 30px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 600 }}>
      {/* Circular timer */}
      <div style={{ position: "relative", width: 200, height: 200, marginBottom: 32 }}>
        <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="100" cy="100" r="90" fill="none" stroke={C.border} strokeWidth="6" />
          <circle cx="100" cy="100" r="90" fill="none" stroke={C.green} strokeWidth="6"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={`${2 * Math.PI * 90 * (1 - pct / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", textAlign: "center" }}>
          <div style={{ fontSize: 48, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{timer.formatted}</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>Descanse</div>
        </div>
      </div>

      {/* Next exercise preview */}
      <div style={{ width: "100%", padding: 16, borderRadius: 16, background: C.card, border: `1px solid ${C.border}`, marginBottom: 24 }}>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>Próximo:</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 50, height: 50, borderRadius: 12, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏋️‍♀️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{nextExercise}</div>
            <div style={{ fontSize: 12, color: C.textMuted }}>Série {nextSet}</div>
          </div>
        </div>
      </div>

      {/* Skip button */}
      <button onClick={onSkip} style={{ padding: "14px 40px", borderRadius: 14, background: "transparent", border: `1px solid ${C.green}44`, color: C.green, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
        Pular descanso →
      </button>
    </div>
  );
}

// ==========================================
// PHASE: COOLDOWN
// ==========================================
function CooldownPhase({ onComplete }) {
  const [step, setStep] = useState(0);
  const current = WORKOUT.cooldown.stretches[step];
  const timer = useTimer(current.duration, () => {
    if (step < WORKOUT.cooldown.stretches.length - 1) setStep(s => s + 1);
    else onComplete();
  });

  useEffect(() => { timer.reset(current.duration); }, [step]);

  return (
    <div style={{ padding: "0 20px 30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0 16px" }}>
        <div style={{ fontSize: 12, color: C.purple, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>🧘‍♀️ Volta à Calma</div>
        <div style={{ fontSize: 12, color: C.textMuted }}>{step + 1} de {WORKOUT.cooldown.stretches.length}</div>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {WORKOUT.cooldown.stretches.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? C.purple : C.border }} />
        ))}
      </div>

      <div style={{ width: "100%", height: 200, borderRadius: 20, background: `linear-gradient(135deg, ${C.purple}11, ${C.purple}05)`, border: `1px solid ${C.purple}22`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🧘‍♀️</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{current.name}</div>
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: C.text, lineHeight: 1.6 }}>{current.instruction}</div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 48, fontWeight: 700, color: C.text, fontVariantNumeric: "tabular-nums" }}>{timer.formatted}</div>
      </div>

      {!timer.running ? (
        <button onClick={timer.start} style={{ width: "100%", padding: "16px 0", borderRadius: 14, background: C.purple, border: "none", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer" }}>
          Iniciar ▶
        </button>
      ) : (
        <button onClick={() => { if (step < WORKOUT.cooldown.stretches.length - 1) setStep(s => s + 1); else onComplete(); }} style={{ width: "100%", padding: "16px 0", borderRadius: 14, background: "transparent", border: `1px solid ${C.purple}44`, color: C.purple, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Pular →
        </button>
      )}
    </div>
  );
}

// ==========================================
// PHASE: COMPLETION
// ==========================================
function CompletionPhase({ onClose }) {
  const [showConfetti, setShowConfetti] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShowConfetti(false), 3000); return () => clearTimeout(t); }, []);

  return (
    <div style={{ padding: "40px 20px 30px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      {/* Confetti effect */}
      {showConfetti && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 200, pointerEvents: "none" }}>
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} style={{
              position: "absolute",
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 8, height: 8, borderRadius: i % 2 === 0 ? 4 : 1,
              background: [C.accent, C.green, C.yellow, C.purple, C.blue][i % 5],
              animation: `fall ${1 + Math.random() * 2}s ease-in forwards`,
              animationDelay: `${Math.random() * 0.5}s`,
              opacity: 0.8,
            }} />
          ))}
        </div>
      )}

      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: -0.5, marginBottom: 8 }}>Treino Completo!</div>
      <div style={{ fontSize: 15, color: C.textMuted, marginBottom: 32 }}>Você arrasou, Maria! 💪</div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          { icon: "⏱️", value: "47 min", label: "Tempo" },
          { icon: "💪", value: "8", label: "Exercícios" },
          { icon: "🔥", value: "~320", label: "Calorias" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: 16, borderRadius: 14, background: C.card, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{s.value}</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Volume */}
      <div style={{ padding: 16, borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 8 }}>Volume Total</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: C.green }}>4.280 kg</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Séries × Reps × Carga</div>
      </div>

      {/* Feedback */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 12 }}>Como foi o treino?</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {[
            { emoji: "😅", label: "Fácil", color: C.green },
            { emoji: "💪", label: "Bom", color: C.blue },
            { emoji: "🥵", label: "Pesado", color: C.orange },
            { emoji: "😣", label: "Senti dor", color: C.accent },
          ].map((f, i) => (
            <button key={i} style={{ padding: "12px 14px", borderRadius: 12, background: C.card, border: `1px solid ${C.border}`, cursor: "pointer", textAlign: "center", flex: 1 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>{f.emoji}</div>
              <div style={{ fontSize: 10, color: C.textMuted }}>{f.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Share card */}
      <div style={{ padding: 20, borderRadius: 16, background: `linear-gradient(135deg, ${C.accent}22, ${C.purple}22)`, border: `1px solid ${C.accent}33`, marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>Compartilhar na Comunidade</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Mostre que você treinou hoje!</div>
        <div style={{ padding: 14, borderRadius: 12, background: "rgba(0,0,0,0.3)", marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.accent, marginBottom: 4 }}>🏋️‍♀️ Maria treinou hoje</div>
          <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>Pernas e Glúteos — 47 min — 8 exercícios</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Volume: 4.280kg • 🔥 ~320 kcal</div>
        </div>
        <button style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: C.accent, border: "none", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Postar na Comunidade
        </button>
      </div>

      <button style={{ width: "100%", padding: "12px 0", borderRadius: 10, background: "transparent", border: "none", color: C.textMuted, fontSize: 13, cursor: "pointer" }}>
        Compartilhar no Instagram / TikTok
      </button>

      <button onClick={onClose} style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 12 }}>
        Voltar pro app
      </button>
    </div>
  );
}

// ==========================================
// MAIN WORKOUT SCREEN
// ==========================================
export default function WorkoutScreen() {
  // Phases: preview, warmup, exercise, rest, cooldown, complete
  const [phase, setPhase] = useState("preview");
  const [exIndex, setExIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(0);
  const [showRest, setShowRest] = useState(false);

  const currentEx = WORKOUT.exercises[exIndex];

  const handleSetComplete = () => {
    if (currentSet < currentEx.sets - 1) {
      // More sets — show rest
      setShowRest(true);
    } else if (exIndex < WORKOUT.exercises.length - 1) {
      // Next exercise — show rest
      setShowRest(true);
    } else {
      // All done — cooldown
      setPhase("cooldown");
    }
  };

  const handleRestDone = () => {
    setShowRest(false);
    if (currentSet < currentEx.sets - 1) {
      setCurrentSet(s => s + 1);
    } else {
      setExIndex(i => i + 1);
      setCurrentSet(0);
    }
  };

  // PREVIEW
  if (phase === "preview") {
    return (
      <PhoneFrame>
        <div style={{ padding: "12px 20px 30px" }}>
          <button onClick={() => setPhase("preview")} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: 18, fontSize: 16, cursor: "pointer", marginBottom: 12 }}>←</button>

          <div style={{ fontSize: 12, color: C.accent, fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>{WORKOUT.day}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: -0.5, marginBottom: 8 }}>{WORKOUT.title}</div>

          <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
            <span style={{ fontSize: 13, color: C.textMuted }}>⏱️ ~50 min</span>
            <span style={{ fontSize: 13, color: C.textMuted }}>💪 {WORKOUT.exercises.length} exercícios</span>
            <span style={{ fontSize: 13, color: C.textMuted }}>🔥 ~320 kcal</span>
          </div>

          {/* Muscle tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {["Glúteos", "Quadríceps", "Posterior", "Panturrilha", "Core"].map(m => (
              <span key={m} style={{ padding: "5px 12px", borderRadius: 20, background: `${C.accent}15`, color: C.accent, fontSize: 12, fontWeight: 500 }}>{m}</span>
            ))}
          </div>

          {/* Phases overview */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {[
              { label: "Aquecimento", time: "5 min", color: C.yellow },
              { label: "Treino", time: "~40 min", color: C.accent },
              { label: "Alongamento", time: "5 min", color: C.purple },
            ].map((p, i) => (
              <div key={i} style={{ flex: 1, padding: 10, borderRadius: 10, background: C.card, border: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: p.color, margin: "0 auto 6px" }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: C.text }}>{p.label}</div>
                <div style={{ fontSize: 10, color: C.textMuted }}>{p.time}</div>
              </div>
            ))}
          </div>

          {/* Exercise list */}
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 12 }}>Exercícios</div>
          {WORKOUT.exercises.map((ex, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < WORKOUT.exercises.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: C.accent, border: `1px solid ${C.border}`, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{ex.namePt}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{ex.muscle}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{ex.sets}×{ex.reps}</div>
                {ex.weight && <div style={{ fontSize: 11, color: C.textMuted }}>{ex.weight}</div>}
              </div>
            </div>
          ))}

          <button onClick={() => setPhase("warmup")} style={{ width: "100%", padding: "16px 0", borderRadius: 14, background: C.accent, border: "none", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", marginTop: 20, boxShadow: `0 4px 20px ${C.accentGlow}` }}>
            Começar Treino →
          </button>
        </div>
      </PhoneFrame>
    );
  }

  // WARMUP
  if (phase === "warmup") {
    return <PhoneFrame><WarmupPhase onComplete={() => setPhase("exercise")} /></PhoneFrame>;
  }

  // REST
  if (phase === "exercise" && showRest) {
    const nextEx = currentSet < currentEx.sets - 1 ? currentEx : WORKOUT.exercises[exIndex + 1];
    const nextSetNum = currentSet < currentEx.sets - 1 ? currentSet + 2 : 1;
    return (
      <PhoneFrame>
        <RestPhase
          seconds={currentEx.restSeconds}
          nextExercise={nextEx?.namePt || "Volta à calma"}
          nextSet={`Série ${nextSetNum} de ${nextEx?.sets || 0}`}
          onSkip={handleRestDone}
        />
      </PhoneFrame>
    );
  }

  // EXERCISE
  if (phase === "exercise") {
    return (
      <PhoneFrame>
        <ExercisePhase
          exerciseIndex={exIndex}
          setIndex={(i) => { setExIndex(i); setCurrentSet(0); }}
          currentSet={currentSet}
          setCurrentSet={(s) => {
            if (typeof s === 'function') {
              setCurrentSet(prev => {
                const newVal = s(prev);
                return newVal;
              });
            } else {
              setCurrentSet(s);
            }
            setShowRest(true);
          }}
          onAllDone={() => setPhase("cooldown")}
        />
      </PhoneFrame>
    );
  }

  // COOLDOWN
  if (phase === "cooldown") {
    return <PhoneFrame><CooldownPhase onComplete={() => setPhase("complete")} /></PhoneFrame>;
  }

  // COMPLETE
  if (phase === "complete") {
    return <PhoneFrame><CompletionPhase onClose={() => setPhase("preview")} /></PhoneFrame>;
  }

  return null;
}
