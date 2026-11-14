import { useState } from "react";
import { Link } from "react-router";
import { Check, CheckSquare, Copy, FileCode2, Printer, Square } from "lucide-react";
import StudioPageShell from "@/components/StudioPageShell";
import { STUDIO_CONFIG } from "@/config/studio.config";
import { toast } from "sonner";

const PREFLIGHT_ITEMS = [
  {
    id: "color",
    label: "Verify color space (FOGRA39 CMYK for offset · sRGB for web)",
  },
  {
    id: "bleed",
    label: "Confirm 5 mm outer bleed & crop marks outside trim box",
  },
  {
    id: "tac",
    label: "Audit Total Area Coverage <= 300% on uncoated newsprint stocks",
  },
  {
    id: "fonts",
    label: "Convert foil/deboss vector dies and display titles to outlines",
  },
  {
    id: "trapping",
    label: "Apply 0.25 mm choke-and-spread trapping on spot silkscreen channels",
  },
] as const;

export default function SpecsPage() {
  const [checkedIds, setCheckedIds] = useState<string[]>(["color", "bleed"]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const copyIccProfile = async (id: string, iccProfile: string) => {
    try {
      await navigator.clipboard.writeText(iccProfile);
      setCopiedId(id);
      toast.success(`Copied ICC Spec: ${iccProfile}`);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      toast.info(`ICC Profile: ${iccProfile}`);
    }
  };

  const checklistProgress = Math.round(
    (checkedIds.length / PREFLIGHT_ITEMS.length) * 100,
  );

  return (
    <StudioPageShell
      plateCode="PRESS MECHANICALS & PREFLIGHT"
      title="Print Production & Prepress Specs"
      subtitle="Standardized CMYK, spot Pantone silkscreen, hardcover jacket mechanicals, and clean web SVG delivery tolerances enforced across all studio outputs."
      accentColor="red"
      actions={
        <Link
          to="/dashboard"
          className="px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:bg-black/90"
        >
          <Printer className="w-3.5 h-3.5" />
          Open Proof Workspace
        </Link>
      }
    >
      <div className="space-y-10">
        {/* Mechanical Spec Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STUDIO_CONFIG.pressMechanicalSpecs.map((spec, idx) => (
            <article
              key={spec.id}
              className="bg-white text-black border-2 border-black p-7 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-black/15">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                    MECHANICAL 0{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyIccProfile(spec.id, spec.iccProfile)}
                    className="inline-flex items-center gap-1.5 text-[10px] font-mono border border-black/20 px-2 py-1 hover:border-black"
                  >
                    <span>{spec.iccProfile}</span>
                    {copiedId === spec.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                <h2 className="text-xl font-black uppercase tracking-tight mb-4">
                  {spec.formatName}
                </h2>

                <dl className="grid grid-cols-2 gap-4 text-xs mb-5">
                  <div>
                    <dt className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      Color Space
                    </dt>
                    <dd className="font-semibold">{spec.colorSpace}</dd>
                  </div>
                  <div>
                    <dt className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      Resolution / Scale
                    </dt>
                    <dd className="font-semibold">{spec.minDpi}</dd>
                  </div>
                  <div>
                    <dt className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      Bleed Tolerance
                    </dt>
                    <dd className="font-semibold">{spec.bleedMm}</dd>
                  </div>
                  <div>
                    <dt className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      Safe Type Margin
                    </dt>
                    <dd className="font-semibold">{spec.safeMarginMm}</dd>
                  </div>
                </dl>
              </div>

              <div className="pt-4 border-t border-black/15 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5" />
                  {spec.preferredFileFormat}
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">{spec.notes}</p>
              </div>
            </article>
          ))}
        </section>

        {/* Interactive Pre-Flight Sign-Off Checklist */}
        <section className="bg-white text-black border-2 border-black p-7">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-black/15">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">
                Interactive Quality Gate
              </p>
              <h2 className="text-xl font-black uppercase tracking-tight">
                Pre-Flight Press Check ({checklistProgress}%)
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setCheckedIds(PREFLIGHT_ITEMS.map((item) => item.id))}
              className="px-3.5 py-2 border border-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors"
            >
              Mark All Verified
            </button>
          </div>

          <div className="space-y-2.5">
            {PREFLIGHT_ITEMS.map((item) => {
              const checked = checkedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  className={`w-full p-4 border text-left flex items-center gap-3 transition-colors ${
                    checked
                      ? "border-black bg-black text-white"
                      : "border-black/20 bg-white text-black hover:border-black"
                  }`}
                >
                  {checked ? (
                    <CheckSquare className="w-4 h-4 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 shrink-0 text-gray-400" />
                  )}
                  <span className="text-xs font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </StudioPageShell>
  );
}
