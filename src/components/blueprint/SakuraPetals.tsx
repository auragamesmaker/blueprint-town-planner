import { useMemo } from "react";

export function SakuraPetals({ count = 40 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        drift: (Math.random() - 0.5) * 200,
        delay: Math.random() * 12,
        dur: 9 + Math.random() * 10,
        size: 10 + Math.random() * 14,
        opacity: 0.6 + Math.random() * 0.4,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      {petals.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 block"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animation: `petal-fall ${p.dur}s linear ${p.delay}s infinite`,
            // @ts-ignore custom prop
            "--drift": `${p.drift}px`,
          }}
        >
          <svg viewBox="0 0 24 24" className="w-full h-full">
            <path
              d="M12 2c2 4 6 6 10 6-2 4-2 8 0 12-4 0-8 2-10 6-2-4-6-6-10-6 2-4 2-8 0-12 4 0 8-2 10-6z"
              fill="oklch(0.78 0.14 235)"
              opacity="0.85"
            />
          </svg>
        </span>
      ))}
    </div>
  );
}