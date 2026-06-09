# Blueprint — V1 Plan

Blueprint as described is a large, AAA-scope game (hyper-realistic top-down 3D, modular road editor, forest brush, weather, save slots, etc.). I can't deliver photoreal 3D graphics in a web app — but I can build a strong **stylized top-down 2D city builder** that hits every system you listed. We can layer in more visual fidelity later.

## What v1 will include

**Start menu (cherry blossom theme)**
- Animated falling sakura petals, soft pink/cream palette, serif display font
- Glowing "Play" button + "Credits" button
- Credits screen lists **Issa Freij** and **Ashton Oakaey**

**Save / Load**
- "Play" opens a 6-slot selector
- Each slot stores town name + full city state in Lovable Cloud (per-user) with localStorage fallback
- Rename, overwrite, delete slot

**In-game UI**
- **Left side panel:** Build, Move, Delete tools — each with a Lucide icon + emoji rendered in pure white (CSS filter to desaturate to white)
- **Bottom tab bar:** Roads · Buildings · Nature · Water · Signs · Settings
- **Mini Town Map** (top-right) — click to expand to full-screen overview
- No currency anywhere

**Build mode**
- Grid canvas (HTML canvas) with pan + zoom
- Roads: click-drag to lay segments, angle-snap (0/15/30/45/90°), auto-connect into intersections and roundabouts
- Click a road segment → popover to toggle sidewalks, crosswalks, parking, traffic lights, stop signs
- Buildings (houses, apartments, town office, town hall, store, library, restaurant) — drag from bottom bar, snap-to-grid toggle, rotate (R), reposition, delete
- Typeable signs (street / town / highway styles) — click sign to edit text inline

**Nature & environment**
- Drag-drop grass patches, trees, bushes, flowers
- Forest brush — paint to scatter trees with natural variance
- Water tools — rivers (polyline), ponds, lakes (polygon)

**Weather & time**
- Settings tab sliders: time-of-day (lighting tint overlay) + weather (clear / rain / snow particle layer)

## Technical approach (for reference)

- Single HTML5 `<canvas>` rendered top-down, layered tile/object system
- State in Zustand-style store, serialized JSON per save slot
- Tailwind v4 design tokens for the sakura theme in `src/styles.css`
- Routes: `/` (menu), `/credits`, `/play` (slot picker), `/play/$slotId` (game)
- Lovable Cloud for persistent saves (enabled if you confirm)

## Out of scope for v1 (call out before approving)

- True hyper-realistic / 3D graphics — v1 is stylized top-down 2D vector art
- Highway merge/exit geometry beyond angled intersections
- Vehicle/pedestrian simulation
- Multiplayer

## Build order

1. Design system + cherry blossom start menu + credits
2. Slot picker + save/load plumbing (Lovable Cloud)
3. Canvas engine: pan/zoom/grid + object model
4. Tools (Build/Move/Delete) + bottom tab bar + side panel
5. Roads with intersection snapping + per-segment customization popover
6. Buildings + signs (typeable)
7. Nature + forest brush + water tools
8. Town map overview + weather/time sliders

Approve and I'll start at step 1. If you'd like me to drop or simplify anything (e.g. skip Lovable Cloud and use localStorage only), say so now.