import { useState, useRef } from "react";
import type { CommissionWorkspaceData, ProofStage } from "@contracts/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/commission-stages";
import { formatUsd } from "@/lib/pricing";
import {
  buildCommissionShareUrl,
  formatCommissionCode,
  printCommissionDossier,
  printMilestoneInvoice,
} from "@/lib/dossier-export";
import { toast } from "sonner";
import {
  X,
  MapPin,
  CheckCircle2,
  RotateCcw,
  Layers,
  Lock,
  Unlock,
  Download,
  DollarSign,
  Printer,
  History,
  Share2,
  Copy,
  Check,
  AlertTriangle,
  Plus,
  Loader2,
  Columns2,
  Eye,
  ShieldCheck,
} from "lucide-react";

export type WorkspaceTab = "proofing" | "vault" | "billing" | "audit";

interface CommissionWorkspaceModalProps {
  commissionId: number | null;
  initialTab?: WorkspaceTab;
  readOnlyGuest?: boolean;
  onClose: () => void;
}

const PROOF_STAGE_LABELS: Record<ProofStage, string> = {
  wireframe: "01. Wireframe",
  color_study: "02. Spot Color",
  final_press: "03. Press Master",
};

const QUICK_PROOF_PRESETS: ReadonlyArray<{
  label: string;
  versionLabel: string;
  stage: ProofStage;
  imageUrl: string;
  fileFormat: string;
  notes: string;
  lockedUntilPaid: boolean;
}> = [
  {
    label: "+ Wireframe Grid v1",
    versionLabel: "v1 · Compositional Wireframe",
    stage: "wireframe",
    imageUrl: "/proof-sketch-grid.svg",
    fileFormat: "SVG Grid Blueprint · 12-Col",
    notes: "12-column compositional blocking with 5mm bleed guides.",
    lockedUntilPaid: false,
  },
  {
    label: "+ Spot Color Proof v2",
    versionLabel: "v2 · Pantone Spot Color Study",
    stage: "color_study",
    imageUrl: "/proof-color-study.svg",
    fileFormat: "PDF Proof · PMS 485C / 534C / 1375C",
    notes: "Uncoated stock ink density calibration proof.",
    lockedUntilPaid: false,
  },
  {
    label: "+ Final Press Master v3 (Locked)",
    versionLabel: "v3 · Final Press Master Package",
    stage: "final_press",
    imageUrl: "/proof-final-press.svg",
    fileFormat: "PDF/X-4 + Layered PSD + 16-bit TIFF",
    notes: "Press-ready master unlocked automatically upon final milestone settlement.",
    lockedUntilPaid: true,
  },
];

