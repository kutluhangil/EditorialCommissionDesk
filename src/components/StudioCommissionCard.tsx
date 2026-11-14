import { useState } from "react";
import type {
  Commission,
  CommissionWorkspaceSummary,
  Message,
} from "@contracts/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ALL_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  type CommissionStatus,
} from "@/lib/commission-stages";
import {
  buildCommissionShareUrl,
  downloadCommissionDossierHtml,
  printCommissionDossier,
} from "@/lib/dossier-export";
import { formatUsd } from "@/lib/pricing";
import { StageProgressBar } from "@/components/StageProgressBar";
import type { WorkspaceTab } from "@/components/CommissionWorkspaceModal";
import {
  Download,
  Loader2,
  MessageSquare,
  Printer,
  Send,
  MapPin,
  RotateCcw,
  DollarSign,
  History,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

const STUDIO_REPLY_TEMPLATES = [
  "Sketch Round 1 uploaded — ready for composition feedback.",
  "Pantone & CMYK color study ready for approval.",
  "Final press-ready PDF/X-4 & layered files delivered.",
] as const;

interface StudioCommissionCardProps {
  commission: Commission;
  messages: Message[];
  summary?: CommissionWorkspaceSummary;
  isUpdatingStatus: boolean;
  isSendingReply: boolean;
  onUpdateStatus: (id: number, status: CommissionStatus) => void;
  onStudioReply: (commission: Commission, content: string) => Promise<void>;
  onOpenWorkspace: (commissionId: number, tab: WorkspaceTab) => void;
}

export function StudioCommissionCard({
  commission,
  messages,
  summary,
  isUpdatingStatus,
  isSendingReply,
  onUpdateStatus,
  onStudioReply,
  onOpenWorkspace,
}: StudioCommissionCardProps) {
  const [replyText, setReplyText] = useState("");
  const orderedMessages = [...messages].reverse();

  const handleReplySubmit = async () => {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    await onStudioReply(commission, trimmed);
    setReplyText("");
  };

  return (
    <Card className="rounded-none border-black/15 bg-white">
      <CardHeader className="pb-3 border-b border-black/10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-2 py-0.5">
                #{commission.id}
              </span>
              <CardTitle className="text-sm font-black uppercase tracking-tight">
                {commission.projectType}
              </CardTitle>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Client #{commission.userId} · Submitted{" "}
              {new Date(commission.createdAt).toLocaleDateString()} · Deadline{" "}
              <span className="font-semibold text-black">
                {commission.deadline}
              </span>
            </p>
          </div>
          <Badge
            variant="outline"
            className={`rounded-none text-[10px] uppercase tracking-wider w-fit ${
              STATUS_COLORS[commission.status]
            }`}
          >
            {STATUS_LABELS[commission.status]}
          </Badge>
        </div>

        {/* Live Proofing, Revision & Billing Badges */}
        {summary && (
          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-black/5">
            <button
              type="button"
              onClick={() => onOpenWorkspace(commission.id, "proofing")}
              className="px-2.5 py-1 bg-neutral-100 hover:bg-black hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <MapPin className="w-3 h-3 text-[#e63946]" />
              Pins: {summary.openPinsCount} open / {summary.resolvedPinsCount}{" "}
              resolved · {summary.deliverablesCount} proofs
            </button>
            <button
              type="button"
              onClick={() => onOpenWorkspace(commission.id, "proofing")}
              className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                summary.usedRounds > summary.includedRounds
                  ? "bg-red-100 text-[#e63946]"
                  : "bg-neutral-100 text-gray-800 hover:bg-black hover:text-white transition-colors"
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              Revisions: {summary.usedRounds} / {summary.includedRounds}
            </button>
            <button
              type="button"
              onClick={() => onOpenWorkspace(commission.id, "billing")}
              className="px-2.5 py-1 bg-neutral-100 hover:bg-black hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5"
            >
              <DollarSign className="w-3 h-3 text-emerald-700" />
              Paid: {formatUsd(summary.paidAmountUsd)} /{" "}
              {formatUsd(summary.totalAmountUsd)}
            </button>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
              Deliverables
            </p>
            <p className="text-gray-800 leading-relaxed">
              {commission.deliverables}
            </p>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
              Budget
            </p>
            <p className="font-semibold text-gray-800">{commission.budget}</p>
          </div>
          <div>
            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
              Rights & Usage
            </p>
            <p className="text-gray-800">{commission.rightsUsage}</p>
          </div>
        </div>

        {(commission.description || commission.visualReferences) && (
          <div className="mt-4 pt-3 border-t border-black/5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {commission.description && (
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                  Brief Notes
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {commission.description}
                </p>
              </div>
            )}
            {commission.visualReferences && (
              <div>
                <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                  Visual References
                </p>
                <p className="text-gray-600 leading-relaxed break-words">
                  {commission.visualReferences}
                </p>
              </div>
            )}
          </div>
        )}

        <StageProgressBar status={commission.status} />

        {/* Stage Controls */}
        <div className="mt-4 pt-3 border-t border-black/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
            Move Stage
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_STATUSES.map((stage) => {
              const active = commission.status === stage;
              return (
                <button
                  key={stage}
                  type="button"
                  disabled={isUpdatingStatus || active}
                  onClick={() => onUpdateStatus(commission.id, stage)}
                  className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
                    active
                      ? stage === "cancelled"
                        ? "bg-[#e63946] text-white border-[#e63946]"
                        : "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-gray-200 hover:border-black disabled:opacity-50"
                  }`}
                >
                  {STATUS_LABELS[stage]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inline Commission Thread & Studio Reply */}
        <div className="mt-5 pt-4 border-t border-black/10 bg-neutral-50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
              <MessageSquare className="w-3 h-3" />
              Studio Thread ({orderedMessages.length})
            </span>
          </div>

          {orderedMessages.length > 0 ? (
            <div className="space-y-2 max-h-44 overflow-y-auto mb-3 pr-1">
              {orderedMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`px-3 py-2 text-xs border ${
                    msg.senderType === "studio"
                      ? "bg-[#1d3557] text-white border-[#1d3557]"
                      : "bg-white text-gray-800 border-black/10"
                  }`}
                >
                  <div className="flex items-center justify-between text-[9px] uppercase tracking-widest opacity-70 mb-0.5">
                    <span>
                      {msg.senderType === "studio"
                        ? "Atelier Mondrian (Studio)"
                        : `Client #${msg.userId}`}
                    </span>
                    <span>
                      {new Date(msg.createdAt).toLocaleString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-3">
              No messages attached to this commission yet.
            </p>
          )}

          {/* Quick Studio Templates */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {STUDIO_REPLY_TEMPLATES.map((tpl) => (
              <button
                key={tpl}
                type="button"
                onClick={() => setReplyText(tpl)}
                className="px-2 py-1 text-[10px] bg-white border border-black/15 hover:border-black text-gray-700 text-left transition-colors"
              >
                + {tpl}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={`Reply as studio to Commission #${commission.id}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleReplySubmit();
                }
              }}
              className="rounded-none border-gray-300 bg-white text-xs"
            />
            <Button
              type="button"
              size="sm"
              disabled={isSendingReply || !replyText.trim()}
              onClick={() => void handleReplySubmit()}
              className="bg-[#e63946] text-white hover:bg-[#e63946]/90 rounded-none text-[10px] uppercase tracking-widest px-4"
            >
              {isSendingReply ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Send className="w-3 h-3 mr-1" />
                  Reply
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Workspace & Dossier Footer */}
        <div className="mt-4 pt-3 border-t border-black/10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenWorkspace(commission.id, "proofing")}
              className="rounded-none bg-black text-white hover:bg-black/85 text-[10px] uppercase tracking-widest"
            >
              <MapPin className="w-3 h-3 mr-1" />
              Visual Proofing & Vault
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenWorkspace(commission.id, "billing")}
              className="rounded-none border-black/25 text-[10px] uppercase tracking-widest"
            >
              <DollarSign className="w-3 h-3 mr-1" />
              Billing
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenWorkspace(commission.id, "audit")}
              className="rounded-none border-black/25 text-[10px] uppercase tracking-widest"
            >
              <History className="w-3 h-3 mr-1" />
              Audit Log
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-none border-black/20 text-[10px] uppercase tracking-widest"
              onClick={() => {
                const url = buildCommissionShareUrl(commission);
                void navigator.clipboard?.writeText(url);
                toast.success("Read-only Editor Review link copied");
              }}
            >
              <Share2 className="w-3 h-3 mr-1.5" />
              Share Link
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-none border-black/20 text-[10px] uppercase tracking-widest"
              onClick={() => {
                const opened = printCommissionDossier(commission);
                if (!opened) {
                  toast.error("Allow popups to open printable dossier view");
                }
              }}
            >
              <Printer className="w-3 h-3 mr-1.5" />
              Print Dossier
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-none border-black/20 text-[10px] uppercase tracking-widest"
              onClick={() => {
                downloadCommissionDossierHtml(commission);
                toast.success("Downloaded Editorial Dossier (.html)");
              }}
            >
              <Download className="w-3 h-3 mr-1.5" />
              .HTML
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
