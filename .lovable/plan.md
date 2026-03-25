

# Enable Supabase + Implement Authentication Layer

## Blocker: Supabase Not Connected

Supabase is not yet set up in this project. There is no `@supabase/supabase-js` dependency, no client file, and no Supabase connection.

**You need to do this first:**

1. Open the **Cloud** tab in your Lovable project (top-right area of the editor)
2. Enable **Lovable Cloud** (this provisions a Supabase instance and creates the client file at `src/integrations/supabase/client.ts`)
3. Once enabled, reply here so I can proceed

## What I Will Build After Supabase Is Connected

Once the Supabase client exists, I will implement the full authentication layer exactly as specified:

### Files to Create / Modify

| File | Action |
|---|---|
| `src/pages/Auth.tsx` | **Create** -- Login + Signup page with two tabs |
| `src/pages/AuthConfirm.tsx` | **Create** -- Email confirmation handler |
| `src/App.tsx` | **Modify** -- Add `/auth`, `/auth/confirm` routes + AuthGuard |

### Implementation (unchanged from approved plan)

1. **AuthGuard** in App.tsx: listens to `onAuthStateChange`, redirects unauthenticated users to `/auth`, redirects authenticated users away from `/auth`

2. **Auth.tsx** -- Login tab (email + password with show/hide + signInWithPassword) and Signup tab with all 7 fields in exact order: Display Name, Email, Password, Home Timezone (searchable from `public.timezones.tz_tag`), First Day of Week, Email Detection Mode (disabled, "ics_only"), Dark Mode (pill buttons)

3. **AuthConfirm.tsx** -- Shows loading message, calls `getSession()`, validates session, reads `user_metadata`, upserts into `public.user_settings` with `onConflict: "user_id"`, redirects to homepage (or `/auth?error=confirmation_failed` on failure)

4. **Data integrity**: signup stores fields in `user_metadata` only; `user_settings` is written to only after confirmed session; failed confirmation writes nothing

## Next Step

Enable Lovable Cloud from the Cloud tab, then tell me to proceed.

