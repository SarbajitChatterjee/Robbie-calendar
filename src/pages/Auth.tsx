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

  //Part of wavy background style
  // return (
  //   // <div className="min-h-screen flex items-center justify-center bg-background px-4">
  //   //Part of wavy background style
  //   <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden auth-bg">
  //     {/* <Card className="w-full max-w-md"> */}
  //     {/* Part of wavy background style */}
  //     <Card className="w-full max-w-md shadow-2xl relative z-10">
  //       <CardHeader className="text-center">
  //         <CardTitle className="text-2xl font-bold">Robbie</CardTitle>
  //         <CardDescription>Your unified calendar</CardDescription>
  //       </CardHeader>
  //       <CardContent>
  //         <Tabs defaultValue="login">
  //           <TabsList className="grid w-full grid-cols-2">
  //             <TabsTrigger value="login">Log in</TabsTrigger>
  //             <TabsTrigger value="signup">Sign up</TabsTrigger>
  //           </TabsList>
  //           <TabsContent value="login">
  //             <LoginForm />
  //           </TabsContent>
  //           <TabsContent value="signup">
  //             <SignupForm />
  //           </TabsContent>
  //         </Tabs>
  //       </CardContent>
  //     </Card>
  //   </div>
  // );

  // Wave style 1
  // return (
  //   <>
  //     <style>{`
  //       .auth-bg {
  //         background: #f8f7ff;
  //       }
  //       .auth-bg::before {
  //         content: '';
  //         position: absolute;
  //         inset: 0;
  //         background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Cdefs%3E%3Cstyle%3E.line%7Bfill:none%3Bstroke-width:1.2%3Bopacity:0.35%7D%3C/style%3E%3C/defs%3E%3Cpath class='line' stroke='%23b8c4e8' d='M-50 200 Q200 100 400 300 T900 200'/%3E%3Cpath class='line' stroke='%23d4b8e8' d='M-50 350 Q150 250 350 450 T850 350'/%3E%3Cpath class='line' stroke='%23e8b8c8' d='M-50 500 Q250 380 500 520 T1100 480'/%3E%3Cpath class='line' stroke='%23b8d4e8' d='M100 -50 Q200 200 150 400 T200 900'/%3E%3Cpath class='line' stroke='%23c8b8e8' d='M300 -50 Q350 150 280 350 T320 900'/%3E%3Cpath class='line' stroke='%23e8c8b8' d='M600 -50 Q700 200 650 450 T680 900'/%3E%3Cpath class='line' stroke='%23b8e8d4' d='M-50 650 Q300 550 550 700 T1100 620'/%3E%3Cpath class='line' stroke='%23d4e8b8' d='M900 -50 Q850 300 920 500 T880 950'/%3E%3C/svg%3E");
  //         animation: fadeInLines 1s ease-out forwards;
  //         opacity: 0;
  //         pointer-events: none;
  //       }
  //       @keyframes fadeInLines {
  //         from { opacity: 0; transform: scale(1.03); }
  //         to   { opacity: 1; transform: scale(1); }
  //       }
  //     `}</style>
  //     <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden auth-bg">
  //       <Card className="w-full max-w-md shadow-2xl relative z-10">
  //         <CardHeader className="text-center">
  //           <CardTitle className="text-2xl font-bold">Robbie</CardTitle>
  //           <CardDescription>Your unified calendar</CardDescription>
  //         </CardHeader>
  //         <CardContent>
  //           <Tabs defaultValue="login">
  //             <TabsList className="grid w-full grid-cols-2">
  //               <TabsTrigger value="login">Log in</TabsTrigger>
  //               <TabsTrigger value="signup">Sign up</TabsTrigger>
  //             </TabsList>
  //             <TabsContent value="login">
  //               <LoginForm />
  //             </TabsContent>
  //             <TabsContent value="signup">
  //               <SignupForm />
  //             </TabsContent>
  //           </Tabs>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   </>
  // );

  //wave style 2
  return (
    <>
      <style>{`
        @keyframes smoothReveal {
          0%   { opacity: 0; transform: translateY(20px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: "#F8F9FA" }}>
        <BackgroundWaves />
        <Card className="w-full max-w-md shadow-2xl relative z-10">
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
    </>
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
  // const [emailDetectionMode, setEmailDetectionMode] = useState<"disabled" | "ics_only">("disabled");
  const [emailDetectionMode, setEmailDetectionMode] = useState<"ics_only" | "smart" | "disabled">("ics_only");
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
        <Select value={emailDetectionMode} onValueChange={(v) => setEmailDetectionMode(v as "ics_only" | "smart" | "disabled")}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
              <SelectItem value="ics_only">Calendar invites only (.ics)</SelectItem>
              <SelectItem value="smart">Smart detect from emails</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
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

// Wave fucntion to support wave style 2.
function BackgroundWaves() {
  return (
    <div style={{
      position: "absolute",
      top: 0, left: 0,
      width: "100vw", height: "100vh",
      overflow: "hidden",
      zIndex: 0,
      backgroundColor: "#F8F9FA",
    }}>
      <svg
        style={{ width: "100%", height: "100%", animation: "smoothReveal 1.2s cubic-bezier(0.22, 1, 0.36, 1) forwards", opacity: 0 }}
        viewBox="0 0 1440 800"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gradBlue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A90E2" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#9013FE" stopOpacity="0.2" />
          </linearGradient>
          <linearGradient id="gradPurple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9013FE" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF4B2B" stopOpacity="0.15" />
          </linearGradient>
          <linearGradient id="gradPink" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BD10E0" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#F5A623" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="#F8F9FA" />
        <path
          d="M-100,150 C250,50 450,450 950,150 C1250,-50 1550,250 1650,150 L1650,1000 L-100,1000 Z"
          fill="#FAFBFC" stroke="url(#gradBlue)" strokeWidth="1.5"
        />
        <path
          d="M-100,350 C350,250 550,650 1050,350 C1350,150 1550,550 1650,350 L1650,1000 L-100,1000 Z"
          fill="#FCFDFE" stroke="url(#gradPurple)" strokeWidth="1.5"
        />
        <path
          d="M-100,550 C450,450 650,850 1150,550 C1450,350 1550,750 1650,600 L1650,1000 L-100,1000 Z"
          fill="#FFFFFF" stroke="url(#gradPink)" strokeWidth="1.5"
        />
      </svg>
    </div>
  );
}