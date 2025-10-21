import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "@/lib/auth";
import { LogOut, Home, Play, Wallet } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  hideNav?: boolean;
}

export default function Layout({ children, hideNav = false }: LayoutProps) {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearAuth();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header/Navigation */}
      {!hideNav && user && (
        <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-red-600 rounded-lg p-2">
                <Play className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-foreground">TubeTools</h1>
            </div>

            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              <button
                onClick={() => navigate("/feed")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Play className="h-4 w-4" />
                <span>Feed</span>
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Wallet className="h-4 w-4" />
                <span>Balance</span>
              </button>
            </div>

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="text-xs text-muted-foreground">
                  ${user.balance.toFixed(2)}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Mobile bottom nav */}
          <div className="md:hidden flex items-center justify-center gap-4 border-t border-border">
            <button
              onClick={() => navigate("/feed")}
              className="flex-1 flex flex-col items-center gap-1 px-4 py-2 text-xs"
            >
              <Play className="h-5 w-5" />
              <span>Feed</span>
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="flex-1 flex flex-col items-center gap-1 px-4 py-2 text-xs"
            >
              <Wallet className="h-5 w-5" />
              <span>Balance</span>
            </button>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
