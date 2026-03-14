import { useRef, useEffect, useCallback, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollPickerProps {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  step?: number;
}

const ITEM_HEIGHT = 56;
const VISIBLE_ITEMS = 5;

const ScrollPicker = ({ min, max, value, onChange, unit, step = 1 }: ScrollPickerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startScroll = useRef(0);
  const velocity = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const animFrame = useRef<number>(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const items: number[] = [];
  for (let i = min; i <= max; i += step) {
    items.push(i);
  }

  const getScrollForValue = useCallback(
    (val: number) => {
      const index = items.indexOf(val);
      if (index === -1) return 0;
      return index * ITEM_HEIGHT;
    },
    [items]
  );

  const snapToNearest = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(items.length - 1, index));
    container.scrollTo({ top: clampedIndex * ITEM_HEIGHT, behavior: "smooth" });
    onChange(items[clampedIndex]);
  }, [items, onChange]);

  // Initialize scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollPos = getScrollForValue(value);
    container.scrollTop = scrollPos;
  }, []);

  // Handle scroll end detection
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (!isDragging.current) {
          snapToNearest();
        }
      }, 100);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [snapToNearest]);

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    setIsInteracting(true);
    startY.current = e.touches[0].clientY;
    startScroll.current = containerRef.current?.scrollTop ?? 0;
    lastY.current = e.touches[0].clientY;
    lastTime.current = Date.now();
    velocity.current = 0;
    cancelAnimationFrame(animFrame.current);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    const currentY = e.touches[0].clientY;
    const diff = startY.current - currentY;
    containerRef.current.scrollTop = startScroll.current + diff;

    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = (lastY.current - currentY) / dt;
    }
    lastY.current = currentY;
    lastTime.current = now;
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    setIsInteracting(false);
    snapToNearest();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    setIsInteracting(true);
    startY.current = e.clientY;
    startScroll.current = containerRef.current?.scrollTop ?? 0;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const diff = startY.current - e.clientY;
      containerRef.current.scrollTop = startScroll.current + diff;
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        setIsInteracting(false);
        snapToNearest();
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [snapToNearest]);

  const paddingItems = Math.floor(VISIBLE_ITEMS / 2);

  return (
    <div className="relative w-full max-w-[200px] mx-auto select-none">
      {/* Selection highlight */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-10 border-y-2 border-primary/30 bg-primary/5 rounded-lg"
        style={{
          top: paddingItems * ITEM_HEIGHT,
          height: ITEM_HEIGHT,
        }}
      />

      {/* Gradient overlays */}
      <div
        className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
        style={{
          height: paddingItems * ITEM_HEIGHT,
          background: "linear-gradient(to bottom, hsl(var(--background)) 0%, hsl(var(--background) / 0.6) 60%, transparent 100%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
        style={{
          height: paddingItems * ITEM_HEIGHT,
          background: "linear-gradient(to top, hsl(var(--background)) 0%, hsl(var(--background) / 0.6) 60%, transparent 100%)",
        }}
      />

      <div
        ref={containerRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          height: VISIBLE_ITEMS * ITEM_HEIGHT,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          overflowY: "auto",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {/* Top padding */}
        <div style={{ height: paddingItems * ITEM_HEIGHT }} />

        {items.map((item) => {
          return (
            <div
              key={item}
              className={cn(
                "flex items-center justify-center transition-all duration-150",
                "text-muted-foreground/40 font-semibold",
                item === value && "text-foreground text-3xl font-bold scale-110",
                item !== value && "text-lg"
              )}
              style={{ height: ITEM_HEIGHT }}
              onClick={() => {
                if (!containerRef.current) return;
                const index = items.indexOf(item);
                containerRef.current.scrollTo({ top: index * ITEM_HEIGHT, behavior: "smooth" });
                onChange(item);
              }}
            >
              <span>{item}</span>
              {item === value && unit && (
                <span className="ml-1 text-muted-foreground text-base font-medium">{unit}</span>
              )}
            </div>
          );
        })}

        {/* Bottom padding */}
        <div style={{ height: paddingItems * ITEM_HEIGHT }} />
      </div>
    </div>
  );
};

export default ScrollPicker;
