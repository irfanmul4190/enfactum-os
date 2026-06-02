export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  provider: "firebase" | "supabase";
};

type AuthProvider = "firebase" | "supabase";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
};

function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

function isSupabaseConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey);
}

function resolveProvider(): AuthProvider | null {
  const preferredProvider = import.meta.env.VITE_AUTH_PROVIDER as
    | AuthProvider
    | undefined;

  if (preferredProvider === "firebase" && isFirebaseConfigured()) {
    return "firebase";
  }

  if (preferredProvider === "supabase" && isSupabaseConfigured()) {
    return "supabase";
  }

  if (isFirebaseConfigured()) {
    return "firebase";
  }

  if (isSupabaseConfigured()) {
    return "supabase";
  }

  return null;
}

function mapFirebaseUser(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): AuthUser {
  return {
    id: user.uid,
    email: user.email,
    name: user.displayName,
    avatarUrl: user.photoURL,
    provider: "firebase",
  };
}

function mapSupabaseUser(user: {
  id: string;
  email?: string;
  user_metadata?: { full_name?: string; avatar_url?: string };
}): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
    name: user.user_metadata?.full_name ?? null,
    avatarUrl: user.user_metadata?.avatar_url ?? null,
    provider: "supabase",
  };
}

let cachedFirebaseAuth: Promise<{
  auth: import("firebase/auth").Auth;
  onAuthStateChanged: typeof import("firebase/auth").onAuthStateChanged;
  GoogleAuthProvider: typeof import("firebase/auth").GoogleAuthProvider;
  signInWithRedirect: typeof import("firebase/auth").signInWithRedirect;
  signOut: typeof import("firebase/auth").signOut;
}> | null = null;

async function getFirebaseAuth() {
  cachedFirebaseAuth ??= (async () => {
      const [{ initializeApp, getApps }, authModule] = await Promise.all([
        import("firebase/app"),
        import("firebase/auth"),
      ]);

      const app =
        getApps().find((candidate) => candidate.name === "launcher") ??
        initializeApp(firebaseConfig, "launcher");

      return {
        auth: authModule.getAuth(app),
        onAuthStateChanged: authModule.onAuthStateChanged,
        GoogleAuthProvider: authModule.GoogleAuthProvider,
        signInWithRedirect: authModule.signInWithRedirect,
        signOut: authModule.signOut,
      };
    })();

  return cachedFirebaseAuth;
}

let cachedSupabaseClient: Promise<
  import("@supabase/supabase-js").SupabaseClient
> | null = null;

// Exported so the admin/people page can hit the employees table using the
// same session the user is signed into here (RLS sees them as authenticated).
export async function getSupabaseClient() {
  cachedSupabaseClient ??= (async () => {
      const { createClient } = await import("@supabase/supabase-js");

      return createClient(supabaseConfig.url, supabaseConfig.anonKey);
    })();

  return cachedSupabaseClient;
}

export async function subscribeToAuthState(
  callback: (user: AuthUser | null) => void,
): Promise<() => void> {
  if (globalThis.window === undefined) {
    callback(null);
    return () => {};
  }

  const provider = resolveProvider();

  if (!provider) {
    callback(null);
    return () => {};
  }

  if (provider === "firebase") {
    const { auth, onAuthStateChanged } = await getFirebaseAuth();

    return onAuthStateChanged(auth, (user) => {
      callback(user ? mapFirebaseUser(user) : null);
    });
  }

  const supabase = await getSupabaseClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ? mapSupabaseUser(session.user) : null);
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();
  callback(session?.user ? mapSupabaseUser(session.user) : null);

  return () => subscription.unsubscribe();
}

export async function signInWithGoogle() {
  const provider = resolveProvider();

  if (!provider) {
    throw new Error(
      "No auth provider is configured. Add Firebase or Supabase VITE_ environment variables.",
    );
  }

  if (provider === "firebase") {
    const { auth, GoogleAuthProvider, signInWithRedirect } = await getFirebaseAuth();
    const googleProvider = new GoogleAuthProvider();
    await signInWithRedirect(auth, googleProvider);
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: globalThis.window.location.origin },
  });

  if (error) {
    throw error;
  }
}

export async function signOutUser() {
  const provider = resolveProvider();

  if (!provider) {
    return;
  }

  if (provider === "firebase") {
    const { auth, signOut } = await getFirebaseAuth();
    await signOut(auth);
    return;
  }

  const supabase = await getSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export function getAuthProviderLabel() {
  const provider = resolveProvider();
  return provider ? provider[0].toUpperCase() + provider.slice(1) : "Auth";
}