function WorkspaceInner({
  commissionId,
  initialTab,
  readOnlyGuest,
  onClose,
}: {
  commissionId: number;
  initialTab: WorkspaceTab;
  readOnlyGuest: boolean;
  onClose: () => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";
  const canInteract = isAuthenticated && !readOnlyGuest;

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<
    number | null
  >(null);
  const [splitCompare, setSplitCompare] = useState(false);

  // Coordinate Pin Annotation drafting state
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const [draftPin, setDraftPin] = useState<{
    xPercent: number;
    yPercent: number;
  } | null>(null);
  const [pinComment, setPinComment] = useState("");
  const [highlightedPinId, setHighlightedPinId] = useState<number | null>(null);

  // Revision round form state
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");

  // Admin deliverable upload state
  const [uploadVersion, setUploadVersion] = useState("v2 · Revised Proof");
  const [uploadStage, setUploadStage] = useState<ProofStage>("color_study");
  const [uploadUrl, setUploadUrl] = useState("/proof-color-study.svg");
  const [uploadFormat, setUploadFormat] = useState("PDF Proof · CMYK 300 DPI");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadLocked, setUploadLocked] = useState(false);

  // Copy link feedback
  const [copiedShare, setCopiedShare] = useState(false);

  const {
    data: workspace,
    isLoading,
    error,
  } = trpc.commission.workspaceById.useQuery(
    { id: commissionId },
    { enabled: commissionId > 0 },
  );

  const invalidateWorkspace = async () => {
    await utils.commission.workspaceById.invalidate({ id: commissionId });
    await utils.commission.workspacesOverview.invalidate();
    await utils.commission.list.invalidate();
    await utils.commission.listAll.invalidate();
    await utils.message.listAll.invalidate();
    await utils.message.list.invalidate();
  };

  const addPinMutation = trpc.commission.addPin.useMutation({
    onSuccess: async () => {
      toast.success("Visual pin added to proof");
      setDraftPin(null);
      setPinComment("");
      await invalidateWorkspace();
    },
    onError: (err) => toast.error(err.message || "Failed to place pin"),
  });

  const togglePinMutation = trpc.commission.togglePinResolved.useMutation({
    onSuccess: async (pin) => {
      toast.success(pin.resolved ? "Pin marked resolved" : "Pin reopened");
      await invalidateWorkspace();
    },
    onError: (err) => toast.error(err.message || "Failed to update pin"),
  });

  const uploadDeliverableMutation = trpc.commission.uploadDeliverable.useMutation(
    {
      onSuccess: async (created) => {
        toast.success(`Published ${created.versionLabel}`);
        setSelectedDeliverableId(created.id);
        setUploadNotes("");
        await invalidateWorkspace();
      },
      onError: (err) =>
        toast.error(err.message || "Failed to publish deliverable"),
    },
  );

  const requestRevisionMutation = trpc.commission.requestRevision.useMutation({
    onSuccess: async (res) => {
      setRevisionNotes("");
      setRevisionOpen(false);
      if (res.extraInvoiceAdded) {
        toast.warning(
          `Revision #${res.revisionState.usedRounds} logged (+${formatUsd(res.extraInvoiceAdded.amountUsd)} surcharge invoice generated)`,
        );
      } else {
        toast.success(
          `Revision round ${res.revisionState.usedRounds}/${res.revisionState.includedRounds} recorded`,
        );
      }
      await invalidateWorkspace();
    },
    onError: (err) =>
      toast.error(err.message || "Failed to submit revision request"),
  });

  const payMilestoneMutation = trpc.commission.payMilestone.useMutation({
    onSuccess: async (res) => {
      if (res.unlockedDeliverables > 0) {
        toast.success(
          `${res.milestone?.title ?? "Milestone"} paid! Final press master files unlocked.`,
        );
      } else {
        toast.success(`${res.milestone?.title ?? "Milestone"} marked Paid.`);
      }
      await invalidateWorkspace();
    },
    onError: (err) => toast.error(err.message || "Payment update failed"),
  });

  if (isLoading) {
    return (
      <div className="bg-white p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="text-xs uppercase tracking-widest text-gray-500">
          Loading Commission Workspace...
        </p>
      </div>
    );
  }

  if (error || !workspace) {
    return (
      <div className="bg-white p-12 text-center">
        <p className="text-sm font-bold uppercase mb-2">Workspace Unavailable</p>
        <p className="text-xs text-gray-500 mb-4">
          {error?.message || "Requested commission could not be loaded."}
        </p>
        <Button onClick={onClose} className="rounded-none bg-black text-white">
          Close
        </Button>
      </div>
    );
  }

  const ws: CommissionWorkspaceData = workspace;
  const { commission, deliverables, pins, milestones, revisionState, auditLogs } =
    ws;

  const activeDeliverable =
    deliverables.find((d) => d.id === selectedDeliverableId) ??
    deliverables[deliverables.length - 1] ??
    null;

  const firstDeliverable = deliverables[0] ?? null;

  const pinsForActive = activeDeliverable
    ? pins.filter((p) => p.deliverableId === activeDeliverable.id)
    : [];

  const openPinsCount = pins.filter((p) => !p.resolved).length;
  const totalContractUsd = milestones.reduce((sum, m) => sum + m.amountUsd, 0);
  const paidUsd = milestones
    .filter((m) => m.status === "paid")
    .reduce((sum, m) => sum + m.amountUsd, 0);
  const remainingUsd = Math.max(0, totalContractUsd - paidUsd);
  const paidMilestonesCount = milestones.filter(
    (m) => m.status === "paid",
  ).length;
  const commissionCode = formatCommissionCode(commission);
  const shareUrl = buildCommissionShareUrl(commission);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canInteract || !activeDeliverable || !imageContainerRef.current) return;
    const rect = imageContainerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const xPercent = Math.max(
      2,
      Math.min(98, Number((((e.clientX - rect.left) / rect.width) * 100).toFixed(1))),
    );
    const yPercent = Math.max(
      2,
      Math.min(98, Number((((e.clientY - rect.top) / rect.height) * 100).toFixed(1))),
    );
    setDraftPin({ xPercent, yPercent });
  };

  const handleSubmitPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftPin || !activeDeliverable || !pinComment.trim()) return;
    addPinMutation.mutate({
      commissionId: commission.id,
      deliverableId: activeDeliverable.id,
      xPercent: draftPin.xPercent,
      yPercent: draftPin.yPercent,
      comment: pinComment.trim(),
    });
  };

  const handleCopyShareLink = () => {
    void navigator.clipboard?.writeText(shareUrl);
    setCopiedShare(true);
    toast.success("Read-only Editor Review link copied");
    setTimeout(() => setCopiedShare(false), 1800);
  };

  return (
    <div className="bg-white border-2 border-black flex flex-col max-h-[90vh]">
      {/* Top Mondrian Workspace Bar */}
      <div className="bg-black text-white px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <span
            className="px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white"
            style={{ backgroundColor: "var(--studio-red)" }}
          >
            {commissionCode}
          </span>
          <h2 className="text-sm sm:text-base font-black uppercase tracking-tight truncate">
            {commission.projectType}
          </h2>
          <Badge
            variant="outline"
            className={`rounded-none text-[10px] uppercase tracking-wider bg-white ${
              STATUS_COLORS[commission.status]
            }`}
          >
            {STATUS_LABELS[commission.status]}
          </Badge>
          {readOnlyGuest && (
            <span className="px-2 py-0.5 bg-[#f4a261] text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
              <Eye className="w-3 h-3" />
              Guest Editor View
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white shrink-0"
          aria-label="Close workspace"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-black/15 px-6 bg-neutral-50 flex flex-wrap gap-1 shrink-0">
        {[
          {
            id: "proofing" as const,
            label: `Visual Proofing (${openPinsCount} open pins)`,
            icon: MapPin,
          },
          {
            id: "vault" as const,
            label: `Deliverables Vault (${deliverables.length})`,
            icon: Layers,
          },
          {
            id: "billing" as const,
            label: `Billing & Invoices (${paidMilestonesCount}/${milestones.length})`,
            icon: DollarSign,
          },
          {
            id: "audit" as const,
            label: `Audit Trail & Share (${auditLogs.length})`,
            icon: History,
          },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5 border-b-2 transition-colors ${
                active
                  ? "border-[var(--studio-red)] text-black bg-white"
                  : "border-transparent text-gray-500 hover:text-black"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === "proofing" && (
          <div className="space-y-5">
            {/* Revision Round Counter & Scope Guard */}
            <div className="border border-black bg-neutral-50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Scope Creep Guard · Revision Budget
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-black">
                      {revisionState.usedRounds} / {revisionState.includedRounds}{" "}
                      Included Rounds Used
                    </span>
                    {revisionState.usedRounds >= revisionState.includedRounds ? (
                      <span className="px-2 py-0.5 bg-[#e63946] text-white text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        +{formatUsd(revisionState.extraRoundFeeUsd)} / Extra Round
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold uppercase tracking-wider">
                        Within Contract Cap
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {canInteract && (
                <Button
                  type="button"
                  size="sm"
                  variant={
                    revisionState.usedRounds >= revisionState.includedRounds
                      ? "destructive"
                      : "outline"
                  }
                  onClick={() => setRevisionOpen((v) => !v)}
                  className="rounded-none text-[10px] uppercase tracking-widest border-black"
                >
                  <RotateCcw className="w-3 h-3 mr-1.5" />
                  Request Revision Round
                </Button>
              )}
            </div>

            {revisionOpen && canInteract && (
              <div className="border border-black p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Submit Formal Revision Request (#{revisionState.usedRounds + 1})
                  </p>
                  {revisionState.usedRounds >= revisionState.includedRounds && (
                    <span className="text-[11px] font-bold text-[#e63946]">
                      Note: Exceeds {revisionState.includedRounds} included rounds — adds{" "}
                      {formatUsd(revisionState.extraRoundFeeUsd)} invoice item
                    </span>
                  )}
                </div>
                <Textarea
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  placeholder="Summarize consolidated pin changes requested for the next proof version..."
                  className="rounded-none border-gray-300 text-xs min-h-[70px]"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setRevisionOpen(false)}
                    className="rounded-none text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      requestRevisionMutation.isPending || !revisionNotes.trim()
                    }
                    onClick={() =>
                      requestRevisionMutation.mutate({
                        commissionId: commission.id,
                        notes: revisionNotes.trim(),
                      })
                    }
                    className="rounded-none bg-black text-white text-xs uppercase tracking-widest"
                  >
                    {requestRevisionMutation.isPending ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : null}
                    Confirm Revision Round
                  </Button>
                </div>
              </div>
            )}

            {/* Version Picker & Comparison Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {deliverables.map((d) => {
                  const active = activeDeliverable?.id === d.id;
                  const count = pins.filter((p) => p.deliverableId === d.id).length;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => {
                        setSelectedDeliverableId(d.id);
                        setDraftPin(null);
                      }}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                        active
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-700 border-black/20 hover:border-black"
                      }`}
                    >
                      {d.versionLabel} ({count})
                    </button>
                  );
                })}
              </div>

              {deliverables.length > 1 &&
                firstDeliverable &&
                activeDeliverable &&
                firstDeliverable.id !== activeDeliverable.id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSplitCompare((v) => !v)}
                    className={`rounded-none text-[10px] uppercase tracking-widest border-black ${
                      splitCompare ? "bg-[#1d3557] text-white" : ""
                    }`}
                  >
                    <Columns2 className="w-3 h-3 mr-1.5" />
                    {splitCompare ? "Exit v1 Comparison" : "Compare v1 vs Current"}
                  </Button>
                )}
            </div>

            {/* Canvas + Pins Sidebar */}
            {activeDeliverable ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-8 space-y-2">
                  <div
                    className={`grid gap-2 ${
                      splitCompare && firstDeliverable
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1"
                    }`}
                  >
                    {splitCompare && firstDeliverable && (
                      <div className="border border-black/20 bg-neutral-100 relative overflow-hidden">
                        <span className="absolute top-2 left-2 z-10 bg-black text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                          BASELINE · {firstDeliverable.versionLabel}
                        </span>
                        <img
                          src={firstDeliverable.imageUrl}
                          alt={firstDeliverable.versionLabel}
                          className="w-full h-auto block select-none"
                        />
                      </div>
                    )}

                    <div
                      ref={imageContainerRef}
                      onClick={handleCanvasClick}
                      className={`border-2 border-black bg-neutral-100 relative overflow-hidden ${
                        canInteract ? "cursor-crosshair" : "cursor-default"
                      }`}
                    >
                      <span className="absolute top-2 left-2 z-10 bg-black/90 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest pointer-events-none">
                        {activeDeliverable.versionLabel}
                        {canInteract ? " · CLICK ANYWHERE TO DROP PIN" : ""}
                      </span>

                      <img
                        src={activeDeliverable.imageUrl}
                        alt={activeDeliverable.versionLabel}
                        className="w-full h-auto block select-none"
                      />

                      {/* Rendered Coordinate Pins */}
                      {pinsForActive.map((pin, idx) => {
                        const highlighted = highlightedPinId === pin.id;
                        return (
                          <button
                            key={pin.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHighlightedPinId(pin.id);
                            }}
                            style={{
                              left: `${pin.xPercent}%`,
                              top: `${pin.yPercent}%`,
                            }}
                            title={`#${idx + 1}: ${pin.comment}`}
                            className={`-translate-x-1/2 -translate-y-1/2 absolute z-20 w-7 h-7 rounded-full text-[11px] font-black text-white border-2 border-white shadow-md flex items-center justify-center transition-transform ${
                              highlighted ? "scale-125 ring-2 ring-black" : ""
                            } ${
                              pin.resolved ? "bg-emerald-600" : "bg-[#e63946]"
                            }`}
                          >
                            {idx + 1}
                          </button>
                        );
                      })}

                      {/* Draft Pin Target */}
                      {draftPin && (
                        <div
                          style={{
                            left: `${draftPin.xPercent}%`,
                            top: `${draftPin.yPercent}%`,
                          }}
                          className="-translate-x-1/2 -translate-y-1/2 absolute z-30 w-7 h-7 rounded-full bg-[#f4a261] text-black border-2 border-black font-black text-xs flex items-center justify-center animate-pulse"
                        >
                          +
                        </div>
                      )}
                    </div>
                  </div>

                  {/* New Pin Comment Bar */}
                  {draftPin && canInteract && (
                    <form
                      onSubmit={handleSubmitPin}
                      className="border-2 border-[#f4a261] bg-[#f4a261]/10 p-3 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center"
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-black text-white shrink-0">
                        Pin @ {draftPin.xPercent}%, {draftPin.yPercent}%
                      </span>
                      <Input
                        autoFocus
                        value={pinComment}
                        onChange={(e) => setPinComment(e.target.value)}
                        placeholder="Describe revision or note for this exact coordinate..."
                        className="rounded-none border-black/25 bg-white text-xs flex-1"
                      />
                      <div className="flex gap-1.5">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={addPinMutation.isPending || !pinComment.trim()}
                          className="rounded-none bg-[#e63946] text-white text-[10px] uppercase tracking-widest"
                        >
                          Save Pin
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setDraftPin(null)}
                          className="rounded-none text-[10px] uppercase"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Pin Annotations List */}
                <div className="lg:col-span-4 border border-black/15 bg-neutral-50 p-4 flex flex-col">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/10">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Annotations ({pinsForActive.length})
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {activeDeliverable.fileFormat}
                    </span>
                  </div>

                  {pinsForActive.length > 0 ? (
                    <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
                      {pinsForActive.map((pin, idx) => (
                        <div
                          key={pin.id}
                          onMouseEnter={() => setHighlightedPinId(pin.id)}
                          onMouseLeave={() => setHighlightedPinId(null)}
                          className={`p-3 border bg-white text-xs transition-colors ${
                            highlightedPinId === pin.id
                              ? "border-black"
                              : "border-black/10"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-black text-white inline-flex items-center justify-center ${
                                  pin.resolved ? "bg-emerald-600" : "bg-[#e63946]"
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <span className="font-bold text-[11px]">
                                {pin.authorName}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-gray-400">
                              {pin.xPercent}%,{pin.yPercent}%
                            </span>
                          </div>
                          <p className="text-gray-700 leading-relaxed mb-2">
                            {pin.comment}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-black/5">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-widest ${
                                pin.resolved
                                  ? "text-emerald-700"
                                  : "text-[#e63946]"
                              }`}
                            >
                              {pin.resolved ? "Resolved" : "Open Feedback"}
                            </span>
                            {canInteract && (
                              <button
                                type="button"
                                disabled={togglePinMutation.isPending}
                                onClick={() =>
                                  togglePinMutation.mutate({ pinId: pin.id })
                                }
                                className="text-[10px] font-bold uppercase tracking-wider underline hover:text-[#e63946]"
                              >
                                {pin.resolved ? "Reopen" : "Mark Resolved"}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-8 text-gray-400">
                      <MapPin className="w-6 h-6 mb-2 opacity-40" />
                      <p className="text-xs">
                        {canInteract
                          ? "Click anywhere on the proof image to pin coordinate feedback."
                          : "No coordinate annotations on this version yet."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-black/15 p-12 text-center text-xs text-gray-500">
                No proof deliverables uploaded yet.
              </div>
            )}
          </div>
        )}

        {activeTab === "vault" && (
          <div className="space-y-6">
            {isAdmin && !readOnlyGuest && (
              <div className="border-2 border-black p-5 bg-neutral-50 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#e63946]">
                      Studio Admin · Deliverables Publisher
                    </p>
                    <h3 className="text-sm font-black uppercase">
                      Stage New Proof or Final Press Deliverable
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_PROOF_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setUploadVersion(preset.versionLabel);
                          setUploadStage(preset.stage);
                          setUploadUrl(preset.imageUrl);
                          setUploadFormat(preset.fileFormat);
                          setUploadNotes(preset.notes);
                          setUploadLocked(preset.lockedUntilPaid);
                        }}
                        className="px-2.5 py-1 bg-white border border-black/20 hover:border-black text-[10px] font-bold uppercase tracking-wider"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={uploadVersion}
                    onChange={(e) => setUploadVersion(e.target.value)}
                    placeholder="Version label (e.g., v2 · Spot Color)"
                    className="rounded-none bg-white border-gray-300 text-xs"
                  />
                  <select
                    value={uploadStage}
                    onChange={(e) => setUploadStage(e.target.value as ProofStage)}
                    className="h-9 px-3 border border-gray-300 bg-white text-xs font-medium"
                  >
                    <option value="wireframe">01. Wireframe / Sketch</option>
                    <option value="color_study">02. Pantone Spot Study</option>
                    <option value="final_press">03. Final Press Master</option>
                  </select>
                  <Input
                    value={uploadFormat}
                    onChange={(e) => setUploadFormat(e.target.value)}
                    placeholder="File Format (PDF/X-4, TIFF...)"
                    className="rounded-none bg-white border-gray-300 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Input
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    placeholder="Proof image path or URL (/proof-final-press.svg)"
                    className="rounded-none bg-white border-gray-300 text-xs"
                  />
                  <Input
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    placeholder="Production notes for client..."
                    className="rounded-none bg-white border-gray-300 text-xs"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uploadLocked}
                      onChange={(e) => setUploadLocked(e.target.checked)}
                    />
                    Lock master file download until all milestones are paid
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      uploadDeliverableMutation.isPending ||
                      !uploadVersion.trim() ||
                      !uploadUrl.trim()
                    }
                    onClick={() =>
                      uploadDeliverableMutation.mutate({
                        commissionId: commission.id,
                        versionLabel: uploadVersion.trim(),
                        stage: uploadStage,
                        imageUrl: uploadUrl.trim(),
                        fileFormat: uploadFormat.trim() || "PDF Proof",
                        notes: uploadNotes.trim(),
                        lockedUntilPaid: uploadLocked,
                      })
                    }
                    className="rounded-none bg-[#e63946] text-white hover:bg-[#d62839] text-[10px] uppercase tracking-widest"
                  >
                    {uploadDeliverableMutation.isPending ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3 mr-1" />
                    )}
                    Publish Deliverable Version
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {deliverables.map((item) => {
                const isLocked =
                  item.lockedUntilPaid && commission.status !== "completed";
                return (
                  <div
                    key={item.id}
                    className="border border-black bg-white flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[16/10] bg-neutral-100 border-b border-black/15 relative overflow-hidden">
                        <img
                          src={item.imageUrl}
                          alt={item.versionLabel}
                          className={`w-full h-full object-cover ${
                            isLocked ? "blur-[2px] opacity-60" : ""
                          }`}
                        />
                        <span className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest">
                          {PROOF_STAGE_LABELS[item.stage]}
                        </span>
                        {isLocked ? (
                          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4 text-center">
                            <Lock className="w-6 h-6 text-[#f4a261] mb-1.5" />
                            <p className="text-[11px] font-black uppercase tracking-widest">
                              Escrow Protected Master
                            </p>
                            <p className="text-[10px] text-white/80 mt-0.5">
                              Settle remaining {formatUsd(remainingUsd)} milestone to unlock download
                            </p>
                          </div>
                        ) : (
                          <span className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                            <Unlock className="w-2.5 h-2.5" />
                            Unlocked
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <h4 className="text-sm font-black uppercase tracking-tight">
                          {item.versionLabel}
                        </h4>
                        <p className="text-[10px] font-mono text-gray-500 mt-0.5">
                          {item.fileFormat} ·{" "}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="px-4 py-3 border-t border-black/10 bg-neutral-50 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedDeliverableId(item.id);
                          setActiveTab("proofing");
                        }}
                        className="rounded-none border-black/25 text-[10px] uppercase tracking-widest"
                      >
                        <MapPin className="w-3 h-3 mr-1" />
                        Inspect & Pin
                      </Button>

                      {isLocked ? (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setActiveTab("billing")}
                          className="rounded-none bg-[#e63946] text-white text-[10px] uppercase tracking-widest ml-auto"
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          Pay Final Milestone to Unlock
                        </Button>
                      ) : (
                        <a
                          href={item.imageUrl}
                          download
                          className="inline-flex items-center px-3 py-1.5 bg-black text-white text-[10px] font-bold uppercase tracking-widest ml-auto hover:bg-black/85"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download Asset
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "billing" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-1 bg-black p-1">
              <div className="bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Total Contract + Extras
                </p>
                <p className="text-2xl font-black mt-1">
                  {formatUsd(totalContractUsd)}
                </p>
              </div>
              <div className="bg-[#1d3557] text-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
                  Cleared / Paid
                </p>
                <p className="text-2xl font-black mt-1 text-[#f4a261]">
                  {formatUsd(paidUsd)}
                </p>
              </div>
              <div className="bg-white p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  Balance Remaining
                </p>
                <p
                  className={`text-2xl font-black mt-1 ${
                    remainingUsd === 0 ? "text-emerald-600" : "text-[#e63946]"
                  }`}
                >
                  {formatUsd(remainingUsd)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {milestones.map((milestone, idx) => {
                const isPaid = milestone.status === "paid";
                return (
                  <div
                    key={milestone.id}
                    className="border border-black/15 bg-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-widest">
                          Invoice 0{idx + 1}
                        </span>
                        <h4 className="text-sm font-black uppercase tracking-tight">
                          {milestone.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-[#e63946]"
                          }`}
                        >
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {milestone.percentage > 0
                          ? `${milestone.percentage}% Scheduled Milestone · `
                          : "Scope Add-On · "}
                        {milestone.dueLabel}
                        {milestone.paidAt
                          ? ` · Cleared ${new Date(milestone.paidAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-black mr-2">
                        {formatUsd(milestone.amountUsd)}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const ok = printMilestoneInvoice(
                            commission,
                            milestone,
                            milestones,
                          );
                          if (!ok) {
                            toast.error("Allow popups to open printable invoice");
                          }
                        }}
                        className="rounded-none border-black/25 text-[10px] uppercase tracking-widest"
                      >
                        <Printer className="w-3 h-3 mr-1" />
                        Print Invoice
                      </Button>

                      {!isPaid && canInteract && (
                        <Button
                          type="button"
                          size="sm"
                          disabled={payMilestoneMutation.isPending}
                          onClick={() =>
                            payMilestoneMutation.mutate({
                              commissionId: commission.id,
                              milestoneId: milestone.id,
                            })
                          }
                          className="rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] uppercase tracking-widest"
                        >
                          {payMilestoneMutation.isPending ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                          )}
                          Mark Paid
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-6">
            {/* Shareable Read-Only Editor Review Link */}
            <div className="border-2 border-black bg-[#1d3557] text-white p-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#f4a261] flex items-center gap-1.5 mb-1">
                    <Share2 className="w-3.5 h-3.5" />
                    Read-Only Editor Review Link
                  </p>
                  <p className="text-xs text-white/80">
                    Share this direct review URL with your Managing Editor or Publisher to inspect proofs, pin notes, and licensing status without requiring account credentials.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCopyShareLink}
                    className="rounded-none bg-[#f4a261] text-black hover:bg-[#f4a261]/90 text-[10px] font-bold uppercase tracking-widest"
                  >
                    {copiedShare ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" />
                        Copy Review Link
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const ok = printCommissionDossier(commission);
                      if (!ok) {
                        toast.error("Allow popups to open printable dossier");
                      }
                    }}
                    className="rounded-none border-white/30 bg-transparent text-white hover:bg-white/10 text-[10px] uppercase tracking-widest"
                  >
                    <Printer className="w-3 h-3 mr-1" />
                    Print Dossier
                  </Button>
                </div>
              </div>
              <div className="mt-3 bg-black/30 px-3 py-2 font-mono text-[11px] text-white/90 break-all border border-white/15">
                {shareUrl}
              </div>
            </div>

            {/* Immutable Chronological Audit Log */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#e63946]" />
                Immutable Production & Legal Audit Trail ({auditLogs.length} events)
              </p>
              <div className="border border-black/15 divide-y divide-black/10 bg-white">
                {auditLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest shrink-0 mt-0.5 ${
                          entry.actorRole === "studio"
                            ? "bg-[#1d3557] text-white"
                            : entry.actorRole === "system"
                              ? "bg-[#f4a261] text-black"
                              : "bg-black text-white"
                        }`}
                      >
                        {entry.actorRole}
                      </span>
                      <div>
                        <p className="font-bold text-black">{entry.action}</p>
                        <p className="text-gray-600 mt-0.5">{entry.detail}</p>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono shrink-0 text-left sm:text-right">
                      <p>{entry.actorName}</p>
                      <p>{new Date(entry.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function CommissionWorkspaceModal({
  commissionId,
  initialTab = "proofing",
  readOnlyGuest = false,
  onClose,
}: CommissionWorkspaceModalProps) {
  return (
    <Dialog
      open={commissionId !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-6xl p-0 overflow-hidden border-none rounded-none bg-transparent">
        <DialogTitle className="sr-only">
          Commission Workspace #{commissionId ?? ""}
        </DialogTitle>
        {commissionId !== null && (
          <WorkspaceInner
            key={`${commissionId}-${initialTab}-${String(readOnlyGuest)}`}
            commissionId={commissionId}
            initialTab={initialTab}
            readOnlyGuest={readOnlyGuest}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
