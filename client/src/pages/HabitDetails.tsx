import { useState } from "react";
import { Habit } from "../hooks/useHabits";
import { useCheckInHistory } from "../hooks/useCheckInHistory";
import Calendar from "../components/Calendar";
import HabitFormModal from "../components/HabitFormModal";
import EmptyState from "../components/EmptyState";
import { NoCheckInsIcon } from "../components/EmptyStateIcons";
import { CheckInHistorySkeleton, RecentCheckInsSkeleton } from "../components/SkeletonLoader";
import { useHabitMutations } from "../hooks/useHabitMutations";

interface HabitDetailsProps {
  habit: Habit;
  onBack: () => void;
  onRefresh: () => void;
}

export default function HabitDetails({ habit, onBack, onRefresh }: HabitDetailsProps) {
  const { checkIns, isLoading: checkInsLoading } = useCheckInHistory(habit.id);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { deleteHabit, error: mutationError } = useHabitMutations();

  const checkInDates = new Set(checkIns.map((c) => c.date));

  const handleDeleteHabit = async () => {
    if (!window.confirm("Are you sure you want to delete this habit? This cannot be undone.")) {
      return;
    }

    const success = await deleteHabit(habit.id);
    if (success) {
      onRefresh();
      onBack();
    }
  };

  const handleEditSuccess = () => {
    onRefresh();
    setIsFormOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 rounded-lg transition-colors flex-shrink-0"
              title="Back to habits"
            >
              <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{habit.name}</h1>
              {habit.description && (
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 truncate">{habit.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xs text-slate-600 font-medium mb-1">Current Streak</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">{habit.current}</div>
              <div className="text-xs text-slate-500 mt-1">days</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xs text-slate-600 font-medium mb-1">Best Streak</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">{habit.best}</div>
              <div className="text-xs text-slate-500 mt-1">days</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-xs text-slate-600 font-medium mb-1">Total Check-ins</div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900">{habit.total}</div>
              <div className="text-xs text-slate-500 mt-1">times</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6 sm:mb-8">
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 transition-colors"
            >
              Edit Habit
            </button>
            <button
              onClick={handleDeleteHabit}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 transition-colors"
            >
              Delete Habit
            </button>
          </div>

          <div className="mb-6 sm:mb-8">
            <h2 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Check-in History</h2>
            {checkInsLoading ? (
              <CheckInHistorySkeleton />
            ) : checkIns.length === 0 ? (
              <EmptyState
                icon={<NoCheckInsIcon />}
                title="No check-ins yet"
                description={`Start your streak by checking in for ${habit.name} today. Consistency builds strong habits.`}
              />
            ) : (
              <Calendar checkInDates={checkInDates} />
            )}
          </div>

          {checkIns.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-4">Recent Check-ins</h3>
              {checkInsLoading ? (
                <RecentCheckInsSkeleton />
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {checkIns
                    .slice()
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 20)
                    .map((checkIn) => (
                      <div
                        key={checkIn.date}
                        className="flex items-center justify-between bg-slate-50 rounded-lg p-2 sm:p-3 hover:bg-slate-100 transition-colors"
                      >
                        <span className="text-xs sm:text-sm text-slate-700 font-medium">
                          {new Date(checkIn.date + "T00:00:00Z").toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {mutationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-sm sm:text-base text-red-800">
              {mutationError}
            </div>
          )}
        </div>
      </main>

      <HabitFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleEditSuccess}
        habit={habit}
      />
    </div>
  );
}
