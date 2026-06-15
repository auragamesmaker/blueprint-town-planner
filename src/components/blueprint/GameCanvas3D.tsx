import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Sky, Cloud, Clouds, Environment } from "@react-three/drei";
import * as THREE from "three";
import { newId, snap, snapRoadEndpoint, useGame } from "@/lib/blueprint/store";
import type {
  AnyObject,
  Building,
  BuildingKind,
  NatureKind,
  NatureObj,
  PropObj,
  RoadSegment,
  SignKind,
  SignObj,
  Vec2,
  WaterKind,
  WaterObj,
} from "@/lib/blueprint/types";
import { PROP_CATALOG, type PropDef } from "@/lib/blueprint/catalog";

const PROP_BY_ID = new Map<string, PropDef>(PROP_CATALOG.map((p) => [p.id, p]));

// Map 2D (x,y) world coords to 3D (x, 0, y).
const v3 = (p: Vec2, y = 0) => new THREE.Vector3(p.x, y, p.y);

const BUILDING_HEIGHT: Record<BuildingKind, number> = {
  house: 28,
  apartment: 80,
  "town-office": 50,
  "town-hall": 70,
  store: 32,
  library: 38,
  restaurant: 30,
};

const BUILDING_SIZES: Record<BuildingKind, Vec2> = {
  house: { x: 90, y: 110 },
  apartment: { x: 130, y: 170 },
  "town-office": { x: 150, y: 130 },
  "town-hall": { x: 200, y: 150 },
  store: { x: 140, y: 110 },
  library: { x: 160, y: 120 },
  restaurant: { x: 130, y: 110 },
};

const BUILDING_COLORS: Record<BuildingKind, string> = {
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

const NATURE_DEFAULT_COLORS: Record<NatureKind, string> = {
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

/* ─────────────── Root component ─────────────── */

export function GameCanvas3D() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="absolute inset-0 bg-[#9bbf8a]" />;

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ position: [600, 600, 600], fov: 45, near: 1, far: 8000 }}
        onCreated={(s) => {
          (window as any).__bp_three = { camera: s.camera, gl: s.gl, scene: s.scene };
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <Overlay3D />
    </div>
  );
}

/* ─────────────── Scene ─────────────── */

function Scene() {
  const objects = useGame((s) => s.city.objects);
  const timeOfDay = useGame((s) => s.city.timeOfDay);

  // Day/night lighting tuned by timeOfDay 0-24
  const sun = useMemo(() => {
    const t = ((timeOfDay - 6) / 12) * Math.PI; // 6am→6pm sweep
    const x = Math.cos(t) * 1200;
    const y = Math.max(80, Math.sin(t) * 1400);
    return new THREE.Vector3(x, y, 600);
  }, [timeOfDay]);

  const nightFactor = timeOfDay < 6 || timeOfDay > 19 ? 0.25 : 1;

  return (
    <>
      <color attach="background" args={[nightFactor < 0.5 ? "#0a1530" : "#cfe5f6"]} />
      <fog attach="fog" args={[nightFactor < 0.5 ? "#0a1530" : "#cfe5f6", 1500, 6000]} />

      <hemisphereLight args={["#cfe7ff", "#3a5a3a", 0.5 * nightFactor]} />
      <ambientLight intensity={0.25 * nightFactor} />
      <directionalLight
        position={sun.toArray()}
        intensity={1.4 * nightFactor}
        color={nightFactor < 0.5 ? "#7a8fbf" : "#fff4d6"}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-1200}
        shadow-camera-right={1200}
        shadow-camera-top={1200}
        shadow-camera-bottom={-1200}
        shadow-camera-near={1}
        shadow-camera-far={3000}
        shadow-bias={-0.0005}
      />

      {nightFactor > 0.5 && <Sky sunPosition={sun.toArray()} turbidity={6} rayleigh={1.4} mieCoefficient={0.005} />}

      {nightFactor > 0.5 && (
        <Clouds material={THREE.MeshLambertMaterial} limit={6}>
          <Cloud seed={1} segments={8} bounds={[400, 60, 400]} volume={80} position={[200, 700, -300]} color="#ffffff" opacity={0.55} />
          <Cloud seed={2} segments={8} bounds={[400, 60, 400]} volume={80} position={[-600, 600, 400]} color="#ffffff" opacity={0.45} />
        </Clouds>
      )}

      <Ground />
      <CameraControls />
      <PlacementCursor />

      {objects.map((o) => (
        <ObjectRouter key={o.id} obj={o} />
      ))}
    </>
  );
}

/* ─────────────── Camera ─────────────── */

function CameraControls() {
  const tool = useGame((s) => s.tool);
  // Disable orbit when actively placing (left button) so it doesn't fight raycasts.
  const enabled = tool.kind !== "build";
  return (
    <OrbitControls
      enabled
      enableDamping
      dampingFactor={0.08}
      maxPolarAngle={Math.PI * 0.49}
      minDistance={80}
      maxDistance={3000}
      mouseButtons={{
        LEFT: enabled ? THREE.MOUSE.PAN : undefined,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      }}
      target={[0, 0, 0]}
    />
  );
}

/* ─────────────── Ground (raycast surface) ─────────────── */

function Ground() {
  const game = useGame();
  const [hover, setHover] = useState<Vec2 | null>(null);

  const tex = useMemo(() => {
    // Procedural grass tile — generated once.
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#7fb172";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5000; i++) {
      const v = Math.random();
      g.fillStyle = `rgba(${90 + v * 60 | 0}, ${140 + v * 70 | 0}, ${70 + v * 50 | 0}, ${0.3 + v * 0.4})`;
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      g.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(60, 60);
    t.anisotropy = 8;
    return t;
  }, []);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    if (game.tool.kind !== "build") return;
    const p = { x: e.point.x, y: e.point.z };
    placeFromBuildTool(p);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (game.tool.kind !== "build") return setHover(null);
    setHover({ x: e.point.x, y: e.point.z });
  };

  // expose hover globally for cursor preview
  useFrame(() => {
    (window as any).__bp_hover = hover;
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHover(null)}
    >
      <planeGeometry args={[10000, 10000]} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  );
}

