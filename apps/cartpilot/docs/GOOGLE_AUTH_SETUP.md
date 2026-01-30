# Google (Gmail) sign-in for Olive

Google OAuth is wired up so users can sign in with their Gmail account. You need to (1) add the callback URL in Supabase and (2) add the "Sign in with Google" button on the login page.

---

## 1. Auth callback route (already added)

**`src/app/auth/callback/route.ts`** handles the redirect from Google:

- Reads the `code` from the URL after Google sign-in
- Exchanges it for a session via `exchangeCodeForSession`
- Redirects to `/dashboard` (or `?next=` if present)
- On error, redirects to `/login?error=auth_callback`

No changes needed here unless you move to a different auth package.

---

## 2. Supabase redirect URL

In **Supabase Dashboard** for project **rbfzlqmkwhbvrrfdcain**:

1. Go to **Authentication → URL Configuration**.
2. Under **Redirect URLs**, add:
   - `https://shopolive.xyz/auth/callback`
   - `http://localhost:3001/auth/callback` (for local dev)
3. Save.

Google is already enabled under **Authentication → Providers → Google** (you said it’s on). Ensure the **Callback URL** shown there matches what Supabase expects (e.g. `https://rbfzlqmkwhbvrrfdcain.supabase.co/auth/v1/callback`). You don’t need to change that; Supabase handles the redirect to your app.

---

## 3. Login page: "Sign in with Google" button

**Option A — Use the component (recommended)**  
A ready-made button lives in `src/app/login/SignInWithGoogle.tsx`. On your login page:

```tsx
import { SignInWithGoogle } from './SignInWithGoogle'

// In your form area, e.g. above or below the email/password form:
<SignInWithGoogle onError={setError} redirectTo="/dashboard" />
```

To send users to Connect Kroger after Google sign-in, use `redirectTo="/dashboard?connectKroger=1"`.

**Option B — Inline handler and button**  
Use the **same Supabase client** you already use on the login page (e.g. `import { supabase } from '@/lib/supabase'`). Add a handler and a button:

**Handler (e.g. in your login page or a small helper):**

```ts
async function signInWithGoogle() {
  if (!supabase) return
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })
  if (error) {
    setError(error.message) // or your error state
    return
  }
}
```

**Button (in your login form area):**

```tsx
<button
  type="button"
  onClick={signInWithGoogle}
  className="w-full flex items-center justify-center gap-2 py-3.5 border border-[#dce5cc] rounded-xl hover:bg-[#f8faf5] transition text-[#2d3a1f] font-medium"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
  Sign in with Google
</button>
```

Place the button above or below your email/password form, or in a “Or continue with” section.

**Optional:** If you want to send users to Connect Kroger after Google sign-in (like “Continue with Kroger”), use:

```ts
redirectTo: `${window.location.origin}/auth/callback?next=/dashboard?connectKroger=1`,
```

---

## 4. Error handling on login page

If the callback fails, users are sent to `/login?error=auth_callback`. You can show a message when that query param is present:

```tsx
const searchParams = useSearchParams()
useEffect(() => {
  if (searchParams.get('error') === 'auth_callback') {
    setError('Sign-in was cancelled or failed. Try again or use email.')
  }
}, [searchParams])
```

---

## Summary

| Step | Action |
|------|--------|
| 1 | Callback route is in place at `src/app/auth/callback/route.ts`. |
| 2 | Add `https://shopolive.xyz/auth/callback` and `http://localhost:3001/auth/callback` in Supabase → Auth → URL Configuration → Redirect URLs. |
| 3 | Add `signInWithGoogle()` and the “Sign in with Google” button to your login page. |
| 4 | Optional: handle `?error=auth_callback` on the login page. |

After that, “Sign in with Google” will sign users in and send them to the dashboard (or to Connect Kroger if you use the `next=` option).
