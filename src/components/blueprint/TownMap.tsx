import { useEffect, useRef, useState } from "react";
import { Map as MapIcon, X } from "lucide-react";
import { useGame } from "@/lib/blueprint/store";
import type { AnyObject } from "@/lib/blueprint/types";

export function TownMap() {
  const [open, setOpen] = useState(false);
  const game = useGame();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="absolute right-4 top-4 z-30 flex items-center gap-2 rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-md hover:bg-black/70"
        title="Open town map"
      >
        <MapIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{game.townName || "Town"} Map</span>
      </button>
      {open && <MapOverlay onClose={() => setOpen(false)} />}
    </>
  );
}

function MapOverlay({ onClose }: { onClose: () => void }) {
  const game = useGame();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = c.clientHeight;
    c.width = w * dpr;
    c.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    renderMini(ctx, w, h, game.city.objects);
  }, [game.city.objects]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6">
      <div className="relative w-full max-w-4xl rounded-2xl border border-white/15 bg-black/80 p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.35em] uppercase text-white/50">Town Overview</p>
            <h2 className="font-display text-3xl text-white">{game.townName || "Untitled Town"}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/15 p-2 text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-[#9bbf8a]">
          <canvas ref={ref} className="block h-full w-full" />
        </div>
        <p className="mt-3 text-xs text-white/60">
          {game.city.objects.length} objects placed
        </p>
      </div>
    </div>
  );
}

function renderMini(ctx: CanvasRenderingContext2D, w: number, h: number, objs: AnyObject[]) {
  ctx.fillStyle = "#9bbf8a";
  ctx.fillRect(0, 0, w, h);
  if (objs.length === 0) return;

  // compute bounds
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const include = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (const o of objs) {
    if (o.kind === "road") {
      include(o.a.x, o.a.y); include(o.b.x, o.b.y);
    } else if (o.kind === "building" || o.kind === "nature" || o.kind === "sign") {
      include(o.pos.x, o.pos.y);
    } else if (o.kind === "water") {
      o.points.forEach((p) => include(p.x, p.y));
    }
  }
  const pad = 40;
  const bw = maxX - minX + pad * 2;
  const bh = maxY - minY + pad * 2;
  const scale = Math.min(w / bw, h / bh);
  const ox = -minX + pad + (w / scale - bw) / 2;
  const oy = -minY + pad + (h / scale - bh) / 2;
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(ox, oy);

  for (const o of objs) {
    if (o.kind === "water") {
      ctx.fillStyle = "#6aa3c9";
      ctx.strokeStyle = "#6aa3c9";
      ctx.lineWidth = 22;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      if (o.variant === "river") {
        ctx.beginPath();
        o.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
      } else {
        ctx.beginPath();
        o.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.fill();
      }
    }
  }
  for (const o of objs) {
    if (o.kind === "road") {
      ctx.strokeStyle = "#3d3d42";
      ctx.lineWidth = o.width;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(o.a.x, o.a.y);
      ctx.lineTo(o.b.x, o.b.y);
      ctx.stroke();
    }
  }
  for (const o of objs) {
    if (o.kind === "building") {
      ctx.fillStyle = "#d8b48a";
      ctx.fillRect(o.pos.x - o.size.x / 2, o.pos.y - o.size.y / 2, o.size.x, o.size.y);
    } else if (o.kind === "nature" && o.variant === "tree") {
      ctx.fillStyle = "#5a8a4e";
      ctx.beginPath();
      ctx.arc(o.pos.x, o.pos.y, o.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}