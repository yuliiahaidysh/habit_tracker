import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export interface CheckIn {
  date: string;
  createdAt: string;
}

export function useCheckInHistory(habitId: string | null) {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!habitId || !user) {
      setCheckIns([]);
      return;
    }

    const fetchCheckIns = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/habits/${habitId}/checkins`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch check-in history");
        }

        const data = await response.json();
        setCheckIns(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch check-in history");
        setCheckIns([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCheckIns();
  }, [habitId, user]);

  return { checkIns, isLoading, error };
}
