import { newId, useGame } from "@/lib/blueprint/store";
import {
  BUILDING_COLORS,
  NATURE_DEFAULT_COLORS,
} from "@/components/blueprint/GameCanvas";
import { PROP_CATALOG } from "@/lib/blueprint/catalog";
import type {
  Building,
  NatureObj,
  PropObj,
  RoadDecalKind,
  RoadSegment,
  SignObj,
} from "@/lib/blueprint/types";
import { RotateCw, Trash2 } from "lucide-react";

const PROP_LOOKUP = new Map(PROP_CATALOG.map((p) => [p.id, p]));

export function SelectionPanel() {
  const game = useGame();
  // Multi-selection panel
  if (game.selectedIds.length > 1) {
    return <MultiPanel ids={game.selectedIds} />;
  }
  if (!game.selectedId) return null;
  const obj = game.city.objects.find((o) => o.id === game.selectedId);
  if (!obj) return null;

  return (
    <div className="pointer-events-auto absolute right-4 top-20 z-30 w-72 rounded-2xl border border-white/15 bg-black/60 p-4 text-white backdrop-blur-xl shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs tracking-[0.3em] uppercase text-white/60">
          {obj.kind === "building"
            ? `${obj.variant.replace("-", " ")}`
            : obj.kind === "prop"
            ? PROP_LOOKUP.get(obj.catalogId)?.name ?? "prop"
            : obj.kind}
        </p>
        <div className="flex items-center gap-1">
          {(obj.kind === "building" || obj.kind === "nature" || obj.kind === "sign" || obj.kind === "prop") && (
            <button
              onClick={() =>
                game.updateObject(obj.id, { rotation: obj.rotation + Math.PI / 12 })
              }
              className="rounded-full p-1.5 hover:bg-white/10"
              title="Rotate (R)"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => game.deleteObject(obj.id)}
            className="rounded-full p-1.5 text-red-300 hover:bg-red-500/30"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {obj.kind === "road" && <RoadEditor road={obj} />}
      {obj.kind === "sign" && <SignEditor sign={obj} />}
      {obj.kind === "building" && <BuildingEditor building={obj} />}
      {obj.kind === "nature" && obj.variant !== "grass" && (
        <NatureEditor nature={obj} />
      )}
      {obj.kind === "prop" && <PropEditor prop={obj} />}
    </div>
  );
}

function MultiPanel({ ids }: { ids: string[] }) {
  const game = useGame();
  const objs = game.city.objects.filter((o) => ids.includes(o.id));
  const natureLike = objs.filter(
    (o) => o.kind === "nature" || o.kind === "prop",
  ) as (NatureObj | PropObj)[];
  const first = natureLike[0];
  const current =
    first?.color ??
    (first?.kind === "nature"
      ? NATURE_DEFAULT_COLORS[first.variant]
      : first?.kind === "prop"
      ? PROP_LOOKUP.get(first.catalogId)?.color ?? "#888888"
      : "#888888");

  return (
    <div className="pointer-events-auto absolute right-4 top-20 z-30 w-72 rounded-2xl border border-white/15 bg-black/60 p-4 text-white backdrop-blur-xl shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs tracking-[0.3em] uppercase text-white/60">
          {ids.length} selected
        </p>
        <button
          onClick={() => game.deleteMany(ids)}
          className="rounded-full p-1.5 text-red-300 hover:bg-red-500/30"
          title="Delete all"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {natureLike.length > 0 ? (
        <label className="flex items-center justify-between text-sm">
          <span className="text-white/70">Bulk color · {natureLike.length} items</span>
          <input
            type="color"
            value={current}
            onChange={(e) =>
              game.updateMany(
                natureLike.map((o) => o.id),
                { color: e.target.value } as Partial<NatureObj | PropObj>,
              )
            }
            className="h-7 w-12 cursor-pointer rounded border border-white/20 bg-transparent"
          />
        </label>
      ) : (
        <p className="text-xs text-white/60">
          Mixed selection. Use Delete tool + Ctrl-drag to bulk delete, or
          select nature/props to recolor together.
        </p>
      )}
    </div>
  );
}

function PropEditor({ prop }: { prop: PropObj }) {
  const game = useGame();
  const def = PROP_LOOKUP.get(prop.catalogId);
  const current = prop.color ?? def?.color ?? "#888888";
  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between text-sm">
        <span className="text-white/70">Color</span>
        <input
          type="color"
          value={current}
          onChange={(e) => game.updateObject(prop.id, { color: e.target.value })}
          className="h-7 w-12 cursor-pointer rounded border border-white/20 bg-transparent"
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span className="text-white/70">Size</span>
        <input
          type="range"
          min={6}
          max={80}
          step={1}
          value={prop.size}
          onChange={(e) =>
            game.updateObject(prop.id, { size: parseFloat(e.target.value) })
          }
          className="flex-1 accent-white"
        />
      </label>
    </div>
  );
}

