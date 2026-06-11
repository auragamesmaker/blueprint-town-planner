// 200+ placeable props grouped by category.
// Each entry references a `shape` primitive; drawProp() in GameCanvas renders it.

export type PropShape =
  | "sedan" | "suv" | "sportsCar" | "taxi" | "policeCar" | "ambulance" | "fireTruck"
  | "bus" | "schoolBus" | "van" | "pickup" | "boxTruck" | "tanker" | "tractor" | "trailer"
  | "bike" | "motorcycle" | "scooter" | "boat" | "rowboat"
  | "bench" | "picnicTable" | "outdoorChair" | "outdoorTable" | "loungeChair"
  | "streetLamp" | "gardenLight" | "floodLight" | "neonSign" | "trafficCone"
  | "trashCan" | "recycleBin" | "dumpster" | "mailbox" | "hydrant" | "phoneBooth"
  | "atm" | "kiosk" | "foodTruck" | "busStop" | "bikeRack" | "parkingMeter"
  | "fountain" | "statue" | "gazebo" | "pergola" | "bandstand" | "tent" | "umbrella"
  | "swingSet" | "slide" | "seesaw" | "sandbox" | "monkeyBars" | "merryGoRound"
  | "basketballHoop" | "soccerGoal" | "tennisNet" | "baseballBase" | "footballGoal"
  | "pingPongTable" | "skateRamp"
  | "rock" | "boulder" | "log" | "stump" | "pebbles"
  | "pineTree" | "oakTree" | "palmTree" | "willowTree" | "mapleTree"
  | "cherryTree" | "birchTree" | "spruceTree" | "appleTree" | "deadTree" | "topiary"
  | "rose" | "tulip" | "sunflower" | "daisy" | "lavender" | "lily" | "dandelion"
  | "orchid" | "poppy" | "iris" | "violets" | "marigold" | "hydrangea" | "cactus"
  | "haystack" | "scarecrow" | "barrel" | "well" | "windmill" | "silo" | "barn" | "chickenCoop"
  | "sandcastle" | "beachChair" | "surfboard" | "beachTowel" | "lifebuoy"
  | "crate" | "pallet" | "constructionSign" | "barricade" | "scaffold" | "portaPotty"
  | "fence" | "brickWall" | "hedge" | "lowWall" | "chainLink" | "ironGate"
  | "flagpole" | "antenna" | "satelliteDish" | "solarPanel" | "windTurbine"
  | "pool" | "hotTub" | "trampoline" | "grill" | "firePit"
  | "swanBoat" | "lighthouse" | "buoy" | "anchor" | "dock"
  | "snowman" | "iglooSm" | "christmasTree" | "pumpkin" | "ghostDecor" | "lantern" | "torch"
  | "vendingMachine" | "billboard" | "bench2" | "fountainSm" | "lampPost2" | "lampPost3"
  | "skyscraper" | "skyscraperGlass" | "skyscraperArt" | "officeTower" | "condoTower"
  | "stadium" | "arena" | "footballStadium" | "baseballStadium" | "tennisCourt"
  | "basketballCourt" | "soccerField" | "trackField" | "iceRink"
  | "billboardLg" | "marqueeSign" | "shopSign" | "directionSign" | "milestoneSign"
  | "trafficSign" | "speedSign"
  | "school" | "hospital" | "church" | "mosque" | "museum" | "mall" | "hotel"
  | "gasStation" | "factory" | "warehouse" | "bank"
  | "helicopter" | "limousine" | "convertible" | "hatchback" | "minivan"
  | "garbageTruck" | "cementMixer" | "snowplow" | "rv"
  | "carShadow";

export type PropDef = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  shape: PropShape;
  color: string;
  size: number; // base radius/scale
};

const mk = (
  id: string,
  name: string,
  category: string,
  shape: PropShape,
  color: string,
  size = 22,
  subcategory?: string,
): PropDef => ({ id, name, category, subcategory: subcategory ?? "General", shape, color, size });

