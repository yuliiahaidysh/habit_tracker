import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";

export default function Header() {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      setIsLoggingOut(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-bold text-slate-900">Habit Tracker</h1>
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name || "User avatar"}
                    className="h-8 w-8 rounded-full"
                  />
                )}
                <span className="text-sm font-medium text-slate-700">
                  {user.display_name || user.email || "User"}
                </span>
              </div>
              <button
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          )}
        </div>
      </header>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        title="Log out?"
        message="Are you sure you want to log out?"
        confirmText="Log out"
        cancelText="Cancel"
        isDangerous={false}
        isLoading={isLoggingOut}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
    </>
  );
}
