/**
 * AuthConfirm.tsx — Email confirmation handler.
 *
 * Flow:
 * 1. User clicks the confirmation link in their email → lands here
 * 2. Supabase auto-exchanges the token in the URL hash for a session
 * 3. We validate the session, read user_metadata, and upsert into user_settings
 * 4. Redirect to "/" on success, or "/auth?error=confirmation_failed" on failure
 *
 * Data integrity: user_settings is written ONLY after a confirmed session exists.
 */

//import { useEffect, useRef } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function AuthConfirm() {
  const navigate = useNavigate();
  // const hasRun = useRef(false);

  useEffect(() => {
    // if (hasRun.current) return;
    // hasRun.current = true;

    //Adding the logic to wait for the session to exchange tokens completely and have the session ready. Hence disabling the first iteration with mark v1. New iteration is v2.

    //v1
    /*
    async function confirm() {
      try {
        // Supabase client auto-processes the hash fragment on page load.
        // getSession() returns the newly created session if confirmation succeeded.
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          console.error("Confirmation failed:", error?.message ?? "No session");
          navigate("/auth?error=confirmation_failed", { replace: true });
          return;
        }

        // Read metadata stored during signup
        const meta = session.user.user_metadata ?? {};
        const userId = session.user.id;
        const email = session.user.email ?? "";

        // Upsert into user_settings — only runs after confirmed session
        // const { error: upsertError } = await supabase
        //   .from("user_settings")
        //   .upsert(
        //     {
        //       user_id: userId,
        //       display_name: meta.displayName ?? "",
        //       email,
        //       home_timezone: meta.homeTimezone ?? "UTC",
        //       first_day_of_week: meta.firstDayOfWeek ?? "sunday",
        //       email_detection_mode: meta.emailDetectionMode === "ics_only" ? "ics_only" : "disabled",
        //       dark_mode: meta.darkMode ?? false,
        //       show_organizer_timezone: true,
        //       default_calendar_id: "",
        //     },
        //     { onConflict: "user_id" }
        //   );

        const { error: upsertError } = await supabase
          .from("user_settings")
          .upsert(
            {
              user_id:                 userId,
              email:                   email,
              displayName:             meta.displayName         ?? "",
              homeTimezone:            meta.homeTimezone        ?? "UTC",
              firstDayOfWeek:          meta.firstDayOfWeek      ?? "monday",
              // emailDetectionMode: meta.emailDetectionMode === "ics_only" ? "ics_only" : "disabled",
              emailDetectionMode:      ["ics_only", "smart", "disabled"].includes(meta.emailDetectionMode) ? meta.emailDetectionMode: "ics_only",
              darkMode:                meta.darkMode            ?? false,
              showOrganizerTimezone:   true
            },
            { onConflict: "user_id" }
          );

        if (upsertError) {
          console.error("Failed to save user settings:", upsertError.message, upsertError.details);
          // Session is valid but settings failed — user can recover via Settings page
        }

        navigate("/", { replace: true });
      } catch (err) {
        console.error("Unexpected confirmation error:", err);
        navigate("/auth?error=confirmation_failed", { replace: true });
      }
    }

    confirm();
    */

    //v2 - wait for session to be ready
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          subscription.unsubscribe();

          try {
            const meta = session.user.user_metadata ?? {};
            const userId = session.user.id;
            const email = session.user.email ?? "";

            const { error: upsertError } = await supabase
              .from("user_settings")
              .upsert(
                {
                  user_id:               userId,
                  email:                 email,
                  displayName:           meta.displayName      ?? "",
                  homeTimezone:          meta.homeTimezone     ?? "UTC",
                  firstDayOfWeek:        meta.firstDayOfWeek   ?? "monday",
                  emailDetectionMode:    ["ics_only", "smart", "disabled"].includes(meta.emailDetectionMode)
                                           ? meta.emailDetectionMode: "ics_only",
                  darkMode:              meta.darkMode         ?? false,
                  showOrganizerTimezone: true,
                },
                { onConflict: "user_id" }
              );

            if (upsertError) {
              console.error(
                "Failed to save user settings:", upsertError.message, upsertError.details,);
            }

            navigate("/", { replace: true });

          } catch (err) {
            console.error("Unexpected error during confirmation:", err);
            navigate("/", { replace: true });
          }

        } else if (event === "SIGNED_OUT" || !session) {
          subscription.unsubscribe();
          navigate("/auth?error=confirmation_failed", { replace: true });
        }
      }
    );

    return () => subscription.unsubscribe();

  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Confirming your account…</p>
      </div>
    </div>
  );
}
