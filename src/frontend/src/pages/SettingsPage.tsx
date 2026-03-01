import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Settings,
  Shield,
  Sliders,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useCallerUserProfile,
  useSaveCallerUserProfile,
} from "../hooks/useQueries";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface Preferences {
  currency: string;
  lowStockAlerts: boolean;
}

const DEFAULT_PREFS: Preferences = {
  currency: "PKR",
  lowStockAlerts: true,
};

function loadPrefs(): Preferences {
  try {
    const raw = localStorage.getItem("sk_prefs");
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

function savePrefs(prefs: Preferences): void {
  localStorage.setItem("sk_prefs", JSON.stringify(prefs));
}

function getStoredPassword(): string {
  return localStorage.getItem("sk_password") ?? "admin123";
}

// ─── Profile Tab ───────────────────────────────────────────────────────────────

function ProfileTab() {
  const [name, setName] = useState("");
  const { data: profile, isLoading } = useCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();

  useEffect(() => {
    if (!isLoading) {
      setName(profile?.name ?? "Admin");
    }
  }, [profile, isLoading]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }
    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success("Profile saved successfully.");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    }
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <User size={18} className="text-primary" />
          </div>
          <div>
            <CardTitle className="font-display text-base">
              Profile Information
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Update your display name shown in the admin panel.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-5 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="display-name" className="text-sm font-medium">
              Display Name
            </Label>
            {isLoading ? (
              <div className="h-9 bg-muted rounded-md animate-pulse" />
            ) : (
              <Input
                id="display-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="h-9"
                maxLength={60}
                autoComplete="name"
              />
            )}
            <p className="text-xs text-muted-foreground">
              This name appears in the sidebar and admin views.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Email</Label>
            <Input
              value="admin@saladkhatora.com"
              disabled
              className="h-9 bg-muted/50 text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Email is fixed and cannot be changed.
            </p>
          </div>

          <Button
            type="submit"
            disabled={saveProfile.isPending || isLoading}
            className="gap-2"
          >
            {saveProfile.isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Check size={14} />
            )}
            {saveProfile.isPending ? "Saving…" : "Save Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Security Tab ──────────────────────────────────────────────────────────────

function SecurityTab() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const stored = getStoredPassword();

    if (currentPw !== stored) {
      setError("Current password is incorrect.");
      return;
    }
    if (newPw.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsSaving(true);
    // Simulate async save
    setTimeout(() => {
      localStorage.setItem("sk_password", newPw);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setIsSaving(false);
      toast.success("Password changed successfully.");
    }, 500);
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
            <Shield size={18} className="text-amber-600" />
          </div>
          <div>
            <CardTitle className="font-display text-base">
              Change Password
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Update your admin login password.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5 max-w-sm">
          {/* Current Password */}
          <div className="space-y-1.5">
            <Label htmlFor="current-pw" className="text-sm font-medium">
              Current Password
            </Label>
            <div className="relative">
              <Input
                id="current-pw"
                type={showCurrent ? "text" : "password"}
                value={currentPw}
                onChange={(e) => {
                  setCurrentPw(e.target.value);
                  setError(null);
                }}
                placeholder="Enter current password"
                className="h-9 pr-9"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent((p) => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showCurrent ? "Hide password" : "Show password"}
              >
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="new-pw" className="text-sm font-medium">
              New Password
            </Label>
            <div className="relative">
              <Input
                id="new-pw"
                type={showNew ? "text" : "password"}
                value={newPw}
                onChange={(e) => {
                  setNewPw(e.target.value);
                  setError(null);
                }}
                placeholder="At least 6 characters"
                className="h-9 pr-9"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {/* Password strength hint */}
            {newPw.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1 w-8 rounded-full transition-colors ${
                        newPw.length >= level * 3
                          ? level === 1
                            ? "bg-destructive"
                            : level === 2
                              ? "bg-amber-400"
                              : "bg-primary"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  {newPw.length < 3
                    ? "Too short"
                    : newPw.length < 6
                      ? "Weak"
                      : newPw.length < 9
                        ? "Fair"
                        : "Strong"}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pw" className="text-sm font-medium">
              Confirm New Password
            </Label>
            <div className="relative">
              <Input
                id="confirm-pw"
                type={showConfirm ? "text" : "password"}
                value={confirmPw}
                onChange={(e) => {
                  setConfirmPw(e.target.value);
                  setError(null);
                }}
                placeholder="Repeat new password"
                className="h-9 pr-9"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {confirmPw.length > 0 && newPw !== confirmPw && (
              <p className="text-xs text-destructive">
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Inline error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/8 border border-destructive/20">
              <Lock
                size={14}
                className="text-destructive flex-shrink-0 mt-0.5"
              />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSaving || !currentPw || !newPw || !confirmPw}
            className="gap-2"
          >
            {isSaving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Shield size={14} />
            )}
            {isSaving ? "Updating…" : "Update Password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Preferences Tab ───────────────────────────────────────────────────────────

function PreferencesTab() {
  const [prefs, setPrefs] = useState<Preferences>(loadPrefs);

  function updatePrefs(partial: Partial<Preferences>) {
    setPrefs((prev) => {
      const next = { ...prev, ...partial };
      savePrefs(next);
      toast.success("Preferences saved.");
      return next;
    });
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Sliders size={18} className="text-blue-600" />
          </div>
          <div>
            <CardTitle className="font-display text-base">
              App Preferences
            </CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Customize how Salad Khatora works for you.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 max-w-sm">
          {/* Currency */}
          <div className="space-y-1.5">
            <Label htmlFor="currency-select" className="text-sm font-medium">
              Currency Symbol
            </Label>
            <Select
              value={prefs.currency}
              onValueChange={(val) => updatePrefs({ currency: val })}
            >
              <SelectTrigger id="currency-select" className="h-9 w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PKR">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      ₨
                    </span>
                    PKR — Pakistani Rupee
                  </span>
                </SelectItem>
                <SelectItem value="USD">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      $
                    </span>
                    USD — US Dollar
                  </span>
                </SelectItem>
                <SelectItem value="SAR">
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                      ﷼
                    </span>
                    SAR — Saudi Riyal
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Used when displaying prices and revenue figures.
            </p>
          </div>

          {/* Low-Stock Alerts */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-muted/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell size={14} className="text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground leading-tight">
                  Low-Stock Alerts
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Show notifications when ingredient stock drops below the
                  minimum threshold.
                </p>
              </div>
            </div>
            <Switch
              id="low-stock-toggle"
              checked={prefs.lowStockAlerts}
              onCheckedChange={(checked) =>
                updatePrefs({ lowStockAlerts: checked })
              }
              aria-label="Toggle low-stock alerts"
              className="flex-shrink-0 mt-0.5"
            />
          </div>

          {/* Current preferences summary */}
          <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/15">
            <p className="text-xs font-semibold text-primary mb-2 uppercase tracking-wide">
              Current Settings
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Currency</span>
                <span className="font-medium text-foreground">
                  {prefs.currency}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Low-stock alerts</span>
                <span
                  className={`font-medium ${prefs.lowStockAlerts ? "text-primary" : "text-muted-foreground"}`}
                >
                  {prefs.lowStockAlerts ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-display font-semibold text-foreground flex items-center gap-2.5">
          <Settings size={22} className="text-primary" />
          Settings
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage your account and app preferences.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="space-y-5">
        <TabsList className="h-9 bg-muted/60 border border-border p-0.5 gap-0.5">
          <TabsTrigger
            value="profile"
            className="gap-1.5 text-xs font-medium h-8 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <User size={13} />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="gap-1.5 text-xs font-medium h-8 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Shield size={13} />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="preferences"
            className="gap-1.5 text-xs font-medium h-8 px-4 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <Sliders size={13} />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-0">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="security" className="mt-0">
          <SecurityTab />
        </TabsContent>

        <TabsContent value="preferences" className="mt-0">
          <PreferencesTab />
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-border mt-8">
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          © {new Date().getFullYear()}. Built with ♥ using caffeine.ai
        </a>
      </footer>
    </div>
  );
}
