import { useRef, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Layers,
  Send,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import CommissionModal, {
  type CommissionModalHandle,
} from "@/components/CommissionModal";
import StudioPageShell from "@/components/StudioPageShell";
import { STUDIO_CONFIG } from "@/config/studio.config";
import { toast } from "sonner";

type ProofInspectionStage = "wireframe" | "colorblock" | "press";

export default function CaseStudyPage() {
  const { slug } = useParams<{ slug: string }>();
  const modalRef = useRef<CommissionModalHandle>(null);
  const [stage, setStage] = useState<ProofInspectionStage>("press");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const items = STUDIO_CONFIG.portfolioItems;
  const activeIndex = items.findIndex((item) => item.slug === slug);
  const item = activeIndex >= 0 ? items[activeIndex] : undefined;

  if (!item) {
    return (
      <StudioPageShell
        plateCode="ARCHIVE · NOT FOUND"
        title="Case Dossier Not Indexed"
        subtitle="The requested case study slug does not match any archived commission plate."
        accentColor="blue"
        actions={
          <Link
            to="/#portfolio"
            className="px-4 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Browse All 8 Case Studies
          </Link>
        }
      >
        <div className="bg-white text-black border-2 border-black p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((candidate) => (
            <Link
              key={candidate.slug}
              to={`/work/${candidate.slug}`}
              className="border border-black p-4 hover:bg-black/5 transition-colors flex flex-col justify-between gap-2"
            >
              <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                {candidate.category}
              </span>
              <span className="text-sm font-black uppercase tracking-tight">
                {candidate.title}
              </span>
              <span className="text-xs text-gray-600">{candidate.client}</span>
            </Link>
          ))}
        </div>
      </StudioPageShell>
    );
  }

  const prevItem = items[(activeIndex - 1 + items.length) % items.length];
  const nextItem = items[(activeIndex + 1) % items.length];

  const handleCopyHex = async (hex: string) => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHex(hex);
      toast.success(`Copied swatch ${hex}`);
      setTimeout(() => setCopiedHex(null), 1500);
    } catch {
      toast.info(`Color token: ${hex}`);
    }
  };

  const handleCommissionSimilar = () => {
    modalRef.current?.open({
      initialProjectType: item.commissionType,
      initialValues: {
        deliverables: item.formatDimensions,
        rightsUsage: item.rightsScope,
        description: `Case study reference: "${item.title}" for ${item.client}. Seeking matching studio direction (${item.category}).`,
      },
    });
  };

  return (
    <StudioPageShell
      plateCode={`CASE STUDY · 0${activeIndex + 1} · ${item.category.toUpperCase()}`}
      title={item.title}
      subtitle={item.briefSummary}
      accentColor="red"
      actions={
        <>
          <Button
            onClick={handleCommissionSimilar}
            className="bg-black text-white hover:bg-black/90 rounded-none text-xs font-bold uppercase tracking-widest px-5 py-5"
          >
            <Send className="w-3.5 h-3.5 mr-2" />
            Commission Similar Work
          </Button>
          <Link
            to="/#portfolio"
            className="px-4 py-2.5 border-2 border-black bg-white text-black text-xs font-bold uppercase tracking-widest inline-flex items-center gap-2 hover:bg-gray-50 transition-colors"
          >
            All Plates
          </Link>
        </>
      }
    >
      <div className="space-y-10">
        {/* Main Plate Inspector + Metadata Grid */}
        <section className="bg-white text-black border-2 border-black grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 border-b-2 lg:border-b-0 lg:border-r-2 border-black bg-black/5 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/15 bg-white">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                <Layers className="w-3.5 h-3.5" />
                Proof Separation Preview
              </div>
              <div className="flex items-center gap-1">
                {(
                  [
                    ["wireframe", "01. Wireframe"],
                    ["colorblock", "02. Color Block"],
                    ["press", "03. Press Master"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStage(key)}
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                      stage === key
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-black/20 hover:border-black"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden aspect-[4/3] bg-neutral-100">
              <img
                src={item.img}
                alt={`${item.title} (${stage})`}
                loading="lazy"
                decoding="async"
                className={`w-full h-full object-cover transition-all duration-500 ${
                  stage === "wireframe"
                    ? "grayscale contrast-150 brightness-110 opacity-75"
                    : stage === "colorblock"
                      ? "saturate-150 contrast-125"
                      : ""
                }`}
              />
              {stage === "wireframe" && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
                    backgroundSize: "36px 36px",
                  }}
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="divide-y divide-black/15">
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">
                  Client Publication / Partner
                </p>
                <p className="text-lg font-black uppercase tracking-tight">
                  {item.client}
                </p>
              </div>
              <div className="p-5 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">
                    Discipline
                  </p>
                  <p className="text-xs font-bold uppercase">{item.commissionType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">
                    Turnaround
                  </p>
                  <p className="text-xs font-bold uppercase">{item.turnaround}</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">
                  Format &amp; Mechanical Dimensions
                </p>
                <p className="text-xs font-semibold text-gray-800">
                  {item.formatDimensions}
                </p>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">
                  Paper Stock / Production Spec
                </p>
                <p className="text-xs font-semibold text-gray-800">{item.paperStock}</p>
              </div>
              <div className="p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1">
                  Usage &amp; Licensing Scope
                </p>
                <p className="text-xs font-semibold text-gray-800">{item.rightsScope}</p>
              </div>
              <div
                className="p-5 text-white"
                style={{ backgroundColor: "var(--studio-blue)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" />
                  Published Impact
                </p>
                <p className="text-sm font-bold">{item.impactMetric}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Challenge & Solution Brief */}
        <section className="bg-white text-black border-2 border-black grid grid-cols-1 md:grid-cols-2">
          <div className="p-7 border-b-2 md:border-b-0 md:border-r-2 border-black">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
              01 · Editorial Challenge
            </p>
            <h2 className="text-lg font-black uppercase tracking-tight mb-3">
              Structural Constraints &amp; Brief
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{item.challenge}</p>
          </div>
          <div className="p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
              02 · Studio Solution
            </p>
            <h2 className="text-lg font-black uppercase tracking-tight mb-3">
              Grid Architecture &amp; Execution
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">{item.solution}</p>
          </div>
        </section>

        {/* Process Sequence + Swatch Kit + Deliverables */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white text-black border-2 border-black p-7">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4">
              Production Sequence &amp; Studio Sign-Off
            </p>
            <div className="space-y-3">
              {item.processSteps.map((step) => (
                <div
                  key={step}
                  className="p-3.5 border border-black/15 bg-black/[0.02] text-xs font-semibold text-gray-800"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 bg-white text-black border-2 border-black p-7 flex flex-col justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">
                Deliverable Master Pack
              </p>
              <p className="text-sm font-bold text-gray-900 mb-6">
                {item.deliverableSpecs}
              </p>

              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">
                Press Ink Palette (Click to Copy)
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {item.palette.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => handleCopyHex(hex)}
                    className="border border-black p-2.5 flex items-center justify-between text-left hover:bg-black/5 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 border border-black/20 inline-block shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs font-mono font-bold">{hex}</span>
                    </span>
                    {copiedHex === hex ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleCommissionSimilar}
              className="w-full rounded-none text-xs font-bold uppercase tracking-widest py-5 text-white hover:opacity-90"
              style={{ backgroundColor: "var(--studio-red)" }}
            >
              Book This Workflow ({item.turnaround})
            </Button>
          </div>
        </section>

        {/* Previous / Next Case Study Footer Nav */}
        <section className="grid grid-cols-1 sm:grid-cols-2 border-2 border-black bg-white text-black">
          <Link
            to={`/work/${prevItem.slug}`}
            className="p-6 border-b-2 sm:border-b-0 sm:border-r-2 border-black hover:bg-black/5 transition-colors flex items-center justify-between gap-4"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                Previous Dossier
              </span>
              <span className="text-base font-black uppercase tracking-tight">
                {prevItem.title}
              </span>
            </div>
            <ArrowLeft className="w-4 h-4 shrink-0" />
          </Link>
          <Link
            to={`/work/${nextItem.slug}`}
            className="p-6 hover:bg-black/5 transition-colors flex items-center justify-between gap-4"
          >
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                Next Dossier
              </span>
              <span className="text-base font-black uppercase tracking-tight">
                {nextItem.title}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </Link>
        </section>
      </div>

      <CommissionModal ref={modalRef} />
    </StudioPageShell>
  );
}
