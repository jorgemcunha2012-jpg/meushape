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
 * Anatomical female body map — front + back outline with
 * filled muscle-group regions. Each path/shape maps to a
 * muscle key used in the dashboard's MuscleData object.
 */
export const BodyMap: React.FC<BodyMapProps> = ({ muscleMap, statusColor }) => {
  const c = (key: string) => statusColor(muscleMap[key] ?? "none");
  const baseStroke = "hsl(var(--muted-foreground))";
  const baseFill = "hsl(var(--muted))";

  return (
    <div className="flex items-end justify-center gap-3">
      {/* ─── FRONT VIEW ─── */}
      <div className="flex flex-col items-center">
        <span className="text-[9px] text-muted-foreground mb-1 font-sans tracking-wider uppercase">Frente</span>
        <svg viewBox="0 0 120 200" className="w-[52px] h-[86px]" fill="none">
          {/* Head */}
          <ellipse cx="60" cy="16" rx="12" ry="14" fill={baseFill} stroke={baseStroke} strokeWidth="0.8" />
          {/* Neck */}
          <rect x="55" y="29" width="10" height="7" rx="3" fill={baseFill} stroke={baseStroke} strokeWidth="0.6" />

          {/* ── Shoulders ── */}
          <path d="M38 38 Q30 36 24 42 Q22 46 24 48 L38 46 Z" fill={c("shoulders")} stroke={baseStroke} strokeWidth="0.6" opacity="0.88" />
          <path d="M82 38 Q90 36 96 42 Q98 46 96 48 L82 46 Z" fill={c("shoulders")} stroke={baseStroke} strokeWidth="0.6" opacity="0.88" />

          {/* ── Chest / Pectorals ── */}
          <path d="M38 38 L82 38 Q86 42 84 52 L76 56 Q60 60 44 56 L36 52 Q34 42 38 38Z" fill={c("chest")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />

          {/* ── Arms (front – biceps) ── */}
          <path d="M24 48 Q20 52 18 62 Q16 72 18 82 L22 82 Q26 72 26 62 Q26 52 24 48Z" fill={c("arms")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />
          <path d="M96 48 Q100 52 102 62 Q104 72 102 82 L98 82 Q94 72 94 62 Q94 52 96 48Z" fill={c("arms")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />
          {/* Forearms */}
          <path d="M18 82 Q16 92 16 100 L20 100 Q22 92 22 82Z" fill={c("arms")} stroke={baseStroke} strokeWidth="0.5" opacity="0.7" />
          <path d="M102 82 Q104 92 104 100 L100 100 Q98 92 98 82Z" fill={c("arms")} stroke={baseStroke} strokeWidth="0.5" opacity="0.7" />

          {/* ── Abs ── */}
          <path d="M44 56 L76 56 Q78 68 76 82 L44 82 Q42 68 44 56Z" fill={c("abs")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />
          {/* Ab lines */}
          <line x1="60" y1="58" x2="60" y2="80" stroke={baseStroke} strokeWidth="0.3" opacity="0.4" />
          <line x1="46" y1="62" x2="74" y2="62" stroke={baseStroke} strokeWidth="0.2" opacity="0.3" />
          <line x1="46" y1="68" x2="74" y2="68" stroke={baseStroke} strokeWidth="0.2" opacity="0.3" />
          <line x1="46" y1="74" x2="74" y2="74" stroke={baseStroke} strokeWidth="0.2" opacity="0.3" />

          {/* ── Hips / Glutes area (front) ── */}
          <path d="M44 82 L76 82 Q80 92 76 98 L44 98 Q40 92 44 82Z" fill={c("glutes")} stroke={baseStroke} strokeWidth="0.6" opacity="0.75" />

          {/* ── Legs (quads) ── */}
          <path d="M44 98 Q42 118 40 138 Q40 142 44 142 L54 142 Q56 140 56 138 Q54 118 52 98Z" fill={c("legs")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />
          <path d="M76 98 Q78 118 80 138 Q80 142 76 142 L66 142 Q64 140 64 138 Q66 118 68 98Z" fill={c("legs")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />

          {/* ── Calves ── */}
          <path d="M44 142 Q42 154 42 166 Q42 172 46 172 L52 172 Q56 172 56 166 Q56 154 54 142Z" fill={c("calves")} stroke={baseStroke} strokeWidth="0.5" opacity="0.8" />
          <path d="M76 142 Q78 154 78 166 Q78 172 74 172 L68 172 Q64 172 64 166 Q64 154 66 142Z" fill={c("calves")} stroke={baseStroke} strokeWidth="0.5" opacity="0.8" />

          {/* Feet */}
          <ellipse cx="49" cy="175" rx="8" ry="3" fill={baseFill} stroke={baseStroke} strokeWidth="0.4" />
          <ellipse cx="71" cy="175" rx="8" ry="3" fill={baseFill} stroke={baseStroke} strokeWidth="0.4" />
        </svg>
      </div>

      {/* ─── BACK VIEW ─── */}
      <div className="flex flex-col items-center">
        <span className="text-[9px] text-muted-foreground mb-1 font-sans tracking-wider uppercase">Costas</span>
        <svg viewBox="0 0 120 200" className="w-[52px] h-[86px]" fill="none">
          {/* Head */}
          <ellipse cx="60" cy="16" rx="12" ry="14" fill={baseFill} stroke={baseStroke} strokeWidth="0.8" />
          {/* Neck */}
          <rect x="55" y="29" width="10" height="7" rx="3" fill={baseFill} stroke={baseStroke} strokeWidth="0.6" />

          {/* ── Shoulders (rear delts) ── */}
          <path d="M38 38 Q30 36 24 42 Q22 46 24 48 L38 46 Z" fill={c("shoulders")} stroke={baseStroke} strokeWidth="0.6" opacity="0.88" />
          <path d="M82 38 Q90 36 96 42 Q98 46 96 48 L82 46 Z" fill={c("shoulders")} stroke={baseStroke} strokeWidth="0.6" opacity="0.88" />

          {/* ── Upper Back / Traps ── */}
          <path d="M38 38 L82 38 Q84 42 82 46 L38 46 Q36 42 38 38Z" fill={c("back")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />

          {/* ── Mid / Lower Back (lats) ── */}
          <path d="M38 46 L82 46 Q86 58 84 72 L76 78 Q60 82 44 78 L36 72 Q34 58 38 46Z" fill={c("back")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />
          {/* Spine line */}
          <line x1="60" y1="38" x2="60" y2="82" stroke={baseStroke} strokeWidth="0.4" opacity="0.4" />

          {/* ── Arms (back – triceps) ── */}
          <path d="M24 48 Q20 52 18 62 Q16 72 18 82 L22 82 Q26 72 26 62 Q26 52 24 48Z" fill={c("arms")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />
          <path d="M96 48 Q100 52 102 62 Q104 72 102 82 L98 82 Q94 72 94 62 Q94 52 96 48Z" fill={c("arms")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />
          {/* Forearms */}
          <path d="M18 82 Q16 92 16 100 L20 100 Q22 92 22 82Z" fill={c("arms")} stroke={baseStroke} strokeWidth="0.5" opacity="0.7" />
          <path d="M102 82 Q104 92 104 100 L100 100 Q98 92 98 82Z" fill={c("arms")} stroke={baseStroke} strokeWidth="0.5" opacity="0.7" />

          {/* ── Lower back ── */}
          <path d="M44 78 L76 78 Q78 84 76 88 L44 88 Q42 84 44 78Z" fill={c("back")} stroke={baseStroke} strokeWidth="0.5" opacity="0.75" />

          {/* ── Glutes ── */}
          <path d="M44 88 L76 88 Q82 96 78 104 L42 104 Q38 96 44 88Z" fill={c("glutes")} stroke={baseStroke} strokeWidth="0.6" opacity="0.88" />
          {/* Glute split */}
          <line x1="60" y1="88" x2="60" y2="104" stroke={baseStroke} strokeWidth="0.3" opacity="0.35" />

          {/* ── Legs (hamstrings) ── */}
          <path d="M42 104 Q40 124 40 138 Q40 142 44 142 L54 142 Q56 140 56 138 Q54 124 52 104Z" fill={c("legs")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />
          <path d="M78 104 Q80 124 80 138 Q80 142 76 142 L66 142 Q64 140 64 138 Q66 124 68 104Z" fill={c("legs")} stroke={baseStroke} strokeWidth="0.6" opacity="0.85" />

          {/* ── Calves ── */}
          <path d="M44 142 Q42 154 42 166 Q42 172 46 172 L52 172 Q56 172 56 166 Q56 154 54 142Z" fill={c("calves")} stroke={baseStroke} strokeWidth="0.5" opacity="0.8" />
          <path d="M76 142 Q78 154 78 166 Q78 172 74 172 L68 172 Q64 172 64 166 Q64 154 66 142Z" fill={c("calves")} stroke={baseStroke} strokeWidth="0.5" opacity="0.8" />

          {/* Feet */}
          <ellipse cx="49" cy="175" rx="8" ry="3" fill={baseFill} stroke={baseStroke} strokeWidth="0.4" />
          <ellipse cx="71" cy="175" rx="8" ry="3" fill={baseFill} stroke={baseStroke} strokeWidth="0.4" />
        </svg>
      </div>
    </div>
  );
};
