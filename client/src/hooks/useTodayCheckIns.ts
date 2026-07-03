import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";

export function useTodayCheckIns(habits: any[]) {
  const { user } = useAuth();
  const [todayCheckIns, setTodayCheckIns] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const habitsRef = useRef(habits);

  useEffect(() => {
    habitsRef.current = habits;
  }, [habits]);

  const fetchTodayCheckIns = useCallback(async () => {
    const habitsToCheck = habitsRef.current;

    console.log('fetchTodayCheckIns: checking habits, count:', habitsToCheck.length);

    if (!user || habitsToCheck.length === 0) {
      console.log('fetchTodayCheckIns: no user or no habits, setting empty');
      setTodayCheckIns(new Set());
      return;
    }

    try {
      setIsLoading(true);
      const checkedIds = new Set<string>();

      for (const habit of habitsToCheck) {
        try {
          const response = await fetch(`/api/habits/${habit.id}/checkins`, {
            credentials: "include",
          });

          if (response.ok) {
            const checkIns = await response.json();
            const today = new Date().toISOString().split("T")[0];

            if (checkIns.some((c: any) => c === today || c.date === today)) {
              checkedIds.add(habit.id);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch check-ins for habit ${habit.id}:`, err);
        }
      }

      console.log('fetchTodayCheckIns: found checked habits:', Array.from(checkedIds));
      setTodayCheckIns(checkedIds);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTodayCheckIns();
  }, [fetchTodayCheckIns]);

  return { todayCheckIns, isLoading, refetch: fetchTodayCheckIns };
}
