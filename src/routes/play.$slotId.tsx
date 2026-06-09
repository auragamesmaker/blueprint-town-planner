import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { GameCanvas } from "@/components/blueprint/GameCanvas";
import { SidePanel } from "@/components/blueprint/SidePanel";
import { BottomBar } from "@/components/blueprint/BottomBar";
import { TownMap } from "@/components/blueprint/TownMap";
import { WeatherOverlay } from "@/components/blueprint/WeatherOverlay";
import { SelectionPanel } from "@/components/blueprint/SelectionPanel";
import { loadSlots, useGame } from "@/lib/blueprint/store";
import { Home } from "lucide-react";

export const Route = createFileRoute("/play/$slotId")({
  head: () => ({
    meta: [
      { title: "Building — Blueprint" },
      { name: "description", content: "Designing a town in Blueprint." },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  const { slotId } = Route.useParams();
  const hydrate = useGame((s) => s.hydrate);
  const townName = useGame((s) => s.townName);
  const ready = useGame((s) => s.slotId) === slotId;
  const navigate = useNavigate();

  useEffect(() => {
    const slot = loadSlots().find((s) => s.id === slotId);
    if (!slot) {
      navigate({ to: "/play" });
      return;
    }
    hydrate(slot);
  }, [slotId, hydrate, navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#9bbf8a] text-white">
        Loading town…
      </div>
    );
  }

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#9bbf8a]">
      <GameCanvas />
      <WeatherOverlay />

      {/* Top-left: title + home */}
      <div className="pointer-events-auto absolute left-4 top-4 z-30 flex items-center gap-3">
        <Link
          to="/play"
          className="rounded-full border border-white/15 bg-black/50 p-2 text-white backdrop-blur-md hover:bg-black/70"
          title="Back to slots"
        >
          <Home className="h-4 w-4" />
        </Link>
        <div className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-white backdrop-blur-md">
          <span className="text-xs tracking-[0.3em] uppercase text-white/60">Town </span>
          <span className="font-display text-lg">{townName}</span>
        </div>
      </div>

      <TownMap />
      <SidePanel />
      <BottomBar />
      <SelectionPanel />

      {/* hint */}
      <div className="pointer-events-none absolute bottom-44 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/40 px-4 py-1.5 text-xs text-white/70 backdrop-blur-md">
        Shift+drag to pan · Scroll to zoom · R to rotate · Esc to cancel
      </div>
    </main>
  );
}