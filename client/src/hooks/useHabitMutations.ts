import { useState, useCallback } from "react";
import { Habit } from "./useHabits";

interface CreateHabitInput {
  name: string;
  description?: string;
}

interface UpdateHabitInput {
  name?: string;
  description?: string;
  status?: "ACTIVE" | "PAUSED" | "ARCHIVED";
}

export function useHabitMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createHabit = async (input: CreateHabitInput): Promise<Habit | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create habit");
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create habit";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateHabit = async (habitId: string, input: UpdateHabitInput): Promise<Habit | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/habits/${habitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update habit");
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update habit";
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createCheckIn = async (habitId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/habits/${habitId}/checkins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create check-in");
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create check-in";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCheckIn = async (habitId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/habits/${habitId}/checkins/today`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete check-in");
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to undo check-in";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteHabit = async (habitId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/habits/${habitId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete habit");
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete habit";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = useCallback(() => setError(null), []);

  return {
    createHabit,
    updateHabit,
    createCheckIn,
    deleteCheckIn,
    deleteHabit,
    isLoading,
    error,
    clearError,
  };
}
