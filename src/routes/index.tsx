import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { SakuraPetals } from "@/components/blueprint/SakuraPetals";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Blueprint — A town Builder" },
      { name: "description", content: "Design tranquil top-down towns and cities under falling cherry blossoms." },
      { property: "og:title", content: "Blueprint" },
      { property: "og:description", content: "A top-down city builder, freely playful, no economy — just creation." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main
      className="relative min-h-screen overflow-hidden"
      style={{ background: "var(--gradient-sky)" }}
    >
      <SakuraPetals count={50} />
      {/* distant mountain silhouette */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: "40vh" }}
      >
        <path
          fill="oklch(0.78 0.08 10 / 0.4)"
          d="M0,224L60,202.7C120,181,240,139,360,154.7C480,171,600,245,720,250.7C840,256,960,192,1080,176C1200,160,1320,192,1380,208L1440,224L1440,320L0,320Z"
        />
        <path
          fill="oklch(0.7 0.1 8 / 0.5)"
          d="M0,288L80,272C160,256,320,224,480,224C640,224,800,256,960,261.3C1120,267,1280,245,1360,234.7L1440,224L1440,320L0,320Z"
        />
      </svg>

      <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-sm tracking-[0.5em] text-foreground/70 uppercase">
          A town Builder
        </p>
        <h1 className="font-display text-[clamp(4rem,14vw,11rem)] leading-none text-foreground drop-shadow-sm">
          Blueprint
        </h1>
        <p className="mt-4 max-w-xl text-base text-muted-foreground md:text-lg">
          Lay roads, neighborhoods, plants, whole forests.
          Just the quietness of a town taking shape under the trees.
        </p>

        <div className="mt-12 flex flex-col items-center gap-5">
          <Link
            to="/play"
            className="btn-glow inline-flex items-center justify-center rounded-full px-14 py-5 text-2xl font-semibold text-primary-foreground"
            style={{
              background: "var(--gradient-sakura)",
              animation: "pulse-glow 3s ease-in-out infinite",
            }}
          >
            Play
          </Link>
          <Link
            to="/credits"
            className="text-sm tracking-widest uppercase text-foreground/80 underline-offset-8 hover:underline"
          >
            Credits
          </Link>
        </div>
      </section>
    </main>
  );
}
