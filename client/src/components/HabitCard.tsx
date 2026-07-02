import { useState } from "react";
import { Habit } from "../hooks/useHabits";
import { useHabitMutations } from "../hooks/useHabitMutations";

interface HabitCardProps {
  habit: Habit;
  todayChecked: boolean;
  onEdit: () => void;
  onViewDetails: () => void;
  onRefresh: () => void;
}

export default function HabitCard({ habit, todayChecked, onEdit, onViewDetails, onRefresh }: HabitCardProps) {
  const isActive = habit.status === "ACTIVE";
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const { createCheckIn, deleteCheckIn, error: mutationError } = useHabitMutations();

  const handleCheckIn = async () => {
    setIsCheckingIn(true);
    const success = await createCheckIn(habit.id);
    setIsCheckingIn(false);
    if (success) onRefresh();
  };

  const handleUndo = async () => {
    setIsCheckingIn(true);
    const today = new Date().toISOString().split("T")[0];
    const success = await deleteCheckIn(habit.id, today);
    setIsCheckingIn(false);
    if (success) onRefresh();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3">
        <button
          onClick={onViewDetails}
          className="flex-1 text-left hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 rounded transition-all"
          title="View habit details"
        >
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">{habit.name}</h3>
          {habit.description && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1">{habit.description}</p>
          )}
        </button>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onEdit}
            title="Edit habit"
            className="px-2 sm:px-2.5 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 transition-colors"
          >
            Edit
          </button>
          <div
            className={`px-2 sm:px-2.5 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
              habit.status === "ACTIVE"
                ? "bg-emerald-100 text-emerald-700"
                : habit.status === "PAUSED"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {habit.status}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
        <div className="bg-slate-50 rounded p-1.5 sm:p-2 text-center">
          <div className="text-xs text-slate-600 font-medium">Current</div>
          <div className="text-lg sm:text-xl font-bold text-slate-900">{habit.current}</div>
        </div>
        <div className="bg-slate-50 rounded p-1.5 sm:p-2 text-center">
          <div className="text-xs text-slate-600 font-medium">Best</div>
          <div className="text-lg sm:text-xl font-bold text-slate-900">{habit.best}</div>
        </div>
        <div className="bg-slate-50 rounded p-1.5 sm:p-2 text-center">
          <div className="text-xs text-slate-600 font-medium">Total</div>
          <div className="text-lg sm:text-xl font-bold text-slate-900">{habit.total}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 pt-3 border-t border-slate-100">
        <span className="text-xs sm:text-sm text-slate-600">Today's status</span>
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all focus-within:ring-2 focus-within:ring-brand-600 focus-within:ring-offset-2 ${
              todayChecked
                ? "bg-emerald-500 border-emerald-500"
                : "border-slate-300 bg-white hover:border-slate-400"
            }`}
          >
            {todayChecked && (
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          {isActive && (
            <>
              {todayChecked ? (
                <button
                  onClick={handleUndo}
                  disabled={isCheckingIn}
                  className="px-2 sm:px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                >
                  {isCheckingIn ? "Undoing…" : "Undo"}
                </button>
              ) : (
                <button
                  onClick={handleCheckIn}
                  disabled={isCheckingIn}
                  className="px-2 sm:px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                >
                  {isCheckingIn ? "Checking…" : "Check in"}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {!isActive && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 leading-relaxed">
            {habit.status === "PAUSED"
              ? "This habit is paused and does not accept check-ins"
              : "This habit is archived and is read-only"}
          </p>
        </div>
      )}

      {mutationError && (
        <div className="mt-3 bg-red-50 border border-red-200 rounded p-2 text-red-800 text-xs">
          {mutationError}
        </div>
      )}
    </div>
  );
}
