import { useRef, useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import Navigation from "@/components/Navigation";
import CommissionModal, {
  type CommissionModalHandle,
} from "@/components/CommissionModal";
import { CommissionWorkspaceModal } from "@/components/CommissionWorkspaceModal";
import ChatWidget from "@/components/ChatWidget";
import { useStudioTheme } from "@/hooks/useStudioTheme";
import {
  STUDIO_CONFIG,
  STUDIO_THEMES,
  type PortfolioCaseItem,
  type ProductizedPackage,
  type StudioThemeId,
} from "@/config/studio.config";
import {
  BASE_FEES,
  LICENSE_CIRCULATIONS,
  LICENSE_DURATIONS,
  LICENSE_EXCLUSIVITY,
  LICENSE_TERRITORIES,
  PROJECT_TYPES,
  RIGHTS_CLAUSES,
  RIGHTS_MULTIPLIERS,
  RIGHTS_OPTIONS,
  computeAoiLicenseMultiplier,
  computeMilestoneSchedule,
  computeQuoteEstimate,
  formatUsd,
  getIsoDaysFromNow,
  getSuggestedDeadlineIso,
} from "@/lib/pricing";
import { parseCommissionShareParam } from "@/lib/dossier-export";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  ArrowRight,
  PenTool,
  Layers,
  Clock,
  Eye,
  FileText,
  Palette,
  Send,
  LayoutDashboard,
  X,
  Check,
  Calculator,
  Zap,
  PackageCheck,
  Scale,
} from "lucide-react";

type CaseStudyStage = "wireframe" | "color" | "final";

const PORTFOLIO_CATEGORIES = [
  "All",
  "Editorial Illustration",
  "Magazine Layout",
  "Cultural Poster",
  "Brand Identity",
  "Book Cover",
  "Data Visualization",
] as const;

const THEME_ORDER: readonly StudioThemeId[] = [
  "mondrian",
  "bauhaus",
  "swiss",
  "noir",
];

const THEME_SHORT_LABELS: Record<StudioThemeId, string> = {
  mondrian: "Mondrian",
  bauhaus: "Bauhaus",
  swiss: "Swiss",
  noir: "Noir",
};

const services = [
  {
    number: "01",
    icon: PenTool,
    title: "Editorial Illustration",
    specBadge: "CMYK PDF/X-4",
    accentVar: "var(--studio-red)",
    desc: "Custom illustrations for magazines, newspapers, and digital publications. Bold concepts with print-ready execution.",
  },
  {
    number: "02",
    icon: Layers,
    title: "Art Direction",
    specBadge: "Issue Systems",
    accentVar: "var(--studio-blue)",
    desc: "Visual storytelling from concept to completion. We guide the aesthetic journey of your publication or campaign.",
  },
  {
    number: "03",
    icon: FileText,
    title: "Layout & Typography",
    specBadge: "12-Col Swiss Grid",
    accentVar: "var(--studio-yellow)",
    desc: "Swiss-grid-informed spreads, book design, and typographic systems that command attention.",
  },
  {
    number: "04",
    icon: Palette,
    title: "Brand Identity",
    specBadge: "SVG + Pantone",
    accentVar: "var(--studio-ink)",
    desc: "Logos, color systems, and comprehensive brand guidelines for cultural institutions and creative businesses.",
  },
];

const timeline = [
  {
    step: "01",
    title: "Inquiry",
    desc: "Submit your brief through our commission portal. Include references, budget, and timeline.",
  },
  {
    step: "02",
    title: "Review",
    desc: "We assess feasibility, clarify deliverables, and respond within 48 hours with a proposal.",
  },
  {
    step: "03",
    title: "Development",
    desc: "Sketch rounds, coordinate pin proofing, and collaborative refinement until approved.",
  },
  {
    step: "04",
    title: "Delivery",
    desc: "Final press masters unlocked with milestone settlement and rights documentation included.",
  },
];

const STAGE_TABS: ReadonlyArray<{ id: CaseStudyStage; label: string }> = [
  { id: "wireframe", label: "01. Wireframe / Sketch" },
  { id: "color", label: "02. Spot Color Study" },
  { id: "final", label: "03. Final Press Proof" },
];

