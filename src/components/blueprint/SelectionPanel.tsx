import { useGame } from "@/lib/blueprint/store";
import type { RoadSegment, SignObj } from "@/lib/blueprint/types";
import { RotateCw, Trash2 } from "lucide-react";

export function SelectionPanel() {
  const game = useGame();
  if (!game.selectedId) return null;
  const obj = game.city.objects.find((o) => o.id === game.selectedId);
  if (!obj) return null;

  return (
    <div className="pointer-events-auto absolute right-4 top-20 z-30 w-72 rounded-2xl border border-white/15 bg-black/60 p-4 text-white backdrop-blur-xl shadow-2xl">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs tracking-[0.3em] uppercase text-white/60">
          {obj.kind === "building" ? `${obj.variant.replace("-", " ")}` : obj.kind}
        </p>
        <div className="flex items-center gap-1">
          {(obj.kind === "building" || obj.kind === "nature" || obj.kind === "sign") && (
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
      {obj.kind === "building" && (
        <label className="flex items-center justify-between text-sm">
          <span className="text-white/70">Snap to grid</span>
          <input
            type="checkbox"
            checked={obj.snap}
            onChange={(e) => game.updateObject(obj.id, { snap: e.target.checked })}
            className="h-4 w-4 accent-white"
          />
        </label>
      )}
    </div>
  );
}

function RoadEditor({ road }: { road: RoadSegment }) {
  const game = useGame();
  const toggle = (key: keyof RoadSegment) =>
    game.updateObject(road.id, { [key]: !road[key] } as Partial<RoadSegment>);
  const items: { k: keyof RoadSegment; label: string }[] = [
    { k: "sidewalks", label: "Sidewalks" },
    { k: "crosswalk", label: "Crosswalk" },
    { k: "parking", label: "Roadside parking" },
    { k: "trafficLight", label: "Traffic light" },
    { k: "stopSign", label: "Stop sign" },
  ];
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <label key={it.k} className="flex items-center justify-between text-sm">
          <span className="text-white/80">{it.label}</span>
          <input
            type="checkbox"
            checked={!!road[it.k]}
            onChange={() => toggle(it.k)}
            className="h-4 w-4 accent-white"
          />
        </label>
      ))}
    </div>
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