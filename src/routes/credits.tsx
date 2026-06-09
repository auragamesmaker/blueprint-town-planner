import { createFileRoute, Link } from "@tanstack/react-router";
import { SakuraPetals } from "@/components/blueprint/SakuraPetals";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: "Credits — Blueprint" },
      { name: "description", content: "The people behind Blueprint." },
      { property: "og:title", content: "Credits — Blueprint" },
      { property: "og:description", content: "The people behind Blueprint." },
    ],
  }),
  component: CreditsPage,
});

function CreditsPage() {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-sky)" }}
    >
      <SakuraPetals count={30} />
      <section className="relative z-10 mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
        <h1 className="font-display text-7xl text-foreground md:text-8xl">Credits</h1>
        <p className="mt-2 text-sm tracking-[0.4em] uppercase text-muted-foreground">
          With gratitude
        </p>
        <div className="mt-12 space-y-6">
          <div className="rounded-2xl border border-border bg-card px-12 py-6 shadow-[var(--shadow-petal)]">
            <p className="text-xs tracking-[0.35em] uppercase text-muted-foreground">
              Created by
            </p>
            <p className="font-display mt-2 text-4xl text-foreground">Issa Freij</p>
          </div>
          <div className="rounded-2xl border border-border bg-card px-12 py-6 shadow-[var(--shadow-petal)]">
            <p className="text-xs tracking-[0.35em] uppercase text-muted-foreground">
              Created by
            </p>
            <p className="font-display mt-2 text-4xl text-foreground">
              Ashton Oakaey
            </p>
          </div>
        </div>
        <Link
          to="/"
          className="mt-14 inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm tracking-widest uppercase text-foreground hover:bg-accent"
        >
          ← Back to menu
        </Link>
      </section>
    </main>
  );
}