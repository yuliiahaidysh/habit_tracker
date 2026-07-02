import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  startDate: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  current: number;
  best: number;
  total: number;
}

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHabits = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/habits", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch habits");
      }

      const data = await response.json();
      setHabits(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch habits");
      setHabits([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHabits();
    } else {
      setHabits([]);
      setIsLoading(false);
    }
  }, [user]);

  return { habits, isLoading, error, refetch: fetchHabits };
}
