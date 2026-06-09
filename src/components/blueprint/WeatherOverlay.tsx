import { useMemo } from "react";
import { useGame } from "@/lib/blueprint/store";

export function WeatherOverlay() {
  const weather = useGame((s) => s.city.weather);
  const particles = useMemo(() => Array.from({ length: 120 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    dur: 0.5 + Math.random() * 1,
  })), []);
  const snow = useMemo(() => Array.from({ length: 80 }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    dur: 5 + Math.random() * 6,
    size: 3 + Math.random() * 4,
  })), []);

  if (weather === "clear") return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {weather === "rain" && particles.map((p) => (
        <span
          key={p.id}
          className="absolute -top-10 block h-5 w-0.5 bg-white/40"
          style={{
            left: `${p.left}%`,
            animation: `rain-fall ${p.dur}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
      {weather === "snow" && snow.map((p) => (
        <span
          key={p.id}
          className="absolute -top-6 block rounded-full bg-white/80"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animation: `snow-fall ${p.dur}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}