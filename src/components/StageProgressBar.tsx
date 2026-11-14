import {
  PIPELINE_STAGES,
  STATUS_LABELS,
  type CommissionStatus,
} from "@/lib/commission-stages";

export function StageProgressBar({ status }: { status: CommissionStatus }) {
  if (status === "cancelled") {
    return (
      <div className="my-4 border border-[#e63946]/30 bg-[#e63946]/5 px-3 py-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-[#e63946]">
        <span>Commission Cancelled</span>
        <span>0 / 6 Stages Active</span>
      </div>
    );
  }

  const currentIdx = PIPELINE_STAGES.indexOf(status);

  return (
    <div className="my-4">
      <div className="grid grid-cols-6 gap-1 bg-black p-[1px]">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIdx || status === "completed";
          const isCurrent = idx === currentIdx && status !== "completed";

          return (
            <div
              key={stage}
              className={`h-2 transition-colors ${
                isCurrent
                  ? "bg-[#e63946]"
                  : isCompleted
                    ? "bg-[#1d3557]"
                    : "bg-neutral-200"
              }`}
              title={STATUS_LABELS[stage]}
            />
          );
        })}
      </div>
      <div className="grid grid-cols-6 gap-1 mt-1.5">
        {PIPELINE_STAGES.map((stage, idx) => {
          const isActive = idx === currentIdx;
          const isPast = idx < currentIdx;

          return (
            <span
              key={stage}
              className={`text-[9px] uppercase tracking-wider truncate ${
                isActive
                  ? "font-black text-[#e63946]"
                  : isPast
                    ? "font-bold text-[#1d3557]"
                    : "text-gray-400"
              }`}
            >
              {STATUS_LABELS[stage]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
