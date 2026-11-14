import fs from "node:fs";
import path from "node:path";
import type {
  Commission,
  CommissionAuditEntry,
  CommissionDraft,
  CommissionRevisionState,
  CommissionWorkspaceData,
  CommissionWorkspaceSummary,
  InsertUser,
  Message,
  MilestoneInvoice,
  ProofDeliverable,
  ProofPinAnnotation,
  ProofStage,
  User,
} from "../../db/schema";

interface MemoryStoreState {
  users: User[];
  commissions: Commission[];
  drafts: CommissionDraft[];
  messages: Message[];
  deliverables: ProofDeliverable[];
  pins: ProofPinAnnotation[];
  milestones: MilestoneInvoice[];
  revisions: CommissionRevisionState[];
  auditLogs: CommissionAuditEntry[];
  nextIds: {
    user: number;
    commission: number;
    draft: number;
    message: number;
    deliverable: number;
    pin: number;
    milestone: number;
    audit: number;
  };
}

const STORE_DIR = process.env.VERCEL
  ? path.join("/tmp", ".data")
  : path.resolve(process.cwd(), ".data");
const STORE_FILE = path.join(STORE_DIR, "store.json");
const DISK_PERSIST_ENABLED = !process.env.VITEST;

const BUDGET_TIER_MIDPOINTS: Record<string, number> = {
  "Under $3,000": 2200,
  "$3,000 – $7,000": 5000,
  "$7,000 – $15,000": 11000,
  "$15,000 – $30,000": 22500,
  "$30,000+": 35000,
};