function RoadEditor({ road }: { road: RoadSegment }) {
  const game = useGame();
  const add = (variant: RoadDecalKind) =>
    game.addObject({
      id: newId(),
      kind: "roadDecal",
      variant,
      roadId: road.id,
      t: 0.5,
    });
  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between text-sm">
        <span className="text-white/80">Sidewalks</span>
        <input
          type="checkbox"
          checked={road.sidewalks}
          onChange={() => game.updateObject(road.id, { sidewalks: !road.sidewalks })}
          className="h-4 w-4 accent-white"
        />
      </label>
      <label className="flex items-center justify-between text-sm">
        <span className="text-white/80">Roadside parking</span>
        <input
          type="checkbox"
          checked={road.parking}
          onChange={() => game.updateObject(road.id, { parking: !road.parking })}
          className="h-4 w-4 accent-white"
        />
      </label>
      <div className="border-t border-white/10 pt-3">
        <p className="mb-2 text-xs uppercase tracking-widest text-white/50">
          Add to road (use Move tool to slide)
        </p>
        <div className="grid grid-cols-3 gap-2">
          <DecalBtn label="Crosswalk" onClick={() => add("crosswalk")} />
          <DecalBtn label="Light" onClick={() => add("trafficLight")} />
          <DecalBtn label="Stop" onClick={() => add("stopSign")} />
        </div>
      </div>
    </div>
  );
}

function DecalBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-white/15 bg-white/5 px-2 py-2 text-xs text-white/85 hover:bg-white/15"
    >
      + {label}
    </button>
  );
}

function BuildingEditor({ building }: { building: Building }) {
  const game = useGame();
  const current = building.color ?? BUILDING_COLORS[building.variant];
  return (
    <div className="space-y-3">
      <label className="flex items-center justify-between text-sm">
        <span className="text-white/70">Wall color</span>
        <input
          type="color"
          value={current}
          onChange={(e) => game.updateObject(building.id, { color: e.target.value })}
          className="h-7 w-12 cursor-pointer rounded border border-white/20 bg-transparent"
        />
      </label>
      <label className="flex items-center justify-between text-sm">
        <span className="text-white/70">Snap to grid</span>
        <input
          type="checkbox"
          checked={building.snap}
          onChange={(e) => game.updateObject(building.id, { snap: e.target.checked })}
          className="h-4 w-4 accent-white"
        />
      </label>
    </div>
  );
}

function NatureEditor({ nature }: { nature: NatureObj }) {
  const game = useGame();
  const current = nature.color ?? NATURE_DEFAULT_COLORS[nature.variant];
  return (
    <label className="flex items-center justify-between text-sm">
      <span className="text-white/70 capitalize">{nature.variant} color</span>
      <input
        type="color"
        value={current}
        onChange={(e) => game.updateObject(nature.id, { color: e.target.value })}
        className="h-7 w-12 cursor-pointer rounded border border-white/20 bg-transparent"
      />
    </label>
  );
}

function SignEditor({ sign }: { sign: SignObj }) {
  const game = useGame();
  return (
    <div className="space-y-2">
      <label className="block text-xs tracking-widest uppercase text-white/60">Text</label>
      <input
        value={sign.text}
        onChange={(e) => game.updateObject(sign.id, { text: e.target.value })}
        className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
      />
    </div>
  );
}