import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { useStudioTheme } from "@/hooks/useStudioTheme";
import { openStudioCommandPalette } from "@/lib/studio-events";
import {
  STUDIO_CONFIG,
  STUDIO_THEMES,
  type StudioThemeId,
} from "@/config/studio.config";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  RefreshCw,
  Palette,
  Search,
} from "lucide-react";

const THEME_IDS: readonly StudioThemeId[] = [
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

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { themeId, setThemeId } = useStudioTheme();
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const switchRole = trpc.auth.demoLogin.useMutation({
    onSuccess: async (updatedUser) => {
      utils.auth.me.setData(undefined, updatedUser);
      await utils.invalidate();
      toast.success(
        updatedUser.role === "admin"
          ? "Switched to Studio Admin view"
          : "Switched to Client view",
      );
    },
    onError: (err) => {
      toast.error(err.message || "Failed to switch role");
    },
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isAdmin = user?.role === "admin";
  const nextRole: "admin" | "user" = isAdmin ? "user" : "admin";

  const handleSelectTheme = (id: StudioThemeId) => {
    setThemeId(id);
    toast.success(`Theme: ${STUDIO_THEMES[id].name}`);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link
          to="/"
          className="text-sm font-bold tracking-tight uppercase flex items-center gap-2 shrink-0"
        >
          <span
            className="w-3 h-3 inline-block shrink-0"
            style={{ backgroundColor: "var(--studio-red)" }}
          />
          <span className="truncate">{STUDIO_CONFIG.identity.name}</span>
        </Link>

        <div className="hidden lg:flex items-center gap-4">
          <Link
            to="/#portfolio"
            className="text-xs font-medium uppercase tracking-widest hover:text-[var(--studio-red)] transition-colors"
          >
            Portfolio
          </Link>
          <Link
            to="/artists"
            className="text-xs font-medium uppercase tracking-widest hover:text-[var(--studio-red)] transition-colors"
          >
            Artists
          </Link>
          <Link
            to="/editions"
            className="text-xs font-medium uppercase tracking-widest hover:text-[var(--studio-red)] transition-colors"
          >
            Editions
          </Link>
          <Link
            to="/licensing"
            className="text-xs font-medium uppercase tracking-widest hover:text-[var(--studio-red)] transition-colors"
          >
            Licensing
          </Link>
          <Link
            to="/#calculator"
            className="text-xs font-medium uppercase tracking-widest hover:text-[var(--studio-red)] transition-colors"
          >
            Rates
          </Link>

          <button
            type="button"
            onClick={openStudioCommandPalette}
            className="inline-flex items-center gap-1.5 px-2 py-1 border border-black/15 bg-white/80 hover:border-black text-[10px] font-mono uppercase tracking-wider transition-colors"
            title="Open studio command index (Cmd+K)"
          >
            <Search className="w-3 h-3" />
            <kbd className="text-[9px] text-gray-500">⌘K</kbd>
          </button>

          {/* Compact Art-Movement Theme Switcher with 3-Swatch Indicators */}
          <div
            className="flex items-center border border-black/15 bg-white/80 p-0.5 gap-0.5"
            title="Switch visual art movement theme"
          >
            <Palette className="w-3 h-3 text-gray-500 mx-1.5" />
            {THEME_IDS.map((id) => {
              const preset = STUDIO_THEMES[id];
              const active = themeId === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectTheme(id)}
                  className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                    active
                      ? "bg-black text-white"
                      : "text-gray-600 hover:bg-black/5"
                  }`}
                  title={preset.tagline}
                >
                  <span className="inline-flex items-center border border-black/20 overflow-hidden shrink-0">
                    {preset.swatches.map((hex) => (
                      <span
                        key={hex}
                        className="w-1.5 h-2.5 inline-block"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </span>
                  {THEME_SHORT_LABELS[id]}
                </button>
              );
            })}
          </div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 pl-2 border-l border-black/15">
              <span
                className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white"
                style={{
                  backgroundColor: isAdmin
                    ? "var(--studio-red)"
                    : "var(--studio-blue)",
                }}
              >
                {isAdmin ? "Studio Admin" : "Client"}
              </span>

              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-[10px] uppercase tracking-widest rounded-none border-black/20 hover:border-black"
                disabled={switchRole.isPending}
                onClick={() => switchRole.mutate({ role: nextRole })}
              >
                <RefreshCw
                  className={`w-3 h-3 mr-1 ${switchRole.isPending ? "animate-spin" : ""}`}
                />
                {isAdmin ? "Client View" : "Studio Desk"}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs uppercase tracking-widest rounded-none"
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard className="w-3 h-3 mr-1" />
                Dashboard
              </Button>

              <div className="flex items-center gap-1">
                <div
                  className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-bold"
                  title={user.name || "Account"}
                >
                  {user.name?.[0] || "U"}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs uppercase tracking-widest rounded-none px-2"
                  onClick={logout}
                >
                  <LogOut className="w-3 h-3 mr-1" />
                  Exit
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              className="bg-black text-white hover:bg-black/80 text-xs uppercase tracking-widest rounded-none"
              onClick={() => navigate("/login")}
            >
              <User className="w-3 h-3 mr-1" />
              Sign In
            </Button>
          )}
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-black/10 px-6 py-6 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Link
              to="/#portfolio"
              className="text-xs font-medium uppercase tracking-widest"
              onClick={() => setMenuOpen(false)}
            >
              Portfolio
            </Link>
            <Link
              to="/#packages"
              className="text-xs font-medium uppercase tracking-widest"
              onClick={() => setMenuOpen(false)}
            >
              Packages
            </Link>
            <Link
              to="/#calculator"
              className="text-xs font-medium uppercase tracking-widest"
              onClick={() => setMenuOpen(false)}
            >
              Rates
            </Link>
            <Link
              to="/#process"
              className="text-xs font-medium uppercase tracking-widest"
              onClick={() => setMenuOpen(false)}
            >
              Process
            </Link>
            <Link
              to="/artists"
              className="text-xs font-medium uppercase tracking-widest"
              onClick={() => setMenuOpen(false)}
            >
              Artists
            </Link>
            <Link
              to="/editions"
              className="text-xs font-medium uppercase tracking-widest"
              onClick={() => setMenuOpen(false)}
            >
              Editions
            </Link>
            <Link
              to="/licensing"
              className="text-xs font-medium uppercase tracking-widest"
              onClick={() => setMenuOpen(false)}
            >
              Licensing
            </Link>
            <Link
              to="/specs"
              className="text-xs font-medium uppercase tracking-widest"
              onClick={() => setMenuOpen(false)}
            >
              Press Specs
            </Link>
            <Link
              to="/colophon"
              className="text-xs font-medium uppercase tracking-widest"
              onClick={() => setMenuOpen(false)}
            >
              Colophon
            </Link>
          </div>

          <div className="pt-2 border-t border-black/10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
              Studio Visual Theme
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {THEME_IDS.map((id) => {
                const preset = STUDIO_THEMES[id];
                const active = themeId === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectTheme(id)}
                    className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest border text-left flex items-center gap-2 ${
                      active
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-700 border-black/15"
                    }`}
                  >
                    <span className="inline-flex items-center border border-black/20 overflow-hidden shrink-0">
                      {preset.swatches.map((hex) => (
                        <span
                          key={hex}
                          className="w-1.5 h-2.5 inline-block"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </span>
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          {isAuthenticated && user ? (
            <div className="pt-3 border-t border-black/10 space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white"
                  style={{
                    backgroundColor: isAdmin
                      ? "var(--studio-red)"
                      : "var(--studio-blue)",
                  }}
                >
                  {isAdmin ? "Studio Admin" : "Client"}
                </span>
                <button
                  className="text-xs font-bold uppercase tracking-widest underline"
                  disabled={switchRole.isPending}
                  onClick={() => {
                    switchRole.mutate({ role: nextRole });
                    setMenuOpen(false);
                  }}
                >
                  {isAdmin ? "Switch to Client" : "Switch to Studio"}
                </button>
              </div>
              <button
                className="block text-sm font-medium uppercase tracking-widest"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/dashboard");
                }}
              >
                Dashboard
              </button>
              <button
                className="block text-sm font-medium uppercase tracking-widest text-red-600"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              className="block text-sm font-medium uppercase tracking-widest"
              onClick={() => {
                setMenuOpen(false);
                navigate("/login");
              }}
            >
              Sign In
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