function createSeedState(): MemoryStoreState {
  const now = Date.now();
  const hoursAgo = (hours: number) => new Date(now - hours * 3600 * 1000);
  const daysAgo = (days: number) => new Date(now - days * 86400 * 1000);

  return {
    users: [
      {
        id: 1,
        unionId: "demo-client",
        name: "Clara Vance (The New Yorker)",
        email: "clara.vance@newyorker-editorial.com",
        avatar: null,
        role: "user",
        createdAt: daysAgo(30),
        updatedAt: hoursAgo(2),
        lastSignInAt: hoursAgo(2),
      },
      {
        id: 2,
        unionId: "demo-admin",
        name: "Atelier Mondrian (Studio Desk)",
        email: "desk@editorialcommission.studio",
        avatar: null,
        role: "admin",
        createdAt: daysAgo(90),
        updatedAt: hoursAgo(1),
        lastSignInAt: hoursAgo(1),
      },
    ],
    commissions: [
      {
        id: 1,
        userId: 1,
        projectType: "Editorial Illustration",
        deliverables:
          "The Algorithmic Essay: 1 full-page opener + 3 column spots (CMYK print-ready PDF & layered PSD)",
        deadline: "2026-12-05",
        budget: "$7,000 – $15,000",
        rightsUsage: "Web + print, 1 year",
        visualReferences: "Swiss Grid, Geometric Portrait, Bold Spot Color",
        description:
          "Long-form feature exploring how recommendation engines shape cultural taste. Looking for sharp geometric metaphors in vermilion, cobalt, and warm ochre.",
        status: "in_progress",
        createdAt: daysAgo(5),
        updatedAt: hoursAgo(4),
      },
      {
        id: 2,
        userId: 1,
        projectType: "Magazine Cover",
        deliverables:
          "Autumn Architecture Issue — Brutalist Horizons cover wrap + social crop variants",
        deadline: "2026-11-28",
        budget: "$15,000 – $30,000",
        rightsUsage: "Worldwide, all media, 3 years",
        visualReferences: "Swiss Grid, Monochrome Ink, Bold architectural shadows",
        description:
          "Cover illustration celebrating concrete civic monuments with bold masthead integration at the top fifth of the grid.",
        status: "in_review",
        createdAt: daysAgo(2),
        updatedAt: hoursAgo(6),
      },
      {
        id: 3,
        userId: 1,
        projectType: "Book Cover",
        deliverables:
          "The Whispering Root — Hardcover jacket, spine lettering & endpaper pattern",
        deadline: "2026-12-18",
        budget: "$3,000 – $7,000",
        rightsUsage: "Web + print, perpetual",
        visualReferences: "Editorial Collage, Botanical relief, tactile paper grain",
        description:
          "Literary fiction debut set in an archival conservatory. Needs foil-stamp separation plates for the title lockup.",
        status: "delivered",
        createdAt: daysAgo(9),
        updatedAt: daysAgo(1),
      },
      {
        id: 4,
        userId: 1,
        projectType: "Data Visualization",
        deliverables:
          "Global Semiconductor Supply Chains — 2-page infographic spread + interactive SVG",
        deadline: "2026-10-30",
        budget: "$7,000 – $15,000",
        rightsUsage: "First publication only",
        visualReferences: "Isometric Infographic, Swiss Grid, strict hairline rules",
        description:
          "Mapping lithography chokepoints and fab capacity across three continents with clean numeric callouts.",
        status: "completed",
        createdAt: daysAgo(24),
        updatedAt: daysAgo(10),
      },
    ],
    drafts: [
      {
        id: 1,
        userId: 1,
        projectType: "Brand Identity",
        deliverables:
          "Cultural Biennial 2027 visual identity system, monogram & 12-column poster grid",
        deadline: "2027-01-15",
        budget: "$15,000 – $30,000",
        rightsUsage: "Worldwide, all media, perpetual",
        visualReferences: "Swiss Grid, Bold Spot Color",
        description:
          "Unified system spanning wayfinding signage, catalog typography, and digital motion bumpers.",
        createdAt: daysAgo(4),
        updatedAt: hoursAgo(12),
      },
      {
        id: 2,
        userId: 1,
        projectType: "Poster / Campaign",
        deliverables: "Kunsthalle Zurich — Winter Exhibition Series (3 A1 silkscreen posters)",
        deadline: "2026-12-22",
        budget: "$7,000 – $15,000",
        rightsUsage: "Web + print, perpetual",
        visualReferences: "Bold Spot Color, Geometric Portrait",
        description:
          "Triptych of exhibition posters using 3 spot Pantone inks on uncoated cotton stock.",
        createdAt: daysAgo(6),
        updatedAt: daysAgo(1),
      },
    ],
    messages: [
      {
        id: 1,
        userId: 1,
        commissionId: 1,
        senderType: "client",
        content:
          "Hi studio team! Our managing editor loved the first thumbnail sketches for The Algorithmic Essay. Can we push the red contrast slightly higher on spot #2?",
        createdAt: hoursAgo(18),
      },
      {
        id: 2,
        userId: 1,
        commissionId: 1,
        senderType: "studio",
        content:
          "Absolutely, Clara. We are revising the spot #2 focal geometry and uploading the Pantone 485C color study before end of day.",
        createdAt: hoursAgo(5),
      },
      {
        id: 3,
        userId: 1,
        commissionId: 2,
        senderType: "client",
        content:
          "For Brutalist Horizons, the print team confirmed we need 5mm bleed on all edges and a clean safe zone for the barcode bottom-left.",
        createdAt: hoursAgo(8),
      },
      {
        id: 4,
        userId: 1,
        commissionId: 2,
        senderType: "studio",
        content:
          "Noted — we locked the 5mm bleed guides and shifted the lower shadow block away from the barcode safe zone. Concept proof coming tomorrow.",
        createdAt: hoursAgo(3),
      },
      {
        id: 5,
        userId: 1,
        commissionId: 3,
        senderType: "studio",
        content:
          "Final press-ready hardcover jacket, foil stamp separations, and spine lettering for The Whispering Root have been delivered for your sign-off.",
        createdAt: hoursAgo(10),
      },
      {
        id: 6,
        userId: 1,
        commissionId: null,
        senderType: "studio",
        content:
          "Welcome to Editorial Commission Desk. Select any commission or write here to reach the studio producers directly.",
        createdAt: daysAgo(1),
      },
    ],
    deliverables: [
      {
        id: 1,
        commissionId: 1,
        versionLabel: "v1 · Compositional Wireframe",
        stage: "wireframe",
        imageUrl: "/proof-sketch-grid.svg",
        fileFormat: "SVG Vector Blueprint · 12-Col Grid",
        notes: "Initial thumbnail blocking across opener + 3 column spots with 5mm print bleed.",
        lockedUntilPaid: false,
        createdAt: daysAgo(4),
      },
      {
        id: 2,
        commissionId: 1,
        versionLabel: "v2 · Pantone Spot Study",
        stage: "color_study",
        imageUrl: "/proof-color-study.svg",
        fileFormat: "PDF Proof · PMS 485C / 534C / 1375C",
        notes: "Spot ink absorption check calibrated for uncoated editorial paper stock.",
        lockedUntilPaid: false,
        createdAt: hoursAgo(6),
      },
      {
        id: 3,
        commissionId: 2,
        versionLabel: "v1 · Cover Masthead Wireframe",
        stage: "wireframe",
        imageUrl: "/proof-sketch-grid.svg",
        fileFormat: "AI Wireframe · 230×300 mm",
        notes: "Barcode safe zone & top-fifth masthead clearance verified.",
        lockedUntilPaid: false,
        createdAt: daysAgo(1),
      },
      {
        id: 4,
        commissionId: 3,
        versionLabel: "v1 · Botanical Relief Wireframe",
        stage: "wireframe",
        imageUrl: "/proof-sketch-grid.svg",
        fileFormat: "SVG Blocking Study",
        notes: "Hardcover wrap geometry across spine, flaps, and title lockup.",
        lockedUntilPaid: false,
        createdAt: daysAgo(7),
      },
      {
        id: 5,
        commissionId: 3,
        versionLabel: "v2 · Spot Ink & Foil Proof",
        stage: "color_study",
        imageUrl: "/proof-color-study.svg",
        fileFormat: "CMYK + Gold Foil Overprint Proof",
        notes: "Verified uncoated cotton ink absorption and embossing trap margins.",
        lockedUntilPaid: false,
        createdAt: daysAgo(3),
      },
      {
        id: 6,
        commissionId: 3,
        versionLabel: "v3 · Final Press Master Package",
        stage: "final_press",
        imageUrl: "/proof-final-press.svg",
        fileFormat: "PDF/X-4 + Layered PSD + 16-bit TIFF",
        notes: "Full press-ready mechanicals ready for release once final milestone settles.",
        lockedUntilPaid: true,
        createdAt: hoursAgo(10),
      },
      {
        id: 7,
        commissionId: 4,
        versionLabel: "v1 · Infographic Flowchart Proof",
        stage: "wireframe",
        imageUrl: "/proof-sketch-grid.svg",
        fileFormat: "Vector Layout Grid",
        notes: "18 semiconductor corridors plotted at 100% scale.",
        lockedUntilPaid: false,
        createdAt: daysAgo(20),
      },
      {
        id: 8,
        commissionId: 4,
        versionLabel: "v3 · Press & Web SVG Master",
        stage: "final_press",
        imageUrl: "/proof-final-press.svg",
        fileFormat: "FOGRA39 PDF/X-4 + Interactive SVG",
        notes: "Published and archived with full clearance.",
        lockedUntilPaid: false,
        createdAt: daysAgo(10),
      },
    ],
    pins: [
      {
        id: 1,
        commissionId: 1,
        deliverableId: 1,
        xPercent: 28,
        yPercent: 34,
        authorName: "Clara Vance",
        authorRole: "client",
        comment: "Can we push the vermilion contrast 15% higher inside this primary frame?",
        resolved: true,
        createdAt: daysAgo(3),
      },
      {
        id: 2,
        commissionId: 1,
        deliverableId: 2,
        xPercent: 66,
        yPercent: 42,
        authorName: "Clara Vance",
        authorRole: "client",
        comment: "Pantone 534C balance looks super crisp next to the ochre diagonal block.",
        resolved: false,
        createdAt: hoursAgo(4),
      },
      {
        id: 3,
        commissionId: 2,
        deliverableId: 3,
        xPercent: 20,
        yPercent: 81,
        authorName: "Clara Vance",
        authorRole: "client",
        comment: "Confirmed: barcode safe box clearance matches our printer spec (32×18mm).",
        resolved: false,
        createdAt: hoursAgo(7),
      },
      {
        id: 4,
        commissionId: 3,
        deliverableId: 6,
        xPercent: 54,
        yPercent: 44,
        authorName: "Atelier Mondrian",
        authorRole: "studio",
        comment: "5mm full bleed & FOGRA39 separations verified. Ready for client sign-off.",
        resolved: false,
        createdAt: hoursAgo(9),
      },
    ],
    milestones: [
      {
        id: 1,
        commissionId: 1,
        title: "Commencement Deposit",
        percentage: 40,
        amountUsd: 4400,
        status: "paid",
        dueLabel: "Due upon brief acceptance",
        paidAt: daysAgo(5),
      },
      {
        id: 2,
        commissionId: 1,
        title: "Sketch & Color Sign-Off",
        percentage: 40,
        amountUsd: 4400,
        status: "pending",
        dueLabel: "Due at Stage 02 approval",
        paidAt: null,
      },
      {
        id: 3,
        commissionId: 1,
        title: "Final Master & License Release",
        percentage: 20,
        amountUsd: 2200,
        status: "pending",
        dueLabel: "Unlocks high-res press masters",
        paidAt: null,
      },
      {
        id: 4,
        commissionId: 2,
        title: "Commencement Deposit",
        percentage: 40,
        amountUsd: 9000,
        status: "paid",
        dueLabel: "Due upon brief acceptance",
        paidAt: daysAgo(2),
      },
      {
        id: 5,
        commissionId: 2,
        title: "Sketch & Color Sign-Off",
        percentage: 40,
        amountUsd: 9000,
        status: "pending",
        dueLabel: "Due at Stage 02 approval",
        paidAt: null,
      },
      {
        id: 6,
        commissionId: 2,
        title: "Final Master & License Release",
        percentage: 20,
        amountUsd: 4500,
        status: "pending",
        dueLabel: "Unlocks high-res press masters",
        paidAt: null,
      },
      {
        id: 7,
        commissionId: 3,
        title: "Commencement Deposit",
        percentage: 40,
        amountUsd: 2000,
        status: "paid",
        dueLabel: "Due upon brief acceptance",
        paidAt: daysAgo(9),
      },
      {
        id: 8,
        commissionId: 3,
        title: "Sketch & Color Sign-Off",
        percentage: 40,
        amountUsd: 2000,
        status: "paid",
        dueLabel: "Due at Stage 02 approval",
        paidAt: daysAgo(4),
      },
      {
        id: 9,
        commissionId: 3,
        title: "Final Master & License Release",
        percentage: 20,
        amountUsd: 1000,
        status: "pending",
        dueLabel: "Unlocks high-res press masters",
        paidAt: null,
      },
      {
        id: 10,
        commissionId: 4,
        title: "Commencement Deposit",
        percentage: 40,
        amountUsd: 4400,
        status: "paid",
        dueLabel: "Due upon brief acceptance",
        paidAt: daysAgo(24),
      },
      {
        id: 11,
        commissionId: 4,
        title: "Sketch & Color Sign-Off",
        percentage: 40,
        amountUsd: 4400,
        status: "paid",
        dueLabel: "Due at Stage 02 approval",
        paidAt: daysAgo(16),
      },
      {
        id: 12,
        commissionId: 4,
        title: "Final Master & License Release",
        percentage: 20,
        amountUsd: 2200,
        status: "paid",
        dueLabel: "Unlocks high-res press masters",
        paidAt: daysAgo(10),
      },
    ],
    revisions: [
      {
        commissionId: 1,
        includedRounds: 2,
        usedRounds: 1,
        extraRoundFeeUsd: 250,
      },
      {
        commissionId: 2,
        includedRounds: 2,
        usedRounds: 0,
        extraRoundFeeUsd: 250,
      },
      {
        commissionId: 3,
        includedRounds: 2,
        usedRounds: 2,
        extraRoundFeeUsd: 250,
      },
      {
        commissionId: 4,
        includedRounds: 2,
        usedRounds: 1,
        extraRoundFeeUsd: 250,
      },
    ],
    auditLogs: [
      {
        id: 1,
        commissionId: 1,
        actorName: "Clara Vance",
        actorRole: "client",
        action: "Commission Brief Submitted",
        detail: "Editorial Illustration opened ($7,000 – $15,000 · Web + print, 1 year).",
        createdAt: daysAgo(5),
      },
      {
        id: 2,
        commissionId: 1,
        actorName: "System Billing",
        actorRole: "system",
        action: "Milestone 1 Paid ($4,400)",
        detail: "40% Commencement Deposit cleared.",
        createdAt: daysAgo(5),
      },
      {
        id: 3,
        commissionId: 1,
        actorName: "Atelier Mondrian",
        actorRole: "studio",
        action: "Proof Uploaded · v2 Pantone Spot Study",
        detail: "Published color proof plate to Visual Proofing canvas.",
        createdAt: hoursAgo(6),
      },
      {
        id: 4,
        commissionId: 2,
        actorName: "Clara Vance",
        actorRole: "client",
        action: "Commission Brief Submitted",
        detail: "Magazine Cover brief initiated for Autumn Architecture Issue.",
        createdAt: daysAgo(2),
      },
      {
        id: 5,
        commissionId: 3,
        actorName: "Atelier Mondrian",
        actorRole: "studio",
        action: "Final Master Uploaded · v3",
        detail: "PDF/X-4 press mechanicals staged in Deliverables Vault (locked pending final milestone).",
        createdAt: hoursAgo(10),
      },
      {
        id: 6,
        commissionId: 4,
        actorName: "Clara Vance",
        actorRole: "client",
        action: "Final Delivery Signed Off",
        detail: "All 3 milestones settled ($11,000) and high-res masters released.",
        createdAt: daysAgo(10),
      },
    ],
    nextIds: {
      user: 3,
      commission: 5,
      draft: 3,
      message: 7,
      deliverable: 9,
      pin: 5,
      milestone: 13,
      audit: 7,
    },
  };
}

