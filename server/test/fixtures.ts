/**
 * Test Fixtures
 *
 * Reusable, pre-built mock data for common test scenarios:
 * - Users with various OAuth providers
 * - Habits with different statuses
 * - Check-ins for streaks testing
 * - Pre-dated sequences for streak validation
 */

import { prisma } from '../src/db.js';
import { todayInAppTz } from '../src/dates.js';
import type { User, Habit, CheckIn } from '@prisma/client';

/**
 * Dummy user profiles: templates that can be passed to test-login.
 */
export const dummyUsers = {
  googleUser1: {
    provider: 'google',
    providerUserId: 'g-alice-12345',
    displayName: 'Alice',
    email: 'alice@gmail.com',
    avatarUrl: 'https://example.com/alice.jpg',
  },
  googleUser2: {
    provider: 'google',
    providerUserId: 'g-bob-67890',
    displayName: 'Bob',
    email: 'bob@gmail.com',
    avatarUrl: null,
  },
  githubUser1: {
    provider: 'github',
    providerUserId: 'gh-charlie-11111',
    displayName: 'Charlie',
    email: 'charlie@github.com',
    avatarUrl: null,
  },
  githubUserNoEmail: {
    provider: 'github',
    providerUserId: 'gh-diane-22222',
    displayName: 'Diane',
    email: null,
    avatarUrl: null,
  },
};

/**
 * Template habits for various test scenarios.
 */
export const templateHabits = {
  meditation: {
    name: 'Meditation',
    description: 'Daily 10-minute meditation practice',
    startDate: todayInAppTz(), // Today
    status: 'Active' as const,
  },
  exercise: {
    name: 'Exercise',
    description: 'Workout or physical activity',
    startDate: todayInAppTz(),
    status: 'Active' as const,
  },
  reading: {
    name: 'Reading',
    description: 'Read for at least 30 minutes',
    startDate: todayInAppTz(),
    status: 'Active' as const,
  },
  paused: {
    name: 'On Hold',
    description: 'A habit currently paused',
    startDate: todayInAppTz(),
    status: 'Paused' as const,
  },
  archived: {
    name: 'Old Habit',
    description: 'An archived habit',
    startDate: todayInAppTz(),
    status: 'Archived' as const,
  },
};

/**
 * Utility to create pre-dated check-in sequences.
 * Useful for testing streak calculations without waiting N days.
 *
 * Example: createCheckInSequence(habit, 5, 'consecutive')
 *   Creates check-ins for today and the 4 preceding days (5-day streak).
 *
 * @param habit The habit to create check-ins for
 * @param daysBack How many days back to create check-ins (including today)
 * @param pattern 'consecutive' (no gaps) or 'sparse' (every other day)
 * @returns Array of created CheckIn records
 */
export async function createCheckInSequence(
  habit: Habit,
  daysBack: number,
  pattern: 'consecutive' | 'sparse' = 'consecutive',
): Promise<CheckIn[]> {
  const today = new Date(todayInAppTz() + 'T00:00:00Z');
  const checkIns: CheckIn[] = [];

  for (let i = 0; i < daysBack; i++) {
    // Skip even-indexed days if sparse pattern
    if (pattern === 'sparse' && i % 2 === 1) continue;

    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const checkIn = await prisma.checkIn.create({
      data: {
        habitId: habit.id,
        date: dateStr,
      },
    });
    checkIns.push(checkIn);
  }

  return checkIns.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Fixture: User with fresh account (no habits, no check-ins).
 * Useful for testing account creation and empty states.
 */
export async function fixtureNewUser(overrides?: Partial<User>): Promise<User> {
  return prisma.user.create({
    data: {
      provider: 'test',
      providerUserId: `test-${Date.now()}-${Math.random()}`,
      displayName: 'New User',
      email: null,
      ...overrides,
    },
  });
}

/**
 * Fixture: User with one active habit, checked in every day for N days.
 * Useful for testing streaks, milestones, and check-in operations.
 *
 * @param daysOfStreak How many consecutive days of check-ins to create
 */
export async function fixtureUserWithStreak(daysOfStreak: number): Promise<{
  user: User;
  habit: Habit;
  checkIns: CheckIn[];
}> {
  const user = await fixtureNewUser({ displayName: 'Streak Tester' });
  const habit = await prisma.habit.create({
    data: {
      userId: user.id,
      name: 'Daily Habit',
      description: 'Testing streaks',
      startDate: todayInAppTz(),
      status: 'Active',
    },
  });

  const checkIns = await createCheckInSequence(habit, daysOfStreak, 'consecutive');

  return { user, habit, checkIns };
}

/**
 * Fixture: User with multiple habits in different states.
 * Useful for testing search, filter, and authorization.
 */
export async function fixtureUserWithMixedHabits(): Promise<{
  user: User;
  activeHabits: Habit[];
  pausedHabits: Habit[];
  archivedHabits: Habit[];
}> {
  const user = await fixtureNewUser({ displayName: 'Multi-Habit User' });

  const activeHabits = await Promise.all([
    prisma.habit.create({
      data: { userId: user.id, ...templateHabits.meditation },
    }),
    prisma.habit.create({
      data: { userId: user.id, ...templateHabits.exercise },
    }),
  ]);

  const pausedHabits = await Promise.all([
    prisma.habit.create({
      data: { userId: user.id, ...templateHabits.paused },
    }),
  ]);

  const archivedHabits = await Promise.all([
    prisma.habit.create({
      data: { userId: user.id, ...templateHabits.archived },
    }),
  ]);

  return { user, activeHabits, pausedHabits, archivedHabits };
}

/**
 * Fixture: Two users to test cross-user authorization denial.
 * Useful for testing that user A cannot see user B's data.
 */
export async function fixtureMultiUserScenario(): Promise<{
  user1: User;
  user2: User;
  user1Habit: Habit;
  user2Habit: Habit;
}> {
  const user1 = await fixtureNewUser({ displayName: 'User One', email: 'user1@test.com' });
  const user2 = await fixtureNewUser({ displayName: 'User Two', email: 'user2@test.com' });

  const user1Habit = await prisma.habit.create({
    data: { userId: user1.id, ...templateHabits.meditation },
  });

  const user2Habit = await prisma.habit.create({
    data: { userId: user2.id, ...templateHabits.exercise },
  });

  return { user1, user2, user1Habit, user2Habit };
}

/**
 * Fixture: User with habits at 3-day, 7-day, and 30-day milestones.
 * Useful for testing WebSocket milestone notifications.
 */
export async function fixtureUserWithMilestones(): Promise<{
  user: User;
  habit3Day: Habit;
  habit7Day: Habit;
  habit30Day: Habit;
}> {
  const user = await fixtureNewUser({ displayName: 'Milestone Tester' });

  const habit3Day = await prisma.habit.create({
    data: { userId: user.id, name: '3-Day Habit', startDate: todayInAppTz(), status: 'Active' },
  });
  await createCheckInSequence(habit3Day, 3, 'consecutive');

  const habit7Day = await prisma.habit.create({
    data: { userId: user.id, name: '7-Day Habit', startDate: todayInAppTz(), status: 'Active' },
  });
  await createCheckInSequence(habit7Day, 7, 'consecutive');

  const habit30Day = await prisma.habit.create({
    data: { userId: user.id, name: '30-Day Habit', startDate: todayInAppTz(), status: 'Active' },
  });
  await createCheckInSequence(habit30Day, 30, 'consecutive');

  return { user, habit3Day, habit7Day, habit30Day };
}
