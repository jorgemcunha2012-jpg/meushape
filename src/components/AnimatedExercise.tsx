import { motion } from "framer-motion";

/**
 * Animated CSS/SVG illustrations for home workout exercises.
 * Maps exercise focus/name keywords to themed animations.
 */

type AnimationType = "squat" | "plank" | "lunge" | "jump" | "push" | "stretch" | "core" | "glute" | "generic";

const focusMap: Record<string, AnimationType> = {
  agachamento: "squat",
  squat: "squat",
  prancha: "plank",
  plank: "plank",
  avanço: "lunge",
  afundo: "lunge",
  lunge: "lunge",
  salto: "jump",
  jump: "jump",
  polichinelo: "jump",
  flexão: "push",
  push: "push",
  abdominal: "core",
  crunch: "core",
  core: "core",
  glúteo: "glute",
  ponte: "glute",
  hip: "glute",
  alongamento: "stretch",
  stretch: "stretch",
};

function getAnimationType(name: string, focus: string): AnimationType {
  const combined = `${name} ${focus}`.toLowerCase();
  for (const [keyword, type] of Object.entries(focusMap)) {
    if (combined.includes(keyword)) return type;
  }
  return "generic";
}

const animations: Record<AnimationType, { emoji: string; color: string; motion: object }> = {
  squat: {
    emoji: "🦵",
    color: "hsl(var(--primary))",
    motion: { y: [0, 12, 0], scaleY: [1, 0.85, 1] },
  },
  plank: {
    emoji: "🧘‍♀️",
    color: "hsl(var(--info))",
    motion: { rotate: [0, -1, 1, 0], scale: [1, 1.02, 1] },
  },
  lunge: {
    emoji: "🏃‍♀️",
    color: "hsl(var(--warning))",
    motion: { x: [-6, 6, -6], scaleX: [1, 1.05, 1] },
  },
  jump: {
    emoji: "⚡",
    color: "hsl(var(--warning))",
    motion: { y: [0, -16, 0], scale: [1, 1.15, 1] },
  },
  push: {
    emoji: "💪",
    color: "hsl(var(--destructive))",
    motion: { y: [0, 6, 0], scaleY: [1, 0.9, 1] },
  },
  core: {
    emoji: "🔥",
    color: "hsl(var(--primary))",
    motion: { rotate: [-3, 3, -3], scale: [1, 1.05, 1] },
  },
  glute: {
    emoji: "🍑",
    color: "hsl(var(--primary))",
    motion: { y: [0, 8, 0], scaleY: [1, 0.88, 1] },
  },
  stretch: {
    emoji: "🌿",
    color: "hsl(var(--success))",
    motion: { scale: [1, 1.08, 1], rotate: [0, 2, -2, 0] },
  },
  generic: {
    emoji: "🏋️‍♀️",
    color: "hsl(var(--primary))",
    motion: { y: [0, -8, 0], scale: [1, 1.05, 1] },
  },
};

interface AnimatedExerciseProps {
  name: string;
  focus: string;
  className?: string;
}

const AnimatedExercise = ({ name, focus, className = "" }: AnimatedExerciseProps) => {
  const type = getAnimationType(name, focus);
  const anim = animations[type];

  return (
    <div
      className={`relative w-full rounded-2xl flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${anim.color}15, ${anim.color}05)` }}
    >
      {/* Ambient glow */}
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: anim.color }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ backgroundColor: anim.color }}
      />

      {/* Pulsing ring */}
      <motion.div
        className="absolute w-28 h-28 rounded-full border-2 opacity-20"
        style={{ borderColor: anim.color }}
        animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Animated emoji */}
      <motion.div
        className="relative z-10 text-center"
        animate={anim.motion as any}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="text-6xl mb-1">{anim.emoji}</div>
      </motion.div>
    </div>
  );
};

export default AnimatedExercise;