function hydrateDates(raw: Partial<MemoryStoreState>): MemoryStoreState {
  const seed = createSeedState();
  const hasDeliverables =
    Array.isArray(raw.deliverables) && raw.deliverables.length > 0;
  const hasPins = Array.isArray(raw.pins);
  const hasMilestones =
    Array.isArray(raw.milestones) && raw.milestones.length > 0;
  const hasRevisions =
    Array.isArray(raw.revisions) && raw.revisions.length > 0;
  const hasAuditLogs = Array.isArray(raw.auditLogs) && raw.auditLogs.length > 0;

  return {
    users: (raw.users || seed.users).map((u) => ({
      ...u,
      createdAt: new Date(u.createdAt),
      updatedAt: new Date(u.updatedAt),
      lastSignInAt: new Date(u.lastSignInAt),
    })),
    commissions: (raw.commissions || seed.commissions).map((c) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt),
    })),
    drafts: (raw.drafts || seed.drafts).map((d) => ({
      ...d,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
    })),
    messages: (raw.messages || seed.messages).map((m) => ({
      ...m,
      createdAt: new Date(m.createdAt),
    })),
    deliverables: (hasDeliverables ? raw.deliverables! : seed.deliverables).map(
      (d) => ({
        ...d,
        createdAt: new Date(d.createdAt),
      }),
    ),
    pins: (hasPins ? raw.pins! : seed.pins).map((p) => ({
      ...p,
      createdAt: new Date(p.createdAt),
    })),
    milestones: (hasMilestones ? raw.milestones! : seed.milestones).map((m) => ({
      ...m,
      paidAt: m.paidAt ? new Date(m.paidAt) : null,
    })),
    revisions: hasRevisions ? raw.revisions! : seed.revisions,
    auditLogs: (hasAuditLogs ? raw.auditLogs! : seed.auditLogs).map((a) => ({
      ...a,
      createdAt: new Date(a.createdAt),
    })),
    nextIds: {
      user: raw.nextIds?.user ?? seed.nextIds.user,
      commission: raw.nextIds?.commission ?? seed.nextIds.commission,
      draft: raw.nextIds?.draft ?? seed.nextIds.draft,
      message: raw.nextIds?.message ?? seed.nextIds.message,
      deliverable: raw.nextIds?.deliverable ?? seed.nextIds.deliverable,
      pin: raw.nextIds?.pin ?? seed.nextIds.pin,
      milestone: raw.nextIds?.milestone ?? seed.nextIds.milestone,
      audit: raw.nextIds?.audit ?? seed.nextIds.audit,
    },
  };
}

