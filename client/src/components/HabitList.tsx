import { useMemo, useState } from "react";
import { useHabits } from "../hooks/useHabits";
import { useTodayCheckIns } from "../hooks/useTodayCheckIns";
import HabitCard from "./HabitCard";
import EmptyState from "./EmptyState";
import { NoHabitsIcon, NoResultsIcon } from "./EmptyStateIcons";
import { HabitCardSkeletonList } from "./SkeletonLoader";
import { Habit } from "../hooks/useHabits";
import { StatusFilter, CheckInFilter } from "../types";

interface HabitListProps {
  onEditHabit: (habit: Habit) => void;
  onViewDetails: (habit: Habit) => void;
  searchText: string;
  statusFilter: StatusFilter;
  checkInFilter: CheckInFilter;
}

export default function HabitList({
  onEditHabit,
  onViewDetails,
  searchText,
  statusFilter,
  checkInFilter,
}: HabitListProps) {
  const { habits, isLoading: habitsLoading, error, refetch } = useHabits();
  const { todayCheckIns, refetch: refetchTodayCheckIns } = useTodayCheckIns(habits);
  const [optimisticHabits, setOptimisticHabits] = useState<Map<string, Habit>>(new Map());
  const [optimisticCheckIns, setOptimisticCheckIns] = useState<Set<string>>(new Set());

  const displayHabits = useMemo(() => {
    return habits.map((habit) => optimisticHabits.get(habit.id) || habit);
  }, [habits, optimisticHabits]);

  const effectiveTodayCheckIns = useMemo(() => {
    const merged = new Set(todayCheckIns);
    optimisticCheckIns.forEach((id) => merged.add(id));
    return merged;
  }, [todayCheckIns, optimisticCheckIns]);

  const filteredHabits = useMemo(() => {
    return displayHabits.filter((habit) => {
      // Search filter: match name or description
      if (searchText.trim()) {
        const query = searchText.toLowerCase();
        const matchesSearch =
          habit.name.toLowerCase().includes(query) ||
          (habit.description?.toLowerCase() || "").includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if (statusFilter !== habit.status.toLowerCase()) return false;
      }

      // Check-in status filter
      if (checkInFilter !== "all") {
        const checkedToday = effectiveTodayCheckIns.has(habit.id);
        if (checkInFilter === "completed" && !checkedToday) return false;
        if (checkInFilter === "not-completed" && checkedToday) return false;
      }

      return true;
    });
  }, [displayHabits, searchText, statusFilter, checkInFilter, effectiveTodayCheckIns]);

  if (habitsLoading) {
    return <HabitCardSkeletonList />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        <p className="font-medium">Error loading habits</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <EmptyState
        icon={<NoHabitsIcon />}
        title="No habits yet"
        description="Start building better habits by creating your first one. Track your daily progress and build streaks."
      />
    );
  }

  if (filteredHabits.length === 0) {
    return (
      <EmptyState
        icon={<NoResultsIcon />}
        title="No results found"
        description="Your search or filters didn't match any habits. Try adjusting them to see your habits."
      />
    );
  }

  const handleRefresh = async () => {
    await refetch();
    await refetchTodayCheckIns();
  };

  const handleHabitUpdated = (updatedHabit: Habit) => {
    const newOptimistic = new Map(optimisticHabits);
    newOptimistic.set(updatedHabit.id, updatedHabit);
    setOptimisticHabits(newOptimistic);
  };

  const handleCheckInStatusChanged = (habitId: string, isChecked: boolean) => {
    const newOptimisticCheckIns = new Set(optimisticCheckIns);
    if (isChecked) {
      newOptimisticCheckIns.add(habitId);
    } else {
      newOptimisticCheckIns.delete(habitId);
    }
    setOptimisticCheckIns(newOptimisticCheckIns);
  };

  return (
    <div className="grid gap-3 sm:gap-4">
      {filteredHabits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          todayChecked={effectiveTodayCheckIns.has(habit.id)}
          onEdit={() => onEditHabit(habit)}
          onViewDetails={() => onViewDetails(habit)}
          onRefresh={handleRefresh}
          onHabitUpdated={handleHabitUpdated}
          onCheckInStatusChanged={handleCheckInStatusChanged}
        />
      ))}
    </div>
  );
}