export const PROP_CATALOG: PropDef[] = [
  // ────────── Vehicles (30)
  mk("v-sedan-red",      "Sedan (Red)",      "Vehicles", "sedan",      "#c1352b", 22),
  mk("v-sedan-blue",     "Sedan (Blue)",     "Vehicles", "sedan",      "#2a5fc0", 22),
  mk("v-sedan-black",    "Sedan (Black)",    "Vehicles", "sedan",      "#1c1c1f", 22),
  mk("v-sedan-white",    "Sedan (White)",    "Vehicles", "sedan",      "#ececec", 22),
  mk("v-sedan-silver",   "Sedan (Silver)",   "Vehicles", "sedan",      "#b8bcc2", 22),
  mk("v-suv-green",      "SUV (Green)",      "Vehicles", "suv",        "#2f6b3a", 26),
  mk("v-suv-tan",        "SUV (Tan)",        "Vehicles", "suv",        "#b69970", 26),
  mk("v-suv-black",      "SUV (Black)",      "Vehicles", "suv",        "#22232a", 26),
  mk("v-sports-red",     "Sports Car",       "Vehicles", "sportsCar",  "#d62828", 22),
  mk("v-sports-yellow",  "Sports Car (Yellow)","Vehicles","sportsCar", "#f4c300", 22),
  mk("v-taxi",           "Taxi",             "Vehicles", "taxi",       "#f4c300", 22),
  mk("v-police",         "Police Car",       "Vehicles", "policeCar",  "#1c2740", 22),
  mk("v-ambulance",      "Ambulance",        "Vehicles", "ambulance",  "#f4f4f4", 28),
  mk("v-firetruck",      "Fire Truck",       "Vehicles", "fireTruck",  "#b8211a", 30),
  mk("v-bus",            "City Bus",         "Vehicles", "bus",        "#3a6fc1", 36),
  mk("v-schoolbus",      "School Bus",       "Vehicles", "schoolBus",  "#e8b020", 36),
  mk("v-van",            "Delivery Van",     "Vehicles", "van",        "#cfcfcf", 26),
  mk("v-pickup-blue",    "Pickup (Blue)",    "Vehicles", "pickup",     "#2a5fc0", 24),
  mk("v-pickup-red",     "Pickup (Red)",     "Vehicles", "pickup",     "#a93226", 24),
  mk("v-boxtruck",       "Box Truck",        "Vehicles", "boxTruck",   "#e0e0e0", 32),
  mk("v-tanker",         "Tanker",           "Vehicles", "tanker",     "#c4ced6", 34),
  mk("v-tractor",        "Tractor",          "Vehicles", "tractor",    "#2f7d3a", 22),
  mk("v-trailer",        "Cargo Trailer",    "Vehicles", "trailer",    "#9a9a9a", 32),
  mk("v-bike",           "Bicycle",          "Vehicles", "bike",       "#2a2a2a", 12),
  mk("v-motorcycle",     "Motorcycle",       "Vehicles", "motorcycle", "#1c1c1c", 14),
  mk("v-scooter",        "Scooter",          "Vehicles", "scooter",    "#cf3a3a", 12),
  mk("v-boat",           "Speedboat",        "Vehicles", "boat",       "#e6e6e6", 26),
  mk("v-rowboat",        "Rowboat",          "Vehicles", "rowboat",    "#8a5a3a", 22),
  mk("v-foodtruck",      "Food Truck",       "Vehicles", "foodTruck",  "#e58a3a", 30),
  mk("v-swanboat",       "Swan Boat",        "Vehicles", "swanBoat",   "#ffffff", 22),

  // ────────── Street Furniture (25)
  mk("sf-bench",         "Park Bench",       "Street",   "bench",       "#7a5a3a", 18),
  mk("sf-bench-iron",    "Iron Bench",       "Street",   "bench",       "#2a2a2a", 18),
  mk("sf-bench2",        "Slatted Bench",    "Street",   "bench2",      "#a07a4a", 18),
  mk("sf-picnic",        "Picnic Table",     "Street",   "picnicTable", "#9a6a3a", 24),
  mk("sf-table",         "Outdoor Table",    "Street",   "outdoorTable","#cccccc", 14),
  mk("sf-chair",         "Outdoor Chair",    "Street",   "outdoorChair","#dddddd", 10),
  mk("sf-lounge",        "Lounge Chair",     "Street",   "loungeChair", "#e0c89a", 16),
  mk("sf-streetlamp",    "Street Lamp",      "Street",   "streetLamp",  "#2a2a2a", 14),
  mk("sf-lamppost2",     "Twin Lamp Post",   "Street",   "lampPost2",   "#2a2a2a", 14),
  mk("sf-lamppost3",     "Modern Lamp Post", "Street",   "lampPost3",   "#3a3a3a", 14),
  mk("sf-gardenlight",   "Garden Light",     "Street",   "gardenLight", "#2a2a2a", 8),
  mk("sf-flood",         "Flood Light",      "Street",   "floodLight",  "#3a3a3a", 12),
  mk("sf-neon",          "Neon Sign",        "Street",   "neonSign",    "#ff3aa1", 22),
  mk("sf-cone",          "Traffic Cone",     "Street",   "trafficCone", "#f06a1a", 8),
  mk("sf-trash",         "Trash Can",        "Street",   "trashCan",    "#2a4a2a", 10),
  mk("sf-recycle",       "Recycle Bin",      "Street",   "recycleBin",  "#1f6ec2", 10),
  mk("sf-dumpster",      "Dumpster",         "Street",   "dumpster",    "#3a5a7a", 22),
  mk("sf-mailbox",       "Mailbox",          "Street",   "mailbox",     "#3a5fbf", 10),
  mk("sf-hydrant",       "Fire Hydrant",     "Street",   "hydrant",     "#c83232", 8),
  mk("sf-phone",         "Phone Booth",      "Street",   "phoneBooth",  "#b8252a", 14),
  mk("sf-atm",           "ATM",              "Street",   "atm",         "#3a3a3f", 14),
  mk("sf-kiosk",         "News Kiosk",       "Street",   "kiosk",       "#7a4a2a", 20),
  mk("sf-busstop",       "Bus Stop Shelter", "Street",   "busStop",     "#bdbdbd", 22),
  mk("sf-bikerack",      "Bike Rack",        "Street",   "bikeRack",    "#777777", 14),
  mk("sf-meter",         "Parking Meter",    "Street",   "parkingMeter","#444444", 8),

  // ────────── Park & Recreation (20)
  mk("p-fountain",       "Fountain",         "Park",     "fountain",    "#cfe6f1", 30),
  mk("p-fountain-sm",    "Small Fountain",   "Park",     "fountainSm",  "#cfe6f1", 20),
  mk("p-statue",         "Statue",           "Park",     "statue",      "#c2c2c2", 18),
  mk("p-gazebo",         "Gazebo",           "Park",     "gazebo",      "#e8d8b8", 36),
  mk("p-pergola",        "Pergola",          "Park",     "pergola",     "#a07a4a", 30),
  mk("p-bandstand",      "Bandstand",        "Park",     "bandstand",   "#cfb98a", 36),
  mk("p-tent",           "Event Tent",       "Park",     "tent",        "#e8e1c8", 32),
  mk("p-umbrella-r",     "Umbrella (Red)",   "Park",     "umbrella",    "#c8332a", 16),
  mk("p-umbrella-b",     "Umbrella (Blue)",  "Park",     "umbrella",    "#2a5fc0", 16),
  mk("p-umbrella-g",     "Umbrella (Green)", "Park",     "umbrella",    "#2f7a3a", 16),
  mk("p-swing",          "Swing Set",        "Park",     "swingSet",    "#b8252a", 24),
  mk("p-slide",          "Slide",            "Park",     "slide",       "#f0a830", 24),
  mk("p-seesaw",         "Seesaw",           "Park",     "seesaw",      "#3aa8c8", 18),
  mk("p-sandbox",        "Sandbox",          "Park",     "sandbox",     "#e6c98a", 24),
  mk("p-monkey",         "Monkey Bars",      "Park",     "monkeyBars",  "#cf3a3a", 24),
  mk("p-merry",          "Merry-Go-Round",   "Park",     "merryGoRound","#c8a85a", 22),
  mk("p-trampoline",     "Trampoline",       "Park",     "trampoline",  "#2a2a2a", 22),
  mk("p-grill",          "Grill",            "Park",     "grill",       "#222222", 12),
  mk("p-firepit",        "Fire Pit",         "Park",     "firePit",     "#5a3a2a", 14),
  mk("p-pool",           "Swimming Pool",    "Park",     "pool",        "#3aa1d8", 40),

  // ────────── Sports (12)
  mk("sp-basket",        "Basketball Hoop",  "Sports",   "basketballHoop","#d8d8d8", 14),
  mk("sp-soccer",        "Soccer Goal",      "Sports",   "soccerGoal",  "#ffffff", 26),
  mk("sp-tennis",        "Tennis Net",       "Sports",   "tennisNet",   "#2a2a2a", 28),
  mk("sp-baseball",      "Baseball Base",    "Sports",   "baseballBase","#ffffff", 8),
  mk("sp-football",      "Football Goal",    "Sports",   "footballGoal","#f0f0f0", 26),
  mk("sp-pingpong",      "Ping Pong Table",  "Sports",   "pingPongTable","#1f6e2a", 18),
  mk("sp-skate",         "Skate Ramp",       "Sports",   "skateRamp",   "#888888", 28),
  mk("sp-hot-tub",       "Hot Tub",          "Sports",   "hotTub",      "#3a85a8", 18),
  mk("sp-pool-l",        "Lap Pool",         "Sports",   "pool",        "#2f95cf", 50),
  mk("sp-volleyball",    "Volleyball Net",   "Sports",   "tennisNet",   "#eaeaea", 26),
  mk("sp-badminton",     "Badminton Net",    "Sports",   "tennisNet",   "#d4d4d4", 22),
  mk("sp-yoga",          "Yoga Mat",         "Sports",   "beachTowel",  "#7a4ac8", 14),

  // ────────── Trees & Plants (28)
  mk("t-pine",           "Pine Tree",        "Trees",    "pineTree",    "#1f6e2a", 26),
  mk("t-pine-tall",      "Tall Pine",        "Trees",    "pineTree",    "#1a5e22", 34),
  mk("t-oak",            "Oak Tree",         "Trees",    "oakTree",     "#3a7a3a", 30),
  mk("t-oak-big",        "Mighty Oak",       "Trees",    "oakTree",     "#306c30", 40),
  mk("t-palm",           "Palm Tree",        "Trees",    "palmTree",    "#4aa84a", 28),
  mk("t-willow",         "Willow",           "Trees",    "willowTree",  "#7aa84a", 30),
  mk("t-maple",          "Maple",            "Trees",    "mapleTree",   "#c8542a", 28),
  mk("t-maple-gold",     "Golden Maple",     "Trees",    "mapleTree",   "#e0a830", 28),
  mk("t-cherry",         "Cherry Tree",      "Trees",    "cherryTree",  "#f0a8c0", 26),
  mk("t-cherry-white",   "White Cherry",     "Trees",    "cherryTree",  "#fce8ef", 26),
  mk("t-birch",          "Birch",            "Trees",    "birchTree",   "#a8c8a0", 26),
  mk("t-spruce",         "Spruce",           "Trees",    "spruceTree",  "#1e5c2a", 28),
  mk("t-apple",          "Apple Tree",       "Trees",    "appleTree",   "#3a7a3a", 26),
  mk("t-dead",           "Dead Tree",        "Trees",    "deadTree",    "#5a4a3a", 26),
  mk("t-topiary",        "Topiary",          "Trees",    "topiary",     "#3a7a3a", 18),
  mk("t-stump",          "Tree Stump",       "Trees",    "stump",       "#6a4a2a", 10),
  mk("t-log",            "Fallen Log",       "Trees",    "log",         "#7a5a3a", 18),
  mk("t-hedge",          "Hedge",            "Trees",    "hedge",       "#3a6a3a", 18),
  mk("t-rose",           "Rose Bush",        "Flowers",  "rose",        "#c8334d", 8),
  mk("t-tulip",          "Tulips",           "Flowers",  "tulip",       "#e64a72", 8),
  mk("t-sunflower",      "Sunflowers",       "Flowers",  "sunflower",   "#f0c020", 10),
  mk("t-daisy",          "Daisies",          "Flowers",  "daisy",       "#ffffff", 8),
  mk("t-lavender",       "Lavender",         "Flowers",  "lavender",    "#9e6acf", 10),
  mk("t-lily",           "Lilies",           "Flowers",  "lily",        "#fcdfa0", 8),
  mk("t-poppy",          "Poppies",          "Flowers",  "poppy",       "#e63a2a", 8),
  mk("t-iris",           "Irises",           "Flowers",  "iris",        "#5a4ac8", 8),
  mk("t-hydrangea",      "Hydrangeas",       "Flowers",  "hydrangea",   "#7a9fd8", 12),
  mk("t-cactus",         "Cactus",           "Flowers",  "cactus",      "#3a7a4a", 10),

  // ────────── Rocks & Terrain (10)
  mk("r-rock-sm",        "Small Rock",       "Rocks",    "rock",        "#9a948a", 10),
  mk("r-rock-md",        "Rock",             "Rocks",    "rock",        "#8a8478", 16),
  mk("r-rock-lg",        "Large Rock",       "Rocks",    "rock",        "#7a7468", 22),
  mk("r-boulder",        "Boulder",          "Rocks",    "boulder",     "#6a6458", 30),
  mk("r-pebbles",        "Pebbles",          "Rocks",    "pebbles",     "#a8a298", 12),
  mk("r-rock-mossy",     "Mossy Rock",       "Rocks",    "rock",        "#6a8a5a", 18),
  mk("r-rock-coastal",   "Coastal Rock",     "Rocks",    "rock",        "#5a6878", 18),
  mk("r-rock-snow",      "Snow Rock",        "Rocks",    "rock",        "#dcdce4", 18),
  mk("r-rock-red",       "Red Rock",         "Rocks",    "rock",        "#a85a4a", 18),
  mk("r-rock-pile",      "Rock Pile",        "Rocks",    "boulder",     "#7a7468", 22),

  // ────────── Farm & Rural (15)
  mk("f-hay",            "Haystack",         "Farm",     "haystack",    "#d8b04a", 16),
  mk("f-hay-rect",       "Hay Bale",         "Farm",     "haystack",    "#c69a3a", 18),
  mk("f-scarecrow",      "Scarecrow",        "Farm",     "scarecrow",   "#8a5a3a", 14),
  mk("f-barrel",         "Barrel",           "Farm",     "barrel",      "#7a4a2a", 10),
  mk("f-well",           "Stone Well",       "Farm",     "well",        "#9a9088", 16),
  mk("f-windmill",       "Windmill",         "Farm",     "windmill",    "#ffffff", 30),
  mk("f-silo",           "Silo",             "Farm",     "silo",        "#c8c8c8", 22),
  mk("f-barn",           "Barn",             "Farm",     "barn",        "#a8332a", 50),
  mk("f-coop",           "Chicken Coop",     "Farm",     "chickenCoop", "#b8a87a", 22),
  mk("f-fence-wood",     "Wood Fence",       "Farm",     "fence",       "#9a6a3a", 18),
  mk("f-fence-white",    "Picket Fence",     "Farm",     "fence",       "#ececec", 18),
  mk("f-tractor",        "Farm Tractor",     "Farm",     "tractor",     "#1f6e2a", 22),
  mk("f-trailer-hay",    "Hay Trailer",      "Farm",     "trailer",     "#9a6a3a", 32),
  mk("f-pumpkin",        "Pumpkin",          "Farm",     "pumpkin",     "#e6772a", 10),
  mk("f-corn",           "Corn Patch",       "Farm",     "topiary",     "#d8a83a", 16),

  // ────────── Beach & Water (12)
  mk("b-castle",         "Sandcastle",       "Beach",    "sandcastle",  "#e6c98a", 14),
  mk("b-chair",          "Beach Chair",      "Beach",    "beachChair",  "#3a85d8", 12),
  mk("b-surf",           "Surfboard",        "Beach",    "surfboard",   "#e3e3e3", 16),
  mk("b-towel-r",        "Beach Towel (Red)","Beach",    "beachTowel",  "#c83a3a", 14),
  mk("b-towel-b",        "Beach Towel (Blue)","Beach",   "beachTowel",  "#2a5fc0", 14),
  mk("b-lifebuoy",       "Lifebuoy",         "Beach",    "lifebuoy",    "#e63a2a", 10),
  mk("b-umbrella",       "Beach Umbrella",   "Beach",    "umbrella",    "#e6772a", 18),
  mk("b-buoy",           "Mooring Buoy",     "Beach",    "buoy",        "#c8a02a", 8),
  mk("b-anchor",         "Anchor",           "Beach",    "anchor",      "#3a3a3a", 12),
  mk("b-lighthouse",     "Lighthouse",       "Beach",    "lighthouse",  "#ffffff", 26),
  mk("b-dock",           "Wooden Dock",      "Beach",    "dock",        "#8a5a3a", 30),
  mk("b-pebbles",        "Beach Pebbles",    "Beach",    "pebbles",     "#cfc6b8", 14),

  // ────────── Industrial & Construction (15)
  mk("i-crate",          "Wooden Crate",     "Industrial","crate",      "#9a6a3a", 10),
  mk("i-pallet",         "Pallet",           "Industrial","pallet",     "#a07a4a", 12),
  mk("i-cone",           "Cone",             "Industrial","trafficCone","#f06a1a", 6),
  mk("i-barricade",      "Barricade",        "Industrial","barricade",  "#e8a020", 18),
  mk("i-scaffold",       "Scaffold",         "Industrial","scaffold",   "#888888", 24),
  mk("i-porta",          "Porta-Potty",      "Industrial","portaPotty", "#3a85d8", 12),
  mk("i-construction",   "Construction Sign","Industrial","constructionSign","#e8a020", 14),
  mk("i-dumpster",       "Dumpster",         "Industrial","dumpster",   "#3a5a7a", 22),
  mk("i-tanker",         "Fuel Tanker",      "Industrial","tanker",     "#c4ced6", 34),
  mk("i-antenna",        "Antenna",          "Industrial","antenna",    "#5a5a5a", 16),
  mk("i-satellite",      "Satellite Dish",   "Industrial","satelliteDish","#dcdcdc", 14),
  mk("i-solar",          "Solar Panel",      "Industrial","solarPanel", "#1c2740", 20),
  mk("i-wind",           "Wind Turbine",     "Industrial","windTurbine","#ffffff", 30),
  mk("i-billboard",      "Billboard",        "Industrial","billboard",  "#ececec", 28),
  mk("i-vending",        "Vending Machine",  "Industrial","vendingMachine","#c83a3a", 10),

  // ────────── Walls & Fences (8)
  mk("w-fence",          "Wood Fence",       "Walls",    "fence",       "#9a6a3a", 18),
  mk("w-picket",         "Picket Fence",     "Walls",    "fence",       "#ececec", 18),
  mk("w-brick",          "Brick Wall",       "Walls",    "brickWall",   "#a8533a", 18),
  mk("w-low",            "Low Stone Wall",   "Walls",    "lowWall",     "#a8a298", 18),
  mk("w-chain",          "Chain Link",       "Walls",    "chainLink",   "#9a9a9a", 18),
  mk("w-iron",           "Iron Gate",        "Walls",    "ironGate",    "#222222", 18),
  mk("w-hedge-tall",     "Tall Hedge",       "Walls",    "hedge",       "#2f6a3a", 22),
  mk("w-hedge-short",    "Short Hedge",      "Walls",    "hedge",       "#3a7a4a", 14),

  // ────────── Seasonal & Decor (15)
  mk("d-snowman",        "Snowman",          "Decor",    "snowman",     "#ffffff", 14),
  mk("d-igloo",          "Small Igloo",      "Decor",    "iglooSm",     "#e6eef4", 20),
  mk("d-christmas",      "Christmas Tree",   "Decor",    "christmasTree","#1f6e2a", 22),
  mk("d-pumpkin",        "Jack-o-Lantern",   "Decor",    "pumpkin",     "#e6772a", 10),
  mk("d-ghost",          "Ghost",            "Decor",    "ghostDecor",  "#ffffff", 12),
  mk("d-lantern",        "Paper Lantern",    "Decor",    "lantern",     "#e64a4a", 8),
  mk("d-torch",          "Garden Torch",     "Decor",    "torch",       "#7a4a2a", 8),
  mk("d-flagpole-us",    "Flagpole",         "Decor",    "flagpole",    "#c83a3a", 18),
  mk("d-flag-blue",      "Blue Flag",        "Decor",    "flagpole",    "#2a5fc0", 18),
  mk("d-flag-green",     "Green Flag",       "Decor",    "flagpole",    "#2f7a3a", 18),
  mk("d-statue-2",       "Bronze Statue",    "Decor",    "statue",      "#7a5a3a", 18),
  mk("d-statue-3",       "Marble Statue",    "Decor",    "statue",      "#e6e6e6", 18),
  mk("d-pot",            "Planter Pot",      "Decor",    "topiary",     "#a85a3a", 12),
  mk("d-tent",           "Camping Tent",     "Decor",    "tent",        "#cf6a3a", 22),
  mk("d-buoy",           "Decorative Buoy",  "Decor",    "buoy",        "#c8a02a", 8),

  // ────────── Extras (15)
  mk("x-bench-modern",   "Modern Bench",     "Street",   "bench2",      "#dadada", 18),
  mk("x-lamp-tall",      "Tall Lamp",        "Street",   "streetLamp",  "#1a1a1a", 16),
  mk("x-lamp-double",    "Double Lamp",      "Street",   "lampPost2",   "#1a1a1a", 16),
  mk("x-mailbox-green",  "Green Mailbox",    "Street",   "mailbox",     "#2f7a3a", 10),
  mk("x-truck-blue",     "Blue Box Truck",   "Vehicles", "boxTruck",    "#2a5fc0", 32),
  mk("x-truck-white",    "White Box Truck",  "Vehicles", "boxTruck",    "#f0f0f0", 32),
  mk("x-suv-white",      "SUV (White)",      "Vehicles", "suv",         "#ececec", 26),
  mk("x-bike-blue",      "Blue Bicycle",     "Vehicles", "bike",        "#2a5fc0", 12),
  mk("x-stump-mossy",    "Mossy Stump",      "Trees",    "stump",       "#5a7a4a", 10),
  mk("x-flower-marigold","Marigolds",        "Flowers",  "marigold",    "#f0a020", 8),
  mk("x-flower-orchid",  "Orchids",          "Flowers",  "orchid",      "#c87ad8", 8),
  mk("x-flower-violets", "Violets",          "Flowers",  "violets",     "#7a4ac8", 8),
  mk("x-flower-dandelion","Dandelions",      "Flowers",  "dandelion",   "#f0d040", 8),
  mk("x-cone-tall",      "Tall Cone",        "Industrial","trafficCone","#f06a1a", 10),
  mk("x-pallet-stack",   "Pallet Stack",     "Industrial","pallet",     "#7a5a3a", 14),
];

