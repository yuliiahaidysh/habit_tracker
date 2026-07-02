# Testing Setup & Mocking — Phase 11 Documentation

This document describes the testing infrastructure for the Habit Tracker MVP.

## Overview

**Goal:** Enable comprehensive automated testing without real OAuth network calls.

**Key principles:**
- All tests run in isolation with a clean test database
- OAuth providers are mocked to prevent network calls
- Tests verify behavior, not infrastructure (Google/GitHub APIs)
- Reusable fixtures reduce boilerplate and ensure consistent test data

---

## Backend Testing (Vitest)

### 11.1: Backend Test Framework

**Framework:** Vitest (TypeScript-native test runner)  
**Database:** SQLite test database (`test.db`)  
**HTTP Testing:** supertest (cookie-aware agent for session testing)

**Configuration:** `server/vitest.config.ts`

```typescript
test: {
  environment: 'node',
  globalSetup: './test/global-setup.ts', // Provision test DB
  fileParallelism: false,                  // Serial for SQLite safety
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'file:./test.db',
    SESSION_SECRET: 'test-secret',
    AUTH_TEST_MODE: '1',                   // Enable test-login endpoint
    APP_TZ: 'UTC',
    CLIENT_URL: 'http://localhost:5173',
    SERVER_URL: 'http://localhost:4000',
  },
}
```

**Run tests:**
```bash
cd server
npm test                  # Run once
npm run test:watch       # Watch mode
```

### 11.2: Backend Test Infrastructure

**Files:**
- `test/global-setup.ts` — Provisions clean test DB before suite runs
- `test/helpers.ts` — Shared utilities (resetDb, loginAs agent factory)
- `test/mocks.ts` — OAuth mock interfaces and profile factories
- `test/fixtures.ts` — Reusable test data builders

**Test database lifecycle:**
1. Global setup runs: deletes old test.db, runs `prisma db push`
2. Each test file calls `resetDb()` before each test
3. Wipes all users (cascades to habits, check-ins, milestones)
4. Test runs with clean state
5. (Cleanup automatic, no manual teardown needed)

---

## 11.3 & 11.4: OAuth Mock Interfaces

### Why Mocking?

**Real OAuth in tests is problematic:**
- Network I/O makes tests slow and flaky
- Requires valid credentials (security risk)
- Rate limits and quota constraints
- Tests become dependent on provider availability

**Solution:** Mock the OAuth profile response layer, not the entire auth flow.

### Test-Only Login Endpoint

**Endpoint:** `POST /auth/test-login` (only in test mode, never production)

**Enabled when:** `AUTH_TEST_MODE=1` in environment

**Request body:**
```json
{
  "provider": "google",
  "providerUserId": "g-alice-12345",
  "displayName": "Alice",
  "email": "alice@gmail.com",
  "avatarUrl": "https://example.com/alice.jpg"
}
```

**Response:** Same as real OAuth callback — sets session and returns user record

**Usage in tests:**
```typescript
// Helpers abstract away the HTTP call
const { agent, user } = await loginAs({
  provider: 'google',
  providerUserId: 'g-alice-12345',
  displayName: 'Alice',
  email: 'alice@gmail.com',
});

// agent now has session cookie; subsequent requests authenticated
const habits = await agent.get('/api/habits');
```

### Mock Provider Profiles

**File:** `server/test/mocks.ts`

Defines the contract for test login payloads:

```typescript
interface MockGoogleProfile {
  provider: 'google';
  providerUserId: string;
  email?: string;        // Google usually provides
  displayName?: string;
  avatarUrl?: string;
}

interface MockGitHubProfile {
  provider: 'github';
  providerUserId: string;
  email?: string | null; // GitHub email may be null (user privacy)
  displayName?: string;
  avatarUrl?: string;
}
```

**Factory functions** in `createMockProfiles`:
- `googleWithEmail()` — Typical Google user (has email)
- `githubWithEmail()` — Typical GitHub user (has email)
- `githubNoEmail()` — Edge case: GitHub user with private email
- `minimal()` — Only required fields

**Example:**
```typescript
import { createMockProfiles } from './mocks.js';

const googleUser = createMockProfiles.googleWithEmail({
  displayName: 'Custom Alice',
});
// Result: {
//   provider: 'google',
//   providerUserId: 'g-<random>',
//   email: 'user@gmail.com',
//   displayName: 'Custom Alice',
// }
```

### What Tests Cover

✓ Mock does not call real OAuth servers  
✓ Session persists across requests  
✓ User record is created on first login  
✓ Repeat login reuses existing user  
✓ GitHub email=null is handled correctly  
✓ displayName and email are persisted correctly

---

## 11.5: Test Fixtures

**File:** `server/test/fixtures.ts`

Fixtures provide pre-built, reusable test data to reduce boilerplate.

### Template Data

**Dummy users:** Ready-made OAuth profiles
```typescript
dummyUsers.googleUser1
dummyUsers.githubUserNoEmail
// etc.
```

