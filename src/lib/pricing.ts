export const PROJECT_TYPES = [
  "Editorial Illustration",
  "Magazine Cover",
  "Brand Identity",
  "Book Cover",
  "Data Visualization",
  "Poster / Campaign",
  "Art Direction",
  "Other",
] as const;

export const BUDGET_RANGES = [
  "Under $3,000",
  "$3,000 – $7,000",
  "$7,000 – $15,000",
  "$15,000 – $30,000",
  "$30,000+",
] as const;

export const RIGHTS_OPTIONS = [
  "First publication only",
  "Web + print, 1 year",
  "Web + print, perpetual",
  "Worldwide, all media, 3 years",
  "Worldwide, all media, perpetual",
  "To be negotiated",
] as const;

export const STYLE_TAGS = [
  "Swiss Grid",
  "Bold Spot Color",
  "Geometric Portrait",
  "Isometric Infographic",
  "Editorial Collage",
  "Monochrome Ink",
] as const;

export const BASE_FEES: Record<string, number> = {
  "Editorial Illustration": 2500,
  "Magazine Cover": 4500,
  "Brand Identity": 8000,
  "Book Cover": 3800,
  "Data Visualization": 4000,
  "Poster / Campaign": 5000,
  "Art Direction": 6500,
  Other: 3000,
};

export const RIGHTS_MULTIPLIERS: Record<string, number> = {
  "First publication only": 1.0,
  "Web + print, 1 year": 1.25,
  "Web + print, perpetual": 1.6,
  "Worldwide, all media, 3 years": 1.85,
  "Worldwide, all media, perpetual": 2.2,
  "To be negotiated": 1.15,
};

export const RIGHTS_CLAUSES: Record<string, string> = {
  "First publication only":
    "One-time North American or primary-territory reproduction for a single print/digital issue. Exclusive 90-day embargo window prior to secondary licensing.",
  "Web + print, 1 year":
    "Non-exclusive editorial web and print reproduction worldwide for 12 months from publication date.",
  "Web + print, perpetual":
    "Perpetual worldwide editorial reproduction across web and print editions, excluding standalone merchandising.",
  "Worldwide, all media, 3 years":
    "Broad commercial & editorial usage across print, web, out-of-home, and motion bumpers for a 36-month term.",
  "Worldwide, all media, perpetual":
    "Full commercial buyout excluding studio portfolio exhibition rights; transferable global reproduction in perpetuity.",
  "To be negotiated":
    "Custom licensing schedule to be finalized prior to Step 03 (Development) sketch approval.",
};

export const BUDGET_MIDPOINTS: Record<string, number> = {
  "Under $3,000": 2200,
  "$3,000 – $7,000": 5000,
  "$7,000 – $15,000": 11000,
  "$15,000 – $30,000": 22500,
  "$30,000+": 35000,
};

export interface QuoteEstimate {
  baseFee: number;
  scopeMultiplier: number;
  rightsMultiplier: number;
  isRush: boolean;
  rushMultiplier: number;
  midpointUsd: number;
  minUsd: number;
  maxUsd: number;
  suggestedTier: string;
}

export function suggestBudgetTier(midpointUsd: number): string {
  if (midpointUsd < 3000) return "Under $3,000";
  if (midpointUsd < 7000) return "$3,000 – $7,000";
  if (midpointUsd < 15000) return "$7,000 – $15,000";
  if (midpointUsd < 30000) return "$15,000 – $30,000";
  return "$30,000+";
}

export function computeQuoteEstimate(params: {
  projectType: string;
  rightsUsage: string;
  deadline?: string;
  pieceCount?: number;
  rushMode?: boolean;
  rightsMultiplierOverride?: number;
}): QuoteEstimate {
  const baseFee = BASE_FEES[params.projectType] ?? 3000;
  const pieceCount = Math.max(1, Math.min(12, params.pieceCount ?? 1));
  const scopeMultiplier = Number((1 + (pieceCount - 1) * 0.35).toFixed(2));
  const rightsMultiplier =
    params.rightsMultiplierOverride ??
    RIGHTS_MULTIPLIERS[params.rightsUsage] ??
    1.0;

  let isRush = Boolean(params.rushMode);
  if (!isRush && params.deadline) {
    const deadlineMs = new Date(`${params.deadline}T00:00:00`).getTime();
    if (!Number.isNaN(deadlineMs)) {
      const daysUntil = Math.ceil((deadlineMs - Date.now()) / 86400000);
      if (daysUntil <= 14) {
        isRush = true;
      }
    }
  }

  const rushMultiplier = isRush ? 1.25 : 1.0;
  const midpointUsd = Math.round(
    baseFee * scopeMultiplier * rightsMultiplier * rushMultiplier,
  );
  const minUsd = Math.round((midpointUsd * 0.85) / 100) * 100;
  const maxUsd = Math.round((midpointUsd * 1.25) / 100) * 100;

  return {
    baseFee,
    scopeMultiplier,
    rightsMultiplier,
    isRush,
    rushMultiplier,
    midpointUsd,
    minUsd,
    maxUsd,
    suggestedTier: suggestBudgetTier(midpointUsd),
  };
}

export function formatUsd(amount: number): string {
  return `$${amount.toLocaleString("en-US")}`;
}

export function getIsoDaysFromNow(days: number): string {
  const date = new Date(Date.now() + days * 86400000);
  return date.toISOString().slice(0, 10);
}

export function getSuggestedDeadlineIso(isRush: boolean): string {
  return getIsoDaysFromNow(isRush ? 10 : 21);
}

export interface AoiLicenseDimension {
  id: string;
  label: string;
  multiplier: number;
  clauseFragment: string;
}

