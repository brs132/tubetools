import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setUser, setAuthToken, setRememberedEmail, getRememberedEmail } from "@/lib/auth";
import { apiPost } from "@/lib/api-client";
import { AuthResponse, SignupRequest, LoginRequest } from "@shared/api";
import { Play, CheckCircle2 } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check for remembered email and auto-fill
    const remembered = getRememberedEmail();
    if (remembered) {
      setEmail(remembered);
      setMode("login");
    }
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: SignupRequest = { name, email };
      const response = await apiPost<AuthResponse>("/api/auth/signup", payload);

      setUser(response.user);
      setAuthToken(response.token);
      setRememberedEmail(email);

      navigate("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload: LoginRequest = { email };
      const response = await apiPost<AuthResponse>("/api/auth/login", payload);

      setUser(response.user);
      setAuthToken(response.token);
      setRememberedEmail(email);

      navigate("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background flex flex-col items-center justify-center px-4">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="gradient-primary rounded-2xl p-3">
              <Play className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                WatchEarn
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Watch. Vote. Earn.</p>
            </div>
          </div>
        </div>

        {/* Value Proposition */}
        <div className="card-base mb-8">
          <div className="space-y-3">
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Watch quality videos</p>
                <p className="text-xs text-muted-foreground">Curated content inside the app</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Vote and earn rewards</p>
                <p className="text-xs text-muted-foreground">$0.30 - $2.00 per vote</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Withdraw after 20 days</p>
                <p className="text-xs text-muted-foreground">Start with $213.19 balance</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form
          onSubmit={mode === "signup" ? handleSignup : handleLogin}
          className="card-base space-y-4"
        >
          <div>
            <h2 className="text-xl font-bold mb-4">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h2>
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-sm font-semibold mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            {mode === "login" && (
              <p className="text-xs text-muted-foreground mt-1">
                We'll remember your email
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary"
          >
            {loading
              ? "Loading..."
              : mode === "signup"
                ? "Start and Earn"
                : "Log In"}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-2 bg-card text-muted-foreground">
                or
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setName("");
              setError("");
            }}
            className="w-full btn-outline"
          >
            {mode === "signup"
              ? "Already have an account? Sign In"
              : "Don't have an account? Sign Up"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