// ─────────── Subcategory derivation + recategorization ───────────
// Move trees/flowers/rocks/walls into a single "Nature" top-level category.
const SHAPE_SUB: Partial<Record<PropShape, { cat: string; sub: string }>> = {
  // Nature
  pineTree: { cat: "Nature", sub: "Trees" },
  oakTree: { cat: "Nature", sub: "Trees" },
  palmTree: { cat: "Nature", sub: "Trees" },
  willowTree: { cat: "Nature", sub: "Trees" },
  mapleTree: { cat: "Nature", sub: "Trees" },
  cherryTree: { cat: "Nature", sub: "Trees" },
  birchTree: { cat: "Nature", sub: "Trees" },
  spruceTree: { cat: "Nature", sub: "Trees" },
  appleTree: { cat: "Nature", sub: "Trees" },
  deadTree: { cat: "Nature", sub: "Trees" },
  topiary: { cat: "Nature", sub: "Bushes" },
  hedge: { cat: "Nature", sub: "Bushes" },
  log: { cat: "Nature", sub: "Wood" },
  stump: { cat: "Nature", sub: "Wood" },
  rose: { cat: "Nature", sub: "Flowers" },
  tulip: { cat: "Nature", sub: "Flowers" },
  sunflower: { cat: "Nature", sub: "Flowers" },
  daisy: { cat: "Nature", sub: "Flowers" },
  lavender: { cat: "Nature", sub: "Flowers" },
  lily: { cat: "Nature", sub: "Flowers" },
  poppy: { cat: "Nature", sub: "Flowers" },
  iris: { cat: "Nature", sub: "Flowers" },
  hydrangea: { cat: "Nature", sub: "Flowers" },
  cactus: { cat: "Nature", sub: "Flowers" },
  marigold: { cat: "Nature", sub: "Flowers" },
  orchid: { cat: "Nature", sub: "Flowers" },
  violets: { cat: "Nature", sub: "Flowers" },
  dandelion: { cat: "Nature", sub: "Flowers" },
  rock: { cat: "Nature", sub: "Rocks" },
  boulder: { cat: "Nature", sub: "Rocks" },
  pebbles: { cat: "Nature", sub: "Rocks" },
  // Vehicles subgroups
  sedan: { cat: "Vehicles", sub: "Cars" },
  suv: { cat: "Vehicles", sub: "Cars" },
  sportsCar: { cat: "Vehicles", sub: "Cars" },
  taxi: { cat: "Vehicles", sub: "Cars" },
  pickup: { cat: "Vehicles", sub: "Cars" },
  van: { cat: "Vehicles", sub: "Cars" },
  policeCar: { cat: "Vehicles", sub: "Service" },
  ambulance: { cat: "Vehicles", sub: "Service" },
  fireTruck: { cat: "Vehicles", sub: "Service" },
  bus: { cat: "Vehicles", sub: "Buses" },
  schoolBus: { cat: "Vehicles", sub: "Buses" },
  foodTruck: { cat: "Vehicles", sub: "Trucks" },
  boxTruck: { cat: "Vehicles", sub: "Trucks" },
  tanker: { cat: "Vehicles", sub: "Trucks" },
  trailer: { cat: "Vehicles", sub: "Trucks" },
  tractor: { cat: "Vehicles", sub: "Trucks" },
  bike: { cat: "Vehicles", sub: "Bikes" },
  motorcycle: { cat: "Vehicles", sub: "Bikes" },
  scooter: { cat: "Vehicles", sub: "Bikes" },
  boat: { cat: "Vehicles", sub: "Boats" },
  rowboat: { cat: "Vehicles", sub: "Boats" },
  swanBoat: { cat: "Vehicles", sub: "Boats" },
  // Street
  streetLamp: { cat: "Street", sub: "Lighting" },
  lampPost2: { cat: "Street", sub: "Lighting" },
  lampPost3: { cat: "Street", sub: "Lighting" },
  gardenLight: { cat: "Street", sub: "Lighting" },
  floodLight: { cat: "Street", sub: "Lighting" },
  bench: { cat: "Street", sub: "Furniture" },
  bench2: { cat: "Street", sub: "Furniture" },
  picnicTable: { cat: "Street", sub: "Furniture" },
  outdoorTable: { cat: "Street", sub: "Furniture" },
  outdoorChair: { cat: "Street", sub: "Furniture" },
  loungeChair: { cat: "Street", sub: "Furniture" },
  trashCan: { cat: "Street", sub: "Bins" },
  recycleBin: { cat: "Street", sub: "Bins" },
  dumpster: { cat: "Street", sub: "Bins" },
  mailbox: { cat: "Street", sub: "Utility" },
  hydrant: { cat: "Street", sub: "Utility" },
  phoneBooth: { cat: "Street", sub: "Utility" },
  atm: { cat: "Street", sub: "Utility" },
  kiosk: { cat: "Street", sub: "Utility" },
  busStop: { cat: "Street", sub: "Utility" },
  bikeRack: { cat: "Street", sub: "Utility" },
  parkingMeter: { cat: "Street", sub: "Utility" },
  trafficCone: { cat: "Street", sub: "Traffic" },
  // Walls
  fence: { cat: "Walls", sub: "Fences" },
  brickWall: { cat: "Walls", sub: "Walls" },
  lowWall: { cat: "Walls", sub: "Walls" },
  chainLink: { cat: "Walls", sub: "Fences" },
  ironGate: { cat: "Walls", sub: "Gates" },
  // Park
  fountain: { cat: "Park", sub: "Decor" },
  fountainSm: { cat: "Park", sub: "Decor" },
  statue: { cat: "Park", sub: "Decor" },
  gazebo: { cat: "Park", sub: "Structures" },
  pergola: { cat: "Park", sub: "Structures" },
  bandstand: { cat: "Park", sub: "Structures" },
  tent: { cat: "Park", sub: "Structures" },
  umbrella: { cat: "Park", sub: "Decor" },
  swingSet: { cat: "Park", sub: "Playground" },
  slide: { cat: "Park", sub: "Playground" },
  seesaw: { cat: "Park", sub: "Playground" },
  sandbox: { cat: "Park", sub: "Playground" },
  monkeyBars: { cat: "Park", sub: "Playground" },
  merryGoRound: { cat: "Park", sub: "Playground" },
  trampoline: { cat: "Park", sub: "Playground" },
  grill: { cat: "Park", sub: "Decor" },
  firePit: { cat: "Park", sub: "Decor" },
  pool: { cat: "Park", sub: "Water" },
  hotTub: { cat: "Park", sub: "Water" },
  // Sports
  basketballHoop: { cat: "Sports", sub: "Equipment" },
  soccerGoal: { cat: "Sports", sub: "Equipment" },
  footballGoal: { cat: "Sports", sub: "Equipment" },
  tennisNet: { cat: "Sports", sub: "Equipment" },
  baseballBase: { cat: "Sports", sub: "Equipment" },
  pingPongTable: { cat: "Sports", sub: "Equipment" },
  skateRamp: { cat: "Sports", sub: "Equipment" },
  // Farm
  haystack: { cat: "Farm", sub: "Crops" },
  scarecrow: { cat: "Farm", sub: "Crops" },
  pumpkin: { cat: "Farm", sub: "Crops" },
  barrel: { cat: "Farm", sub: "Tools" },
  well: { cat: "Farm", sub: "Structures" },
  windmill: { cat: "Farm", sub: "Structures" },
  silo: { cat: "Farm", sub: "Structures" },
  barn: { cat: "Farm", sub: "Structures" },
  chickenCoop: { cat: "Farm", sub: "Structures" },
  // Beach
  sandcastle: { cat: "Beach", sub: "Sand" },
  beachChair: { cat: "Beach", sub: "Lounge" },
  surfboard: { cat: "Beach", sub: "Sport" },
  beachTowel: { cat: "Beach", sub: "Lounge" },
  lifebuoy: { cat: "Beach", sub: "Sport" },
  buoy: { cat: "Beach", sub: "Water" },
  anchor: { cat: "Beach", sub: "Water" },
  lighthouse: { cat: "Beach", sub: "Structures" },
  dock: { cat: "Beach", sub: "Structures" },
  // Industrial
  crate: { cat: "Industrial", sub: "Cargo" },
  pallet: { cat: "Industrial", sub: "Cargo" },
  constructionSign: { cat: "Industrial", sub: "Construction" },
  barricade: { cat: "Industrial", sub: "Construction" },
  scaffold: { cat: "Industrial", sub: "Construction" },
  portaPotty: { cat: "Industrial", sub: "Construction" },
  antenna: { cat: "Industrial", sub: "Tech" },
  satelliteDish: { cat: "Industrial", sub: "Tech" },
  solarPanel: { cat: "Industrial", sub: "Tech" },
  windTurbine: { cat: "Industrial", sub: "Tech" },
  vendingMachine: { cat: "Industrial", sub: "Utility" },
  billboard: { cat: "Signs", sub: "Billboards" },
  neonSign: { cat: "Signs", sub: "Neon" },
  // Decor seasonal
  snowman: { cat: "Decor", sub: "Winter" },
  iglooSm: { cat: "Decor", sub: "Winter" },
  christmasTree: { cat: "Decor", sub: "Winter" },
  ghostDecor: { cat: "Decor", sub: "Halloween" },
  lantern: { cat: "Decor", sub: "Lighting" },
  torch: { cat: "Decor", sub: "Lighting" },
  flagpole: { cat: "Decor", sub: "Flags" },
};