function loadInitialState(): MemoryStoreState {
  if (!DISK_PERSIST_ENABLED) {
    return createSeedState();
  }
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, "utf8");
      const parsed = JSON.parse(content) as Partial<MemoryStoreState>;
      if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
        return hydrateDates(parsed);
      }
    }
  } catch {
    // Fallback to seed state if file cannot be read or parsed
  }
  const seed = createSeedState();
  persistStore(seed);
  return seed;
}

function persistStore(state: MemoryStoreState): void {
  if (!DISK_PERSIST_ENABLED) return;
  try {
    fs.mkdirSync(STORE_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Ignore write failures in read-only serverless runtimes (e.g., Vercel)
  }
}

const globalForStore = globalThis as typeof globalThis & {
  __ecdMemoryStore?: MemoryStoreState;
};

function getStore(): MemoryStoreState {
  if (!globalForStore.__ecdMemoryStore) {
    globalForStore.__ecdMemoryStore = loadInitialState();
  }
  return globalForStore.__ecdMemoryStore;
}

function appendAuditEntry(
  store: MemoryStoreState,
  entry: Omit<CommissionAuditEntry, "id" | "createdAt">,
): CommissionAuditEntry {
  const created: CommissionAuditEntry = {
    id: store.nextIds.audit++,
    ...entry,
    createdAt: new Date(),
  };
  store.auditLogs.push(created);
  return created;
}

function ensureCommissionWorkspaceSeeded(
  store: MemoryStoreState,
  commission: Commission,
  actorName?: string,
): void {
  const hasMilestones = store.milestones.some(
    (m) => m.commissionId === commission.id,
  );
  if (!hasMilestones) {
    const totalUsd = BUDGET_TIER_MIDPOINTS[commission.budget] ?? 5000;
    const deposit = Math.round(totalUsd * 0.4);
    const sketchApproval = Math.round(totalUsd * 0.4);
    const finalRelease = Math.max(0, totalUsd - deposit - sketchApproval);
    store.milestones.push(
      {
        id: store.nextIds.milestone++,
        commissionId: commission.id,
        title: "Commencement Deposit",
        percentage: 40,
        amountUsd: deposit,
        status: "pending",
        dueLabel: "Due upon brief acceptance",
        paidAt: null,
      },
      {
        id: store.nextIds.milestone++,
        commissionId: commission.id,
        title: "Sketch & Color Sign-Off",
        percentage: 40,
        amountUsd: sketchApproval,
        status: "pending",
        dueLabel: "Due at Stage 02 approval",
        paidAt: null,
      },
      {
        id: store.nextIds.milestone++,
        commissionId: commission.id,
        title: "Final Master & License Release",
        percentage: 20,
        amountUsd: finalRelease,
        status: "pending",
        dueLabel: "Unlocks high-res press masters",
        paidAt: null,
      },
    );
  }

  const hasRevision = store.revisions.some(
    (r) => r.commissionId === commission.id,
  );
  if (!hasRevision) {
    store.revisions.push({
      commissionId: commission.id,
      includedRounds: 2,
      usedRounds: 0,
      extraRoundFeeUsd: 250,
    });
  }

  const hasDeliverable = store.deliverables.some(
    (d) => d.commissionId === commission.id,
  );
  if (!hasDeliverable) {
    store.deliverables.push({
      id: store.nextIds.deliverable++,
      commissionId: commission.id,
      versionLabel: "v1 · Initial Structural Wireframe",
      stage: "wireframe",
      imageUrl: "/proof-sketch-grid.svg",
      fileFormat: "SVG Grid Blueprint · 12-Col",
      notes: "Auto-staged compositional template ready for thumbnail blocking.",
      lockedUntilPaid: false,
      createdAt: new Date(),
    });
  }

  const hasAudit = store.auditLogs.some(
    (a) => a.commissionId === commission.id,
  );
  if (!hasAudit) {
    appendAuditEntry(store, {
      commissionId: commission.id,
      actorName: actorName || `Client #${commission.userId}`,
      actorRole: "client",
      action: "Commission Brief Submitted",
      detail: `${commission.projectType} opened (${commission.budget} · ${commission.rightsUsage}).`,
    });
  }
}

/** Reset the in-memory store (and local `.data/store.json` if enabled) back to initial seed data. */
export function resetMemoryStore() {
  const seed = createSeedState();
  globalForStore.__ecdMemoryStore = seed;
  persistStore(seed);
}

export function memFindUserByUnionId(unionId: string): User | undefined {
  return getStore().users.find((u) => u.unionId === unionId);
}

export function memUpsertUser(data: InsertUser): User {
  const store = getStore();
  const now = new Date();
  const existing = store.users.find((u) => u.unionId === data.unionId);
  if (existing) {
    if (data.name !== undefined) existing.name = data.name;
    if (data.email !== undefined) existing.email = data.email;
    if (data.avatar !== undefined) existing.avatar = data.avatar;
    if (data.role !== undefined) existing.role = data.role;
    existing.lastSignInAt = data.lastSignInAt ?? now;
    existing.updatedAt = now;
    persistStore(store);
    return existing;
  }

  const created: User = {
    id: store.nextIds.user++,
    unionId: data.unionId,
    name: data.name ?? null,
    email: data.email ?? null,
    avatar: data.avatar ?? null,
    role: data.role ?? "user",
    createdAt: data.createdAt ?? now,
    updatedAt: data.updatedAt ?? now,
    lastSignInAt: data.lastSignInAt ?? now,
  };
  store.users.push(created);
  persistStore(store);
  return created;
}

export function memFindCommissionsByUser(userId: number): Commission[] {
  return getStore()
    .commissions.filter((c) => c.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function memFindAllCommissions(): Commission[] {
  return [...getStore().commissions].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export function memFindCommissionById(id: number): Commission | undefined {
  return getStore().commissions.find((c) => c.id === id);
}

export function memCreateCommission(data: {
  userId: number;
  projectType: string;
  deliverables: string;
  deadline: string;
  budget: string;
  rightsUsage: string;
  visualReferences?: string;
  description?: string;
}): Commission {
  const store = getStore();
  const now = new Date();
  const created: Commission = {
    id: store.nextIds.commission++,
    userId: data.userId,
    projectType: data.projectType,
    deliverables: data.deliverables,
    deadline: data.deadline,
    budget: data.budget,
    rightsUsage: data.rightsUsage,
    visualReferences: data.visualReferences ?? null,
    description: data.description ?? null,
    status: "submitted",
    createdAt: now,
    updatedAt: now,
  };
  store.commissions.push(created);
  const author = store.users.find((u) => u.id === data.userId)?.name ?? undefined;
  ensureCommissionWorkspaceSeeded(store, created, author);
  persistStore(store);
  return created;
}

export function memUpdateCommissionStatus(
  id: number,
  status: Commission["status"],
): Commission | undefined {
  const store = getStore();
  const item = memFindCommissionById(id);
  if (!item) return undefined;
  const previousStatus = item.status;
  item.status = status;
  item.updatedAt = new Date();
  if (previousStatus !== status) {
    appendAuditEntry(store, {
      commissionId: id,
      actorName: "Atelier Mondrian",
      actorRole: "studio",
      action: `Stage Moved: ${status.replace("_", " ").toUpperCase()}`,
      detail: `Pipeline transitioned from ${previousStatus} to ${status}.`,
    });
  }
  persistStore(store);
  return item;
}

export function memRecordAuditEvent(
  entry: Omit<CommissionAuditEntry, "id" | "createdAt">,
): CommissionAuditEntry {
  const store = getStore();
  const created = appendAuditEntry(store, entry);
  persistStore(store);
  return created;
}

export function memGetCommissionWorkspace(
  commissionId: number,
  commissionOverride?: Commission,
): CommissionWorkspaceData | undefined {
  const store = getStore();
  const commission = commissionOverride ?? memFindCommissionById(commissionId);
  if (!commission) return undefined;

  ensureCommissionWorkspaceSeeded(store, commission);

  const deliverables = store.deliverables
    .filter((d) => d.commissionId === commissionId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const pins = store.pins
    .filter((p) => p.commissionId === commissionId)
    .sort((a, b) => a.id - b.id);

  const milestones = store.milestones
    .filter((m) => m.commissionId === commissionId)
    .sort((a, b) => a.id - b.id);

  const revisionState = store.revisions.find(
    (r) => r.commissionId === commissionId,
  ) ?? {
    commissionId,
    includedRounds: 2,
    usedRounds: 0,
    extraRoundFeeUsd: 250,
  };

  const auditLogs = store.auditLogs
    .filter((a) => a.commissionId === commissionId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const messages = store.messages
    .filter((m) => m.commissionId === commissionId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return {
    commission,
    deliverables,
    pins,
    milestones,
    revisionState,
    auditLogs,
    messages,
  };
}

export function memGetAllWorkspacesSummary(
  commissionIds?: number[],
): Record<number, CommissionWorkspaceSummary> {
  const store = getStore();
  const ids =
    commissionIds && commissionIds.length > 0
      ? commissionIds
      : store.commissions.map((c) => c.id);
  const result: Record<number, CommissionWorkspaceSummary> = {};

  for (const commissionId of ids) {
    const commission = store.commissions.find((c) => c.id === commissionId);
    if (commission) {
      ensureCommissionWorkspaceSeeded(store, commission);
    }
    const deliverables = store.deliverables.filter(
      (d) => d.commissionId === commissionId,
    );
    const pins = store.pins.filter((p) => p.commissionId === commissionId);
    const milestones = store.milestones
      .filter((m) => m.commissionId === commissionId)
      .sort((a, b) => a.id - b.id);
    const rev = store.revisions.find((r) => r.commissionId === commissionId) ?? {
      commissionId,
      includedRounds: 2,
      usedRounds: 0,
      extraRoundFeeUsd: 250,
    };
    const auditLogs = store.auditLogs.filter(
      (a) => a.commissionId === commissionId,
    );

    const paidAmountUsd = milestones
      .filter((m) => m.status === "paid")
      .reduce((sum, m) => sum + m.amountUsd, 0);
    const totalAmountUsd = milestones.reduce((sum, m) => sum + m.amountUsd, 0);

    result[commissionId] = {
      commissionId,
      deliverablesCount: deliverables.length,
      openPinsCount: pins.filter((p) => !p.resolved).length,
      resolvedPinsCount: pins.filter((p) => p.resolved).length,
      paidAmountUsd,
      totalAmountUsd,
      usedRounds: rev.usedRounds,
      includedRounds: rev.includedRounds,
      extraRoundFeeUsd: rev.extraRoundFeeUsd,
      milestones,
      auditCount: auditLogs.length,
    };
  }

  return result;
}

export function memAddProofPin(input: {
  commissionId: number;
  deliverableId: number;
  xPercent: number;
  yPercent: number;
  authorName: string;
  authorRole: "client" | "studio";
  comment: string;
}): ProofPinAnnotation {
  const store = getStore();
  const created: ProofPinAnnotation = {
    id: store.nextIds.pin++,
    commissionId: input.commissionId,
    deliverableId: input.deliverableId,
    xPercent: Math.max(0, Math.min(100, Number(input.xPercent.toFixed(1)))),
    yPercent: Math.max(0, Math.min(100, Number(input.yPercent.toFixed(1)))),
    authorName: input.authorName,
    authorRole: input.authorRole,
    comment: input.comment.trim(),
    resolved: false,
    createdAt: new Date(),
  };
  store.pins.push(created);
  appendAuditEntry(store, {
    commissionId: input.commissionId,
    actorName: input.authorName,
    actorRole: input.authorRole,
    action: `Proof Pin Added (${created.xPercent}%, ${created.yPercent}%)`,
    detail: created.comment,
  });
  persistStore(store);
  return created;
}

export function memFindPinById(pinId: number): ProofPinAnnotation | undefined {
  return getStore().pins.find((p) => p.id === pinId);
}

export function memToggleProofPinResolved(
  pinId: number,
  actorName: string,
  actorRole: "client" | "studio",
): ProofPinAnnotation | undefined {
  const store = getStore();
  const pin = store.pins.find((p) => p.id === pinId);
  if (!pin) return undefined;
  pin.resolved = !pin.resolved;
  appendAuditEntry(store, {
    commissionId: pin.commissionId,
    actorName,
    actorRole,
    action: pin.resolved ? `Pin #${pin.id} Resolved` : `Pin #${pin.id} Reopened`,
    detail: pin.comment,
  });
  persistStore(store);
  return pin;
}

export function memAddDeliverable(
  input: {
    commissionId: number;
    versionLabel: string;
    stage: ProofStage;
    imageUrl: string;
    fileFormat: string;
    notes: string;
    lockedUntilPaid?: boolean;
  },
  actorName: string,
): ProofDeliverable {
  const store = getStore();
  const created: ProofDeliverable = {
    id: store.nextIds.deliverable++,
    commissionId: input.commissionId,
    versionLabel: input.versionLabel.trim(),
    stage: input.stage,
    imageUrl: input.imageUrl.trim(),
    fileFormat: input.fileFormat.trim(),
    notes: input.notes.trim(),
    lockedUntilPaid: Boolean(input.lockedUntilPaid),
    createdAt: new Date(),
  };
  store.deliverables.push(created);
  appendAuditEntry(store, {
    commissionId: input.commissionId,
    actorName,
    actorRole: "studio",
    action: `Deliverable Uploaded · ${created.versionLabel}`,
    detail: `${created.fileFormat}${created.notes ? ` — ${created.notes}` : ""}`,
  });
  persistStore(store);
  return created;
}

export function memRequestRevision(input: {
  commissionId: number;
  notes: string;
  actorName: string;
  actorRole: "client" | "studio";
  userId: number;
}): {
  revisionState: CommissionRevisionState;
  extraInvoiceAdded: MilestoneInvoice | null;
} {
  const store = getStore();
  let rev = store.revisions.find((r) => r.commissionId === input.commissionId);
  if (!rev) {
    rev = {
      commissionId: input.commissionId,
      includedRounds: 2,
      usedRounds: 0,
      extraRoundFeeUsd: 250,
    };
    store.revisions.push(rev);
  }

  rev.usedRounds += 1;
  let extraInvoiceAdded: MilestoneInvoice | null = null;

  if (rev.usedRounds > rev.includedRounds) {
    extraInvoiceAdded = {
      id: store.nextIds.milestone++,
      commissionId: input.commissionId,
      title: `Extra Revision Round #${rev.usedRounds}`,
      percentage: 0,
      amountUsd: rev.extraRoundFeeUsd,
      status: "pending",
      dueLabel: `Out-of-scope surcharge (>${rev.includedRounds} included rounds)`,
      paidAt: null,
    };
    store.milestones.push(extraInvoiceAdded);
  }

  appendAuditEntry(store, {
    commissionId: input.commissionId,
    actorName: input.actorName,
    actorRole: input.actorRole,
    action: extraInvoiceAdded
      ? `Extra Revision Round #${rev.usedRounds} (+$${rev.extraRoundFeeUsd})`
      : `Revision Round #${rev.usedRounds} of ${rev.includedRounds} Requested`,
    detail: input.notes.trim(),
  });

  store.messages.push({
    id: store.nextIds.message++,
    userId: input.userId,
    commissionId: input.commissionId,
    senderType: input.actorRole,
    content: extraInvoiceAdded
      ? `Revision Round #${rev.usedRounds} requested (exceeds ${rev.includedRounds} included rounds; +$${rev.extraRoundFeeUsd} invoice added): ${input.notes.trim()}`
      : `Revision Round #${rev.usedRounds}/${rev.includedRounds} requested: ${input.notes.trim()}`,
    createdAt: new Date(),
  });

  persistStore(store);
  return { revisionState: { ...rev }, extraInvoiceAdded };
}

export function memPayMilestone(
  milestoneId: number,
  actorName: string,
): {
  milestone: MilestoneInvoice | undefined;
  unlockedDeliverables: number;
} {
  const store = getStore();
  const milestone = store.milestones.find((m) => m.id === milestoneId);
  if (!milestone) {
    return { milestone: undefined, unlockedDeliverables: 0 };
  }

  if (milestone.status !== "paid") {
    milestone.status = "paid";
    milestone.paidAt = new Date();
    appendAuditEntry(store, {
      commissionId: milestone.commissionId,
      actorName,
      actorRole: "client",
      action: `Milestone Paid · ${milestone.title} ($${milestone.amountUsd.toLocaleString("en-US")})`,
      detail: milestone.dueLabel,
    });
  }

  const commissionMilestones = store.milestones.filter(
    (m) => m.commissionId === milestone.commissionId,
  );
  const allPaid =
    commissionMilestones.length > 0 &&
    commissionMilestones.every((m) => m.status === "paid");

  let unlockedDeliverables = 0;
  if (allPaid) {
    for (const deliv of store.deliverables) {
      if (
        deliv.commissionId === milestone.commissionId &&
        deliv.lockedUntilPaid
      ) {
        deliv.lockedUntilPaid = false;
        unlockedDeliverables += 1;
      }
    }
    if (unlockedDeliverables > 0) {
      appendAuditEntry(store, {
        commissionId: milestone.commissionId,
        actorName: "System Vault",
        actorRole: "system",
        action: "Final Master Deliverables Unlocked",
        detail: `All milestones settled — ${unlockedDeliverables} press master file(s) unlocked.`,
      });
    }
  }

  persistStore(store);
  return { milestone, unlockedDeliverables };
}

export function memFindDraftsByUser(userId: number): CommissionDraft[] {
  return getStore()
    .drafts.filter((d) => d.userId === userId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

export function memFindDraftById(id: number): CommissionDraft | undefined {
  return getStore().drafts.find((d) => d.id === id);
}

export function memCreateDraft(data: {
  userId: number;
  projectType?: string;
  deliverables?: string;
  deadline?: string;
  budget?: string;
  rightsUsage?: string;
  visualReferences?: string;
  description?: string;
}): CommissionDraft {
  const store = getStore();
  const now = new Date();
  const created: CommissionDraft = {
    id: store.nextIds.draft++,
    userId: data.userId,
    projectType: data.projectType ?? null,
    deliverables: data.deliverables ?? null,
    deadline: data.deadline ?? null,
    budget: data.budget ?? null,
    rightsUsage: data.rightsUsage ?? null,
    visualReferences: data.visualReferences ?? null,
    description: data.description ?? null,
    createdAt: now,
    updatedAt: now,
  };
  store.drafts.push(created);
  persistStore(store);
  return created;
}

export function memUpdateDraft(
  id: number,
  data: Partial<Omit<CommissionDraft, "id" | "userId" | "createdAt">>,
): CommissionDraft | undefined {
  const store = getStore();
  const draft = memFindDraftById(id);
  if (!draft) return undefined;
  if (data.projectType !== undefined) draft.projectType = data.projectType;
  if (data.deliverables !== undefined) draft.deliverables = data.deliverables;
  if (data.deadline !== undefined) draft.deadline = data.deadline;
  if (data.budget !== undefined) draft.budget = data.budget;
  if (data.rightsUsage !== undefined) draft.rightsUsage = data.rightsUsage;
  if (data.visualReferences !== undefined) draft.visualReferences = data.visualReferences;
  if (data.description !== undefined) draft.description = data.description;
  draft.updatedAt = new Date();
  persistStore(store);
  return draft;
}

export function memDeleteDraft(id: number): void {
  const store = getStore();
  store.drafts = store.drafts.filter((d) => d.id !== id);
  persistStore(store);
}

export function memFindMessagesByUser(userId: number): Message[] {
  return getStore()
    .messages.filter((m) => m.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function memFindMessagesByCommission(commissionId: number): Message[] {
  return getStore()
    .messages.filter((m) => m.commissionId === commissionId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function memFindAllMessages(): Message[] {
  return [...getStore().messages].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export function memCreateMessage(data: {
  userId: number;
  commissionId?: number;
  senderType: "client" | "studio";
  content: string;
}): Message {
  const store = getStore();
  const created: Message = {
    id: store.nextIds.message++,
    userId: data.userId,
    commissionId: data.commissionId ?? null,
    senderType: data.senderType,
    content: data.content,
    createdAt: new Date(),
  };
  store.messages.push(created);
  persistStore(store);
  return created;
}
