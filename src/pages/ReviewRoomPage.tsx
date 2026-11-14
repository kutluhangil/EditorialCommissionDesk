import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Layers,
  Loader2,
  MapPin,
  Printer,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import StudioPageShell from "@/components/StudioPageShell";
import { trpc } from "@/providers/trpc";
import {
  buildReviewRoomUrl,
  downloadCommissionDossierHtml,
  formatCommissionCode,
  parseCommissionShareParam,
  printCommissionDossier,
} from "@/lib/dossier-export";
import { STATUS_LABELS } from "@/lib/commission-stages";
import { formatUsd } from "@/lib/pricing";
import { toast } from "sonner";

const SAMPLE_REVIEW_CODES = [
  "ECD-2026-0001",
  "ECD-2026-0002",
  "ECD-2026-0003",
  "ECD-2026-0004",
] as const;

export default function ReviewRoomPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const commissionId = parseCommissionShareParam(code ?? null);
  const [selectedDeliverableIndex, setSelectedDeliverableIndex] = useState(0);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const workspaceQuery = trpc.commission.workspaceById.useQuery(
    { id: commissionId ?? 0 },
    { enabled: Boolean(commissionId), retry: false },
  );

  const workspace = workspaceQuery.data;

  const handleCopyShareLink = async () => {
    if (!workspace) return;
    const shareUrl = buildReviewRoomUrl(workspace.commission);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      toast.success("Review room URL copied");
      setTimeout(() => setCopiedUrl(false), 1600);
    } catch {
      toast.info(shareUrl);
    }
  };

  return (
    <StudioPageShell
      plateCode={`CLIENT REVIEW ROOM · ${code ? code.toUpperCase() : "UNSET"}`}
      title={
        workspace
          ? `${formatCommissionCode(workspace.commission)} · ${workspace.commission.projectType}`
          : "Proof Inspection & Sign-Off Room"
      }
      subtitle="Shareable art-director review room showing current deliverable separation plates, coordinate annotation pins, revision allowance, and milestone settlement status."
      accentColor="blue"
      actions={
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_REVIEW_CODES.map((sampleCode) => {
            const active = code?.toUpperCase() === sampleCode;
            return (
              <button
                key={sampleCode}
                type="button"
                onClick={() => {
                  setSelectedDeliverableIndex(0);
                  navigate(`/review/${sampleCode}`);
                }}
                className={`px-2.5 py-2 text-[10px] font-mono uppercase tracking-wider border transition-colors ${
                  active
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-600 border-black/25 hover:border-black"
                }`}
              >
                {sampleCode}
              </button>
            );
          })}
        </div>
      }
    >
      {workspaceQuery.isLoading && (
        <div className="bg-white text-black border-2 border-black p-14 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading Proof Room Workspace...
        </div>
      )}

      {!workspaceQuery.isLoading && !workspace && (
        <div className="bg-white text-black border-2 border-black p-10 text-center space-y-4">
          <p className="text-lg font-black uppercase tracking-tight">
            No Review Room Found For &ldquo;{code}&rdquo;
          </p>
          <p className="text-xs text-gray-600 max-w-md mx-auto">
            Select one of the sample commission codes above (e.g. ECD-2026-0001)
            or sign into the studio dashboard to open your live commission room.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button
              onClick={() => navigate("/review/ECD-2026-0001")}
              className="bg-black text-white rounded-none text-xs uppercase tracking-widest"
            >
              Open Sample ECD-2026-0001
            </Button>
            <Link
              to="/login"
              className="px-4 py-2 border border-black text-xs font-bold uppercase tracking-widest"
            >
              Workspace Sign-In
            </Link>
          </div>
        </div>
      )}

      {workspace && (() => {
        const {
          commission,
          deliverables,
          pins,
          milestones,
          revisionState,
        } = workspace;
        const activeDeliverable =
          deliverables[selectedDeliverableIndex] ?? deliverables[0];
        const deliverablePins = activeDeliverable
          ? pins.filter((p) => p.deliverableId === activeDeliverable.id)
          : [];

        const totalPaid = milestones
          .filter((m) => m.status === "paid")
          .reduce((acc, m) => acc + m.amountUsd, 0);
        const totalContract = milestones.reduce(
          (acc, m) => acc + m.amountUsd,
          0,
        );

        return (
          <div className="space-y-8">
            {/* Top Toolbar */}
            <section className="bg-white text-black border-2 border-black p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <span
                  className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                  style={{ backgroundColor: "var(--studio-red)" }}
                >
                  {STATUS_LABELS[commission.status]}
                </span>
                <span className="text-xs font-mono text-gray-600">
                  Target Deadline: {commission.deadline}
                </span>
                <span className="text-xs font-mono text-gray-600">
                  Revisions: {revisionState.usedRounds} /{" "}
                  {revisionState.includedRounds} used
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyShareLink}
                  className="rounded-none border-black text-[10px] font-bold uppercase tracking-widest"
                >
                  {copiedUrl ? (
                    <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  Copy Link
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCommissionDossierHtml(commission)}
                  className="rounded-none border-black text-[10px] font-bold uppercase tracking-widest"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  HTML Dossier
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => printCommissionDossier(commission)}
                  className="rounded-none border-black text-[10px] font-bold uppercase tracking-widest"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print PDF
                </Button>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
                >
                  <span>Annotate in Workspace</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </section>

            {/* Interactive Deliverable Canvas + Pin Log */}
            <section className="grid grid-cols-1 lg:grid-cols-12 border-2 border-black bg-white text-black">
              <div className="lg:col-span-8 border-b-2 lg:border-b-0 lg:border-r-2 border-black flex flex-col">
                <div className="px-5 py-3 border-b border-black/15 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    <Layers className="w-3.5 h-3.5" />
                    Deliverable Plate Switcher
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {deliverables.map((deliv, idx) => (
                      <button
                        key={deliv.id}
                        type="button"
                        onClick={() => setSelectedDeliverableIndex(idx)}
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                          (activeDeliverable?.id ?? 0) === deliv.id
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-600 border-black/20 hover:border-black"
                        }`}
                      >
                        {deliv.versionLabel}
                      </button>
                    ))}
                  </div>
                </div>

                {activeDeliverable ? (
                  <div className="relative aspect-[16/10] bg-neutral-100 overflow-hidden">
                    <img
                      src={activeDeliverable.imageUrl}
                      alt={activeDeliverable.versionLabel}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    {deliverablePins.map((pin, idx) => (
                      <div
                        key={pin.id}
                        title={`${pin.authorName}: ${pin.comment}`}
                        style={{
                          left: `${pin.xPercent}%`,
                          top: `${pin.yPercent}%`,
                          backgroundColor: pin.resolved
                            ? "#10B981"
                            : "var(--studio-red)",
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full border-2 border-white text-white text-[10px] font-black flex items-center justify-center shadow-lg"
                      >
                        {idx + 1}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-xs text-gray-500">
                    No deliverables uploaded yet.
                  </div>
                )}

                {activeDeliverable && (
                  <div className="px-5 py-3 border-t border-black/15 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 bg-black/[0.02]">
                    <span className="font-semibold">
                      {activeDeliverable.fileFormat}
                    </span>
                    <span>{activeDeliverable.notes}</span>
                  </div>
                )}
              </div>

              <div className="lg:col-span-4 flex flex-col justify-between">
                <div className="p-6 space-y-4 overflow-y-auto max-h-[460px]">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Annotation Pins ({deliverablePins.length})
                    </p>
                  </div>

                  {deliverablePins.length === 0 ? (
                    <p className="text-xs text-gray-500 py-4">
                      Zero annotation pins on this plate.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {deliverablePins.map((pin, idx) => (
                        <div
                          key={pin.id}
                          className="p-3.5 border border-black/15 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span>
                              #{idx + 1} · {pin.authorName} ({pin.xPercent}%,{" "}
                              {pin.yPercent}%)
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 ${
                                pin.resolved
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }`}
                            >
                              {pin.resolved ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" />
                                  Resolved
                                </>
                              ) : (
                                <>
                                  <Clock className="w-3 h-3" />
                                  Open
                                </>
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {pin.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Milestone Settlement Panel */}
                <div className="border-t-2 border-black p-6 bg-black/[0.02] space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Milestones Settled
                    </p>
                    <span className="text-xs font-black">
                      {formatUsd(totalPaid)} / {formatUsd(totalContract)}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {milestones.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-[11px]"
                      >
                        <span className="truncate pr-2">{m.title}</span>
                        <span
                          className={`font-mono font-bold uppercase ${
                            m.status === "paid"
                              ? "text-emerald-600"
                              : "text-gray-500"
                          }`}
                        >
                          {formatUsd(m.amountUsd)} · {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Brief Summary Box */}
            <section className="bg-white text-black border-2 border-black p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Deliverables Scope
                </p>
                <p className="text-xs font-semibold text-gray-800">
                  {commission.deliverables}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Usage Rights &amp; Territory
                </p>
                <p className="text-xs font-semibold text-gray-800">
                  {commission.rightsUsage}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  Editorial Notes
                </p>
                <p className="text-xs text-gray-700 leading-relaxed">
                  {commission.description}
                </p>
              </div>
            </section>
          </div>
        );
      })()}
    </StudioPageShell>
  );
}
