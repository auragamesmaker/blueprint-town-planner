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
  PropObj,
  RoadDecal,
  RoadSegment,
  SignKind,
  SignObj,
  Vec2,
  WaterKind,
  WaterObj,
} from "@/lib/blueprint/types";
import { PROP_CATALOG, type PropDef, type PropShape } from "@/lib/blueprint/catalog";

const PROP_BY_ID = new Map<string, PropDef>(PROP_CATALOG.map((p) => [p.id, p]));

const BUILDING_SIZES: Record<BuildingKind, Vec2> = {
  house: { x: 90, y: 110 },
  apartment: { x: 130, y: 170 },
  "town-office": { x: 150, y: 130 },
  "town-hall": { x: 200, y: 150 },
  store: { x: 140, y: 110 },
  library: { x: 160, y: 120 },
  restaurant: { x: 130, y: 110 },
};

export const BUILDING_COLORS: Record<BuildingKind, string> = {
  house: "#e6d3b3",
  apartment: "#b4c2d2",
  "town-office": "#d4c89a",
  "town-hall": "#c9a48a",
  store: "#d4b8a8",
  library: "#b8c8a8",
  restaurant: "#d8a888",
};

const ROOF_COLORS: Record<BuildingKind, string> = {
  house: "#7a3a2e",
  apartment: "#3d4a5a",
  "town-office": "#5a4a3a",
  "town-hall": "#4a3030",
  store: "#5a3a3a",
  library: "#3a4a3a",
  restaurant: "#6a3a2a",
};

export const NATURE_DEFAULT_COLORS: Record<NatureKind, string> = {
  grass: "#a8c896",
  tree: "#3f7a3a",
  bush: "#6a9a5e",
  flower: "#e6a4c0",
};

const NATURE_SIZES: Record<NatureKind, number> = {
  grass: 60,
  tree: 30,
  bush: 18,
  flower: 10,
};

const WATER_COLOR = "#5a93b8";

