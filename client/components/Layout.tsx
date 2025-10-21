import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, clearAuth } from "@/lib/auth";
import { LogOut, Play, Wallet } from "lucide-react";

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
        <>
          <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container px-4 flex h-16 items-center justify-between">
              {/* Logo */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="bg-red-600 rounded-lg p-2 flex-shrink-0">
                  <Play className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-lg md:text-xl font-bold text-foreground truncate">
                  TubeTools
                </h1>
              </div>

              {/* Nav Links - Desktop Only */}
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
              <div className="flex items-center gap-3 ml-auto">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${user.balance.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-center justify-around">
              <button
                onClick={() => navigate("/feed")}
                className="flex-1 flex flex-col items-center gap-1 px-4 py-3 hover:bg-muted transition-colors"
              >
                <Play className="h-5 w-5" />
                <span className="text-xs font-semibold">Feed</span>
              </button>
              <button
                onClick={() => navigate("/profile")}
                className="flex-1 flex flex-col items-center gap-1 px-4 py-3 hover:bg-muted transition-colors"
              >
                <Wallet className="h-5 w-5" />
                <span className="text-xs font-semibold">Balance</span>
              </button>
            </div>
          </nav>
        </>
      )}

      {/* Main Content - Add padding for mobile nav */}
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
