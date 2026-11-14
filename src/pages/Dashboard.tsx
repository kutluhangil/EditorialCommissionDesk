import { useState, useRef, useMemo } from "react";
import { Link } from "react-router";
import type { Commission, CommissionDraft } from "@contracts/types";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { STUDIO_CONFIG } from "@/config/studio.config";
import Navigation from "@/components/Navigation";
import ChatWidget from "@/components/ChatWidget";
import CommissionModal, {
  type CommissionModalHandle,
} from "@/components/CommissionModal";
import {
  CommissionWorkspaceModal,
  type WorkspaceTab,
} from "@/components/CommissionWorkspaceModal";
import {
  ALL_STATUSES,
  PIPELINE_STAGES,
  STATUS_COLORS,
  STATUS_LABELS,
  type CommissionStatus,
} from "@/lib/commission-stages";
import { BUDGET_MIDPOINTS, formatUsd } from "@/lib/pricing";
import {
  buildCommissionShareUrl,
  downloadCommissionDossierHtml,
  printCommissionDossier,
} from "@/lib/dossier-export";
import { StageProgressBar } from "@/components/StageProgressBar";
import { StudioCommissionCard } from "@/components/StudioCommissionCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  ArrowRight,
  Send,
  Clock,
  CheckCircle,
  Loader2,
  FileText,
  Trash2,
  Download,
  MessageSquare,
  PenTool,
  AlertCircle,
  Shield,
  RefreshCw,
  XCircle,
  Printer,
  Search,
  RotateCcw,
  DollarSign,
  LayoutList,
  Kanban,
  Calendar,
  MapPin,
  History,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

type ClientFilter = "all" | "active" | "completed" | "cancelled";
type StudioViewMode = "list" | "kanban" | "capacity";