function placeFromBuildTool(world: Vec2) {
  const game = useGame.getState();
  const t = game.tool;
  if (t.kind !== "build") return;
  const sub = t.sub;

  if (sub === "road") {
    // simple: track start in window
    const startKey = "__bp_roadStart";
    const start = (window as any)[startKey] as Vec2 | undefined;
    const roads = game.city.objects.filter((o): o is RoadSegment => o.kind === "road");
    const p = game.snapToGrid ? { x: snap(world.x), y: snap(world.y) } : world;
    const snapped = snapRoadEndpoint(p, roads);
    if (!start) {
      (window as any)[startKey] = snapped;
      return;
    }
    const dist = Math.hypot(snapped.x - start.x, snapped.y - start.y);
    if (dist > 10) {
      game.addObject({
        id: newId(),
        kind: "road",
        a: start,
        b: snapped,
        width: 26,
        sidewalks: true,
        crosswalk: false,
        parking: false,
        trafficLight: false,
        stopSign: false,
      });
    }
    (window as any)[startKey] = null;
    return;
  }
  if (sub === "building") {
    const variant = (t.variant ?? "house") as BuildingKind;
    const size = BUILDING_SIZES[variant];
    const pos = game.snapToGrid ? { x: snap(world.x), y: snap(world.y) } : world;
    game.addObject({ id: newId(), kind: "building", variant, pos, size, rotation: 0, snap: game.snapToGrid } as Building);
    return;
  }
  if (sub === "nature") {
    const variant = (t.variant ?? "tree") as NatureKind;
    game.addObject({
      id: newId(),
      kind: "nature",
      variant,
      pos: world,
      size: NATURE_SIZES[variant],
      rotation: Math.random() * Math.PI * 2,
    } as NatureObj);
    return;
  }
  if (sub === "forest") {
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
    return;
  }
  if (sub === "water") {
    const variant = (t.variant ?? "pond") as WaterKind;
    if (variant === "pond" || variant === "lake") {
      const r = variant === "pond" ? 60 : 140;
      const pts: Vec2[] = [];
      const sides = variant === "pond" ? 14 : 20;
      for (let i = 0; i < sides; i++) {
        const a = (i / sides) * Math.PI * 2;
        const rr = r * (0.85 + Math.random() * 0.25);
        pts.push({ x: world.x + Math.cos(a) * rr, y: world.y + Math.sin(a) * rr });
      }
      game.addObject({ id: newId(), kind: "water", variant, points: pts } as WaterObj);
    } else {
      // river: 4-point spline starting at click
      const pts: Vec2[] = [];
      for (let i = 0; i < 4; i++) {
        pts.push({ x: world.x + i * 80, y: world.y + Math.sin(i) * 30 });
      }
      game.addObject({ id: newId(), kind: "water", variant: "river", points: pts } as WaterObj);
    }
    return;
  }
  if (sub === "sign") {
    const variant = (t.variant ?? "street") as SignKind;
    const s: SignObj = {
      id: newId(),
      kind: "sign",
      variant,
      pos: world,
      text: variant === "street" ? "Main St" : variant === "town" ? "Welcome" : "Hwy 1",
      rotation: 0,
    };
    game.addObject(s);
    return;
  }
  if (sub === "prop") {
    const id = t.variant;
    if (!id) return;
    const def = PROP_BY_ID.get(id);
    if (!def) return;
    game.addObject({
      id: newId(),
      kind: "prop",
      catalogId: def.id,
      pos: world,
      size: def.size,
      rotation: 0,
      color: def.color,
    } as PropObj);
  }
}

/* ─────────────── Placement cursor preview ─────────────── */

function PlacementCursor() {
  const tool = useGame((s) => s.tool);
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const h = (window as any).__bp_hover as Vec2 | null;
    if (!ref.current) return;
    if (!h || tool.kind !== "build") {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    ref.current.position.set(h.x, 0.5, h.y);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[12, 16, 32]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
    </mesh>
  );
}

/* ─────────────── Object router ─────────────── */

function ObjectRouter({ obj }: { obj: AnyObject }) {
  switch (obj.kind) {
    case "building":
      return <Building3D obj={obj} />;
    case "nature":
      return <Nature3D obj={obj} />;
    case "water":
      return <Water3D obj={obj} />;
    case "road":
      return <Road3D obj={obj} />;
    case "sign":
      return <Sign3D obj={obj} />;
    case "prop":
      return <Prop3D obj={obj} />;
    case "roadDecal":
      return <RoadDecal3D obj={obj} />;
  }
}

function useSelectableHandlers(id: string) {
  const game = useGame();
  return {
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (game.tool.kind === "delete") {
        game.deleteObject(id);
      } else {
        game.select(id);
      }
    },
    onPointerDown: (e: ThreeEvent<PointerEvent>) => {
      if (game.tool.kind === "move" && e.button === 0) {
        e.stopPropagation();
        (window as any).__bp_dragId = id;
      }
    },
  };
}

/* ─────────────── Building ─────────────── */

function Building3D({ obj }: { obj: Building }) {
  const selected = useGame((s) => s.selectedId === obj.id);
  const h = useSelectableHandlers(obj.id);
  const height = BUILDING_HEIGHT[obj.variant];
  const color = obj.color ?? BUILDING_COLORS[obj.variant];
  const roof = ROOF_COLORS[obj.variant];
  const sx = obj.size.x;
  const sz = obj.size.y;
  const isHouse = obj.variant === "house" || obj.variant === "restaurant";
  return (
    <group position={[obj.pos.x, 0, obj.pos.y]} rotation={[0, -obj.rotation, 0]} {...h}>
      {/* Body */}
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[sx, height, sz]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Roof */}
      {isHouse ? (
        <mesh position={[0, height + Math.min(sx, sz) * 0.25, 0]} rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[Math.max(sx, sz) * 0.6, Math.min(sx, sz) * 0.5, 4]} />
          <meshStandardMaterial color={roof} roughness={0.8} />
        </mesh>
      ) : (
        <mesh position={[0, height + 2, 0]} castShadow>
          <boxGeometry args={[sx + 4, 4, sz + 4]} />
          <meshStandardMaterial color={roof} roughness={0.8} />
        </mesh>
      )}
      {/* Windows strip — emissive at night */}
      <WindowStrips width={sx} depth={sz} height={height} />
      {selected && <SelectionRing radius={Math.max(sx, sz) * 0.7} />}
    </group>
  );
}

function WindowStrips({ width, depth, height }: { width: number; depth: number; height: number }) {
  const timeOfDay = useGame((s) => s.city.timeOfDay);
  const isNight = timeOfDay < 6 || timeOfDay > 19;
  const rows = Math.max(1, Math.floor(height / 14));
  const cols = Math.max(1, Math.floor(width / 14));
  const items = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = -width / 2 + (c + 0.5) * (width / cols);
      const y = 6 + r * 14;
      const lit = isNight && Math.random() > 0.4;
      items.push(
        <mesh key={`f-${r}-${c}`} position={[x, y, depth / 2 + 0.1]}>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial
            color={lit ? "#ffe9a8" : "#2a3a4a"}
            emissive={lit ? "#ffd070" : "#000"}
            emissiveIntensity={lit ? 1.5 : 0}
          />
        </mesh>,
        <mesh key={`b-${r}-${c}`} position={[x, y, -depth / 2 - 0.1]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[8, 8]} />
          <meshStandardMaterial
            color={lit ? "#ffe9a8" : "#2a3a4a"}
            emissive={lit ? "#ffd070" : "#000"}
            emissiveIntensity={lit ? 1.5 : 0}
          />
        </mesh>,
      );
    }
  }
  return <>{items}</>;
}

/* ─────────────── Nature ─────────────── */

