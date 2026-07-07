const API_BASE = "/api";

export const API_ENDPOINTS = {
  HABITS: `${API_BASE}/habits`,
  HABIT_BY_ID: (id: string) => `${API_BASE}/habits/${id}`,
  HABIT_CHECKINS: (id: string) => `${API_BASE}/habits/${id}/checkins`,
  CHECKIN_HISTORY: (habitId: string) => `${API_BASE}/habits/${habitId}/check-in-history`,
  TODAY_CHECKINS: `${API_BASE}/today-check-ins`,
} as const;
