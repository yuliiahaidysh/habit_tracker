import { useState, useCallback } from "react";
import Header from "../components/Header";
import HabitList from "../components/HabitList";
import HabitFormModal from "../components/HabitFormModal";
import HabitDetails from "./HabitDetails";
import Toast from "../components/Toast";
import { Habit } from "../hooks/useHabits";
import { useWebSocket, MilestoneNotification } from "../hooks/useWebSocket";

type StatusFilter = "all" | "active" | "paused" | "archived";
type CheckInFilter = "all" | "completed" | "not-completed";

interface ToastMessage {
  id: string;
  type: "success" | "milestone";
  title: string;
  message: string;
}

export default function MainApp() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);
  const [viewingHabitId, setViewingHabitId] = useState<string | null>(null);
  const [viewingHabit, setViewingHabit] = useState<Habit | null>(null);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [checkInFilter, setCheckInFilter] = useState<CheckInFilter>("all");
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);

  const handleMilestoneReceived = useCallback(
    (notification: MilestoneNotification) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToastMessages((prev) => [
        ...prev,
        {
          id,
          type: "milestone",
          title: `🎉 ${notification.milestone}-Day Milestone!`,
          message: `${notification.habitName} has reached a ${notification.milestone}-day streak!`,
        },
      ]);
    },
    []
  );

  const removeToastMessage = useCallback((id: string) => {
    setToastMessages((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  useWebSocket({ onMilestoneReceived: handleMilestoneReceived });

  const handleOpenCreate = () => {
    setSelectedHabit(undefined);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (habit: Habit) => {
    setSelectedHabit(habit);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleViewDetails = (habit: Habit) => {
    setViewingHabit(habit);
    setViewingHabitId(habit.id);
  };

  const handleBackFromDetails = () => {
    setViewingHabitId(null);
    setViewingHabit(null);
    setRefreshKey((prev) => prev + 1);
  };

  if (viewingHabitId && viewingHabit) {
    return (
      <HabitDetails
        habit={viewingHabit}
        onBack={handleBackFromDetails}
        onRefresh={() => setRefreshKey((prev) => prev + 1)}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Toast messages={toastMessages} onRemove={removeToastMessage} />
      <Header />
      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">My Habits</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">Track your daily habits and streaks</p>
            </div>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-slate-900 text-white text-sm sm:text-base rounded-lg font-medium hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 transition-colors whitespace-nowrap"
            >
              + New Habit
            </button>
          </div>
          <div className="mb-6 space-y-3 sm:space-y-4">
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search habits by name or description…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-slate-300 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 hover:border-slate-400 transition-colors"
            />

            {/* Status Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${
                  statusFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${
                  statusFilter === "active"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter("paused")}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${
                  statusFilter === "paused"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Paused
              </button>
              <button
                onClick={() => setStatusFilter("archived")}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${
                  statusFilter === "archived"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Archived
              </button>
            </div>

            {/* Check-in Status Filter Buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCheckInFilter("all")}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${
                  checkInFilter === "all"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Check-ins
              </button>
              <button
                onClick={() => setCheckInFilter("completed")}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${
                  checkInFilter === "completed"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Completed Today
              </button>
              <button
                onClick={() => setCheckInFilter("not-completed")}
                className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 ${
                  checkInFilter === "not-completed"
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                Not Completed
              </button>
            </div>
          </div>

          <HabitList
            key={refreshKey}
            onEditHabit={handleOpenEdit}
            onViewDetails={handleViewDetails}
            searchText={searchText}
            statusFilter={statusFilter}
            checkInFilter={checkInFilter}
          />
        </div>
      </main>

      <HabitFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        habit={selectedHabit}
      />
    </div>
  );
}