export default function Home() {
  const modalRef = useRef<CommissionModalHandle>(null);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme, themeId, setThemeId } = useStudioTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeCaseStudy, setActiveCaseStudy] =
    useState<PortfolioCaseItem | null>(null);
  const [inspectorStage, setInspectorStage] = useState<CaseStudyStage>("final");
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  // Interactive Studio Rate & AOI 4D Licensing Calculator state
  const [calcType, setCalcType] = useState<string>("Editorial Illustration");
  const [calcPieces, setCalcPieces] = useState<number>(2);
  const [calcRightsMode, setCalcRightsMode] = useState<"presets" | "aoi">(
    "aoi",
  );
  const [calcRights, setCalcRights] = useState<string>("Web + print, 1 year");
  const [aoiTerritory, setAoiTerritory] = useState<string>("worldwide");
  const [aoiDuration, setAoiDuration] = useState<string>("1_year");
  const [aoiCirculation, setAoiCirculation] = useState<string>("national");
  const [aoiExclusivity, setAoiExclusivity] =
    useState<string>("non_exclusive");
  const [calcRush, setCalcRush] = useState<boolean>(false);

  const aoiLicense = useMemo(
    () =>
      computeAoiLicenseMultiplier({
        territoryId: aoiTerritory,
        durationId: aoiDuration,
        circulationId: aoiCirculation,
        exclusivityId: aoiExclusivity,
      }),
    [aoiTerritory, aoiDuration, aoiCirculation, aoiExclusivity],
  );

  const calcQuote = useMemo(
    () =>
      computeQuoteEstimate({
        projectType: calcType,
        rightsUsage: calcRights,
        pieceCount: calcPieces,
        rushMode: calcRush,
        rightsMultiplierOverride:
          calcRightsMode === "aoi" ? aoiLicense.combinedMultiplier : undefined,
      }),
    [
      calcType,
      calcRights,
      calcPieces,
      calcRush,
      calcRightsMode,
      aoiLicense.combinedMultiplier,
    ],
  );

  const milestoneSchedule = useMemo(
    () => computeMilestoneSchedule(calcQuote.midpointUsd),
    [calcQuote.midpointUsd],
  );

  const sharedCommissionId = parseCommissionShareParam(
    searchParams.get("share"),
  );

  useEffect(() => {
    if (location.hash) {
      const target = document.querySelector(location.hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location.hash]);

  useEffect(() => {
    const onOpenBrief = () => {
      modalRef.current?.open();
    };
    window.addEventListener("ecd:open-brief", onOpenBrief);
    return () => window.removeEventListener("ecd:open-brief", onOpenBrief);
  }, []);

  const portfolioItems = STUDIO_CONFIG.portfolioItems;
  const filteredPortfolio =
    selectedCategory === "All"
      ? portfolioItems
      : portfolioItems.filter((item) => item.category === selectedCategory);

  const handleCopyHex = (hex: string) => {
    void navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1200);
  };

  const openCaseStudy = (item: PortfolioCaseItem) => {
    setActiveCaseStudy(item);
    setInspectorStage("final");
  };

  const handleBookPackage = (pkg: ProductizedPackage) => {
    const targetDeadline = getIsoDaysFromNow(pkg.turnaroundDays);

    modalRef.current?.open({
      initialValues: {
        projectType: pkg.projectType,
        deliverables: `[Package: ${pkg.name} · ${formatUsd(pkg.priceUsd)}] ${pkg.deliverables}`,
        deadline: targetDeadline,
        budget: pkg.budgetTier,
        rightsUsage: pkg.rightsUsage,
        description: `Instant-Book Package (${pkg.turnaroundLabel}, ${pkg.includedRevisions} included revision rounds): ${pkg.tagline}.`,
      },
    });
  };

  const handleStartBriefFromCalculator = () => {
    const deliverableLabel =
      calcPieces === 1
        ? `1 primary ${calcType.toLowerCase()} piece`
        : `${calcPieces} coordinated ${calcType.toLowerCase()} deliverables`;

    modalRef.current?.open({
      initialValues: {
        projectType: calcType,
        deliverables: `${deliverableLabel} — CMYK print-ready PDF + layered digital master files`,
        deadline: getSuggestedDeadlineIso(calcRush),
        budget: calcQuote.suggestedTier,
        rightsUsage:
          calcRightsMode === "aoi"
            ? aoiLicense.mappedRightsLabel
            : calcRights,
        description:
          calcRightsMode === "aoi"
            ? `AOI Licensing Clause: ${aoiLicense.legalClause}`
            : undefined,
      },
    });
  };

  const closeShareModal = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("share");
    setSearchParams(next, { replace: true });
  };

  const isNoir = themeId === "noir";

  const getPackageAccentColor = (accent: ProductizedPackage["accent"]) => {
    if (accent === "red") return "var(--studio-red)";
    if (accent === "blue") return "var(--studio-blue)";
    if (accent === "yellow") return "var(--studio-yellow)";
    return isNoir ? "#1E2430" : "#111111";
  };

  const getPackageHeaderTextClass = (accent: ProductizedPackage["accent"]) => {
    if (isNoir) {
      return accent === "red" ? "text-[#0D0F12]" : "text-white";
    }
    return accent === "yellow" ? "text-black" : "text-white";
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      <ChatWidget />

      {/* Hero Section — Mondrian-inspired asymmetric grid */}
      <section className="relative pt-16 pb-12 lg:pb-16">
        <div className="max-w-7xl mx-auto px-6 py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 bg-black p-1">
            {/* Main headline block */}
            <div className="lg:col-span-7 bg-white p-8 lg:p-12 flex flex-col justify-between min-h-[420px]">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">
                  {STUDIO_CONFIG.identity.subtitle} ·{" "}
                  {STUDIO_CONFIG.identity.location}
                </p>
                <h1 className="text-5xl lg:text-7xl font-black leading-[0.9] tracking-tight uppercase">
                  Editorial
                  <br />
                  <span style={{ color: "var(--studio-red)" }}>
                    Commission
                  </span>
                  <br />
                  Desk
                </h1>
              </div>
              <p className="text-sm leading-relaxed text-gray-600 max-w-md mt-6">
                {STUDIO_CONFIG.identity.heroStatement}
              </p>
            </div>

            {/* Right column */}
            <div className="lg:col-span-5 flex flex-col gap-1">
              <div
                className="p-6 lg:p-8 text-white flex-1 flex flex-col justify-between min-h-[200px]"
                style={{ backgroundColor: "var(--studio-blue)" }}
              >
                <Eye className="w-6 h-6 opacity-60" />
                <p className="text-sm leading-relaxed">
                  {STUDIO_CONFIG.identity.heroSidebarStatement}
                </p>
              </div>
              <div className="relative overflow-hidden min-h-[200px] bg-neutral-900">
                <img
                  key={theme.heroStudioImg}
                  src={theme.heroStudioImg}
                  alt={`${theme.name} — Studio Workspace`}
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover absolute inset-0 transition-opacity duration-500"
                />
                <div className="absolute bottom-2.5 left-2.5 bg-black/85 text-white px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border border-white/15">
                  {theme.name} · {theme.movementEra}
                </div>
              </div>
            </div>

            {/* Bottom row */}
            <div
              className={`lg:col-span-4 p-6 lg:p-8 flex items-center justify-between ${
                isNoir ? "text-white" : "text-black"
              }`}
              style={{ backgroundColor: "var(--studio-yellow)" }}
            >
              <span className="text-xs font-bold uppercase tracking-widest">
                Start a Project
              </span>
              <Button
                onClick={() => modalRef.current?.open()}
                className={
                  isNoir
                    ? "bg-[#0D0F12] text-[#F5F3EF] hover:bg-black border border-white/25 rounded-none text-xs uppercase tracking-widest"
                    : "bg-black text-white hover:bg-black/80 rounded-none text-xs uppercase tracking-widest"
                }
              >
                <Send className="w-3 h-3 mr-2" />
                Commission
              </Button>
            </div>
            <div className="lg:col-span-4 bg-white p-6 lg:p-8 flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest font-medium text-gray-500">
                Availability:{" "}
                <span className="text-black font-bold">
                  {STUDIO_CONFIG.identity.availabilityQuarter} (
                  {STUDIO_CONFIG.identity.bookedSlots}/
                  {STUDIO_CONFIG.identity.monthlyCapacity} Slots)
                </span>
              </p>
              <a
                href="#calculator"
                className="text-[10px] font-bold uppercase tracking-widest hover:underline"
                style={{ color: "var(--studio-red)" }}
              >
                Rate Estimator
              </a>
            </div>
            <div className="lg:col-span-4 bg-black p-6 lg:p-8 text-white flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest opacity-60">
                View Work
              </span>
              <a
                href="#portfolio"
                className="hover:opacity-80 transition-opacity"
                style={{ color: "var(--studio-yellow)" }}
              >
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Wide Architectural Press-Plate Showcase Panel (Theme-Specific Artwork) */}
            <div className="lg:col-span-12 bg-white relative group overflow-hidden">
              <div
                className="relative h-[280px] sm:h-[360px] lg:h-[420px] w-full overflow-hidden"
                style={{ backgroundColor: theme.surface }}
              >
                <img
                  key={theme.heroBannerImg}
                  src={theme.heroBannerImg}
                  alt={`${theme.name} — Editorial Commission Desk Press Plate`}
                  fetchPriority="high"
                  decoding="async"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.015]"
                />
                {/* Subtle Swiss Press Registration Corners */}
                <span
                  className="pointer-events-none absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2"
                  style={{ borderColor: "var(--studio-red)" }}
                />
                <span
                  className="pointer-events-none absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2"
                  style={{ borderColor: "var(--studio-red)" }}
                />
                <span
                  className="pointer-events-none absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2"
                  style={{ borderColor: "var(--studio-red)" }}
                />
                <span
                  className="pointer-events-none absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2"
                  style={{ borderColor: "var(--studio-red)" }}
                />
                <div className="absolute top-3 left-6 bg-black/85 text-white px-2.5 py-1 text-[9px] font-mono uppercase tracking-widest border border-white/15">
                  EDITION PLATE · {theme.movementEra}
                </div>
              </div>

              <div className="bg-white border-t border-black px-6 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gray-500">
                  {theme.heroBannerCaption}
                </p>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  {/* Inline Theme-Plate Preview Switcher */}
                  <div className="flex items-center border border-black/15 p-0.5 gap-0.5 bg-neutral-50">
                    {THEME_ORDER.map((id) => {
                      const preset = STUDIO_THEMES[id];
                      const active = themeId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setThemeId(id)}
                          className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                            active
                              ? "bg-black text-white"
                              : "text-gray-600 hover:bg-black/5"
                          }`}
                          title={preset.tagline}
                        >
                          <span className="inline-flex border border-black/20 overflow-hidden">
                            {preset.swatches.map((hex) => (
                              <span
                                key={hex}
                                className="w-1 h-2 inline-block"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </span>
                          {THEME_SHORT_LABELS[id]}
                        </button>
                      );
                    })}
                  </div>

                  <a
                    href="#packages"
                    className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:underline shrink-0"
                    style={{ color: "var(--studio-red)" }}
                  >
                    Explore Instant-Book Packages
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Portfolio Section */}
      <section id="portfolio" className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
                Selected Work · 3-Stage Process Inspector
              </p>
              <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight">
                Portfolio ({portfolioItems.length})
              </h2>
            </div>
            <div className="hidden lg:block w-24 h-[2px] bg-black" />
          </div>

          {/* Category Filter Bar */}
          <div className="flex flex-wrap gap-1.5 mb-8">
            {PORTFOLIO_CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                    active
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-600 border-black/15 hover:border-black"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 bg-black p-1">
            {filteredPortfolio.map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={() => openCaseStudy(item)}
                className="group relative bg-white overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#e63946] flex flex-col justify-between"
              >
                <div className="aspect-[3/4] overflow-hidden relative w-full">
                  <img
                    src={item.img}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-3 right-3 bg-black/85 text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Inspect Proof & Sketches
                  </span>
                </div>
                <div className="p-4 border-t border-black/10 flex items-end justify-between gap-3 w-full">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      {item.category}
                    </p>
                    <h3 className="text-sm font-bold uppercase tracking-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{item.client}</p>
                  </div>
                  <div className="flex gap-1 shrink-0 pb-0.5">
                    {item.palette.map((hex) => (
                      <span
                        key={hex}
                        className="w-2.5 h-2.5 border border-black/15"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4 space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 mb-2">
                  What We Do
                </p>
                <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight mb-4">
                  Services
                </h2>
                <p className="text-sm leading-relaxed text-gray-600 mb-6">
                  Every project begins with a conversation. We tailor our process
                  to your timeline, budget, and creative needs.
                </p>
                <a
                  href="#calculator"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest border-b-2 pb-1 transition-colors"
                  style={{ borderColor: "var(--studio-red)" }}
                >
                  <Calculator className="w-3.5 h-3.5" />
                  Estimate Project Fee
                </a>
              </div>

              {/* Atelier Specimen Plate — fills lower left space */}
              <div className="bg-black p-1">
                <div className="bg-white p-1.5">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                    <img
                      src="/services-atelier-plate.jpg"
                      alt="Atelier Specimen Plate — Four Editorial Craft Disciplines"
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    <span
                      className="pointer-events-none absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2"
                      style={{ borderColor: "var(--studio-red)" }}
                    />
                    <span
                      className="pointer-events-none absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2"
                      style={{ borderColor: "var(--studio-red)" }}
                    />
                    <span
                      className="pointer-events-none absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2"
                      style={{ borderColor: "var(--studio-red)" }}
                    />
                    <span
                      className="pointer-events-none absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2"
                      style={{ borderColor: "var(--studio-red)" }}
                    />
                  </div>
                  <div className="px-2.5 py-2 border-t border-black/15 flex items-center justify-between gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-gray-500">
                      ATELIER SPECIMEN · 01–04
                    </span>
                    <div className="flex items-center gap-1">
                      {theme.swatches.map((hex) => (
                        <span
                          key={hex}
                          className="w-2.5 h-2.5 border border-black/20"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-1 bg-black p-1">
              {services.map((service) => (
                <div
                  key={service.number}
                  className="bg-white p-8 group hover:bg-neutral-50 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div
                      className="h-1 w-full mb-5"
                      style={{ backgroundColor: service.accentVar }}
                    />
                    <div className="flex items-center justify-between gap-3 mb-5">
                      <div className="flex items-center gap-2.5">
                        <service.icon
                          className="w-5 h-5"
                          style={{ color: "var(--studio-red)" }}
                        />
                        <span className="text-xs font-mono font-bold text-gray-400">
                          {service.number}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest border border-black/15 text-gray-600">
                        {service.specBadge}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-tight mb-2">
                      {service.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-gray-600">
                      {service.desc}
                    </p>
                  </div>

                  <div className="pt-5 mt-6 border-t border-black/10 flex items-center justify-between">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-gray-400">
                      Print &amp; Digital Ready
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        modalRef.current?.open({
                          initialProjectType:
                            service.title === "Editorial Illustration"
                              ? "Editorial Illustration"
                              : service.title === "Art Direction"
                                ? "Art Direction"
                                : service.title === "Brand Identity"
                                  ? "Brand Identity"
                                  : "Magazine Cover",
                        })
                      }
                      className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 hover:underline"
                      style={{ color: "var(--studio-red)" }}
                    >
                      Start Brief
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Productized Instant-Book Packages Section */}
      <section
        id="packages"
        className="py-24 bg-white border-t border-black/10"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: "var(--studio-red)" }}
              >
                Fixed-Scope · 1-Click Commissioning
              </p>
              <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight">
                Instant-Book Studio Packages
              </h2>
            </div>
            <p className="text-xs text-gray-500 max-w-md">
              Transparent productized briefs with guaranteed turnaround days,
              pre-cleared licensing rights, and included revision rounds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 bg-black p-1">
            {STUDIO_CONFIG.productizedPackages.map((pkg) => {
              const accentBg = getPackageAccentColor(pkg.accent);
              const headerTextClass = getPackageHeaderTextClass(pkg.accent);
              return (
                <div
                  key={pkg.id}
                  className="bg-white flex flex-col justify-between group"
                >
                  <div>
                    {/* Visual Artwork Header Plate */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100 border-b border-black">
                      <img
                        src={pkg.imageUrl}
                        alt={pkg.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <span
                        className="pointer-events-none absolute top-2 left-2 w-2.5 h-2.5 border-t-2 border-l-2"
                        style={{ borderColor: "var(--studio-red)" }}
                      />
                      <span
                        className="pointer-events-none absolute top-2 right-2 w-2.5 h-2.5 border-t-2 border-r-2"
                        style={{ borderColor: "var(--studio-red)" }}
                      />
                      <span
                        className="pointer-events-none absolute bottom-2 left-2 w-2.5 h-2.5 border-b-2 border-l-2"
                        style={{ borderColor: "var(--studio-red)" }}
                      />
                      <span
                        className="pointer-events-none absolute bottom-2 right-2 w-2.5 h-2.5 border-b-2 border-r-2"
                        style={{ borderColor: "var(--studio-red)" }}
                      />
                      <span className="absolute top-2.5 left-5 bg-black/85 text-white px-2 py-0.5 text-[9px] font-mono uppercase tracking-widest border border-white/15">
                        {pkg.specCode}
                      </span>
                    </div>

                    <div
                      className={`p-5 ${headerTextClass}`}
                      style={{ backgroundColor: accentBg }}
                    >
                      <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest opacity-85 mb-2">
                        <span>{pkg.turnaroundLabel}</span>
                        <span>{pkg.includedRevisions} Rev Rounds</span>
                      </div>
                      <h3 className="text-base font-black uppercase tracking-tight leading-snug">
                        {pkg.name}
                      </h3>
                      <p className="text-3xl font-black mt-3">
                        {formatUsd(pkg.priceUsd)}
                      </p>
                    </div>

                    <div className="p-5 space-y-4">
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {pkg.tagline}
                      </p>
                      <div className="border-t border-black/10 pt-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                          Included Scope
                        </p>
                        <ul className="space-y-1.5 text-xs text-gray-700">
                          {pkg.features.map((feat) => (
                            <li key={feat} className="flex items-start gap-1.5">
                              <Check className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-600" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0">
                    <Button
                      type="button"
                      onClick={() => handleBookPackage(pkg)}
                      className="w-full rounded-none bg-black text-white hover:bg-black/85 text-[11px] font-bold uppercase tracking-widest py-5"
                    >
                      <PackageCheck className="w-3.5 h-3.5 mr-1.5" />
                      Instant Book Package
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Studio Rate & AOI 4D Licensing Calculator Section */}
      <section
        id="calculator"
        className="py-24 bg-neutral-50 border-t border-b border-black/10"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-[0.2em] mb-2"
                style={{ color: "var(--studio-red)" }}
              >
                AOI & Guild Standard · 4D Usage Matrix + 40/40/20 Schedule
              </p>
              <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight">
                Studio Rate & Licensing Calculator
              </h2>
            </div>
            <p className="text-xs text-gray-500 max-w-md">
              Configure deliverables, territory, duration, circulation tier, and
              exclusivity to generate an instant fee benchmark & milestone billing
              schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-1 bg-black p-1">
            {/* Left Calculator Controls */}
            <div className="lg:col-span-7 bg-white p-6 lg:p-8 space-y-6">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2.5 block">
                  01 · Commission Discipline
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {PROJECT_TYPES.slice(0, 7).map((type) => {
                    const active = calcType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setCalcType(type)}
                        className={`px-3 py-2.5 text-left border text-xs transition-colors ${
                          active
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-700 border-gray-200 hover:border-black"
                        }`}
                      >
                        <span className="font-bold uppercase tracking-tight block text-[11px]">
                          {type}
                        </span>
                        <span
                          className="text-[10px]"
                          style={{
                            color: active ? "var(--studio-yellow)" : "#9ca3af",
                          }}
                        >
                          Base {formatUsd(BASE_FEES[type] ?? 3000)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2.5 block">
                    02 · Deliverables Quantity ({calcPieces}{" "}
                    {calcPieces === 1 ? "Piece" : "Pieces"})
                  </label>
                  <div className="grid grid-cols-6 gap-1 bg-black p-[1px]">
                    {[1, 2, 3, 4, 5, 6].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setCalcPieces(count)}
                        className={`py-2.5 text-xs font-black transition-colors ${
                          calcPieces === count
                            ? "text-white"
                            : "bg-white text-gray-700 hover:bg-neutral-100"
                        }`}
                        style={
                          calcPieces === count
                            ? { backgroundColor: "var(--studio-red)" }
                            : undefined
                        }
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Scope multiplier: {calcQuote.scopeMultiplier.toFixed(2)}x
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2.5 block">
                    03 · Schedule Priority
                  </label>
                  <div className="grid grid-cols-2 gap-1 bg-black p-[1px]">
                    <button
                      type="button"
                      onClick={() => setCalcRush(false)}
                      className={`py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                        !calcRush
                          ? "bg-black text-white"
                          : "bg-white text-gray-600 hover:bg-neutral-100"
                      }`}
                    >
                      Standard (2–3w)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcRush(true)}
                      className={`py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${
                        calcRush
                          ? "text-white"
                          : "bg-white text-gray-600 hover:bg-neutral-100"
                      }`}
                      style={
                        calcRush
                          ? { backgroundColor: "var(--studio-red)" }
                          : undefined
                      }
                    >
                      <Zap className="w-3 h-3" />
                      Rush (+25%)
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    Target deadline: {getSuggestedDeadlineIso(calcRush)}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5" />
                    04 · Rights & Reproduction Licensing Model
                  </label>
                  <div className="flex border border-black/20">
                    <button
                      type="button"
                      onClick={() => setCalcRightsMode("aoi")}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        calcRightsMode === "aoi"
                          ? "bg-black text-white"
                          : "bg-white text-gray-600"
                      }`}
                    >
                      AOI 4D Matrix
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalcRightsMode("presets")}
                      className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                        calcRightsMode === "presets"
                          ? "bg-black text-white"
                          : "bg-white text-gray-600"
                      }`}
                    >
                      Quick Presets
                    </button>
                  </div>
                </div>

                {calcRightsMode === "aoi" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-50 border border-black/10 p-4">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        Territory
                      </span>
                      <select
                        value={aoiTerritory}
                        onChange={(e) => setAoiTerritory(e.target.value)}
                        className="w-full h-9 px-2.5 border border-black/20 bg-white text-xs font-medium"
                      >
                        {LICENSE_TERRITORIES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label} ({t.multiplier.toFixed(2)}x)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        Duration
                      </span>
                      <select
                        value={aoiDuration}
                        onChange={(e) => setAoiDuration(e.target.value)}
                        className="w-full h-9 px-2.5 border border-black/20 bg-white text-xs font-medium"
                      >
                        {LICENSE_DURATIONS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label} ({d.multiplier.toFixed(2)}x)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        Circulation / Reach
                      </span>
                      <select
                        value={aoiCirculation}
                        onChange={(e) => setAoiCirculation(e.target.value)}
                        className="w-full h-9 px-2.5 border border-black/20 bg-white text-xs font-medium"
                      >
                        {LICENSE_CIRCULATIONS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label} ({c.multiplier.toFixed(2)}x)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block mb-1">
                        Exclusivity
                      </span>
                      <select
                        value={aoiExclusivity}
                        onChange={(e) => setAoiExclusivity(e.target.value)}
                        className="w-full h-9 px-2.5 border border-black/20 bg-white text-xs font-medium"
                      >
                        {LICENSE_EXCLUSIVITY.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.label} ({x.multiplier.toFixed(2)}x)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {RIGHTS_OPTIONS.map((option) => {
                      const active = calcRights === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setCalcRights(option)}
                          className={`px-3 py-2 text-xs font-medium border text-left flex items-center justify-between transition-colors ${
                            active
                              ? "text-white border-black"
                              : "bg-white text-gray-700 border-gray-200 hover:border-black"
                          }`}
                          style={
                            active
                              ? { backgroundColor: "var(--studio-blue)" }
                              : undefined
                          }
                        >
                          <span className="truncate pr-2">{option}</span>
                          <span
                            className="text-[10px] font-bold shrink-0"
                            style={{
                              color: active ? "var(--studio-yellow)" : "#9ca3af",
                            }}
                          >
                            {(RIGHTS_MULTIPLIERS[option] ?? 1.0).toFixed(2)}x
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Live Quote Readout */}
            <div
              className="lg:col-span-5 text-white p-6 lg:p-8 flex flex-col justify-between"
              style={{ backgroundColor: "var(--studio-blue)" }}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                    Estimated Studio Quote
                  </span>
                  <span
                    className="px-2 py-0.5 text-black text-[10px] font-black uppercase tracking-widest"
                    style={{ backgroundColor: "var(--studio-yellow)" }}
                  >
                    Tier: {calcQuote.suggestedTier}
                  </span>
                </div>

                <p className="text-4xl lg:text-5xl font-black tracking-tight mb-6">
                  {formatUsd(calcQuote.minUsd)} – {formatUsd(calcQuote.maxUsd)}
                </p>

                <div className="space-y-2 text-xs border-t border-b border-white/15 py-4 mb-5">
                  <div className="flex justify-between">
                    <span className="text-white/60">
                      Base Discipline ({calcType})
                    </span>
                    <span className="font-bold">
                      {formatUsd(calcQuote.baseFee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">
                      Deliverables Scope ({calcPieces}{" "}
                      {calcPieces === 1 ? "piece" : "pieces"})
                    </span>
                    <span className="font-bold">
                      {calcQuote.scopeMultiplier.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-white/60 truncate">
                      Rights License (
                      {calcRightsMode === "aoi"
                        ? "AOI 4D Matrix"
                        : calcRights}
                      )
                    </span>
                    <span className="font-bold shrink-0">
                      {calcQuote.rightsMultiplier.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Turnaround Factor</span>
                    <span
                      className="font-bold"
                      style={{ color: "var(--studio-yellow)" }}
                    >
                      {calcQuote.isRush
                        ? "1.25x Priority Rush"
                        : "1.00x Standard"}
                    </span>
                  </div>
                </div>

                {/* 40/40/20 Milestone Split */}
                <div className="bg-black/25 p-4 border border-white/10 mb-5">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-2"
                    style={{ color: "var(--studio-yellow)" }}
                  >
                    Milestone Billing Schedule (40% / 40% / 20%)
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {milestoneSchedule.map((step) => (
                      <div key={step.stepNumber} className="bg-white/5 p-2">
                        <p className="text-[9px] text-white/60 uppercase">
                          {step.percentage}% M{step.stepNumber}
                        </p>
                        <p className="text-xs font-black mt-0.5">
                          {formatUsd(step.amountUsd)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/25 p-4 border border-white/10 mb-6">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest mb-1"
                    style={{ color: "var(--studio-yellow)" }}
                  >
                    Generated Legal License Scope
                  </p>
                  <p className="text-xs leading-relaxed text-white/80">
                    {calcRightsMode === "aoi"
                      ? aoiLicense.legalClause
                      : RIGHTS_CLAUSES[calcRights] ??
                        "Tailored rights agreement included."}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                size="lg"
                onClick={handleStartBriefFromCalculator}
                className={`w-full rounded-none text-xs font-bold uppercase tracking-widest py-6 ${
                  isNoir ? "text-[#0D0F12]" : "text-white"
                }`}
                style={{ backgroundColor: "var(--studio-red)" }}
              >
                <Send className="w-3.5 h-3.5 mr-2" />
                Start Brief with This Quote
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline / Process Section */}
      <section
        id="process"
        className="py-24 text-white"
        style={{ backgroundColor: "var(--studio-blue)" }}
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 mb-2">
                How It Works
              </p>
              <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight">
                The Commission Timeline
              </h2>
            </div>
            <p className="text-xs text-white/60 max-w-md">
              From initial wireframe blocking to pin-annotated color studies and
              unlocked press-ready masters.
            </p>
          </div>

          {/* 4-Stage Wide Production Frieze */}
          <div className="border-2 border-white/25 bg-black/25 p-1.5 mb-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-1 px-2 py-2 bg-black/45 text-[9px] font-mono uppercase tracking-widest text-white/75 mb-1.5">
              <span>Stage 01 · Wireframe Sketches</span>
              <span>Stage 02 · Grid Architecture</span>
              <span>Stage 03 · Pin Proofing</span>
              <span>Stage 04 · Press Master</span>
            </div>
            <div className="relative w-full overflow-hidden border border-white/15 bg-[#F8F4EA]">
              <img
                src="/process-workflow-banner.svg"
                alt="Four-stage editorial illustration commission workflow from wireframe sketch to press-ready collector master"
                loading="lazy"
                decoding="async"
                className="w-full h-auto block"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/20">
            {timeline.map((item, i) => (
              <div
                key={i}
                className="p-8 group hover:bg-black/20 transition-colors"
                style={{ backgroundColor: "var(--studio-blue)" }}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="text-4xl font-black text-white/20">
                    {item.step}
                  </span>
                  <Clock
                    className="w-4 h-4"
                    style={{ color: "var(--studio-yellow)" }}
                  />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-tight mb-3">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-white/60">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 bg-black p-1">
            <div className="lg:col-span-5 bg-white p-10 lg:p-12 flex flex-col justify-center">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.2em] mb-3"
                style={{ color: "var(--studio-red)" }}
              >
                Editorial Desk · Open for Inquiries
              </p>
              <h2 className="text-3xl lg:text-5xl font-black uppercase tracking-tight mb-5">
                Ready to{" "}
                <span style={{ color: "var(--studio-red)" }}>start</span>?
              </h2>
              <p className="text-sm text-gray-600 max-w-md mb-8 leading-relaxed">
                Sign in with one click to save drafts, track commissions across
                every studio stage, annotate proofs with coordinate pins, manage
                40/40/20 invoices, and export printable dossiers.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => modalRef.current?.open()}
                  className="bg-black text-white hover:bg-black/80 rounded-none text-xs uppercase tracking-widest px-6 py-5"
                >
                  <Send className="w-3 h-3 mr-2" />
                  New Commission
                </Button>
                <Link to="/dashboard">
                  <Button
                    variant="outline"
                    className="rounded-none text-xs uppercase tracking-widest px-6 py-5 border-black"
                  >
                    <LayoutDashboard className="w-3 h-3 mr-2" />
                    Client Dashboard
                  </Button>
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white p-3 flex flex-col justify-between">
              <div className="relative flex-1 overflow-hidden border border-black/15 min-h-[240px]">
                <img
                  src="/cta-studio-seal.svg"
                  alt="Sealed Archival Commission Dossier with Geometric Wax Stamp and Pantone Swatches"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="pt-2.5 flex items-center justify-between text-[9px] font-mono uppercase tracking-widest text-gray-500">
                <span>ARCHIVE SEAL · DISPATCH READY</span>
                <span>{theme.movementEra}</span>
              </div>
            </div>

            <div
              className={`lg:col-span-3 p-8 flex flex-col justify-between ${
                isNoir ? "text-[#0D0F12]" : "text-white"
              }`}
              style={{ backgroundColor: "var(--studio-red)" }}
            >
              {STUDIO_CONFIG.identity.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-xs uppercase tracking-widest opacity-70 mb-1.5">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-black">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-black text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-tight mb-2">
                {STUDIO_CONFIG.identity.name}
              </p>
              <p className="text-xs text-white/40">
                Open-source studio portfolio & client commission portal template.
              </p>
            </div>
            <div className="flex flex-wrap gap-6">
              <a
                href="#portfolio"
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                Portfolio
              </a>
              <a
                href="#packages"
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                Packages
              </a>
              <Link
                to="/artists"
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                Artists
              </Link>
              <Link
                to="/editions"
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                Editions
              </Link>
              <Link
                to="/licensing"
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                Licensing
              </Link>
              <Link
                to="/specs"
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                Press Specs
              </Link>
              <Link
                to="/colophon"
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                Colophon
              </Link>
              <Link
                to="/review/ECD-2026-0001"
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                Review Room
              </Link>
              <Link
                to="/dashboard"
                className="text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              &copy; 2026 {STUDIO_CONFIG.identity.name}. Configurable via
              src/config/studio.config.ts
            </p>
            <div className="flex gap-4">
              <span
                className="w-3 h-3"
                style={{ backgroundColor: "var(--studio-red)" }}
              />
              <span
                className="w-3 h-3"
                style={{ backgroundColor: "var(--studio-blue)" }}
              />
              <span
                className="w-3 h-3"
                style={{ backgroundColor: "var(--studio-yellow)" }}
              />
            </div>
          </div>
        </div>
      </footer>

      {/* Case Study Modal with 3-Stage Process Inspector */}
      <Dialog
        open={activeCaseStudy !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setActiveCaseStudy(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[min(95vw,64rem)] max-w-5xl sm:max-w-5xl p-0 overflow-hidden border-2 border-black rounded-none bg-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]"
        >
          <DialogTitle className="sr-only">
            {activeCaseStudy?.title ?? "Portfolio Case Study"}
          </DialogTitle>
          {activeCaseStudy && (
            <div className="grid grid-cols-1 md:grid-cols-12 bg-black gap-px max-h-[88vh] overflow-y-auto md:overflow-hidden">
              {/* Left: 3-Stage Visual Inspector */}
              <div className="md:col-span-5 bg-neutral-900 flex flex-col justify-between relative min-h-[320px] md:min-h-[540px] md:max-h-[88vh]">
                <div className="relative flex-1 min-h-[260px] overflow-hidden bg-neutral-100">
                  <img
                    src={activeCaseStudy.img}
                    alt={`${activeCaseStudy.title} (${inspectorStage})`}
                    loading="lazy"
                    decoding="async"
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      inspectorStage === "wireframe"
                        ? "grayscale contrast-150 brightness-110 opacity-75"
                        : inspectorStage === "color"
                          ? "saturate-150 contrast-125"
                          : ""
                    }`}
                  />

                  {inspectorStage === "wireframe" && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        backgroundImage:
                          "linear-gradient(to right, rgba(29,53,87,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(29,53,87,0.35) 1px, transparent 1px)",
                        backgroundSize: "36px 36px",
                      }}
                    >
                      <div className="absolute inset-4 border-2 border-dashed border-[#e63946]/80" />
                      <span className="absolute top-6 left-6 bg-black text-white text-[9px] font-mono uppercase px-2 py-0.5">
                        GRID 12-COL · COMPOSITIONAL BLOCKING
                      </span>
                    </div>
                  )}

                  {inspectorStage === "color" && (
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-35"
                      style={{ backgroundColor: activeCaseStudy.palette[0] }}
                    />
                  )}
                  {inspectorStage === "color" && (
                    <div className="absolute top-4 left-4 bg-black/90 text-white px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider flex items-center gap-1.5">
                      <span>SPOT PLATES:</span>
                      {activeCaseStudy.palette.slice(0, 3).map((hex) => (
                        <span
                          key={hex}
                          className="w-2.5 h-2.5 border border-white/40 inline-block"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </div>
                  )}

                  {inspectorStage === "final" && (
                    <div className="absolute inset-3 border border-white/30 pointer-events-none">
                      <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#e63946]" />
                      <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#e63946]" />
                      <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#e63946]" />
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#e63946]" />
                      <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[9px] font-mono uppercase px-2 py-0.5">
                        CMYK PRESS PROOF · 5MM BLEED
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setActiveCaseStudy(null)}
                    className="md:hidden absolute top-3 right-3 w-8 h-8 bg-black text-white flex items-center justify-center"
                    aria-label="Close case study"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-px bg-black border-t border-black">
                  {STAGE_TABS.map((tab) => {
                    const active = inspectorStage === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setInspectorStage(tab.id)}
                        className={`px-2 py-2.5 text-[9px] font-bold uppercase tracking-wider text-center transition-colors ${
                          active
                            ? "bg-[#e63946] text-white"
                            : "bg-neutral-900 text-white/65 hover:text-white"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Right: Metadata, Palette, Notes */}
              <div className="md:col-span-7 bg-white text-black p-6 sm:p-8 flex flex-col justify-between overflow-y-auto overflow-x-hidden md:max-h-[88vh]">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#e63946] mb-1">
                        {activeCaseStudy.category} · {activeCaseStudy.client}
                      </p>
                      <h3 className="text-2xl font-black uppercase tracking-tight">
                        {activeCaseStudy.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveCaseStudy(null)}
                      className="hidden md:flex w-8 h-8 border border-black/15 items-center justify-center hover:bg-black hover:text-white transition-colors shrink-0"
                      aria-label="Close case study"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs leading-relaxed text-gray-600 mb-6">
                    {activeCaseStudy.briefSummary}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-black/10 border border-black/10 mb-6">
                    <div className="bg-neutral-50 p-3.5 min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Turnaround
                      </p>
                      <p className="text-xs font-semibold break-words">
                        {activeCaseStudy.turnaround}
                      </p>
                    </div>
                    <div className="bg-neutral-50 p-3.5 min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Format
                      </p>
                      <p className="text-xs font-semibold break-words">
                        {activeCaseStudy.formatDimensions}
                      </p>
                    </div>
                    <div className="bg-neutral-50 p-3.5 min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                        Rights Scope
                      </p>
                      <p className="text-xs font-semibold break-words">
                        {activeCaseStudy.rightsScope}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Color Palette (Click to Copy HEX)
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {activeCaseStudy.palette.map((hex) => (
                        <button
                          key={hex}
                          type="button"
                          onClick={() => handleCopyHex(hex)}
                          className="border border-black/15 p-1.5 text-left hover:border-black transition-colors min-w-0"
                        >
                          <div
                            className="h-6 w-full mb-1 border border-black/10"
                            style={{ backgroundColor: hex }}
                          />
                          <span className="text-[10px] font-mono font-bold flex items-center justify-between gap-1 min-w-0">
                            <span className="truncate">{hex}</span>
                            {copiedHex === hex && (
                              <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Production Notes
                    </p>
                    <div className="space-y-1.5">
                      {activeCaseStudy.processSteps.map((step) => (
                        <div
                          key={step}
                          className="text-xs text-gray-700 bg-neutral-50 border border-black/5 px-3 py-2"
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-3">
                  <Link
                    to={`/work/${activeCaseStudy.slug}`}
                    onClick={() => setActiveCaseStudy(null)}
                    className="text-[11px] font-bold uppercase tracking-widest text-black underline underline-offset-4 hover:opacity-75 inline-flex items-center gap-1"
                  >
                    Open Full Dossier
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Button
                    type="button"
                    size="sm"
                    className="text-white hover:opacity-90 rounded-none text-xs uppercase tracking-widest"
                    style={{ backgroundColor: "var(--studio-red)" }}
                    onClick={() => {
                      const targetType = activeCaseStudy.commissionType;
                      setActiveCaseStudy(null);
                      modalRef.current?.open({
                        initialProjectType: targetType,
                      });
                    }}
                  >
                    <Send className="w-3 h-3 mr-1.5" />
                    Commission Similar Project
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Read-Only Shared Guest Review Modal (?share=ECD-2026-0001) */}
      <CommissionWorkspaceModal
        commissionId={sharedCommissionId}
        initialTab="proofing"
        readOnlyGuest={true}
        onClose={closeShareModal}
      />

      <CommissionModal ref={modalRef} />
    </div>
  );
}
