import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export function useTodayCheckIns(habits: any[]) {
  const { user } = useAuth();
  const [todayCheckIns, setTodayCheckIns] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user || habits.length === 0) {
      setTodayCheckIns(new Set());
      return;
    }

    const fetchTodayCheckIns = async () => {
      try {
        setIsLoading(true);
        const checkedIds = new Set<string>();

        for (const habit of habits) {
          try {
            const response = await fetch(`/api/habits/${habit.id}/checkins`, {
              credentials: "include",
            });

            if (response.ok) {
              const checkIns = await response.json();
              const today = new Date().toISOString().split("T")[0];

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
    };

    fetchTodayCheckIns();
  }, [user, habits]);

  return { todayCheckIns, isLoading };
}