function Nature3D({ obj }: { obj: NatureObj }) {
  const selected = useGame((s) => s.selectedId === obj.id);
  const h = useSelectableHandlers(obj.id);
  const color = obj.color ?? NATURE_DEFAULT_COLORS[obj.variant];
  return (
    <group position={[obj.pos.x, 0, obj.pos.y]} rotation={[0, obj.rotation, 0]} {...h}>
      {obj.variant === "tree" && <Tree color={color} size={obj.size} />}
      {obj.variant === "bush" && (
        <mesh position={[0, obj.size * 0.5, 0]} castShadow>
          <sphereGeometry args={[obj.size * 0.7, 12, 10]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      )}
      {obj.variant === "flower" && (
        <>
          <mesh position={[0, obj.size * 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, obj.size * 0.8]} />
            <meshStandardMaterial color="#3a7a3a" />
          </mesh>
          <mesh position={[0, obj.size, 0]} castShadow>
            <sphereGeometry args={[obj.size * 0.4, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        </>
      )}
      {obj.variant === "grass" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.2, 0]} receiveShadow>
          <circleGeometry args={[obj.size, 24]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      )}
      {selected && <SelectionRing radius={obj.size + 6} />}
    </group>
  );
}

function Tree({ color, size }: { color: string; size: number }) {
  return (
    <>
      <mesh position={[0, size * 0.5, 0]} castShadow>
        <cylinderGeometry args={[size * 0.12, size * 0.16, size]} />
        <meshStandardMaterial color="#5a3a1f" roughness={0.95} />
      </mesh>
      <mesh position={[0, size * 1.3, 0]} castShadow>
        <sphereGeometry args={[size * 0.7, 14, 12]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[size * 0.2, size * 1.6, size * 0.1]} castShadow>
        <sphereGeometry args={[size * 0.5, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </>
  );
}

/* ─────────────── Water ─────────────── */

function Water3D({ obj }: { obj: WaterObj }) {
  const selected = useGame((s) => s.selectedId === obj.id);
  const h = useSelectableHandlers(obj.id);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame(({ clock }) => {
    if (matRef.current) {
      // shimmer via subtle clearcoat oscillation
      matRef.current.clearcoatRoughness = 0.05 + Math.sin(clock.elapsedTime * 0.8) * 0.04;
    }
  });

  const geom = useMemo(() => {
    const shape = new THREE.Shape();
    if (obj.variant === "river") {
      // build a thick polyline ribbon
      const pts = obj.points;
      if (pts.length < 2) return null;
      const width = 40;
      const left: THREE.Vector2[] = [];
      const right: THREE.Vector2[] = [];
      for (let i = 0; i < pts.length; i++) {
        const prev = pts[Math.max(0, i - 1)];
        const next = pts[Math.min(pts.length - 1, i + 1)];
        const dx = next.x - prev.x;
        const dy = next.y - prev.y;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len;
        const ny = dx / len;
        left.push(new THREE.Vector2(pts[i].x + nx * width, pts[i].y + ny * width));
        right.push(new THREE.Vector2(pts[i].x - nx * width, pts[i].y - ny * width));
      }
      shape.moveTo(left[0].x, left[0].y);
      for (let i = 1; i < left.length; i++) shape.lineTo(left[i].x, left[i].y);
      for (let i = right.length - 1; i >= 0; i--) shape.lineTo(right[i].x, right[i].y);
      shape.closePath();
    } else {
      shape.moveTo(obj.points[0].x, obj.points[0].y);
      for (let i = 1; i < obj.points.length; i++) shape.lineTo(obj.points[i].x, obj.points[i].y);
      shape.closePath();
    }
    return new THREE.ShapeGeometry(shape);
  }, [obj]);

  if (!geom) return null;

  return (
    <group {...h}>
      <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.5, 0]} receiveShadow>
        <meshPhysicalMaterial
          ref={matRef}
          color="#2c6fa8"
          metalness={0.2}
          roughness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.05}
          transmission={0.4}
          thickness={1}
        />
      </mesh>
      {selected && (
        <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.6, 0]}>
          <meshBasicMaterial color="#ffffff" wireframe />
        </mesh>
      )}
    </group>
  );
}

/* ─────────────── Road ─────────────── */

function Road3D({ obj }: { obj: RoadSegment }) {
  const selected = useGame((s) => s.selectedId === obj.id);
  const h = useSelectableHandlers(obj.id);
  const dx = obj.b.x - obj.a.x;
  const dz = obj.b.y - obj.a.y;
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(dz, dx);
  const cx = (obj.a.x + obj.b.x) / 2;
  const cz = (obj.a.y + obj.b.y) / 2;

  // dashed lane marking count
  const dashCount = Math.max(1, Math.floor(len / 30));

  return (
    <group position={[cx, 0.05, cz]} rotation={[0, -angle, 0]} {...h}>
      {obj.sidewalks && (
        <mesh receiveShadow>
          <boxGeometry args={[len, 0.6, obj.width + 12]} />
          <meshStandardMaterial color="#bcbcbc" roughness={0.95} />
        </mesh>
      )}
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[len, 0.6, obj.width]} />
        <meshStandardMaterial color="#2a2a2c" roughness={0.85} />
      </mesh>
      {/* center dashes */}
      {Array.from({ length: dashCount }).map((_, i) => (
        <mesh
          key={i}
          position={[-len / 2 + (i + 0.5) * (len / dashCount), 0.5, 0]}
        >
          <boxGeometry args={[(len / dashCount) * 0.5, 0.1, 1]} />
          <meshStandardMaterial color="#f4e26a" emissive="#9a7a10" emissiveIntensity={0.2} />
        </mesh>
      ))}
      {selected && <SelectionRing radius={len * 0.5 + 10} />}
    </group>
  );
}

/* ─────────────── Sign ─────────────── */

function Sign3D({ obj }: { obj: SignObj }) {
  const selected = useGame((s) => s.selectedId === obj.id);
  const h = useSelectableHandlers(obj.id);
  const color = obj.variant === "highway" ? "#2f7a3a" : obj.variant === "town" ? "#7a4a2a" : "#3a5fbf";
  return (
    <group position={[obj.pos.x, 0, obj.pos.y]} rotation={[0, -obj.rotation, 0]} {...h}>
      <mesh position={[0, 12, 0]} castShadow>
        <cylinderGeometry args={[0.8, 0.8, 24]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 22, 0]} castShadow>
        <boxGeometry args={[40, 10, 1.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {selected && <SelectionRing radius={26} />}
    </group>
  );
}

/* ─────────────── Road Decal ─────────────── */

function RoadDecal3D({ obj }: { obj: import("@/lib/blueprint/types").RoadDecal }) {
  const road = useGame((s) =>
    s.city.objects.find((o) => o.id === obj.roadId && o.kind === "road"),
  ) as RoadSegment | undefined;
  if (!road) return null;
  const p = {
    x: road.a.x + (road.b.x - road.a.x) * obj.t,
    y: road.a.y + (road.b.y - road.a.y) * obj.t,
  };
  const h = useSelectableHandlers(obj.id);
  return (
    <group position={[p.x, 0.5, p.y]} {...h}>
      {obj.variant === "crosswalk" && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[30, 20]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      )}
      {obj.variant === "trafficLight" && (
        <>
          <mesh position={[0, 15, 0]}>
            <cylinderGeometry args={[0.6, 0.6, 30]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 28, 0]}>
            <boxGeometry args={[6, 14, 4]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, 32, 2.2]}>
            <sphereGeometry args={[1.6, 12, 10]} />
            <meshStandardMaterial color="#ff2a2a" emissive="#ff2a2a" emissiveIntensity={1.4} />
          </mesh>
        </>
      )}
      {obj.variant === "stopSign" && (
        <>
          <mesh position={[0, 10, 0]}>
            <cylinderGeometry args={[0.4, 0.4, 20]} />
            <meshStandardMaterial color="#888" />
          </mesh>
          <mesh position={[0, 18, 0]} rotation={[0, 0, Math.PI / 8]}>
            <cylinderGeometry args={[6, 6, 1, 8]} />
            <meshStandardMaterial color="#c8211a" emissive="#3a0808" emissiveIntensity={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
}

/* ─────────────── Selection ring helper ─────────────── */

function SelectionRing({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.3, 0]}>
      <ringGeometry args={[radius, radius + 3, 48]} />
      <meshBasicMaterial color="#3aa0ff" transparent opacity={0.9} />
    </mesh>
  );
}

