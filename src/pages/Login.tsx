import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";

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
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
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
              <div className="w-3 h-3 bg-[#e63946] mb-4" />
              <h1 className="text-2xl font-black uppercase tracking-tight mb-2">
                Client Access
              </h1>
              <p className="text-xs text-gray-500 leading-relaxed">
                Sign in to save commission drafts, track your inquiries, and
                communicate directly with the studio team.
              </p>
            </div>

            <Button
              className="w-full bg-black text-white hover:bg-black/80 rounded-none text-xs uppercase tracking-widest py-6"
              size="lg"
              onClick={() => {
                setLoading(true);
                window.location.href = getOAuthUrl();
              }}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Sign in with Kimi
            </Button>

            <div className="mt-8 pt-6 border-t border-black/10">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed">
                By signing in, you agree to our commission terms and privacy
                policy. Your data is used solely for project management and
                communication.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-px bg-black">
            <div className="bg-[#e63946] h-2" />
            <div className="bg-[#1d3557] h-2" />
            <div className="bg-[#f4a261] h-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
