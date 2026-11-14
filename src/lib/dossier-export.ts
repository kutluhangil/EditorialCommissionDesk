import type { Commission, MilestoneInvoice } from "@contracts/types";
import {
  STUDIO_CONFIG,
  STUDIO_THEMES,
  type StudioThemeId,
  type StudioThemePreset,
} from "@/config/studio.config";
import {
  PIPELINE_STAGES,
  STATUS_LABELS,
} from "@/lib/commission-stages";
import {
  RIGHTS_CLAUSES,
  computeQuoteEstimate,
  formatUsd,
} from "@/lib/pricing";

function resolveActiveExportTheme(): StudioThemePreset {
  if (typeof window !== "undefined") {
    try {
      const saved = window.localStorage.getItem("ecd_studio_theme");
      if (saved && saved in STUDIO_THEMES) {
        return STUDIO_THEMES[saved as StudioThemeId];
      }
    } catch {
      // Ignore storage access restriction in sandboxed contexts
    }
  }
  return STUDIO_THEMES.mondrian;
}

function escapeHtml(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildDossierHtml(commission: Commission): string {
  const theme = resolveActiveExportTheme();
  const quote = computeQuoteEstimate({
    projectType: commission.projectType,
    rightsUsage: commission.rightsUsage,
    deadline: commission.deadline,
  });

  const rightsClause =
    RIGHTS_CLAUSES[commission.rightsUsage] ??
    "Standard editorial reproduction terms mutually confirmed between Client and Atelier Mondrian.";

  const activeStageIndex = PIPELINE_STAGES.indexOf(commission.status);
  const statusRows = PIPELINE_STAGES.map((stage, idx) => {
    const reached =
      commission.status === "cancelled"
        ? false
        : idx <= activeStageIndex || commission.status === "completed";
    const isCurrent = stage === commission.status;

    return `
      <tr>
        <td>0${idx + 1}</td>
        <td><strong>${escapeHtml(STATUS_LABELS[stage])}</strong></td>
        <td>${isCurrent ? "ACTIVE STAGE" : reached ? "CLEARED" : "PENDING"}</td>
      </tr>`;
  }).join("");

  const dossierId = `ECD-${new Date(commission.createdAt).getFullYear()}-${String(commission.id).padStart(4, "0")}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(dossierId)} · Editorial Commission Dossier</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 40px;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      color: #111111;
      background: #ffffff;
      line-height: 1.45;
    }
    .sheet {
      max-width: 820px;
      margin: 0 auto;
      border: 3px solid #000000;
    }
    .topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 24px;
      background: #000000;
      color: #ffffff;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 13px;
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .dot {
      width: 12px;
      height: 12px;
      background: ${theme.red};
      display: inline-block;
    }
    .doc-id {
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: ${theme.yellow};
      font-weight: 700;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      border-bottom: 2px solid #000000;
    }
    .cell {
      padding: 18px 24px;
      border-right: 1px solid #000000;
    }
    .cell:last-child { border-right: none; }
    .label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.16em;
      color: #6b7280;
      margin: 0 0 6px 0;
    }
    .val {
      font-size: 14px;
      font-weight: 700;
      margin: 0;
    }
    .section {
      padding: 22px 24px;
      border-bottom: 1px solid #d4d4d8;
    }
    h1 {
      margin: 0 0 6px 0;
      font-size: 26px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.02em;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      background: ${theme.blue};
      color: #ffffff;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.16em;
    }
    .quote-box {
      background: #f5f5f5;
      border: 1px solid #000000;
      padding: 16px;
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 12px;
    }
    th, td {
      border: 1px solid #d4d4d8;
      padding: 8px 12px;
      text-align: left;
    }
    th {
      background: #111111;
      color: #ffffff;
      font-size: 10px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
    }
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
    }
    .sig-box {
      padding: 24px;
      border-right: 1px solid #000000;
    }
    .sig-box:last-child { border-right: none; }
    .sig-line {
      margin-top: 38px;
      border-top: 1px solid #000000;
      padding-top: 8px;
      font-size: 11px;
      color: #52525b;
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }
    .swatch-bar {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      height: 8px;
      border-top: 2px solid #000000;
    }
    @media print {
      body { padding: 0; }
      .sheet { border-width: 2px; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="topbar">
      <div class="brand"><span class="dot"></span>Editorial Commission Desk</div>
      <div class="doc-id">${escapeHtml(dossierId)}</div>
    </div>

    <div class="section">
      <p class="label">Official Project Brief &amp; Licensing Dossier</p>
      <h1>${escapeHtml(commission.projectType)}</h1>
      <span class="badge">${escapeHtml(STATUS_LABELS[commission.status])}</span>
    </div>

    <div class="grid-3">
      <div class="cell">
        <p class="label">Deadline</p>
        <p class="val">${escapeHtml(commission.deadline)}</p>
      </div>
      <div class="cell">
        <p class="label">Allocated Budget Tier</p>
        <p class="val">${escapeHtml(commission.budget)}</p>
      </div>
      <div class="cell">
        <p class="label">Submitted Date</p>
        <p class="val">${escapeHtml(new Date(commission.createdAt).toLocaleDateString())}</p>
      </div>
    </div>

    <div class="section">
      <p class="label">Deliverables Specification</p>
      <p style="margin:0; font-size:13px;">${escapeHtml(commission.deliverables)}</p>
      ${
        commission.description
          ? `<p class="label" style="margin-top:16px;">Editorial Context &amp; Story Notes</p>
             <p style="margin:0; font-size:13px; color:#3f3f46;">${escapeHtml(commission.description)}</p>`
          : ""
      }
      ${
        commission.visualReferences
          ? `<p class="label" style="margin-top:16px;">Visual References &amp; Style Directives</p>
             <p style="margin:0; font-size:12px; color:#3f3f46; word-break:break-word;">${escapeHtml(commission.visualReferences)}</p>`
          : ""
      }
    </div>

    <div class="section">
      <p class="label">Rights &amp; Licensing Schedule</p>
      <p class="val" style="margin-bottom:6px;">${escapeHtml(commission.rightsUsage)}</p>
      <p style="margin:0; font-size:12px; color:#3f3f46;">${escapeHtml(rightsClause)}</p>

      <div class="quote-box">
        <div>
          <p class="label">Studio Fee Benchmark</p>
          <p class="val">${formatUsd(quote.minUsd)} – ${formatUsd(quote.maxUsd)}</p>
        </div>
        <div style="text-align:right; font-size:11px; color:#3f3f46;">
          Base ${formatUsd(quote.baseFee)} &middot; License ${quote.rightsMultiplier.toFixed(2)}x${quote.isRush ? " &middot; Rush 1.25x" : ""}
        </div>
      </div>
    </div>

    <div class="section">
      <p class="label">Commission Production Stages</p>
      <table>
        <thead>
          <tr><th>Step</th><th>Stage</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${statusRows}
        </tbody>
      </table>
    </div>

    <div class="signatures">
      <div class="sig-box">
        <p class="label">Client Authorization</p>
        <p style="margin:0; font-size:12px;">Client Account #${commission.userId}</p>
        <div class="sig-line">Authorized Signature &amp; Date</div>
      </div>
      <div class="sig-box">
        <p class="label">Studio Counter-Signature</p>
        <p style="margin:0; font-size:12px;">Atelier Mondrian · Studio Desk</p>
        <div class="sig-line">Studio Producer Approval</div>
      </div>
    </div>

    <div class="swatch-bar">
      <div style="background:${theme.red};"></div>
      <div style="background:${theme.blue};"></div>
      <div style="background:${theme.yellow};"></div>
    </div>
  </div>
</body>
</html>`;
}

export function buildReviewRoomUrl(commission: Pick<Commission, "id" | "createdAt">): string {
  const code = formatCommissionCode(commission);
  if (typeof window === "undefined") {
    return `/review/${code}`;
  }
  return `${window.location.origin}/review/${code}`;
}

/** Download a self-contained Mondrian-styled HTML commission dossier & licensing agreement. */
export function downloadCommissionDossierHtml(commission: Commission): void {
  const html = buildDossierHtml(commission);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `commission-${commission.id}-dossier.html`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Open the formatted Editorial Commission Dossier in a clean print-ready tab for PDF export. */
export function printCommissionDossier(commission: Commission): boolean {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return false;
  win.document.open();
  win.document.write(buildDossierHtml(commission));
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 250);
  return true;
}

/** Build the formatted commercial share code for read-only editor review URLs. */
export function formatCommissionCode(commission: Pick<Commission, "id" | "createdAt">): string {
  const year = new Date(commission.createdAt).getFullYear();
  return `ECD-${year}-${String(commission.id).padStart(4, "0")}`;
}

export function buildCommissionShareUrl(commission: Pick<Commission, "id" | "createdAt">): string {
  if (typeof window === "undefined") {
    return `/?share=${formatCommissionCode(commission)}`;
  }
  return `${window.location.origin}/?share=${formatCommissionCode(commission)}`;
}

/** Parse either `#share=ECD-2026-0001`, `?share=ECD-2026-0001`, or `?share=1` into numeric commission id. */
export function parseCommissionShareParam(raw: string | null): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/(\d+)$/);
  if (!match) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function buildInvoiceHtml(
  commission: Commission,
  milestone: MilestoneInvoice,
  allMilestones: MilestoneInvoice[],
): string {
  const theme = resolveActiveExportTheme();
  const invoiceCode = `INV-${new Date(commission.createdAt).getFullYear()}-${String(commission.id).padStart(3, "0")}-M${milestone.id}`;
  const totalContract = allMilestones.reduce((acc, m) => acc + m.amountUsd, 0);
  const totalPaid = allMilestones
    .filter((m) => m.status === "paid")
    .reduce((acc, m) => acc + m.amountUsd, 0);
  const remaining = Math.max(0, totalContract - totalPaid);

  const scheduleRows = allMilestones
    .map(
      (item) => `
      <tr style="${item.id === milestone.id ? "background:#fef3c7;font-weight:700;" : ""}">
        <td>#${item.id}</td>
        <td>${escapeHtml(item.title)}</td>
        <td>${item.percentage > 0 ? `${item.percentage}%` : "Surcharge"}</td>
        <td>${formatUsd(item.amountUsd)}</td>
        <td>${item.status === "paid" ? "PAID" : "PENDING"}</td>
      </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(invoiceCode)} · Studio Milestone Invoice</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 40px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color: #111; background: #fff; }
    .sheet { max-width: 820px; margin: 0 auto; border: 3px solid #000; }
    .topbar { display: flex; justify-content: space-between; align-items: center; padding: 18px 24px; background: #000; color: #fff; }
    .brand { display: flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
    .dot { width: 12px; height: 12px; background: ${theme.red}; display: inline-block; }
    .doc-id { font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: ${theme.yellow}; font-weight: 700; }
    .section { padding: 22px 24px; border-bottom: 1px solid #d4d4d8; }
    .label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: #6b7280; margin: 0 0 6px 0; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); border-bottom: 2px solid #000; }
    .cell { padding: 18px 24px; border-right: 1px solid #000; }
    .cell:last-child { border-right: none; }
    .val { font-size: 16px; font-weight: 900; margin: 0; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    th, td { border: 1px solid #d4d4d8; padding: 9px 12px; text-align: left; }
    th { background: #111; color: #fff; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; }
    .swatch-bar { display: grid; grid-template-columns: repeat(3, 1fr); height: 8px; border-top: 2px solid #000; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="topbar">
      <div class="brand"><span class="dot"></span>${escapeHtml(STUDIO_CONFIG.identity.name)} · Commercial Tax Invoice</div>
      <div class="doc-id">${escapeHtml(invoiceCode)}</div>
    </div>

    <div class="section">
      <p class="label">Billed Milestone Stage</p>
      <h1 style="margin:0 0 6px 0; font-size:24px; font-weight:900; text-transform:uppercase;">${escapeHtml(milestone.title)}</h1>
      <p style="margin:0; font-size:12px; color:#52525b;">Commission #${commission.id} · ${escapeHtml(commission.projectType)} · ${escapeHtml(milestone.dueLabel)}</p>
    </div>

    <div class="grid-3">
      <div class="cell">
        <p class="label">Milestone Amount Due</p>
        <p class="val">${formatUsd(milestone.amountUsd)}</p>
      </div>
      <div class="cell">
        <p class="label">Invoice Status</p>
        <p class="val" style="color:${milestone.status === "paid" ? "#059669" : theme.red}">${milestone.status === "paid" ? "PAID IN FULL" : "AWAITING PAYMENT"}</p>
      </div>
      <div class="cell">
        <p class="label">Contract Balance</p>
        <p class="val">${formatUsd(remaining)} / ${formatUsd(totalContract)}</p>
      </div>
    </div>

    <div class="section">
      <p class="label">Full Commission Payment Schedule</p>
      <table>
        <thead>
          <tr><th>Ref</th><th>Milestone</th><th>Share</th><th>Amount</th><th>Status</th></tr>
        </thead>
        <tbody>${scheduleRows}</tbody>
      </table>
    </div>

    <div class="section" style="font-size:11px; color:#52525b;">
      <p class="label">Remittance &amp; Rights Clause</p>
      <p style="margin:0;">Issued by ${escapeHtml(STUDIO_CONFIG.identity.studioLabel)} (${escapeHtml(STUDIO_CONFIG.identity.email)}). Rights Usage: ${escapeHtml(commission.rightsUsage)}. High-resolution press masters release automatically once final balance reaches $0.</p>
    </div>

    <div class="swatch-bar">
      <div style="background:${theme.red};"></div>
      <div style="background:${theme.blue};"></div>
      <div style="background:${theme.yellow};"></div>
    </div>
  </div>
</body>
</html>`;
}

/** Open a formatted Mondrian Commercial Tax & Licensing Invoice in a print-ready tab. */
export function printMilestoneInvoice(
  commission: Commission,
  milestone: MilestoneInvoice,
  allMilestones: MilestoneInvoice[],
): boolean {
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return false;
  win.document.open();
  win.document.write(buildInvoiceHtml(commission, milestone, allMilestones));
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 250);
  return true;
}