**Template habits:** Active, Paused, Archived states
```typescript
templateHabits.meditation    // Active
templateHabits.paused        // Paused
templateHabits.archived      // Archived
```

### Fixture Builders

#### `fixtureNewUser()`
Fresh user account, no habits or check-ins.
```typescript
const user = await fixtureNewUser({ displayName: 'Alice' });
// Result: User record persisted in DB
```

#### `fixtureUserWithStreak(daysOfStreak: number)`
User + active habit with N consecutive check-ins (for streak testing).
```typescript
const { user, habit, checkIns } = await fixtureUserWithStreak(7);
// Result: 7-day streak ending today
```

#### `fixtureUserWithMixedHabits()`
User with Active, Paused, and Archived habits (for search/filter testing).
```typescript
const { user, activeHabits, pausedHabits, archivedHabits } = 
  await fixtureUserWithMixedHabits();
```

#### `fixtureMultiUserScenario()`
Two users with their own habits (for cross-user authorization testing).
```typescript
const { user1, user2, user1Habit, user2Habit } = 
  await fixtureMultiUserScenario();
// Test that user1 cannot access user2Habit
```

#### `fixtureUserWithMilestones()`
User with habits at 3-day, 7-day, and 30-day streaks (for WebSocket testing).
```typescript
const { user, habit3Day, habit7Day, habit30Day } = 
  await fixtureUserWithMilestones();
```

#### `createCheckInSequence(habit, daysBack, pattern)`
Helper to build pre-dated check-in sequences without waiting.
```typescript
const checkIns = await createCheckInSequence(habit, 5, 'consecutive');
// Creates check-ins for today and 4 days back
```

### Example: Full Fixture Usage

```typescript
import { beforeEach, describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { loginAs, resetDb } from './helpers.js';
import { fixtureUserWithStreak } from './fixtures.js';

beforeEach(resetDb);

describe('streaks', () => {
  it('calculates a 7-day current streak correctly', async () => {
    const { user, habit } = await fixtureUserWithStreak(7);
    const { agent } = await loginAs({ providerUserId: user.providerUserId });

    const res = await agent.get(`/api/habits/${habit.id}`);
    expect(res.status).toBe(200);
    expect(res.body.currentStreak).toBe(7);
    expect(res.body.bestStreak).toBe(7);
  });
});
```

---

## Frontend Testing (Vitest + React Testing Library)

### 11.2: Frontend Test Framework

**Framework:** Vitest + React Testing Library  
**Environment:** jsdom (browser-like environment)

**Configuration:** `client/vitest.config.ts`

```typescript
test: {
  environment: 'jsdom',
  globals: true,
  setupFiles: ['./test/setup.ts'],  // Global mocks and cleanup
}
```

**Run tests:**
```bash
cd client
npm test              # Run once
npm run test:watch   # Watch mode
```

### Frontend Test Setup

**File:** `client/test/setup.ts`

Sets up global mocks and cleanup:
- After each test: `cleanup()` removes React components
- `window.matchMedia` mocked for responsive tests
- `WebSocket` mocked for real-time feature tests

**File:** `client/test/test-utils.tsx`

Custom render function that wraps components with required providers:
- `BrowserRouter` (required for routing)
- Mock user context (when needed)

**Usage:**
```typescript
import { render, screen } from '../test/test-utils.js';
import { HabitList } from '../src/components/HabitList.js';

describe('HabitList', () => {
  it('displays habits', () => {
    render(<HabitList />);
    expect(screen.getByText('Morning Meditation')).toBeInTheDocument();
  });
});
```

### Mock WebSocket

Frontend tests mock WebSocket for real-time milestone notifications:

```typescript
// In test/setup.ts
global.WebSocket = vi.fn(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  send: vi.fn(),
  close: vi.fn(),
})) as any;
```

**Usage in tests:**
```typescript
it('displays milestone notification when received', () => {
  const mockSocket = new WebSocket('ws://localhost:4000');
  mockSocket.addEventListener('message', (event) => {
    // Test real-time behavior
  });
});
```

---

## Test Coverage Checklist (Phase 11 Complete)

✓ **11.1** Backend test framework configured (Vitest)  
✓ **11.2** Frontend test framework configured (Vitest + React Testing Library)  
✓ **11.3** Google OAuth mocked via test-login endpoint  
✓ **11.4** GitHub OAuth mocked via test-login endpoint  
✓ **11.5** Test fixtures for users, habits, check-ins, streaks, milestones  

---

## Next Steps: Phase 12

Phase 12 (Test Cases) will use this infrastructure to write actual test cases:
- SSO login (Google, GitHub)
- Habit CRUD operations
- Check-in and streak calculations
- Cross-user authorization
- WebSocket milestones

All test cases will:
- Use fixtures to set up data
- Use `loginAs()` helper to authenticate
- Avoid real OAuth and network calls
- Run locally in seconds
