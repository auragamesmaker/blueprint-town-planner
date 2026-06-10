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
  | "vendingMachine" | "billboard" | "bench2" | "fountainSm" | "lampPost2" | "lampPost3";

export type PropDef = {
  id: string;
  name: string;
  category: string;
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
): PropDef => ({ id, name, category, shape, color, size });

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

export const PROP_CATEGORIES = Array.from(
  new Set(PROP_CATALOG.map((p) => p.category)),
);