export const LICENSE_TERRITORIES: readonly AoiLicenseDimension[] = [
  {
    id: "local",
    label: "Single Country / Regional",
    multiplier: 1.0,
    clauseFragment: "primary domestic publication territory",
  },
  {
    id: "na_eu",
    label: "North America + Europe",
    multiplier: 1.2,
    clauseFragment: "North America and European Union editions",
  },
  {
    id: "worldwide",
    label: "Worldwide",
    multiplier: 1.45,
    clauseFragment: "worldwide distribution across all editions",
  },
] as const;

export const LICENSE_DURATIONS: readonly AoiLicenseDimension[] = [
  {
    id: "3_months",
    label: "Single Issue / 3 Months",
    multiplier: 1.0,
    clauseFragment: "single issue + 90-day archival run",
  },
  {
    id: "1_year",
    label: "1 Year Editorial Term",
    multiplier: 1.18,
    clauseFragment: "12-month active publication license",
  },
  {
    id: "3_years",
    label: "3 Years Multi-Campaign",
    multiplier: 1.38,
    clauseFragment: "36-month multi-format licensing term",
  },
  {
    id: "perpetual",
    label: "Perpetual Archive / Buyout",
    multiplier: 1.65,
    clauseFragment: "perpetual worldwide archival & reprint term",
  },
] as const;

export const LICENSE_CIRCULATIONS: readonly AoiLicenseDimension[] = [
  {
    id: "indie",
    label: "Indie / < 50k Impressions",
    multiplier: 1.0,
    clauseFragment: "circulation up to 50,000 print/digital readers",
  },
  {
    id: "national",
    label: "National / 50k – 500k",
    multiplier: 1.15,
    clauseFragment: "national readership up to 500,000 circulation",
  },
  {
    id: "global_enterprise",
    label: "Global Syndication / 500k+",
    multiplier: 1.35,
    clauseFragment: "unlimited syndication and 500k+ mass distribution",
  },
] as const;

export const LICENSE_EXCLUSIVITY: readonly AoiLicenseDimension[] = [
  {
    id: "non_exclusive",
    label: "Non-Exclusive Editorial",
    multiplier: 1.0,
    clauseFragment: "non-exclusive editorial reproduction",
  },
  {
    id: "category_exclusive",
    label: "Category Exclusive (6 mo)",
    multiplier: 1.22,
    clauseFragment: "6-month industry category exclusivity",
  },
  {
    id: "full_exclusivity",
    label: "Full Commercial Exclusivity",
    multiplier: 1.5,
    clauseFragment: "full commercial exclusivity excluding artist portfolio use",
  },
] as const;

export interface AoiLicenseParams {
  territoryId: string;
  durationId: string;
  circulationId: string;
  exclusivityId: string;
}

export interface AoiLicenseResult {
  territory: AoiLicenseDimension;
  duration: AoiLicenseDimension;
  circulation: AoiLicenseDimension;
  exclusivity: AoiLicenseDimension;
  combinedMultiplier: number;
  mappedRightsLabel: string;
  legalClause: string;
}

function findDimension(
  list: readonly AoiLicenseDimension[],
  id: string,
): AoiLicenseDimension {
  return list.find((item) => item.id === id) ?? list[0];
}

export function computeAoiLicenseMultiplier(params: AoiLicenseParams): AoiLicenseResult {
  const territory = findDimension(LICENSE_TERRITORIES, params.territoryId);
  const duration = findDimension(LICENSE_DURATIONS, params.durationId);
  const circulation = findDimension(LICENSE_CIRCULATIONS, params.circulationId);
  const exclusivity = findDimension(LICENSE_EXCLUSIVITY, params.exclusivityId);

  const combinedMultiplier = Number(
    (
      territory.multiplier *
      duration.multiplier *
      circulation.multiplier *
      exclusivity.multiplier
    ).toFixed(2),
  );

  const mappedRightsLabel = `${territory.label} · ${duration.label} · ${exclusivity.label}`;
  const legalClause = `Licensed for ${exclusivity.clauseFragment} covering ${territory.clauseFragment}, valid for ${duration.clauseFragment}, scoped to ${circulation.clauseFragment}. Original copyright remains with the studio unless separately assigned.`;

  return {
    territory,
    duration,
    circulation,
    exclusivity,
    combinedMultiplier,
    mappedRightsLabel,
    legalClause,
  };
}

export function buildAoiLicenseSummary(params: AoiLicenseParams): string {
  return computeAoiLicenseMultiplier(params).legalClause;
}

export interface ComputedMilestoneStep {
  stepNumber: number;
  title: string;
  percentage: number;
  amountUsd: number;
  dueLabel: string;
}

export function computeMilestoneSchedule(
  totalUsd: number,
): ComputedMilestoneStep[] {
  const safeTotal = Math.max(300, Math.round(totalUsd));
  const deposit = Math.round(safeTotal * 0.4);
  const sketchApproval = Math.round(safeTotal * 0.4);
  const finalDelivery = Math.max(0, safeTotal - deposit - sketchApproval);

  return [
    {
      stepNumber: 1,
      title: "Commencement Deposit",
      percentage: 40,
      amountUsd: deposit,
      dueLabel: "Due upon brief acceptance",
    },
    {
      stepNumber: 2,
      title: "Sketch & Color Sign-Off",
      percentage: 40,
      amountUsd: sketchApproval,
      dueLabel: "Due at Stage 02 approval",
    },
    {
      stepNumber: 3,
      title: "Final Master & License Release",
      percentage: 20,
      amountUsd: finalDelivery,
      dueLabel: "Unlocks high-res press masters",
    },
  ];
}
