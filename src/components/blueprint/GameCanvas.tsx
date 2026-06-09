import { useEffect, useRef, useState } from "react";
import {
  newId,
  screenToWorld,
  snap,
  snapRoadEndpoint,
  useGame,
} from "@/lib/blueprint/store";
import type {
  AnyObject,
  Building,
  BuildingKind,
  NatureKind,
  NatureObj,
  RoadSegment,
  SignKind,
  SignObj,
  Vec2,
  WaterKind,
  WaterObj,
} from "@/lib/blueprint/types";

const BUILDING_SIZES: Record<BuildingKind, Vec2> = {
  house: { x: 80, y: 80 },
  apartment: { x: 120, y: 160 },
  "town-office": { x: 140, y: 120 },
  "town-hall": { x: 180, y: 140 },
  store: { x: 120, y: 100 },
  library: { x: 140, y: 110 },
  restaurant: { x: 110, y: 100 },
};

const BUILDING_COLORS: Record<BuildingKind, string> = {
  house: "#d8b48a",
  apartment: "#9caec0",
  "town-office": "#c9b890",
  "town-hall": "#b8967a",
  store: "#c4a8a0",
  library: "#a8b89c",
  restaurant: "#c89878",
};

const NATURE_COLORS: Record<NatureKind, string> = {
  grass: "#a8c896",
  tree: "#5a8a4e",
  bush: "#7aa86e",
  flower: "#e6a4c0",
};

const NATURE_SIZES: Record<NatureKind, number> = {
  grass: 60,
  tree: 28,
  bush: 18,
  flower: 10,
};

