export type StudioThemeId = "mondrian" | "bauhaus" | "swiss" | "noir";

export interface StudioThemePreset {
  id: StudioThemeId;
  name: string;
  tagline: string;
  movementEra: string;
  red: string;
  blue: string;
  yellow: string;
  canvas: string;
  surface: string;
  ink: string;
  swatches: readonly [string, string, string];
  heroStudioImg: string;
  heroBannerImg: string;
  heroBannerCaption: string;
}

export interface ProductizedPackage {
  id: string;
  name: string;
  tagline: string;
  projectType: string;
  turnaroundDays: number;
  turnaroundLabel: string;
  priceUsd: number;
  budgetTier: string;
  rightsUsage: string;
  includedRevisions: number;
  deliverables: string;
  features: readonly string[];
  accent: "red" | "blue" | "yellow" | "ink";
  imageUrl: string;
  specCode: string;
}

export interface StudioCapacityMonth {
  id: string;
  month: string;
  quarter: string;
  totalSlots: number;
  bookedSlots: number;
  statusLabel: "Limited" | "Open" | "High Demand";
  focusNote: string;
}

export interface PortfolioCaseItem {
  slug: string;
  img: string;
  title: string;
  client: string;
  category: string;
  commissionType: string;
  turnaround: string;
  formatDimensions: string;
  rightsScope: string;
  briefSummary: string;
  challenge: string;
  solution: string;
  deliverableSpecs: string;
  paperStock: string;
  impactMetric: string;
  palette: readonly string[];
  processSteps: readonly string[];
}

export interface ArtistProfile {
  id: string;
  slug: string;
  name: string;
  role: string;
  discipline: string;
  city: string;
  availabilityLabel: string;
  dayRateUsd: number;
  leadTimeDays: number;
  bio: string;
  signatureStyle: string;
  samplePlates: readonly string[];
  clients: readonly string[];
  accentColor: "red" | "blue" | "yellow";
}

export interface PrintEditionItem {
  id: string;
  slug: string;
  title: string;
  artist: string;
  year: string;
  editionSize: number;
  remainingCount: number;
  dimensions: string;
  paperWeight: string;
  printMethod: string;
  priceUsd: number;
  imageUrl: string;
  certificateCode: string;
  notes: string;
}

export interface KillFeeStage {
  stageNumber: string;
  phase: string;
  triggerPoint: string;
  feePercentage: number;
  clientEntitlement: string;
  studioProtection: string;
}

export interface UsageRightsTier {
  id: string;
  tier: string;
  duration: string;
  territory: string;
  channels: string;
  multiplier: string;
  exclusivityNote: string;
  recommendedFor: string;
}

export interface PressMechanicalSpec {
  id: string;
  formatName: string;
  colorSpace: string;
  iccProfile: string;
  bleedMm: string;
  safeMarginMm: string;
  minDpi: string;
  preferredFileFormat: string;
  notes: string;
}

