import { useState } from "react";

// ==========================================
// MEU SHAPE — App Prototype (Menu de Treinos)
// ==========================================

const COLORS = {
  bg: "#0D0D12",
  card: "#16161F",
  cardHover: "#1E1E2A",
  accent: "#E94560",
  accentGlow: "rgba(233,69,96,0.3)",
  green: "#16C79A",
  greenGlow: "rgba(22,199,154,0.15)",
  yellow: "#F5A623",
  orange: "#FF6B35",
  purple: "#6C63FF",
  blue: "#3B82F6",
  text: "#FFFFFF",
  textMuted: "#8B8B9E",
  textDim: "#5A5A6E",
  border: "#2A2A3A",
  surface: "#1A1A25",
};

const MUSCLES_DATA = {
  chest: { x: 50, y: 22, trained: "today" },
  shoulders: { x: 38, y: 18, trained: "none" },
  shouldersR: { x: 62, y: 18, trained: "none" },
  arms: { x: 30, y: 30, trained: "none" },
  armsR: { x: 70, y: 30, trained: "none" },
  abs: { x: 50, y: 35, trained: "recovering" },
  back: { x: 50, y: 28, trained: "none" },
  legs: { x: 42, y: 55, trained: "recent" },
  legsR: { x: 58, y: 55, trained: "recent" },
  glutes: { x: 50, y: 48, trained: "today" },
  calves: { x: 42, y: 72, trained: "none" },
  calvesR: { x: 58, y: 72, trained: "none" },
};

const muscleColor = (status) => {
  switch (status) {
    case "today": return COLORS.green;
    case "recent": return COLORS.yellow;
    case "recovering": return COLORS.orange;
    default: return "#2A2A3A";
  }
};

// ==========================================
// MOCK DATA
// ==========================================
const WEEK_PLAN = [
  { day: "SEG", name: "Pernas e Glúteos", duration: 45, exercises: 8, done: true, focus: ["legs", "glutes"] },
  { day: "TER", name: "Descanso", duration: 0, exercises: 0, done: true, rest: true },
  { day: "QUA", name: "Superiores", duration: 40, exercises: 7, done: true, focus: ["chest", "back", "arms"] },
  { day: "QUI", name: "Cardio LISS", duration: 35, exercises: 0, done: false, cardio: true, today: true },
  { day: "SEX", name: "Pernas + Glúteo", duration: 50, exercises: 9, done: false, focus: ["legs", "glutes"] },
  { day: "SAB", name: "Circuito Casa", duration: 25, exercises: 8, done: false, home: true },
  { day: "DOM", name: "Mobilidade", duration: 15, exercises: 10, done: false, stretch: true },
];

const TODAY_WORKOUT = {
  title: "Cardio LISS — Esteira",
  subtitle: "Caminhada com inclinação progressiva",
  duration: 35,
  type: "cardio",
  phases: 5,
  calories: 280,
  icon: "🏃‍♀️",
};

const CARDIO_PROTOCOLS = [
  { id: 1, name: "LISS Esteira", sub: "Caminhada com inclinação", duration: 40, level: "Iniciante", cal: 250, icon: "🚶‍♀️", color: COLORS.green },
  { id: 2, name: "12-3-30", sub: "Incline walking viral", duration: 35, level: "Intermediário", cal: 320, icon: "📈", color: COLORS.yellow },
  { id: 3, name: "HIIT Escada", sub: "Intervalos na stairmaster", duration: 20, level: "Avançado", cal: 350, icon: "🔥", color: COLORS.accent },
  { id: 4, name: "HIIT Elíptico", sub: "Intervalos no elíptico", duration: 25, level: "Intermediário", cal: 300, icon: "⚡", color: COLORS.orange },
  { id: 5, name: "Bike Moderado", sub: "Pedalada constante", duration: 30, level: "Iniciante", cal: 200, icon: "🚴‍♀️", color: COLORS.blue },
];

const HOME_WORKOUTS = [
  { id: 1, name: "Circuito Funcional", sub: "Corpo todo sem equipamento", duration: 22, level: "Iniciante", equip: "Corpo", icon: "💪", color: COLORS.purple },
  { id: 2, name: "Glúteo Express", sub: "Foco bumbum com elástico", duration: 18, level: "Iniciante", equip: "Elástico", icon: "🍑", color: COLORS.accent },
  { id: 3, name: "HIIT em Casa", sub: "Queima intensa 15 min", duration: 15, level: "Intermediário", equip: "Corpo", icon: "🔥", color: COLORS.orange },
  { id: 4, name: "Treino com Haltere", sub: "Força e definição", duration: 35, level: "Intermediário", equip: "Halteres", icon: "🏋️‍♀️", color: COLORS.blue },
];

