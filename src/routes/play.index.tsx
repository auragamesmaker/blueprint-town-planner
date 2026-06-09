import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SakuraPetals } from "@/components/blueprint/SakuraPetals";
import {
  createSlot,
  deleteSlot,
  loadSlots,
  upsertSlot,
} from "@/lib/blueprint/store";
import type { SaveSlot } from "@/lib/blueprint/types";
import { Trash2, Pencil, Plus } from "lucide-react";

export const Route = createFileRoute("/play/")({
  head: () => ({
    meta: [
      { title: "Choose a Town — Blueprint" },
      { name: "description", content: "Pick a save slot and start building." },
    ],
  }),
  component: SlotPicker,
});

const SLOT_COUNT = 6;

function SlotPicker() {
  const [slots, setSlots] = useState<SaveSlot[]>([]);
  const [creatingIdx, setCreatingIdx] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setSlots(loadSlots());
  }, []);

  const refresh = () => setSlots(loadSlots());

  const startCreate = (idx: number) => {
    setCreatingIdx(idx);
    setName("");
  };

  const confirmCreate = () => {
    if (!name.trim()) return;
    const slot = createSlot(name.trim());
    refresh();
    setCreatingIdx(null);
    navigate({ to: "/play/$slotId", params: { slotId: slot.id } });
  };

  const renameSlot = (s: SaveSlot, newName: string) => {
    upsertSlot({ ...s, townName: newName, updatedAt: Date.now() });
    refresh();
    setEditingId(null);
  };

  const onDelete = (id: string) => {
    if (!confirm("Delete this town? This cannot be undone.")) return;
    deleteSlot(id);
    refresh();
  };

  const visible: (SaveSlot | null)[] = Array.from({ length: SLOT_COUNT }).map(
    (_, i) => slots[i] ?? null,
  );

  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-sky)" }}
    >
      <SakuraPetals count={25} />
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.4em] uppercase text-muted-foreground">
              Save Slots
            </p>
            <h1 className="font-display text-6xl text-foreground">
              Choose your town
            </h1>
          </div>
          <Link
            to="/"
            className="rounded-full border border-border bg-card px-4 py-2 text-xs tracking-widest uppercase hover:bg-accent"
          >
            ← Menu
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((slot, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-petal)] backdrop-blur transition hover:-translate-y-1"
            >
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
                Slot {idx + 1}
              </p>
              {slot ? (
                <>
                  {editingId === slot.id ? (
                    <input
                      autoFocus
                      defaultValue={slot.townName}
                      onBlur={(e) => renameSlot(slot, e.target.value || slot.townName)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          renameSlot(slot, (e.target as HTMLInputElement).value);
                      }}
                      className="font-display mt-2 w-full rounded bg-transparent text-3xl text-foreground outline-none border-b border-primary"
                    />
                  ) : (
                    <h3 className="font-display mt-2 text-3xl text-foreground">
                      {slot.townName}
                    </h3>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {slot.state.objects.length} objects · updated{" "}
                    {new Date(slot.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-6 flex items-center gap-2">
                    <Link
                      to="/play/$slotId"
                      params={{ slotId: slot.id }}
                      className="flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold text-primary-foreground"
                      style={{ background: "var(--gradient-sakura)" }}
                    >
                      Open
                    </Link>
                    <button
                      onClick={() => setEditingId(slot.id)}
                      className="rounded-full border border-border p-2 hover:bg-accent"
                      aria-label="Rename"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(slot.id)}
                      className="rounded-full border border-border p-2 hover:bg-destructive hover:text-destructive-foreground"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : creatingIdx === idx ? (
                <div className="mt-4">
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && confirmCreate()}
                    placeholder="Town name…"
                    className="font-display w-full rounded bg-transparent text-2xl text-foreground outline-none border-b border-primary placeholder:text-muted-foreground/50"
                  />
                  <div className="mt-6 flex gap-2">
                    <button
                      onClick={confirmCreate}
                      className="flex-1 rounded-full px-4 py-2 text-sm font-semibold text-primary-foreground"
                      style={{ background: "var(--gradient-sakura)" }}
                    >
                      Create
                    </button>
                    <button
                      onClick={() => setCreatingIdx(null)}
                      className="rounded-full border border-border px-4 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => startCreate(idx)}
                  className="mt-4 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border py-10 text-muted-foreground hover:bg-accent/40"
                >
                  <Plus className="h-8 w-8" />
                  <span className="text-sm tracking-widest uppercase">
                    New town
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}