export const STUDIO_THEMES: Record<StudioThemeId, StudioThemePreset> = {
  mondrian: {
    id: "mondrian",
    name: "De Stijl Mondrian",
    tagline: "Primary pigment blocks & 2px structural rules",
    movementEra: "De Stijl · 1917",
    red: "#E63946",
    blue: "#1D3557",
    yellow: "#F4A261",
    canvas: "#FFFFFF",
    surface: "#F8F7F4",
    ink: "#0A0A0A",
    swatches: ["#E63946", "#1D3557", "#F4A261"],
    heroStudioImg: "/theme-mondrian-studio.jpg",
    heroBannerImg: "/hero-editorial-banner.jpg",
    heroBannerCaption:
      "DE STIJL EDITION 2026 · ASYMMETRIC PRIMARY PIGMENT BLOCKS & BRASS DRAFTING PLATES",
  },
  bauhaus: {
    id: "bauhaus",
    name: "Bauhaus Archive",
    tagline: "Warm museum cotton stock with Dessau terracotta, petrol & mustard",
    movementEra: "Weimar · 1923",
    red: "#C84B31",
    blue: "#1B4965",
    yellow: "#E9B44C",
    canvas: "#F5EFE0",
    surface: "#EAE0C8",
    ink: "#1E1B18",
    swatches: ["#E9B44C", "#1B4965", "#C84B31"],
    heroStudioImg: "/theme-bauhaus-studio.jpg",
    heroBannerImg: "/theme-bauhaus-banner.jpg",
    heroBannerCaption:
      "BAUHAUS ARCHIVE 2026 · CONSTRUCTIVIST GEOMETRY, WOODBLOCK SOLIDS & WARM COTTON STOCK",
  },
  swiss: {
    id: "swiss",
    name: "Swiss Alpine Grid",
    tagline: "Alpine emerald teal, Zurich slate & ice cyan mathematical grid",
    movementEra: "Zurich · 1957",
    red: "#0D9488",
    blue: "#0F172A",
    yellow: "#38BDF8",
    canvas: "#F4F6F8",
    surface: "#E2E8F0",
    ink: "#090D16",
    swatches: ["#0D9488", "#0F172A", "#38BDF8"],
    heroStudioImg: "/theme-swiss-studio.jpg",
    heroBannerImg: "/theme-swiss-banner.jpg",
    heroBannerCaption:
      "ZURICH INTERNATIONAL STYLE · MATHEMATICAL MODULAR GRIDS & PRECISION OPTICAL PROOFING",
  },
  noir: {
    id: "noir",
    name: "Noir Atelier",
    tagline: "Obsidian cotton press table with 24k gold leaf & crimson wax",
    movementEra: "Atelier Noir · Edition",
    red: "#D4AF37",
    blue: "#1E293B",
    yellow: "#F43F5E",
    canvas: "#0D0F12",
    surface: "#161920",
    ink: "#F5F3EF",
    swatches: ["#0D0F12", "#D4AF37", "#F43F5E"],
    heroStudioImg: "/theme-noir-studio.jpg",
    heroBannerImg: "/theme-noir-banner.jpg",
    heroBannerCaption:
      "ATELIER NOIR EDITION · 24K GOLD LEAF INTAGLIO PLATES, OBSIDIAN COTTON & CRIMSON WAX",
  },
};

