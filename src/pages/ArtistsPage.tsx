import { useMemo, useRef, useState } from "react";
import { CalendarClock, MapPin, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import CommissionModal, {
  type CommissionModalHandle,
} from "@/components/CommissionModal";
import StudioPageShell from "@/components/StudioPageShell";
import { STUDIO_CONFIG, type ArtistProfile } from "@/config/studio.config";
import { formatUsd } from "@/lib/pricing";

export default function ArtistsPage() {
  const modalRef = useRef<CommissionModalHandle>(null);
  const [cityFilter, setCityFilter] = useState<string>("All");

  const cities = useMemo(
    () => ["All", ...STUDIO_CONFIG.artistsRoster.map((a) => a.city)],
    [],
  );

  const visibleArtists = useMemo(
    () =>
      cityFilter === "All"
        ? STUDIO_CONFIG.artistsRoster
        : STUDIO_CONFIG.artistsRoster.filter((a) => a.city === cityFilter),
    [cityFilter],
  );

  const handleRequestArtist = (artist: ArtistProfile) => {
    modalRef.current?.open({
      initialProjectType: artist.discipline.includes("Data")
        ? "Data Visualization"
        : artist.discipline.includes("Book")
          ? "Book Cover"
          : artist.discipline.includes("Art Direction")
            ? "Art Direction"
            : "Editorial Illustration",
      initialValues: {
        description: `Preferred Studio Lead: ${artist.name} (${artist.city} — ${artist.discipline}). Style focus: ${artist.signatureStyle}.`,
      },
    });
  };

  return (
    <StudioPageShell
      plateCode="STUDIO ROSTER · Q4 2026"
      title="Principals & Illustrators"
      subtitle="Commission directly with specialized visual directors and print craftsmen. Transparent day rates, clear lead times, and unified studio production management."
      accentColor="blue"
      actions={
        <div className="flex flex-wrap gap-1.5">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setCityFilter(city)}
              className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                cityFilter === city
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-600 border-black/25 hover:border-black"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {visibleArtists.map((artist) => {
          const accentBg =
            artist.accentColor === "blue"
              ? "var(--studio-blue)"
              : artist.accentColor === "yellow"
                ? "var(--studio-yellow)"
                : "var(--studio-red)";

          return (
            <article
              key={artist.id}
              className="bg-white text-black border-2 border-black flex flex-col justify-between"
            >
              <div>
                {/* Top Color Rule */}
                <div className="h-2.5 border-b-2 border-black" style={{ backgroundColor: accentBg }} />

                <div className="p-7 border-b border-black/15">
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500 mb-1">
                        {artist.role}
                      </p>
                      <h2 className="text-2xl font-black uppercase tracking-tight">
                        {artist.name}
                      </h2>
                    </div>
                    <span className="px-2.5 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest">
                      {artist.availabilityLabel}
                    </span>
                  </div>

                  <p className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3 flex items-center gap-4">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {artist.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" />
                      {artist.leadTimeDays}d Lead Time
                    </span>
                  </p>

                  <p className="text-sm text-gray-700 leading-relaxed mb-4">
                    {artist.bio}
                  </p>

                  <div className="p-3.5 border border-black/15 bg-black/[0.02]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Signature Method
                    </p>
                    <p className="text-xs font-medium text-gray-800">
                      {artist.signatureStyle}
                    </p>
                  </div>
                </div>

                {/* Sample Plates Strip */}
                <div className="grid grid-cols-3 gap-px bg-black border-b border-black">
                  {artist.samplePlates.map((plateUrl, idx) => (
                    <div key={plateUrl} className="aspect-[4/3] bg-white overflow-hidden">
                      <img
                        src={plateUrl}
                        alt={`${artist.name} sample plate ${idx + 1}`}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    Studio Day Rate
                  </p>
                  <p className="text-xl font-black">
                    {formatUsd(artist.dayRateUsd)}
                    <span className="text-xs font-medium text-gray-500"> / day</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    Clients: {artist.clients.join(" · ")}
                  </p>
                </div>

                <Button
                  onClick={() => handleRequestArtist(artist)}
                  className="bg-black text-white hover:bg-black/90 rounded-none text-xs font-bold uppercase tracking-widest px-5 py-5"
                >
                  <Send className="w-3.5 h-3.5 mr-2" />
                  Request {artist.name.split(" ")[0]}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <CommissionModal ref={modalRef} />
    </StudioPageShell>
  );
}