const CHALLENGES = [
  { id: 1, name: "Desafio da Prancha", days: 14, currentDay: 8, streak: 8, target: "90s", icon: "🧘‍♀️", color: COLORS.green, active: true },
  { id: 2, name: "30 Dias Agachamento", days: 30, currentDay: 0, streak: 0, target: "100 reps", icon: "🦵", color: COLORS.purple, active: false },
  { id: 3, name: "Desafio Caminhada", days: 21, currentDay: 0, streak: 0, target: "45 min", icon: "🚶‍♀️", color: COLORS.blue, active: false },
];

const WALKING_PROTOCOLS = [
  { id: 1, name: "Caminhada Progressiva", sub: "Outdoor — 8 semanas", week: "Semana 3 de 8", duration: 30, icon: "🌴", color: COLORS.green },
  { id: 2, name: "Intervalos Esteira", sub: "Velocidade + inclinação", duration: 35, icon: "⏱️", color: COLORS.yellow },
  { id: 3, name: "Power Walk", sub: "Caminhada + trote", duration: 38, icon: "⚡", color: COLORS.orange },
];

const STRETCH_SESSIONS = [
  { id: 1, name: "Mobilidade Completa", sub: "Dia de descanso — corpo todo", duration: 15, icon: "🧘‍♀️", color: COLORS.purple },
  { id: 2, name: "Alongamento Pernas", sub: "Pós-treino de pernas", duration: 8, icon: "🦵", color: COLORS.green },
  { id: 3, name: "Alongamento Superiores", sub: "Pós-treino de costas/braços", duration: 8, icon: "💪", color: COLORS.blue },
];

const EXERCISES_PREVIEW = [
  { name: "Agachamento com Haltere", sets: 3, reps: "12-15", muscle: "Glúteos, Quadríceps" },
  { name: "Hip Thrust no Banco", sets: 3, reps: "12", muscle: "Glúteos" },
  { name: "Afundo Búlgaro", sets: 3, reps: "10 cada", muscle: "Glúteos, Quadríceps" },
  { name: "Cadeira Extensora", sets: 3, reps: "12-15", muscle: "Quadríceps" },
  { name: "Cadeira Flexora", sets: 3, reps: "12", muscle: "Posterior" },
  { name: "Abdutora", sets: 3, reps: "15", muscle: "Glúteo Médio" },
  { name: "Panturrilha em Pé", sets: 3, reps: "15", muscle: "Panturrilha" },
  { name: "Prancha Frontal", sets: 2, reps: "30s", muscle: "Core" },
];

// ==========================================
// COMPONENTS
// ==========================================

