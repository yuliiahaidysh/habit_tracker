# Habit Tracker with Streaks

A full-stack web application for tracking habits and maintaining daily streaks with real-time milestone notifications. Built with Node.js + Express (backend), React 18 (frontend), SQLite + Prisma (database), and WebSocket for real-time communication.

**Status:** Phase 13 Complete. All features implemented and documented. Ready for Phase 14 acceptance testing.

---

## Table of Contents

1. [Stack Choices](#stack-choices)
2. [Quick Start](#quick-start)
3. [How to Run](#how-to-run)
4. [How to Run Tests](#how-to-run-tests)
5. [API Overview](#api-overview)
6. [WebSocket: Real-time Milestone Notifications](#websocket-real-time-milestone-notifications)
7. [Streak Calculation & Formula](#streak-calculation--formula)
8. [Timezone Handling](#timezone-handling)
9. [Habit Deletion Strategy](#habit-deletion-strategy)
10. [OAuth Credential Setup](#oauth-credential-setup)
11. [Environment Variables](#environment-variables)
12. [Acceptance Checklist](#acceptance-checklist)

---

## Stack Choices

| Component | Technology |
|-----------|------------|
| **Backend** | Node.js + Express + TypeScript |
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS |
| **Database** | SQLite with Prisma ORM |
| **Authentication** | OAuth 2.0 (Google + GitHub via Passport.js) |
| **Real-time** | WebSocket (ws library) |
| **Testing** | Vitest (backend + frontend) |
| **UI Styling** | Tailwind CSS |

---

## Quick Start

### Prerequisites

- **Node.js** >= 20 (check with `node --version`)
- **npm** (comes with Node.js)

### One-Command Setup (Both Backend & Frontend)

```bash
npm run dev
```

This command:
- Installs dependencies for both backend and frontend
- Starts the backend server on `http://localhost:4000`
- Starts the frontend dev server on `http://localhost:5173`

**Note:** You must set up OAuth credentials (Google and GitHub) before you can test SSO. See [OAuth Credential Setup](#oauth-credential-setup) for instructions.

---

## How to Run

### 13.1: How to Run Backend

**Terminal 1:**

```bash
cd server
npm install        # First time only
npm run dev        # Starts on http://localhost:4000
```

**What to expect:**
- Backend logs: `[server] listening on http://localhost:4000 (tz=UTC)`
- WebSocket server is attached to the same port
- Database file created at `server/dev.db` (SQLite)
- API is ready at `http://localhost:4000/api/...`

**Note:** If you need a clean database state:
```bash
# Remove the dev database (will be recreated on next run)
rm server/dev.db
npm run dev
```

---

### 13.2: How to Run Frontend

**Terminal 2:**

```bash
cd client
npm install        # First time only
npm run dev        # Starts on http://localhost:5173
```

**What to expect:**
- Frontend dev server starts with Vite's hot module reload (HMR)
- Log output: `Local: http://localhost:5173/`
- Press `o` in the terminal to auto-open the app in your browser
- The app will connect to the backend at `http://localhost:4000`

**Browser:**
- Open `http://localhost:5173` in your browser
- You should see the login screen with "Continue with Google" and "Continue with GitHub" buttons
- (Buttons are disabled until you set up OAuth credentials — see [OAuth Credential Setup](#oauth-credential-setup))

---

### Combined Dev Server

From the **root directory**, run both backend and frontend together:

```bash
npm run dev
```

This uses `concurrently` to run both services in one terminal. Both will log to stdout with prefixes (`[server]` and `[client]`).

---

## How to Run Tests

### 13.3: How to Run Tests

#### Backend Tests

```bash
cd server
npm test              # Run all tests once (34 tests, ~2.7 seconds)
npm run test:watch   # Watch mode: re-run tests on file changes
```

**Expected output:**
```
✓ auth.test.ts (13 tests)
✓ habits.test.ts (7 tests)
✓ checkins.test.ts (8 tests)
✓ websocket-milestones.test.ts (6 tests)

Test Files  4 passed (4)
     Tests  34 passed (34)
   Duration  2.76s
```

**What the tests cover (Phase 12 complete):**
- ✓ Google OAuth login (mocked, no real API calls)
- ✓ GitHub OAuth login (mocked, including GitHub privacy edge cases)
- ✓ Local user record creation on first sign-in
- ✓ Create habit and first check-in
- ✓ Duplicate check-in prevention (409 Conflict)
- ✓ Cross-user authorization denial (user cannot access another user's data)
- ✓ WebSocket 3-day milestone notification
- ✓ WebSocket 7-day milestone notification
- ✓ WebSocket 30-day milestone notification
- ✓ Milestone persistence (same milestone not re-sent on reconnect)

**Mocking strategy:** Tests use a test-only `/auth/test-login` endpoint (enabled when `AUTH_TEST_MODE=1`). No real Google or GitHub OAuth servers are contacted.

#### Frontend Tests

```bash
cd client
npm test              # Run all tests once
npm run test:watch   # Watch mode
```

**What the tests cover:**
- Component rendering and user interactions
- Form validation and error states
- Search and filter functionality
- Empty states
- Loading states

---

## API Overview

### 13.4: Complete API Description

Base URL: `http://localhost:4000` (development)

#### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/auth/google` | Initiates Google OAuth flow |
| `GET` | `/auth/github` | Initiates GitHub OAuth flow |
| `GET` | `/auth/logout` | Logs out the user (destroys session) |
| `GET` | `/api/me` | Returns current user or 401 if unauthenticated |

**Example: Get current user**
```bash
curl http://localhost:4000/api/me \
  -H "Cookie: connect.sid=<your_session_cookie>"
```

**Response (200):**
```json
{
  "id": "user_uuid",
  "provider": "google",
  "providerUserId": "g-12345...",
  "email": "user@gmail.com",
  "displayName": "Alice",
  "avatarUrl": "https://example.com/avatar.jpg",
  "createdAt": "2026-07-02T10:00:00Z"
}
```

---

#### Habits Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/habits` | Create a new habit |
| `GET` | `/api/habits` | List all habits for logged-in user |
| `GET` | `/api/habits/:id` | Fetch a single habit (owner verification) |
| `PATCH` | `/api/habits/:id` | Update habit fields |
| `DELETE` | `/api/habits/:id` | Delete a habit (cascade-deletes check-ins) |

**Create a habit (POST /api/habits)**

```bash
curl -X POST http://localhost:4000/api/habits \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=<session_cookie>" \
  -d '{
    "name": "Morning Run",
    "description": "30 minutes at 6am",
    "startDate": "2026-07-02"
  }'
```

**Request body:**
```json
{
  "name": "Morning Run",
  "description": "30 minutes at 6am",
  "startDate": "2026-07-02"
}
```

**Response (201):**
```json
{
  "id": "habit_uuid",
  "userId": "user_uuid",
  "name": "Morning Run",
  "description": "30 minutes at 6am",
  "startDate": "2026-07-02",
  "status": "ACTIVE",
  "currentStreak": 0,
  "bestStreak": 0,
  "totalCheckIns": 0,
  "createdAt": "2026-07-02T10:00:00Z",
  "updatedAt": "2026-07-02T10:00:00Z"
}
```

**Update a habit (PATCH /api/habits/:id)**

```bash
curl -X PATCH http://localhost:4000/api/habits/habit_uuid \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=<session_cookie>" \
  -d '{
    "name": "Evening Run",
    "status": "PAUSED"
  }'
```

**Request body (all fields optional):**
```json
{
  "name": "Evening Run",
  "description": "Updated description",
  "status": "PAUSED",
  "startDate": "2026-07-01"
}
```

**Response (200):** Updated habit object

**Delete a habit (DELETE /api/habits/:id)**

```bash
curl -X DELETE http://localhost:4000/api/habits/habit_uuid \
  -H "Cookie: connect.sid=<session_cookie>"
```

**Response (204):** No content (success)

---

#### Check-ins Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/habits/:habitId/check-ins` | Create a check-in for today |
| `GET` | `/api/habits/:habitId/check-ins` | Fetch check-in history for a habit |
| `DELETE` | `/api/habits/:habitId/check-ins/:date` | Remove a check-in (today only) |

**Create a check-in for today (POST /api/habits/:habitId/check-ins)**

```bash
curl -X POST http://localhost:4000/api/habits/habit_uuid/check-ins \
  -H "Content-Type: application/json" \
  -H "Cookie: connect.sid=<session_cookie>" \
  -d '{}'
```

**Request body:** `{}` (empty — the server uses the session's "today" date)

**Response (201):**
```json
{
  "id": "checkin_uuid",
  "habitId": "habit_uuid",
  "date": "2026-07-02",
  "createdAt": "2026-07-02T10:00:00Z"
}
```

**Error responses:**
- `404` — Habit not found or not owned by user
- `409` — Already checked in today: `{"error": "already_checked_in"}`
- `400` — Habit is not ACTIVE: `{"error": "not_active"}`

**Get check-in history (GET /api/habits/:habitId/check-ins)**

```bash
curl http://localhost:4000/api/habits/habit_uuid/check-ins \
  -H "Cookie: connect.sid=<session_cookie>"
```

**Response (200):**
```json
[
  { "id": "ci1", "habitId": "habit_uuid", "date": "2026-07-02" },
  { "id": "ci2", "habitId": "habit_uuid", "date": "2026-07-01" },
  { "id": "ci3", "habitId": "habit_uuid", "date": "2026-06-30" }
]
```

**Remove a check-in (DELETE /api/habits/:habitId/check-ins/:date)**

```bash
curl -X DELETE http://localhost:4000/api/habits/habit_uuid/check-ins/2026-07-02 \
  -H "Cookie: connect.sid=<session_cookie>"
```

**Response (204):** No content (success)

**Error responses:**
- `404` — Check-in not found or not owned by user
- `400` — Attempt to remove check-in for a date other than today

---

## WebSocket: Real-time Milestone Notifications

### 13.7: WebSocket Message Format

#### Overview

The WebSocket connection inherits authentication from the Express session cookie. Once connected, the server evaluates milestones and sends notifications for any newly unlocked thresholds. The client must send a `subscribe` message to activate milestone listening.

**Base URL:** `ws://localhost:4000` (or `wss://` for production)

**Endpoint:** `/` (default WebSocket path)

---

#### Client → Server Messages

**Message 1: Subscribe (required)**

After connecting, the client **must** send a `subscribe` message. This activates milestone listening and indicates the client is ready to receive notifications.

```json
{
  "type": "subscribe"
}
```

**Server response:**

```json
{
  "type": "subscribed"
}
```

Once subscribed, the server will immediately send any milestone notifications for habits that have reached 3, 7, or 30-day streaks (that haven't already been sent to this user).

**Message 2: Acknowledge (optional)**

After receiving a milestone notification, the client may optionally acknowledge it. This does not affect behavior but can be used for logging or UI confirmation.

```json
{
  "type": "ack",
  "milestone": 7
}
```

---

#### Server → Client Messages

**Milestone Notification**

When a habit reaches a milestone threshold (3, 7, or 30 days), the server sends:

```json
{
  "type": "milestone",
  "habitId": "habit_uuid",
  "habitName": "Morning Run",
  "milestone": 7
}
```

**Fields:**
- `type`: Always `"milestone"`
- `habitId`: UUID of the habit
- `habitName`: Human-readable habit name
- `milestone`: The threshold reached (3, 7, or 30)

**Example Timeline:**

1. Client connects and sends `{"type": "subscribe"}`
2. Server responds with `{"type": "subscribed"}`
3. Server evaluates user's habits and sends any new milestones:
   - `{"type": "milestone", "habitId": "h1", "habitName": "Exercise", "milestone": 3}`
   - `{"type": "milestone", "habitId": "h2", "habitName": "Reading", "milestone": 7}`
4. Client optionally acknowledges: `{"type": "ack", "milestone": 3}`
5. Server continues monitoring; when a new milestone is reached, sends another notification

---

### 13.8: Milestone Notification Rules

#### Threshold Rules

Milestones are unlocked when the **current streak** reaches the specified number of consecutive days:

- **3-day milestone:** Triggered when current streak ≥ 3
- **7-day milestone:** Triggered when current streak ≥ 7
- **30-day milestone:** Triggered when current streak ≥ 30

#### Evaluation Timing

Milestones are evaluated **when the WebSocket connection opens** (after client sends `subscribe`). They are not re-evaluated on every check-in; the client must reconnect to trigger re-evaluation.

#### Persistence Rules

Once a milestone is sent to a client, it is **never re-sent for that habit**, even if the client reconnects or closes/reopens the connection. 

**Why?** Milestones are intended as one-time celebration notifications, not status updates. Persistence is achieved via the `MilestoneNotification` database table:

```prisma
model MilestoneNotification {
  id        String  @id @default(cuid())
  habitId   String
  milestone Int     // 3 | 7 | 30
  createdAt DateTime @default(now())

  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)

  // Unique constraint: each habit can send each milestone at most once
  @@unique([habitId, milestone])
}
```

#### Example Scenarios

**Scenario 1: Habit reaches 3-day milestone**

```
Day 1 check-in: streak=1, no notification
Day 2 check-in: streak=2, no notification
Day 3 check-in: streak=3, notification sent, recorded in DB
(Client reconnects after a week)
WebSocket re-opens: milestone already in DB, no notification re-sent
```

**Scenario 2: Multiple habits at different milestones**

```
Habit A: 3-day milestone reached (sent once, persisted)
Habit B: 7-day milestone reached (sent once, persisted)
Habit C: 0-day streak (no milestone)

Client reconnects: only unrecorded milestones are sent.
If Habit A reaches 7-day next, it will be sent as a new milestone.
```

**Scenario 3: Habit deleted**

```
Habit deleted: its check-ins AND milestone records are cascade-deleted.
If the habit is recreated (new ID), it's a different habit with fresh milestone state.
```

---

## Streak Calculation & Formula

### 13.9: Streak Calculation Approach

#### Definition

A **streak** is a count of consecutive calendar days with check-ins, with no gaps.

- **Current streak:** The number of consecutive days ending at today (or yesterday, with grace period)
- **Best streak:** The historical maximum streak length for this habit (never decreases)
- **Total check-ins:** The count of all check-ins for the habit

#### Algorithm: Current Streak

The current streak is calculated by:

1. **Determine anchor date:**
   - If today has a check-in, anchor at today
   - Else if yesterday has a check-in, anchor at yesterday (grace period for ongoing days)
   - Else current streak = 0, stop

2. **Walk backward from anchor:**
   - Count consecutive days (each day must have a check-in)
   - Stop when a gap (missing day) is found
   - The count is the current streak

3. **Recalculate best streak:**
   - Find the maximum consecutive streak in all check-ins
   - Update best streak if current > best

#### Example

```
Habit: Morning Run
Check-ins: [2026-06-28, 2026-06-29, 2026-06-30, 2026-07-01]
Today: 2026-07-02
No check-in on 2026-07-02

Step 1: No check-in today, check yesterday (2026-07-01) → found
Step 2: Walk backward:
  - 2026-07-01 ✓ (day 1)
  - 2026-06-30 ✓ (day 2)
  - 2026-06-29 ✓ (day 3)
  - 2026-06-28 ✓ (day 4)
  - 2026-06-27 ✗ (gap, stop)
Step 3: Current streak = 4
Step 4: Best streak = 4 (max of all consecutive runs)
```

#### Grace Period

The **grace period** allows the streak to survive a missed day as long as you checked in yesterday. This accounts for people who check in before midnight, then see the calendar change to a new day without having checked in "today" yet.

Example:
```
Check-ins: [2026-06-29, 2026-06-30, 2026-07-01]
Today (system): 2026-07-02, no check-in

Without grace period: current streak = 1 (only 2026-07-01)
With grace period: current streak = 3 (ends at 2026-07-01, grace allows ongoing day 07-02)
```

#### Streak Reset

Any missed day breaks the streak immediately:

```
Check-ins: [2026-06-28, 2026-06-29, 2026-06-30]
Gap: 2026-07-01 (no check-in)
Today: 2026-07-02

Current streak: 0 (broken by gap on 2026-07-01)
Best streak: 3 (historical, never decreases)
```

#### Paused & Archived Habits

- **Paused habits:** Cannot receive new check-ins. If a paused habit has gaps, the streak resets permanently (no gap-preserving logic).
- **Archived habits:** Read-only. Streaks remain as-is, but no new check-ins allowed.

---

## Timezone Handling

### 13.10: Timezone Handling Approach and Rationale

#### Chosen Approach: UTC-Based Date Strings

All dates representing a calendar day (check-in dates, habit start dates) are stored as **`YYYY-MM-DD` strings in the app's configured timezone**.

**Configuration:**
```
APP_TZ=UTC  (in .env)
```

#### How It Works

1. **Server startup:** Reads `APP_TZ` from environment (default: `UTC`)
2. **"Today" computation:** Computed once per HTTP request/WebSocket connection using the configured timezone
3. **Date storage:** All dates stored as `YYYY-MM-DD` strings (e.g., `"2026-07-02"`)
4. **Streak calculation:** Uses string-based calendar math, never timezone offsets

#### Example: Multi-Timezone Consistency

```
User in Tokyo (UTC+9)  && User in New York (UTC-5)

Tokyo local time: 2026-07-03 at 11:59 PM → UTC: 2026-07-03 at 2:59 PM
New York local time: 2026-07-03 at 2:59 PM → UTC: 2026-07-03 at 6:59 PM

If APP_TZ=UTC:
  - Both users see today as 2026-07-03 (UTC date)
  - Both see the same date boundary at UTC midnight
  - Streaks are deterministic and comparable

If APP_TZ=America/New_York:
  - Tokyo user sees today as 2026-07-02 or 2026-07-03 depending on local time
  - New York user sees today correctly in their local zone
  - Computations are local-aware but data is stored as calendar dates
```

#### Why This Approach?

**Pros:**
- **Deterministic:** Same check-in date across time zones (if using UTC)
- **Simple:** No complex timezone offset arithmetic
- **Testable:** Dates are predictable and reproducible
- **Database-friendly:** No need to store timezone info with each date

**Cons:**
- **Inflexible:** All users share the same "day" boundary
- **Non-local:** Users may prefer their own timezone's date boundary

#### Changing the Timezone

To use a different timezone (e.g., America/New_York):

1. Edit `.env` in the server directory:
   ```
   APP_TZ=America/New_York
   ```
2. Restart the server
3. New check-ins will use the new timezone's date
4. **Important:** Existing check-in dates are NOT converted; they remain as stored. Only new operations use the new timezone.

#### Edge Cases

**Daylight Saving Time:**
- IANA timezone names (e.g., `America/New_York`) handle DST automatically
- The Node.js runtime handles DST transitions; you don't need to adjust anything

**Midnight Boundary:**
- If a user checks in at 11:59 PM, it counts for today
- At 12:00 AM, the server's "today" advances to tomorrow
- Check-in timestamps are stored as database `DateTime` (UTC ISO 8601)
- Check-in dates are stored as `YYYY-MM-DD` strings (app timezone)

---

## Habit Deletion Strategy

### 13.11: Habit Deletion Strategy and Rationale

#### Chosen Strategy: Cascade Delete

When a habit is deleted, all associated check-ins are **automatically removed** from the database. This is called a **cascade delete**.

#### How It Works

```prisma
model Habit {
  ...
  user       User @relation(fields: [userId], references: [id], onDelete: Cascade)
  checkIns   CheckIn[]
  milestones MilestoneNotification[]
}

model CheckIn {
  ...
  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)
}

model MilestoneNotification {
  ...
  habit Habit @relation(fields: [habitId], references: [id], onDelete: Cascade)
}
```

When a habit is deleted:
1. All `CheckIn` records for that habit are deleted
2. All `MilestoneNotification` records for that habit are deleted
3. The `Habit` record itself is deleted

#### Example Workflow

```
User has habit "Morning Run" with:
  - 5 check-ins (2026-06-28 through 2026-07-02)
  - 1 milestone notification (3-day, already sent)

User clicks "Delete Habit"
  → HTTP: DELETE /api/habits/habit_uuid

Backend:
  1. Verify ownership (user owns this habit)
  2. Delete all CheckIn records where habitId = habit_uuid
  3. Delete all MilestoneNotification records where habitId = habit_uuid
  4. Delete the Habit record itself

Result:
  - 5 check-ins removed
  - 1 milestone record removed
  - Habit removed
  - Database is clean (no orphaned records)
  - Habit ID cannot be reused (primary key is deleted)
```

#### Why Cascade Delete?

**Pros:**
- **Clean data:** No orphaned check-in records
- **Simple logic:** No need to block deletion based on data state
- **User-friendly:** "Delete" means delete; no data lingers

**Cons:**
- **Irreversible:** Deleting a habit permanently removes its history (no undo)
- **One-way:** Users cannot restore deleted habits

#### Alternative Approach (Not Implemented)

An alternative would be **soft delete** (mark as deleted but keep data):

```
Habit record: { id, name, status: "DELETED", ... }
Users would not see deleted habits in their list.
Check-ins would be orphaned (but preserved).
```

We chose cascade delete for simplicity and to keep the database clean.

#### Implications for Features

- **Search & Filter:** Deleted habits do not appear in results (their records are gone)
- **Stats:** Total habits count decreases after deletion
- **Streak history:** Lost (unless user archived the habit first, which preserves check-ins for future reference)

---

## OAuth Credential Setup

### 13.5: Google OAuth Setup Instructions

#### Step-by-Step

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account (create one if needed)

2. **Create a new project**
   - Click the project selector dropdown at the top
   - Click **"New Project"**
   - Name it (e.g., "Habit Tracker")
   - Click **"Create"**

3. **Enable Google+ API**
   - In the left sidebar, go to **APIs & Services → Library**
   - Search for **"Google+ API"**
   - Click it and then **"Enable"**

4. **Create OAuth 2.0 Credentials**
   - Go to **APIs & Services → Credentials**
   - Click **"+ Create Credentials"** → **"OAuth 2.0 Client ID"**
   - If prompted, set up the OAuth consent screen first:
     - Choose **User Type: External**
     - Fill in app name: "Habit Tracker"
     - Add your email as support contact
     - Skip scopes for now (required scopes: `email`, `profile`, `openid` — Passport handles these)
     - Add yourself as a test user
     - Complete the consent screen
   - After consent screen, return to create the Client ID
   - Choose **Application type: Web application**
   - Add **Authorized redirect URIs:**
     - `http://localhost:4000/auth/google/callback` (development)
     - Your production URL (if deployed)
   - Click **"Create"**

5. **Copy credentials**
   - You'll see a popup with **Client ID** and **Client Secret**
   - Copy both values

6. **Add to `.env`**
   - Open `server/.env` (or create it from `server/.env.example`)
   - Add:
     ```
     GOOGLE_CLIENT_ID=<your_client_id>
     GOOGLE_CLIENT_SECRET=<your_client_secret>
     ```
   - Save and restart the backend server

7. **Test the flow**
   - Navigate to `http://localhost:5173` in your browser
   - Click **"Continue with Google"**
   - You should be redirected to Google's login
   - After login, you should be redirected back to the app

---

### 13.6: GitHub OAuth Setup Instructions

#### Step-by-Step

1. **Go to GitHub Settings**
   - Visit: https://github.com/settings/developers
   - Or navigate: GitHub Profile → Settings → Developer settings → OAuth Apps

2. **Create a New OAuth App**
   - Click **"New OAuth App"**

3. **Fill in the form**
   - **Application name:** `Habit Tracker` (or your app name)
   - **Homepage URL:** `http://localhost:4000` (development) or your production URL
   - **Application description:** (optional) "A habit tracking app with streaks and milestones"
   - **Authorization callback URL:** `http://localhost:4000/auth/github/callback`

4. **Create Application**
   - Click **"Register application"**

5. **Copy credentials**
   - You'll see **Client ID** at the top
   - Click **"Generate a new client secret"** to create the secret
   - Copy both values (store the secret securely; GitHub won't show it again)

6. **Add to `.env`**
   - Open `server/.env`
   - Add:
     ```
     GITHUB_CLIENT_ID=<your_client_id>
     GITHUB_CLIENT_SECRET=<your_client_secret>
     ```
   - Save and restart the backend server

7. **Test the flow**
   - Navigate to `http://localhost:5173`
   - Click **"Continue with GitHub"**
   - You should be redirected to GitHub's login
   - After login and authorization, you should be redirected back to the app

---

#### OAuth Notes

- **Email privacy:** GitHub users can choose to hide their email. If hidden, the app will have `email: null` but still create a user record with `provider` and `providerUserId`.
- **Account linking:** The same person signing in with Google and GitHub creates **two separate accounts** (no linking). This is by design per the spec.
- **Test mode:** If you don't set up OAuth credentials, the OAuth buttons on the frontend will be disabled. For testing without setting up credentials, see the testing docs.

---

## Environment Variables

### 13.12: Required Environment Variables

Create a `.env` file in the `server/` directory with the following variables:

#### OAuth Credentials (Required for SSO)

Both Google and GitHub OAuth credentials are **required** to run the application with SSO. If either is missing, the corresponding button on the frontend will be disabled.

- **`GOOGLE_CLIENT_ID`** — Google OAuth 2.0 Client ID from [Google Cloud Console](https://console.cloud.google.com/)
- **`GOOGLE_CLIENT_SECRET`** — Google OAuth 2.0 Client Secret (keep secret, never commit to git)
- **`GITHUB_CLIENT_ID`** — GitHub OAuth App Client ID from [GitHub Developer Settings](https://github.com/settings/developers)
- **`GITHUB_CLIENT_SECRET`** — GitHub OAuth App Client Secret (keep secret, never commit to git)

#### Session Security (Required)

- **`SESSION_SECRET`** — A secure random string used to sign Express session cookies
  - Generate with: `openssl rand -base64 32`
  - Minimum 32 characters recommended
  - Change in production; never use a default value in production

#### Server Configuration (Optional)

- **`PORT`** — HTTP + WebSocket port (default: `4000`)
- **`NODE_ENV`** — Environment mode: `development` or `production` (default: `development`)
- **`DATABASE_URL`** — SQLite database path (default: `file:./dev.db`)

#### Client URL & Server URL (Optional, usually auto-detected)

- **`CLIENT_URL`** — Frontend URL for CORS (default: `http://localhost:5173`)
- **`SERVER_URL`** — Backend public URL for OAuth callback construction (default: `http://localhost:4000`)

#### Timezone (Optional)

- **`APP_TZ`** — IANA timezone for "today" computation (default: `UTC`)
  - Examples: `UTC`, `America/New_York`, `Europe/London`, `Asia/Tokyo`
  - See [Timezone Handling](#timezone-handling) for more info

#### Test Mode (Development Only)

- **`AUTH_TEST_MODE`** — Enables `/auth/test-login` endpoint for testing without real OAuth (default: `0`)
  - Set to `1` when running tests: `AUTH_TEST_MODE=1 npm test`
  - **Never enable in production**

---

#### Example `.env` File (Development)

```bash
# Server port and database
PORT=4000
NODE_ENV=development
DATABASE_URL="file:./dev.db"

# URLs (CORS, OAuth callbacks)
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:4000

# OAuth Credentials
# Get these from Google Cloud Console and GitHub Developer Settings
# See "OAuth Credential Setup" in this README
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSP-1234567890abcdef_secret_key

GITHUB_CLIENT_ID=Iv1.1234567890abcdef
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678

# Session cookie signing (generate with: openssl rand -base64 32)
SESSION_SECRET=your-long-random-session-secret-here-minimum-32-chars

# Timezone for "today" computation
APP_TZ=UTC

# Test mode (NEVER enable in production)
AUTH_TEST_MODE=0
```

---

#### Production Example

For production deployment:

```bash
PORT=3000
NODE_ENV=production
DATABASE_URL="file:./db.sqlite"

CLIENT_URL=https://habit-tracker.example.com
SERVER_URL=https://api.example.com

GOOGLE_CLIENT_ID=<your-prod-client-id>
GOOGLE_CLIENT_SECRET=<your-prod-client-secret>
GITHUB_CLIENT_ID=<your-prod-client-id>
GITHUB_CLIENT_SECRET=<your-prod-client-secret>

SESSION_SECRET=<generate-a-new-long-random-string>
APP_TZ=UTC

AUTH_TEST_MODE=0
```

---

## Identity Model

User identity is determined by the tuple `(provider, provider_user_id)`, not email. This means:

- A user can sign in with Google **or** GitHub
- The same person using both providers creates two **separate accounts** (no account linking is implemented)
- Email is stored but nullable (GitHub may not provide it)
- Fields persisted: `provider`, `provider_user_id`, `email` (nullable), `display_name`, `avatar_url` (optional)

---

## Authorization

All data access is per-user. A logged-in user can only:

- Create, read, update, and delete **their own habits**
- Create, read, and delete **their own check-ins**
- Receive **milestone notifications for their habits**

Cross-user access is rejected at every endpoint and WebSocket operation with a `404` response (resource not found or not owned).

---

## UI Features (Summary)

### Theme
- **Light theme only** (no dark mode)

### Login Screen
- "Continue with Google" button (enabled if `GOOGLE_CLIENT_ID` is set)
- "Continue with GitHub" button (enabled if `GITHUB_CLIENT_ID` is set)

### Main Dashboard
- List of habits with current streak, best streak, total check-ins
- Today check-in button (for Active habits only)
- Search box (by name and description)
- Filter controls (by status: Active, Paused, Archived)
- Empty states for: no habits, no search results
- Loading state while fetching data

### Create/Edit Habit
- Modal or form with fields: name, description, start date, status
- Client-side validation feedback
- Submit button to create/update

### Habit Details
- Check-in history for the current month
- Streak summary and stats
- Edit and delete buttons
- Hover/focus states on interactive elements

### Real-time Notifications
- WebSocket milestone notifications displayed as toast, banner, or notification panel
- Clear visual indication of milestone achieved

### Responsive Layout
- Compact layout for mobile/narrow screens
- List-to-cards layout acceptable
- All interactive elements touch-friendly on mobile

---

## Acceptance Checklist

Use this checklist to validate the app before considering Phase 14 acceptance testing complete:

### Authentication (14.1–14.3)
- [ ] User can sign in with Google (redirect to Google login, then back to app)
- [ ] User can sign in with GitHub (redirect to GitHub login, then back to app)
- [ ] Local user record created automatically on first sign-in

### Habit Management (14.4–14.6)
- [ ] User can create a habit with name, description, and status
- [ ] User can edit habit fields
- [ ] User can delete a habit (cascade-deletes check-ins)

### Check-ins & Streaks (14.7–14.11)
- [ ] User can check in a habit for today only
- [ ] User can undo (remove) a check-in for today only
- [ ] App displays current streak correctly (consecutive days ending today)
- [ ] App displays best streak correctly (historical max)
- [ ] App displays total check-ins count correctly

### Search & Filters (14.12–14.14)
- [ ] User can search habits by name and description
- [ ] User can filter habits by status (Active, Paused, Archived)
- [ ] User can filter by completion (completed today vs. not completed today)

### Multi-Tenant Security (14.15)
- [ ] User cannot see another user's habits
- [ ] User cannot check in to another user's habits
- [ ] User cannot edit another user's habits

### WebSocket & Milestones (14.16–14.20)
- [ ] WebSocket delivers 3-day milestone notification in real-time
- [ ] WebSocket delivers 7-day milestone notification in real-time
- [ ] WebSocket delivers 30-day milestone notification in real-time
- [ ] Same milestone not repeated on reconnect (persisted in database)
- [ ] WebSocket includes meaningful client → server message (`subscribe` message works)

### Local Deployment (14.21–14.22)
- [ ] App runs locally using `npm run dev` or individual backend/frontend commands
- [ ] All 34 automated tests pass: `cd server && npm test`
- [ ] No real OAuth network calls in tests (all mocked)

---

## Troubleshooting

### Backend won't start: "Database locked"
- Kill any existing backend process: `lsof -i :4000` then `kill -9 <PID>`
- Or restart your machine

### Frontend can't connect to backend
- Verify backend is running on `http://localhost:4000`
- Check `CLIENT_URL` and `SERVER_URL` in `server/.env`
- Browser console may show CORS errors; verify both servers are running

### OAuth buttons disabled
- Verify `.env` has `GOOGLE_CLIENT_ID` and `GITHUB_CLIENT_ID` set
- Restart the backend after updating `.env`
- Check frontend logs in browser console

### Tests fail: "ENOENT: no such file or directory, open 'test.db'"
- Run `npm install` first if you haven't already
- Test setup should auto-create the test database
- If issues persist, delete `server/test.db` and re-run: `npm test`

### Database stuck in transaction
- Delete `server/dev.db` to start fresh
- Restart backend: `npm run dev`

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│ Frontend (React 18 + Vite)                          │
│ - Auth pages (Google/GitHub SSO)                    │
│ - Habit dashboard (list, create, edit, delete)      │
│ - Check-in controls & streak display                │
│ - WebSocket real-time milestone notifications       │
│ Runs on: http://localhost:5173                      │
└──────────────────────────────┬──────────────────────┘
                                │ HTTP + WebSocket
                                ▼
┌─────────────────────────────────────────────────────┐
│ Backend (Node.js + Express + TypeScript)            │
│ - REST API (/api/habits, /api/checkins, etc.)       │
│ - OAuth 2.0 flow (Passport.js)                      │
│ - WebSocket server (ws library)                     │
│ - Authorization & multi-tenant isolation            │
│ Runs on: http://localhost:4000 + ws://localhost... │
└──────────────────────────────┬──────────────────────┘
                                │ SQL
                                ▼
┌─────────────────────────────────────────────────────┐
│ Database (SQLite + Prisma ORM)                      │
│ - Users table (OAuth identity)                      │
│ - Habits table (ACTIVE/PAUSED/ARCHIVED)             │
│ - CheckIns table (one per day per habit)            │
│ - MilestoneNotifications table (persistence)        │
│ File: server/dev.db                                 │
└─────────────────────────────────────────────────────┘
```

---

## Next Steps: Phase 14 Acceptance Testing

After Phase 13 (this documentation), proceed to Phase 14 to:

1. Manually validate all acceptance criteria (checklist above)
2. Verify the app runs locally with documented commands
3. Confirm all 34 tests pass
4. Test cross-user data isolation in the UI
5. Verify WebSocket milestone notifications appear in real-time
6. Confirm same milestone not repeated on reconnect

Once Phase 14 is complete, the MVP is production-ready for local deployment.

---

## Version Info

- **Phase:** 13 (Documentation & Deliverables) — Complete
- **Created:** 2026-07-02
- **Last Updated:** 2026-07-02
- **All Tasks:** 13.1–13.12 Complete
- **Docker:** Skipped (local test app, not required for MVP)
