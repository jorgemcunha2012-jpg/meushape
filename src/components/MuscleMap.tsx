import React, { useState } from "react";

interface MuscleMapProps {
  trainedMuscles?: string[];
  onMuscleClick?: (muscleName: string) => void;
}

const MuscleMap: React.FC<MuscleMapProps> = ({
  trainedMuscles = [],
  onMuscleClick,
}) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const defaultColor = "#e5e5e5";
  const trainedColor = "#ff4d4d";
  const hoverOpacity = 0.7;

  const getColor = (id: string) =>
    trainedMuscles.includes(id) ? trainedColor : defaultColor;

  const common = (id: string) => ({
    id,
    fill: getColor(id),
    opacity: hovered === id ? hoverOpacity : 1,
    style: {
      cursor: "pointer",
      transition: "fill 0.4s ease, opacity 0.2s ease",
    } as React.CSSProperties,
    onMouseEnter: () => setHovered(id),
    onMouseLeave: () => setHovered(null),
    onClick: () => onMuscleClick?.(id),
  });

  return (
    <svg
      viewBox="0 0 200 420"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-[220px] h-auto mx-auto"
    >
      {/* Head */}
      <ellipse cx="100" cy="38" rx="22" ry="26" fill="#d4d4d4" />
      {/* Neck */}
      <rect x="90" y="62" width="20" height="16" rx="4" fill="#d4d4d4" />

      {/* Shoulders */}
      <path
        {...common("shoulders")}
        d="M68 80 Q58 78 48 90 L48 105 Q58 98 68 96 Z"
      />
      <path
        {...common("shoulders")}
        d="M132 80 Q142 78 152 90 L152 105 Q142 98 132 96 Z"
      />

      {/* Chest */}
      <path
        {...common("chest")}
        d="M68 80 L68 120 Q80 130 100 130 Q120 130 132 120 L132 80 Q120 74 100 74 Q80 74 68 80 Z"
      />

      {/* Arms — upper + forearm */}
      <path
        {...common("arms")}
        d="M48 105 L38 160 Q36 170 40 175 L50 175 Q54 170 52 160 L48 96 Z"
      />
      <path
        {...common("arms")}
        d="M152 105 L162 160 Q164 170 160 175 L150 175 Q146 170 148 160 L152 96 Z"
      />
      {/* Forearms */}
      <path
        {...common("arms")}
        d="M40 175 L34 230 Q33 238 38 240 L48 240 Q52 238 50 230 L50 175 Z"
      />
      <path
        {...common("arms")}
        d="M160 175 L166 230 Q167 238 162 240 L152 240 Q148 238 150 230 L150 175 Z"
      />

      {/* Abs */}
      <path
        {...common("abs")}
        d="M78 130 L78 200 Q80 210 100 210 Q120 210 122 200 L122 130 Q110 138 100 138 Q90 138 78 130 Z"
      />
      {/* Ab lines */}
      <line x1="100" y1="135" x2="100" y2="208" stroke="#ccc" strokeWidth="0.8" opacity="0.5" pointerEvents="none" />
      <line x1="80" y1="155" x2="120" y2="155" stroke="#ccc" strokeWidth="0.6" opacity="0.4" pointerEvents="none" />
      <line x1="80" y1="175" x2="120" y2="175" stroke="#ccc" strokeWidth="0.6" opacity="0.4" pointerEvents="none" />
      <line x1="82" y1="195" x2="118" y2="195" stroke="#ccc" strokeWidth="0.6" opacity="0.4" pointerEvents="none" />

      {/* Back (shown as side strips along torso) */}
      <path
        {...common("back")}
        d="M56 96 L68 96 L68 130 Q68 140 64 145 L56 145 Q52 140 52 130 Z"
      />
      <path
        {...common("back")}
        d="M132 96 L144 96 L144 130 Q144 140 140 145 L132 145 Q128 140 128 130 Z"
      />

      {/* Glutes */}
      <path
        {...common("glutes")}
        d="M72 210 Q72 235 85 240 L100 240 L115 240 Q128 235 128 210 Q118 218 100 218 Q82 218 72 210 Z"
      />

      {/* Legs */}
      <path
        {...common("legs")}
        d="M72 240 L68 320 Q66 340 72 345 L88 345 Q92 340 90 320 L92 240 Z"
      />
      <path
        {...common("legs")}
        d="M128 240 L132 320 Q134 340 128 345 L112 345 Q108 340 110 320 L108 240 Z"
      />
      {/* Calves */}
      <path
        {...common("legs")}
        d="M72 345 L70 390 Q69 400 74 405 L88 405 Q92 400 90 390 L88 345 Z"
      />
      <path
        {...common("legs")}
        d="M128 345 L130 390 Q131 400 126 405 L112 405 Q108 400 110 390 L112 345 Z"
      />

      {/* Labels (optional subtle text) */}
      {hovered && (
        <text
          x="100"
          y="415"
          textAnchor="middle"
          fontSize="11"
          fill="hsl(var(--foreground))"
          fontWeight="600"
          className="select-none pointer-events-none"
        >
          {hovered.charAt(0).toUpperCase() + hovered.slice(1)}
        </text>
      )}
    </svg>
  );
};

export default MuscleMap;
