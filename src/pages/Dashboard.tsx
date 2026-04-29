import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import Navigation from "@/components/Navigation";
import ChatWidget from "@/components/ChatWidget";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
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
} from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  submitted: "bg-gray-100 text-gray-700 border-gray-200",
  in_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
  approved: "bg-green-50 text-green-700 border-green-200",
  in_progress: "bg-blue-50 text-blue-700 border-blue-200",
  delivered: "bg-purple-50 text-purple-700 border-purple-200",
  completed: "bg-black text-white border-black",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels: Record<string, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  in_progress: "In Progress",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function Dashboard() {
  const { user, isLoading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
  });

  const utils = trpc.useUtils();
  const [activeTab, setActiveTab] = useState("commissions");

  const { data: commissions, isLoading: commissionsLoading } =
    trpc.commission.list.useQuery(undefined, { enabled: !!user });

  const { data: drafts, isLoading: draftsLoading } =
    trpc.draft.list.useQuery(undefined, { enabled: !!user });

  const deleteDraft = trpc.draft.delete.useMutation({
    onSuccess: () => {
      toast.success("Draft deleted");
      utils.draft.list.invalidate();
    },
  });

  const downloadSummary = (commission: NonNullable<typeof commissions>[number] | undefined) => {
    if (!commission) return;
    const summary = `
COMMISSION SUMMARY
Editorial Commission Desk
------------------------
Project: ${commission.projectType}
Status: ${statusLabels[commission.status] || commission.status}
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
    toast.success("Summary downloaded");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-50 text-black">
      <Navigation />
      <ChatWidget />

      <div className="pt-24 pb-16 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <Link
              to="/"
              className="text-xs font-medium uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-1 mb-3"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Home
            </Link>
            <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tight">
              Client Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-2">
              Track inquiries, manage drafts, and download commission summaries.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white flex items-center justify-center text-sm font-bold">
              {user.name?.[0] || "U"}
            </div>
            <div>
              <p className="text-sm font-bold">{user.name || "Client"}</p>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 bg-black p-1 mb-10">
          {[
            { label: "Total Commissions", value: commissions?.length || 0, icon: FileText },
            { label: "In Progress", value: commissions?.filter((c) => c.status === "in_progress" || c.status === "in_review").length || 0, icon: Clock },
            { label: "Completed", value: commissions?.filter((c) => c.status === "completed" || c.status === "delivered").length || 0, icon: CheckCircle },
            { label: "Drafts", value: drafts?.length || 0, icon: PenTool },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5">
              <stat.icon className="w-4 h-4 text-[#e63946] mb-2" />
              <p className="text-2xl font-black">{stat.value}</p>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-transparent border-b border-black/10 rounded-none w-full justify-start gap-6 mb-6">
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

          <TabsContent value="commissions" className="mt-0">
            {commissionsLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : commissions && commissions.length > 0 ? (
              <div className="space-y-3">
                {commissions.map((commission) => (
                  <Card
                    key={commission.id}
                    className="rounded-none border-black/10 hover:border-black/30 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-sm font-bold uppercase tracking-tight">
                            {commission.projectType}
                          </CardTitle>
                          <p className="text-xs text-gray-400 mt-1">
                            Submitted {new Date(commission.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`rounded-none text-[10px] uppercase tracking-wider ${
                            statusColors[commission.status] || ""
                          }`}
                        >
                          {statusLabels[commission.status] || commission.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-4">
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
                            {commission.deadline} &middot; {commission.budget}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 uppercase tracking-wider text-[10px] mb-1">
                            Rights
                          </p>
                          <p className="text-gray-700">{commission.rightsUsage}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3 border-t border-black/5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs uppercase tracking-widest rounded-none"
                          onClick={() => downloadSummary(commission)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Summary
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs uppercase tracking-widest rounded-none"
                          onClick={() => {
                            toast.info("Support chat opened for this commission");
                          }}
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Ask Question
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
                <Link to="/">
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-black/80 rounded-none text-xs uppercase tracking-widest"
                  >
                    <Send className="w-3 h-3 mr-1" />
                    New Commission
                  </Button>
                </Link>
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
                          <CardTitle className="text-sm font-bold uppercase tracking-tight">
                            {draft.projectType || "Untitled Draft"}
                          </CardTitle>
                          <p className="text-xs text-gray-400 mt-1">
                            Last updated {new Date(draft.updatedAt).toLocaleDateString()}
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
                            <p className="text-gray-700">{draft.deliverables}</p>
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
                      <div className="flex gap-2 pt-3 border-t border-black/5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs uppercase tracking-widest rounded-none"
                          onClick={() => toast.info("Edit draft functionality coming soon")}
                        >
                          <PenTool className="w-3 h-3 mr-1" />
                          Continue Editing
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
                <Link to="/">
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-black/80 rounded-none text-xs uppercase tracking-widest"
                  >
                    <PenTool className="w-3 h-3 mr-1" />
                    Start a Draft
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