export function GameCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const game = useGame();
  const [dims, setDims] = useState({ w: 800, h: 600 });

  const [roadStart, setRoadStart] = useState<Vec2 | null>(null);
  const [mousePos, setMousePos] = useState<Vec2 | null>(null);
  const panRef = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);
  const [waterPoints, setWaterPoints] = useState<Vec2[]>([]);
  const movingRef = useRef<
    | { kind: "obj"; id: string; offset: Vec2 }
    | { kind: "decal"; id: string }
    | null
  >(null);
  const marqueeRef = useRef<{ start: Vec2; end: Vec2 } | null>(null);
  const [marquee, setMarquee] = useState<{ start: Vec2; end: Vec2 } | null>(null);
  const timeRef = useRef(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Animation loop — drives water shimmer + windmill etc.
  useEffect(() => {
    let raf = 0;
    const loop = (t: number) => {
      timeRef.current = t / 1000;
      setTick((n) => (n + 1) % 1_000_000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

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
    draw(ctx, dims.w, dims.h, game, roadStart, mousePos, waterPoints, timeRef.current, marquee);
  }, [dims, game.city, game.camera, game.selectedId, game.selectedIds, roadStart, mousePos, waterPoints, marquee, tick, game]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - r.left, y: e.clientY - r.top });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const toWorld = (sx: number, sy: number) => screenToWorld(sx, sy, game.camera);

  const handleDown = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = toWorld(sx, sy);

    if (e.button === 1 || e.shiftKey) {
      panRef.current = { x: e.clientX, y: e.clientY, cx: game.camera.x, cy: game.camera.y };
      return;
    }

    // Ctrl/Cmd + drag → marquee select
    if (e.ctrlKey || e.metaKey) {
      marqueeRef.current = { start: world, end: world };
      setMarquee({ start: world, end: world });
      return;
    }

    if (game.tool.kind === "delete") {
      const hit = hitTest(world, game.city.objects);
      if (hit) game.deleteObject(hit.id);
      return;
    }

    if (game.tool.kind === "move") {
      const hit = hitTest(world, game.city.objects);
      if (!hit) {
        game.select(null);
        return;
      }
      game.select(hit.id);
      if (hit.kind === "roadDecal") {
        movingRef.current = { kind: "decal", id: hit.id };
      } else if (
        hit.kind === "building" ||
        hit.kind === "nature" ||
        hit.kind === "sign" ||
        hit.kind === "prop"
      ) {
        const pos = hit.pos;
        movingRef.current = {
          kind: "obj",
          id: hit.id,
          offset: { x: world.x - pos.x, y: world.y - pos.y },
        };
      }
      return;
    }

    if (game.tool.kind === "build") {
      const sub = game.tool.sub;
      if (sub === "road") {
        const roads = game.city.objects.filter((o): o is RoadSegment => o.kind === "road");
        const p = snapPoint(world, game.snapToGrid);
        setRoadStart(snapRoadEndpoint(p, roads));
      } else if (sub === "building") {
        const variant = (game.tool.variant ?? "house") as BuildingKind;
        const size = BUILDING_SIZES[variant];
        const pos = game.snapToGrid ? { x: snap(world.x), y: snap(world.y) } : world;
        game.addObject({
          id: newId(),
          kind: "building",
          variant,
          pos,
          size,
          rotation: 0,
          snap: game.snapToGrid,
        } as Building);
      } else if (sub === "nature") {
        const variant = (game.tool.variant ?? "tree") as NatureKind;
        game.addObject({
          id: newId(),
          kind: "nature",
          variant,
          pos: world,
          size: NATURE_SIZES[variant],
          rotation: Math.random() * Math.PI * 2,
        } as NatureObj);
      } else if (sub === "forest") {
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
          const sides = variant === "pond" ? 12 : 18;
          for (let i = 0; i < sides; i++) {
            const a = (i / sides) * Math.PI * 2;
            const rr = r * (0.85 + Math.random() * 0.25);
            pts.push({ x: world.x + Math.cos(a) * rr, y: world.y + Math.sin(a) * rr });
          }
          game.addObject({ id: newId(), kind: "water", variant, points: pts });
        } else {
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
          text:
            variant === "street" ? "Main St" : variant === "town" ? "Welcome to Town" : "Highway 1",
          rotation: 0,
        };
        game.addObject(s);
        game.select(s.id);
      } else if (sub === "prop") {
        const id = game.tool.variant;
        if (!id) return;
        const def = PROP_BY_ID.get(id);
        if (!def) return;
        const p: PropObj = {
          id: newId(),
          kind: "prop",
          catalogId: def.id,
          pos: world,
          size: def.size,
          rotation: 0,
          color: def.color,
        };
        game.addObject(p);
      }
    }
  };

  const handleMove = (e: React.MouseEvent) => {
    if (panRef.current) {
      const p = panRef.current;
      game.setCamera({ x: p.cx + (e.clientX - p.x), y: p.cy + (e.clientY - p.y) });
      return;
    }
    if (marqueeRef.current) {
      const rect = ref.current!.getBoundingClientRect();
      const world = toWorld(e.clientX - rect.left, e.clientY - rect.top);
      marqueeRef.current = { ...marqueeRef.current, end: world };
      setMarquee({ ...marqueeRef.current });
      return;
    }
    if (movingRef.current) {
      const rect = ref.current!.getBoundingClientRect();
      const world = toWorld(e.clientX - rect.left, e.clientY - rect.top);
      const mv = movingRef.current;
      if (mv.kind === "obj") {
        const obj = game.city.objects.find((o) => o.id === mv.id);
        if (!obj) return;
        let nx = world.x - mv.offset.x;
        let ny = world.y - mv.offset.y;
        if ((obj as Building).snap) {
          nx = snap(nx);
          ny = snap(ny);
        }
        game.updateObject(obj.id, { pos: { x: nx, y: ny } } as Partial<AnyObject>);
      } else {
        const decal = game.city.objects.find((o) => o.id === mv.id) as RoadDecal | undefined;
        if (!decal) return;
        const road = game.city.objects.find(
          (o) => o.id === decal.roadId,
        ) as RoadSegment | undefined;
        if (!road) return;
        const t = projectT(world, road.a, road.b);
        game.updateObject(decal.id, { t } as Partial<AnyObject>);
      }
    }
  };

  const handleUp = (e: React.MouseEvent) => {
    if (panRef.current) {
      panRef.current = null;
      return;
    }
    if (marqueeRef.current) {
      const { start, end } = marqueeRef.current;
      marqueeRef.current = null;
      setMarquee(null);
      const minX = Math.min(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxX = Math.max(start.x, end.x);
      const maxY = Math.max(start.y, end.y);
      const ids = game.city.objects
        .filter((o) => objInBox(o, minX, minY, maxX, maxY, game.city.objects))
        .map((o) => o.id);
      if (ids.length === 0) {
        game.select(null);
      } else if (game.tool.kind === "delete") {
        game.deleteMany(ids);
      } else {
        game.selectMany(ids);
      }
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

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "r" || e.key === "R") {
        if (game.selectedId) {
          const o = game.city.objects.find((x) => x.id === game.selectedId);
          if (
            o &&
            (o.kind === "building" ||
              o.kind === "nature" ||
              o.kind === "sign" ||
              o.kind === "prop")
          ) {
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
      if (e.key === "Delete" || e.key === "Backspace") {
        if (game.selectedIds.length > 1) {
          game.deleteMany(game.selectedIds);
        } else if (game.selectedId) {
          game.deleteObject(game.selectedId);
        }
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

function projectT(p: Vec2, a: Vec2, b: Vec2) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return 0;
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2;
  if (t < 0) t = 0;
  if (t > 1) t = 1;
  return t;
}

function pointAt(road: RoadSegment, t: number): Vec2 {
  return {
    x: road.a.x + (road.b.x - road.a.x) * t,
    y: road.a.y + (road.b.y - road.a.y) * t,
  };
}

function pointInPoly(p: Vec2, pts: Vec2[]) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x,
      yi = pts[i].y;
    const xj = pts[j].x,
      yj = pts[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function hitTest(p: Vec2, objs: AnyObject[]): AnyObject | null {
  for (let i = objs.length - 1; i >= 0; i--) {
    const o = objs[i];
    if (o.kind === "roadDecal") {
      const road = objs.find((x) => x.id === o.roadId) as RoadSegment | undefined;
      if (!road) continue;
      const c = pointAt(road, o.t);
      if (Math.hypot(p.x - c.x, p.y - c.y) < 16) return o;
    } else if (o.kind === "building") {
      const dx = p.x - o.pos.x;
      const dy = p.y - o.pos.y;
      if (Math.abs(dx) < o.size.x / 2 && Math.abs(dy) < o.size.y / 2) return o;
    } else if (o.kind === "nature") {
      if (Math.hypot(p.x - o.pos.x, p.y - o.pos.y) < o.size) return o;
    } else if (o.kind === "prop") {
      if (Math.hypot(p.x - o.pos.x, p.y - o.pos.y) < o.size + 4) return o;
    } else if (o.kind === "sign") {
      if (Math.abs(p.x - o.pos.x) < 40 && Math.abs(p.y - o.pos.y) < 16) return o;
    } else if (o.kind === "road") {
      if (distToSegment(p, o.a, o.b) < o.width / 2 + 4) return o;
    } else if (o.kind === "water") {
      if (o.variant === "river") {
        for (let k = 1; k < o.points.length; k++) {
          if (distToSegment(p, o.points[k - 1], o.points[k]) < 14) return o;
        }
      } else {
        if (pointInPoly(p, o.points)) return o;
      }
    }
  }
  return null;
}

function objInBox(
  o: AnyObject,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  all: AnyObject[],
): boolean {
  const inside = (p: Vec2) => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
  if (o.kind === "building" || o.kind === "nature" || o.kind === "sign" || o.kind === "prop") {
    return inside(o.pos);
  }
  if (o.kind === "road") return inside(o.a) || inside(o.b);
  if (o.kind === "water") return o.points.some(inside);
  if (o.kind === "roadDecal") {
    const road = all.find((x) => x.id === o.roadId) as RoadSegment | undefined;
    if (!road) return false;
    return inside(pointAt(road, o.t));
  }
  return false;
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
  time: number,
  marquee: { start: Vec2; end: Vec2 } | null,
) {
  ctx.fillStyle = "#9bbf8a";
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(game.camera.x, game.camera.y);
  ctx.scale(game.camera.zoom, game.camera.zoom);

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

  const water = game.city.objects.filter((o) => o.kind === "water") as WaterObj[];
  const roads = game.city.objects.filter((o) => o.kind === "road") as RoadSegment[];
  const buildings = game.city.objects.filter((o) => o.kind === "building") as Building[];
  const nature = game.city.objects.filter((o) => o.kind === "nature") as NatureObj[];
  const signs = game.city.objects.filter((o) => o.kind === "sign") as SignObj[];
  const decals = game.city.objects.filter((o) => o.kind === "roadDecal") as RoadDecal[];
  const props = game.city.objects.filter((o) => o.kind === "prop") as PropObj[];
  const selSet = new Set(game.selectedIds);

  drawWaterMerged(ctx, water, game.selectedId, time);
  drawRoadsMerged(ctx, roads, game.selectedId);
  decals.forEach((d) => {
    const road = roads.find((r) => r.id === d.roadId);
    if (road) drawDecal(ctx, d, road, selSet.has(d.id) || d.id === game.selectedId);
  });
  buildings.forEach((b) => drawBuilding(ctx, b, selSet.has(b.id) || b.id === game.selectedId));
  nature.forEach((n) => drawNature(ctx, n, selSet.has(n.id) || n.id === game.selectedId));
  signs.forEach((s) => drawSign(ctx, s, selSet.has(s.id) || s.id === game.selectedId));
  props.forEach((p) => drawProp(ctx, p, selSet.has(p.id) || p.id === game.selectedId, time));

  if (roadStart && mouseScreen) {
    const end = screenToWorld(mouseScreen.x, mouseScreen.y, game.camera);
    const snapped = snapRoadEndpoint(end, roads);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 26;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(roadStart.x, roadStart.y);
    ctx.lineTo(snapped.x, snapped.y);
    ctx.stroke();
  }

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

  // Marquee selection rectangle (world space)
  if (marquee) {
    const x = Math.min(marquee.start.x, marquee.end.x);
    const y = Math.min(marquee.start.y, marquee.end.y);
    const wd = Math.abs(marquee.end.x - marquee.start.x);
    const hd = Math.abs(marquee.end.y - marquee.start.y);
    ctx.fillStyle = "rgba(120,180,255,0.18)";
    ctx.fillRect(x, y, wd, hd);
    ctx.strokeStyle = "rgba(180,220,255,0.9)";
    ctx.lineWidth = 1.5 / game.camera.zoom;
    ctx.setLineDash([6 / game.camera.zoom, 4 / game.camera.zoom]);
    ctx.strokeRect(x, y, wd, hd);
    ctx.setLineDash([]);
  }

  ctx.restore();

  const t = game.city.timeOfDay;
  let tint = "rgba(0,0,0,0)";
  if (t < 6 || t > 20) tint = "rgba(20,30,70,0.55)";
  else if (t < 8) tint = "rgba(255,180,120,0.18)";
  else if (t > 18) tint = "rgba(255,140,90,0.22)";
  else if (t > 17) tint = "rgba(255,180,120,0.12)";
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, w, h);
}

function drawWaterMerged(
  ctx: CanvasRenderingContext2D,
  water: WaterObj[],
  selectedId: string | null,
  time: number,
) {
  if (water.length === 0) return;
  // Single fill path so overlaps merge seamlessly into one shape.
  // Depth gradient via radial-ish layering: dark base + lighter inset.
  ctx.fillStyle = "#3e7fa3";
  ctx.strokeStyle = "#3e7fa3";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Polygons (ponds/lakes)
  ctx.beginPath();
  water.forEach((wt) => {
    if (wt.variant === "river") return;
    wt.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.closePath();
  });
  ctx.fill();

  // Rivers — thick strokes in same color merge with polygons
  ctx.lineWidth = 22;
  ctx.beginPath();
  water.forEach((wt) => {
    if (wt.variant !== "river") return;
    wt.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  });
  ctx.stroke();

  // Lighter inset color
  ctx.fillStyle = "#5a93b8";
  ctx.strokeStyle = "#5a93b8";
  ctx.beginPath();
  water.forEach((wt) => {
    if (wt.variant === "river") return;
    wt.points.forEach((p, i) => {
      const cx = wt.points.reduce((s, q) => s + q.x, 0) / wt.points.length;
      const cy = wt.points.reduce((s, q) => s + q.y, 0) / wt.points.length;
      const ix = cx + (p.x - cx) * 0.86;
      const iy = cy + (p.y - cy) * 0.86;
      i === 0 ? ctx.moveTo(ix, iy) : ctx.lineTo(ix, iy);
    });
    ctx.closePath();
  });
  ctx.fill();
  ctx.lineWidth = 16;
  ctx.beginPath();
  water.forEach((wt) => {
    if (wt.variant !== "river") return;
    wt.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  });
  ctx.stroke();

  // Animated shimmer — moving wavy highlights
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.2;
  water.forEach((wt) => {
    if (wt.variant === "river") {
      ctx.beginPath();
      for (let k = 1; k < wt.points.length; k++) {
        const a = wt.points[k - 1];
        const b = wt.points[k];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        const nx = -dy / (len || 1);
        const ny = dx / (len || 1);
        const steps = Math.max(2, Math.floor(len / 8));
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const wave = Math.sin(time * 2 + (a.x + a.y) * 0.05 + s * 0.6) * 3;
          const px = a.x + dx * t + nx * wave;
          const py = a.y + dy * t + ny * wave;
          s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    } else {
      // ripple ellipses inside polygon
      const cx = wt.points.reduce((s, q) => s + q.x, 0) / wt.points.length;
      const cy = wt.points.reduce((s, q) => s + q.y, 0) / wt.points.length;
      const maxR = Math.max(
        ...wt.points.map((p) => Math.hypot(p.x - cx, p.y - cy)),
      );
      for (let i = 0; i < 3; i++) {
        const phase = (time * 0.6 + i * 0.7) % 1;
        const r = maxR * (0.2 + phase * 0.7);
        ctx.globalAlpha = (1 - phase) * 0.35;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r, r * 0.65, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  });
  ctx.restore();

  // Selection outline (dashed) on top
  const sel = water.find((w) => w.id === selectedId);
  if (sel) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (sel.variant === "river") {
      sel.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    } else {
      sel.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.closePath();
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawRoadsMerged(
  ctx: CanvasRenderingContext2D,
  roads: RoadSegment[],
  selectedId: string | null,
) {
  if (roads.length === 0) return;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Sidewalks layer (one stroke, single color → seamless merge)
  const withSidewalks = roads.filter((r) => r.sidewalks);
  if (withSidewalks.length) {
    ctx.strokeStyle = "#d8d2c5";
    ctx.lineWidth = 36; // width + ~10
    ctx.beginPath();
    withSidewalks.forEach((r) => {
      ctx.moveTo(r.a.x, r.a.y);
      ctx.lineTo(r.b.x, r.b.y);
    });
    ctx.stroke();
  }

  // Tarmac layer
  ctx.strokeStyle = "#3d3d42";
  ctx.lineWidth = 26;
  ctx.beginPath();
  roads.forEach((r) => {
    ctx.moveTo(r.a.x, r.a.y);
    ctx.lineTo(r.b.x, r.b.y);
  });
  ctx.stroke();

  // Per-segment dashed center line
  ctx.strokeStyle = "#f0d050";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 8]);
  roads.forEach((r) => {
    ctx.beginPath();
    ctx.moveTo(r.a.x, r.a.y);
    ctx.lineTo(r.b.x, r.b.y);
    ctx.stroke();
  });
  ctx.setLineDash([]);

  // Parking marks (legacy boolean)
  roads.forEach((r) => {
    if (!r.parking) return;
    const angle = Math.atan2(r.b.y - r.a.y, r.b.x - r.a.x);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 2;
    const off = r.width / 2 + 4;
    const nx = -Math.sin(angle) * off;
    const ny = Math.cos(angle) * off;
    ctx.beginPath();
    ctx.moveTo(r.a.x + nx, r.a.y + ny);
    ctx.lineTo(r.b.x + nx, r.b.y + ny);
    ctx.stroke();
  });

  const sel = roads.find((r) => r.id === selectedId);
  if (sel) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sel.a.x, sel.a.y);
    ctx.lineTo(sel.b.x, sel.b.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawDecal(
  ctx: CanvasRenderingContext2D,
  d: RoadDecal,
  road: RoadSegment,
  selected: boolean,
) {
  const c = pointAt(road, d.t);
  const angle = Math.atan2(road.b.y - road.a.y, road.b.x - road.a.x);
  if (d.variant === "crosswalk") {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillStyle = "#fff";
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(i * 6 - 2, -road.width / 2, 4, road.width);
    }
    ctx.restore();
  } else if (d.variant === "trafficLight") {
    drawTrafficLight(ctx, c.x, c.y);
  } else if (d.variant === "stopSign") {
    drawStopSign(ctx, c.x, c.y);
  }
  if (selected) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawTrafficLight(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(x - 5, y - 14, 10, 28);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x - 5, y - 14, 10, 28);
  const colors = ["#ff4040", "#fcd34d", "#22c55e"];
  colors.forEach((cl, i) => {
    ctx.fillStyle = cl;
    ctx.beginPath();
    ctx.arc(x, y - 8 + i * 8, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawStopSign(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = "#dc2626";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  const r = 9;
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 5px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("STOP", x, y);
}

function shade(hex: string, amt: number) {
  // amt in [-1,1]; negative = darker
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const adj = (v: number) =>
    Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  return `rgb(${adj(r)},${adj(g)},${adj(b)})`;
}

function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, selected: boolean) {
  ctx.save();
  ctx.translate(b.pos.x, b.pos.y);
  ctx.rotate(b.rotation);

  const w = b.size.x;
  const h = b.size.y;
  const wallBase = b.color ?? BUILDING_COLORS[b.variant];
  const roof = ROOF_COLORS[b.variant];

  // ground shadow (soft)
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(6, 8, w / 1.8, h / 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // walls with light gradient
  const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  grad.addColorStop(0, shade(wallBase, 0.12));
  grad.addColorStop(1, shade(wallBase, -0.15));
  ctx.fillStyle = grad;
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // roof
  const roofInset = Math.min(w, h) * 0.06;
  ctx.fillStyle = roof;
  ctx.fillRect(-w / 2 + roofInset, -h / 2 + roofInset, w - roofInset * 2, h - roofInset * 2);
  // roof highlight ridge
  ctx.strokeStyle = shade(roof, 0.25);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + roofInset, 0);
  ctx.lineTo(w / 2 - roofInset, 0);
  ctx.stroke();

  // variant-specific details
  ctx.fillStyle = "rgba(180,210,240,0.85)"; // window glass
  const drawWindow = (x: number, y: number, ww: number, hh: number) => {
    ctx.fillRect(x - ww / 2, y - hh / 2, ww, hh);
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 0.7;
    ctx.strokeRect(x - ww / 2, y - hh / 2, ww, hh);
  };

  if (b.variant === "apartment") {
    const cols = 4;
    const rows = 6;
    const padX = w * 0.16;
    const padY = h * 0.12;
    const gx = (w - padX * 2) / (cols - 1);
    const gy = (h - padY * 2) / (rows - 1);
    ctx.fillStyle = "rgba(180,210,240,0.85)";
    for (let r = 0; r < rows; r++) {
      for (let cI = 0; cI < cols; cI++) {
        drawWindow(-w / 2 + padX + cI * gx, -h / 2 + padY + r * gy, 9, 10);
      }
    }
  } else if (b.variant === "house") {
    drawWindow(-w / 4, -h / 4, 14, 12);
    drawWindow(w / 4, -h / 4, 14, 12);
    // door
    ctx.fillStyle = shade(roof, -0.2);
    ctx.fillRect(-6, h / 4 - 4, 12, 18);
    ctx.fillStyle = "#fcd34d";
    ctx.fillRect(3, h / 4 + 5, 1.5, 1.5);
  } else if (b.variant === "town-hall") {
    // columns
    ctx.fillStyle = "#f1ebd9";
    for (let i = -2; i <= 2; i++) {
      ctx.fillRect(i * 28 - 4, -h / 2 + 12, 8, h - 24);
    }
    // grand door
    ctx.fillStyle = shade(roof, -0.3);
    ctx.fillRect(-12, h / 4, 24, h / 4 - 6);
  } else if (b.variant === "town-office" || b.variant === "library") {
    const cols = 5;
    const padX = w * 0.12;
    const gx = (w - padX * 2) / (cols - 1);
    for (let r = -1; r <= 1; r++) {
      for (let cI = 0; cI < cols; cI++) {
        drawWindow(-w / 2 + padX + cI * gx, r * (h * 0.28), 12, 9);
      }
    }
    if (b.variant === "library") {
      ctx.fillStyle = "#f1ebd9";
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(i * 30 - 3, h / 2 - 14, 6, 14);
      }
    }
  } else if (b.variant === "store") {
    // awning stripes
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(-w / 2 + 6, -h / 2 + 6, w - 12, 10);
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 6; i++) {
      ctx.fillRect(-w / 2 + 6 + i * ((w - 12) / 6), -h / 2 + 6, (w - 12) / 12, 10);
    }
    // window front
    drawWindow(0, h / 6, w * 0.6, h * 0.35);
    ctx.fillStyle = shade(roof, -0.2);
    ctx.fillRect(-8, h / 2 - 16, 16, 14);
  } else if (b.variant === "restaurant") {
    // patio dots / tables
    ctx.fillStyle = "#a36b3c";
    [
      [-w / 3, h / 3],
      [0, h / 3],
      [w / 3, h / 3],
    ].forEach(([x, y]) => {
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
    drawWindow(-w / 4, -h / 5, 18, 12);
    drawWindow(w / 4, -h / 5, 18, 12);
    // chimney
    ctx.fillStyle = shade(roof, -0.2);
    ctx.fillRect(w / 3, -h / 2 - 4, 8, 10);
  }

  if (selected) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawNature(ctx: CanvasRenderingContext2D, n: NatureObj, selected: boolean) {
  const color = n.color ?? NATURE_DEFAULT_COLORS[n.variant];
  if (n.variant === "grass") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(n.pos.x, n.pos.y, n.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (n.variant === "tree") {
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.arc(n.pos.x + 4, n.pos.y + 4, n.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(color, -0.15);
    ctx.beginPath();
    ctx.arc(n.pos.x, n.pos.y, n.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(n.pos.x - n.size * 0.15, n.pos.y - n.size * 0.15, n.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(color, 0.25);
    ctx.beginPath();
    ctx.arc(n.pos.x - n.size * 0.35, n.pos.y - n.size * 0.35, n.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (n.variant === "bush") {
    ctx.fillStyle = shade(color, -0.1);
    ctx.beginPath();
    ctx.arc(n.pos.x - 6, n.pos.y, n.size, 0, Math.PI * 2);
    ctx.arc(n.pos.x + 6, n.pos.y, n.size, 0, Math.PI * 2);
    ctx.arc(n.pos.x, n.pos.y - 5, n.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = shade(color, 0.15);
    ctx.beginPath();
    ctx.arc(n.pos.x - 2, n.pos.y - 7, n.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (n.variant === "flower") {
    ctx.fillStyle = color;
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

function drawSign(ctx: CanvasRenderingContext2D, s: SignObj, selected: boolean) {
  ctx.save();
  ctx.translate(s.pos.x, s.pos.y);
  ctx.rotate(s.rotation);
  const colors = { street: "#2563eb", town: "#15803d", highway: "#166534" };
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
// ──────────────── Prop renderer ────────────────

function drawProp(
  ctx: CanvasRenderingContext2D,
  p: PropObj,
  selected: boolean,
  time: number,
) {
  const def = PROP_BY_ID.get(p.catalogId);
  if (!def) return;
  const color = p.color ?? def.color;
  ctx.save();
  ctx.translate(p.pos.x, p.pos.y);
  ctx.rotate(p.rotation);
  // soft ground shadow
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.beginPath();
  ctx.ellipse(2, 3, p.size * 0.8, p.size * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();
  drawShape(ctx, def.shape, p.size, color, time, p.text);
  if (selected) {
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(0, 0, p.size + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  shape: PropShape,
  s: number,
  color: string,
  time: number,
  text?: string,
) {
  // helper: vehicle body
  const carBody = (length: number, width: number, body: string, accent = "#1a1a1a") => {
    ctx.fillStyle = body;
    roundRect(ctx, -length / 2, -width / 2, length, width, width * 0.25);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    roundRect(ctx, -length / 2 + 2, -width / 2 + 1.5, length - 4, width * 0.22, 2);
    ctx.fill();
    // windshield
    ctx.fillStyle = "rgba(120,170,210,0.85)";
    roundRect(ctx, -length / 4, -width / 2 + 2, length / 5, width - 4, 2);
    ctx.fill();
    roundRect(ctx, length / 8, -width / 2 + 2, length / 5, width - 4, 2);
    ctx.fill();
    // wheels
    ctx.fillStyle = accent;
    ctx.fillRect(-length / 2 + 4, -width / 2 - 2, 6, 3);
    ctx.fillRect(-length / 2 + 4, width / 2 - 1, 6, 3);
    ctx.fillRect(length / 2 - 10, -width / 2 - 2, 6, 3);
    ctx.fillRect(length / 2 - 10, width / 2 - 1, 6, 3);
  };

  switch (shape) {
    case "sedan":
    case "taxi":
    case "policeCar":
    case "sportsCar":
    case "ambulance": {
      const len = s * 1.8, wid = s * 0.9;
      carBody(len, wid, color);
      if (shape === "taxi") {
        ctx.fillStyle = "#222";
        ctx.fillRect(-len / 2 + 4, -1, len - 8, 2);
      }
      if (shape === "policeCar") {
        ctx.fillStyle = "#3a85ff";
        ctx.fillRect(-3, -wid / 2 - 1, 3, wid + 2);
        ctx.fillStyle = "#ff3a3a";
        ctx.fillRect(0, -wid / 2 - 1, 3, wid + 2);
      }
      if (shape === "ambulance") {
        ctx.fillStyle = "#d22";
        ctx.fillRect(-2, -3, 4, 6);
        ctx.fillRect(-3, -1, 6, 2);
      }
      return;
    }
    case "suv":
    case "pickup":
    case "van": {
      const len = s * 1.7, wid = s * 1.0;
      carBody(len, wid, color);
      if (shape === "pickup") {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.fillRect(0, -wid / 2 + 2, len / 2 - 4, wid - 4);
      }
      return;
    }
    case "fireTruck": {
      const len = s * 2.2, wid = s * 1.0;
      ctx.fillStyle = color;
      roundRect(ctx, -len / 2, -wid / 2, len, wid, 3);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.fillRect(len / 2 - 8, -wid / 2 + 2, 6, wid - 4);
      ctx.fillStyle = "#ffd84a";
      ctx.fillRect(-len / 2, -1, len, 2);
      return;
    }
    case "bus":
    case "schoolBus": {
      const len = s * 2.3, wid = s * 0.85;
      ctx.fillStyle = color;
      roundRect(ctx, -len / 2, -wid / 2, len, wid, 4);
      ctx.fill();
      // windows row
      ctx.fillStyle = "rgba(120,180,220,0.85)";
      for (let i = 0; i < 6; i++) {
        ctx.fillRect(-len / 2 + 6 + i * ((len - 12) / 6), -wid / 2 + 2, (len - 12) / 6 - 2, wid * 0.35);
      }
      if (shape === "schoolBus") {
        ctx.fillStyle = "#222";
        ctx.fillRect(-len / 2, wid / 2 - 2, len, 1);
      }
      return;
    }
    case "boxTruck":
    case "trailer":
    case "tanker": {
      const len = s * 2.0, wid = s * 0.95;
      ctx.fillStyle = "#2a2a2a";
      roundRect(ctx, -len / 2, -wid / 2 - 1, len * 0.25, wid + 2, 2);
      ctx.fill();
      ctx.fillStyle = color;
      if (shape === "tanker") {
        ctx.beginPath();
        ctx.ellipse(len / 8, 0, len * 0.4, wid * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        roundRect(ctx, -len / 4, -wid / 2, len * 0.75, wid, 2);
        ctx.fill();
      }
      return;
    }
    case "pickup":
    case "foodTruck": {
      const len = s * 1.9, wid = s * 0.95;
      ctx.fillStyle = color;
      roundRect(ctx, -len / 2, -wid / 2, len, wid, 3);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(-len / 2 + 4, -wid / 2 + 2, len / 3, wid * 0.4);
      return;
    }
    case "tractor": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.6, s * 1.4, s * 1.2, 3);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.beginPath(); ctx.arc(-s * 0.5, s * 0.5, s * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.4, s * 0.4, s * 0.55, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "bike":
    case "motorcycle":
    case "scooter": {
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(-s * 0.7, 0, s * 0.4, 0, Math.PI * 2);
      ctx.moveTo(s * 0.3, 0); ctx.arc(s * 0.7, 0, s * 0.4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.4, -s * 0.2, s * 0.8, s * 0.3, 2);
      ctx.fill();
      return;
    }
    case "boat":
    case "rowboat":
    case "swanBoat": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.7, s, 0);
      ctx.quadraticCurveTo(0, s * 0.7, -s, 0);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.lineWidth = 1; ctx.stroke();
      if (shape === "swanBoat") {
        ctx.fillStyle = "#f3a83a";
        ctx.beginPath(); ctx.arc(s * 0.7, -s * 0.2, s * 0.18, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }
    case "bench":
    case "bench2": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.3, s * 2, s * 0.6, 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.fillRect(-s * 0.9, s * 0.3, 3, 4);
      ctx.fillRect(s * 0.6, s * 0.3, 3, 4);
      return;
    }
    case "picnicTable": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.6, s * 2, s * 1.2, 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(-s, -s * 0.6, s * 2, 2);
      ctx.fillRect(-s, s * 0.5, s * 2, 2);
      return;
    }
    case "outdoorTable":
    case "pingPongTable": {
      ctx.fillStyle = color;
      ctx.beginPath();
      if (shape === "pingPongTable") ctx.rect(-s, -s * 0.6, s * 2, s * 1.2);
      else ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      if (shape === "pingPongTable") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(-1, -s * 0.6, 1, s * 1.2);
      }
      return;
    }
    case "outdoorChair":
    case "loungeChair": {
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.6, -s * 0.6, s * 1.2, s * 1.2, 2);
      ctx.fill();
      return;
    }
    case "streetLamp":
    case "lampPost2":
    case "lampPost3": {
      ctx.fillStyle = color;
      ctx.fillRect(-1, -s, 2, s * 2);
      ctx.fillStyle = "#fcd76a";
      ctx.beginPath();
      ctx.arc(0, -s, 4, 0, Math.PI * 2);
      ctx.fill();
      if (shape === "lampPost2") {
        ctx.beginPath();
        ctx.arc(-6, -s + 3, 3, 0, Math.PI * 2);
        ctx.arc(6, -s + 3, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "rgba(252,215,106,0.25)";
      ctx.beginPath();
      ctx.arc(0, -s, 12, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    case "gardenLight": {
      ctx.fillStyle = color;
      ctx.fillRect(-1, -s * 0.6, 2, s * 1.2);
      ctx.fillStyle = "#fff7c0";
      ctx.beginPath(); ctx.arc(0, -s * 0.6, 2.5, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "floodLight": {
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.5, -s * 0.4, s, s * 0.8, 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,250,200,0.4)";
      ctx.beginPath();
      ctx.moveTo(s * 0.5, -s * 0.4);
      ctx.lineTo(s * 1.8, -s);
      ctx.lineTo(s * 1.8, s);
      ctx.lineTo(s * 0.5, s * 0.4);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case "neonSign":
    case "billboard": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.6, s * 2, s * 1.2, 3);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.strokeRect(-s + 3, -s * 0.6 + 3, s * 2 - 6, s * 1.2 - 6);
      if (text) {
        ctx.fillStyle = shape === "neonSign" ? "#fff" : "#1a1a1a";
        ctx.font = `bold ${Math.max(8, s * 0.32)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text.slice(0, 14), 0, 0);
      }
      return;
    }
    case "trafficCone": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.6, s * 0.5);
      ctx.lineTo(-s * 0.6, s * 0.5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(-s * 0.5, -s * 0.2, s, 2);
      return;
    }
    case "trashCan":
    case "recycleBin": {
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.5, -s * 0.6, s, s * 1.2, 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(-s * 0.5, -s * 0.6, s, 2);
      if (shape === "recycleBin") {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 6px sans-serif"; ctx.textAlign = "center";
        ctx.fillText("♻", 0, 1);
      }
      return;
    }
    case "dumpster": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.6, s * 2, s * 1.2, 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(-s, -s * 0.6, s * 2, 3);
      return;
    }
    case "mailbox": {
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.7, -s * 0.5, s * 1.4, s, s * 0.5);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillRect(-s * 0.2, -s * 0.1, s * 0.4, 2);
      return;
    }
    case "hydrant": {
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.6, -s * 0.5, s * 1.2, s, 3);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillRect(-s * 0.6, -s * 0.1, s * 1.2, 2);
      return;
    }
    case "phoneBooth":
    case "atm":
    case "vendingMachine": {
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.6, -s, s * 1.2, s * 2, 2);
      ctx.fill();
      ctx.fillStyle = "rgba(180,210,240,0.7)";
      ctx.fillRect(-s * 0.5, -s * 0.9, s, s * 1.2);
      return;
    }
    case "kiosk":
    case "busStop":
    case "foodTruck": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.7, s * 2, s * 1.4, 3);
      ctx.fill();
      ctx.fillStyle = "rgba(180,210,240,0.7)";
      ctx.fillRect(-s * 0.9, -s * 0.6, s * 1.8, s * 0.5);
      return;
    }
    case "bikeRack": {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = -2; i <= 2; i++) {
        ctx.moveTo(i * 4, -s * 0.5); ctx.lineTo(i * 4, s * 0.5);
      }
      ctx.stroke();
      return;
    }
    case "parkingMeter": {
      ctx.fillStyle = color;
      ctx.fillRect(-1, -s, 2, s * 2);
      ctx.fillStyle = "#bbb";
      ctx.beginPath(); ctx.arc(0, -s, 4, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "fountain":
    case "fountainSm": {
      // base pool
      ctx.fillStyle = "#3e7fa3";
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#cfe6f1";
      ctx.beginPath(); ctx.arc(0, 0, s * 0.85, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#9a948a";
      ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2); ctx.fill();
      // animated spray dots
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * Math.PI * 2 + time;
        const r = s * (0.3 + (Math.sin(time * 3 + i) * 0.5 + 0.5) * 0.4);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    case "statue": {
      ctx.fillStyle = "#9a948a";
      ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, -s * 0.2, s * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(-s * 0.15, -s * 0.5, s * 0.3, s * 0.4);
      return;
    }
    case "gazebo":
    case "pergola":
    case "bandstand":
    case "tent": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
      }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.stroke();
      return;
    }
    case "umbrella": {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI, true); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(-0.5, 0, 1, s * 0.6);
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        const a = -Math.PI * (i / 4);
        ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s);
        ctx.stroke();
      }
      return;
    }
    case "swingSet":
    case "monkeyBars": {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.6); ctx.lineTo(0, -s); ctx.lineTo(s, s * 0.6);
      ctx.moveTo(-s * 0.5, s * 0.6); ctx.lineTo(0, -s * 0.6); ctx.lineTo(s * 0.5, s * 0.6);
      ctx.stroke();
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(-s * 0.3, 0, s * 0.6, 2);
      return;
    }
    case "slide": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-s, s); ctx.lineTo(0, -s); ctx.lineTo(s * 0.5, -s); ctx.lineTo(-s * 0.5, s);
      ctx.closePath(); ctx.fill();
      return;
    }
    case "seesaw": {
      ctx.fillStyle = color;
      ctx.fillRect(-s, -2, s * 2, 4);
      ctx.fillStyle = "#222";
      ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "sandbox": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s, s * 2, s * 2, 2);
      ctx.fill();
      ctx.fillStyle = "#a07a4a";
      ctx.fillRect(-s, -s, s * 2, 3);
      ctx.fillRect(-s, s - 3, s * 2, 3);
      ctx.fillRect(-s, -s, 3, s * 2);
      ctx.fillRect(s - 3, -s, 3, s * 2);
      return;
    }
    case "merryGoRound": {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + time;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s); ctx.stroke();
      }
      return;
    }
    case "basketballHoop": {
      ctx.fillStyle = color;
      ctx.fillRect(-s * 0.6, -s * 0.2, s * 1.2, 3);
      ctx.fillStyle = "#e85a2a";
      ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "soccerGoal":
    case "footballGoal": {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.strokeRect(-s, -s * 0.4, s * 2, s * 0.8);
      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(-s, -s * 0.4, s * 2, s * 0.8);
      return;
    }
    case "tennisNet": {
      ctx.fillStyle = color;
      ctx.fillRect(-s, -2, s * 2, 4);
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath(); ctx.moveTo(i * (s / 5), -2); ctx.lineTo(i * (s / 5), 2); ctx.stroke();
      }
      return;
    }
    case "baseballBase": {
      ctx.fillStyle = color;
      ctx.fillRect(-s * 0.5, -s * 0.5, s, s);
      ctx.strokeStyle = "#222"; ctx.strokeRect(-s * 0.5, -s * 0.5, s, s);
      return;
    }
    case "skateRamp": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-s, s * 0.4); ctx.quadraticCurveTo(-s, -s * 0.6, 0, -s * 0.6);
      ctx.quadraticCurveTo(s, -s * 0.6, s, s * 0.4); ctx.closePath(); ctx.fill();
      return;
    }
    case "rock":
    case "boulder": {
      ctx.fillStyle = color;
      ctx.beginPath();
      const sides = 7;
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        const r = s * (0.7 + ((Math.sin(i * 9.31) + 1) / 2) * 0.4);
        const x = Math.cos(a) * r, y = Math.sin(a) * r;
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.3, s * 0.35, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "log": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.3, s * 2, s * 0.6, s * 0.3);
      ctx.fill();
      ctx.fillStyle = shade(color, -0.2);
      ctx.beginPath(); ctx.arc(-s, 0, s * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s, 0, s * 0.3, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "stump": {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      for (let i = 1; i < 4; i++) {
        ctx.beginPath(); ctx.arc(0, 0, (s / 4) * i, 0, Math.PI * 2); ctx.stroke();
      }
      return;
    }
    case "pebbles": {
      ctx.fillStyle = color;
      for (let i = 0; i < 7; i++) {
        const a = i * 1.7, r = s * 0.6;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    case "pineTree":
    case "spruceTree":
    case "christmasTree": {
      // shadow base
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath(); ctx.ellipse(3, 3, s, s * 0.6, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(color, -0.15);
      for (let i = 2; i >= 0; i--) {
        ctx.beginPath();
        ctx.moveTo(0, -s + i * s * 0.4);
        ctx.lineTo(s * (0.5 + i * 0.2), -s * 0.2 + i * s * 0.4);
        ctx.lineTo(-s * (0.5 + i * 0.2), -s * 0.2 + i * s * 0.4);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2); ctx.fill();
      if (shape === "christmasTree") {
        ctx.fillStyle = "#ff3a3a"; ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.2, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fcd34d"; ctx.beginPath(); ctx.arc(s * 0.3, 0, 2, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }
    case "oakTree":
    case "appleTree":
    case "willowTree":
    case "mapleTree":
    case "cherryTree":
    case "birchTree":
    case "topiary": {
      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath(); ctx.arc(4, 4, s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(color, -0.18);
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(-s * 0.2, -s * 0.2, s * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shade(color, 0.25);
      ctx.beginPath(); ctx.arc(-s * 0.4, -s * 0.4, s * 0.35, 0, Math.PI * 2); ctx.fill();
      if (shape === "appleTree") {
        ctx.fillStyle = "#e63a3a";
        for (let i = 0; i < 5; i++) {
          ctx.beginPath();
          ctx.arc(Math.cos(i * 1.3) * s * 0.5, Math.sin(i * 1.3) * s * 0.5, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      return;
    }
    case "palmTree": {
      ctx.fillStyle = "#7a5a3a";
      ctx.fillRect(-1.5, -s * 0.2, 3, s);
      ctx.fillStyle = color;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.save(); ctx.rotate(a);
        ctx.beginPath();
        ctx.ellipse(s * 0.5, 0, s * 0.55, s * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      return;
    }
    case "deadTree": {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.5);
      ctx.lineTo(0, -s * 0.5);
      ctx.moveTo(0, -s * 0.2); ctx.lineTo(-s * 0.6, -s * 0.8);
      ctx.moveTo(0, -s * 0.2); ctx.lineTo(s * 0.6, -s * 0.7);
      ctx.moveTo(0, 0); ctx.lineTo(s * 0.4, -s * 0.3);
      ctx.stroke();
      return;
    }
    case "hedge": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.5, s * 2, s, s * 0.5);
      ctx.fill();
      ctx.fillStyle = shade(color, 0.15);
      ctx.beginPath(); ctx.arc(-s * 0.5, -s * 0.2, s * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.2, s * 0.3, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "rose":
    case "tulip":
    case "sunflower":
    case "daisy":
    case "lavender":
    case "lily":
    case "poppy":
    case "iris":
    case "violets":
    case "marigold":
    case "orchid":
    case "dandelion":
    case "hydrangea": {
      ctx.fillStyle = color;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5, s * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = "#fcd76a";
      ctx.beginPath(); ctx.arc(0, 0, s * 0.3, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "cactus": {
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.3, -s, s * 0.6, s * 2, s * 0.3);
      ctx.fill();
      roundRect(ctx, -s * 0.8, -s * 0.2, s * 0.5, s * 0.8, s * 0.25);
      ctx.fill();
      return;
    }
    case "haystack": {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = shade(color, -0.25);
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.arc(0, 0, s - i * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      return;
    }
    case "scarecrow": {
      ctx.fillStyle = "#7a5a3a";
      ctx.fillRect(-1, -s, 2, s * 2);
      ctx.fillRect(-s * 0.6, -s * 0.4, s * 1.2, 2);
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, -s, s * 0.35, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "barrel": {
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.5, -s * 0.6, s, s * 1.2, 3);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.4)";
      ctx.strokeRect(-s * 0.5, -s * 0.3, s, 1);
      ctx.strokeRect(-s * 0.5, s * 0.2, s, 1);
      return;
    }
    case "well": {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#1c2a3a";
      ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "#7a5a3a"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, -s, s * 0.4, 0, Math.PI, true); ctx.stroke();
      return;
    }
    case "windmill":
    case "windTurbine": {
      ctx.fillStyle = color;
      ctx.fillRect(-2, -s * 0.5, 4, s * 1.5);
      ctx.fillStyle = "#888";
      ctx.beginPath(); ctx.arc(0, -s * 0.5, 2, 0, Math.PI * 2); ctx.fill();
      ctx.save();
      ctx.translate(0, -s * 0.5);
      ctx.rotate(time * 1.2);
      ctx.fillStyle = shade(color, -0.2);
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.rotate((i / 3) * Math.PI * 2);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(s * 0.8, -2); ctx.lineTo(s * 0.8, 2);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      return;
    }
    case "silo": {
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.5, -s, s, s * 2, s * 0.5);
      ctx.fill();
      ctx.fillStyle = "#888";
      ctx.beginPath(); ctx.arc(0, -s, s * 0.5, Math.PI, 0); ctx.fill();
      return;
    }
    case "barn": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.6, s * 2, s * 1.2, 3);
      ctx.fill();
      ctx.fillStyle = "#3a2a22";
      ctx.fillRect(-s * 0.2, 0, s * 0.4, s * 0.6);
      ctx.strokeStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(-s, -s * 0.6); ctx.lineTo(0, -s); ctx.lineTo(s, -s * 0.6);
      ctx.stroke();
      return;
    }
    case "chickenCoop": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.5, s * 2, s, 2);
      ctx.fill();
      ctx.fillStyle = "#8a3a2a";
      ctx.beginPath();
      ctx.moveTo(-s, -s * 0.5); ctx.lineTo(0, -s); ctx.lineTo(s, -s * 0.5);
      ctx.closePath(); ctx.fill();
      return;
    }
    case "pumpkin": {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(0, 0, s * 0.3, s, i * 0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#3a5a2a";
      ctx.fillRect(-1, -s - 2, 2, 4);
      return;
    }
    case "sandcastle": {
      ctx.fillStyle = color;
      ctx.fillRect(-s, 0, s * 2, s * 0.6);
      ctx.fillRect(-s, -s * 0.2, s * 0.4, s * 0.6);
      ctx.fillRect(s * 0.6 - s * 0.4, -s * 0.2, s * 0.4, s * 0.6);
      ctx.fillRect(-s * 0.2, -s * 0.4, s * 0.4, s * 0.6);
      return;
    }
    case "beachChair": {
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.6, -s * 0.6, s * 1.2, s, 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.fillRect(-s * 0.6, -s * 0.6, s * 1.2, 2);
      return;
    }
    case "surfboard": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.3, s * 2, s * 0.6, s * 0.3);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.3)"; ctx.beginPath();
      ctx.moveTo(-s + 4, 0); ctx.lineTo(s - 4, 0); ctx.stroke();
      return;
    }
    case "beachTowel": {
      ctx.fillStyle = color;
      ctx.fillRect(-s, -s * 0.6, s * 2, s * 1.2);
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * (s / 3), -s * 0.6); ctx.lineTo(i * (s / 3), s * 0.6);
        ctx.stroke();
      }
      return;
    }
    case "lifebuoy":
    case "buoy": {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = color;
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * s * 0.7, Math.sin(a) * s * 0.7, s * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    case "anchor": {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -s * 0.5, s * 0.25, 0, Math.PI * 2);
      ctx.moveTo(0, -s * 0.25); ctx.lineTo(0, s * 0.5);
      ctx.moveTo(-s * 0.5, s * 0.5); ctx.quadraticCurveTo(0, s, s * 0.5, s * 0.5);
      ctx.stroke();
      return;
    }
    case "lighthouse": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(-s * 0.4, s); ctx.lineTo(s * 0.4, s); ctx.lineTo(s * 0.2, -s); ctx.lineTo(-s * 0.2, -s);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#c83a2a";
      ctx.fillRect(-s * 0.3, -s * 0.4, s * 0.6, s * 0.2);
      ctx.fillStyle = "#fcd34d";
      ctx.beginPath(); ctx.arc(0, -s + 4, 4, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "dock": {
      ctx.fillStyle = color;
      ctx.fillRect(-s, -s * 0.4, s * 2, s * 0.8);
      ctx.fillStyle = shade(color, -0.25);
      for (let i = -s; i < s; i += 6) {
        ctx.fillRect(i, -s * 0.4, 1, s * 0.8);
      }
      return;
    }
    case "crate":
    case "pallet": {
      ctx.fillStyle = color;
      ctx.fillRect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2);
      ctx.strokeStyle = shade(color, -0.3);
      ctx.strokeRect(-s * 0.6, -s * 0.6, s * 1.2, s * 1.2);
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, -s * 0.6); ctx.lineTo(s * 0.6, s * 0.6);
      ctx.moveTo(s * 0.6, -s * 0.6); ctx.lineTo(-s * 0.6, s * 0.6);
      ctx.stroke();
      return;
    }
    case "constructionSign":
    case "barricade": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.3, s * 2, s * 0.6, 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      for (let i = 0; i < 5; i++) {
        ctx.fillRect(-s + i * (s / 2.5), -s * 0.3, 4, s * 0.6);
      }
      return;
    }
    case "scaffold": {
      ctx.strokeStyle = color; ctx.lineWidth = 1.5;
      ctx.strokeRect(-s, -s, s * 2, s * 2);
      ctx.beginPath();
      ctx.moveTo(-s, 0); ctx.lineTo(s, 0);
      ctx.moveTo(0, -s); ctx.lineTo(0, s);
      ctx.stroke();
      return;
    }
    case "portaPotty": {
      ctx.fillStyle = color;
      roundRect(ctx, -s * 0.5, -s, s, s * 2, 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(-s * 0.4, -s * 0.4, s * 0.8, 2);
      return;
    }
    case "fence":
    case "chainLink":
    case "ironGate":
    case "lowWall":
    case "brickWall": {
      ctx.fillStyle = color;
      ctx.fillRect(-s, -s * 0.2, s * 2, s * 0.4);
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      for (let i = -s; i <= s; i += 6) {
        ctx.beginPath(); ctx.moveTo(i, -s * 0.3); ctx.lineTo(i, s * 0.3); ctx.stroke();
      }
      return;
    }
    case "flagpole": {
      ctx.fillStyle = "#888";
      ctx.fillRect(-1, -s, 2, s * 2);
      ctx.fillStyle = color;
      const wave = Math.sin(time * 4) * 1.5;
      ctx.beginPath();
      ctx.moveTo(1, -s);
      ctx.lineTo(s * 1.1 + wave, -s * 0.8);
      ctx.lineTo(s * 1.1 + wave, -s * 0.4);
      ctx.lineTo(1, -s * 0.5);
      ctx.closePath(); ctx.fill();
      return;
    }
    case "antenna":
    case "satelliteDish": {
      ctx.fillStyle = color;
      ctx.fillRect(-1, -s, 2, s * 2);
      if (shape === "satelliteDish") {
        ctx.beginPath(); ctx.arc(0, -s * 0.5, s * 0.6, 0, Math.PI, true); ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s); ctx.lineTo(s * 0.3, -s);
        ctx.stroke();
      }
      return;
    }
    case "solarPanel": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.7, s * 2, s * 1.4, 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(160,200,240,0.5)";
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath(); ctx.moveTo(i * (s / 3), -s * 0.7); ctx.lineTo(i * (s / 3), s * 0.7); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke();
      return;
    }
    case "pool":
    case "hotTub": {
      ctx.fillStyle = "#cfc6b8";
      roundRect(ctx, -s, -s * 0.7, s * 2, s * 1.4, 4);
      ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, -s + 4, -s * 0.7 + 4, s * 2 - 8, s * 1.4 - 8, 3);
      ctx.fill();
      // animated shimmer
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        const y = -s * 0.4 + (i * s * 0.4) + Math.sin(time * 2 + i) * 2;
        ctx.moveTo(-s + 6, y); ctx.lineTo(s - 6, y); ctx.stroke();
      }
      return;
    }
    case "trampoline": {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#4a3a2a";
      ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "grill":
    case "firePit": {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shape === "firePit" ? "#e8602a" : "#4a3a2a";
      ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, Math.PI * 2); ctx.fill();
      if (shape === "firePit") {
        ctx.fillStyle = "#fcd34d";
        const flick = (Math.sin(time * 8) + 1) / 2;
        ctx.beginPath();
        ctx.arc(0, -2, s * 0.3 * (0.7 + flick * 0.3), 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    case "snowman": {
      ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.arc(0, s * 0.3, s * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, -s * 0.4, s * 0.5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath(); ctx.arc(-s * 0.15, -s * 0.45, 1, 0, Math.PI * 2);
      ctx.arc(s * 0.15, -s * 0.45, 1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#e87a2a";
      ctx.fillRect(0, -s * 0.4, 3, 1);
      return;
    }
    case "iglooSm": {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath(); ctx.arc(0, 0, s * 0.3, Math.PI, 0); ctx.closePath(); ctx.fill();
      return;
    }
    case "ghostDecor": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, s, Math.PI, 0);
      ctx.lineTo(s, s * 0.6);
      ctx.quadraticCurveTo(s * 0.5, s * 0.4, 0, s * 0.6);
      ctx.quadraticCurveTo(-s * 0.5, s * 0.4, -s, s * 0.6);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.1, 1.5, 0, Math.PI * 2);
      ctx.arc(s * 0.3, -s * 0.1, 1.5, 0, Math.PI * 2); ctx.fill();
      return;
    }
    case "lantern":
    case "torch": {
      ctx.fillStyle = "#7a4a2a";
      ctx.fillRect(-1, -s * 0.2, 2, s);
      ctx.fillStyle = color;
      if (shape === "lantern") {
        roundRect(ctx, -s * 0.4, -s * 0.6, s * 0.8, s * 0.8, 2);
        ctx.fill();
      } else {
        const flick = Math.sin(time * 9) * 0.2 + 1;
        ctx.beginPath();
        ctx.ellipse(0, -s * 0.6, s * 0.25 * flick, s * 0.4 * flick, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    case "skyscraper":
    case "skyscraperGlass":
    case "officeTower":
    case "condoTower":
    case "skyscraperArt": {
      // Top-down: square footprint with rooftop details and window pattern
      ctx.fillStyle = shade(color, -0.25);
      roundRect(ctx, -s, -s, s * 2, s * 2, 4);
      ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, -s + 4, -s + 4, s * 2 - 8, s * 2 - 8, 3);
      ctx.fill();
      // window grid
      const cols = 6, rows = 6;
      const cw = (s * 2 - 16) / cols, rh = (s * 2 - 16) / rows;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const lit = ((r * 13 + c * 7) % 5) > 1;
          ctx.fillStyle = lit ? "rgba(220,235,255,0.85)" : "rgba(40,55,75,0.6)";
          ctx.fillRect(-s + 10 + c * cw, -s + 10 + r * rh, cw - 2, rh - 2);
        }
      }
      // rooftop
      if (shape === "skyscraperArt") {
        ctx.fillStyle = shade(color, 0.15);
        ctx.beginPath();
        ctx.moveTo(-s * 0.3, -s * 0.3);
        ctx.lineTo(s * 0.3, -s * 0.3);
        ctx.lineTo(0, -s * 0.8);
        ctx.closePath(); ctx.fill();
      } else if (shape === "officeTower" || shape === "skyscraper") {
        ctx.fillStyle = "#3a3a3a";
        roundRect(ctx, -s * 0.3, -s * 0.3, s * 0.6, s * 0.6, 2); ctx.fill();
        ctx.fillStyle = "#c83a3a";
        ctx.fillRect(-1, -s * 0.3, 2, s * 0.6);
      }
      return;
    }
    case "stadium":
    case "arena":
    case "footballStadium":
    case "baseballStadium": {
      // outer stand ring
      ctx.fillStyle = shade(color, -0.2);
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.75, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.9, s * 0.65, 0, 0, Math.PI * 2);
      ctx.fill();
      // field
      ctx.fillStyle = shape === "baseballStadium" ? "#b48a4a" : "#2f7a3a";
      if (shape === "baseballStadium") {
        ctx.beginPath();
        ctx.moveTo(0, s * 0.5);
        ctx.lineTo(-s * 0.6, -s * 0.2);
        ctx.lineTo(0, -s * 0.5);
        ctx.lineTo(s * 0.6, -s * 0.2);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#2f7a3a";
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2);
        ctx.fill();
      } else {
        roundRect(ctx, -s * 0.65, -s * 0.4, s * 1.3, s * 0.8, 4);
        ctx.fill();
        // midfield line
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.4); ctx.lineTo(0, s * 0.4);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
        ctx.stroke();
      }
      return;
    }
    case "tennisCourt": {
      ctx.fillStyle = "#3a7a4a";
      roundRect(ctx, -s, -s * 0.6, s * 2, s * 1.2, 4); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
      ctx.strokeRect(-s + 8, -s * 0.6 + 8, s * 2 - 16, s * 1.2 - 16);
      ctx.beginPath(); ctx.moveTo(0, -s * 0.6 + 8); ctx.lineTo(0, s * 0.6 - 8); ctx.stroke();
      return;
    }
    case "basketballCourt": {
      ctx.fillStyle = color;
      roundRect(ctx, -s, -s * 0.6, s * 2, s * 1.2, 3); ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
      ctx.strokeRect(-s + 4, -s * 0.6 + 4, s * 2 - 8, s * 1.2 - 8);
      ctx.beginPath(); ctx.arc(0, 0, s * 0.25, 0, Math.PI * 2); ctx.stroke();
      return;
    }
    case "soccerField": {
      ctx.fillStyle = "#2f7a3a";
      roundRect(ctx, -s, -s * 0.6, s * 2, s * 1.2, 4); ctx.fill();
      ctx.fillStyle = "#3a8a44";
      for (let i = 0; i < 8; i++) {
        if (i % 2 === 0) ctx.fillRect(-s + (i * (s / 4)), -s * 0.6, s / 4, s * 1.2);
      }
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5;
      ctx.strokeRect(-s + 6, -s * 0.6 + 6, s * 2 - 12, s * 1.2 - 12);
      ctx.beginPath(); ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -s * 0.6 + 6); ctx.lineTo(0, s * 0.6 - 6); ctx.stroke();
      return;
    }
    case "trackField": {
      ctx.fillStyle = "#a85a4a";
      ctx.beginPath();
      ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2f7a3a";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.78, s * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.88, s * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();
      return;
    }
    case "iceRink": {
      ctx.fillStyle = "#9ac8e8";
      roundRect(ctx, -s, -s * 0.6, s * 2, s * 1.2, s * 0.5); ctx.fill();
      ctx.fillStyle = "#cfe6f1";
      roundRect(ctx, -s + 4, -s * 0.6 + 4, s * 2 - 8, s * 1.2 - 8, s * 0.4); ctx.fill();
      ctx.strokeStyle = "#c83a3a"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.5); ctx.lineTo(0, s * 0.5); ctx.stroke();
      return;
    }
    case "school":
    case "hospital":
    case "museum":
    case "bank":
    case "hotel":
    case "mall":
    case "warehouse":
    case "factory": {
      ctx.fillStyle = shade(color, -0.2);
      roundRect(ctx, -s, -s * 0.75, s * 2, s * 1.5, 4); ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, -s + 4, -s * 0.75 + 4, s * 2 - 8, s * 1.5 - 8, 3); ctx.fill();
      // window rows
      ctx.fillStyle = "rgba(220,235,255,0.85)";
      for (let y = -s * 0.55; y < s * 0.55; y += 8) {
        for (let x = -s + 12; x < s - 12; x += 10) {
          ctx.fillRect(x, y, 6, 4);
        }
      }
      // door
      ctx.fillStyle = "#3a2a1a";
      ctx.fillRect(-4, s * 0.55, 8, s * 0.2);
      if (shape === "hospital") {
        ctx.fillStyle = "#c83a3a";
        ctx.fillRect(-2, -s * 0.4, 4, 12);
        ctx.fillRect(-6, -s * 0.4 + 4, 12, 4);
      } else if (shape === "factory") {
        ctx.fillStyle = "#6a6a6a";
        ctx.beginPath();
        ctx.arc(s * 0.6, -s * 0.6, s * 0.18, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(180,180,180,0.6)";
        ctx.beginPath();
        ctx.ellipse(s * 0.6, -s * 0.8, s * 0.25, s * 0.12, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    case "church":
    case "mosque": {
      ctx.fillStyle = shade(color, -0.2);
      roundRect(ctx, -s, -s * 0.6, s * 2, s * 1.2, 4); ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, -s + 4, -s * 0.6 + 4, s * 2 - 8, s * 1.2 - 8, 3); ctx.fill();
      // dome / spire
      ctx.fillStyle = shade(color, -0.35);
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = shape === "church" ? "#c8b06a" : "#5aa86a";
      if (shape === "church") {
        ctx.fillRect(-1, -s * 0.6, 2, s * 0.4);
        ctx.fillRect(-4, -s * 0.55, 8, 2);
      } else {
        ctx.fillRect(-1, -s * 0.6, 2, s * 0.3);
        ctx.beginPath();
        ctx.arc(0, -s * 0.6, 3, 0, Math.PI * 2); ctx.fill();
      }
      return;
    }
    case "gasStation": {
      ctx.fillStyle = "#3a3a3a";
      roundRect(ctx, -s, -s * 0.6, s * 2, s * 1.2, 3); ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, -s + 6, -s * 0.6 + 6, s * 2 - 12, s * 1.2 - 12, 2); ctx.fill();
      // pumps
      ctx.fillStyle = "#c83a3a";
      ctx.fillRect(-s * 0.5, -s * 0.1, 6, 10);
      ctx.fillRect(s * 0.3, -s * 0.1, 6, 10);
      ctx.fillStyle = "#fcd34d";
      ctx.fillRect(-s + 10, s * 0.4, 12, 4);
      return;
    }
    case "helicopter": {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.7, s * 0.4, 0, 0, Math.PI * 2); ctx.fill();
      // tail
      ctx.fillRect(s * 0.5, -2, s * 0.9, 4);
      ctx.fillStyle = "#3a3a3a";
      ctx.fillRect(s * 1.3, -6, 2, 12);
      // rotor (spinning)
      const a = time * 30;
      ctx.strokeStyle = "rgba(80,80,80,0.6)"; ctx.lineWidth = 2;
      ctx.save(); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke();
      ctx.restore();
      return;
    }
    case "limousine": {
      const len = s * 2.4, wid = s * 0.85;
      ctx.fillStyle = color;
      roundRect(ctx, -len / 2, -wid / 2, len, wid, wid * 0.25); ctx.fill();
      ctx.fillStyle = "rgba(120,170,210,0.7)";
      roundRect(ctx, -len / 4, -wid / 2 + 2, len / 2, wid - 4, 2); ctx.fill();
      ctx.fillStyle = "#1a1a1a";
      for (const x of [-len / 2 + 4, -4, len / 2 - 10]) {
        ctx.fillRect(x, -wid / 2 - 2, 6, 3);
        ctx.fillRect(x, wid / 2 - 1, 6, 3);
      }
      return;
    }
    case "convertible":
    case "hatchback":
    case "minivan": {
      const len = s * 1.7, wid = s * 0.9;
      ctx.fillStyle = color;
      roundRect(ctx, -len / 2, -wid / 2, len, wid, wid * 0.3); ctx.fill();
      if (shape !== "convertible") {
        ctx.fillStyle = "rgba(120,170,210,0.8)";
        roundRect(ctx, -len / 3, -wid / 2 + 2, len / 1.5, wid - 4, 2); ctx.fill();
      } else {
        ctx.fillStyle = "rgba(80,50,30,0.55)";
        roundRect(ctx, -len / 3, -wid / 2 + 2, len / 3, wid - 4, 2); ctx.fill();
      }
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(-len / 2 + 4, -wid / 2 - 2, 6, 3);
      ctx.fillRect(-len / 2 + 4, wid / 2 - 1, 6, 3);
      ctx.fillRect(len / 2 - 10, -wid / 2 - 2, 6, 3);
      ctx.fillRect(len / 2 - 10, wid / 2 - 1, 6, 3);
      return;
    }
    case "garbageTruck":
    case "cementMixer":
    case "snowplow":
    case "rv": {
      const len = s * 2.0, wid = s * 1.0;
      ctx.fillStyle = color;
      roundRect(ctx, -len / 2, -wid / 2, len, wid, 3); ctx.fill();
      ctx.fillStyle = "rgba(120,170,210,0.7)";
      roundRect(ctx, -len / 2 + 2, -wid / 2 + 2, len / 4, wid - 4, 2); ctx.fill();
      if (shape === "cementMixer") {
        ctx.fillStyle = shade(color, -0.3);
        ctx.beginPath(); ctx.arc(len / 4, 0, wid * 0.5, 0, Math.PI * 2); ctx.fill();
      } else if (shape === "snowplow") {
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-len / 2 - 6, -wid / 2 - 4);
        ctx.lineTo(-len / 2, -wid / 2);
        ctx.lineTo(-len / 2, wid / 2);
        ctx.lineTo(-len / 2 - 6, wid / 2 + 4);
        ctx.closePath(); ctx.fill();
      } else if (shape === "garbageTruck") {
        ctx.fillStyle = shade(color, -0.25);
        roundRect(ctx, -len / 8, -wid / 2 + 2, len / 1.8, wid - 4, 2); ctx.fill();
      }
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(-len / 2 + 4, -wid / 2 - 2, 8, 3);
      ctx.fillRect(-len / 2 + 4, wid / 2 - 1, 8, 3);
      ctx.fillRect(len / 2 - 12, -wid / 2 - 2, 8, 3);
      ctx.fillRect(len / 2 - 12, wid / 2 - 1, 8, 3);
      return;
    }
    case "billboardLg": {
      // posts
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(-s * 0.6, s * 0.3, 4, s * 0.5);
      ctx.fillRect(s * 0.6 - 4, s * 0.3, 4, s * 0.5);
      // panel
      ctx.fillStyle = shade(color, -0.25);
      roundRect(ctx, -s, -s * 0.7, s * 2, s, 3); ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, -s + 4, -s * 0.7 + 4, s * 2 - 8, s - 8, 2); ctx.fill();
      if (text) {
        ctx.fillStyle = isDark(color) ? "#fff" : "#1a1a1a";
        ctx.font = `bold ${Math.max(10, s * 0.34)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(text.slice(0, 18), 0, -s * 0.2);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.25)";
        ctx.font = `italic ${Math.max(9, s * 0.3)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Your Ad Here", 0, -s * 0.2);
      }
      return;
    }
    case "marqueeSign":
    case "shopSign": {
      ctx.fillStyle = shade(color, -0.3);
      roundRect(ctx, -s, -s * 0.4, s * 2, s * 0.8, 4); ctx.fill();
      ctx.fillStyle = color;
      roundRect(ctx, -s + 3, -s * 0.4 + 3, s * 2 - 6, s * 0.8 - 6, 3); ctx.fill();
      // bulb edge
      ctx.fillStyle = "#fcd34d";
      for (let i = -s + 6; i < s - 4; i += 8) {
        ctx.beginPath(); ctx.arc(i, -s * 0.4 + 1, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(i, s * 0.4 - 1, 1.5, 0, Math.PI * 2); ctx.fill();
      }
      if (text) {
        ctx.fillStyle = isDark(color) ? "#fff" : "#222";
        ctx.font = `bold ${Math.max(8, s * 0.32)}px serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(text.slice(0, 14), 0, 0);
      }
      return;
    }
    case "directionSign":
    case "trafficSign":
    case "speedSign":
    case "milestoneSign": {
      ctx.fillStyle = "#5a5a5a";
      ctx.fillRect(-1, 0, 2, s * 0.8);
      if (shape === "trafficSign") {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.7);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, s * 0.2);
        ctx.lineTo(-s * 0.6, 0);
        ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = color;
        roundRect(ctx, -s * 0.7, -s * 0.7, s * 1.4, s * 0.8, 2); ctx.fill();
        ctx.strokeStyle = "#222"; ctx.strokeRect(-s * 0.7, -s * 0.7, s * 1.4, s * 0.8);
      }
      if (text) {
        ctx.fillStyle = isDark(color) ? "#fff" : "#222";
        ctx.font = `bold ${Math.max(8, s * 0.5)}px sans-serif`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(text.slice(0, 8), 0, -s * 0.3);
      }
      return;
    }
    case "carShadow":
    default: {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function isDark(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 < 128;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