export function GameCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const game = useGame();
  const [dims, setDims] = useState({ w: 800, h: 600 });

  // road dragging
  const [roadStart, setRoadStart] = useState<Vec2 | null>(null);
  const [mousePos, setMousePos] = useState<Vec2 | null>(null);
  // pan
  const panRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(
    null,
  );
  // water building
  const [waterPoints, setWaterPoints] = useState<Vec2[]>([]);
  // moving an object
  const movingRef = useRef<{ id: string; offset: Vec2 } | null>(null);

  // resize
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // render
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = dims.w * dpr;
    c.height = dims.h * dpr;
    c.style.width = `${dims.w}px`;
    c.style.height = `${dims.h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, dims.w, dims.h, game, roadStart, mousePos, waterPoints);
  }, [dims, game.city, game.camera, game.selectedId, roadStart, mousePos, waterPoints, game]);

  // global mousemove for live preview
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const toWorld = (sx: number, sy: number) =>
    screenToWorld(sx, sy, game.camera);

  const handleDown = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = toWorld(sx, sy);

    // middle button or space = pan
    if (e.button === 1 || e.shiftKey) {
      panRef.current = { x: e.clientX, y: e.clientY, cx: game.camera.x, cy: game.camera.y };
      return;
    }

    if (game.tool.kind === "delete") {
      const hit = hitTest(world, game.city.objects);
      if (hit) game.deleteObject(hit.id);
      return;
    }

    if (game.tool.kind === "move") {
      const hit = hitTest(world, game.city.objects);
      if (hit && hit.kind !== "water" && hit.kind !== "road") {
        game.select(hit.id);
        const pos = (hit as Building | NatureObj | SignObj).pos;
        movingRef.current = {
          id: hit.id,
          offset: { x: world.x - pos.x, y: world.y - pos.y },
        };
      } else {
        game.select(hit?.id ?? null);
      }
      return;
    }

    // build
    if (game.tool.kind === "build") {
      const sub = game.tool.sub;
      if (sub === "road") {
        const roads = game.city.objects.filter((o): o is RoadSegment => o.kind === "road");
        const p = snapPoint(world, game.snapToGrid);
        setRoadStart(snapRoadEndpoint(p, roads));
      } else if (sub === "building") {
        const variant = (game.tool.variant ?? "house") as BuildingKind;
        const size = BUILDING_SIZES[variant];
        const pos = game.snapToGrid
          ? { x: snap(world.x), y: snap(world.y) }
          : world;
        const b: Building = {
          id: newId(),
          kind: "building",
          variant,
          pos,
          size,
          rotation: 0,
          snap: game.snapToGrid,
        };
        game.addObject(b);
      } else if (sub === "nature") {
        const variant = (game.tool.variant ?? "tree") as NatureKind;
        const n: NatureObj = {
          id: newId(),
          kind: "nature",
          variant,
          pos: world,
          size: NATURE_SIZES[variant],
          rotation: Math.random() * Math.PI * 2,
        };
        game.addObject(n);
      } else if (sub === "forest") {
        // brush — scatter several trees around click
        for (let i = 0; i < 12; i++) {
          const a = Math.random() * Math.PI * 2;
          const r = Math.random() * 90;
          const variant: NatureKind = Math.random() > 0.3 ? "tree" : "bush";
          game.addObject({
            id: newId(),
            kind: "nature",
            variant,
            pos: { x: world.x + Math.cos(a) * r, y: world.y + Math.sin(a) * r },
            size: NATURE_SIZES[variant] * (0.8 + Math.random() * 0.5),
            rotation: Math.random() * Math.PI * 2,
          });
        }
      } else if (sub === "water") {
        const variant = (game.tool.variant ?? "pond") as WaterKind;
        if (variant === "pond" || variant === "lake") {
          const r = variant === "pond" ? 60 : 140;
          const pts: Vec2[] = [];
          const sides = variant === "pond" ? 10 : 14;
          for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2;
            const rr = r * (0.8 + Math.random() * 0.35);
            pts.push({ x: world.x + Math.cos(a) * rr, y: world.y + Math.sin(a) * rr });
          }
          game.addObject({ id: newId(), kind: "water", variant, points: pts });
        } else {
          // river: collect points across clicks; double-click to finish
          if (e.detail === 2 && waterPoints.length >= 2) {
            game.addObject({
              id: newId(),
              kind: "water",
              variant: "river",
              points: waterPoints,
            });
            setWaterPoints([]);
          } else {
            setWaterPoints((p) => [...p, world]);
          }
        }
      } else if (sub === "sign") {
        const variant = (game.tool.variant ?? "street") as SignKind;
        const s: SignObj = {
          id: newId(),
          kind: "sign",
          variant,
          pos: world,
          text: variant === "street" ? "Main St" : variant === "town" ? "Welcome to Town" : "Highway 1",
          rotation: 0,
        };
        game.addObject(s);
        game.select(s.id);
      }
    }
  };

  const handleMove = (e: React.MouseEvent) => {
    if (panRef.current) {
      const p = panRef.current;
      game.setCamera({ x: p.cx + (e.clientX - p.x), y: p.cy + (e.clientY - p.y) });
      return;
    }
    if (movingRef.current) {
      const rect = ref.current!.getBoundingClientRect();
      const world = toWorld(e.clientX - rect.left, e.clientY - rect.top);
      const obj = game.city.objects.find((o) => o.id === movingRef.current!.id);
      if (!obj) return;
      let nx = world.x - movingRef.current.offset.x;
      let ny = world.y - movingRef.current.offset.y;
      if ((obj as Building).snap) {
        nx = snap(nx);
        ny = snap(ny);
      }
      game.updateObject(obj.id, { pos: { x: nx, y: ny } } as Partial<AnyObject>);
    }
  };

  const handleUp = (e: React.MouseEvent) => {
    if (panRef.current) {
      panRef.current = null;
      return;
    }
    if (movingRef.current) {
      movingRef.current = null;
      return;
    }
    if (roadStart) {
      const rect = ref.current!.getBoundingClientRect();
      const world = toWorld(e.clientX - rect.left, e.clientY - rect.top);
      const roads = game.city.objects.filter((o): o is RoadSegment => o.kind === "road");
      const end = snapRoadEndpoint(snapPoint(world, game.snapToGrid), roads);
      const dist = Math.hypot(end.x - roadStart.x, end.y - roadStart.y);
      if (dist > 10) {
        const seg: RoadSegment = {
          id: newId(),
          kind: "road",
          a: roadStart,
          b: end,
          width: 26,
          sidewalks: true,
          crosswalk: false,
          parking: false,
          trafficLight: false,
          stopSign: false,
        };
        game.addObject(seg);
      }
      setRoadStart(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = ref.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    game.zoomAt(factor, sx, sy);
  };

  // rotate selected on R key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        if (game.selectedId) {
          const o = game.city.objects.find((x) => x.id === game.selectedId);
          if (o && (o.kind === "building" || o.kind === "nature" || o.kind === "sign")) {
            game.updateObject(o.id, {
              rotation: o.rotation + Math.PI / 12,
            } as Partial<AnyObject>);
          }
        }
      }
      if (e.key === "Escape") {
        setRoadStart(null);
        setWaterPoints([]);
        game.select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [game]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <canvas
        ref={ref}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="block h-full w-full cursor-crosshair touch-none select-none"
      />
    </div>
  );
}

function snapPoint(p: Vec2, doSnap: boolean): Vec2 {
  return doSnap ? { x: snap(p.x), y: snap(p.y) } : p;
}

function hitTest(p: Vec2, objs: AnyObject[]): AnyObject | null {
  // iterate top to bottom
  for (let i = objs.length - 1; i >= 0; i--) {
    const o = objs[i];
    if (o.kind === "building") {
      const dx = p.x - o.pos.x;
      const dy = p.y - o.pos.y;
      if (Math.abs(dx) < o.size.x / 2 && Math.abs(dy) < o.size.y / 2) return o;
    } else if (o.kind === "nature") {
      const d = Math.hypot(p.x - o.pos.x, p.y - o.pos.y);
      if (d < o.size) return o;
    } else if (o.kind === "sign") {
      const dx = p.x - o.pos.x;
      const dy = p.y - o.pos.y;
      if (Math.abs(dx) < 40 && Math.abs(dy) < 16) return o;
    } else if (o.kind === "road") {
      const d = distToSegment(p, o.a, o.b);
      if (d < o.width / 2 + 4) return o;
    }
  }
  return null;
}

function distToSegment(p: Vec2, a: Vec2, b: Vec2) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function draw(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  game: ReturnType<typeof useGame.getState>,
  roadStart: Vec2 | null,
  mouseScreen: Vec2 | null,
  waterPoints: Vec2[],
) {
  // background = grass
  ctx.fillStyle = "#9bbf8a";
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(game.camera.x, game.camera.y);
  ctx.scale(game.camera.zoom, game.camera.zoom);

  // grid
  const grid = 40;
  const startX = Math.floor(-game.camera.x / game.camera.zoom / grid) * grid;
  const startY = Math.floor(-game.camera.y / game.camera.zoom / grid) * grid;
  const endX = startX + w / game.camera.zoom + grid * 2;
  const endY = startY + h / game.camera.zoom + grid * 2;
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1 / game.camera.zoom;
  ctx.beginPath();
  for (let x = startX; x < endX; x += grid) {
    ctx.moveTo(x, startY);
    ctx.lineTo(x, endY);
  }
  for (let y = startY; y < endY; y += grid) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();

  // draw water first (under), then roads, then buildings, then nature, then signs
  const water = game.city.objects.filter((o) => o.kind === "water") as WaterObj[];
  const roads = game.city.objects.filter((o) => o.kind === "road") as RoadSegment[];
  const buildings = game.city.objects.filter((o) => o.kind === "building") as Building[];
  const nature = game.city.objects.filter((o) => o.kind === "nature") as NatureObj[];
  const signs = game.city.objects.filter((o) => o.kind === "sign") as SignObj[];

  water.forEach((w) => drawWater(ctx, w));
  roads.forEach((r) => drawRoad(ctx, r, r.id === game.selectedId));
  buildings.forEach((b) => drawBuilding(ctx, b, b.id === game.selectedId));
  nature.forEach((n) => drawNature(ctx, n, n.id === game.selectedId));
  signs.forEach((s) => drawSign(ctx, s, s.id === game.selectedId));

  // preview road
  if (roadStart && mouseScreen) {
    const end = screenToWorld(mouseScreen.x, mouseScreen.y, game.camera);
    const snapped = snapRoadEndpoint(end, roads);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(roadStart.x, roadStart.y);
    ctx.lineTo(snapped.x, snapped.y);
    ctx.stroke();
  }

  // preview river points
  if (waterPoints.length > 0) {
    ctx.strokeStyle = "rgba(120,180,220,0.6)";
    ctx.lineWidth = 18;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    waterPoints.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    if (mouseScreen) {
      const m = screenToWorld(mouseScreen.x, mouseScreen.y, game.camera);
      ctx.lineTo(m.x, m.y);
    }
    ctx.stroke();
  }

  ctx.restore();

  // weather overlay (rain/snow) is rendered via DOM in WeatherOverlay
  // day/night tint
  const t = game.city.timeOfDay;
  let tint = "rgba(0,0,0,0)";
  if (t < 6 || t > 20) tint = "rgba(20,30,70,0.55)";
  else if (t < 8) tint = "rgba(255,180,120,0.18)";
  else if (t > 18) tint = "rgba(255,140,90,0.22)";
  else if (t > 17) tint = "rgba(255,180,120,0.12)";
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
}

function drawRoad(ctx: CanvasRenderingContext2D, r: RoadSegment, selected: boolean) {
  const angle = Math.atan2(r.b.y - r.a.y, r.b.x - r.a.x);
  // sidewalks
  if (r.sidewalks) {
    ctx.strokeStyle = "#d8d2c5";
    ctx.lineWidth = r.width + 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(r.a.x, r.a.y);
    ctx.lineTo(r.b.x, r.b.y);
    ctx.stroke();
  }
  // road
  ctx.strokeStyle = "#3d3d42";
  ctx.lineWidth = r.width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(r.a.x, r.a.y);
  ctx.lineTo(r.b.x, r.b.y);
  ctx.stroke();
  // center dashes
  ctx.strokeStyle = "#f0d050";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(r.a.x, r.a.y);
  ctx.lineTo(r.b.x, r.b.y);
  ctx.stroke();
  ctx.setLineDash([]);

  if (r.parking) {
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const off = r.width / 2 + 4;
    const nx = -Math.sin(angle) * off;
    const ny = Math.cos(angle) * off;
    ctx.moveTo(r.a.x + nx, r.a.y + ny);
    ctx.lineTo(r.b.x + nx, r.b.y + ny);
    ctx.stroke();
  }

  if (r.crosswalk) {
    const cx = (r.a.x + r.b.x) / 2;
    const cy = (r.a.y + r.b.y) / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = "#fff";
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(i * 6 - 2, -r.width / 2, 4, r.width);
    }
    ctx.restore();
  }

  if (r.trafficLight) {
    drawTrafficLight(ctx, r.b.x, r.b.y);
  }
  if (r.stopSign) {
    drawStopSign(ctx, r.b.x, r.b.y);
  }

  if (selected) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(r.a.x, r.a.y);
    ctx.lineTo(r.b.x, r.b.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawTrafficLight(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#222";
  ctx.fillRect(x - 4, y - 12, 8, 24);
  ctx.fillStyle = "#ff4040";
  ctx.beginPath();
  ctx.arc(x, y - 6, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fcd34d";
  ctx.beginPath();
  ctx.arc(x, y, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#22c55e";
  ctx.beginPath();
  ctx.arc(x, y + 6, 2.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawStopSign(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  const r = 7;
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 8) + (i * Math.PI) / 4;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 5px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("STOP", x, y);
}

function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, selected: boolean) {
  ctx.save();
  ctx.translate(b.pos.x, b.pos.y);
  ctx.rotate(b.rotation);
  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(-b.size.x / 2 + 4, -b.size.y / 2 + 4, b.size.x, b.size.y);
  // body
  ctx.fillStyle = BUILDING_COLORS[b.variant];
  ctx.fillRect(-b.size.x / 2, -b.size.y / 2, b.size.x, b.size.y);
  // roof outline
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(-b.size.x / 2, -b.size.y / 2, b.size.x, b.size.y);
  // inner detail
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-b.size.x / 2, 0);
  ctx.lineTo(b.size.x / 2, 0);
  ctx.stroke();
  // label
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(b.variant.replace("-", " "), 0, 0);

  if (selected) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-b.size.x / 2 - 4, -b.size.y / 2 - 4, b.size.x + 8, b.size.y + 8);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawNature(ctx: CanvasRenderingContext2D, n: NatureObj, selected: boolean) {
  if (n.variant === "grass") {
    ctx.fillStyle = NATURE_COLORS.grass;
    ctx.beginPath();
    ctx.arc(n.pos.x, n.pos.y, n.size, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (n.variant === "tree") {
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.arc(n.pos.x + 3, n.pos.y + 3, n.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = NATURE_COLORS.tree;
    ctx.beginPath();
    ctx.arc(n.pos.x, n.pos.y, n.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.arc(n.pos.x - n.size * 0.3, n.pos.y - n.size * 0.3, n.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (n.variant === "bush") {
    ctx.fillStyle = NATURE_COLORS.bush;
    ctx.beginPath();
    ctx.arc(n.pos.x - 6, n.pos.y, n.size, 0, Math.PI * 2);
    ctx.arc(n.pos.x + 6, n.pos.y, n.size, 0, Math.PI * 2);
    ctx.arc(n.pos.x, n.pos.y - 5, n.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (n.variant === "flower") {
    ctx.fillStyle = NATURE_COLORS.flower;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(n.pos.x + Math.cos(a) * 5, n.pos.y + Math.sin(a) * 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "#f5d76e";
    ctx.beginPath();
    ctx.arc(n.pos.x, n.pos.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  if (selected) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(n.pos.x, n.pos.y, n.size + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawWater(ctx: CanvasRenderingContext2D, w: WaterObj) {
  if (w.variant === "river") {
    ctx.strokeStyle = "#6aa3c9";
    ctx.lineWidth = 22;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    w.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    w.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
    return;
  }
  ctx.fillStyle = "#6aa3c9";
  ctx.beginPath();
  w.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawSign(ctx: CanvasRenderingContext2D, s: SignObj, selected: boolean) {
  ctx.save();
  ctx.translate(s.pos.x, s.pos.y);
  ctx.rotate(s.rotation);
  const colors = {
    street: "#2563eb",
    town: "#15803d",
    highway: "#166534",
  };
  ctx.fillStyle = colors[s.variant];
  const w = Math.max(60, s.text.length * 7);
  ctx.fillRect(-w / 2, -12, w, 24);
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-w / 2 + 2, -10, w - 4, 20);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(s.text, 0, 0);
  if (selected) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(-w / 2 - 4, -16, w + 8, 32);
    ctx.setLineDash([]);
  }
  ctx.restore();
}