function PhoneFrame({ children }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#08080C", padding: "20px", fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      <div style={{ width: 390, height: 844, background: COLORS.bg, borderRadius: 44, overflow: "hidden", position: "relative", boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)" }}>
        {/* Status bar */}
        <div style={{ height: 54, padding: "14px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 10 }}>
          <span style={{ color: COLORS.text, fontSize: 15, fontWeight: 600 }}>9:41</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: COLORS.text, fontSize: 12 }}>●●●●</span>
            <span style={{ color: COLORS.text, fontSize: 12 }}>WiFi</span>
            <span style={{ color: COLORS.text, fontSize: 12 }}>🔋</span>
          </div>
        </div>
        {/* Content */}
        <div style={{ height: "calc(100% - 54px - 80px)", overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function BottomNav({ active, setActive }) {
  const tabs = [
    { id: "home", icon: "🏠", label: "Home" },
    { id: "treinos", icon: "🏋️‍♀️", label: "Treinos" },
    { id: "comunidade", icon: "👥", label: "Social" },
    { id: "progresso", icon: "📊", label: "Progresso" },
    { id: "perfil", icon: "👤", label: "Perfil" },
  ];
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, #0D0D12 60%, transparent)", zIndex: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", height: 66, paddingBottom: 14, paddingTop: 6, background: "rgba(13,13,18,0.95)", backdropFilter: "blur(20px)", borderTop: `1px solid ${COLORS.border}` }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActive(t.id)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, padding: "4px 12px", transition: "all 0.2s" }}>
            <span style={{ fontSize: 22, filter: active === t.id ? "none" : "grayscale(0.8) opacity(0.5)" }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active === t.id ? 600 : 400, color: active === t.id ? COLORS.accent : COLORS.textDim, letterSpacing: 0.3 }}>{t.label}</span>
            {active === t.id && <div style={{ width: 4, height: 4, borderRadius: 2, background: COLORS.accent, marginTop: -1 }} />}
          </button>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px 8px" }}>
      <span style={{ color: COLORS.text, fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>{title}</span>
      {action && <span style={{ color: COLORS.accent, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{action}</span>}
    </div>
  );
}

function WeekStrip() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "0 20px", marginBottom: 16 }}>
      {WEEK_PLAN.map((d, i) => (
        <div key={i} style={{
          flex: 1, textAlign: "center", padding: "10px 0 8px", borderRadius: 12,
          background: d.today ? COLORS.accent : d.done ? "rgba(22,199,154,0.1)" : COLORS.card,
          border: d.today ? "none" : `1px solid ${d.done ? "rgba(22,199,154,0.2)" : COLORS.border}`,
          transition: "all 0.2s",
        }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: d.today ? "#fff" : COLORS.textMuted, letterSpacing: 0.5, marginBottom: 4 }}>{d.day}</div>
          {d.rest ? (
            <div style={{ fontSize: 14 }}>😴</div>
          ) : d.done ? (
            <div style={{ fontSize: 14, color: COLORS.green }}>✓</div>
          ) : d.today ? (
            <div style={{ fontSize: 14 }}>🔥</div>
          ) : (
            <div style={{ width: 6, height: 6, borderRadius: 3, background: COLORS.textDim, margin: "4px auto" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function TodayCard() {
  return (
    <div style={{ margin: "0 20px 16px", padding: 20, borderRadius: 20, background: `linear-gradient(135deg, ${COLORS.accent}22, ${COLORS.accent}08)`, border: `1px solid ${COLORS.accent}44`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, background: COLORS.accentGlow, borderRadius: "50%", filter: "blur(40px)" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600, letterSpacing: 1, marginBottom: 6, textTransform: "uppercase" }}>Treino de Hoje</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5, marginBottom: 4 }}>{TODAY_WORKOUT.title}</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>{TODAY_WORKOUT.subtitle}</div>
        </div>
        <span style={{ fontSize: 36 }}>{TODAY_WORKOUT.icon}</span>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12 }}>⏱️</span>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>{TODAY_WORKOUT.duration} min</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12 }}>🔥</span>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>{TODAY_WORKOUT.calories} kcal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12 }}>📊</span>
          <span style={{ fontSize: 13, color: COLORS.textMuted }}>{TODAY_WORKOUT.phases} fases</span>
        </div>
      </div>
      <button style={{ width: "100%", padding: "14px 0", borderRadius: 14, background: COLORS.accent, border: "none", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: 0.3, boxShadow: `0 4px 20px ${COLORS.accentGlow}` }}>
        Começar Treino →
      </button>
    </div>
  );
}

function MuscleHeatMap() {
  return (
    <div style={{ margin: "0 20px 8px", padding: 16, borderRadius: 16, background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>Mapa Muscular</span>
        <span style={{ fontSize: 11, color: COLORS.textMuted }}>Última semana</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Silhouette */}
        <div style={{ position: "relative", width: 100, height: 160, flexShrink: 0 }}>
          <svg viewBox="0 0 100 160" width="100" height="160">
            {/* Simple female silhouette */}
            <ellipse cx="50" cy="14" rx="11" ry="13" fill="#2A2A3A" />
            {/* Neck */}
            <rect x="46" y="26" width="8" height="6" rx="2" fill="#2A2A3A" />
            {/* Shoulders + Chest */}
            <ellipse cx="50" cy="42" rx="22" ry="14" fill={muscleColor(MUSCLES_DATA.chest.trained)} opacity="0.8" />
            {/* Arms */}
            <ellipse cx="26" cy="52" rx="5" ry="16" fill={muscleColor(MUSCLES_DATA.arms.trained)} opacity="0.8" transform="rotate(-8, 26, 52)" />
            <ellipse cx="74" cy="52" rx="5" ry="16" fill={muscleColor(MUSCLES_DATA.armsR.trained)} opacity="0.8" transform="rotate(8, 74, 52)" />
            {/* Core */}
            <ellipse cx="50" cy="62" rx="16" ry="10" fill={muscleColor(MUSCLES_DATA.abs.trained)} opacity="0.8" />
            {/* Hips/Glutes */}
            <ellipse cx="50" cy="78" rx="20" ry="10" fill={muscleColor(MUSCLES_DATA.glutes.trained)} opacity="0.8" />
            {/* Legs */}
            <ellipse cx="40" cy="105" rx="9" ry="24" fill={muscleColor(MUSCLES_DATA.legs.trained)} opacity="0.8" />
            <ellipse cx="60" cy="105" rx="9" ry="24" fill={muscleColor(MUSCLES_DATA.legsR.trained)} opacity="0.8" />
            {/* Calves */}
            <ellipse cx="40" cy="137" rx="6" ry="14" fill={muscleColor(MUSCLES_DATA.calves.trained)} opacity="0.8" />
            <ellipse cx="60" cy="137" rx="6" ry="14" fill={muscleColor(MUSCLES_DATA.calvesR.trained)} opacity="0.8" />
          </svg>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {[
            { color: COLORS.green, label: "Treinado hoje", muscles: "Peito, Glúteos" },
            { color: COLORS.yellow, label: "Últimos 2-3 dias", muscles: "Pernas" },
            { color: COLORS.orange, label: "Em recuperação", muscles: "Abdome" },
            { color: "#2A2A3A", label: "Não treinado", muscles: "Costas, Braços, Ombros" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.text }}>{item.label}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>{item.muscles}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProtocolCard({ item, compact }) {
  return (
    <div style={{
      minWidth: compact ? 200 : "auto",
      padding: compact ? 14 : 16,
      borderRadius: 16,
      background: COLORS.card,
      border: `1px solid ${COLORS.border}`,
      cursor: "pointer",
      transition: "all 0.2s",
      flex: compact ? "0 0 auto" : 1,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: compact ? 24 : 28 }}>{item.icon}</span>
        {item.level && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${item.color}22`, color: item.color, fontWeight: 600 }}>{item.level}</span>}
        {item.week && <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 6, background: `${COLORS.green}22`, color: COLORS.green, fontWeight: 600 }}>{item.week}</span>}
      </div>
      <div style={{ fontSize: compact ? 14 : 15, fontWeight: 700, color: COLORS.text, marginBottom: 3, letterSpacing: -0.2 }}>{item.name}</div>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>{item.sub}</div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: COLORS.textMuted }}>⏱️ {item.duration} min</span>
        {item.cal && <span style={{ fontSize: 11, color: COLORS.textMuted }}>🔥 {item.cal} kcal</span>}
        {item.equip && <span style={{ fontSize: 11, color: COLORS.textMuted }}>🎯 {item.equip}</span>}
      </div>
    </div>
  );
}

function ChallengeCard({ item }) {
  const pct = item.active ? (item.currentDay / item.days) * 100 : 0;
  return (
    <div style={{
      padding: 16, borderRadius: 16, background: COLORS.card,
      border: item.active ? `1px solid ${item.color}44` : `1px solid ${COLORS.border}`,
      position: "relative", overflow: "hidden",
    }}>
      {item.active && <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, background: `${item.color}22`, borderRadius: "50%", filter: "blur(20px)" }} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24 }}>{item.icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{item.name}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>{item.days} dias — Meta: {item.target}</div>
          </div>
        </div>
        {item.active && <div style={{ padding: "3px 8px", borderRadius: 6, background: `${item.color}22`, fontSize: 10, fontWeight: 700, color: item.color }}>ATIVO</div>}
      </div>
      {item.active && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>Dia {item.currentDay} de {item.days}</span>
            <span style={{ fontSize: 12, color: item.color, fontWeight: 600 }}>🔥 {item.streak} dias seguidos</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: COLORS.border }}>
            <div style={{ height: 6, borderRadius: 3, background: item.color, width: `${pct}%`, transition: "width 0.5s" }} />
          </div>
        </>
      )}
      {!item.active && (
        <button style={{ marginTop: 8, padding: "8px 16px", borderRadius: 10, background: "transparent", border: `1px solid ${item.color}66`, color: item.color, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Participar →
        </button>
      )}
    </div>
  );
}

function WorkoutPreview({ onClose }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 30, overflowY: "auto" }}>
      <div style={{ padding: "60px 20px 100px" }}>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: 18, fontSize: 18, cursor: "pointer", marginBottom: 16 }}>✕</button>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>Sexta-feira</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5, marginBottom: 6 }}>Pernas e Glúteos</div>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>⏱️ 50 min</span>
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>💪 9 exercícios</span>
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>🔥 ~320 kcal</span>
          </div>
        </div>

        {/* Muscle focus */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["Glúteos", "Quadríceps", "Posterior", "Core"].map(m => (
            <span key={m} style={{ padding: "5px 12px", borderRadius: 20, background: `${COLORS.accent}18`, color: COLORS.accent, fontSize: 12, fontWeight: 500 }}>{m}</span>
          ))}
        </div>

        {/* Exercises list */}
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Exercícios</div>
        {EXERCISES_PREVIEW.map((ex, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < EXERCISES_PREVIEW.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: COLORS.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: COLORS.accent, flexShrink: 0 }}>
              {i + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>{ex.name}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>{ex.muscle}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{ex.sets}x{ex.reps}</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 20 }}>
          <button style={{ width: "100%", padding: "16px 0", borderRadius: 14, background: COLORS.accent, border: "none", color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 20px ${COLORS.accentGlow}` }}>
            Começar Treino →
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// SCREENS
// ==========================================

function HomeScreen() {
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: "12px 20px 16px" }}>
        <div style={{ fontSize: 14, color: COLORS.textMuted, marginBottom: 2 }}>Olá,</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 }}>Maria 👋</div>
      </div>
      <WeekStrip />
      <TodayCard />
      <MuscleHeatMap />
      <SectionTitle title="Desafio Ativo" />
      <div style={{ padding: "0 20px" }}>
        <ChallengeCard item={CHALLENGES[0]} />
      </div>
      <SectionTitle title="Suas Estatísticas" action="Ver tudo" />
      <div style={{ display: "flex", gap: 10, padding: "0 20px", marginBottom: 20 }}>
        {[
          { label: "Treinos este mês", value: "12", icon: "🏋️‍♀️" },
          { label: "Streak atual", value: "5 dias", icon: "🔥" },
          { label: "Tempo total", value: "9h", icon: "⏱️" },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, padding: 14, borderRadius: 14, background: COLORS.card, border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.text }}>{s.value}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TreinosScreen() {
  const [tab, setTab] = useState("plano");
  const [preview, setPreview] = useState(false);
  const tabs = [
    { id: "plano", label: "Meu Plano", icon: "📋" },
    { id: "cardio", label: "Cardio", icon: "🏃‍♀️" },
    { id: "casa", label: "Em Casa", icon: "🏠" },
    { id: "caminhada", label: "Caminhada", icon: "🚶‍♀️" },
    { id: "desafios", label: "Desafios", icon: "🏆" },
    { id: "along", label: "Alongamento", icon: "🧘‍♀️" },
  ];

  return (
    <div style={{ paddingBottom: 20, position: "relative" }}>
      {preview && <WorkoutPreview onClose={() => setPreview(false)} />}
      <div style={{ padding: "8px 20px 12px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 }}>Treinos</div>
      </div>

      {/* Tab bar horizontal scroll */}
      <div style={{ display: "flex", gap: 8, padding: "0 20px", overflowX: "auto", marginBottom: 16, msOverflowStyle: "none", scrollbarWidth: "none" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer",
            background: tab === t.id ? COLORS.accent : COLORS.card,
            color: tab === t.id ? "#fff" : COLORS.textMuted,
            fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Meu Plano */}
      {tab === "plano" && (
        <div style={{ padding: "0 20px" }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>Semana 3 — Construção</div>
          {WEEK_PLAN.map((d, i) => (
            <div key={i} onClick={() => !d.rest && !d.cardio && !d.stretch && setPreview(true)} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 0",
              borderBottom: i < WEEK_PLAN.length - 1 ? `1px solid ${COLORS.border}` : "none",
              cursor: d.rest ? "default" : "pointer", opacity: d.done ? 0.6 : 1,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                background: d.today ? COLORS.accent : d.done ? `${COLORS.green}22` : COLORS.surface,
                border: d.today ? "none" : `1px solid ${d.done ? COLORS.green + "33" : COLORS.border}`,
                fontSize: 12, fontWeight: 700, color: d.today ? "#fff" : d.done ? COLORS.green : COLORS.textMuted,
              }}>
                {d.done ? "✓" : d.day}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>{d.name}</div>
                {!d.rest && <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  {d.duration} min {d.exercises > 0 ? `• ${d.exercises} exercícios` : ""}
                </div>}
              </div>
              {d.today && <div style={{ padding: "6px 12px", borderRadius: 8, background: COLORS.accent, fontSize: 12, fontWeight: 600, color: "#fff" }}>HOJE</div>}
              {!d.rest && !d.today && !d.done && <span style={{ color: COLORS.textDim, fontSize: 18 }}>›</span>}
            </div>
          ))}
        </div>
      )}

      {/* TAB: Cardio */}
      {tab === "cardio" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>Protocolos de cardio guiado com velocidade e inclinação em tempo real</div>
          {CARDIO_PROTOCOLS.map(c => <ProtocolCard key={c.id} item={c} />)}
        </div>
      )}

      {/* TAB: Em Casa */}
      {tab === "casa" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>Treinos completos sem precisar de academia</div>
          {HOME_WORKOUTS.map(h => <ProtocolCard key={h.id} item={h} />)}
        </div>
      )}

      {/* TAB: Caminhada */}
      {tab === "caminhada" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>Protocolos progressivos de caminhada — esteira e outdoor</div>
          {WALKING_PROTOCOLS.map(w => <ProtocolCard key={w.id} item={w} />)}
        </div>
      )}

      {/* TAB: Desafios */}
      {tab === "desafios" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>Desafios curtos com ranking na comunidade</div>
          {CHALLENGES.map(c => <ChallengeCard key={c.id} item={c} />)}
        </div>
      )}

      {/* TAB: Alongamento */}
      {tab === "along" && (
        <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 4 }}>Alongamento e mobilidade — gerado baseado no seu treino</div>
          {STRETCH_SESSIONS.map(s => <ProtocolCard key={s.id} item={s} />)}
        </div>
      )}
    </div>
  );
}

