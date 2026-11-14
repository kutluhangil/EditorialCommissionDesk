import { useState } from "react";
import { Check, Copy, Layers, Palette, Terminal } from "lucide-react";
import StudioPageShell from "@/components/StudioPageShell";
import { useStudioTheme } from "@/hooks/useStudioTheme";
import {
  STUDIO_CONFIG,
  STUDIO_THEMES,
  type StudioThemeId,
} from "@/config/studio.config";
import { toast } from "sonner";

const THEME_IDS: StudioThemeId[] = ["mondrian", "bauhaus", "swiss", "noir"];

export default function ColophonPage() {
  const { themeId, theme, setThemeId } = useStudioTheme();
  const [copiedCss, setCopiedCss] = useState(false);

  const tokenCssBlock = `:root[data-studio-theme="${theme.id}"] {
  --studio-red: ${theme.red};
  --studio-blue: ${theme.blue};
  --studio-yellow: ${theme.yellow};
  --studio-canvas: ${theme.canvas};
  --studio-surface: ${theme.surface};
  --studio-ink: ${theme.ink};
}`;

  const handleCopyCss = async () => {
    try {
      await navigator.clipboard.writeText(tokenCssBlock);
      setCopiedCss(true);
      toast.success("CSS design tokens copied to clipboard");
      setTimeout(() => setCopiedCss(false), 1600);
    } catch {
      toast.info("Token block ready in viewer");
    }
  };

  return (
    <StudioPageShell
      plateCode="COLOPHON · DESIGN SYSTEM"
      title="Studio Colophon & White-Label Architecture"
      subtitle="Live design token explorer, movement theme switcher, quarterly studio desk capacity, and open-source white-label configuration reference."
      accentColor="yellow"
    >
      <div className="space-y-10">
        {/* Theme Selector Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {THEME_IDS.map((id) => {
            const preset = STUDIO_THEMES[id];
            const active = themeId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setThemeId(id);
                  toast.success(`Theme active: ${preset.name}`);
                }}
                className={`bg-white text-black border-2 p-5 text-left flex flex-col justify-between transition-all ${
                  active
                    ? "border-black ring-2 ring-black ring-offset-2"
                    : "border-black/40 hover:border-black"
                }`}
              >
                <div>
                  <div className="grid grid-cols-3 h-3 border border-black mb-4 overflow-hidden">
                    {preset.swatches.map((hex) => (
                      <div key={hex} style={{ backgroundColor: hex }} />
                    ))}
                  </div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1">
                    {preset.movementEra}
                  </p>
                  <h2 className="text-lg font-black uppercase tracking-tight mb-2">
                    {preset.name}
                  </h2>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {preset.tagline}
                  </p>
                </div>

                <span
                  className={`mt-4 inline-block px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                    active ? "bg-black text-white" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {active ? "Active Preset" : "Activate Theme"}
                </span>
              </button>
            );
          })}
        </section>

        {/* Live Token Inspector + White-Label Adaptation */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white text-black border-2 border-black p-7">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                <h2 className="text-base font-black uppercase tracking-tight">
                  Live CSS Tokens ({theme.name})
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCopyCss}
                className="px-3 py-1.5 border border-black text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 hover:bg-black hover:text-white transition-colors"
              >
                {copiedCss ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                Copy CSS
              </button>
            </div>

            <pre className="p-4 bg-neutral-950 text-neutral-100 text-xs font-mono overflow-x-auto border border-black">
              {tokenCssBlock}
            </pre>
          </div>

          <div className="lg:col-span-6 bg-white text-black border-2 border-black p-7 space-y-5">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              <h2 className="text-base font-black uppercase tracking-tight">
                Rebrand This Template in 1 File
              </h2>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed">
              Every visual name, package tier, artist profile, print edition, kill-fee
              matrix, and prepress spec renders directly from{" "}
              <code className="px-1.5 py-0.5 bg-gray-100 border border-black/15 font-mono text-[11px]">
                src/config/studio.config.ts
              </code>
              . Zero database migrations are needed to fork and launch your own
              editorial desk.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              {STUDIO_CONFIG.identity.stats.map((stat) => (
                <div key={stat.label} className="p-3 border border-black/20">
                  <p className="text-xl font-black">{stat.value}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Quarterly Capacity Calendar */}
        <section className="bg-white text-black border-2 border-black">
          <div className="px-7 py-5 border-b-2 border-black flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <h2 className="text-base font-black uppercase tracking-tight">
              Studio Desk Capacity Schedule
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black">
            {STUDIO_CONFIG.capacitySchedule.map((slot) => {
              const openSlots = slot.totalSlots - slot.bookedSlots;
              return (
                <div key={slot.id} className="p-6 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                        {slot.quarter}
                      </span>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-black text-white">
                        {slot.statusLabel}
                      </span>
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight mb-2">
                      {slot.month}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {slot.focusNote}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-black/15">
                    <p className="text-xs font-bold uppercase tracking-wider">
                      {openSlots} / {slot.totalSlots} Desks Open
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </StudioPageShell>
  );
}
