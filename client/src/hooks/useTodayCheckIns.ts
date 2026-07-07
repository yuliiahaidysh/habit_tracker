import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Habit } from "./useHabits";
import { API_ENDPOINTS } from "../api/endpoints";
import { getTodayString } from "../utils/dateUtils";

export function useTodayCheckIns(habits: Habit[]) {
  const { user } = useAuth();
  const [todayCheckIns, setTodayCheckIns] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const fetchTodayCheckIns = useCallback(async () => {
    if (!user || habits.length === 0) {
      setTodayCheckIns(new Set());
      return;
    }

    try {
      setIsLoading(true);
      const checkedIds = new Set<string>();
      const today = getTodayString();

      for (const habit of habits) {
        try {
          const response = await fetch(API_ENDPOINTS.HABIT_CHECKINS(habit.id), {
            credentials: "include",
          });

          if (response.ok) {
            const dates: string[] = await response.json();
            if (dates.includes(today)) {
              checkedIds.add(habit.id);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch check-ins for habit ${habit.id}:`, err);
        }
      }

      setTodayCheckIns(checkedIds);
    } finally {
      setIsLoading(false);
    }
  }, [user, habits]);

  useEffect(() => {
    fetchTodayCheckIns();
  }, [fetchTodayCheckIns]);

  return { todayCheckIns, isLoading, refetch: fetchTodayCheckIns };
}
