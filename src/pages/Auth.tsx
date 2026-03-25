/**
 * Auth.tsx — Login + Signup page with two tabs.
 *
 * Login: email + password (with show/hide toggle)
 * Signup: 7 fields stored in user_metadata only (no DB write until confirmation)
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTimezones } from "@/hooks/useTimezones";
import type { Timezone } from "@/types";

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");

  useEffect(() => {
    if (error === "confirmation_failed") {
      toast.error("Email confirmation failed. Please try signing up again.");
    }
  }, [error]);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/", { replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Robbie</CardTitle>
          <CardDescription>Your unified calendar</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Login ───────────────────────────────────────────

function LoginForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      navigate("/", { replace: true });
    }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPw ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPw(!showPw)}
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Log in
      </Button>
    </form>
  );
}

// ─── Signup ──────────────────────────────────────────

function SignupForm() {
  const { data: timezones, isLoading: tzLoading } = useTimezones();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [homeTimezone, setHomeTimezone] = useState("");
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<"sunday" | "monday">("sunday");
  const [emailDetectionMode, setEmailDetectionMode] = useState<"disabled" | "ics_only">("disabled");
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tzSearch, setTzSearch] = useState("");

  // const filteredTimezones = (timezones ?? []).filter((tz: Timezone) =>
  //   tz.name.toLowerCase().includes(tzSearch.toLowerCase()) ||
  //   tz.iana_key.toLowerCase().includes(tzSearch.toLowerCase())
  // );
  const filteredTimezones = (timezones ?? []).filter((tz: Timezone) =>
    (tz.tz_tag ?? "").toLowerCase().includes(tzSearch.toLowerCase()) ||
    (tz.tz_name ?? "").toLowerCase().includes(tzSearch.toLowerCase())
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeTimezone) {
      toast.error("Please select a home timezone.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: {
          displayName,
          homeTimezone,
          firstDayOfWeek,
          emailDetectionMode,
          darkMode,
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Check your email for a confirmation link!");
    }
  };

  return (
    <form onSubmit={handleSignup} className="space-y-4 pt-4">
      {/* 1. Display Name */}
      <div className="space-y-2">
        <Label htmlFor="signup-name">Display Name</Label>
        <Input
          id="signup-name"
          placeholder="Jane Doe"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </div>

      {/* 2. Email */}
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {/* 3. Password */}
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPw ? "text" : "password"}
            placeholder="Min 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setShowPw(!showPw)}
            tabIndex={-1}
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* 4. Home Timezone (searchable select) */}
      <div className="space-y-2">
        <Label>Home Timezone</Label>
        {tzLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading timezones…
          </div>
        ) : (
          <Select value={homeTimezone} onValueChange={setHomeTimezone}>
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <div className="p-2">
                <Input
                  placeholder="Search timezones…"
                  value={tzSearch}
                  onChange={(e) => setTzSearch(e.target.value)}
                  className="h-8"
                />
              </div>
            {filteredTimezones.map((tz: Timezone) => (
              <SelectItem key={tz.tz_tag} value={tz.tz_tag}>
                {tz.tz_name}
              </SelectItem>
              ))}
              {filteredTimezones.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No timezones found
                </div>
              )}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* 5. First Day of Week */}
      <div className="space-y-2">
        <Label>First Day of Week</Label>
        <Select value={firstDayOfWeek} onValueChange={(v) => setFirstDayOfWeek(v as "sunday" | "monday")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sunday">Sunday</SelectItem>
            <SelectItem value="monday">Monday</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 6. Email Detection Mode */}
      <div className="space-y-2">
        <Label>Email Detection Mode</Label>
        <Select value={emailDetectionMode} onValueChange={(v) => setEmailDetectionMode(v as "disabled" | "ics_only")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="disabled">Disabled</SelectItem>
            <SelectItem value="ics_only">ICS attachments only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 7. Dark Mode */}
      <div className="space-y-2">
        <Label>Dark Mode</Label>
        <div className="flex rounded-full border border-input p-0.5 w-fit">
          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !darkMode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setDarkMode(false)}
          >
            Light
          </button>
          <button
            type="button"
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              darkMode
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setDarkMode(true)}
          >
            Dark
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create account
      </Button>
    </form>
  );
}
