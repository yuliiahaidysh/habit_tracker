import { useState, useEffect } from "react";
import { Habit } from "../hooks/useHabits";
import { useHabitMutations } from "../hooks/useHabitMutations";

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  habit?: Habit;
}

const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 500;

export default function HabitFormModal({ isOpen, onClose, onSuccess, habit }: HabitFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const { createHabit, updateHabit, error, clearError } = useHabitMutations();

  const nameError = touched.name && (name.trim() === "" ? "Habit name is required" : name.length > MAX_NAME_LENGTH ? `Name must be ${MAX_NAME_LENGTH} characters or less` : "");
  const descError = description.length > MAX_DESCRIPTION_LENGTH ? `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` : "";

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setTouched({});
    clearError();
  }, [habit, isOpen, clearError]);

  const isFormValid = (): boolean => {
    if (!name.trim()) return false;
    if (name.length > MAX_NAME_LENGTH) return false;
    if (description.length > MAX_DESCRIPTION_LENGTH) return false;
    return true;
  };

  const validateForm = (): boolean => {
    return isFormValid();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    let success = false;

    if (habit) {
      const result = await updateHabit(habit.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      success = result !== null;
    } else {
      const result = await createHabit({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      success = result !== null;
    }

    setIsSubmitting(false);

    if (success) {
      onSuccess();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            {habit ? "Edit Habit" : "Create New Habit"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Habit Name *
              </label>
              <span className={`text-xs ${name.length > MAX_NAME_LENGTH * 0.9 ? "text-red-600 font-medium" : "text-slate-500"}`}>
                {name.length}/{MAX_NAME_LENGTH}
              </span>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched({ ...touched, name: true })}
              placeholder="e.g., Morning Jog"
              maxLength={MAX_NAME_LENGTH}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors text-slate-900 placeholder-slate-500 ${
                nameError ? "border-red-300 focus:ring-red-600" : "border-slate-300 focus:ring-brand-600 focus:border-brand-600 hover:border-slate-400"
              }`}
            />
            {nameError && <p className="text-red-600 text-sm mt-1">{nameError}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Description (optional)
              </label>
              <span className={`text-xs ${description.length > MAX_DESCRIPTION_LENGTH * 0.9 ? "text-red-600 font-medium" : "text-slate-500"}`}>
                {description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., 30 minutes at the park"
              maxLength={MAX_DESCRIPTION_LENGTH}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors text-slate-900 placeholder-slate-500 resize-none ${
                descError ? "border-red-300 focus:ring-red-600" : "border-slate-300 focus:ring-brand-600 focus:border-brand-600 hover:border-slate-400"
              }`}
            />
            {descError && <p className="text-red-600 text-sm mt-1">{descError}</p>}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isFormValid()}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg font-medium text-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              )}
              {habit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
