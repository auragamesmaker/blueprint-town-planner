import { useMemo, useState } from "react";
import { useGame } from "@/lib/blueprint/store";
import { PROP_CATALOG, getSubcategories } from "@/lib/blueprint/catalog";

// Top-level tabs. Built-in tabs render their own palettes; the rest pull from
// PROP_CATALOG with subcategory folders.
const TABS = [
  { id: "road",       label: "Roads",      emoji: "🛣️", source: "builtin" },
  { id: "building",   label: "Buildings",  emoji: "🏙️", source: "mixed",   catalogCat: "Buildings" },
  { id: "nature",     label: "Nature",     emoji: "🌳", source: "mixed",   catalogCat: "Nature" },
  { id: "water",      label: "Water",      emoji: "💧", source: "builtin" },
  { id: "sign",       label: "Signs",      emoji: "🪧", source: "mixed",   catalogCat: "Signs" },
  { id: "vehicles",   label: "Vehicles",   emoji: "🚗", source: "catalog", catalogCat: "Vehicles" },
  { id: "street",     label: "Street",     emoji: "🛋️", source: "catalog", catalogCat: "Street" },
  { id: "park",       label: "Park",       emoji: "🎠", source: "catalog", catalogCat: "Park" },
  { id: "sports",     label: "Sports",     emoji: "⚽", source: "catalog", catalogCat: "Sports" },
  { id: "farm",       label: "Farm",       emoji: "🚜", source: "catalog", catalogCat: "Farm" },
  { id: "beach",      label: "Beach",      emoji: "🏖️", source: "catalog", catalogCat: "Beach" },
  { id: "industrial", label: "Industrial", emoji: "🏭", source: "catalog", catalogCat: "Industrial" },
  { id: "walls",      label: "Walls",      emoji: "🧱", source: "catalog", catalogCat: "Walls" },
  { id: "decor",      label: "Decor",      emoji: "🎃", source: "catalog", catalogCat: "Decor" },
  { id: "settings",   label: "Settings",   emoji: "⚙️", source: "builtin" },
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

const NATURE_BUILTIN = [
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

const SIGNS_BUILTIN = [
  { id: "street", label: "Street Sign" },
  { id: "town", label: "Town Sign" },
  { id: "highway", label: "Highway Sign" },
];

export function BottomBar() {
  const game = useGame();
  const [tab, setTab] = useState<TabId>("road");

  const build = game.tool.kind === "build" ? game.tool : null;
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-30">
      <div className="mx-auto max-w-6xl px-4 pb-4">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl">
          {/* tab bar */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-white/10 bg-black/30 px-2">
            {TABS.map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    if (t.id === "road") game.setTool({ kind: "build", sub: "road" });
                  }}
                  className={`relative flex flex-shrink-0 items-center justify-center gap-2 px-3 py-3 text-xs font-medium tracking-wide uppercase transition ${
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
          <div className="flex min-h-[140px] items-center gap-2 overflow-x-auto p-4">
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
            {tab === "building" && (
              <CategoryPalette
                catalogCat="Buildings"
                prefix={
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {BUILDINGS.map((b) => (
                      <PaletteItem
                        key={b.id}
                        label={b.label}
                        active={build?.sub === "building" && build.variant === b.id}
                        onClick={() => game.setTool({ kind: "build", sub: "building", variant: b.id })}
                      />
                    ))}
                  </div>
                }
              />
            )}
            {tab === "nature" && (
              <CategoryPalette
                catalogCat="Nature"
                prefix={
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {NATURE_BUILTIN.map((n) => (
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
                  </div>
                }
              />
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
            {tab === "sign" && (
              <CategoryPalette
                catalogCat="Signs"
                prefix={
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {SIGNS_BUILTIN.map((s) => (
                      <PaletteItem
                        key={s.id}
                        label={s.label}
                        active={build?.sub === "sign" && build.variant === s.id}
                        onClick={() => game.setTool({ kind: "build", sub: "sign", variant: s.id })}
                      />
                    ))}
                  </div>
                }
              />
            )}
            {current.source === "catalog" && current.id !== "settings" && (
              <CategoryPalette catalogCat={(current as { catalogCat: string }).catalogCat} />
            )}
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

function CategoryPalette({
  catalogCat,
  prefix,
}: {
  catalogCat: string;
  prefix?: React.ReactNode;
}) {
  const game = useGame();
  const subs = useMemo(() => getSubcategories(catalogCat), [catalogCat]);
  const [sub, setSub] = useState<string>(subs[0] ?? "");
  const [q, setQ] = useState("");
  const build = game.tool.kind === "build" ? game.tool : null;
  const items = useMemo(
    () =>
      PROP_CATALOG.filter(
        (p) =>
          p.category === catalogCat &&
          (q.trim() !== ""
            ? p.name.toLowerCase().includes(q.toLowerCase())
            : p.subcategory === sub),
      ),
    [catalogCat, sub, q],
  );
  return (
    <div className="flex w-full flex-col gap-2">
      {prefix}
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${catalogCat}…`}
          className="w-44 flex-shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-white/40"
        />
        <div className="flex flex-1 items-center gap-1 overflow-x-auto">
          {subs.map((c) => (
            <button
              key={c}
              onClick={() => setSub(c)}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-[11px] uppercase tracking-wider transition ${
                sub === c && q.trim() === ""
                  ? "border-white/60 bg-white/15 text-white"
                  : "border-white/10 text-white/60 hover:bg-white/10"
              }`}
            >
              📁 {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto pr-1">
        {items.map((p) => {
          const on = build?.sub === "prop" && build.variant === p.id;
          return (
            <button
              key={p.id}
              onClick={() => game.setTool({ kind: "build", sub: "prop", variant: p.id })}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                on
                  ? "border-white/60 bg-white/15 text-white"
                  : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10"
              }`}
              title={p.name}
            >
              <span
                className="inline-block h-3 w-3 rounded-full border border-white/30"
                style={{ background: p.color }}
              />
              {p.name}
            </button>
          );
        })}
        {items.length === 0 && (
          <p className="text-xs text-white/40">No items match.</p>
        )}
      </div>
    </div>
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