const CLIENT_FILTER_LABELS: Record<ClientFilter, string> = {
  all: "All",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });

  const modalRef = useRef<CommissionModalHandle>(null);
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";

  const [selectedTab, setSelectedTab] = useState<string | null>(null);
  const [studioViewMode, setStudioViewMode] = useState<StudioViewMode>("list");
  const [studioFilter, setStudioFilter] = useState<"all" | CommissionStatus>(
    "all",
  );
  const [clientSearch, setClientSearch] = useState("");
  const [clientFilter, setClientFilter] = useState<ClientFilter>("all");
  const [workspaceModal, setWorkspaceModal] = useState<{
    commissionId: number;
    tab: WorkspaceTab;
  } | null>(null);

  const activeTab =
    selectedTab && (selectedTab !== "studio" || isAdmin)
      ? selectedTab
      : isAdmin
        ? "studio"
        : "commissions";

  const switchRole = trpc.auth.demoLogin.useMutation({
    onSuccess: async (updatedUser) => {
      utils.auth.me.setData(undefined, updatedUser);
      await utils.invalidate();
      setSelectedTab(updatedUser.role === "admin" ? "studio" : "commissions");
      toast.success(
        updatedUser.role === "admin"
          ? "Switched to Studio Admin Desk"
          : "Switched to Client View",
      );
    },
    onError: (err) => {
      toast.error(err.message || "Failed to switch workspace mode");
    },
  });

  const { data: commissions, isLoading: commissionsLoading } =
    trpc.commission.list.useQuery(undefined, { enabled: !!user });

  const { data: drafts, isLoading: draftsLoading } =
    trpc.draft.list.useQuery(undefined, { enabled: !!user });

  const { data: workspacesOverview } =
    trpc.commission.workspacesOverview.useQuery(undefined, { enabled: !!user });

  const { data: allCommissions, isLoading: studioLoading } =
    trpc.commission.listAll.useQuery(undefined, { enabled: !!user && isAdmin });

  const { data: allMessages } = trpc.message.listAll.useQuery(undefined, {
    enabled: !!user && isAdmin,
  });

  const deleteDraft = trpc.draft.delete.useMutation({
    onSuccess: () => {
      toast.success("Draft deleted");
      utils.draft.list.invalidate();
    },
  });

  const quickCreateCommission = trpc.commission.create.useMutation({
    onSuccess: () => {
      toast.success("Draft submitted as commission!");
      utils.commission.list.invalidate();
      utils.commission.listAll.invalidate();
      utils.commission.workspacesOverview.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit commission");
    },
  });

  const cancelCommission = trpc.commission.cancel.useMutation({
    onSuccess: () => {
      toast.success("Inquiry cancelled");
      utils.commission.list.invalidate();
      utils.commission.listAll.invalidate();
      utils.commission.workspacesOverview.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Could not cancel commission");
    },
  });

  const approveDelivery = trpc.commission.approveDelivery.useMutation({
    onSuccess: (updated) => {
      toast.success(
        `Commission #${updated?.id ?? ""} approved & marked Completed!`,
      );
      utils.commission.list.invalidate();
      utils.commission.listAll.invalidate();
      utils.commission.workspacesOverview.invalidate();
      utils.message.list.invalidate();
      utils.message.listAll.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Could not approve delivery");
    },
  });

  const resetDemo = trpc.commission.resetDemo.useMutation({
    onSuccess: async () => {
      await utils.invalidate();
      toast.success("Demo workspace reset to clean studio seed");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reset demo data");
    },
  });

  const updateStatus = trpc.commission.updateStatus.useMutation({
    onSuccess: (updated) => {
      if (updated) {
        toast.success(
          `#${updated.id} moved to ${STATUS_LABELS[updated.status]}`,
        );
      }
      utils.commission.list.invalidate();
      utils.commission.listAll.invalidate();
      utils.commission.workspacesOverview.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update commission stage");
    },
  });

  const studioReply = trpc.message.studioReply.useMutation({
    onSuccess: (_msg, vars) => {
      toast.success("Studio reply sent");
      utils.message.listAll.invalidate();
      utils.message.list.invalidate();
      if (vars.commissionId) {
        utils.message.byCommission.invalidate({
          commissionId: vars.commissionId,
        });
      }
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send studio reply");
    },
  });

  const handleOpenWorkspace = (commissionId: number, tab: WorkspaceTab) => {
    setWorkspaceModal({ commissionId, tab });
  };

  const handleQuickSubmitDraft = (draft: CommissionDraft) => {
    if (
      !draft.projectType ||
      !draft.deliverables ||
      !draft.deadline ||
      !draft.budget ||
      !draft.rightsUsage
    ) {
      toast.info("Complete all required fields before submitting");
      modalRef.current?.open({ draft });
      return;
    }

    quickCreateCommission.mutate(
      {
        projectType: draft.projectType,
        deliverables: draft.deliverables,
        deadline: draft.deadline,
        budget: draft.budget,
        rightsUsage: draft.rightsUsage,
        visualReferences: draft.visualReferences || undefined,
        description: draft.description || undefined,
      },
      {
        onSuccess: () => {
          deleteDraft.mutate({ id: draft.id });
          setSelectedTab("commissions");
        },
      },
    );
  };

  const openCommissionChat = (commission: Commission) => {
    window.dispatchEvent(
      new CustomEvent("open-commission-chat", {
        detail: {
          commissionId: commission.id,
          title: commission.projectType,
        },
      }),
    );
  };

  const downloadSummary = (commission: Commission) => {
    const summary = `
COMMISSION SUMMARY
Editorial Commission Desk
------------------------
Commission ID: #${commission.id}
Project: ${commission.projectType}
Status: ${STATUS_LABELS[commission.status] || commission.status}
Deliverables: ${commission.deliverables}
Deadline: ${commission.deadline}
Budget: ${commission.budget}
Rights Usage: ${commission.rightsUsage}
${commission.description ? `\nDescription:\n${commission.description}` : ""}
${commission.visualReferences ? `\nVisual References:\n${commission.visualReferences}` : ""}
\nSubmitted: ${new Date(commission.createdAt).toLocaleDateString()}
`;
    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commission-${commission.id}-summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Summary (.txt) downloaded");
  };

  const filteredClientCommissions = useMemo(() => {
    if (!commissions) return [];
    const term = clientSearch.trim().toLowerCase();
    return commissions.filter((c) => {
      if (clientFilter === "completed" && c.status !== "completed") {
        return false;
      }
      if (clientFilter === "cancelled" && c.status !== "cancelled") {
        return false;
      }
      if (
        clientFilter === "active" &&
        (c.status === "completed" || c.status === "cancelled")
      ) {
        return false;
      }
      if (!term) return true;
      return (
        `#${c.id}`.includes(term) ||
        c.projectType.toLowerCase().includes(term) ||
        c.deliverables.toLowerCase().includes(term) ||
        c.budget.toLowerCase().includes(term) ||
        c.rightsUsage.toLowerCase().includes(term) ||
        (c.description || "").toLowerCase().includes(term)
      );
    });
  }, [commissions, clientFilter, clientSearch]);

  const studioAnalytics = useMemo(() => {
    const list = allCommissions ?? [];
    const nonCancelled = list.filter((c) => c.status !== "cancelled");
    const active = list.filter(
      (c) => c.status !== "completed" && c.status !== "cancelled",
    );
    const pipelineValue = active.reduce(
      (sum, item) => sum + (BUDGET_MIDPOINTS[item.budget] ?? 5000),
      0,
    );
    const totalBookValue = nonCancelled.reduce(
      (sum, item) => sum + (BUDGET_MIDPOINTS[item.budget] ?? 5000),
      0,
    );
    return {
      activeCount: active.length,
      pipelineValue,
      totalBookValue,
      inReviewCount: list.filter((c) => c.status === "in_review").length,
      inProgressCount: list.filter((c) => c.status === "in_progress").length,
      awaitingSignOffCount: list.filter((c) => c.status === "delivered").length,
    };
  }, [allCommissions]);

  const sortedTimelineCommissions = useMemo(() => {
    if (!allCommissions) return [];
    return [...allCommissions]
      .filter((c) => c.status !== "cancelled")
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [allCommissions]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const filteredStudioCommissions =
    allCommissions?.filter(
      (c) => studioFilter === "all" || c.status === studioFilter,
    ) ?? [];

  const statsCommissions = isAdmin ? allCommissions : commissions;

  return (
    <div className="min-h-screen bg-neutral-50 text-black">
      <Navigation />
      <ChatWidget />
      <CommissionModal ref={modalRef} />
      <CommissionWorkspaceModal
        commissionId={workspaceModal?.commissionId ?? null}
        initialTab={workspaceModal?.tab ?? "proofing"}
        readOnlyGuest={false}
        onClose={() => setWorkspaceModal(null)}
      />

      <div className="pt-24 pb-16 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-10">
          <div>
            <Link
              to="/"
              className="text-xs font-medium uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-1 mb-3"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Home
            </Link>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight">
                {isAdmin ? "Studio & Client Desk" : "Client Dashboard"}
              </h1>
              <span
                className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                style={{
                  backgroundColor: isAdmin
                    ? "var(--studio-red)"
                    : "var(--studio-blue)",
                }}
              >
                {isAdmin ? "Studio Admin" : "Client View"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {isAdmin
                ? "Manage commissions via List, Kanban Board, or Capacity Calendar; review coordinate proof pins and milestone invoices."
                : "Track inquiries across every stage, drop visual proofing pins, settle milestones, and export official dossiers."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="rounded-none border-black text-xs uppercase tracking-widest"
              disabled={switchRole.isPending}
              onClick={() =>
                switchRole.mutate({ role: isAdmin ? "user" : "admin" })
              }
            >
              <RefreshCw
                className={`w-3 h-3 mr-1.5 ${switchRole.isPending ? "animate-spin" : ""}`}
              />
              {isAdmin ? "Switch to Client" : "Enter Studio Admin"}
            </Button>

            <Button
              size="sm"
              className="bg-black text-white hover:bg-black/85 rounded-none text-xs uppercase tracking-widest"
              onClick={() => modalRef.current?.open()}
            >
              <Send className="w-3 h-3 mr-1.5" />
              New Commission
            </Button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-black/15">
              <div className="w-9 h-9 bg-black text-white flex items-center justify-center text-xs font-bold">
                {user.name?.[0] || "U"}
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">
                  {user.name || "Client"}
                </p>
                <p className="text-[11px] text-gray-400">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-black p-1 mb-10">
          {[
            {
              label: isAdmin ? "All Studio Commissions" : "Total Commissions",
              value: statsCommissions?.length || 0,
              icon: FileText,
            },
            {
              label: "In Progress / Review",
              value:
                statsCommissions?.filter(
                  (c) =>
                    c.status === "in_progress" || c.status === "in_review",
                ).length || 0,
              icon: Clock,
            },
            {
              label: "Delivered / Completed",
              value:
                statsCommissions?.filter(
                  (c) =>
                    c.status === "completed" || c.status === "delivered",
                ).length || 0,
              icon: CheckCircle,
            },
            {
              label: "Saved Drafts",
              value: drafts?.length || 0,
              icon: PenTool,
            },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5">
              <stat.icon
                className="w-4 h-4 mb-2"
                style={{ color: "var(--studio-red)" }}
              />
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setSelectedTab}>
          <TabsList className="bg-transparent border-b border-black/10 rounded-none w-full justify-start gap-6 mb-6">
            {isAdmin && (
              <TabsTrigger
                value="studio"
                className="rounded-none text-xs uppercase tracking-widest data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#e63946] data-[state=active]:text-[#e63946] data-[state=active]:shadow-none px-0 pb-2 flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Studio Desk (Admin)
              </TabsTrigger>
            )}
            <TabsTrigger
              value="commissions"
              className="rounded-none text-xs uppercase tracking-widest data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none px-0 pb-2"
            >
              Commissions
            </TabsTrigger>
            <TabsTrigger
              value="drafts"
              className="rounded-none text-xs uppercase tracking-widest data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-black data-[state=active]:shadow-none px-0 pb-2"
            >
              Drafts
            </TabsTrigger>
          </TabsList>

          {isAdmin && (
            <TabsContent value="studio" className="mt-0">
              {/* Studio Pipeline & Revenue Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 bg-black p-1 mb-6">
                <div
                  className="lg:col-span-4 text-white p-5 flex items-center justify-between"
                  style={{ backgroundColor: "var(--studio-blue)" }}
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1 flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-[#f4a261]" />
                      Estimated Pipeline Value
                    </p>
                    <p className="text-2xl font-black">
                      {formatUsd(studioAnalytics.pipelineValue)}
                    </p>
                    <p className="text-[11px] text-white/70 mt-0.5">
                      {studioAnalytics.activeCount} active briefs · Total book{" "}
                      {formatUsd(studioAnalytics.totalBookValue)}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-5 bg-white p-5 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">
                      Needs Review
                    </p>
                    <p className="text-xl font-black text-[#f4a261]">
                      {studioAnalytics.inReviewCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">
                      In Production
                    </p>
                    <p className="text-xl font-black text-[#1d3557]">
                      {studioAnalytics.inProgressCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">
                      Awaiting Sign-off
                    </p>
                    <p className="text-xl font-black text-[#e63946]">
                      {studioAnalytics.awaitingSignOffCount}
                    </p>
                  </div>
                </div>

                <div className="lg:col-span-3 bg-neutral-50 p-5 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Demo Sandbox
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Restore clean seed state
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={resetDemo.isPending}
                    onClick={() => {
                      if (
                        confirm(
                          "Reset demo commissions, proofs, pins, milestones, drafts, and messages back to initial seed data?",
                        )
                      ) {
                        resetDemo.mutate();
                      }
                    }}
                    className="rounded-none border-black text-[10px] uppercase tracking-widest shrink-0"
                  >
                    <RotateCcw
                      className={`w-3 h-3 mr-1 ${resetDemo.isPending ? "animate-spin" : ""}`}
                    />
                    Reset Demo
                  </Button>
                </div>
              </div>

              {/* View Mode Switcher + Status Filters */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div className="flex border border-black bg-white w-fit">
                  {[
                    { id: "list" as const, label: "List View", icon: LayoutList },
                    { id: "kanban" as const, label: "Kanban Board", icon: Kanban },
                    {
                      id: "capacity" as const,
                      label: "Capacity & Calendar",
                      icon: Calendar,
                    },
                  ].map((view) => {
                    const active = studioViewMode === view.id;
                    return (
                      <button
                        key={view.id}
                        type="button"
                        onClick={() => setStudioViewMode(view.id)}
                        className={`px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors ${
                          active
                            ? "bg-black text-white"
                            : "text-gray-600 hover:bg-neutral-100"
                        }`}
                      >
                        <view.icon className="w-3.5 h-3.5" />
                        {view.label}
                      </button>
                    );
                  })}
                </div>

                {studioViewMode === "list" && (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setStudioFilter("all")}
                      className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                        studioFilter === "all"
                          ? "bg-black text-white border-black"
                          : "bg-white text-gray-600 border-black/15 hover:border-black"
                      }`}
                    >
                      All ({allCommissions?.length || 0})
                    </button>
                    {ALL_STATUSES.map((status) => {
                      const count =
                        allCommissions?.filter((c) => c.status === status)
                          .length || 0;
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => setStudioFilter(status)}
                          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                            studioFilter === status
                              ? "bg-[#e63946] text-white border-[#e63946]"
                              : "bg-white text-gray-600 border-black/15 hover:border-black"
                          }`}
                        >
                          {STATUS_LABELS[status]} ({count})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {studioLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : studioViewMode === "list" ? (
                filteredStudioCommissions.length > 0 ? (
                  <div className="space-y-4">
                    {filteredStudioCommissions.map((commission) => (
                      <StudioCommissionCard
                        key={commission.id}
                        commission={commission}
                        messages={
                          allMessages?.filter(
                            (m) => m.commissionId === commission.id,
                          ) ?? []
                        }
                        summary={workspacesOverview?.[commission.id]}
                        isUpdatingStatus={updateStatus.isPending}
                        isSendingReply={studioReply.isPending}
                        onUpdateStatus={(id, status) =>
                          updateStatus.mutate({ id, status })
                        }
                        onStudioReply={async (target, content) => {
                          await studioReply.mutateAsync({
                            userId: target.userId,
                            commissionId: target.id,
                            content,
                          });
                        }}
                        onOpenWorkspace={handleOpenWorkspace}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white border border-black/10">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-500">
                      No commissions matching this stage filter.
                    </p>
                  </div>
                )
              ) : studioViewMode === "kanban" ? (
                <div className="overflow-x-auto pb-4">
                  <div className="grid grid-cols-6 gap-2 min-w-[1140px]">
                    {PIPELINE_STAGES.map((stage, stageIdx) => {
                      const items =
                        allCommissions?.filter((c) => c.status === stage) ?? [];
                      return (
                        <div
                          key={stage}
                          className="border border-black/20 bg-neutral-100 flex flex-col min-h-[420px]"
                        >
                          <div className="bg-black text-white px-3 py-2.5 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              0{stageIdx + 1} · {STATUS_LABELS[stage]}
                            </span>
                            <span className="px-1.5 py-0.5 bg-white/15 text-[10px] font-bold">
                              {items.length}
                            </span>
                          </div>
                          <div className="p-2 space-y-2 flex-1">
                            {items.map((item) => {
                              const sum = workspacesOverview?.[item.id];
                              const prevStage =
                                stageIdx > 0
                                  ? PIPELINE_STAGES[stageIdx - 1]
                                  : null;
                              const nextStage =
                                stageIdx < PIPELINE_STAGES.length - 1
                                  ? PIPELINE_STAGES[stageIdx + 1]
                                  : null;

                              return (
                                <div
                                  key={item.id}
                                  className="bg-white border border-black/15 p-3 space-y-2.5"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-neutral-100 border border-black/10">
                                      #{item.id}
                                    </span>
                                    <span className="text-[9px] font-mono text-gray-500">
                                      {item.deadline}
                                    </span>
                                  </div>
                                  <h4 className="text-xs font-black uppercase tracking-tight leading-tight">
                                    {item.projectType}
                                  </h4>
                                  <p className="text-[11px] text-gray-500 line-clamp-2">
                                    {item.deliverables}
                                  </p>
                                  {sum && (
                                    <div className="flex flex-wrap gap-1 pt-1 border-t border-black/5 text-[9px] font-bold">
                                      <span className="px-1.5 py-0.5 bg-neutral-100">
                                        Pins: {sum.openPinsCount}
                                      </span>
                                      <span className="px-1.5 py-0.5 bg-neutral-100">
                                        Rev: {sum.usedRounds}/
                                        {sum.includedRounds}
                                      </span>
                                      <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700">
                                        {formatUsd(sum.paidAmountUsd)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between gap-1 pt-2 border-t border-black/10">
                                    <div className="flex gap-1">
                                      <button
                                        type="button"
                                        disabled={
                                          !prevStage || updateStatus.isPending
                                        }
                                        onClick={() =>
                                          prevStage &&
                                          updateStatus.mutate({
                                            id: item.id,
                                            status: prevStage,
                                          })
                                        }
                                        title="Move Previous Stage"
                                        className="p-1 border border-black/20 hover:bg-black hover:text-white disabled:opacity-30"
                                      >
                                        <ArrowLeft className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        disabled={
                                          !nextStage || updateStatus.isPending
                                        }
                                        onClick={() =>
                                          nextStage &&
                                          updateStatus.mutate({
                                            id: item.id,
                                            status: nextStage,
                                          })
                                        }
                                        title="Advance Next Stage"
                                        className="p-1 border border-black/20 hover:bg-black hover:text-white disabled:opacity-30"
                                      >
                                        <ArrowRight className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleOpenWorkspace(item.id, "proofing")
                                      }
                                      className="px-2 py-1 bg-black text-white text-[9px] font-bold uppercase tracking-wider hover:bg-[#e63946] transition-colors"
                                    >
                                      Workspace
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Monthly Capacity Calendar Grid */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                      Studio Slot Availability Forecast (Configured in
                      studio.config.ts)
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 bg-black p-1">
                      {STUDIO_CONFIG.capacitySchedule.map((slot) => {
                        const pct = Math.round(
                          (slot.bookedSlots / slot.totalSlots) * 100,
                        );
                        return (
                          <div
                            key={slot.id}
                            className="bg-white p-5 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                  {slot.quarter}
                                </span>
                                <span
                                  className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                                    slot.statusLabel === "Limited"
                                      ? "bg-[#e63946] text-white"
                                      : slot.statusLabel === "High Demand"
                                        ? "bg-[#f4a261] text-black"
                                        : "bg-emerald-100 text-emerald-800"
                                  }`}
                                >
                                  {slot.statusLabel}
                                </span>
                              </div>
                              <h3 className="text-base font-black uppercase tracking-tight">
                                {slot.month}
                              </h3>
                              <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                                {slot.focusNote}
                              </p>
                            </div>

                            <div className="mt-4 pt-3 border-t border-black/10">
                              <div className="flex justify-between text-[10px] font-bold uppercase mb-1.5">
                                <span>
                                  {slot.bookedSlots} / {slot.totalSlots} Booked
                                </span>
                                <span>
                                  {slot.totalSlots - slot.bookedSlots} Open
                                </span>
                              </div>
                              <div className="h-2 bg-neutral-200 overflow-hidden">
                                <div
                                  className="h-full transition-all"
                                  style={{
                                    width: `${pct}%`,
                                    backgroundColor:
                                      pct >= 80
                                        ? "var(--studio-red)"
                                        : "var(--studio-blue)",
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active Commission Deadline Schedule */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                      Active Production Deadline Schedule
                    </p>
                    <div className="border border-black bg-white divide-y divide-black/10">
                      {sortedTimelineCommissions.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 bg-black text-white font-mono text-xs font-bold">
                              {item.deadline}
                            </span>
                            <div>
                              <p className="text-xs font-black uppercase">
                                #{item.id} · {item.projectType}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {item.deliverables}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className={`rounded-none text-[10px] uppercase ${
                                STATUS_COLORS[item.status]
                              }`}
                            >
                              {STATUS_LABELS[item.status]}
                            </Badge>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleOpenWorkspace(item.id, "proofing")
                              }
                              className="rounded-none border-black text-[10px] uppercase tracking-widest"
                            >
                              Open Workspace
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          )}

          <TabsContent value="commissions" className="mt-0">
            {/* Search & Status Filter Bar */}
            {commissions && commissions.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(CLIENT_FILTER_LABELS) as ClientFilter[]).map(
                    (key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setClientFilter(key)}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                          clientFilter === key
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-600 border-black/15 hover:border-black"
                        }`}
                      >
                        {CLIENT_FILTER_LABELS[key]}
                      </button>
                    ),
                  )}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Filter by #id, title, rights..."
                    className="rounded-none border-black/15 bg-white pl-8 text-xs h-8"
                  />
                </div>
              </div>
            )}

            {commissionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : filteredClientCommissions.length > 0 ? (
              <div className="space-y-3">
                {filteredClientCommissions.map((commission) => {
                  const canCancel =
                    commission.status === "submitted" ||
                    commission.status === "in_review";
                  const canApproveDelivery = commission.status === "delivered";
                  const summary = workspacesOverview?.[commission.id];

                  return (
                    <Card
                      key={commission.id}
                      className="rounded-none border-black/10 hover:border-black/30 transition-colors"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest bg-neutral-100 border border-black/10 px-1.5 py-0.5">
                                #{commission.id}
                              </span>
                              <CardTitle className="text-sm font-bold uppercase tracking-tight">
                                {commission.projectType}
                              </CardTitle>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              Submitted{" "}
                              {new Date(
                                commission.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`rounded-none text-[10px] uppercase tracking-wider ${
                              STATUS_COLORS[commission.status] || ""
                            }`}
                          >
                            {STATUS_LABELS[commission.status] ||
                              commission.status}
                          </Badge>
                        </div>

                        {summary && (
                          <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-black/5">
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenWorkspace(commission.id, "proofing")
                              }
                              className="px-2.5 py-1 bg-neutral-100 hover:bg-black hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                            >
                              <MapPin className="w-3 h-3 text-[#e63946]" />
                              {summary.deliverablesCount} Proofs ·{" "}
                              {summary.openPinsCount} Open Pins
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenWorkspace(commission.id, "proofing")
                              }
                              className="px-2.5 py-1 bg-neutral-100 hover:bg-black hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Revisions: {summary.usedRounds}/
                              {summary.includedRounds}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenWorkspace(commission.id, "billing")
                              }
                              className="px-2.5 py-1 bg-neutral-100 hover:bg-black hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                            >
                              <DollarSign className="w-3 h-3 text-emerald-700" />
                              Paid: {formatUsd(summary.paidAmountUsd)} /{" "}
                              {formatUsd(summary.totalAmountUsd)}
                            </button>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-2">
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                              Deliverables
                            </p>
                            <p className="text-gray-700 leading-relaxed">
                              {commission.deliverables}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                              Deadline / Budget
                            </p>
                            <p className="text-gray-700">
                              {commission.deadline} &middot;{" "}
                              {commission.budget}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                              Rights
                            </p>
                            <p className="text-gray-700">
                              {commission.rightsUsage}
                            </p>
                          </div>
                        </div>

                        {commission.description && (
                          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                            {commission.description}
                          </p>
                        )}

                        <StageProgressBar status={commission.status} />

                        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-black/5">
                          <Button
                            size="sm"
                            className="bg-black text-white hover:bg-black/85 text-xs uppercase tracking-widest rounded-none"
                            onClick={() =>
                              handleOpenWorkspace(commission.id, "proofing")
                            }
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Visual Proofing
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs uppercase tracking-widest rounded-none border-black/25"
                            onClick={() =>
                              handleOpenWorkspace(commission.id, "billing")
                            }
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Billing
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs uppercase tracking-widest rounded-none border-black/25"
                            onClick={() =>
                              handleOpenWorkspace(commission.id, "audit")
                            }
                          >
                            <History className="w-3 h-3 mr-1" />
                            Audit Trail
                          </Button>

                          {canApproveDelivery && (
                            <Button
                              size="sm"
                              disabled={approveDelivery.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs uppercase tracking-widest rounded-none"
                              onClick={() =>
                                approveDelivery.mutate({ id: commission.id })
                              }
                            >
                              {approveDelivery.isPending ? (
                                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3 mr-1" />
                              )}
                              Approve Delivery & Complete
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs uppercase tracking-widest rounded-none"
                            onClick={() => {
                              const shareUrl =
                                buildCommissionShareUrl(commission);
                              void navigator.clipboard?.writeText(shareUrl);
                              toast.success("Read-only Editor Review link copied");
                            }}
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Share Link
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs uppercase tracking-widest rounded-none"
                            onClick={() => {
                              const opened = printCommissionDossier(commission);
                              if (!opened) {
                                toast.error(
                                  "Allow popups to open printable dossier view",
                                );
                              }
                            }}
                          >
                            <Printer className="w-3 h-3 mr-1" />
                            Print Dossier
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs uppercase tracking-widest rounded-none"
                            onClick={() => {
                              downloadCommissionDossierHtml(commission);
                              toast.success("Downloaded Dossier (.html)");
                            }}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            .HTML
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs uppercase tracking-widest rounded-none text-gray-500"
                            onClick={() => downloadSummary(commission)}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            .TXT
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs uppercase tracking-widest rounded-none"
                            onClick={() => openCommissionChat(commission)}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Chat
                          </Button>

                          {canCancel && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={cancelCommission.isPending}
                              className="text-xs uppercase tracking-widest rounded-none text-[#e63946] hover:text-[#e63946] hover:bg-[#e63946]/10 ml-auto"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Cancel commission #${commission.id} (${commission.projectType})?`,
                                  )
                                ) {
                                  cancelCommission.mutate({
                                    id: commission.id,
                                  });
                                }
                              }}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancel Inquiry
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : commissions && commissions.length > 0 ? (
              <div className="text-center py-12 bg-white border border-black/10">
                <p className="text-sm font-medium text-gray-500 mb-3">
                  No commissions match your current filter or search term.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-none border-black text-xs uppercase tracking-widest"
                  onClick={() => {
                    setClientFilter("all");
                    setClientSearch("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-black/10">
                <FileText className="w-8 h-8 text-gray-300 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-500 mb-2">
                  No commissions yet
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Submit your first project inquiry to get started.
                </p>
                <Button
                  size="sm"
                  className="bg-black text-white hover:bg-black/80 rounded-none text-xs uppercase tracking-widest"
                  onClick={() => modalRef.current?.open()}
                >
                  <Send className="w-3 h-3 mr-1" />
                  New Commission
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="mt-0">
            {draftsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : drafts && drafts.length > 0 ? (
              <div className="space-y-3">
                {drafts.map((draft) => (
                  <Card
                    key={draft.id}
                    className="rounded-none border-black/10 hover:border-black/30 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-widest bg-[#f4a261]/25 px-1.5 py-0.5">
                              Draft #{draft.id}
                            </span>
                            <CardTitle className="text-sm font-bold uppercase tracking-tight">
                              {draft.projectType || "Untitled Draft"}
                            </CardTitle>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Last updated{" "}
                            {new Date(draft.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs rounded-none h-8 w-8 p-0"
                            onClick={() => {
                              if (confirm("Delete this draft?")) {
                                deleteDraft.mutate({ id: draft.id });
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
                        {draft.deliverables && (
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                              Deliverables
                            </p>
                            <p className="text-gray-700">
                              {draft.deliverables}
                            </p>
                          </div>
                        )}
                        {draft.deadline && (
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                              Deadline
                            </p>
                            <p className="text-gray-700">{draft.deadline}</p>
                          </div>
                        )}
                        {draft.budget && (
                          <div>
                            <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                              Budget
                            </p>
                            <p className="text-gray-700">{draft.budget}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-black/5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs uppercase tracking-widest rounded-none"
                          onClick={() => modalRef.current?.open({ draft })}
                        >
                          <PenTool className="w-3 h-3 mr-1" />
                          Continue Editing
                        </Button>
                        <Button
                          size="sm"
                          disabled={quickCreateCommission.isPending}
                          className="bg-[#e63946] text-white hover:bg-[#e63946]/85 text-xs uppercase tracking-widest rounded-none"
                          onClick={() => handleQuickSubmitDraft(draft)}
                        >
                          {quickCreateCommission.isPending ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3 mr-1" />
                          )}
                          Submit Inquiry
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white border border-black/10">
                <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-4" />
                <p className="text-sm font-medium text-gray-500 mb-2">
                  No saved drafts
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  Save drafts while working on commission inquiries.
                </p>
                <Button
                  size="sm"
                  className="bg-black text-white hover:bg-black/80 rounded-none text-xs uppercase tracking-widest"
                  onClick={() => modalRef.current?.open()}
                >
                  <PenTool className="w-3 h-3 mr-1" />
                  Start a Draft
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
