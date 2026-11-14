import { Link } from "react-router";
import { ArrowLeft, Compass, Search, Users } from "lucide-react";
import Navigation from "@/components/Navigation";
import { openStudioCommandPalette } from "@/lib/studio-events";
import { useStudioTheme } from "@/hooks/useStudioTheme";

export default function NotFound() {
  const { theme } = useStudioTheme();

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        backgroundColor: "var(--studio-canvas)",
        color: "var(--studio-ink)",
      }}
    >
      <Navigation />

      <main className="max-w-5xl mx-auto px-6 pt-28 pb-20">
        <div className="bg-black p-[3px] shadow-2xl">
          <div className="bg-white text-black grid grid-cols-1 lg:grid-cols-12">
            {/* Left Pigment Column */}
            <div
              className="lg:col-span-4 p-8 flex flex-col justify-between text-white border-b-2 lg:border-b-0 lg:border-r-2 border-black"
              style={{ backgroundColor: "var(--studio-blue)" }}
            >
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] opacity-80 mb-3">
                  {theme.movementEra} · ARCHIVE ERROR
                </p>
                <div className="text-7xl lg:text-8xl font-black tracking-tighter leading-none">
                  404
                </div>
              </div>

              <div className="pt-8 border-t border-white/20 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-widest">
                  Plate Missing From Press Run
                </p>
                <p className="text-xs text-white/75 leading-relaxed">
                  The requested folio, case dossier, or review slug has been moved
                  or does not exist in this desk edition.
                </p>
              </div>
            </div>

            {/* Right Recovery Index */}
            <div className="lg:col-span-8 p-8 lg:p-10 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className="w-3 h-3 inline-block"
                    style={{ backgroundColor: "var(--studio-red)" }}
                  />
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                    PLATE 404 · MISSING FROM ARCHIVE
                  </span>
                </div>

                <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight mb-4">
                  Unregistered Editorial Route
                </h1>

                <p className="text-sm text-gray-600 leading-relaxed max-w-xl mb-8">
                  Return to the commission frontpage, browse verified case study
                  plates, inspect artist day rates, or press{" "}
                  <kbd className="px-1.5 py-0.5 text-xs font-mono border border-black bg-gray-100">
                    ⌘K
                  </kbd>{" "}
                  to jump across the entire studio template.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-black/15">
                <Link
                  to="/"
                  className="px-5 py-3.5 bg-black text-white text-xs font-bold uppercase tracking-widest flex items-center justify-between hover:opacity-90 transition-opacity"
                >
                  <span>Return Home</span>
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={openStudioCommandPalette}
                  className="px-5 py-3.5 text-black border-2 border-black text-xs font-bold uppercase tracking-widest flex items-center justify-between hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "var(--studio-yellow)" }}
                >
                  <span>Search Index (⌘K)</span>
                  <Search className="w-4 h-4" />
                </button>
                <Link
                  to="/artists"
                  className="px-5 py-3 bg-white border border-black text-xs font-bold uppercase tracking-widest flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span>Artists Roster</span>
                  <Users className="w-4 h-4" />
                </Link>
                <Link
                  to="/editions"
                  className="px-5 py-3 bg-white border border-black text-xs font-bold uppercase tracking-widest flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <span>Print Editions</span>
                  <Compass className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px bg-black">
            <div className="h-2" style={{ backgroundColor: "var(--studio-red)" }} />
            <div className="h-2" style={{ backgroundColor: "var(--studio-blue)" }} />
            <div className="h-2" style={{ backgroundColor: "var(--studio-yellow)" }} />
          </div>
        </div>
      </main>
    </div>
  );
}
