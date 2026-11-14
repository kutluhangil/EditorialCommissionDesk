import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import * as relations from "./relations";

async function seed() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.log(
      "DATABASE_URL is not set — Editorial Commission Desk runs automatically in disk-persisted demo store mode (.data/store.json).",
    );
    process.exit(0);
  }

  const db = drizzle(databaseUrl, {
    mode: "planetscale",
    schema: { ...schema, ...relations },
  });

  console.log("Seeding Editorial Commission Desk MySQL database...");

  const clientUnionId = "demo-client";
  const adminUnionId = process.env.OWNER_UNION_ID?.trim() || "demo-admin";

  await db
    .insert(schema.users)
    .values([
      {
        unionId: clientUnionId,
        name: "Clara Vance (The New Yorker)",
        email: "clara.vance@newyorker-editorial.com",
        role: "user",
      },
      {
        unionId: adminUnionId,
        name: "Atelier Mondrian (Studio Desk)",
        email: "desk@editorialcommission.studio",
        role: "admin",
      },
    ])
    .onDuplicateKeyUpdate({
      set: { lastSignInAt: new Date() },
    });

  const [clientUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.unionId, clientUnionId))
    .limit(1);

  if (!clientUser) {
    throw new Error("Failed to resolve seeded client user");
  }

  const existing = await db
    .select()
    .from(schema.commissions)
    .where(eq(schema.commissions.userId, clientUser.id))
    .limit(1);

  if (existing.length === 0) {
    const [{ id: c1 }] = await db
      .insert(schema.commissions)
      .values({
        userId: clientUser.id,
        projectType: "Editorial Illustration",
        deliverables:
          "The Algorithmic Essay: 1 full-page opener + 3 column spots (CMYK print-ready PDF & layered PSD)",
        deadline: "2026-12-05",
        budget: "$7,000 – $15,000",
        rightsUsage: "Web + print, 1 year",
        visualReferences: "Swiss Grid, Geometric Portrait, Bold Spot Color",
        description:
          "Long-form feature exploring how recommendation engines shape cultural taste.",
        status: "in_progress",
      })
      .$returningId();

    await db.insert(schema.commissions).values([
      {
        userId: clientUser.id,
        projectType: "Magazine Cover",
        deliverables:
          "Autumn Architecture Issue — Brutalist Horizons cover wrap + social crop variants",
        deadline: "2026-11-28",
        budget: "$15,000 – $30,000",
        rightsUsage: "Worldwide, all media, 3 years",
        visualReferences: "Swiss Grid, Monochrome Ink",
        description: "Cover illustration celebrating concrete civic monuments.",
        status: "in_review",
      },
      {
        userId: clientUser.id,
        projectType: "Book Cover",
        deliverables:
          "The Whispering Root — Hardcover jacket, spine lettering & endpaper pattern",
        deadline: "2026-12-18",
        budget: "$3,000 – $7,000",
        rightsUsage: "Web + print, perpetual",
        visualReferences: "Editorial Collage",
        description: "Literary fiction debut with foil-stamp separations.",
        status: "delivered",
      },
      {
        userId: clientUser.id,
        projectType: "Data Visualization",
        deliverables:
          "Global Semiconductor Supply Chains — 2-page infographic spread + interactive SVG",
        deadline: "2026-10-30",
        budget: "$7,000 – $15,000",
        rightsUsage: "First publication only",
        visualReferences: "Isometric Infographic, Swiss Grid",
        description: "Mapping lithography chokepoints and fab capacity.",
        status: "completed",
      },
    ]);

    await db.insert(schema.commissionDrafts).values([
      {
        userId: clientUser.id,
        projectType: "Brand Identity",
        deliverables:
          "Cultural Biennial 2027 visual identity system & 12-column poster grid",
        deadline: "2027-01-15",
        budget: "$15,000 – $30,000",
        rightsUsage: "Worldwide, all media, perpetual",
        visualReferences: "Swiss Grid, Bold Spot Color",
      },
    ]);

    await db.insert(schema.messages).values([
      {
        userId: clientUser.id,
        commissionId: c1,
        senderType: "client",
        content:
          "Our managing editor loved the first thumbnail sketches for The Algorithmic Essay.",
      },
      {
        userId: clientUser.id,
        commissionId: c1,
        senderType: "studio",
        content:
          "Thank you! Pantone 485C color study will be uploaded before end of day.",
      },
    ]);
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
