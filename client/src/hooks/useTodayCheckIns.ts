import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";

export function useTodayCheckIns(habits: any[]) {
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
      const today = new Date().toISOString().split("T")[0];

      for (const habit of habits) {
        try {
          const response = await fetch(`/api/habits/${habit.id}/checkins`, {
            credentials: "include",
          });

          if (response.ok) {
            const checkIns = await response.json();
            if (checkIns.some((c: any) => c.date === today)) {
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
