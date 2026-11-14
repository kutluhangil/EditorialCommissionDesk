import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  BookOpen,
  Compass,
  FileCode2,
  Frame,
  LayoutDashboard,
  LogIn,
  Palette,
  Scale,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useStudioTheme } from "@/hooks/useStudioTheme";
import {
  STUDIO_CONFIG,
  STUDIO_THEMES,
  type StudioThemeId,
} from "@/config/studio.config";
import { toast } from "sonner";

const THEME_IDS: StudioThemeId[] = ["mondrian", "bauhaus", "swiss", "noir"];

export default function StudioCommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { themeId, setThemeId } = useStudioTheme();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onCustomOpen = () => setOpen(true);

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("ecd:open-command-palette", onCustomOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("ecd:open-command-palette", onCustomOpen);
    };
  }, []);

  const goTo = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  const handleSelectTheme = (id: StudioThemeId) => {
    setThemeId(id);
    toast.success(`Theme switched to ${STUDIO_THEMES[id].name}`);
    setOpen(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Studio Command Desk"
      description="Jump to studio pages, case studies, proof rooms, or switch art movement themes."
      className="rounded-none border-2 border-black shadow-2xl max-w-2xl"
    >
      <CommandInput placeholder="Search pages, case studies, artists, licensing, or themes..." />
      <CommandList className="max-h-[420px]">
        <CommandEmpty className="py-10 text-xs uppercase tracking-widest text-gray-500">
          No studio record matched that query.
        </CommandEmpty>

        <CommandGroup heading="Studio Pages & Workspace">
          <CommandItem onSelect={() => goTo("/")}>
            <Compass className="w-4 h-4" />
            <span>Home · Commission Desk Frontpage</span>
            <CommandShortcut>/</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goTo("/artists")}>
            <Users className="w-4 h-4" />
            <span>Studio Roster &amp; Illustrators</span>
            <CommandShortcut>/artists</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goTo("/editions")}>
            <Frame className="w-4 h-4" />
            <span>Limited Archival Print Editions</span>
            <CommandShortcut>/editions</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goTo("/licensing")}>
            <Scale className="w-4 h-4" />
            <span>Rights, Usage &amp; Kill-Fee Schedule</span>
            <CommandShortcut>/licensing</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goTo("/specs")}>
            <FileCode2 className="w-4 h-4" />
            <span>Press Mechanicals &amp; Prepress Specs</span>
            <CommandShortcut>/specs</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goTo("/colophon")}>
            <BookOpen className="w-4 h-4" />
            <span>Colophon, Typography &amp; Open Template</span>
            <CommandShortcut>/colophon</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goTo("/review/ECD-2026-0001")}>
            <Sparkles className="w-4 h-4" />
            <span>Client Review Room · ECD-2026-0001</span>
            <CommandShortcut>/review</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goTo("/dashboard")}>
            <LayoutDashboard className="w-4 h-4" />
            <span>Client &amp; Studio Dashboard</span>
            <CommandShortcut>/dashboard</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => goTo("/login")}>
            <LogIn className="w-4 h-4" />
            <span>Workspace Demo Sign-In (Client / Admin)</span>
            <CommandShortcut>/login</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setOpen(false);
              navigate("/#packages");
              window.dispatchEvent(new CustomEvent("ecd:open-brief"));
            }}
          >
            <Send className="w-4 h-4" />
            <span>Start New Commission Brief</span>
            <CommandShortcut>BRIEF</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Case Study Dossiers">
          {STUDIO_CONFIG.portfolioItems.map((item) => (
            <CommandItem
              key={item.slug}
              onSelect={() => goTo(`/work/${item.slug}`)}
            >
              <span
                className="w-2.5 h-2.5 inline-block shrink-0 border border-black/30"
                style={{ backgroundColor: item.palette[0] }}
              />
              <span className="font-medium">{item.title}</span>
              <span className="text-[11px] text-gray-500 ml-1">
                · {item.client}
              </span>
              <CommandShortcut>{item.category}</CommandShortcut>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Art Movement Themes">
          {THEME_IDS.map((id) => {
            const preset = STUDIO_THEMES[id];
            const isActive = id === themeId;
            return (
              <CommandItem key={id} onSelect={() => handleSelectTheme(id)}>
                <Palette className="w-4 h-4" />
                <span className="inline-flex items-center border border-black/20 overflow-hidden mr-1">
                  {preset.swatches.map((hex) => (
                    <span
                      key={hex}
                      className="w-2 h-3 inline-block"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </span>
                <span>{preset.name}</span>
                <CommandShortcut>
                  {isActive ? "ACTIVE" : preset.movementEra}
                </CommandShortcut>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
