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
 * with smooth bezier curves and realistic feminine proportions.
 * Each region maps to a muscle key in MuscleData.
 */
export const BodyMap: React.FC<BodyMapProps> = ({ muscleMap, statusColor }) => {
  const c = (key: string) => statusColor(muscleMap[key] ?? "none");
  const outline = "hsl(var(--muted-foreground) / 0.5)";
  const baseFill = "hsl(var(--muted) / 0.3)";
  const sw = 0.7; // stroke width

  return (
    <div className="flex items-end justify-center gap-4">
      {/* ─── FRONT VIEW ─── */}
      <div className="flex flex-col items-center">
        <span className="text-[9px] text-muted-foreground mb-1 font-sans tracking-wider uppercase">
          Frente
        </span>
        <svg viewBox="0 0 200 420" className="w-[62px] h-[130px]" fill="none">
          {/* Head */}
          <ellipse cx="100" cy="30" rx="20" ry="24" fill={baseFill} stroke={outline} strokeWidth={sw} />
          {/* Neck */}
          <path d="M90 53 Q90 60 88 65 L112 65 Q110 60 110 53" fill={baseFill} stroke={outline} strokeWidth={sw * 0.8} />

          {/* ── Shoulders / Deltoids ── */}
          <path
            d="M68 75 C58 70 42 72 36 82 C33 88 34 94 38 97 L58 93 C62 88 66 82 68 75Z"
            fill={c("shoulders")} stroke={outline} strokeWidth={sw} opacity={0.9}
          />
          <path
            d="M132 75 C142 70 158 72 164 82 C167 88 166 94 162 97 L142 93 C138 88 134 82 132 75Z"
            fill={c("shoulders")} stroke={outline} strokeWidth={sw} opacity={0.9}
          />

          {/* ── Chest / Pectorals ── */}
          <path
            d="M68 75 C72 72 90 68 100 68 C110 68 128 72 132 75
               C136 80 138 90 134 96 L126 102
               C116 108 100 110 100 110
               C100 110 84 108 74 102 L66 96
               C62 90 64 80 68 75Z"
            fill={c("chest")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />

          {/* ── Biceps (front arms) ── */}
          <path
            d="M38 97 C34 104 30 116 28 130 C26 144 28 156 30 162
               L38 162 C40 156 42 144 42 130 C42 116 40 104 38 97Z"
            fill={c("arms")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />
          <path
            d="M162 97 C166 104 170 116 172 130 C174 144 172 156 170 162
               L162 162 C160 156 158 144 158 130 C158 116 160 104 162 97Z"
            fill={c("arms")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />

          {/* ── Forearms ── */}
          <path
            d="M30 162 C28 174 26 188 26 198 L34 200 C36 190 38 176 38 162Z"
            fill={c("arms")} stroke={outline} strokeWidth={sw * 0.7} opacity={0.7}
          />
          <path
            d="M170 162 C172 174 174 188 174 198 L166 200 C164 190 162 176 162 162Z"
            fill={c("arms")} stroke={outline} strokeWidth={sw * 0.7} opacity={0.7}
          />

          {/* ── Abs / Core ── */}
          <path
            d="M74 110 C80 108 90 106 100 106 C110 106 120 108 126 110
               L130 118 C132 130 132 145 130 160
               L126 168 C118 172 110 174 100 174
               C90 174 82 172 74 168 L70 160
               C68 145 68 130 70 118Z"
            fill={c("abs")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />
          {/* Ab definition lines */}
          <line x1="100" y1="112" x2="100" y2="168" stroke={outline} strokeWidth={0.4} opacity={0.3} />
          <path d="M78 124 Q100 120 122 124" fill="none" stroke={outline} strokeWidth={0.3} opacity={0.25} />
          <path d="M76 136 Q100 132 124 136" fill="none" stroke={outline} strokeWidth={0.3} opacity={0.25} />
          <path d="M76 148 Q100 144 124 148" fill="none" stroke={outline} strokeWidth={0.3} opacity={0.25} />
          <path d="M78 160 Q100 156 122 160" fill="none" stroke={outline} strokeWidth={0.3} opacity={0.25} />

          {/* ── Hip / Glute area (front) ── */}
          <path
            d="M74 174 C82 172 90 170 100 170 C110 170 118 172 126 174
               C132 180 136 190 132 200
               L68 200 C64 190 68 180 74 174Z"
            fill={c("glutes")} stroke={outline} strokeWidth={sw} opacity={0.7}
          />

          {/* ── Quadriceps ── */}
          <path
            d="M68 200 C66 220 62 248 60 272 C58 284 60 290 64 292
               L88 292 C92 290 94 284 92 272
               C90 248 86 220 84 200Z"
            fill={c("legs")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />
          <path
            d="M132 200 C134 220 138 248 140 272 C142 284 140 290 136 292
               L112 292 C108 290 106 284 108 272
               C110 248 114 220 116 200Z"
            fill={c("legs")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />

          {/* ── Calves ── */}
          <path
            d="M64 292 C62 310 60 330 60 346 C60 356 64 360 70 360
               L84 360 C90 360 92 356 92 346
               C92 330 90 310 88 292Z"
            fill={c("calves")} stroke={outline} strokeWidth={sw * 0.8} opacity={0.8}
          />
          <path
            d="M136 292 C138 310 140 330 140 346 C140 356 136 360 130 360
               L116 360 C110 360 108 356 108 346
               C108 330 110 310 112 292Z"
            fill={c("calves")} stroke={outline} strokeWidth={sw * 0.8} opacity={0.8}
          />

          {/* Feet */}
          <ellipse cx="77" cy="365" rx="14" ry="5" fill={baseFill} stroke={outline} strokeWidth={0.4} />
          <ellipse cx="123" cy="365" rx="14" ry="5" fill={baseFill} stroke={outline} strokeWidth={0.4} />
        </svg>
      </div>

      {/* ─── BACK VIEW ─── */}
      <div className="flex flex-col items-center">
        <span className="text-[9px] text-muted-foreground mb-1 font-sans tracking-wider uppercase">
          Costas
        </span>
        <svg viewBox="0 0 200 420" className="w-[62px] h-[130px]" fill="none">
          {/* Head */}
          <ellipse cx="100" cy="30" rx="20" ry="24" fill={baseFill} stroke={outline} strokeWidth={sw} />
          {/* Neck */}
          <path d="M90 53 Q90 60 88 65 L112 65 Q110 60 110 53" fill={baseFill} stroke={outline} strokeWidth={sw * 0.8} />

          {/* ── Shoulders / Rear Delts ── */}
          <path
            d="M68 75 C58 70 42 72 36 82 C33 88 34 94 38 97 L58 93 C62 88 66 82 68 75Z"
            fill={c("shoulders")} stroke={outline} strokeWidth={sw} opacity={0.9}
          />
          <path
            d="M132 75 C142 70 158 72 164 82 C167 88 166 94 162 97 L142 93 C138 88 134 82 132 75Z"
            fill={c("shoulders")} stroke={outline} strokeWidth={sw} opacity={0.9}
          />

          {/* ── Upper Back / Traps ── */}
          <path
            d="M68 75 C78 72 90 70 100 70 C110 70 122 72 132 75
               C134 80 134 86 132 90 L68 90 C66 86 66 80 68 75Z"
            fill={c("back")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />

          {/* ── Mid & Lower Back / Lats ── */}
          <path
            d="M68 90 L132 90
               C138 100 142 116 140 132
               L132 142 C120 150 110 154 100 154
               C90 154 80 150 68 142 L60 132
               C58 116 62 100 68 90Z"
            fill={c("back")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />
          {/* Spine */}
          <line x1="100" y1="72" x2="100" y2="170" stroke={outline} strokeWidth={0.5} opacity={0.35} />
          {/* Lat separation lines */}
          <path d="M80 95 Q100 92 120 95" fill="none" stroke={outline} strokeWidth={0.3} opacity={0.2} />
          <path d="M74 115 Q100 110 126 115" fill="none" stroke={outline} strokeWidth={0.3} opacity={0.2} />

          {/* ── Triceps (back arms) ── */}
          <path
            d="M38 97 C34 104 30 116 28 130 C26 144 28 156 30 162
               L38 162 C40 156 42 144 42 130 C42 116 40 104 38 97Z"
            fill={c("arms")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />
          <path
            d="M162 97 C166 104 170 116 172 130 C174 144 172 156 170 162
               L162 162 C160 156 158 144 158 130 C158 116 160 104 162 97Z"
            fill={c("arms")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />
          {/* Forearms */}
          <path
            d="M30 162 C28 174 26 188 26 198 L34 200 C36 190 38 176 38 162Z"
            fill={c("arms")} stroke={outline} strokeWidth={sw * 0.7} opacity={0.7}
          />
          <path
            d="M170 162 C172 174 174 188 174 198 L166 200 C164 190 162 176 162 162Z"
            fill={c("arms")} stroke={outline} strokeWidth={sw * 0.7} opacity={0.7}
          />

          {/* ── Lower Back ── */}
          <path
            d="M68 154 C80 150 90 148 100 148 C110 148 120 150 132 154
               L134 164 C132 170 128 174 126 176
               L74 176 C72 174 68 170 66 164Z"
            fill={c("back")} stroke={outline} strokeWidth={sw * 0.8} opacity={0.75}
          />

          {/* ── Glutes ── */}
          <path
            d="M74 176 C68 182 64 192 66 204
               L134 204 C136 192 132 182 126 176Z"
            fill={c("glutes")} stroke={outline} strokeWidth={sw} opacity={0.9}
          />
          {/* Glute split */}
          <line x1="100" y1="176" x2="100" y2="204" stroke={outline} strokeWidth={0.4} opacity={0.3} />

          {/* ── Hamstrings ── */}
          <path
            d="M66 204 C64 224 60 252 58 276 C56 288 58 294 62 296
               L86 296 C90 294 92 288 90 276
               C88 252 84 224 82 204Z"
            fill={c("legs")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />
          <path
            d="M134 204 C136 224 140 252 142 276 C144 288 142 294 138 296
               L114 296 C110 294 108 288 110 276
               C112 252 116 224 118 204Z"
            fill={c("legs")} stroke={outline} strokeWidth={sw} opacity={0.85}
          />

          {/* ── Calves ── */}
          <path
            d="M62 296 C60 314 58 334 58 348 C58 358 62 362 68 362
               L82 362 C88 362 90 358 90 348
               C90 334 88 314 86 296Z"
            fill={c("calves")} stroke={outline} strokeWidth={sw * 0.8} opacity={0.8}
          />
          <path
            d="M138 296 C140 314 142 334 142 348 C142 358 138 362 132 362
               L118 362 C112 362 110 358 110 348
               C110 334 112 314 114 296Z"
            fill={c("calves")} stroke={outline} strokeWidth={sw * 0.8} opacity={0.8}
          />

          {/* Feet */}
          <ellipse cx="75" cy="367" rx="14" ry="5" fill={baseFill} stroke={outline} strokeWidth={0.4} />
          <ellipse cx="125" cy="367" rx="14" ry="5" fill={baseFill} stroke={outline} strokeWidth={0.4} />
        </svg>
      </div>
    </div>
  );
};
