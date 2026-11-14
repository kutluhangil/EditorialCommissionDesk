import { beforeEach, describe, expect, it } from "vitest";
import { appRouter } from "./router";
import { authenticateRequest } from "./kimi/auth";
import { resetMemoryStore } from "./queries/memory-store";
import { Session } from "@contracts/constants";

function extractCookieValue(setCookieHeader: string | null, name: string) {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? `${name}=${match[1]}` : null;
}

describe("Editorial Commission Desk tRPC workflows", () => {
  beforeEach(() => {
    resetMemoryStore();
  });

  it("supports demoLogin as client and studio admin with signed session cookie", async () => {
    const resHeaders = new Headers();
    const publicCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc", {
        headers: { host: "localhost:3000" },
      }),
      resHeaders,
    });

    const clientUser = await publicCaller.auth.demoLogin({ role: "user" });
    expect(clientUser.role).toBe("user");
    expect(clientUser.unionId).toBe("demo-client");

    const cookieHeader = extractCookieValue(
      resHeaders.get("set-cookie"),
      Session.cookieName,
    );
    expect(cookieHeader).toBeTruthy();

    const authedUser = await authenticateRequest(
      new Headers({ cookie: cookieHeader! }),
    );
    expect(authedUser.id).toBe(clientUser.id);
    expect(authedUser.role).toBe("user");

    const adminHeaders = new Headers();
    const adminPublicCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc", {
        headers: { host: "localhost:3000" },
      }),
      resHeaders: adminHeaders,
    });
    const adminUser = await adminPublicCaller.auth.demoLogin({ role: "admin" });
    expect(adminUser.role).toBe("admin");
    expect(adminUser.unionId).toBe("demo-admin");
  });

  it("handles drafts, commission creation, client cancel, admin stage moves, and messaging", async () => {
    const baseCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc", {
        headers: { host: "localhost:3000" },
      }),
      resHeaders: new Headers(),
    });

    const clientUser = await baseCaller.auth.demoLogin({ role: "user" });
    const adminUser = await baseCaller.auth.demoLogin({ role: "admin" });

    const clientCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc"),
      resHeaders: new Headers(),
      user: clientUser,
    });

    const adminCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc"),
      resHeaders: new Headers(),
      user: adminUser,
    });

    // Draft create -> update
    const draft = await clientCaller.draft.create({
      projectType: "Book Cover",
      deliverables: "Wrap jacket sketch",
    });
    expect(draft?.id).toBeDefined();

    const updatedDraft = await clientCaller.draft.update({
      id: draft!.id,
      budget: "$3,000 – $7,000",
    });
    expect(updatedDraft?.budget).toBe("$3,000 – $7,000");

    // Commission create & list
    const created = await clientCaller.commission.create({
      projectType: "Editorial Illustration",
      deliverables: "1 lead opener + 2 spots",
      deadline: "2026-12-20",
      budget: "$7,000 – $15,000",
      rightsUsage: "Web + print, 1 year",
      visualReferences: "Swiss Grid, Bold Spot Color",
      description: "Essay artwork",
    });
    expect(created?.status).toBe("submitted");

    const clientList = await clientCaller.commission.list();
    expect(clientList.some((c) => c.id === created?.id)).toBe(true);

    // Non-admin cannot update stage directly
    await expect(
      clientCaller.commission.updateStatus({
        id: created!.id,
        status: "approved",
      }),
    ).rejects.toThrow();

    // Admin can listAll and move stages
    const adminList = await adminCaller.commission.listAll();
    expect(adminList.length).toBeGreaterThanOrEqual(5);

    const moved = await adminCaller.commission.updateStatus({
      id: created!.id,
      status: "in_review",
    });
    expect(moved?.status).toBe("in_review");

    // Commission messages & studio reply
    await clientCaller.message.create({
      commissionId: created!.id,
      content: "Can we aim for Pantone 485C?",
    });

    await adminCaller.message.studioReply({
      userId: clientUser.id,
      commissionId: created!.id,
      content: "Yes — color proof scheduled for Thursday.",
    });

    const thread = await clientCaller.message.byCommission({
      commissionId: created!.id,
    });
    expect(thread).toHaveLength(2);
    expect(thread.some((m) => m.senderType === "studio")).toBe(true);

    // Client can cancel while in_review
    const cancelled = await clientCaller.commission.cancel({
      id: created!.id,
    });
    expect(cancelled?.status).toBe("cancelled");
  });

  it("supports delivery approval sign-off, upload inline/presign metadata, and demo reset", async () => {
    const baseCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc", {
        headers: { host: "localhost:3000" },
      }),
      resHeaders: new Headers(),
    });

    const clientUser = await baseCaller.auth.demoLogin({ role: "user" });
    const clientCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc"),
      resHeaders: new Headers(),
      user: clientUser,
    });

    // Seed commission #3 starts as 'delivered'
    const delivered = await clientCaller.commission.byId({ id: 3 });
    expect(delivered?.status).toBe("delivered");

    const approved = await clientCaller.commission.approveDelivery({ id: 3 });
    expect(approved?.status).toBe("completed");

    const approvalMessages = await clientCaller.message.byCommission({
      commissionId: 3,
    });
    expect(
      approvalMessages.some((m) => m.content.includes("marked as Completed")),
    ).toBe(true);

    // Cannot approve a non-delivered commission
    await expect(
      clientCaller.commission.approveDelivery({ id: 1 }),
    ).rejects.toThrow();

    // Upload validation & inline demo attachment
    const statusRes = await baseCaller.upload.status();
    expect(["s3", "inline"]).toContain(statusRes.mode);

    await expect(
      clientCaller.upload.presignOrInline({
        fileName: "malware.exe",
        contentType: "application/x-msdownload",
      }),
    ).rejects.toThrow();

    const uploaded = await clientCaller.upload.presignOrInline({
      fileName: "Mood Board 01.png",
      contentType: "image/png",
      dataUrl: "data:image/png;base64,iVBORw0KGgo=",
    });
    expect(uploaded.mode).toBe("inline");
    expect(uploaded.fileName).toBe("Mood-Board-01.png");
    expect(uploaded.publicUrl).toBe("data:image/png;base64,iVBORw0KGgo=");

    // Create extra draft then resetDemo -> returns cleanly to 4 seeded commissions / 2 drafts
    await clientCaller.draft.create({ projectType: "Other" });
    await clientCaller.commission.resetDemo();

    const postResetDelivered = await clientCaller.commission.byId({ id: 3 });
    expect(postResetDelivered?.status).toBe("delivered");
    const postResetDrafts = await clientCaller.draft.list();
    expect(postResetDrafts).toHaveLength(2);
  });

  it("supports workspace proofing pins, deliverables vault unlock on milestone payment, and extra revision guard", async () => {
    const publicCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc", {
        headers: { host: "localhost:3000" },
      }),
      resHeaders: new Headers(),
    });

    const clientUser = await publicCaller.auth.demoLogin({ role: "user" });
    const adminUser = await publicCaller.auth.demoLogin({ role: "admin" });

    const clientCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc"),
      resHeaders: new Headers(),
      user: clientUser,
    });
    const adminCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc"),
      resHeaders: new Headers(),
      user: adminUser,
    });

    // Public/guest read-only share review access works without session
    const guestWorkspace = await publicCaller.commission.workspaceById({ id: 3 });
    expect(guestWorkspace.commission.id).toBe(3);
    expect(guestWorkspace.deliverables.length).toBeGreaterThanOrEqual(3);
    const lockedDeliverable = guestWorkspace.deliverables.find(
      (d) => d.stage === "final_press",
    );
    expect(lockedDeliverable?.lockedUntilPaid).toBe(true);

    // Workspaces overview returns live counts for dashboard cards
    const overview = await clientCaller.commission.workspacesOverview();
    expect(overview[1]).toBeDefined();
    expect(overview[1].totalAmountUsd).toBe(11000);

    // Client places a coordinate proof pin on commission #1 deliverable #2
    const pin = await clientCaller.commission.addPin({
      commissionId: 1,
      deliverableId: 2,
      xPercent: 48.5,
      yPercent: 61.2,
      comment: "Tighten kerning on the headline lockup.",
    });
    expect(pin.resolved).toBe(false);
    expect(pin.xPercent).toBe(48.5);

    const toggledPin = await adminCaller.commission.togglePinResolved({
      pinId: pin.id,
    });
    expect(toggledPin.resolved).toBe(true);

    // Client cannot upload deliverables; studio admin can
    await expect(
      clientCaller.commission.uploadDeliverable({
        commissionId: 1,
        versionLabel: "v3 · Client Attempt",
        stage: "final_press",
        imageUrl: "/proof-final-press.svg",
        fileFormat: "PDF/X-4",
        notes: "Unauthorized",
      }),
    ).rejects.toThrow();

    const uploadedProof = await adminCaller.commission.uploadDeliverable({
      commissionId: 1,
      versionLabel: "v3 · Revised Pantone Proof",
      stage: "color_study",
      imageUrl: "/proof-color-study.svg",
      fileFormat: "PDF Proof",
      notes: "Adjusted headline kerning per Pin annotation",
      lockedUntilPaid: false,
    });
    expect(uploadedProof.commissionId).toBe(1);

    // Commission #3 has usedRounds=2 and includedRounds=2 -> next revision triggers surcharge invoice
    const revRes = await clientCaller.commission.requestRevision({
      commissionId: 3,
      notes: "One extra pass on foil embossing bleed margin.",
    });
    expect(revRes.revisionState.usedRounds).toBe(3);
    expect(revRes.extraInvoiceAdded?.amountUsd).toBe(250);
    expect(revRes.extraInvoiceAdded?.status).toBe("pending");

    // Paying all pending milestones on commission #3 unlocks the escrow-protected final press deliverable
    const ws3BeforePay = await clientCaller.commission.workspaceById({ id: 3 });
    const pendingMilestones = ws3BeforePay.milestones.filter(
      (m) => m.status === "pending",
    );
    expect(pendingMilestones.length).toBeGreaterThanOrEqual(2);

    let unlockedTotal = 0;
    for (const ms of pendingMilestones) {
      const payRes = await clientCaller.commission.payMilestone({
        commissionId: 3,
        milestoneId: ms.id,
      });
      expect(payRes.milestone?.status).toBe("paid");
      unlockedTotal += payRes.unlockedDeliverables;
    }
    expect(unlockedTotal).toBe(1);

    const ws3AfterPay = await clientCaller.commission.workspaceById({ id: 3 });
    const postPayFinal = ws3AfterPay.deliverables.find(
      (d) => d.stage === "final_press",
    );
    expect(postPayFinal?.lockedUntilPaid).toBe(false);
    expect(
      ws3AfterPay.auditLogs.some((a) =>
        a.action.includes("Final Master Deliverables Unlocked"),
      ),
    ).toBe(true);
  });

  it("enforces ownership checks against cross-user IDOR access", async () => {
    const baseCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc", {
        headers: { host: "localhost:3000" },
      }),
      resHeaders: new Headers(),
    });

    const ownerUser = await baseCaller.auth.demoLogin({ role: "user" });
    const otherUser = await baseCaller.auth.demoLogin({
      role: "user",
      name: "Rival Magazine",
      email: "rival@press.com",
    });
    expect(otherUser.id).not.toBe(ownerUser.id);

    const ownerCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc"),
      resHeaders: new Headers(),
      user: ownerUser,
    });
    const otherCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc"),
      resHeaders: new Headers(),
      user: otherUser,
    });

    const ownerDraft = await ownerCaller.draft.create({
      projectType: "Book Cover",
      deliverables: "Confidential jacket wrap",
    });

    const ownerPin = await ownerCaller.commission.addPin({
      commissionId: 1,
      deliverableId: 1,
      xPercent: 25,
      yPercent: 30,
      comment: "Owner proof note",
    });

    await expect(otherCaller.commission.byId({ id: 1 })).rejects.toThrow(
      /Access denied/,
    );
    await expect(
      otherCaller.draft.byId({ id: ownerDraft!.id }),
    ).rejects.toThrow(/Access denied/);
    await expect(
      otherCaller.draft.delete({ id: ownerDraft!.id }),
    ).rejects.toThrow(/Access denied/);
    await expect(
      otherCaller.message.byCommission({ commissionId: 1 }),
    ).rejects.toThrow(/Access denied/);
    await expect(
      otherCaller.commission.togglePinResolved({ pinId: ownerPin.id }),
    ).rejects.toThrow(/Access denied/);
  });

  it("rejects mismatched data URLs and embedded scripts in SVG uploads", async () => {
    const baseCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc", {
        headers: { host: "localhost:3000" },
      }),
      resHeaders: new Headers(),
    });
    const clientUser = await baseCaller.auth.demoLogin({ role: "user" });
    const clientCaller = appRouter.createCaller({
      req: new Request("http://localhost:3000/api/trpc"),
      resHeaders: new Headers(),
      user: clientUser,
    });

    await expect(
      clientCaller.upload.presignOrInline({
        fileName: "spoof.png",
        contentType: "image/png",
        dataUrl: "data:text/html;base64,PGh0bWw+PC9odG1sPg==",
      }),
    ).rejects.toThrow(/does not match declared file content type/);

    await expect(
      clientCaller.upload.presignOrInline({
        fileName: "xss.svg",
        contentType: "image/svg+xml",
        dataUrl:
          "data:image/svg+xml;charset=utf-8,%3Csvg%3E%3Cscript%3Ealert(1)%3C%2Fscript%3E%3C%2Fsvg%3E",
      }),
    ).rejects.toThrow(/Active scripts or event handlers/);

    const cleanPng = await clientCaller.upload.presignOrInline({
      fileName: "moodboard.png",
      contentType: "image/png",
      dataUrl: "data:image/png;base64,iVBORw0KGgo=",
    });
    expect(cleanPng.mode).toBe("inline");
    expect(cleanPng.publicUrl).toContain("data:image/png;base64,");
  });
});