function CommunityScreen() {
  const posts = [
    { name: "Ana Paula", city: "Fortaleza", time: "2h", type: "trained", text: "Treino de pernas completo! 50 min de dedicação 💪", likes: 24, comments: 5, badge: "Semana 3" },
    { name: "Juliana", city: "São Paulo", time: "4h", type: "evolution", text: "1 mês de Meu Shape! -3kg e me sentindo outra pessoa 🔥", likes: 89, comments: 18, badge: "1 Mês" },
    { name: "Camila", city: "Fortaleza", time: "6h", type: "challenge", text: "Dia 14 do Desafio da Prancha — 90 segundos! Consegui! 🏆", likes: 56, comments: 12, badge: "Prancha" },
  ];
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: "8px 20px 16px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 }}>Comunidade</div>
      </div>
      {posts.map((post, i) => (
        <div key={i} style={{ margin: "0 20px 12px", padding: 16, borderRadius: 16, background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: `${COLORS.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: COLORS.accent }}>{post.name[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text }}>{post.name}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{post.city} • {post.time} atrás</div>
            </div>
            <span style={{ padding: "3px 8px", borderRadius: 6, background: `${COLORS.green}22`, color: COLORS.green, fontSize: 10, fontWeight: 600 }}>{post.badge}</span>
          </div>
          <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.5, marginBottom: 12 }}>{post.text}</div>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ fontSize: 13, color: COLORS.textMuted, cursor: "pointer" }}>❤️ {post.likes}</span>
            <span style={{ fontSize: 13, color: COLORS.textMuted, cursor: "pointer" }}>💬 {post.comments}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgressScreen() {
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: "8px 20px 16px" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.text, letterSpacing: -0.5 }}>Progresso</div>
      </div>
      {/* Weight chart mock */}
      <div style={{ margin: "0 20px 16px", padding: 16, borderRadius: 16, background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Evolução de Peso</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100, marginBottom: 8 }}>
          {[72, 71.5, 71.2, 70.8, 70.5, 70.2, 70, 69.6].map((w, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ width: "100%", height: `${(w - 68) * 20}px`, borderRadius: 4, background: i === 7 ? COLORS.green : `${COLORS.green}44`, transition: "all 0.3s" }} />
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>Sem 1</span>
          <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>69.6kg (hoje)</span>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>Sem 8</span>
        </div>
        <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: `${COLORS.green}12`, textAlign: "center" }}>
          <span style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>-2.4kg desde o início 🎉</span>
        </div>
      </div>
      {/* Calendar */}
      <div style={{ margin: "0 20px 16px", padding: 16, borderRadius: 16, background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Março 2026</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
            <div key={i} style={{ textAlign: "center", fontSize: 10, color: COLORS.textDim, padding: 4 }}>{d}</div>
          ))}
          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => {
            const trained = [1, 3, 5, 6, 8, 10, 12, 13, 15, 17, 19, 20].includes(d);
            const isToday = d === 8;
            return (
              <div key={d} style={{
                textAlign: "center", padding: 6, borderRadius: 6, fontSize: 11,
                background: isToday ? COLORS.accent : trained ? `${COLORS.green}22` : "transparent",
                color: isToday ? "#fff" : trained ? COLORS.green : d > 8 ? COLORS.textDim : COLORS.textMuted,
                fontWeight: isToday || trained ? 600 : 400,
              }}>{d}</div>
            );
          })}
        </div>
      </div>
      {/* Photo comparison */}
      <div style={{ margin: "0 20px", padding: 16, borderRadius: 16, background: COLORS.card, border: `1px solid ${COLORS.border}`, textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 8 }}>Fotos de Evolução</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 8 }}>
          <div style={{ width: 80, height: 110, borderRadius: 10, background: COLORS.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` }}>Semana 1</div>
          <div style={{ display: "flex", alignItems: "center", color: COLORS.accent }}>→</div>
          <div style={{ width: 80, height: 110, borderRadius: 10, background: `${COLORS.accent}11`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: COLORS.accent, fontWeight: 600, border: `1px dashed ${COLORS.accent}44` }}>+ Foto</div>
        </div>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Tire uma foto na semana 4 pra comparar!</span>
      </div>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div style={{ paddingBottom: 20 }}>
      <div style={{ padding: "8px 20px 16px", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 56, height: 56, borderRadius: 28, background: `${COLORS.accent}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: COLORS.accent }}>M</div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.text }}>Maria</div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>Fortaleza, CE • Plano Trimestral</div>
        </div>
      </div>
      <div style={{ margin: "0 20px 16px", padding: 16, borderRadius: 16, background: COLORS.card, border: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 12 }}>Seu Diagnóstico</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { label: "Seu Corpo", score: 4, max: 10 },
            { label: "Experiência", score: 2, max: 10 },
            { label: "Rotina", score: 7, max: 10 },
            { label: "Cabeça", score: 5, max: 10 },
          ].map((axis, i) => (
            <div key={i} style={{ padding: 10, borderRadius: 10, background: COLORS.surface }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>{axis.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: axis.score <= 3 ? COLORS.accent : axis.score <= 6 ? COLORS.yellow : COLORS.green }}>{axis.score}</div>
                <div style={{ fontSize: 12, color: COLORS.textDim }}>/10</div>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: COLORS.border, marginTop: 6 }}>
                <div style={{ height: 4, borderRadius: 2, background: axis.score <= 3 ? COLORS.accent : axis.score <= 6 ? COLORS.yellow : COLORS.green, width: `${(axis.score / axis.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Quick links */}
      {["Ferramentas (TMB, Água, Zona Cardíaca)", "Configurações", "Gerenciar Plano", "Ajuda e Suporte"].map((item, i) => (
        <div key={i} style={{ margin: "0 20px", padding: "14px 0", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
          <span style={{ fontSize: 14, color: COLORS.text }}>{item}</span>
          <span style={{ color: COLORS.textDim }}>›</span>
        </div>
      ))}
    </div>
  );
}

// ==========================================
// MAIN APP
// ==========================================
export default function MeuShapeApp() {
  const [screen, setScreen] = useState("home");

  return (
    <PhoneFrame>
      {screen === "home" && <HomeScreen />}
      {screen === "treinos" && <TreinosScreen />}
      {screen === "comunidade" && <CommunityScreen />}
      {screen === "progresso" && <ProgressScreen />}
      {screen === "perfil" && <ProfileScreen />}
      <BottomNav active={screen} setActive={setScreen} />
    </PhoneFrame>
  );
}
