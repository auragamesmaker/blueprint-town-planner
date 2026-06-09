import { useGame, type Tool } from "@/lib/blueprint/store";
import { Hammer, Move, Trash2 } from "lucide-react";

const TOOLS: { id: Tool["kind"]; label: string; emoji: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "build", label: "Build", emoji: "🔨", icon: Hammer },
  { id: "move", label: "Move", emoji: "✋", icon: Move },
  { id: "delete", label: "Delete", emoji: "🗑️", icon: Trash2 },
];

export function SidePanel() {
  const { tool, setTool } = useGame();
  const active = tool.kind;

  const pick = (id: Tool["kind"]) => {
    if (id === "build") setTool({ kind: "build", sub: "road" });
    else if (id === "move") setTool({ kind: "move" });
    else setTool({ kind: "delete" });
  };

  return (
    <div className="pointer-events-auto absolute left-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-3 rounded-2xl border border-white/10 bg-black/40 p-3 backdrop-blur-md shadow-2xl">
      {TOOLS.map((t) => {
        const Icon = t.icon;
        const on = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => pick(t.id)}
            className={`group relative flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-xl border transition ${
              on
                ? "border-white/60 bg-white/15"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
            title={t.label}
          >
            <Icon className="h-5 w-5 text-white" />
            <span className="text-emoji-white text-xs leading-none">{t.emoji}</span>
            <span className="absolute left-full ml-3 hidden whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs text-white group-hover:block">
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}