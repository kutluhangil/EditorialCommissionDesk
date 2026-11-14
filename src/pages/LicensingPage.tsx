import { useMemo, useRef, useState } from "react";
import { Check, Scale, ShieldCheck, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommissionModal, {
  type CommissionModalHandle,
} from "@/components/CommissionModal";
import StudioPageShell from "@/components/StudioPageShell";
import { STUDIO_CONFIG } from "@/config/studio.config";
import { formatUsd } from "@/lib/pricing";

const RIGHT_MULTIPLIER_NUMERIC: Record<string, number> = {
  "editorial-1yr": 1.0,
  "multi-3yr": 1.5,
  "perpetual-buyout": 2.2,
};

export default function LicensingPage() {
  const modalRef = useRef<CommissionModalHandle>(null);
  const [baseFee, setBaseFee] = useState(2500);
  const [selectedTierId, setSelectedTierId] = useState("editorial-1yr");
  const [selectedStageIndex, setSelectedStageIndex] = useState(1);

  const calculation = useMemo(() => {
    const tier =
      STUDIO_CONFIG.usageRightsComparison.find((t) => t.id === selectedTierId) ??
      STUDIO_CONFIG.usageRightsComparison[0];
    const mult = RIGHT_MULTIPLIER_NUMERIC[tier.id] ?? 1.0;
    const licensedTotal = Math.round(baseFee * mult);
    const stage = STUDIO_CONFIG.killFeeStages[selectedStageIndex];
    const killFeeAmount = Math.round((licensedTotal * stage.feePercentage) / 100);
    return { tier, mult, licensedTotal, stage, killFeeAmount };
  }, [baseFee, selectedTierId, selectedStageIndex]);

  return (
    <StudioPageShell
      plateCode="RIGHTS & KILL-FEE MATRIX"
      title="Usage Licensing & Protection Schedule"
      subtitle="Clear intellectual property boundaries from day one. Compare serial editorial syndication against category buyouts and inspect our 40/40/20 cancellation protection model."
      accentColor="blue"
      actions={
        <Button
          onClick={() =>
            modalRef.current?.open({
              initialProjectType: "Editorial Illustration",
              initialValues: {
                rightsUsage: calculation.tier.tier,
                budget: formatUsd(calculation.licensedTotal),
              },
            })
          }
          className="bg-black text-white hover:bg-black/90 rounded-none text-xs font-bold uppercase tracking-widest px-5 py-5"
        >
          Lock This License Tier
        </Button>
      }
    >
      <div className="space-y-10">
        {/* Usage Rights Tiers */}
        <section className="grid grid-cols-1 lg:grid-cols-3 border-2 border-black bg-white text-black">
          {STUDIO_CONFIG.usageRightsComparison.map((tier, idx) => {
            const isSelected = tier.id === selectedTierId;
            return (
              <div
                key={tier.id}
                className={`p-7 flex flex-col justify-between ${
                  idx < 2 ? "border-b-2 lg:border-b-0 lg:border-r-2 border-black" : ""
                } ${isSelected ? "bg-black/[0.03]" : ""}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-gray-500">
                      TIER 0{idx + 1}
                    </span>
                    <span
                      className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-white"
                      style={{
                        backgroundColor:
                          idx === 0
                            ? "var(--studio-blue)"
                            : idx === 1
                              ? "var(--studio-red)"
                              : "#0A0A0A",
                      }}
                    >
                      {tier.multiplier}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black uppercase tracking-tight mb-2">
                    {tier.tier}
                  </h2>
                  <p className="text-xs text-gray-600 mb-6 leading-relaxed">
                    {tier.recommendedFor}
                  </p>

                  <dl className="space-y-3 text-xs border-t border-black/15 pt-4 mb-6">
                    <div>
                      <dt className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Duration
                      </dt>
                      <dd className="font-bold text-gray-900">{tier.duration}</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Territory
                      </dt>
                      <dd className="font-bold text-gray-900">{tier.territory}</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Permitted Channels
                      </dt>
                      <dd className="text-gray-700">{tier.channels}</dd>
                    </div>
                    <div>
                      <dt className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                        Exclusivity Rule
                      </dt>
                      <dd className="text-gray-700 flex items-start gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{tier.exclusivityNote}</span>
                      </dd>
                    </div>
                  </dl>
                </div>

                <Button
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => setSelectedTierId(tier.id)}
                  className={`w-full rounded-none text-[11px] font-bold uppercase tracking-widest py-4 ${
                    isSelected
                      ? "bg-black text-white"
                      : "border-black text-black hover:bg-black hover:text-white"
                  }`}
                >
                  {isSelected ? "Selected in Simulator" : "Simulate This License"}
                </Button>
              </div>
            );
          })}
        </section>

        {/* Interactive Rights & Kill-Fee Simulator */}
        <section className="bg-white text-black border-2 border-black grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-span-7 p-7 border-b-2 lg:border-b-0 lg:border-r-2 border-black space-y-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-1 flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                Live Contract &amp; Kill-Fee Calculator
              </p>
              <h2 className="text-xl font-black uppercase tracking-tight">
                Estimate Milestone Exposure
              </h2>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2">
                <span>Creative Base Execution Fee</span>
                <span>{formatUsd(baseFee)}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={12000}
                step={250}
                value={baseFee}
                onChange={(e) => setBaseFee(Number(e.target.value))}
                className="w-full accent-black cursor-pointer"
                aria-label="Creative base execution fee"
              />
              <div className="flex justify-between text-[10px] font-mono text-gray-400 mt-1">
                <span>$1,000 Spot</span>
                <span>$6,000 Feature</span>
                <span>$12,000 Campaign</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2">
                Cancellation Trigger Stage
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STUDIO_CONFIG.killFeeStages.map((stage, idx) => (
                  <button
                    key={stage.stageNumber}
                    type="button"
                    onClick={() => setSelectedStageIndex(idx)}
                    className={`p-3 border text-left transition-colors ${
                      selectedStageIndex === idx
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-black/25 hover:border-black"
                    }`}
                  >
                    <span className="text-[9px] font-mono block opacity-70">
                      STAGE {stage.stageNumber}
                    </span>
                    <span className="text-sm font-black">{stage.feePercentage}%</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className="lg:col-span-5 p-7 text-white flex flex-col justify-between"
            style={{ backgroundColor: "var(--studio-blue)" }}
          >
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/75 mb-4 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Computed License &amp; Protection Summary
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-white/65">
                    Full Contracted License Value ({calculation.tier.multiplier})
                  </p>
                  <p className="text-3xl font-black">
                    {formatUsd(calculation.licensedTotal)}
                  </p>
                </div>
                <div className="pt-4 border-t border-white/20">
                  <p className="text-[10px] uppercase tracking-widest text-white/65">
                    Kill-Fee Liability at Stage {calculation.stage.stageNumber} (
                    {calculation.stage.feePercentage}%)
                  </p>
                  <p
                    className="text-2xl font-black"
                    style={{ color: "var(--studio-yellow)" }}
                  >
                    {formatUsd(calculation.killFeeAmount)}
                  </p>
                  <p className="text-xs text-white/80 mt-2 leading-relaxed">
                    {calculation.stage.clientEntitlement}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full 4-Stage Kill-Fee Table */}
        <section className="bg-white text-black border-2 border-black">
          <div className="px-7 py-5 border-b-2 border-black flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <h2 className="text-base font-black uppercase tracking-tight">
              4-Stage Studio Kill-Fee &amp; Cancellation条款 Schedule
            </h2>
          </div>

          <div className="divide-y divide-black/15">
            {STUDIO_CONFIG.killFeeStages.map((stage) => (
              <div
                key={stage.stageNumber}
                className="p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
              >
                <div className="md:col-span-3">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-gray-400">
                    Stage {stage.stageNumber}
                  </span>
                  <h3 className="text-sm font-black uppercase">{stage.phase}</h3>
                  <span
                    className="inline-block mt-2 px-2 py-0.5 text-[11px] font-black text-white"
                    style={{ backgroundColor: "var(--studio-red)" }}
                  >
                    {stage.feePercentage}% Fee Due
                  </span>
                </div>
                <div className="md:col-span-3 text-xs text-gray-700">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Trigger Point
                  </p>
                  {stage.triggerPoint}
                </div>
                <div className="md:col-span-3 text-xs text-gray-700">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Client Receives
                  </p>
                  {stage.clientEntitlement}
                </div>
                <div className="md:col-span-3 text-xs text-gray-700">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                    Studio Protection
                  </p>
                  {stage.studioProtection}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <CommissionModal ref={modalRef} />
    </StudioPageShell>
  );
}
