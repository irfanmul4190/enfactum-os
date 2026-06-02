import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useState } from 'react';

export default function Login() {
  const { signInWithGoogle, authError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayError = authError ?? error;

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8 p-8">
        {/* Logo */}
        <div className="text-center">
          <div className="flex items-baseline justify-center gap-0 select-none mb-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">en</span>
            <span className="text-2xl font-bold tracking-tight text-brand-blue">fact</span>
            <span className="text-2xl font-bold tracking-tight text-foreground">um</span>
          </div>
          <p className="text-xs text-muted-foreground tracking-wider uppercase">Funnel Manager</p>
        </div>

        {/* Sign in card */}
        <div className="data-panel space-y-4">
          <div className="text-center space-y-1">
            <h2 className="text-sm font-semibold">Welcome</h2>
            <p className="text-xs text-muted-foreground">Sign in with your Google Workspace account</p>
          </div>

          <Button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-10 text-sm"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {loading ? 'Redirecting...' : 'Sign in with Google'}
          </Button>

          {displayError && (
            <p className="text-xs text-destructive text-center">{displayError}</p>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Only @enfactum.com accounts can access this app.
        </p>
      </div>
    </div>
  );
}
