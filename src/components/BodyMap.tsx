import React from "react";

type MuscleStatus = "today" | "recent" | "recovering" | "none";

interface MuscleData {
  [key: string]: MuscleStatus;
}

interface BodyMapProps {
  muscleMap: MuscleData;
  statusColor: (status: MuscleStatus) => string;
}

/**
 * Premium anatomical female body map — front + back views
 * Solar-inspired palette with warm glow, feminine proportions,
 * subtle depth via gradients & soft strokes.
 */
export const BodyMap: React.FC<BodyMapProps> = ({ muscleMap, statusColor }) => {
  const c = (key: string) => statusColor(muscleMap[key] ?? "none");
  const outline = "hsl(var(--muted-foreground) / 0.25)";
  const skinBase = "hsl(var(--muted) / 0.15)";
  const sw = 0.5;

  const glowFilter = (id: string, color: string) => (
    <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
      <feFlood floodColor={color} floodOpacity="0.35" result="color" />
      <feComposite in="color" in2="blur" operator="in" result="glow" />
      <feMerge>
        <feMergeNode in="glow" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );

  /** Wraps muscle path with subtle glow when active */
  const MuscleZone: React.FC<{
    d: string;
    muscle: string;
    opacity?: number;
    strokeW?: number;
  }> = ({ d, muscle, opacity = 0.88, strokeW = sw }) => {
    const status = muscleMap[muscle] ?? "none";
    const fill = c(muscle);
    const isActive = status !== "none";
    return (
      <path
        d={d}
        fill={fill}
        stroke={outline}
        strokeWidth={strokeW}
        opacity={opacity}
        strokeLinejoin="round"
        style={{
          filter: isActive ? `drop-shadow(0 0 4px ${fill})` : undefined,
          transition: "fill 0.4s ease, filter 0.4s ease",
        }}
      />
    );
  };

  const SilhouetteView: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex flex-col items-center">
      <span className="text-[8px] text-muted-foreground mb-1 font-sans tracking-[0.15em] uppercase opacity-60">
        {label}
      </span>
      <svg viewBox="0 0 200 440" className="w-[72px] h-[155px]" fill="none">
        {children}
      </svg>
    </div>
  );

  /* ── Shared head + neck ── */
  const HeadNeck = () => (
    <>
      {/* Hair hint */}
      <ellipse cx="100" cy="24" rx="24" ry="28" fill={skinBase} stroke={outline} strokeWidth={0.3} opacity={0.5} />
      {/* Head */}
      <ellipse cx="100" cy="28" rx="18" ry="22" fill={skinBase} stroke={outline} strokeWidth={sw} />
      {/* Neck */}
      <path d="M92 49 Q92 56 90 62 L110 62 Q108 56 108 49" fill={skinBase} stroke={outline} strokeWidth={sw * 0.6} />
    </>
  );

  /* ── Hands ── */
  const Hands = ({ side }: { side: "left" | "right" }) => {
    const x = side === "left" ? 28 : 172;
    return <ellipse cx={x} cy="206" rx="5" ry="7" fill={skinBase} stroke={outline} strokeWidth={0.3} opacity={0.5} />;
  };

  /* ── Feet ── */
  const Feet = () => (
    <>
      <path d="M68 388 C64 392 62 396 66 400 L86 400 C90 396 88 392 84 388" fill={skinBase} stroke={outline} strokeWidth={0.3} />
      <path d="M116 388 C112 392 110 396 114 400 L134 400 C138 396 136 392 132 388" fill={skinBase} stroke={outline} strokeWidth={0.3} />
    </>
  );

  return (
    <div className="flex items-end justify-center gap-3">
      {/* ─── FRONT VIEW ─── */}
      <SilhouetteView label="Frente">
        <HeadNeck />

        {/* Shoulders */}
        <MuscleZone muscle="shoulders" d="M70 72 C60 68 44 70 37 80 C34 86 35 93 39 97 L60 92 C64 86 68 80 70 72Z" />
        <MuscleZone muscle="shoulders" d="M130 72 C140 68 156 70 163 80 C166 86 165 93 161 97 L140 92 C136 86 132 80 130 72Z" />

        {/* Chest — softer feminine shape */}
        <MuscleZone muscle="chest" d="
          M70 72 C76 68 88 65 100 65 C112 65 124 68 130 72
          C135 78 137 88 133 95 L124 102
          C114 108 100 112 100 112
          C100 112 86 108 76 102 L67 95
          C63 88 65 78 70 72Z
        " opacity={0.82} />

        {/* Biceps */}
        <MuscleZone muscle="arms" d="M39 97 C35 105 31 118 29 133 C27 148 29 160 31 166 L39 166 C41 160 43 148 43 133 C43 118 41 105 39 97Z" />
        <MuscleZone muscle="arms" d="M161 97 C165 105 169 118 171 133 C173 148 171 160 169 166 L161 166 C159 160 157 148 157 133 C157 118 159 105 161 97Z" />

        {/* Forearms */}
        <MuscleZone muscle="arms" d="M31 166 C29 178 27 192 27 202 L35 204 C37 194 39 180 39 166Z" opacity={0.7} strokeW={sw * 0.6} />
        <MuscleZone muscle="arms" d="M169 166 C171 178 173 192 173 202 L165 204 C163 194 161 180 161 166Z" opacity={0.7} strokeW={sw * 0.6} />

        {/* Abs — with definition lines */}
        <MuscleZone muscle="abs" d="
          M76 110 C82 107 90 104 100 104 C110 104 118 107 124 110
          L128 118 C130 132 130 148 128 164
          L124 172 C116 176 108 178 100 178
          C92 178 84 176 76 172 L72 164
          C70 148 70 132 72 118Z
        " />
        {/* Ab lines */}
        <line x1="100" y1="110" x2="100" y2="172" stroke={outline} strokeWidth={0.3} opacity={0.2} />
        <path d="M80 122 Q100 118 120 122" fill="none" stroke={outline} strokeWidth={0.25} opacity={0.15} />
        <path d="M78 136 Q100 132 122 136" fill="none" stroke={outline} strokeWidth={0.25} opacity={0.15} />
        <path d="M78 150 Q100 146 122 150" fill="none" stroke={outline} strokeWidth={0.25} opacity={0.15} />
        <path d="M80 163 Q100 159 120 163" fill="none" stroke={outline} strokeWidth={0.25} opacity={0.15} />

        {/* Hip / Glute front */}
        <MuscleZone muscle="glutes" d="
          M76 178 C84 175 92 173 100 173 C108 173 116 175 124 178
          C130 184 134 194 130 206
          L70 206 C66 194 70 184 76 178Z
        " opacity={0.65} />

        {/* Quads — tapered feminine shape */}
        <MuscleZone muscle="legs" d="
          M70 206 C68 228 64 258 62 284 C60 298 62 304 66 306
          L88 306 C92 304 94 298 92 284
          C90 258 86 228 84 206Z
        " />
        <MuscleZone muscle="legs" d="
          M130 206 C132 228 136 258 138 284 C140 298 138 304 134 306
          L112 306 C108 304 106 298 108 284
          C110 258 114 228 116 206Z
        " />

        {/* Calves — elegant taper */}
        <MuscleZone muscle="calves" d="
          M66 306 C63 322 61 342 62 358 C62 370 66 378 72 382
          L84 382 C90 378 92 370 92 358
          C93 342 91 322 88 306Z
        " opacity={0.78} strokeW={sw * 0.7} />
        <MuscleZone muscle="calves" d="
          M134 306 C137 322 139 342 138 358 C138 370 134 378 128 382
          L116 382 C110 378 108 370 108 358
          C107 342 109 322 112 306Z
        " opacity={0.78} strokeW={sw * 0.7} />

        <Hands side="left" />
        <Hands side="right" />
        <Feet />
      </SilhouetteView>

      {/* ─── BACK VIEW ─── */}
      <SilhouetteView label="Costas">
        <HeadNeck />

        {/* Rear Delts */}
        <MuscleZone muscle="shoulders" d="M70 72 C60 68 44 70 37 80 C34 86 35 93 39 97 L60 92 C64 86 68 80 70 72Z" />
        <MuscleZone muscle="shoulders" d="M130 72 C140 68 156 70 163 80 C166 86 165 93 161 97 L140 92 C136 86 132 80 130 72Z" />

        {/* Upper Back / Traps */}
        <MuscleZone muscle="back" d="
          M70 72 C80 68 90 66 100 66 C110 66 120 68 130 72
          C132 78 132 86 130 90 L70 90 C68 86 68 78 70 72Z
        " />

        {/* Lats */}
        <MuscleZone muscle="back" d="
          M70 90 L130 90
          C136 100 140 118 138 136
          L130 146 C118 154 108 158 100 158
          C92 158 82 154 70 146 L62 136
          C60 118 64 100 70 90Z
        " />

        {/* Spine line */}
        <line x1="100" y1="68" x2="100" y2="174" stroke={outline} strokeWidth={0.35} opacity={0.2} />
        {/* Lat lines */}
        <path d="M82 96 Q100 92 118 96" fill="none" stroke={outline} strokeWidth={0.2} opacity={0.12} />
        <path d="M76 118 Q100 112 124 118" fill="none" stroke={outline} strokeWidth={0.2} opacity={0.12} />

        {/* Triceps */}
        <MuscleZone muscle="arms" d="M39 97 C35 105 31 118 29 133 C27 148 29 160 31 166 L39 166 C41 160 43 148 43 133 C43 118 41 105 39 97Z" />
        <MuscleZone muscle="arms" d="M161 97 C165 105 169 118 171 133 C173 148 171 160 169 166 L161 166 C159 160 157 148 157 133 C157 118 159 105 161 97Z" />

        {/* Forearms */}
        <MuscleZone muscle="arms" d="M31 166 C29 178 27 192 27 202 L35 204 C37 194 39 180 39 166Z" opacity={0.7} strokeW={sw * 0.6} />
        <MuscleZone muscle="arms" d="M169 166 C171 178 173 192 173 202 L165 204 C163 194 161 180 161 166Z" opacity={0.7} strokeW={sw * 0.6} />

        {/* Lower Back */}
        <MuscleZone muscle="back" d="
          M70 158 C82 154 92 152 100 152 C108 152 118 154 130 158
          L132 168 C130 174 126 178 124 180
          L76 180 C74 178 70 174 68 168Z
        " opacity={0.72} strokeW={sw * 0.7} />

        {/* Glutes — rounded feminine */}
        <MuscleZone muscle="glutes" d="
          M76 180 C70 186 66 198 68 210
          L132 210 C134 198 130 186 124 180Z
        " />
        <line x1="100" y1="180" x2="100" y2="210" stroke={outline} strokeWidth={0.3} opacity={0.18} />

        {/* Hamstrings */}
        <MuscleZone muscle="legs" d="
          M68 210 C66 230 62 260 60 286 C58 300 60 306 64 308
          L86 308 C90 306 92 300 90 286
          C88 260 84 230 82 210Z
        " />
        <MuscleZone muscle="legs" d="
          M132 210 C134 230 138 260 140 286 C142 300 140 306 136 308
          L114 308 C110 306 108 300 110 286
          C112 260 116 230 118 210Z
        " />

        {/* Calves */}
        <MuscleZone muscle="calves" d="
          M64 308 C61 324 59 344 60 360 C60 372 64 380 70 384
          L82 384 C88 380 90 372 90 360
          C91 344 89 324 86 308Z
        " opacity={0.78} strokeW={sw * 0.7} />
        <MuscleZone muscle="calves" d="
          M136 308 C139 324 141 344 140 360 C140 372 136 380 130 384
          L118 384 C112 380 110 372 110 360
          C109 344 111 324 114 308Z
        " opacity={0.78} strokeW={sw * 0.7} />

        <Hands side="left" />
        <Hands side="right" />
        <Feet />
      </SilhouetteView>
    </div>
  );
};
