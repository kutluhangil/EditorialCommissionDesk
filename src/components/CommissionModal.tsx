import { useState, forwardRef, useImperativeHandle } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { X, Save, Send, Loader2, ArrowRight } from "lucide-react";

const PROJECT_TYPES = [
  "Editorial Illustration",
  "Magazine Cover",
  "Brand Identity",
  "Book Cover",
  "Data Visualization",
  "Poster / Campaign",
  "Art Direction",
  "Other",
];

const BUDGET_RANGES = [
  "Under $3,000",
  "$3,000 – $7,000",
  "$7,000 – $15,000",
  "$15,000 – $30,000",
  "$30,000+",
];

const RIGHTS_OPTIONS = [
  "First publication only",
  "Web + print, 1 year",
  "Web + print, perpetual",
  "Worldwide, all media, 3 years",
  "Worldwide, all media, perpetual",
  "To be negotiated",
];

const CommissionModal = forwardRef<{ open: () => void }>((_, ref) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    projectType: "",
    deliverables: "",
    deadline: "",
    budget: "",
    rightsUsage: "",
    visualReferences: "",
    description: "",
  });

  const createCommission = trpc.commission.create.useMutation({
    onSuccess: () => {
      toast.success("Commission submitted successfully!");
      utils.commission.list.invalidate();
      setOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit commission");
    },
  });

  const createDraft = trpc.draft.create.useMutation({
    onSuccess: () => {
      toast.success("Draft saved!");
      utils.draft.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save draft");
    },
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      setOpen(true);
      setStep(1);
    },
  }));

  const resetForm = () => {
    setForm({
      projectType: "",
      deliverables: "",
      deadline: "",
      budget: "",
      rightsUsage: "",
      visualReferences: "",
      description: "",
    });
    setStep(1);
  };

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to submit a commission");
      return;
    }
    if (!form.projectType || !form.deliverables || !form.deadline || !form.budget || !form.rightsUsage) {
      toast.error("Please fill in all required fields");
      return;
    }
    createCommission.mutate({
      projectType: form.projectType,
      deliverables: form.deliverables,
      deadline: form.deadline,
      budget: form.budget,
      rightsUsage: form.rightsUsage,
      visualReferences: form.visualReferences || undefined,
      description: form.description || undefined,
    });
  };

  const handleSaveDraft = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to save drafts");
      return;
    }
    createDraft.mutate({
      projectType: form.projectType || undefined,
      deliverables: form.deliverables || undefined,
      deadline: form.deadline || undefined,
      budget: form.budget || undefined,
      rightsUsage: form.rightsUsage || undefined,
      visualReferences: form.visualReferences || undefined,
      description: form.description || undefined,
    });
  };

  const updateField = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-none rounded-none bg-transparent">
        <DialogTitle className="sr-only">New Commission</DialogTitle>
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-black gap-px">
          {/* Left side — video / motion panel */}
          <div className="lg:col-span-4 relative bg-black min-h-[300px] lg:min-h-[600px] overflow-hidden">
            <video
              src="/studio-video.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 mb-2">
                Studio Process
              </p>
              <p className="text-xs text-white/60 leading-relaxed">
                Every commission begins with research, sketching, and material
                exploration. Watch how ideas take shape.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Right side — form */}
          <div className="lg:col-span-8 bg-white">
            {/* Header */}
            <div className="px-6 py-5 border-b border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  Step {step} of 3
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`w-6 h-1 transition-colors ${
                        s <= step ? "bg-[#e63946]" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs uppercase tracking-widest"
                    onClick={handleSaveDraft}
                    disabled={createDraft.isPending}
                  >
                    {createDraft.isPending ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3 mr-1" />
                    )}
                    Save Draft
                  </Button>
                )}
              </div>
            </div>

            {/* Form body */}
            <div className="px-6 py-6 max-h-[500px] overflow-y-auto">
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                      Project Type *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {PROJECT_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => updateField("projectType", type)}
                          className={`px-3 py-3 text-xs font-medium uppercase tracking-tight border transition-all text-left ${
                            form.projectType === type
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-600 border-gray-200 hover:border-black"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                      Deliverables *
                    </label>
                    <Textarea
                      placeholder="e.g., 1 cover illustration + 3 interior spots, print-ready PDFs..."
                      value={form.deliverables}
                      onChange={(e) => updateField("deliverables", e.target.value)}
                      className="rounded-none border-gray-200 text-sm min-h-[100px]"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                        Deadline *
                      </label>
                      <Input
                        type="date"
                        value={form.deadline}
                        onChange={(e) => updateField("deadline", e.target.value)}
                        className="rounded-none border-gray-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                        Budget Range *
                      </label>
                      <div className="space-y-1">
                        {BUDGET_RANGES.map((range) => (
                          <button
                            key={range}
                            onClick={() => updateField("budget", range)}
                            className={`block w-full px-3 py-2 text-xs font-medium border transition-all text-left ${
                              form.budget === range
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-600 border-gray-200 hover:border-black"
                            }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                      Rights & Usage *
                    </label>
                    <div className="grid grid-cols-1 gap-1">
                      {RIGHTS_OPTIONS.map((option) => (
                        <button
                          key={option}
                          onClick={() => updateField("rightsUsage", option)}
                          className={`px-3 py-2 text-xs font-medium border transition-all text-left ${
                            form.rightsUsage === option
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-600 border-gray-200 hover:border-black"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                      Visual References
                    </label>
                    <Textarea
                      placeholder="Paste links to reference images, mood boards, or describe visual direction..."
                      value={form.visualReferences}
                      onChange={(e) => updateField("visualReferences", e.target.value)}
                      className="rounded-none border-gray-200 text-sm min-h-[80px]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                      Project Description
                    </label>
                    <Textarea
                      placeholder="Tell us about the story, audience, publication, or brand context..."
                      value={form.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      className="rounded-none border-gray-200 text-sm min-h-[120px]"
                    />
                  </div>

                  {/* Summary preview */}
                  <div className="bg-neutral-50 p-4 border border-black/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                      Commission Summary
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium">{form.projectType || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Deadline:</span>
                        <span className="font-medium">{form.deadline || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Budget:</span>
                        <span className="font-medium">{form.budget || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rights:</span>
                        <span className="font-medium">{form.rightsUsage || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="px-6 py-4 border-t border-black/10 flex justify-between items-center">
              <div>
                {step > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs uppercase tracking-widest"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step < 3 ? (
                  <Button
                    size="sm"
                    className="bg-black text-white hover:bg-black/80 rounded-none text-xs uppercase tracking-widest"
                    onClick={() => setStep(step + 1)}
                  >
                    Continue
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="bg-[#e63946] text-white hover:bg-[#e63946]/80 rounded-none text-xs uppercase tracking-widest"
                    onClick={handleSubmit}
                    disabled={createCommission.isPending}
                  >
                    {createCommission.isPending ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3 mr-1" />
                    )}
                    Submit Commission
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

CommissionModal.displayName = "CommissionModal";

export default CommissionModal;
