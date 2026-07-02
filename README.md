# Habit Tracker with Streaks

A full-stack web application for tracking habits and maintaining streaks. Built with Node.js + Express (backend), React 18 (frontend), SQLite + Prisma (database), and WebSocket for real-time milestone notifications.

## Stack Choices

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React 18 + Vite + TypeScript
- **Database:** SQLite with Prisma ORM
- **UI Library:** Tailwind CSS
- **Authentication:** OAuth 2.0 (Google + GitHub via Passport.js)
- **Real-time:** WebSocket (ws library)
- **Testing:** Vitest (backend) + Vitest (frontend)

## Timezone Handling

Streak calculations use **UTC-based date strings** (`YYYY-MM-DD` format) for consistency across time zones. The application computes "today" once at connection time and uses it for all streak logic within that session. This ensures:
- A user in Tokyo and a user in New York both see the same date boundary (UTC midnight)
- Streaks are deterministic and testable
- No daylight saving time issues

## Habit Deletion Strategy

**Cascade delete:** When a habit is deleted, all associated check-ins are automatically removed from the database. This keeps the data model clean and avoids orphaned records.

## How to Run

### Backend

```bash
cd server
npm install
npm run dev
```

The backend runs on `http://localhost:3000` by default.

### Frontend

```bash
cd client
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default (Vite dev server).

### Run Tests

```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

All tests use mocked OAuth providers (no real Google/GitHub network calls).

## API Overview

### Authentication

- `GET /auth/google` — Initiates Google OAuth flow
- `GET /auth/github` — Initiates GitHub OAuth flow
- `GET /auth/logout` — Logs out the user and destroys the session
- `GET /api/me` — Returns the current user or 401 if unauthenticated

### Habits

- `POST /api/habits` — Create a new habit
- `GET /api/habits` — List all habits for the logged-in user
- `GET /api/habits/:id` — Fetch a single habit (owner verification)
- `PATCH /api/habits/:id` — Update habit fields (owner verification)
- `DELETE /api/habits/:id` — Delete a habit and cascade-delete its check-ins (owner verification)

### Check-ins

- `POST /api/habits/:id/check-ins` — Create a check-in for today (Active habits only, one per day)
- `GET /api/habits/:id/check-ins` — Fetch check-in history for a habit
- `DELETE /api/habits/:id/check-ins/:date` — Remove a check-in (today only, owner verification)

## WebSocket — Real-time Milestone Notifications

### Connection

The WebSocket server is attached to the same HTTP port as the backend. Authentication is inherited from the Express session cookie (same as HTTP endpoints). On a successful connection, the server automatically evaluates milestones and sends any newly unlocked notifications.

**Base URL:** `ws://localhost:3000` (or `wss://` for production)

### Client → Server Message Format

After connecting, the client **must** send a `subscribe` message to activate milestone listening. This also confirms that the client is ready to receive notifications.

```json
{
  "type": "subscribe"
}
```

The server acknowledges with:

```json
{
  "type": "subscribed"
}
```

After receiving a milestone notification, the client may optionally acknowledge it:

```json
{
  "type": "ack",
  "milestone": 3
}
```

### Server → Client Message Format

When a milestone is reached, the server sends:

```json
{
  "type": "milestone",
  "habitId": "habit_uuid",
  "habitName": "Morning Run",
  "milestone": 7
}
```

## Milestone Rules & Streaks

### Milestone Thresholds

Milestones are unlocked when the **current streak** reaches 3, 7, or 30 consecutive days:

- **3-day milestone:** Triggered when current streak ≥ 3
- **7-day milestone:** Triggered when current streak ≥ 7
- **30-day milestone:** Triggered when current streak ≥ 30

### Current Streak Calculation