/* ─────────────── Prop (catalog dispatch) ─────────────── */

function Prop3D({ obj }: { obj: PropObj }) {
  const def = PROP_BY_ID.get(obj.catalogId);
  const selected = useGame((s) => s.selectedId === obj.id);
  const h = useSelectableHandlers(obj.id);
  if (!def) return null;
  const color = obj.color ?? def.color;
  return (
    <group position={[obj.pos.x, 0, obj.pos.y]} rotation={[0, obj.rotation, 0]} {...h}>
      <PropMesh shape={def.shape} color={color} size={obj.size} />
      {selected && <SelectionRing radius={obj.size + 6} />}
    </group>
  );
}

function PropMesh({ shape, color, size }: { shape: string; color: string; size: number }) {
  // Group similar shapes into archetypes for high-quality procedural rendering.
  switch (shape) {
    case "sedan":
    case "taxi":
    case "policeCar":
    case "hatchback":
    case "convertible":
      return <Car color={color} size={size} cabin={0.55} roof={0.35} />;
    case "suv":
    case "minivan":
    case "limousine":
      return <Car color={color} size={size * 1.05} cabin={0.7} roof={0.5} length={1.15} />;
    case "sportsCar":
      return <Car color={color} size={size} cabin={0.45} roof={0.2} length={0.95} />;
    case "pickup":
      return <Car color={color} size={size} cabin={0.5} roof={0.4} bed />;
    case "bus":
    case "schoolBus":
    case "rv":
      return <Truck color={color} size={size} length={2.2} height={0.55} windows />;
    case "boxTruck":
    case "van":
    case "garbageTruck":
    case "snowplow":
    case "ambulance":
      return <Truck color={color} size={size} length={1.6} height={0.6} />;
    case "fireTruck":
    case "tanker":
    case "cementMixer":
    case "foodTruck":
      return <Truck color={color} size={size} length={1.8} height={0.55} />;
    case "trailer":
      return <Truck color={color} size={size} length={2.5} height={0.45} flat />;
    case "tractor":
      return <Truck color={color} size={size} length={1.2} height={0.6} />;
    case "bike":
    case "motorcycle":
    case "scooter":
      return <Bike color={color} size={size} />;
    case "boat":
    case "rowboat":
    case "swanBoat":
      return <Boat color={color} size={size} />;
    case "helicopter":
      return <Helicopter color={color} size={size} />;

    case "pineTree":
    case "spruceTree":
    case "christmasTree":
      return <Conifer color={color} size={size} />;
    case "oakTree":
    case "appleTree":
    case "mapleTree":
    case "birchTree":
    case "willowTree":
    case "cherryTree":
      return <Broadleaf color={color} size={size} />;
    case "palmTree":
      return <Palm color={color} size={size} />;
    case "deadTree":
      return <DeadTree size={size} />;
    case "topiary":
    case "hedge":
      return (
        <mesh position={[0, size * 0.4, 0]} castShadow>
          <boxGeometry args={[size * 0.9, size * 0.8, size * 0.9]} />
          <meshStandardMaterial color={color} roughness={0.95} />
        </mesh>
      );
    case "stump":
      return (
        <mesh position={[0, size * 0.3, 0]} castShadow>
          <cylinderGeometry args={[size * 0.5, size * 0.55, size * 0.6]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      );
    case "log":
      return (
        <mesh position={[0, size * 0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[size * 0.3, size * 0.3, size * 1.8]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      );
    case "rose":
    case "tulip":
    case "sunflower":
    case "daisy":
    case "lavender":
    case "lily":
    case "poppy":
    case "iris":
    case "hydrangea":
    case "marigold":
    case "orchid":
    case "violets":
    case "dandelion":
    case "cactus":
      return <FlowerCluster color={color} size={size} />;

    case "rock":
      return (
        <mesh position={[0, size * 0.4, 0]} castShadow>
          <dodecahedronGeometry args={[size * 0.6]} />
          <meshStandardMaterial color={color} roughness={1} flatShading />
        </mesh>
      );
    case "boulder":
      return (
        <mesh position={[0, size * 0.45, 0]} castShadow>
          <dodecahedronGeometry args={[size * 0.8, 1]} />
          <meshStandardMaterial color={color} roughness={1} flatShading />
        </mesh>
      );
    case "pebbles":
      return (
        <group>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[Math.cos(i) * size * 0.4, 1, Math.sin(i * 1.7) * size * 0.4]} castShadow>
              <sphereGeometry args={[size * 0.18, 8, 6]} />
              <meshStandardMaterial color={color} roughness={1} />
            </mesh>
          ))}
        </group>
      );

    case "skyscraper":
    case "skyscraperGlass":
    case "officeTower":
    case "condoTower":
    case "skyscraperArt":
      return <Skyscraper color={color} size={size} variant={shape} />;

    case "stadium":
    case "arena":
    case "footballStadium":
    case "baseballStadium":
      return <Stadium color={color} size={size} />;
    case "tennisCourt":
      return <Court color="#3a7a4a" lineColor="#fff" size={size} ratio={2} />;
    case "basketballCourt":
      return <Court color="#a85a3a" lineColor="#fff" size={size} ratio={1.7} />;
    case "soccerField":
      return <Court color="#2f7a3a" lineColor="#fff" size={size} ratio={1.5} />;
    case "trackField":
      return <Court color="#a85a4a" lineColor="#fff" size={size} ratio={1.4} />;
    case "iceRink":
      return <Court color="#cfe6f1" lineColor="#88a" size={size} ratio={1.8} />;

    case "school":
    case "hospital":
    case "museum":
    case "mall":
    case "hotel":
    case "bank":
    case "factory":
    case "warehouse":
    case "gasStation":
      return <CivicBuilding color={color} size={size} variant={shape} />;
    case "church":
    case "mosque":
      return <Church color={color} size={size} />;
    case "barn":
      return <Barn color={color} size={size} />;
    case "chickenCoop":
      return <Barn color={color} size={size * 0.7} />;
    case "silo":
      return (
        <group>
          <mesh position={[0, size * 1.2, 0]} castShadow>
            <cylinderGeometry args={[size * 0.4, size * 0.4, size * 2.4]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, size * 2.5, 0]} castShadow>
            <coneGeometry args={[size * 0.4, size * 0.4, 16]} />
            <meshStandardMaterial color="#7a7a7a" />
          </mesh>
        </group>
      );
    case "windmill":
      return <Windmill color={color} size={size} />;
    case "windTurbine":
      return <WindTurbine color={color} size={size} />;
    case "lighthouse":
      return <Lighthouse color={color} size={size} />;
    case "well":
      return (
        <group>
          <mesh position={[0, size * 0.3, 0]} castShadow>
            <cylinderGeometry args={[size * 0.5, size * 0.5, size * 0.6, 16]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
          <mesh position={[0, size * 0.9, 0]} castShadow>
            <boxGeometry args={[size * 1.2, size * 0.05, 0.5]} />
            <meshStandardMaterial color="#5a3a1f" />
          </mesh>
        </group>
      );

    case "streetLamp":
    case "lampPost2":
    case "lampPost3":
      return <StreetLamp color={color} size={size} />;
    case "gardenLight":
    case "torch":
    case "lantern":
      return (
        <group>
          <mesh position={[0, size * 0.6, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, size * 1.2]} />
            <meshStandardMaterial color="#3a3a3a" />
          </mesh>
          <mesh position={[0, size * 1.3, 0]}>
            <sphereGeometry args={[size * 0.3, 10, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
          </mesh>
        </group>
      );
    case "floodLight":
      return (
        <group>
          <mesh position={[0, size * 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, size * 1.4]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, size * 1.5, 1]} rotation={[Math.PI / 6, 0, 0]} castShadow>
            <boxGeometry args={[size * 0.5, size * 0.4, size * 0.3]} />
            <meshStandardMaterial color="#aaa" />
          </mesh>
        </group>
      );

    case "bench":
    case "bench2":
      return <Bench color={color} size={size} />;
    case "picnicTable":
      return (
        <group>
          <mesh position={[0, size * 0.4, 0]} castShadow>
            <boxGeometry args={[size * 1.4, 1.5, size * 0.7]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, size * 0.2, size * 0.5]} castShadow>
            <boxGeometry args={[size * 1.4, 1.5, size * 0.3]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, size * 0.2, -size * 0.5]} castShadow>
            <boxGeometry args={[size * 1.4, 1.5, size * 0.3]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case "outdoorTable":
    case "pingPongTable":
      return (
        <group>
          <mesh position={[0, size * 0.5, 0]} castShadow>
            <boxGeometry args={[size * 1.2, 1, size * 0.8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case "outdoorChair":
    case "loungeChair":
      return (
        <group>
          <mesh position={[0, size * 0.3, 0]} castShadow>
            <boxGeometry args={[size * 0.8, 1, size * 0.8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case "beachChair":
    case "beachTowel":
    case "surfboard":
      return (
        <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
          <planeGeometry args={[size * 1.5, size * 0.8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      );

    case "trashCan":
    case "recycleBin":
    case "barrel":
    case "vendingMachine":
      return (
        <mesh position={[0, size * 0.7, 0]} castShadow>
          <cylinderGeometry args={[size * 0.45, size * 0.45, size * 1.4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "dumpster":
      return (
        <mesh position={[0, size * 0.5, 0]} castShadow>
          <boxGeometry args={[size * 1.4, size, size * 0.9]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "mailbox":
    case "phoneBooth":
    case "atm":
    case "kiosk":
    case "parkingMeter":
    case "portaPotty":
      return (
        <mesh position={[0, size * 0.9, 0]} castShadow>
          <boxGeometry args={[size * 0.7, size * 1.8, size * 0.7]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "hydrant":
      return (
        <group>
          <mesh position={[0, size * 0.5, 0]} castShadow>
            <cylinderGeometry args={[size * 0.35, size * 0.4, size]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, size * 1.05, 0]} castShadow>
            <sphereGeometry args={[size * 0.4, 10, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case "busStop":
      return (
        <group>
          <mesh position={[0, size * 1.1, -size * 0.3]} castShadow>
            <boxGeometry args={[size * 1.6, size * 2.2, 1]} />
            <meshStandardMaterial color={color} transparent opacity={0.6} />
          </mesh>
          <mesh position={[0, size * 2.3, 0]} castShadow>
            <boxGeometry args={[size * 1.8, 1, size * 0.8]} />
            <meshStandardMaterial color="#222" />
          </mesh>
        </group>
      );
    case "bikeRack":
      return (
        <mesh position={[0, size * 0.4, 0]} castShadow>
          <torusGeometry args={[size * 0.6, 0.5, 6, 12, Math.PI]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "trafficCone":
      return (
        <mesh position={[0, size * 0.6, 0]} castShadow>
          <coneGeometry args={[size * 0.4, size * 1.2, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );

    case "fountain":
    case "fountainSm": {
      const s = shape === "fountain" ? size : size * 0.7;
      return <Fountain color={color} size={s} />;
    }
    case "statue":
      return (
        <group>
          <mesh position={[0, size * 0.3, 0]} castShadow>
            <boxGeometry args={[size, size * 0.6, size]} />
            <meshStandardMaterial color="#888" />
          </mesh>
          <mesh position={[0, size * 1.1, 0]} castShadow>
            <cylinderGeometry args={[size * 0.3, size * 0.4, size]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, size * 1.85, 0]} castShadow>
            <sphereGeometry args={[size * 0.3, 12, 10]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case "gazebo":
    case "bandstand":
      return (
        <group>
          <mesh position={[0, size * 1, 0]} castShadow>
            <cylinderGeometry args={[size, size, size * 0.1, 6]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, size * 1.5, 0]} castShadow>
            <coneGeometry args={[size * 1.1, size * 0.8, 6]} />
            <meshStandardMaterial color="#7a3a2e" />
          </mesh>
        </group>
      );
    case "pergola":
    case "tent":
      return (
        <group>
          <mesh position={[0, size * 0.8, 0]} castShadow>
            <coneGeometry args={[size, size * 1.4, 4]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case "umbrella":
      return (
        <group>
          <mesh position={[0, size, 0]} castShadow>
            <coneGeometry args={[size, size * 0.6, 12, 1, true]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, size * 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.4, 0.4, size]} />
            <meshStandardMaterial color="#444" />
          </mesh>
        </group>
      );

    case "swingSet":
    case "monkeyBars":
      return (
        <group>
          <mesh position={[0, size, 0]} castShadow>
            <boxGeometry args={[size * 2, 1, 1]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[-size, size * 0.5, 0]} castShadow>
            <boxGeometry args={[1, size, 1]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[size, size * 0.5, 0]} castShadow>
            <boxGeometry args={[1, size, 1]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case "slide":
      return (
        <mesh position={[0, size * 0.5, 0]} rotation={[Math.PI / 6, 0, 0]} castShadow>
          <boxGeometry args={[size * 0.5, 1, size * 1.5]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "seesaw":
      return (
        <mesh position={[0, size * 0.3, 0]} castShadow>
          <boxGeometry args={[size * 2, 1.5, size * 0.3]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "sandbox":
      return (
        <mesh position={[0, 2, 0]} castShadow>
          <boxGeometry args={[size * 2, 4, size * 2]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "merryGoRound":
      return (
        <mesh position={[0, size * 0.4, 0]} castShadow>
          <cylinderGeometry args={[size, size, size * 0.3, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "trampoline":
      return (
        <mesh position={[0, size * 0.3, 0]} castShadow>
          <cylinderGeometry args={[size, size, size * 0.2, 24]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "grill":
      return (
        <mesh position={[0, size * 0.5, 0]} castShadow>
          <boxGeometry args={[size, size, size * 0.7]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "firePit":
      return (
        <group>
          <mesh position={[0, size * 0.2, 0]} castShadow>
            <cylinderGeometry args={[size * 0.7, size * 0.8, size * 0.4, 16]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, size * 0.6, 0]}>
            <coneGeometry args={[size * 0.4, size * 0.8, 12]} />
            <meshStandardMaterial color="#f4842a" emissive="#ff5a1a" emissiveIntensity={1.2} />
          </mesh>
        </group>
      );
    case "pool":
    case "hotTub":
      return (
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[size * 1.6, 2, size * 1.1]} />
          <meshStandardMaterial color="#2c6fa8" metalness={0.4} roughness={0.2} />
        </mesh>
      );

    case "basketballHoop":
    case "soccerGoal":
    case "tennisNet":
    case "footballGoal":
      return (
        <mesh position={[0, size * 0.6, 0]} castShadow>
          <boxGeometry args={[size * 1.4, size * 1.2, 1]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "baseballBase":
      return (
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[size, 1, size]} />
          <meshStandardMaterial color="#fff" />
        </mesh>
      );
    case "skateRamp":
      return (
        <mesh position={[0, size * 0.4, 0]} rotation={[Math.PI / 8, 0, 0]} castShadow>
          <boxGeometry args={[size * 1.4, 2, size * 1.2]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );

    case "haystack":
      return (
        <mesh position={[0, size * 0.5, 0]} castShadow>
          <cylinderGeometry args={[size * 0.7, size * 0.7, size, 12]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      );
    case "scarecrow":
      return (
        <group>
          <mesh position={[0, size * 0.7, 0]} castShadow>
            <boxGeometry args={[2, size * 1.4, 2]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0, size * 1.5, 0]} castShadow>
            <sphereGeometry args={[size * 0.3, 10, 8]} />
            <meshStandardMaterial color="#d8c060" />
          </mesh>
        </group>
      );
    case "pumpkin":
      return (
        <mesh position={[0, size * 0.5, 0]} castShadow>
            <sphereGeometry args={[size * 0.6, 16, 12]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      );

    case "billboard":
    case "billboardLg":
    case "marqueeSign":
    case "shopSign":
    case "directionSign":
    case "milestoneSign":
    case "trafficSign":
    case "speedSign":
    case "constructionSign":
      return (
        <group>
          <mesh position={[0, size * 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.6, 0.6, size * 1.4]} />
            <meshStandardMaterial color="#444" />
          </mesh>
          <mesh position={[0, size * 1.5, 0]} castShadow>
            <boxGeometry args={[size * 1.6, size * 0.8, 1.5]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case "neonSign":
      return (
        <mesh position={[0, size * 0.7, 0]} castShadow>
          <boxGeometry args={[size * 1.6, size * 0.6, 1]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.8} />
        </mesh>
      );
    case "flagpole":
      return (
        <group>
          <mesh position={[0, size * 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, size * 2.4]} />
            <meshStandardMaterial color="#aaa" />
          </mesh>
          <mesh position={[size * 0.5, size * 2, 0]} castShadow>
            <planeGeometry args={[size, size * 0.6]} />
            <meshStandardMaterial color={color} side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    case "antenna":
    case "satelliteDish":
      return (
        <group>
          <mesh position={[0, size * 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, size * 1.4]} />
            <meshStandardMaterial color="#888" />
          </mesh>
          <mesh position={[0, size * 1.5, 0]} castShadow>
            <sphereGeometry args={[size * 0.3, 10, 8, 0, Math.PI]} />
            <meshStandardMaterial color="#ccc" side={THREE.DoubleSide} />
          </mesh>
        </group>
      );
    case "solarPanel":
      return (
        <mesh position={[0, size * 0.4, 0]} rotation={[Math.PI / 6, 0, 0]} castShadow>
          <boxGeometry args={[size * 1.4, 1, size * 0.9]} />
          <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
        </mesh>
      );
    case "crate":
    case "pallet":
      return (
        <mesh position={[0, size * 0.3, 0]} castShadow>
          <boxGeometry args={[size * 0.9, size * 0.6, size * 0.9]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      );
    case "barricade":
    case "scaffold":
      return (
        <mesh position={[0, size * 0.4, 0]} castShadow>
          <boxGeometry args={[size * 1.5, size * 0.8, 1.5]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "fence":
    case "brickWall":
    case "lowWall":
    case "chainLink":
    case "ironGate":
      return (
        <mesh position={[0, size * 0.4, 0]} castShadow>
          <boxGeometry args={[size * 1.6, size * 0.8, 1.2]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      );

    case "snowman":
      return (
        <group>
          <mesh position={[0, size * 0.4, 0]} castShadow>
            <sphereGeometry args={[size * 0.5, 14, 12]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <mesh position={[0, size * 1, 0]} castShadow>
            <sphereGeometry args={[size * 0.4, 14, 12]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
          <mesh position={[0, size * 1.5, 0]} castShadow>
            <sphereGeometry args={[size * 0.3, 14, 12]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        </group>
      );
    case "iglooSm":
      return (
        <mesh position={[0, size * 0.4, 0]} castShadow>
          <sphereGeometry args={[size * 0.8, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "ghostDecor":
      return (
        <mesh position={[0, size * 0.7, 0]} castShadow>
          <capsuleGeometry args={[size * 0.4, size * 0.6, 8, 16]} />
          <meshStandardMaterial color={color} transparent opacity={0.85} />
        </mesh>
      );

    case "sandcastle":
      return (
        <group>
          <mesh position={[0, size * 0.4, 0]} castShadow>
            <boxGeometry args={[size, size * 0.8, size]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[size * 0.45, size, size * 0.45]} castShadow>
            <cylinderGeometry args={[size * 0.2, size * 0.2, size * 0.4]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </group>
      );
    case "lifebuoy":
    case "buoy":
      return (
        <mesh position={[0, size * 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <torusGeometry args={[size * 0.4, size * 0.15, 8, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
    case "anchor":
      return (
        <mesh position={[0, size * 0.4, 0]} castShadow>
          <boxGeometry args={[size * 0.3, size * 0.8, size * 0.3]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.4} />
        </mesh>
      );
    case "dock":
      return (
        <mesh position={[0, 1, 0]} castShadow>
          <boxGeometry args={[size * 2, 2, size * 0.7]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      );

    default:
      return (
        <mesh position={[0, size * 0.3, 0]} castShadow>
          <boxGeometry args={[size * 0.8, size * 0.6, size * 0.8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      );
  }
}

/* ─────────────── Procedural archetypes ─────────────── */

function Car({
  color,
  size,
  cabin = 0.55,
  roof = 0.35,
  length = 1,
  bed = false,
}: {
  color: string;
  size: number;
  cabin?: number;
  roof?: number;
  length?: number;
  bed?: boolean;
}) {
  const L = size * 2 * length;
  const W = size * 0.9;
  const H = size * 0.45;
  return (
    <group>
      {/* body */}
      <mesh position={[0, H * 0.5 + 1, 0]} castShadow>
        <boxGeometry args={[L, H, W]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* cabin */}
      <mesh position={[bed ? -L * 0.15 : 0, H + size * 0.18, 0]} castShadow>
        <boxGeometry args={[L * cabin, size * 0.4, W * 0.85]} />
        <meshStandardMaterial color="#1a2030" metalness={0.4} roughness={0.2} transparent opacity={0.85} />
      </mesh>
      {/* roof */}
      <mesh position={[bed ? -L * 0.15 : 0, H + size * 0.42, 0]} castShadow>
        <boxGeometry args={[L * roof, size * 0.08, W * 0.85]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.35} />
      </mesh>
      {/* wheels */}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}-${sz}`}
            position={[sx * L * 0.35, size * 0.18, sz * W * 0.45]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[size * 0.18, size * 0.18, size * 0.18, 14]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        )),
      )}
    </group>
  );
}

function Truck({
  color,
  size,
  length = 2,
  height = 0.6,
  windows = false,
  flat = false,
}: {
  color: string;
  size: number;
  length?: number;
  height?: number;
  windows?: boolean;
  flat?: boolean;
}) {
  const L = size * length;
  const W = size * 0.95;
  const H = size * height;
  return (
    <group>
      <mesh position={[0, H * 0.5 + 2, 0]} castShadow>
        <boxGeometry args={[L, H, W]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>
      {!flat && (
        <mesh position={[-L * 0.35, H * 0.5 + size * 0.2 + 2, 0]} castShadow>
          <boxGeometry args={[L * 0.3, size * 0.4, W * 0.95]} />
          <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
        </mesh>
      )}
      {windows && (
        <mesh position={[0, H + 2 + 1, W * 0.5 + 0.1]}>
          <planeGeometry args={[L * 0.9, H * 0.5]} />
          <meshStandardMaterial color="#1a2030" emissive="#446" emissiveIntensity={0.2} transparent opacity={0.85} />
        </mesh>
      )}
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh
            key={`${sx}-${sz}`}
            position={[sx * L * 0.38, size * 0.2, sz * W * 0.5]}
            rotation={[Math.PI / 2, 0, 0]}
            castShadow
          >
            <cylinderGeometry args={[size * 0.22, size * 0.22, size * 0.2, 14]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        )),
      )}
    </group>
  );
}

function Bike({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[-size * 0.5, size * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[size * 0.35, size * 0.06, 8, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[size * 0.5, size * 0.4, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[size * 0.35, size * 0.06, 8, 16]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, size * 0.6, 0]} castShadow>
        <boxGeometry args={[size * 1, size * 0.08, size * 0.1]} />
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

function Boat({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[0, size * 0.2, 0]} castShadow>
        <cylinderGeometry args={[size * 0.4, size * 0.6, size * 1.8, 6, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

function Helicopter({ color, size }: { color: string; size: number }) {
  const rotor = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (rotor.current) rotor.current.rotation.y += dt * 12;
  });
  return (
    <group>
      <mesh position={[0, size * 0.5, 0]} castShadow>
        <sphereGeometry args={[size * 0.5, 14, 12]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[size * 0.8, size * 0.5, 0]} castShadow>
        <boxGeometry args={[size * 0.7, size * 0.15, size * 0.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <group ref={rotor} position={[0, size * 0.95, 0]}>
        <mesh castShadow>
          <boxGeometry args={[size * 2, 0.4, size * 0.1]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh castShadow rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[size * 2, 0.4, size * 0.1]} />
          <meshStandardMaterial color="#222" />
        </mesh>
      </group>
    </group>
  );
}

function Conifer({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[0, size * 0.4, 0]} castShadow>
        <cylinderGeometry args={[size * 0.12, size * 0.16, size * 0.8]} />
        <meshStandardMaterial color="#5a3a1f" />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0, size * 0.8 + i * size * 0.5, 0]} castShadow>
          <coneGeometry args={[size * (0.8 - i * 0.15), size * 0.8, 10]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Broadleaf({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[0, size * 0.5, 0]} castShadow>
        <cylinderGeometry args={[size * 0.13, size * 0.18, size]} />
        <meshStandardMaterial color="#5a3a1f" />
      </mesh>
      <mesh position={[0, size * 1.3, 0]} castShadow>
        <sphereGeometry args={[size * 0.85, 14, 12]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[size * 0.3, size * 1.6, size * 0.2]} castShadow>
        <sphereGeometry args={[size * 0.55, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Palm({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[0, size * 0.8, 0]} castShadow>
        <cylinderGeometry args={[size * 0.1, size * 0.14, size * 1.6]} />
        <meshStandardMaterial color="#8a6a3a" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * size * 0.5, size * 1.65, Math.sin(a) * size * 0.5]}
            rotation={[0, -a, Math.PI / 4]}
            castShadow
          >
            <boxGeometry args={[size, 1, size * 0.3]} />
            <meshStandardMaterial color={color} />
          </mesh>
        );
      })}
    </group>
  );
}

function DeadTree({ size }: { size: number }) {
  return (
    <group>
      <mesh position={[0, size * 0.8, 0]} castShadow>
        <cylinderGeometry args={[size * 0.08, size * 0.14, size * 1.6]} />
        <meshStandardMaterial color="#6a4a2a" roughness={1} />
      </mesh>
      <mesh position={[size * 0.3, size * 1.5, 0]} rotation={[0, 0, Math.PI / 4]} castShadow>
        <cylinderGeometry args={[size * 0.04, size * 0.06, size * 0.7]} />
        <meshStandardMaterial color="#5a3a1a" />
      </mesh>
    </group>
  );
}

function FlowerCluster({ color, size }: { color: string; size: number }) {
  const positions = useMemo(
    () => Array.from({ length: 7 }).map(() => [
      (Math.random() - 0.5) * size,
      Math.random() * size * 0.4,
      (Math.random() - 0.5) * size,
    ] as [number, number, number]),
    [size],
  );
  return (
    <group>
      {positions.map((p, i) => (
        <group key={i} position={p}>
          <mesh position={[0, size * 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.2, size * 0.4]} />
            <meshStandardMaterial color="#3a7a3a" />
          </mesh>
          <mesh position={[0, size * 0.45, 0]} castShadow>
            <sphereGeometry args={[size * 0.2, 8, 6]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Skyscraper({ color, size, variant }: { color: string; size: number; variant: string }) {
  const height = size * 4 + Math.random() * size * 3;
  const isGlass = variant === "skyscraperGlass" || variant === "officeTower";
  return (
    <group>
      <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[size * 1.2, height, size * 1.2]} />
        <meshStandardMaterial
          color={color}
          metalness={isGlass ? 0.7 : 0.3}
          roughness={isGlass ? 0.15 : 0.6}
          envMapIntensity={isGlass ? 1.5 : 0.6}
        />
      </mesh>
      {variant === "skyscraperArt" && (
        <mesh position={[0, height + size * 0.6, 0]} castShadow>
          <coneGeometry args={[size * 0.55, size * 1.2, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )}
      {/* antenna spire */}
      <mesh position={[0, height + size * 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, size * 0.8]} />
        <meshStandardMaterial color="#888" />
      </mesh>
      <WindowStrips width={size * 1.2} depth={size * 1.2} height={height} />
    </group>
  );
}

function Stadium({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[0, size * 0.3, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[size, size * 0.95, size * 0.6, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, size * 0.6, 0]} receiveShadow>
        <cylinderGeometry args={[size * 0.85, size * 0.85, size * 0.05, 32]} />
        <meshStandardMaterial color="#3a7a3a" />
      </mesh>
    </group>
  );
}

function Court({ color, lineColor, size, ratio }: { color: string; lineColor: string; size: number; ratio: number }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[size * 2, size * 2 / ratio]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 0.18, size * 0.2, 32]} />
        <meshBasicMaterial color={lineColor} />
      </mesh>
    </group>
  );
}

function CivicBuilding({ color, size, variant }: { color: string; size: number; variant: string }) {
  const isGas = variant === "gasStation";
  const h = isGas ? size * 0.5 : size * 1.4;
  return (
    <group>
      <mesh position={[0, h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[size * 1.8, h, size * 1.2]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, h + 1, 0]} castShadow>
        <boxGeometry args={[size * 1.9, 2, size * 1.3]} />
        <meshStandardMaterial color="#444" />
      </mesh>
      {isGas && (
        <mesh position={[0, h + size * 0.6, 0]} castShadow>
          <boxGeometry args={[size * 2.6, size * 0.1, size * 2]} />
          <meshStandardMaterial color="#ddd" />
        </mesh>
      )}
      <WindowStrips width={size * 1.8} depth={size * 1.2} height={h} />
    </group>
  );
}

function Church({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[0, size * 0.5, 0]} castShadow>
        <boxGeometry args={[size, size, size * 1.6]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, size * 1.2, 0]} castShadow>
        <coneGeometry args={[size * 0.6, size * 0.6, 4]} />
        <meshStandardMaterial color="#5a4a3a" />
      </mesh>
      <mesh position={[0, size * 1.6, -size * 0.4]} castShadow>
        <boxGeometry args={[size * 0.4, size * 1.4, size * 0.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, size * 2.4, -size * 0.4]} castShadow>
        <coneGeometry args={[size * 0.3, size * 0.7, 6]} />
        <meshStandardMaterial color="#7a5a3a" />
      </mesh>
    </group>
  );
}

function Barn({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[0, size * 0.4, 0]} castShadow>
        <boxGeometry args={[size * 1.4, size * 0.8, size]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, size, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[size * 0.55, size * 0.55, size * 1.4, 4, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#5a2a22" />
      </mesh>
    </group>
  );
}

function Windmill({ color, size }: { color: string; size: number }) {
  const blade = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (blade.current) blade.current.rotation.z += dt * 1.5; });
  return (
    <group>
      <mesh position={[0, size * 0.7, 0]} castShadow>
        <cylinderGeometry args={[size * 0.25, size * 0.35, size * 1.4, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <group ref={blade} position={[0, size * 1.5, size * 0.4]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 2]} castShadow>
            <boxGeometry args={[1, size * 0.9, 4]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function WindTurbine({ color, size }: { color: string; size: number }) {
  const blade = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (blade.current) blade.current.rotation.z += dt * 2.5; });
  return (
    <group>
      <mesh position={[0, size * 1.2, 0]} castShadow>
        <cylinderGeometry args={[size * 0.08, size * 0.14, size * 2.4]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <group ref={blade} position={[0, size * 2.4, 0.5]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, 0, (i * 2 * Math.PI) / 3]} castShadow>
            <boxGeometry args={[1, size * 1.2, 3]} />
            <meshStandardMaterial color="#fff" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Lighthouse({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[0, size, 0]} castShadow>
        <cylinderGeometry args={[size * 0.3, size * 0.45, size * 2, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[0, size * 2.2, 0]} castShadow>
        <cylinderGeometry args={[size * 0.35, size * 0.35, size * 0.4]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, size * 2.4, 0]} castShadow>
        <sphereGeometry args={[size * 0.32, 14, 10]} />
        <meshStandardMaterial color="#fff8c0" emissive="#fff8c0" emissiveIntensity={1.4} />
      </mesh>
      <mesh position={[0, size * 2.65, 0]} castShadow>
        <coneGeometry args={[size * 0.4, size * 0.4, 16]} />
        <meshStandardMaterial color="#222" />
      </mesh>
    </group>
  );
}

function StreetLamp({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[0, size * 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.6, size * 1.6, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[size * 0.25, size * 1.55, 0]} castShadow>
        <boxGeometry args={[size * 0.5, 0.3, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[size * 0.5, size * 1.55, 0]}>
        <sphereGeometry args={[1.6, 12, 10]} />
        <meshStandardMaterial color="#ffe9a8" emissive="#ffd070" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

function Bench({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[0, size * 0.25, 0]} castShadow>
        <boxGeometry args={[size * 1.4, 1.5, size * 0.4]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, size * 0.55, -size * 0.15]} castShadow>
        <boxGeometry args={[size * 1.4, size * 0.6, 1]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

function Fountain({ color, size }: { color: string; size: number }) {
  return (
    <group>
      <mesh position={[0, size * 0.2, 0]} castShadow>
        <cylinderGeometry args={[size, size * 1.05, size * 0.4, 24]} />
        <meshStandardMaterial color="#999" />
      </mesh>
      <mesh position={[0, size * 0.42, 0]} receiveShadow>
        <cylinderGeometry args={[size * 0.85, size * 0.85, 0.5, 24]} />
        <meshPhysicalMaterial color={color} metalness={0.3} roughness={0.1} clearcoat={1} />
      </mesh>
      <mesh position={[0, size * 0.9, 0]} castShadow>
        <cylinderGeometry args={[size * 0.15, size * 0.2, size * 0.8, 12]} />
        <meshStandardMaterial color="#aaa" />
      </mesh>
      <mesh position={[0, size * 1.4, 0]} castShadow>
        <sphereGeometry args={[size * 0.3, 12, 10]} />
        <meshStandardMaterial color={color} transparent opacity={0.7} emissive={color} emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/* ─────────────── HTML overlay for tool hints + drag handling ─────────────── */

function Overlay3D() {
  // Drag-to-move while move tool active.
  const game = useGame();
  const { camera, gl, scene } = useThreeOptional();
  // Bind a window pointermove to update dragged object's position via raycast onto ground.
  useEffect(() => {
    if (!camera || !gl) return;
    const raycaster = new THREE.Raycaster();
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const onMove = (e: PointerEvent) => {
      const id = (window as any).__bp_dragId as string | undefined;
      if (!id) return;
      const rect = gl.domElement.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera({ x: nx, y: ny } as any, camera);
      const point = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane, point);
      if (!point) return;
      const obj = useGame.getState().city.objects.find((o) => o.id === id);
      if (!obj) return;
      if (obj.kind === "building" || obj.kind === "nature" || obj.kind === "prop" || obj.kind === "sign") {
        useGame.getState().updateObject(id, { pos: { x: point.x, y: point.z } } as any);
      }
    };
    const onUp = () => {
      (window as any).__bp_dragId = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [camera, gl, scene, game]);

  // Esc to deselect + reset road start
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        (window as any).__bp_roadStart = null;
        useGame.getState().select(null);
      }
      if (e.key === "r" || e.key === "R") {
        const sel = useGame.getState().selectedId;
        if (!sel) return;
        const o = useGame.getState().city.objects.find((x) => x.id === sel);
        if (o && (o.kind === "building" || o.kind === "nature" || o.kind === "prop" || o.kind === "sign")) {
          useGame.getState().updateObject(o.id, { rotation: (o as any).rotation + Math.PI / 12 } as any);
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const sel = useGame.getState().selectedId;
        if (sel) useGame.getState().deleteObject(sel);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}

function useThreeOptional() {
  // Hook callable outside Canvas — returns undefined values; we read camera/gl via Canvas' onCreated below if needed.
  // For simplicity we grab the latest Canvas via window.
  const [state, setState] = useState<{ camera?: THREE.Camera; gl?: THREE.WebGLRenderer; scene?: THREE.Scene }>({});
  useEffect(() => {
    const id = setInterval(() => {
      const s = (window as any).__bp_three;
      if (s && s.camera && s.gl) setState(s);
    }, 200);
    return () => clearInterval(id);
  }, []);
  return state;
}