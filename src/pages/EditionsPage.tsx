import { useRef, useState } from "react";
import { Award, Check, Copy, Frame, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommissionModal, {
  type CommissionModalHandle,
} from "@/components/CommissionModal";
import StudioPageShell from "@/components/StudioPageShell";
import { STUDIO_CONFIG, type PrintEditionItem } from "@/config/studio.config";
import { formatUsd } from "@/lib/pricing";
import { toast } from "sonner";

export default function EditionsPage() {
  const modalRef = useRef<CommissionModalHandle>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCert = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Certificate reference ${code} copied`);
      setTimeout(() => setCopiedCode(null), 1500);
    } catch {
      toast.info(`Certificate ID: ${code}`);
    }
  };

  const handleReserveEdition = (edition: PrintEditionItem) => {
    modalRef.current?.open({
      initialProjectType: "Poster / Campaign",
      initialValues: {
        deliverables: `Collector Print Edition: ${edition.title} (${edition.dimensions})`,
        budget: formatUsd(edition.priceUsd),
        rightsUsage: "Personal / archival collector display (unsigned commercial rights excluded)",
        description: `Edition Reservation Request · Certificate ${edition.certificateCode} · Print Method: ${edition.printMethod} on ${edition.paperWeight}.`,
      },
    });
  };

  return (
    <StudioPageShell
      plateCode="COLLECTOR EDITIONS · ARCHIVE SHOP"
      title="Numbered Archival Print Editions"
      subtitle="Signed small-batch silkscreens, risograph studies, and cotton giclée plates pulled from our flagship studio themes. Ships flat in acid-free museum folios."
      accentColor="yellow"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {STUDIO_CONFIG.printEditions.map((edition) => {
          const soldCount = edition.editionSize - edition.remainingCount;
          const scarcityPct = Math.round((soldCount / edition.editionSize) * 100);

          return (
            <article
              key={edition.id}
              className="bg-white text-black border-2 border-black flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[16/10] bg-neutral-100 border-b-2 border-black overflow-hidden">
                  <img
                    src={edition.imageUrl}
                    alt={edition.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-3 left-3 bg-black text-white px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest">
                    {edition.remainingCount} / {edition.editionSize} REMAINING
                  </span>
                </div>

                <div className="p-7 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 mb-1">
                        {edition.artist} · {edition.year}
                      </p>
                      <h2 className="text-2xl font-black uppercase tracking-tight">
                        {edition.title}
                      </h2>
                    </div>
                    <p className="text-2xl font-black shrink-0">
                      {formatUsd(edition.priceUsd)}
                    </p>
                  </div>

                  {/* Edition Scarcity Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-gray-500 mb-1">
                      <span>Edition Run Progress</span>
                      <span>{scarcityPct}% Claimed</span>
                    </div>
                    <div className="h-2 bg-gray-200 border border-black overflow-hidden">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${scarcityPct}%`,
                          backgroundColor: "var(--studio-red)",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
                    <div className="p-3 border border-black/15">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                        Paper Stock
                      </p>
                      <p className="font-semibold text-gray-800">{edition.paperWeight}</p>
                    </div>
                    <div className="p-3 border border-black/15">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">
                        Print Process
                      </p>
                      <p className="font-semibold text-gray-800">{edition.printMethod}</p>
                    </div>
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed flex items-start gap-2">
                    <Frame className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" />
                    <span>
                      {edition.dimensions} — {edition.notes}
                    </span>
                  </p>
                </div>
              </div>

              <div className="px-7 py-5 border-t border-black/15 bg-black/[0.02] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleCopyCert(edition.certificateCode)}
                  className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-gray-600 hover:text-black"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{edition.certificateCode}</span>
                  {copiedCode === edition.certificateCode ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>

                <Button
                  onClick={() => handleReserveEdition(edition)}
                  className="bg-black text-white hover:bg-black/90 rounded-none text-xs font-bold uppercase tracking-widest px-5 py-4"
                >
                  <Send className="w-3.5 h-3.5 mr-2" />
                  Reserve Edition
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <CommissionModal ref={modalRef} />
    </StudioPageShell>
  );
}
