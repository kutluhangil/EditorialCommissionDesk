import type { Commission } from "@contracts/types";

export type CommissionStatus = Commission["status"];

export const PIPELINE_STAGES: readonly CommissionStatus[] = [
  "submitted",
  "in_review",
  "approved",
  "in_progress",
  "delivered",
  "completed",
];

export const ALL_STATUSES: readonly CommissionStatus[] = [
  ...PIPELINE_STAGES,
  "cancelled",
];

export const STATUS_LABELS: Record<CommissionStatus, string> = {
  submitted: "Submitted",
  in_review: "In Review",
  approved: "Approved",
  in_progress: "In Progress",
  delivered: "Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<CommissionStatus, string> = {
  submitted: "bg-gray-100 text-gray-700 border-gray-300",
  in_review: "bg-[#f4a261]/20 text-black border-[#f4a261]",
  approved: "bg-emerald-50 text-emerald-800 border-emerald-300",
  in_progress: "bg-[#1d3557]/10 text-[#1d3557] border-[#1d3557]/30",
  delivered: "bg-purple-50 text-purple-800 border-purple-300",
  completed: "bg-black text-white border-black",
  cancelled: "bg-[#e63946]/10 text-[#e63946] border-[#e63946]/40",
};
