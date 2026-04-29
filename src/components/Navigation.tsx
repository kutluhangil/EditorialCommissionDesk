import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, User, LogOut, LayoutDashboard } from "lucide-react";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-black/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          to="/"
          className="text-sm font-bold tracking-tight uppercase flex items-center gap-2"
        >
          <span
            className="w-3 h-3 inline-block"
            style={{ background: "#e63946" }}
          />
          Editorial Commission Desk
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            to="/#portfolio"
            className="text-xs font-medium uppercase tracking-widest hover:text-[#e63946] transition-colors"
          >
            Portfolio
          </Link>
          <Link
            to="/#services"
            className="text-xs font-medium uppercase tracking-widest hover:text-[#e63946] transition-colors"
          >
            Services
          </Link>
          <Link
            to="/#process"
            className="text-xs font-medium uppercase tracking-widest hover:text-[#e63946] transition-colors"
          >
            Process
          </Link>
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs uppercase tracking-widest"
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard className="w-3 h-3 mr-1" />
                Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                  {user?.name?.[0] || "U"}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs uppercase tracking-widest"
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
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-white border-t border-black/10 px-6 py-6 space-y-4">
          <Link
            to="/#portfolio"
            className="block text-sm font-medium uppercase tracking-widest"
            onClick={() => setMenuOpen(false)}
          >
            Portfolio
          </Link>
          <Link
            to="/#services"
            className="block text-sm font-medium uppercase tracking-widest"
            onClick={() => setMenuOpen(false)}
          >
            Services
          </Link>
          <Link
            to="/#process"
            className="block text-sm font-medium uppercase tracking-widest"
            onClick={() => setMenuOpen(false)}
          >
            Process
          </Link>
          {isAuthenticated ? (
            <>
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
            </>
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
