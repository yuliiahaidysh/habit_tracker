import GoogleIcon from "../components/GoogleIcon";
import GitHubIcon from "../components/GitHubIcon";

export default function AuthEntry() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-white px-6 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <img
            src="https://www.wellable.co/blog/wp-content/uploads/2024/01/Science-Of-Habit-Formation-Habit-Loop-edited.png"
            alt="Discipline illustration"
            className="w-48 h-48"
            sizes="200px"
          />
        </div>
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">Habit Tracker</h1>
          <p className="mt-4 text-lg text-slate-600">
            Build consistent habits and track your progress with daily streaks.
          </p>
        </div>

        <div className="space-y-3">
          <a
            href="/auth/google"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-900 transition-colors hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          >
            <GoogleIcon />
            Sign in with Google
          </a>

          <a
            href="/auth/github"
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 font-medium text-slate-900 transition-colors hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2"
          >
            <GitHubIcon />
            Sign in with GitHub
          </a>
        </div>

        <div className="pt-4 text-center text-sm text-slate-500">
          <p>
            Sign in with Google or GitHub to create and track your habits.
          </p>
        </div>
      </div>
    </main>
  );
}
