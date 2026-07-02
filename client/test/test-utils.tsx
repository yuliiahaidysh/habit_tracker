/**
 * Frontend Test Utilities
 *
 * Custom React Testing Library utilities that wrap render with providers
 * (Router, mock auth context, WebSocket, etc.) needed by our components.
 */

import React, { ReactElement } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

/**
 * Mock user for testing authenticated components.
 */
export interface MockUser {
  id: string;
  provider: 'google' | 'github' | 'test';
  displayName: string;
  email?: string | null;
}

/**
 * Mock WebSocket connection for testing real-time features.
 */
export class MockWebSocket {
  onopen: ((event: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;

  addEventListener(event: string, handler: EventListener) {
    if (event === 'open' && this.onopen) this.onopen(new Event('open'));
    if (event === 'message' && this.onmessage) handler(new MessageEvent('message', { data: '' }));
    if (event === 'error' && this.onerror) handler(new Event('error'));
    if (event === 'close' && this.onclose) handler(new CloseEvent('close'));
  }

  removeEventListener(_event: string, _handler: EventListener) {}

  send(data: string) {
    // Mock: just log what would be sent
    console.log('MockWebSocket.send:', data);
  }

  close() {
    // Mock: simulate close
  }

  simulateMessage(data: string) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data }));
    }
  }

  simulateOpen() {
    if (this.onopen) {
      this.onopen(new Event('open'));
    }
  }

  simulateError(error: string) {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

/**
 * Mock fetch for API calls in tests.
 */
export function mockFetch(response: Record<string, any>, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
}

/**
 * Render a component with required providers (Router, theme context, etc).
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialUser?: MockUser | null;
}

function Wrapper({ children }: { children: ReactElement }) {
  return <BrowserRouter>{children}</BrowserRouter>;
}

export function render(ui: ReactElement, options?: CustomRenderOptions) {
  return rtlRender(ui, { wrapper: Wrapper, ...options });
}

/**
 * Dummy habit for testing UI components.
 */
export const mockHabit = {
  id: 'habit-1',
  userId: 'user-1',
  name: 'Morning Meditation',
  description: 'Meditate for 10 minutes',
  startDate: '2026-07-02',
  status: 'Active' as const,
  createdAt: new Date('2026-07-01'),
  updatedAt: new Date('2026-07-02'),
};

/**
 * Dummy check-in for testing.
 */
export const mockCheckIn = {
  id: 'checkin-1',
  habitId: 'habit-1',
  userId: 'user-1',
  date: '2026-07-02',
  createdAt: new Date(),
};

/**
 * Dummy streaks data for testing.
 */
export const mockStreaks = {
  currentStreak: 5,
  bestStreak: 12,
  totalCheckIns: 47,
};

export * from '@testing-library/react';