export const STUDIO_CONFIG = {
  identity: {
    name: "Editorial Commission Desk",
    studioLabel: "Atelier Mondrian",
    subtitle: "Illustration & Design Practice",
    location: "New York · Berlin · Zurich",
    email: "desk@editorialcommission.studio",
    availabilityQuarter: "Q4 2026",
    monthlyCapacity: 5,
    bookedSlots: 4,
    heroStatement:
      "We partner with magazines, brands, and publishers to create visual work that is bold, considered, and culturally relevant. From concept to press-ready file.",
    heroSidebarStatement:
      "A commission experience designed by people with real taste. Transparent timelines. Clear rights. No surprises.",
    stats: [
      { label: "Response Time", value: "48h" },
      { label: "Projects Delivered", value: "340+" },
      { label: "Client Retention", value: "92%" },
    ],
  },
  themes: STUDIO_THEMES,
  productizedPackages: [
    {
      id: "oped-spot-pack",
      name: "Op-Ed Spot Illustration Pack",
      tagline: "Fast-turnaround artwork for essays, newsletters & columns",
      projectType: "Editorial Illustration",
      turnaroundDays: 4,
      turnaroundLabel: "4 Business Days",
      priceUsd: 1800,
      budgetTier: "Under $3,000",
      rightsUsage: "Web + print, 1 year",
      includedRevisions: 2,
      deliverables:
        "1 lead column illustration + 2 coordinate spot graphics (CMYK PDF & 300 DPI PNG)",
      features: [
        "3 initial thumbnail concepts within 24h",
        "2 included sketch/color revision rounds",
        "1-year web + print editorial license",
        "Interactive visual pin proofing workspace",
      ],
      accent: "red",
      imageUrl: "/pkg-oped-spot.jpg",
      specCode: "PLATE 01 · SPOT",
    },
    {
      id: "cover-motion-system",
      name: "Feature Spread & Cover System",
      tagline: "Flagship issue art direction with social crop adaptations",
      projectType: "Magazine Cover",
      turnaroundDays: 10,
      turnaroundLabel: "10 Business Days",
      priceUsd: 4800,
      budgetTier: "$3,000 – $7,000",
      rightsUsage: "Worldwide, all media, 3 years",
      includedRevisions: 3,
      deliverables:
        "Full magazine cover wrap with masthead safe zones + 3 social/newsletter motion crops",
      features: [
        "Barcode & masthead typography integration",
        "5mm bleed + FOGRA39 CMYK separation proof",
        "3 included revision rounds + Pantone studies",
        "Worldwide 3-year multi-channel license",
      ],
      accent: "blue",
      imageUrl: "/pkg-cover-system.svg",
      specCode: "PLATE 02 · COVER",
    },
    {
      id: "book-jacket-suite",
      name: "Press-Ready Book Jacket Suite",
      tagline: "Complete literary hardcover mechanicals with foil plates",
      projectType: "Book Cover",
      turnaroundDays: 14,
      turnaroundLabel: "14 Business Days",
      priceUsd: 3900,
      budgetTier: "$3,000 – $7,000",
      rightsUsage: "Web + print, perpetual",
      includedRevisions: 2,
      deliverables:
        "Hardcover front/spine/back jacket mechanicals, blind-deboss & foil separation plates + audiobook square",
      features: [
        "Custom hand-lettered spine & title lockup",
        "Print-ready foil stamp spot separation file",
        "Audiobook & e-book adaptive crop variants",
        "Perpetual print + digital edition rights",
      ],
      accent: "yellow",
      imageUrl: "/pkg-book-jacket.jpg",
      specCode: "PLATE 03 · JACKET",
    },
    {
      id: "data-journalism-spread",
      name: "Isometric Data Journalism Spread",
      tagline: "Editorial clarity for complex macroeconomic & tech reporting",
      projectType: "Data Visualization",
      turnaroundDays: 7,
      turnaroundLabel: "7 Business Days",
      priceUsd: 4200,
      budgetTier: "$3,000 – $7,000",
      rightsUsage: "Web + print, 1 year",
      includedRevisions: 2,
      deliverables:
        "Double-page comparative diagram spread + responsive interactive SVG + raw vector callouts",
      features: [
        "Dataset audit with color-blind safe encodings",
        "Dual print CMYK + crisp web SVG export",
        "Hierarchical Swiss micro-typography",
        "Editorial syndication ready deliverables",
      ],
      accent: "ink",
      imageUrl: "/pkg-data-spread.jpg",
      specCode: "PLATE 04 · ISOMETRIC",
    },
  ] satisfies readonly ProductizedPackage[],
  capacitySchedule: [
    {
      id: "2026-11",
      month: "November 2026",
      quarter: "Q4 2026",
      totalSlots: 5,
      bookedSlots: 4,
      statusLabel: "Limited",
      focusNote: "1 rush slot open for op-ed spots or covers.",
    },
    {
      id: "2026-12",
      month: "December 2026",
      quarter: "Q4 2026",
      totalSlots: 5,
      bookedSlots: 3,
      statusLabel: "High Demand",
      focusNote: "2 studio desks available for year-end issues & book jackets.",
    },
    {
      id: "2027-01",
      month: "January 2027",
      quarter: "Q1 2027",
      totalSlots: 6,
      bookedSlots: 2,
      statusLabel: "Open",
      focusNote: "Ideal window for full identity systems & spring exhibition posters.",
    },
    {
      id: "2027-02",
      month: "February 2027",
      quarter: "Q1 2027",
      totalSlots: 6,
      bookedSlots: 1,
      statusLabel: "Open",
      focusNote: "5 retainers & campaign commissions available.",
    },
  ] satisfies readonly StudioCapacityMonth[],
  portfolioItems: [
    {
      slug: "geometric-portraiture",
      img: "/portfolio-1.jpg",
      title: "Geometric Portraiture",
      client: "Visionary Quarterly",
      category: "Editorial Illustration",
      commissionType: "Editorial Illustration",
      turnaround: "9 days",
      formatDimensions: "Full-page opener (210 × 280 mm · CMYK 300 DPI)",
      rightsScope: "First print & digital feature · 1 year",
      briefSummary:
        "Lead essay portrait examining civic architecture and human proportion through interlocking De Stijl planes and flat halftone shading.",
      challenge:
        "Distill a 6,000-word urban planning essay into a single human icon without relying on literal skylines or stock collage tropes.",
      solution:
        "Constructed an asymmetric portrait locked to an 8-column Swiss baseline where primary ink blocks carry emotional tension at both poster and mobile scale.",
      deliverableSpecs: "PDF/X-4 CMYK opener · Layered 16-bit TIFF · 16:9 digital hero crop",
      paperStock: "Munken Polar Rough 120 gsm (Uncoated Offset)",
      impactMetric: "+38% print issue newsstand sell-through · SPD Merit Finalist",
      palette: ["#E63946", "#1D3557", "#F4A261", "#111111"],
      processSteps: [
        "01. Editorial read-through & 4 thumbnail composition studies",
        "02. Modular grid blocking and silhouette contrast approval",
        "03. Spot color separation & uncoated paper ink proof test",
        "04. Print-ready PDF/X-4 delivery + layered archival TIFF",
      ],
    },
    {
      slug: "verve-and-line",
      img: "/portfolio-2.jpg",
      title: "Verve & Line",
      client: "Modern Fashion",
      category: "Magazine Layout",
      commissionType: "Art Direction",
      turnaround: "2 weeks",
      formatDimensions: "12-page spread system (230 × 300 mm · Swiss grid)",
      rightsScope: "Worldwide print + digital anthology",
      briefSummary:
        "Art direction and typographic spread architecture balancing austere black rules against high-contrast runway silhouettes.",
      challenge:
        "Unify archival runway photography, six commissioned essay spots, and bilingual captions inside a tight 14-day press lock window.",
      solution:
        "Established a strict 2px hairline grid system paired with tabular folio numbers and high-contrast spot ink callouts across all 12 pages.",
      deliverableSpecs: "Packaged InDesign IDML · FOGRA39 CMYK blueline · Apple News crop kit",
      paperStock: "Arctic Volume White 115 gsm · French-fold gatefold cover",
      impactMetric: "Adopted as Modern Fashion's permanent Autumn/Winter grid system",
      palette: ["#0F0F0F", "#E63946", "#EAE6DF", "#4A5568"],
      processSteps: [
        "01. 12-column baseline grid calibration with fashion desk",
        "02. Headline kinetic pairings and folio rhythm prototypes",
        "03. Illustration spot integration across 6 feature essays",
        "04. Complete InDesign package & press-checked bluelines",
      ],
    },
    {
      slug: "ica-berlin",
      img: "/portfolio-3.jpg",
      title: "Institute of Contemporary Arts",
      client: "ICA Berlin",
      category: "Cultural Poster",
      commissionType: "Poster / Campaign",
      turnaround: "11 days",
      formatDimensions: "DIN A1 street poster + 2-color risograph edition",
      rightsScope: "Worldwide cultural & exhibition signage · perpetual",
      briefSummary:
        "Exhibition poster series built around asymmetric primary blocks and bold grotesque typography designed to read from 20 meters away.",
      challenge:
        "Create wayfinding posters capable of commanding attention inside chaotic Berlin U-Bahn station lightboxes without photographic imagery.",
      solution:
        "Paired 3-spot Pantone overprint geometry with industrial stencil numerals and a modular exhibition date strip that adapts across 14 venues.",
      deliverableSpecs: "DIN A1 3-spot Pantone PDF · A3 Risograph master layers · Social motion stills",
      paperStock: "Fedrigoni Arena Bulk 170 gsm (Archival Cotton Blend)",
      impactMetric: "24,000 opening-month exhibition visitors · Sold-out 200-copy print run",
      palette: ["#1D3557", "#F4A261", "#E63946", "#FAFAFA"],
      processSteps: [
        "01. Wayfinding scale audit for Berlin U-Bahn lightboxes",
        "02. Three structural poster variations tested in greyscale",
        "03. Pantone overprint trap specification for silkscreen",
        "04. Final A1 press plates + animated social teaser stills",
      ],
    },
    {
      slug: "novus-identity-system",
      img: "/portfolio-4.jpg",
      title: "Novus Identity System",
      client: "Novus Studio",
      category: "Brand Identity",
      commissionType: "Brand Identity",
      turnaround: "4 weeks",
      formatDimensions: "Full identity suite (SVG monogram, stationery & guidelines)",
      rightsScope: "Worldwide, all media, perpetual buyout",
      briefSummary:
        "Constructivist brand language spanning geometric mark construction, systematic color coding, and modular stationery templates.",
      challenge:
        "Replace an outdated legacy emblem with a razor-sharp modular mark equally legible on 16px favicons, embossed letterhead, and concrete signage.",
      solution:
        "Designed an interlocking 3-ratio geometric symbol governed by a documented grid token matrix for CSS variables, print spot inks, and stationery.",
      deliverableSpecs: "SVG/EPS vector master kit · 42-page PDF identity bible · Figma & CSS design tokens",
      paperStock: "Gmund Cotton Max White 300 gsm (Letterpress Stationery)",
      impactMetric: "Unified 9 regional studio offices under one reusable design token repo",
      palette: ["#000000", "#E63946", "#1D3557", "#F4A261"],
      processSteps: [
        "01. Visual positioning sprint & competitive semiotics map",
        "02. Monogram ratio geometry & minimum-scale stress tests",
        "03. Color system + UI grid tokens for web & printed matter",
        "04. 42-page brand manual, SVG master pack & merch specs",
      ],
    },
    {
      slug: "the-whispering-root",
      img: "/portfolio-5.jpg",
      title: "The Whispering Root",
      client: "Penguin Books",
      category: "Book Cover",
      commissionType: "Book Cover",
      turnaround: "2.5 weeks",
      formatDimensions: "Hardcover jacket, spine & embossed case stamp (156 × 234 mm)",
      rightsScope: "North America & UK hardcover + paperback editions",
      briefSummary:
        "Atmospheric botanical cover balancing stark architectural framing with delicate relief illustration and custom display title cuts.",
      challenge:
        "Position a literary eco-thriller to stand apart from generic floral bookshop tables while keeping clear spine hierarchy for flat-lay merchandising.",
      solution:
        "Framed custom botanical relief art inside strict dark structural rules with copper foil spot separations and hand-cut display ligatures.",
      deliverableSpecs: "Full hardcover wrap PDF/X-1a · Foil & deboss spot vector plates · 3000px e-book square",
      paperStock: "Lessebo Design Smooth 150 gsm + Kurz Luxor Copper Foil",
      impactMetric: "3rd printing within 6 weeks · Featured Best Jackets Annual",
      palette: ["#1D3557", "#2A9D8F", "#F4A261", "#18181B"],
      processSteps: [
        "01. Manuscript motif inventory & 3 distinct cover directions",
        "02. Jacket wrap geometry covering flaps, spine & barcode box",
        "03. Foil stamping & blind deboss mechanical separations",
        "04. Press-ready hardcover mechanicals + audiobook square",
      ],
    },
    {
      slug: "global-market-trends",
      img: "/portfolio-6.jpg",
      title: "Global Market Trends",
      client: "The Economist",
      category: "Data Visualization",
      commissionType: "Data Visualization",
      turnaround: "7 days",
      formatDimensions: "Double-page infographic spread + web SVG",
      rightsScope: "Web + print editorial syndication · 1 year",
      briefSummary:
        "Comparative macroeconomic chart series translating 18 trade corridors into crisp geometric flow diagrams without visual clutter.",
      challenge:
        "Present 18 bilateral tariff shifts and supply-chain latencies cleanly across a magazine gutterfold and narrow mobile article viewports.",
      solution:
        "Built a dual-axis isometric flow system tested against deuteranopia simulators, pairing tabular monospace callouts with crisp SVG paths.",
      deliverableSpecs: "CMYK double-page spread PDF · Clean semantic SVG (<140 KB) · CSV-linked style guide",
      paperStock: "Holmen TRND 70 gsm (Heatset Web Offset Newsprint)",
      impactMetric: "420k interactive reader views · Syndicated to 11 international editions",
      palette: ["#E63946", "#1D3557", "#F4A261", "#6B7280"],
      processSteps: [
        "01. Statistical dataset audit with data journalism editors",
        "02. Visual encoding prototypes prioritizing legibility at small scale",
        "03. Hairline typography hierarchy & color-blind safe checks",
        "04. Dual CMYK print spread + responsive web vector layers",
      ],
    },
    {
      slug: "constructivist-opera-season",
      img: "/portfolio-7.svg",
      title: "Constructivist Opera Season",
      client: "Staatsoper Wien",
      category: "Cultural Poster",
      commissionType: "Poster / Campaign",
      turnaround: "10 days",
      formatDimensions: "DIN A1 3-Spot Pantone Silkscreen + Digital Program",
      rightsScope: "Europe & international tour signage · perpetual",
      briefSummary:
        "Acoustic geometry and heavy constructivist grid lines celebrating four winter repertory premieres with crisp overprint spot separations.",
      challenge:
        "Harmonize four radically different composer traditions under one recognizable civic festival system on street kiosks and opera playbills.",
      solution:
        "Encoded harmonic intervals as concentric geometric wedges and heavy structural bars that produce new secondary hues where Pantone screens overlap.",
      deliverableSpecs: "3-channel Pantone separation PDFs · DIN A1 poster · 64-page playbill slipcase cover",
      paperStock: "Rives Tradition Pale Cream 250 gsm (Silkscreen Run)",
      impactMetric: "98% season subscription renewal across winter repertory",
      palette: ["#E63946", "#1D3557", "#F4A261", "#111111"],
      processSteps: [
        "01. Libretto motif synthesis & geometric stage proportions",
        "02. Acoustic ring cadence & Swiss grotesque display typography",
        "03. 3-color Pantone silkscreen overprint registration check",
        "04. A1 archival screenprint run + seasonal web header plates",
      ],
    },
    {
      slug: "cartography-of-synthetic-minds",
      img: "/portfolio-8.svg",
      title: "Cartography of Synthetic Minds",
      client: "MIT Press",
      category: "Data Visualization",
      commissionType: "Data Visualization",
      turnaround: "8 days",
      formatDimensions: "Monograph fold-out diagram + web SVG interactive plate",
      rightsScope: "Worldwide print + academic digital edition · 3 years",
      briefSummary:
        "Isometric polyhedral network mapping latent representations and transformer routing paths in a dark editorial blueprint aesthetic.",
      challenge:
        "Make multi-head attention topology intuitive to non-specialist policy readers without oversimplifying technical accuracy.",
      solution:
        "Created an orthographic blueprint diagram contrasting crisp white hairlines against vermilion routing nodes and numbered technical margin notes.",
      deliverableSpecs: "Tip-in fold-out plate (420 × 260 mm) · Accessible ARIA-labeled web SVG",
      paperStock: "Mohawk Superfine Eggshell 148 gsm (Rich Black Spot Wash)",
      impactMetric: "Adopted as centerpiece illustration for university syllabus distribution",
      palette: ["#111827", "#E63946", "#F4A261", "#1D3557"],
      processSteps: [
        "01. Research taxonomy alignment with MIT Press editors",
        "02. Isometric projection wireframe & callout hierarchy",
        "03. High-contrast midnight ink proof + crisp white hairlines",
        "04. Vector PDF fold-out plate + web-optimized SVG bundle",
      ],
    },
  ] satisfies readonly PortfolioCaseItem[],
  artistsRoster: [
    {
      id: "maren-solberg",
      slug: "maren-solberg",
      name: "Maren Solberg",
      role: "Founding Principal & Lead Illustrator",
      discipline: "Editorial Illustration & Op-Ed Portraiture",
      city: "Berlin / Oslo",
      availabilityLabel: "Booking November Q4",
      dayRateUsd: 950,
      leadTimeDays: 4,
      bio: "Former newspaper art director specializing in conceptual woodblock geometry, psychological essay openers, and rapid newsroom turnarounds.",
      signatureStyle: "Interlocking primary color fields, flat ink textures & architectural human silhouettes",
      samplePlates: ["/portfolio-1.jpg", "/pkg-oped-spot.jpg", "/hero-editorial-banner.jpg"],
      clients: ["The New Yorker", "Die Zeit", "Visionary Quarterly", "Monocle"],
      accentColor: "red",
    },
    {
      id: "tomasz-kowalski",
      slug: "tomasz-kowalski",
      name: "Tomasz Kowalski",
      role: "Typography & Exhibition Poster Director",
      discipline: "Art Direction & Constructivist Print",
      city: "Zurich / Warsaw",
      availabilityLabel: "Open Q4 & Q1",
      dayRateUsd: 1100,
      leadTimeDays: 7,
      bio: "Trained in the Polish Poster School and Zurich International Style. Directs magazine redesigns, silkscreen poster seasons, and bilingual mastheads.",
      signatureStyle: "Heavy 2px grid rules, custom grotesque cuts & 3-spot Pantone overprints",
      samplePlates: ["/portfolio-3.jpg", "/portfolio-7.svg", "/theme-swiss-banner.jpg"],
      clients: ["Staatsoper Wien", "ICA Berlin", "Modern Fashion", "Kunsthalle Zürich"],
      accentColor: "blue",
    },
    {
      id: "nadia-okafor",
      slug: "nadia-okafor",
      name: "Nadia Okafor",
      role: "Senior Data Cartographer",
      discipline: "Information Design & Isometric Diagrams",
      city: "New York",
      availabilityLabel: "1 Slot Open Nov",
      dayRateUsd: 1050,
      leadTimeDays: 6,
      bio: "Combines economic journalism training with precision vector cartography, turning dense datasets into readable print spreads and interactive SVGs.",
      signatureStyle: "Isometric architectural projections, color-blind safe palettes & hairline callouts",
      samplePlates: ["/portfolio-6.jpg", "/portfolio-8.svg", "/pkg-data-spread.jpg"],
      clients: ["The Economist", "MIT Press", "Financial Times", "Rest of World"],
      accentColor: "yellow",
    },
    {
      id: "kenji-takahashi",
      slug: "kenji-takahashi",
      name: "Kenji Takahashi",
      role: "Book Jacket & Tactile Production Lead",
      discipline: "Hardcover Packaging & Foil Mechanicals",
      city: "Tokyo / New York",
      availabilityLabel: "Booking Dec / Jan",
      dayRateUsd: 1000,
      leadTimeDays: 10,
      bio: "Master of physical print production—specializing in French-fold jackets, blind deboss dies, foil stamping separations, and collectors' monographs.",
      signatureStyle: "Textured cotton stocks, brass foil separations & sculptural jacket typography",
      samplePlates: ["/portfolio-5.jpg", "/pkg-book-jacket.jpg", "/theme-bauhaus-banner.jpg"],
      clients: ["Penguin Books", "Faber & Faber", "Mack Books", "New Directions"],
      accentColor: "red",
    },
  ] satisfies readonly ArtistProfile[],
  printEditions: [
    {
      id: "ed-destijl-01",
      slug: "de-stijl-atelier-plate",
      title: "De Stijl Atelier Specimen No. 01",
      artist: "Maren Solberg",
      year: "2026",
      editionSize: 75,
      remainingCount: 14,
      dimensions: "50 × 70 cm (UNFRAMED · 4CM ARCHIVAL BORDER)",
      paperWeight: "Hahnemühle Photo Rag 308 gsm Cotton",
      printMethod: "12-channel Ultrachrome Giclée + Blind Embossed Seal",
      priceUsd: 240,
      imageUrl: "/hero-editorial-banner.jpg",
      certificateCode: "ECD-ED-2026-01",
      notes: "Signed and pencil-numbered on recto; accompanied by studio provenance dossier.",
    },
    {
      id: "ed-bauhaus-02",
      slug: "dessau-constructivist-plate",
      title: "Weimar Workshop Composition II",
      artist: "Tomasz Kowalski",
      year: "2026",
      editionSize: 50,
      remainingCount: 9,
      dimensions: "59.4 × 84.1 cm (DIN A1 · FULL BLEED)",
      paperWeight: "Gmund Cotton Cream 300 gsm",
      printMethod: "4-Spot Pantone Silkscreen Overprint",
      priceUsd: 320,
      imageUrl: "/theme-bauhaus-banner.jpg",
      certificateCode: "ECD-ED-2026-02",
      notes: "Hand-pulled in Zurich using opaque mineral terracotta and ultramarine inks.",
    },
    {
      id: "ed-swiss-03",
      slug: "zurich-modular-grid-03",
      title: "Zurich Alpine Mathematical Plate",
      artist: "Nadia Okafor",
      year: "2026",
      editionSize: 60,
      remainingCount: 22,
      dimensions: "50 × 70 cm (SWISS RATIO 5:7)",
      paperWeight: "Munken Polar Rough 240 gsm",
      printMethod: "3-Color Risograph + Offset Silver Keyplate",
      priceUsd: 210,
      imageUrl: "/theme-swiss-banner.jpg",
      certificateCode: "ECD-ED-2026-03",
      notes: "Soy-based teal, slate, and cyan drums printed with strict 0.25mm hairline alignment.",
    },
    {
      id: "ed-noir-04",
      slug: "atelier-noir-gold-leaf",
      title: "Atelier Noir Intaglio Study IV",
      artist: "Kenji Takahashi",
      year: "2026",
      editionSize: 35,
      remainingCount: 4,
      dimensions: "42 × 59.4 cm (DIN A2 · DECKLE EDGE)",
      paperWeight: "Somerset Black Velvet 280 gsm",
      printMethod: "Hot 24k Gold Foil Stamp & Crimson Screen Ink",
      priceUsd: 390,
      imageUrl: "/theme-noir-banner.jpg",
      certificateCode: "ECD-ED-2026-04",
      notes: "Extremely scarce final archive run stamped with Atelier Noir collector wax seal.",
    },
  ] satisfies readonly PrintEditionItem[],
  killFeeStages: [
    {
      stageNumber: "01",
      phase: "Booking & Creative Deposit",
      triggerPoint: "Cancellation after brief approval & studio calendar lock before sketches",
      feePercentage: 40,
      clientEntitlement: "Non-refundable booking retainer; credit transferable once within 90 days",
      studioProtection: "Compensates reserved artist capacity & declined competing inquiries",
    },
    {
      stageNumber: "02",
      phase: "Thumbnail & Concept Sketches",
      triggerPoint: "Cancellation after delivery of 3–4 initial composition studies",
      feePercentage: 50,
      clientEntitlement: "Concept PDF archive (editorial reference only; no commercial publication right)",
      studioProtection: "Covers research, editorial reading & conceptual exploration hours",
    },
    {
      stageNumber: "03",
      phase: "Refined Color Proof",
      triggerPoint: "Cancellation during proof pin revisions or near-complete color artwork",
      feePercentage: 75,
      clientEntitlement: "Work-in-progress proof files; commercial rights withheld unless upgraded to 100%",
      studioProtection: "Protects full production execution & color separation effort",
    },
    {
      stageNumber: "04",
      phase: "Final Press Delivery",
      triggerPoint: "Cancellation after delivery of press-ready masters (PDF/X-4 / TIFF / SVG)",
      feePercentage: 100,
      clientEntitlement: "Full contracted usage license grants automatically upon settlement",
      studioProtection: "Enforces complete settlement for finished commercial intellectual property",
    },
  ] satisfies readonly KillFeeStage[],
  usageRightsComparison: [
    {
      id: "editorial-1yr",
      tier: "Editorial First Serial",
      duration: "1 Year Non-Exclusive",
      territory: "Primary Publication Country",
      channels: "Print issue + web article + newsletter excerpt",
      multiplier: "1.0× Base Rate",
      exclusivityNote: "Creator retains syndication rights after 90-day embargo",
      recommendedFor: "Magazine essays, op-ed columns & literary journals",
    },
    {
      id: "multi-3yr",
      tier: "Multi-Channel Commercial",
      duration: "3 Years Category-Exclusive",
      territory: "Worldwide All Languages",
      channels: "Print, digital campaigns, OOH posters, paid social & packaging",
      multiplier: "1.5× Base Rate",
      exclusivityNote: "Blocks competing brands inside client's sector during term",
      recommendedFor: "Brand campaigns, festival seasons & product launches",
    },
    {
      id: "perpetual-buyout",
      tier: "Perpetual Brand Buyout",
      duration: "Perpetuity",
      territory: "Worldwide Unlimited",
      channels: "Full ownership transfer + raw layered vectors + merchandise",
      multiplier: "2.2× Base Rate",
      exclusivityNote: "Exclusive perpetual title transferred via signed Rights Deed",
      recommendedFor: "Core logomarks, book series classics & permanent architecture",
    },
  ] satisfies readonly UsageRightsTier[],
  pressMechanicalSpecs: [
    {
      id: "magazine-opener",
      formatName: "Magazine Feature / Op-Ed Plate",
      colorSpace: "CMYK Coated / Uncoated Offset",
      iccProfile: "ISO Coated v2 300% (FOGRA39) or PSO Uncoated",
      bleedMm: "5 mm all 4 edges",
      safeMarginMm: "12 mm live type safety from trim & gutter",
      minDpi: "300 DPI at 100% scale",
      preferredFileFormat: "PDF/X-4:2010 + Layered 16-bit TIFF + WebP preview",
      notes: "Total area coverage (TAC) capped at 300% to prevent show-through on thin newsprint.",
    },
    {
      id: "book-jacket",
      formatName: "Hardcover Jacket, Spine & Case Foil",
      colorSpace: "CMYK + Pantone Spot Metallic / Foil Vectors",
      iccProfile: "GRACoL 2006 Coated1 v2",
      bleedMm: "5 mm outer + 95 mm French-fold flap allowance",
      safeMarginMm: "4 mm spine hinge clearance per side",
      minDpi: "300 DPI raster · Infinity (vector) for foil/deboss dies",
      preferredFileFormat: "PDF/X-1a separate plates (4C + Spot_Foil + Spot_Deboss)",
      notes: "Spine width recalculated after final printer paper bulk confirmation (bulk index).",
    },
    {
      id: "silkscreen-a1",
      formatName: "DIN A1 Exhibition Silkscreen / Risograph",
      colorSpace: "Spot Pantone Solid Uncoated (3–4 channels)",
      iccProfile: "Grayscale Halftone Separations (65 LPI screen)",
      bleedMm: "3 mm (full-bleed) or 20 mm clean deckle margin",
      safeMarginMm: "15 mm display lockup border",
      minDpi: "600 DPI 1-bit bitmap / Pure vector hairline >= 0.35 pt",
      preferredFileFormat: "Multi-layer AI / EPS / PDF with 0.25mm choke-and-spread trapping",
      notes: "Overprint preview must be validated prior to burning silkscreen mesh positives.",
    },
    {
      id: "digital-svg",
      formatName: "Interactive Web & Editorial SVG",
      colorSpace: "Display P3 & sRGB IEC61966-2.1",
      iccProfile: "sRGB Embedded",
      bleedMm: "0 px (Integer ViewBox coords)",
      safeMarginMm: "24 px responsive viewport padding",
      minDpi: "Vector SVG + 2x (@2x) Retinal PNG / WebP fallback",
      preferredFileFormat: "SVGO-cleaned inline SVG (< 150 KB) + WebP (Q90)",
      notes: "Zero embedded scripts or foreignObject elements; WCAG AAA text contrast verified.",
    },
  ] satisfies readonly PressMechanicalSpec[],
} as const;
