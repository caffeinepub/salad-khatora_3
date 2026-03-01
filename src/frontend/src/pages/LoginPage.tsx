import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Leaf, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      void navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, isLoading, navigate]);

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setIsPending(true);
    const result = await login(email, password);
    setIsPending(false);
    if (result.success) {
      void navigate({ to: "/dashboard" });
    } else {
      toast.error(result.error ?? "Login failed. Please try again.");
    }
  };

  if (isLoading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-card rounded-2xl shadow-card border border-border overflow-hidden">
          {/* Green top bar */}
          <div className="h-2 sk-gradient w-full" />

          <div className="px-8 py-8">
            {/* Logo + Brand */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 overflow-hidden">
                <img
                  src="/assets/uploads/Salad-Khatora-1.jpeg"
                  alt="Salad Khatora"
                  className="w-16 h-16 object-contain rounded-xl"
                />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Salad Khatora
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Sign in to your admin panel
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@saladkhatora.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email)
                      setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  className={
                    errors.email
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  }
                  disabled={isPending}
                />
                {errors.email && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password)
                        setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    className={
                      errors.password
                        ? "border-destructive focus-visible:ring-destructive pr-10"
                        : "pr-10"
                    }
                    disabled={isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-destructive text-xs mt-1">
                    {errors.password}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 mt-2"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Footer hint */}
        <div className="text-center mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <Leaf size={12} className="text-primary" />
          <span>Fresh management for your salad business</span>
        </div>

        {/* Caffeine footer */}
        <div className="text-center mt-3">
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            © {new Date().getFullYear()}. Built with ♥ using caffeine.ai
          </a>
        </div>
      </div>
    </div>
  );
}
