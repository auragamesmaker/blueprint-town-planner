import { useState } from "react";
import { useGame } from "@/lib/blueprint/store";

const TABS = [
  { id: "road", label: "Roads", emoji: "🛣️" },
  { id: "building", label: "Buildings", emoji: "🏠" },
  { id: "nature", label: "Nature", emoji: "🌳" },
  { id: "water", label: "Water", emoji: "💧" },
  { id: "sign", label: "Signs", emoji: "🪧" },
  { id: "settings", label: "Settings", emoji: "⚙️" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const BUILDINGS = [
  { id: "house", label: "House" },
  { id: "apartment", label: "Apartment" },
  { id: "town-office", label: "Town Office" },
  { id: "town-hall", label: "Town Hall" },
  { id: "store", label: "Store" },
  { id: "library", label: "Library" },
  { id: "restaurant", label: "Restaurant" },
];

const NATURE = [
  { id: "grass", label: "Grass" },
  { id: "tree", label: "Tree" },
  { id: "bush", label: "Bush" },
  { id: "flower", label: "Flower" },
];

const WATER = [
  { id: "pond", label: "Pond" },
  { id: "lake", label: "Lake" },
  { id: "river", label: "River (double-click to finish)" },
];

const SIGNS = [
  { id: "street", label: "Street Sign" },
  { id: "town", label: "Town Sign" },
  { id: "highway", label: "Highway Sign" },
];

export function BottomBar() {
  const game = useGame();
  const [tab, setTab] = useState<TabId>("road");

  const build = game.tool.kind === "build" ? game.tool : null;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30">
      <div className="mx-auto max-w-5xl px-4 pb-4">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl">
          {/* tab bar */}
          <div className="flex items-center justify-between gap-1 border-b border-white/10 bg-black/30 px-2">
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    if (t.id === "road") game.setTool({ kind: "build", sub: "road" });
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 px-3 py-3 text-xs font-medium tracking-wide uppercase transition ${
                    on ? "text-white" : "text-white/50 hover:text-white/80"
                  }`}
                >
                  <span className="text-emoji-white text-base leading-none">{t.emoji}</span>
                  <span>{t.label}</span>
                  {on && (
                    <span
                      className="absolute bottom-0 h-0.5 w-12 rounded-full"
                      style={{ background: "var(--gradient-sakura)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* tab content */}
          <div className="flex min-h-[110px] items-center gap-2 overflow-x-auto p-4">
            {tab === "road" && (
              <div className="flex w-full items-center gap-3">
                <PaletteItem
                  active={build?.sub === "road"}
                  onClick={() => game.setTool({ kind: "build", sub: "road" })}
                  label="Lay Road"
                />
                <p className="text-xs text-white/60">
                  Click + drag on the map. Endpoints snap to nearby roads to form intersections.
                  Click a placed road to edit sidewalks, crosswalks, lights & signs.
                </p>
              </div>
            )}
            {tab === "building" &&
              BUILDINGS.map((b) => (
                <PaletteItem
                  key={b.id}
                  label={b.label}
                  active={build?.sub === "building" && build.variant === b.id}
                  onClick={() => game.setTool({ kind: "build", sub: "building", variant: b.id })}
                />
              ))}
            {tab === "nature" && (
              <>
                {NATURE.map((n) => (
                  <PaletteItem
                    key={n.id}
                    label={n.label}
                    active={build?.sub === "nature" && build.variant === n.id}
                    onClick={() => game.setTool({ kind: "build", sub: "nature", variant: n.id })}
                  />
                ))}
                <PaletteItem
                  label="Forest Brush 🌲"
                  active={build?.sub === "forest"}
                  onClick={() => game.setTool({ kind: "build", sub: "forest" })}
                />
              </>
            )}
            {tab === "water" &&
              WATER.map((w) => (
                <PaletteItem
                  key={w.id}
                  label={w.label}
                  active={build?.sub === "water" && build.variant === w.id}
                  onClick={() => game.setTool({ kind: "build", sub: "water", variant: w.id })}
                />
              ))}
            {tab === "sign" &&
              SIGNS.map((s) => (
                <PaletteItem
                  key={s.id}
                  label={s.label}
                  active={build?.sub === "sign" && build.variant === s.id}
                  onClick={() => game.setTool({ kind: "build", sub: "sign", variant: s.id })}
                />
              ))}
            {tab === "settings" && <SettingsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

function PaletteItem({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 rounded-xl border px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-white/60 bg-white/15 text-white shadow-[0_0_30px_rgba(255,255,255,0.15)]"
          : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function SettingsPanel() {
  const game = useGame();
  return (
    <div className="flex w-full flex-wrap items-center gap-6 text-white/80">
      <label className="flex items-center gap-3 text-sm">
        <span className="text-xs tracking-widest uppercase text-white/60">Snap to grid</span>
        <input
          type="checkbox"
          checked={game.snapToGrid}
          onChange={(e) => game.setSnap(e.target.checked)}
          className="h-4 w-4 accent-white"
        />
      </label>
      <label className="flex flex-1 min-w-[200px] items-center gap-3 text-sm">
        <span className="text-xs tracking-widest uppercase text-white/60">Time {game.city.timeOfDay.toFixed(1)}h</span>
        <input
          type="range"
          min={0}
          max={24}
          step={0.5}
          value={game.city.timeOfDay}
          onChange={(e) => game.setTime(parseFloat(e.target.value))}
          className="flex-1 accent-white"
        />
      </label>
      <div className="flex items-center gap-2">
        <span className="text-xs tracking-widest uppercase text-white/60">Weather</span>
        {(["clear", "rain", "snow"] as const).map((w) => (
          <button
            key={w}
            onClick={() => game.setWeather(w)}
            className={`rounded-full border px-3 py-1 text-xs capitalize transition ${
              game.city.weather === w
                ? "border-white/70 bg-white/20 text-white"
                : "border-white/10 text-white/60 hover:bg-white/10"
            }`}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}