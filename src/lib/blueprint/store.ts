import { create } from "zustand";
import type {
  AnyObject,
  CityState,
  RoadSegment,
  SaveSlot,
  Vec2,
} from "./types";
import { emptyCity } from "./types";

const SLOTS_KEY = "blueprint:slots:v1";

export function loadSlots(): SaveSlot[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SLOTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SaveSlot[];
  } catch {
    return [];
  }
}

export function persistSlots(slots: SaveSlot[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SLOTS_KEY, JSON.stringify(slots));
}

export function upsertSlot(slot: SaveSlot) {
  const all = loadSlots();
  const i = all.findIndex((s) => s.id === slot.id);
  if (i >= 0) all[i] = slot;
  else all.push(slot);
  persistSlots(all);
}

export function deleteSlot(id: string) {
  persistSlots(loadSlots().filter((s) => s.id !== id));
}

export function createSlot(townName: string): SaveSlot {
  const slot: SaveSlot = {
    id: crypto.randomUUID(),
    townName,
    updatedAt: Date.now(),
    state: emptyCity(),
  };
  upsertSlot(slot);
  return slot;
}

export type Tool =
  | { kind: "build"; sub: "road" | "building" | "nature" | "water" | "sign" | "forest"; variant?: string }
  | { kind: "move" }
  | { kind: "delete" };

export type Camera = { x: number; y: number; zoom: number };

type GameStore = {
  slotId: string | null;
  townName: string;
  city: CityState;
  tool: Tool;
  camera: Camera;
  selectedId: string | null;
  snapToGrid: boolean;
  mapOpen: boolean;
  hydrate: (slot: SaveSlot) => void;
  setTool: (t: Tool) => void;
  setCamera: (c: Partial<Camera>) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (factor: number, cx: number, cy: number) => void;
  addObject: (o: AnyObject) => void;
  updateObject: (id: string, patch: Partial<AnyObject>) => void;
  deleteObject: (id: string) => void;
  select: (id: string | null) => void;
  setSnap: (v: boolean) => void;
  setTime: (t: number) => void;
  setWeather: (w: CityState["weather"]) => void;
  setMapOpen: (v: boolean) => void;
  save: () => void;
};

export const useGame = create<GameStore>((set, get) => ({
  slotId: null,
  townName: "",
  city: emptyCity(),
  tool: { kind: "build", sub: "road" },
  camera: { x: 0, y: 0, zoom: 1 },
  selectedId: null,
  snapToGrid: true,
  mapOpen: false,
  hydrate: (slot) =>
    set({
      slotId: slot.id,
      townName: slot.townName,
      city: slot.state,
      camera: { x: 0, y: 0, zoom: 1 },
      selectedId: null,
    }),
  setTool: (tool) => set({ tool, selectedId: null }),
  setCamera: (c) => set((s) => ({ camera: { ...s.camera, ...c } })),
  panBy: (dx, dy) =>
    set((s) => ({ camera: { ...s.camera, x: s.camera.x + dx, y: s.camera.y + dy } })),
  zoomAt: (factor, cx, cy) =>
    set((s) => {
      const z = Math.max(0.25, Math.min(3, s.camera.zoom * factor));
      const k = z / s.camera.zoom;
      return {
        camera: {
          zoom: z,
          x: cx - (cx - s.camera.x) * k,
          y: cy - (cy - s.camera.y) * k,
        },
      };
    }),
  addObject: (o) => {
    set((s) => ({ city: { ...s.city, objects: [...s.city.objects, o] } }));
    get().save();
  },
  updateObject: (id, patch) => {
    set((s) => ({
      city: {
        ...s.city,
        objects: s.city.objects.map((o) =>
          o.id === id ? ({ ...o, ...patch } as AnyObject) : o,
        ),
      },
    }));
    get().save();
  },
  deleteObject: (id) => {
    set((s) => ({
      city: { ...s.city, objects: s.city.objects.filter((o) => o.id !== id) },
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
    get().save();
  },
  select: (id) => set({ selectedId: id }),
  setSnap: (v) => set({ snapToGrid: v }),
  setTime: (t) => {
    set((s) => ({ city: { ...s.city, timeOfDay: t } }));
    get().save();
  },
  setWeather: (w) => {
    set((s) => ({ city: { ...s.city, weather: w } }));
    get().save();
  },
  setMapOpen: (v) => set({ mapOpen: v }),
  save: () => {
    const { slotId, townName, city } = get();
    if (!slotId) return;
    upsertSlot({ id: slotId, townName, state: city, updatedAt: Date.now() });
  },
}));

// helpers
export const newId = () => crypto.randomUUID();

export const screenToWorld = (sx: number, sy: number, cam: Camera): Vec2 => ({
  x: (sx - cam.x) / cam.zoom,
  y: (sy - cam.y) / cam.zoom,
});

export const snap = (v: number, grid = 20) => Math.round(v / grid) * grid;

export const snapAngle = (rad: number) => {
  const step = Math.PI / 12; // 15deg
  return Math.round(rad / step) * step;
};

export const snapRoadEndpoint = (
  p: Vec2,
  segments: RoadSegment[],
  threshold = 24,
): Vec2 => {
  let best = p;
  let bestD = threshold;
  for (const s of segments) {
    for (const e of [s.a, s.b]) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
  }
  return best;
};