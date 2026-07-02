import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import AuthEntry from "./pages/AuthEntry";
import MainApp from "./pages/MainApp";
import ErrorBanner from "./components/ErrorBanner";

function AppContent() {
  const { user, isLoading, error, clearError } = useAuth();
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    const errorDesc = params.get("error_description");

    if (errorParam) {
      setOauthError(errorDesc || `Authentication failed: ${errorParam}`);
      // Clear error param from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const displayError = error || oauthError;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-slate-600">Loading…</div>
      </div>
    );
  }

  return (
    <>
      {displayError && (
        <ErrorBanner
          message={displayError}
          onDismiss={() => {
            clearError();
            setOauthError(null);
          }}
        />
      )}
      {user ? <MainApp /> : <AuthEntry />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
