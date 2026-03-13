import { useRef } from "react";
import { motion } from "framer-motion";
import type { Testimonial } from "@/lib/quizResultUtils";
import { Star } from "lucide-react";

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

const TestimonialCarousel = ({ testimonials }: TestimonialCarouselProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="overflow-hidden -mx-5">
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto px-5 pb-4 snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="min-w-[280px] max-w-[300px] rounded-2xl p-4 snap-center shrink-0"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <img
                src={t.photo}
                alt={t.name}
                loading="lazy"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-bold text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {t.name}
                </p>
                <p className="text-[10px] text-white/40">{t.age} anos</p>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} size={10} fill="#F59E0B" color="#F59E0B" />
                ))}
              </div>
            </div>

            {/* Quote */}
            <p className="text-xs text-white/70 leading-relaxed mb-3 line-clamp-4">
              "{t.quote}"
            </p>

            {/* Metrics */}
            <div className="flex gap-2">
              {t.metrics.map((m, j) => (
                <div
                  key={j}
                  className="flex-1 rounded-xl py-2 text-center"
                  style={{ background: "rgba(255,107,43,0.1)" }}
                >
                  <p className="text-xs font-black text-[#FF6B2B]">{m.value}</p>
                  <p className="text-[9px] text-white/40 mt-0.5">{m.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialCarousel;
