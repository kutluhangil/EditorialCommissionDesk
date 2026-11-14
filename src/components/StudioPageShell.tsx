import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { ArrowLeft, Search } from "lucide-react";
import Navigation from "@/components/Navigation";
import { openStudioCommandPalette } from "@/lib/studio-events";
import { useStudioTheme } from "@/hooks/useStudioTheme";
import { STUDIO_CONFIG } from "@/config/studio.config";

interface StudioPageShellProps {
  plateCode: string;
  title: string;
  subtitle: string;
  accentColor?: "red" | "blue" | "yellow";
  actions?: ReactNode;
  children: ReactNode;
}

const STUDIO_ROUTES = [
  { label: "Frontpage", path: "/" },
  { label: "Artists Roster", path: "/artists" },
  { label: "Print Editions", path: "/editions" },
  { label: "Rights & Kill-Fee", path: "/licensing" },
  { label: "Press Specs", path: "/specs" },
  { label: "Colophon", path: "/colophon" },
  { label: "Review Room", path: "/review/ECD-2026-0001" },
];

export default function StudioPageShell({
  plateCode,
  title,
  subtitle,
  accentColor = "red",
  actions,
  children,
}: StudioPageShellProps) {
  const { theme } = useStudioTheme();
  const location = useLocation();

  const accentVar =
    accentColor === "blue"
      ? "var(--studio-blue)"
      : accentColor === "yellow"
        ? "var(--studio-yellow)"
        : "var(--studio-red)";

  const accentTextColor = accentColor === "yellow" ? "#0A0A0A" : "#FFFFFF";

  return (
    <div
      className="min-h-screen transition-colors duration-300 flex flex-col"
      style={{
        backgroundColor: "var(--studio-canvas)",
        color: "var(--studio-ink)",
      }}
    >
      <Navigation />

      <header className="pt-20 border-b-2 border-black bg-white text-black">
        {/* Top Sub-Navigation Bar */}
        <div className="border-y border-black/15 bg-black/[0.02]">
          <div className="max-w-7xl mx-auto px-6 h-11 flex items-center justify-between gap-4 overflow-x-auto">
            <div className="flex items-center gap-5 shrink-0">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:text-black transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                Desk Home
              </Link>
              <span className="text-gray-300">|</span>
              <nav className="flex items-center gap-4">
                {STUDIO_ROUTES.map((route) => {
                  const isActive =
                    route.path === "/"
                      ? location.pathname === "/"
                      : location.pathname.startsWith(
                          route.path.split("/").slice(0, 2).join("/"),
                        );
                  return (
                    <Link
                      key={route.path}
                      to={route.path}
                      className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${
                        isActive
                          ? "text-black underline decoration-2 underline-offset-4"
                          : "text-gray-500 hover:text-black"
                      }`}
                    >
                      {route.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <button
              type="button"
              onClick={openStudioCommandPalette}
              className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 border border-black/20 hover:border-black bg-white text-[10px] font-mono uppercase tracking-wider shrink-0 transition-colors"
            >
              <Search className="w-3 h-3" />
              <span>Index</span>
              <kbd className="text-[9px] text-gray-500">⌘K</kbd>
            </button>
          </div>
        </div>

        {/* Plate Hero Header */}
        <div className="max-w-7xl mx-auto px-6 py-10 lg:py-12 grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{
                  backgroundColor: accentVar,
                  color: accentTextColor,
                }}
              >
                {plateCode}
              </span>
              <span className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest border border-black/20 text-gray-600">
                {theme.movementEra} · {theme.name}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-[0.95] mb-3">
              {title}
            </h1>
            <p className="text-sm lg:text-base text-gray-600 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          </div>

          {actions && (
            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
              {actions}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 lg:py-12">
        {children}
      </main>

      <footer className="bg-black text-white border-t-2 border-black mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-5">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2.5 h-2.5 inline-block"
                style={{ backgroundColor: "var(--studio-red)" }}
              />
              <span className="text-xs font-bold uppercase tracking-widest">
                {STUDIO_CONFIG.identity.name}
              </span>
            </div>
            <p className="text-[11px] text-white/60 leading-relaxed">
              White-label studio portfolio &amp; client commission platform ·{" "}
              {STUDIO_CONFIG.identity.location}
            </p>
          </div>

          <div className="md:col-span-7 flex flex-wrap md:justify-end gap-x-5 gap-y-2 text-[10px] font-bold uppercase tracking-widest text-white/75">
            <Link to="/artists" className="hover:text-white transition-colors">
              Roster
            </Link>
            <Link to="/editions" className="hover:text-white transition-colors">
              Editions
            </Link>
            <Link to="/licensing" className="hover:text-white transition-colors">
              Licensing
            </Link>
            <Link to="/specs" className="hover:text-white transition-colors">
              Press Specs
            </Link>
            <Link to="/colophon" className="hover:text-white transition-colors">
              Colophon
            </Link>
            <Link
              to="/review/ECD-2026-0001"
              className="hover:text-white transition-colors"
            >
              Review Room
            </Link>
            <Link to="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-black">
          <div className="h-1.5" style={{ backgroundColor: "var(--studio-red)" }} />
          <div className="h-1.5" style={{ backgroundColor: "var(--studio-blue)" }} />
          <div className="h-1.5" style={{ backgroundColor: "var(--studio-yellow)" }} />
        </div>
      </footer>
    </div>
  );
}