// Apply remap
for (const p of PROP_CATALOG) {
  const m = SHAPE_SUB[p.shape];
  if (m) {
    p.category = m.cat;
    p.subcategory = m.sub;
  } else {
    p.subcategory = p.subcategory ?? "General";
  }
}

// ─────────── New items: Buildings (skyscrapers/civic/sports), Signs, more vehicles ───────────
const EXTRA: PropDef[] = [
  // Skyscrapers
  mk("bld-sky-1",     "Glass Skyscraper",    "Buildings", "skyscraperGlass", "#5a8fb8", 70, "Skyscrapers"),
  mk("bld-sky-2",     "Office Tower",        "Buildings", "officeTower",     "#7a8a9a", 65, "Skyscrapers"),
  mk("bld-sky-3",     "Condo Tower",         "Buildings", "condoTower",      "#c8b89a", 60, "Skyscrapers"),
  mk("bld-sky-4",     "Art Deco Skyscraper", "Buildings", "skyscraperArt",   "#b8a878", 72, "Skyscrapers"),
  mk("bld-sky-5",     "Steel Skyscraper",    "Buildings", "skyscraper",      "#6a7a8a", 80, "Skyscrapers"),
  mk("bld-sky-6",     "Black Tower",         "Buildings", "skyscraperGlass", "#1a2230", 78, "Skyscrapers"),
  mk("bld-sky-7",     "Mirror Tower",        "Buildings", "skyscraperGlass", "#9ac8e8", 68, "Skyscrapers"),
  mk("bld-sky-8",     "Twin Tower A",        "Buildings", "officeTower",     "#5a6878", 90, "Skyscrapers"),
  mk("bld-sky-9",     "Twin Tower B",        "Buildings", "officeTower",     "#5a6878", 90, "Skyscrapers"),
  mk("bld-sky-10",    "Pyramid Tower",       "Buildings", "skyscraperArt",   "#9aa8b8", 75, "Skyscrapers"),
  // Civic
  mk("bld-school",    "School",              "Buildings", "school",      "#d6b88a", 70, "Civic"),
  mk("bld-hospital",  "Hospital",            "Buildings", "hospital",    "#eaeaea", 75, "Civic"),
  mk("bld-church",    "Church",              "Buildings", "church",      "#d8d0c4", 60, "Civic"),
  mk("bld-mosque",    "Mosque",              "Buildings", "mosque",      "#e6dec8", 60, "Civic"),
  mk("bld-museum",    "Museum",              "Buildings", "museum",      "#ccc4b4", 70, "Civic"),
  mk("bld-bank",      "Bank",                "Buildings", "bank",        "#d4c8a8", 55, "Civic"),
  // Commercial
  mk("bld-mall",      "Shopping Mall",       "Buildings", "mall",        "#c8b4a4", 90, "Commercial"),
  mk("bld-hotel",     "Hotel",               "Buildings", "hotel",       "#a8b4c4", 65, "Commercial"),
  mk("bld-gas",       "Gas Station",         "Buildings", "gasStation",  "#d4d4d4", 50, "Commercial"),
  // Industrial
  mk("bld-factory",   "Factory",             "Buildings", "factory",     "#9a9a9a", 80, "Industrial"),
  mk("bld-warehouse", "Warehouse",           "Buildings", "warehouse",   "#b8b0a4", 75, "Industrial"),
  // Sports arenas
  mk("bld-stadium",   "Football Stadium",    "Buildings", "footballStadium", "#3a7a3a", 110, "Arenas"),
  mk("bld-baseball",  "Baseball Stadium",    "Buildings", "baseballStadium", "#5a8a4a", 105, "Arenas"),
  mk("bld-arena",     "Indoor Arena",        "Buildings", "arena",        "#8a8a9a", 95, "Arenas"),
  mk("bld-stadium-g", "Sports Stadium",      "Buildings", "stadium",      "#a8a098", 100, "Arenas"),
  mk("bld-tennis",    "Tennis Court",        "Buildings", "tennisCourt",  "#3a7a4a", 60, "Arenas"),
  mk("bld-bball-c",   "Basketball Court",    "Buildings", "basketballCourt", "#a87a4a", 55, "Arenas"),
  mk("bld-soccer-f",  "Soccer Field",        "Buildings", "soccerField",  "#2f7a3a", 95, "Arenas"),
  mk("bld-track",     "Track & Field",       "Buildings", "trackField",   "#a85a4a", 90, "Arenas"),
  mk("bld-rink",      "Ice Rink",            "Buildings", "iceRink",      "#cfe6f1", 70, "Arenas"),
  // Signs
  mk("sig-billboard-lg", "Large Billboard",   "Signs", "billboardLg",   "#ffffff", 36, "Billboards"),
  mk("sig-billboard-2",  "Highway Billboard", "Signs", "billboardLg",   "#f0e8d8", 40, "Billboards"),
  mk("sig-billboard-3",  "Digital Billboard", "Signs", "billboardLg",   "#1a1a2a", 36, "Billboards"),
  mk("sig-marquee",      "Marquee Sign",      "Signs", "marqueeSign",   "#e8d870", 26, "Storefront"),
  mk("sig-shop",         "Shop Sign",         "Signs", "shopSign",      "#c83a3a", 22, "Storefront"),
  mk("sig-neon-1",       "Neon Sign Red",     "Signs", "neonSign",      "#ff3a8a", 22, "Neon"),
  mk("sig-neon-2",       "Neon Sign Blue",    "Signs", "neonSign",      "#3aa8ff", 22, "Neon"),
  mk("sig-neon-3",       "Neon Sign Green",   "Signs", "neonSign",      "#3aff8a", 22, "Neon"),
  mk("sig-direction",    "Direction Sign",    "Signs", "directionSign", "#3a7a3a", 18, "Traffic"),
  mk("sig-milestone",    "Mile Marker",       "Signs", "milestoneSign", "#ececec", 14, "Traffic"),
  mk("sig-speed-25",     "Speed Limit 25",    "Signs", "speedSign",     "#ffffff", 14, "Traffic"),
  mk("sig-speed-45",     "Speed Limit 45",    "Signs", "speedSign",     "#ffffff", 14, "Traffic"),
  mk("sig-yield",        "Yield Sign",        "Signs", "trafficSign",   "#ff0000", 14, "Traffic"),
  mk("sig-noparking",    "No Parking",        "Signs", "trafficSign",   "#ffffff", 14, "Traffic"),
  // More vehicles
  mk("v-helicopter",  "Helicopter",     "Vehicles", "helicopter",  "#2a2a2a", 28, "Air"),
  mk("v-limo",        "Limousine",      "Vehicles", "limousine",   "#1a1a1c", 32, "Cars"),
  mk("v-convertible", "Convertible",    "Vehicles", "convertible", "#c8334d", 22, "Cars"),
  mk("v-hatchback",   "Hatchback",      "Vehicles", "hatchback",   "#3a85d8", 20, "Cars"),
  mk("v-minivan",     "Minivan",        "Vehicles", "minivan",     "#a8a098", 26, "Cars"),
  mk("v-garbage",     "Garbage Truck",  "Vehicles", "garbageTruck", "#3a7a3a", 32, "Service"),
  mk("v-cement",      "Cement Mixer",   "Vehicles", "cementMixer", "#d4a83a", 30, "Trucks"),
  mk("v-snowplow",    "Snowplow",       "Vehicles", "snowplow",    "#e8a020", 28, "Service"),
  mk("v-rv",          "RV Camper",      "Vehicles", "rv",          "#ececec", 34, "Trucks"),
];

PROP_CATALOG.push(...EXTRA);

// Re-sort by category for stable UI
PROP_CATALOG.sort((a, b) => a.category.localeCompare(b.category));

export const PROP_CATEGORIES = Array.from(
  new Set(PROP_CATALOG.map((p) => p.category)),
);

export function getSubcategories(category: string): string[] {
  return Array.from(
    new Set(
      PROP_CATALOG.filter((p) => p.category === category).map((p) => p.subcategory),
    ),
  );
}