The **current streak** is the number of consecutive calendar days ending at today (or yesterday if today hasn't been checked in yet, giving a grace period for ongoing days).

**Algorithm:**
1. If today has a check-in, start the streak at today
2. Else if yesterday has a check-in, start at yesterday (grace period)
3. Else current streak is 0
4. Walk backward from the anchor point, counting consecutive days until a gap is found

**Example:**
- Check-ins: `[2026-06-28, 2026-06-29, 2026-06-30, 2026-07-01]`
- Today: `2026-07-02`
- Current streak: 4 (anchored at 2026-07-01, grace period allows ongoing day)

### Milestone Persistence

Once a milestone is sent to a client, it is **never re-sent for that habit**, even if the client reconnects. Milestone delivery state is persisted in the database (`MilestoneNotification` table) to ensure:

- A reconnecting user doesn't see duplicate notifications
- Milestones are treated as one-time events per habit
- The notification reflects the first time the threshold was reached

### Streak Reset

Any missed day breaks the streak. For example:
- Check-ins: `[2026-06-28, 2026-06-29, 2026-06-30]` (best: 3, current: 3)
- Today: `2026-07-02` (no check-in on 2026-07-01)
- Current streak resets to 0 (gap on 2026-07-01)

## OAuth Credential Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the **Google+ API**
4. Create **OAuth 2.0 Credentials** (type: Web application)
5. Set authorized redirect URIs:
   - `http://localhost:3000/auth/google/callback` (development)
   - Your production URL (for deployed apps)
6. Copy the Client ID and Client Secret
7. Add to `.env` (backend):
   ```
   GOOGLE_CLIENT_ID=your_client_id
   GOOGLE_CLIENT_SECRET=your_client_secret
   ```

### GitHub OAuth

1. Go to [GitHub Settings → Developer settings → OAuth Apps](https://github.com/settings/developers)
2. Create a **New OAuth App**
3. Set:
   - Application name: "Habit Tracker"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/auth/github/callback`
4. Copy the Client ID and Client Secret
5. Add to `.env` (backend):
   ```
   GITHUB_CLIENT_ID=your_client_id
   GITHUB_CLIENT_SECRET=your_client_secret
   ```

## Environment Variables (Required)

Create a `.env` file in the server directory with the following variables:

### OAuth Credentials (Required)

Both Google and GitHub OAuth credentials are **required** to run the application:

- **`GOOGLE_CLIENT_ID`** — Google OAuth 2.0 Client ID from Google Cloud Console
- **`GOOGLE_CLIENT_SECRET`** — Google OAuth 2.0 Client Secret from Google Cloud Console
- **`GITHUB_CLIENT_ID`** — GitHub OAuth App Client ID from GitHub Settings
- **`GITHUB_CLIENT_SECRET`** — GitHub OAuth App Client Secret from GitHub Settings

### Session Management (Required)

- **`SESSION_SECRET`** — A secure random string used to sign session cookies (generate with `openssl rand -base64 32` or similar)

### Server Configuration (Optional)

- **`PORT`** — Server port (default: `3000`)
- **`NODE_ENV`** — Environment mode (default: `development`)
- **`DATABASE_URL`** — SQLite database path (default: `file:./db.sqlite`)

### Example `.env` File

```
# OAuth Credentials (obtain from setup instructions below)
GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSP-1234567890abcdef
GITHUB_CLIENT_ID=Iv1.1234567890abcdef
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678

# Session Security
SESSION_SECRET=base64-random-string-here

# Server (optional, uncomment to customize)
# PORT=3000
# NODE_ENV=development
# DATABASE_URL=file:./db.sqlite
```

## Identity Model

User identity is determined by `(provider, provider_user_id)`, not email. This means:
- A user can sign in with Google or GitHub (both required in this app)
- The same person using both Google and GitHub creates two separate accounts unless linking is explicitly built
- Email is stored but nullable (GitHub may not return an email)
- Fields persisted: `provider`, `provider_user_id`, `email` (nullable), `display_name`, `avatar_url` (optional)

## Authorization

All data access is per-user. A logged-in user can only:
- Create, read, update, and delete their own habits
- Create, read, and delete their own check-ins
- Receive milestone notifications for their habits

Cross-user access is rejected at every endpoint and WebSocket operation.

## Acceptance Checklist

See `TASKS.md` for the full requirements. Key validation points:

- [ ] Local backend runs with `npm run dev`
- [ ] Local frontend runs with `npm run dev`
- [ ] Tests pass locally: `npm test` (backend and frontend)
- [ ] User can sign in with Google and GitHub
- [ ] User can create, edit, delete habits
- [ ] User can check in and undo for today only
- [ ] Streaks (current, best, total) display correctly
- [ ] WebSocket delivers 3, 7, 30-day milestones in real-time
- [ ] Same milestone not repeated on reconnect
- [ ] No cross-user data access

---

**Phase Status:** Phase 5 (WebSocket & Milestones) complete. Next: Phase 6 (Backend Authorization & Security verification).
