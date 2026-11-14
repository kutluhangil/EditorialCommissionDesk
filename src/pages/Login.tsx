import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc";
import { useStudioTheme } from "@/hooks/useStudioTheme";
import { STUDIO_THEMES, type StudioThemeId } from "@/config/studio.config";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Shield, UserCheck, Briefcase, Palette } from "lucide-react";

const THEME_IDS: StudioThemeId[] = ["mondrian", "bauhaus", "swiss", "noir"];

function hasKimiOAuthConfig(): boolean {
  return Boolean(
    import.meta.env.VITE_KIMI_AUTH_URL && import.meta.env.VITE_APP_ID,
  );
}

function getOAuthUrl() {
  const kimiAuthUrl = import.meta.env.VITE_KIMI_AUTH_URL;
  const appID = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const state = btoa(redirectUri);

  const url = new URL(`${kimiAuthUrl}/api/oauth/authorize`);
  url.searchParams.set("client_id", appID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "profile");
  url.searchParams.set("state", state);

  return url.toString();
}

export default function Login() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const { themeId, theme, setThemeId } = useStudioTheme();
  const [oauthLoading, setOauthLoading] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");
  const [customRole, setCustomRole] = useState<"user" | "admin">("user");

  const demoLogin = trpc.auth.demoLogin.useMutation({
    onSuccess: async (user) => {
      utils.auth.me.setData(undefined, user);
      await utils.invalidate();
      toast.success(
        user.role === "admin"
          ? "Entered Studio Admin Desk"
          : `Signed in as ${user.name || "Client"}`,
      );
      navigate("/dashboard");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to sign in");
    },
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() && !customEmail.trim()) {
      toast.error("Enter a name or email, or use one-click demo access above");
      return;
    }
    demoLogin.mutate({
      role: customRole,
      name: customName.trim() || undefined,
      email: customEmail.trim() || undefined,
    });
  };

  const kimiConfigured = hasKimiOAuthConfig();

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <button
          onClick={() => navigate("/")}
          className="text-xs font-medium uppercase tracking-widest text-gray-400 hover:text-black transition-colors flex items-center gap-1 mb-8"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Home
        </button>

        <div className="bg-black p-1">
          <div className="bg-white p-8 lg:p-10">
            <div className="mb-8">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div
                  className="w-3 h-3"
                  style={{ backgroundColor: "var(--studio-red)" }}
                />
                <div className="flex items-center gap-1 border border-black/15 p-0.5 bg-gray-50">
                  <Palette className="w-3 h-3 text-gray-500 mx-1" />
                  {THEME_IDS.map((id) => {
                    const preset = STUDIO_THEMES[id];
                    const active = themeId === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setThemeId(id)}
                        className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${
                          active ? "bg-black text-white" : "text-gray-600 hover:bg-black/5"
                        }`}
                        title={preset.name}
                      >
                        <span
                          className="w-2 h-2 inline-block border border-black/20"
                          style={{ backgroundColor: preset.red }}
                        />
                        {id}
                      </button>
                    );
                  })}
                </div>
              </div>
              <h1 className="text-2xl font-black uppercase tracking-tight mb-1">
                Commission Desk Access
              </h1>
              <p className="text-[10px] font-mono uppercase tracking-widest text-gray-400 mb-3">
                ACTIVE THEME: {theme.name} ({theme.movementEra})
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Choose a workspace role to explore briefs, live quotes, stage
                tracking, and studio correspondence — no external credentials
                required.
              </p>
            </div>

            {/* One-click Demo Roles */}
            <div className="space-y-3 mb-6">
              <button
                type="button"
                disabled={demoLogin.isPending}
                onClick={() => demoLogin.mutate({ role: "user" })}
                className="w-full p-4 border border-black bg-black text-white hover:bg-black/90 transition-colors text-left flex items-start justify-between gap-4 disabled:opacity-60"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--studio-yellow)" }}
                    />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Client View · Clara Vance
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70">
                    The New Yorker · View 4 active commissions, 2 saved drafts &
                    commission chat
                  </p>
                </div>
                {demoLogin.isPending && demoLogin.variables?.role === "user" ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-1" />
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/15 px-2 py-1 shrink-0">
                    Enter
                  </span>
                )}
              </button>

              <button
                type="button"
                disabled={demoLogin.isPending}
                onClick={() => demoLogin.mutate({ role: "admin" })}
                className="w-full p-4 border border-black text-white hover:opacity-90 transition-opacity text-left flex items-start justify-between gap-4 disabled:opacity-60"
                style={{ backgroundColor: "var(--studio-blue)" }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Shield
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--studio-yellow)" }}
                    />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Studio Admin · Atelier Mondrian
                    </span>
                  </div>
                  <p className="text-[11px] text-white/75">
                    Manage all studio commissions, advance workflow stages & reply
                    to clients
                  </p>
                </div>
                {demoLogin.isPending && demoLogin.variables?.role === "admin" ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-1" />
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/15 px-2 py-1 shrink-0">
                    Enter
                  </span>
                )}
              </button>
            </div>

            {/* Custom profile sign-in */}
            <div className="border-t border-black/10 pt-5">
              <button
                type="button"
                onClick={() => setCustomOpen((v) => !v)}
                className="text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-black flex items-center gap-2"
              >
                <UserCheck className="w-3.5 h-3.5" />
                {customOpen ? "Hide custom profile" : "Sign in with custom profile"}
              </button>

              {customOpen && (
                <form onSubmit={handleCustomSubmit} className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="Your name / publication"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="rounded-none border-gray-300 text-xs"
                    />
                    <Input
                      type="email"
                      placeholder="name@publication.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="rounded-none border-gray-300 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex gap-1">
                      {(["user", "admin"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setCustomRole(r)}
                          className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border transition-colors ${
                            customRole === r
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-600 border-gray-300 hover:border-black"
                          }`}
                        >
                          {r === "admin" ? "Studio Admin" : "Client"}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={demoLogin.isPending}
                      className="text-white hover:opacity-90 rounded-none text-xs uppercase tracking-widest"
                      style={{ backgroundColor: "var(--studio-red)" }}
                    >
                      Continue
                    </Button>
                  </div>
                </form>
              )}
            </div>

            {kimiConfigured && (
              <div className="mt-6 pt-5 border-t border-black/10">
                <Button
                  variant="outline"
                  className="w-full border-black rounded-none text-xs uppercase tracking-widest py-5"
                  onClick={() => {
                    setOauthLoading(true);
                    window.location.href = getOAuthUrl();
                  }}
                  disabled={oauthLoading}
                >
                  {oauthLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Sign in with Kimi OAuth
                </Button>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-black/10">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                Switch seamlessly between Client and Studio Admin views at any
                time from the navigation bar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px bg-black">
            <div className="h-2" style={{ backgroundColor: "var(--studio-red)" }} />
            <div className="h-2" style={{ backgroundColor: "var(--studio-blue)" }} />
            <div className="h-2" style={{ backgroundColor: "var(--studio-yellow)" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
