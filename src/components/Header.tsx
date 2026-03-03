import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Upload, Languages, LogOut, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/store/authStore";
import { logoutApi } from "@/api/auth";

const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, user, logout } = useAuthStore();

  const handleLogout = async () => {
    try {
      // Tell backend to invalidate JWT (add jti to Redis blocklist)
      await logoutApi();
    } catch {
      // Even if backend call fails, clear local state
    } finally {
      logout();
      toast({ title: "Logout berhasil", description: "Sampai jumpa!" });
      navigate("/auth", { replace: true });
    }
  };

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">TranscriptCrowd</h1>
              <p className="text-xs text-muted-foreground">Collaborative Translation Platform</p>
            </div>
          </div>

          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-6">
              <a href="/" className="text-foreground hover:text-primary transition-smooth">
                Dashboard
              </a>
              <a href="/upload" className="text-foreground hover:text-primary transition-smooth">
                Upload
              </a>
              {user?.role === "admin" && (
                <a href="/admin" className="text-foreground hover:text-primary transition-smooth flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Admin
                </a>
              )}
            </nav>
          )}

          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <span className="hidden md:block text-sm text-muted-foreground">
                  {user?.name}
                  {user?.role === "admin" && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </span>
                <Button
                  variant="academic"
                  size="sm"
                  onClick={() => navigate("/upload")}
                >
                  <Upload className="w-4 h-4" />
                  New Project
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              </>
            ) : (
              <Button variant="academic" size="sm" onClick={() => navigate("/auth")}>
                Login
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;