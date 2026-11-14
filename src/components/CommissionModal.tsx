import {
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type { CommissionDraft } from "@contracts/types";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import {
  BASE_FEES,
  BUDGET_RANGES,
  PROJECT_TYPES,
  RIGHTS_MULTIPLIERS,
  RIGHTS_OPTIONS,
  STYLE_TAGS,
  computeQuoteEstimate,
  formatUsd,
} from "@/lib/pricing";
import { toast } from "sonner";
import {
  X,
  Save,
  Send,
  Loader2,
  ArrowRight,
  Calculator,
  Sparkles,
  Upload,
  FileImage,
  Trash2,
} from "lucide-react";

export interface CommissionFormValues {
  projectType: string;
  deliverables: string;
  deadline: string;
  budget: string;
  rightsUsage: string;
  visualReferences: string;
  description: string;
}

export interface CommissionModalHandle {
  open: (options?: {
    draft?: CommissionDraft;
    initialProjectType?: string;
    initialValues?: Partial<CommissionFormValues>;
  }) => void;
}

interface AttachedReference {
  key: string;
  fileName: string;
  previewUrl: string;
  refToken: string;
  isImage: boolean;
}

const EMPTY_FORM: CommissionFormValues = {
  projectType: "",
  deliverables: "",
  deadline: "",
  budget: "",
  rightsUsage: "",
  visualReferences: "",
  description: "",
};

const MAX_UPLOAD_BYTES = 2.5 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

const CommissionModal = forwardRef<CommissionModalHandle>((_, ref) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [budgetTouched, setBudgetTouched] = useState(false);
  const [attachedRefs, setAttachedRefs] = useState<AttachedReference[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const [form, setForm] = useState<CommissionFormValues>(EMPTY_FORM);

  const quote = useMemo(
    () =>
      computeQuoteEstimate({
        projectType: form.projectType,
        rightsUsage: form.rightsUsage,
        deadline: form.deadline,
      }),
    [form.projectType, form.rightsUsage, form.deadline],
  );

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingDraftId(null);
    setBudgetTouched(false);
    setAttachedRefs([]);
    setStep(1);
  };

  const deleteDraft = trpc.draft.delete.useMutation({
    onSuccess: () => {
      utils.draft.list.invalidate();
    },
  });

  const uploadMutation = trpc.upload.presignOrInline.useMutation();

  const createCommission = trpc.commission.create.useMutation({
    onSuccess: () => {
      if (editingDraftId !== null) {
        deleteDraft.mutate({ id: editingDraftId });
      }
      toast.success("Commission submitted successfully!");
      utils.commission.list.invalidate();
      utils.commission.listAll.invalidate();
      utils.commission.workspacesOverview.invalidate();
      setOpen(false);
      resetForm();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to submit commission");
    },
  });

  const createDraft = trpc.draft.create.useMutation({
    onSuccess: (created) => {
      if (created?.id) {
        setEditingDraftId(created.id);
      }
      toast.success("Draft saved!");
      utils.draft.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save draft");
    },
  });

  const updateDraft = trpc.draft.update.useMutation({
    onSuccess: () => {
      toast.success("Draft updated!");
      utils.draft.list.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update draft");
    },
  });

  useImperativeHandle(ref, () => ({
    open: (options) => {
      setAttachedRefs([]);
      if (options?.draft) {
        const d = options.draft;
        setEditingDraftId(d.id);
        setForm({
          projectType: d.projectType || "",
          deliverables: d.deliverables || "",
          deadline: d.deadline || "",
          budget: d.budget || "",
          rightsUsage: d.rightsUsage || "",
          visualReferences: d.visualReferences || "",
          description: d.description || "",
        });
        setBudgetTouched(Boolean(d.budget));
        setStep(1);
      } else if (options?.initialValues) {
        const init = options.initialValues;
        setEditingDraftId(null);
        setForm({
          ...EMPTY_FORM,
          ...init,
          projectType: init.projectType ?? options.initialProjectType ?? "",
        });
        setBudgetTouched(Boolean(init.budget));
        setStep(1);
      } else {
        setEditingDraftId(null);
        setForm({
          ...EMPTY_FORM,
          projectType: options?.initialProjectType || "",
        });
        setBudgetTouched(false);
        setStep(1);
      }
      setOpen(true);
    },
  }));

  const updateField = (field: keyof CommissionFormValues, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (
        !budgetTouched &&
        (field === "projectType" ||
          field === "rightsUsage" ||
          field === "deadline")
      ) {
        const est = computeQuoteEstimate({
          projectType: next.projectType,
          rightsUsage: next.rightsUsage,
          deadline: next.deadline,
        });
        if (next.projectType || next.rightsUsage) {
          next.budget = est.suggestedTier;
        }
      }
      return next;
    });
  };

  const toggleStyleTag = (tag: string) => {
    const parts = form.visualReferences
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const exists = parts.some(
      (part) => part.toLowerCase() === tag.toLowerCase(),
    );
    const updated = exists
      ? parts.filter((part) => part.toLowerCase() !== tag.toLowerCase())
      : [...parts, tag];
    updateField("visualReferences", updated.join(", "));
  };

  const isTagActive = (tag: string) =>
    form.visualReferences
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .includes(tag.toLowerCase());

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!isAuthenticated) {
      toast.error("Please sign in first to attach reference files");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Reference file must be 2.5 MB or smaller");
      return;
    }

    try {
      const isImage = file.type.startsWith("image/");
      const dataUrl = await readFileAsDataUrl(file);
      const res = await uploadMutation.mutateAsync({
        fileName: file.name,
        contentType: file.type || "image/png",
        dataUrl: dataUrl.length <= 3_500_000 ? dataUrl : undefined,
      });

      if (res.mode === "s3" && res.uploadUrl) {
        await fetch(res.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": res.contentType },
          body: file,
        });
      }

      const refToken =
        res.mode === "s3" ? res.publicUrl : `[Ref: ${res.fileName}]`;

      setAttachedRefs((prev) => [
        ...prev,
        {
          key: res.key,
          fileName: res.fileName,
          previewUrl: isImage ? dataUrl : "",
          refToken,
          isImage,
        },
      ]);

      const parts = form.visualReferences
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!parts.includes(refToken)) {
        updateField("visualReferences", [...parts, refToken].join(", "));
      }

      toast.success(
        res.mode === "s3"
          ? `Uploaded ${res.fileName} to S3`
          : `Attached ${res.fileName} to brief`,
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to attach reference",
      );
    }
  };

  const removeAttachedRef = (refItem: AttachedReference) => {
    setAttachedRefs((prev) => prev.filter((item) => item.key !== refItem.key));
    const parts = form.visualReferences
      .split(",")
      .map((s) => s.trim())
      .filter((part) => part && part !== refItem.refToken);
    updateField("visualReferences", parts.join(", "));
  };

  const handleSubmit = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to submit a commission");
      return;
    }
    if (
      !form.projectType ||
      !form.deliverables ||
      !form.deadline ||
      !form.budget ||
      !form.rightsUsage
    ) {
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
    const payload = {
      projectType: form.projectType || undefined,
      deliverables: form.deliverables || undefined,
      deadline: form.deadline || undefined,
      budget: form.budget || undefined,
      rightsUsage: form.rightsUsage || undefined,
      visualReferences: form.visualReferences || undefined,
      description: form.description || undefined,
    };

    if (editingDraftId !== null) {
      updateDraft.mutate({ id: editingDraftId, ...payload });
    } else {
      createDraft.mutate(payload);
    }
  };

  const draftBusy = createDraft.isPending || updateDraft.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-none rounded-none bg-transparent">
        <DialogTitle className="sr-only">
          {editingDraftId ? "Edit Draft Commission" : "New Commission"}
        </DialogTitle>
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-black gap-px">
          {/* Left side — video / motion panel */}
          <div className="lg:col-span-4 relative bg-black min-h-[240px] lg:min-h-[600px] overflow-hidden">
            <video
              src="/studio-video.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-2">
                {editingDraftId ? `Draft #${editingDraftId}` : "Studio Process"}
              </p>
              <p className="text-xs text-white/75 leading-relaxed">
                Every commission begins with research, sketching, and material
                exploration. Live fee estimates update automatically from scope,
                rights, and schedule.
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors text-white"
              aria-label="Close modal"
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
                {editingDraftId !== null && (
                  <span className="px-2 py-0.5 bg-[#f4a261]/25 text-black text-[10px] font-bold uppercase tracking-wider">
                    Editing Draft #{editingDraftId}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {isAuthenticated && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs uppercase tracking-widest rounded-none"
                    onClick={handleSaveDraft}
                    disabled={draftBusy}
                  >
                    {draftBusy ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3 mr-1" />
                    )}
                    {editingDraftId ? "Update Draft" : "Save Draft"}
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
                          type="button"
                          onClick={() => updateField("projectType", type)}
                          className={`px-3 py-3 text-xs font-medium uppercase tracking-tight border transition-all text-left flex items-center justify-between ${
                            form.projectType === type
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-600 border-gray-200 hover:border-black"
                          }`}
                        >
                          <span>{type}</span>
                          <span
                            className={`text-[10px] ${
                              form.projectType === type
                                ? "text-[#f4a261]"
                                : "text-gray-400"
                            }`}
                          >
                            {formatUsd(BASE_FEES[type] ?? 3000)}+
                          </span>
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
                      onChange={(e) =>
                        updateField("deliverables", e.target.value)
                      }
                      className="rounded-none border-gray-200 text-sm min-h-[100px]"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  {/* Live Studio Quote Banner */}
                  <div className="bg-[#1d3557] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-white/60 mb-1">
                        <Calculator className="w-3.5 h-3.5 text-[#f4a261]" />
                        Estimated Studio Quote
                      </div>
                      <p className="text-lg font-black tracking-tight">
                        {formatUsd(quote.minUsd)} – {formatUsd(quote.maxUsd)}
                      </p>
                      <p className="text-[11px] text-white/75 mt-0.5">
                        Base {formatUsd(quote.baseFee)} · Rights{" "}
                        {quote.rightsMultiplier.toFixed(2)}x
                        {quote.isRush ? " · Rush Fee 1.25x (<14d)" : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        setBudgetTouched(false);
                        setForm((f) => ({
                          ...f,
                          budget: quote.suggestedTier,
                        }));
                      }}
                      className="bg-[#f4a261] text-black hover:bg-[#f4a261]/90 rounded-none text-[10px] font-bold uppercase tracking-widest shrink-0"
                    >
                      Use Suggested: {quote.suggestedTier}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                        Deadline *{" "}
                        {quote.isRush && (
                          <span className="text-[#e63946] ml-1">
                            (Rush &lt;14 days +25%)
                          </span>
                        )}
                      </label>
                      <Input
                        type="date"
                        value={form.deadline}
                        onChange={(e) =>
                          updateField("deadline", e.target.value)
                        }
                        className="rounded-none border-gray-200 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                        Budget Range *
                      </label>
                      <div className="space-y-1">
                        {BUDGET_RANGES.map((range) => {
                          const isSelected = form.budget === range;
                          const isRecommended = quote.suggestedTier === range;
                          return (
                            <button
                              key={range}
                              type="button"
                              onClick={() => {
                                setBudgetTouched(true);
                                setForm((f) => ({ ...f, budget: range }));
                              }}
                              className={`flex items-center justify-between w-full px-3 py-2 text-xs font-medium border transition-all text-left ${
                                isSelected
                                  ? "bg-black text-white border-black"
                                  : isRecommended
                                    ? "bg-[#f4a261]/15 text-black border-[#f4a261]"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-black"
                              }`}
                            >
                              <span>{range}</span>
                              {isRecommended && (
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 ${
                                    isSelected
                                      ? "bg-[#e63946] text-white"
                                      : "bg-black text-white"
                                  }`}
                                >
                                  Suggested
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 block">
                      Rights & Usage *
                    </label>
                    {form.rightsUsage &&
                      !(RIGHTS_OPTIONS as readonly string[]).includes(
                        form.rightsUsage,
                      ) && (
                        <div className="mb-2 px-3 py-2 bg-black text-white text-xs font-medium flex items-center justify-between gap-2">
                          <span>Custom AOI Matrix: {form.rightsUsage}</span>
                          <span className="text-[10px] font-bold text-[#f4a261] uppercase tracking-widest shrink-0">
                            Active
                          </span>
                        </div>
                      )}
                    <div className="grid grid-cols-1 gap-1">
                      {RIGHTS_OPTIONS.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => updateField("rightsUsage", option)}
                          className={`px-3 py-2 text-xs font-medium border transition-all text-left flex items-center justify-between ${
                            form.rightsUsage === option
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-600 border-gray-200 hover:border-black"
                          }`}
                        >
                          <span>{option}</span>
                          <span
                            className={`text-[10px] ${
                              form.rightsUsage === option
                                ? "text-[#f4a261]"
                                : "text-gray-400"
                            }`}
                          >
                            {(RIGHTS_MULTIPLIERS[option] ?? 1.0).toFixed(2)}x
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Visual References & Moodboard
                      </label>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,application/pdf"
                          className="hidden"
                          onChange={(e) => void handleFileAttach(e)}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={uploadMutation.isPending}
                          onClick={() => fileInputRef.current?.click()}
                          className="h-7 px-2.5 text-[10px] uppercase tracking-widest rounded-none border-black/25 hover:border-black"
                        >
                          {uploadMutation.isPending ? (
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          ) : (
                            <Upload className="w-3 h-3 mr-1" />
                          )}
                          Attach Reference Image
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {STYLE_TAGS.map((tag) => {
                        const active = isTagActive(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleStyleTag(tag)}
                            className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border transition-colors flex items-center gap-1 ${
                              active
                                ? "bg-[#e63946] text-white border-[#e63946]"
                                : "bg-neutral-50 text-gray-700 border-gray-200 hover:border-black"
                            }`}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            {tag}
                          </button>
                        );
                      })}
                    </div>

                    {attachedRefs.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                        {attachedRefs.map((item) => (
                          <div
                            key={item.key}
                            className="border border-black/15 bg-neutral-50 p-1.5 flex items-center gap-2"
                          >
                            {item.isImage && item.previewUrl ? (
                              <img
                                src={item.previewUrl}
                                alt={item.fileName}
                                className="w-9 h-9 object-cover border border-black/10 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 bg-black text-white flex items-center justify-center shrink-0">
                                <FileImage className="w-4 h-4" />
                              </div>
                            )}
                            <span className="text-[10px] font-medium truncate flex-1">
                              {item.fileName}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeAttachedRef(item)}
                              className="p-1 text-gray-400 hover:text-[#e63946]"
                              aria-label={`Remove ${item.fileName}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <Textarea
                      placeholder="Paste links to reference images, mood boards, or describe visual direction..."
                      value={form.visualReferences}
                      onChange={(e) =>
                        updateField("visualReferences", e.target.value)
                      }
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
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      className="rounded-none border-gray-200 text-sm min-h-[100px]"
                    />
                  </div>

                  {/* Summary preview */}
                  <div className="bg-neutral-50 p-4 border border-black/10">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">
                      Commission Summary & Quote
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium">
                          {form.projectType || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Deadline:</span>
                        <span className="font-medium">
                          {form.deadline || "—"}
                          {quote.isRush ? " (Rush +25%)" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Selected Budget:</span>
                        <span className="font-medium">
                          {form.budget || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Rights:</span>
                        <span className="font-medium">
                          {form.rightsUsage || "—"}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-black/10">
                        <span className="text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                          Estimated Studio Quote:
                        </span>
                        <span className="font-black text-[#1d3557]">
                          {formatUsd(quote.minUsd)} – {formatUsd(quote.maxUsd)}
                        </span>
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
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs uppercase tracking-widest rounded-none"
                    onClick={() => setStep(step - 1)}
                  >
                    Back
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {step < 3 ? (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-black text-white hover:bg-black/80 rounded-none text-xs uppercase tracking-widest"
                    onClick={() => setStep(step + 1)}
                  >
                    Continue
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                ) : (
                  <Button
                    type="button"
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
