export type Vec2 = { x: number; y: number };

export type RoadSegment = {
  id: string;
  kind: "road";
  a: Vec2;
  b: Vec2;
  width: number;
  sidewalks: boolean;
  crosswalk: boolean;
  parking: boolean;
  trafficLight: boolean;
  stopSign: boolean;
};

export type BuildingKind =
  | "house"
  | "apartment"
  | "town-office"
  | "town-hall"
  | "store"
  | "library"
  | "restaurant";

export type Building = {
  id: string;
  kind: "building";
  variant: BuildingKind;
  pos: Vec2;
  size: Vec2;
  rotation: number;
  snap: boolean;
};

export type NatureKind = "grass" | "tree" | "bush" | "flower";

export type NatureObj = {
  id: string;
  kind: "nature";
  variant: NatureKind;
  pos: Vec2;
  size: number;
  rotation: number;
};

export type WaterKind = "pond" | "lake" | "river";

export type WaterObj = {
  id: string;
  kind: "water";
  variant: WaterKind;
  // pond/lake = polygon points; river = polyline points
  points: Vec2[];
};

export type SignKind = "street" | "town" | "highway";

export type SignObj = {
  id: string;
  kind: "sign";
  variant: SignKind;
  pos: Vec2;
  text: string;
  rotation: number;
};

export type AnyObject = RoadSegment | Building | NatureObj | WaterObj | SignObj;

export type CityState = {
  objects: AnyObject[];
  timeOfDay: number; // 0-24
  weather: "clear" | "rain" | "snow";
};

export type SaveSlot = {
  id: string;
  townName: string;
  updatedAt: number;
  state: CityState;
};

export const emptyCity = (): CityState => ({
  objects: [],
  timeOfDay: 12,
  weather: "clear",
});