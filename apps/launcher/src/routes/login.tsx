import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { subscribeToAuthState, signInWithGoogle, type AuthUser } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Enfactum Central" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Login,
});

function useAuthState() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    subscribeToAuthState((authUser) => {
      if (!cancelled) {
        setUser(authUser);
        setLoading(false);
      }
    }).then((unsub) => {
      if (cancelled) unsub();
      else unsubscribe = unsub;
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return { user, loading };
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function Login() {
  const { user, loading } = useAuthState();
  const navigate = useNavigate();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError("Sign-in failed. Make sure you're using your @enfactum.com account.");
      setSigningIn(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {/* Background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -right-48 -top-48 h-[700px] w-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.18 280 / 0.12) 0%, transparent 65%)",
          }}
        />
        <div
          className="absolute -bottom-48 -left-48 h-[500px] w-[500px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, oklch(0.55 0.18 240 / 0.08) 0%, transparent 65%)",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border/60 bg-card/70 backdrop-blur-xl shadow-2xl">
        {/* Top gradient accent line */}
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, oklch(0.55 0.2 280 / 0.6), oklch(0.55 0.2 240 / 0.6), transparent)",
          }}
        />

        <div className="px-8 pb-8 pt-9">
          {/* Logo */}
          <div className="mb-7 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
              <span className="text-base font-black text-white">E</span>
            </div>
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">
                Enfactum OS
              </p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-7 text-center">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Welcome back.
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in to access Enfactum internal tools.
            </p>
          </div>

          {/* Divider */}
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/40">
              Continue with
            </span>
            <div className="h-px flex-1 bg-border/60" />
          </div>

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn || loading}
            className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border/80 bg-background px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:border-foreground/20 hover:bg-accent hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            {signingIn ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <p className="mt-3 text-center text-xs text-destructive">{error}</p>
          )}

          {/* Domain note */}
          <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground/50">
            Access is restricted to{" "}
            <span className="font-mono text-muted-foreground/70">@enfactum.com</span>{" "}
            accounts only.
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-8 text-[11px] tracking-wider text-muted-foreground/30">
        ENFACTUM OS · v1.0
      </p>
    </div>
  );
}
