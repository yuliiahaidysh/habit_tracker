# Habit Tracker with Streaks — Tasks & Milestones Checklist

**Project Status:** Pre-implementation  
**Last Updated:** 2026-07-02

---

## Phase 1: Setup & Stack Decision
- [x] **1.1** — Choose backend language/framework (Node.js + Express + TypeScript)
- [x] **1.2** — Choose frontend framework (React 18 + Vite + TypeScript)
- [x] **1.3** — Choose database system (SQLite with Prisma ORM)
- [x] **1.4** — Choose UI library (Tailwind CSS)
- [x] **1.5** — Initialize git repository
- [ ] **1.6** — Document stack choices in README
- [ ] **1.7** — Document local run commands in README
- [ ] **1.8** — Document test commands in README
- [x] **1.9** — Decide timezone approach for streak calculation (YYYY-MM-DD strings, UTC internally)
- [x] **1.10** — Decide deletion strategy (cascade vs. block) for habits (Cascade delete check-ins)

---

## Phase 2: Backend — Database & Auth Setup
- [x] **2.1** — Set up backend project structure
- [x] **2.2** — Create database schema: users table (provider, provider_user_id, email, display_name, avatar_url)
- [x] **2.3** — Create database schema: habits table (name, description, start_date, status, user_id)
- [x] **2.4** — Create database schema: check_ins table (habit_id, date, user_id, unique constraint on habit_id + date)
- [x] **2.5** — Create database schema: milestone_tracking table (habit_id, milestone_days, sent_flag)
- [x] **2.6** — Implement Google OAuth integration (credential setup docs in README)
- [x] **2.7** — Implement GitHub OAuth integration (credential setup docs in README)
- [x] **2.8** — Implement OAuth callback handler (create local user on first sign-in)
- [x] **2.9** — Implement session/auth persistence mechanism
- [x] **2.10** — Implement logout endpoint

---

## Phase 3: Backend — Core Habits API
- [x] **3.1** — Implement `POST /habits` (create habit, owner verification)
- [x] **3.2** — Implement `GET /habits` (list user's habits only)
- [x] **3.3** — Implement `GET /habits/:id` (fetch single habit, owner verification)
- [x] **3.4** — Implement `PATCH /habits/:id` (edit habit fields, owner verification)
- [x] **3.5** — Implement `DELETE /habits/:id` (apply deletion strategy, owner verification)
- [x] **3.6** — Implement habit status transitions (Active ↔ Paused, Active/Paused → Archived)
- [x] **3.7** — Enforce "Paused and Archived habits reject new check-ins"
- [x] **3.8** — Enforce "Archived habits are read-only"

---

## Phase 4: Backend — Check-ins & Streaks API
- [x] **4.1** — Implement `POST /habits/:id/check-ins` (create check-in for today only)
- [x] **4.2** — Enforce "one check-in per habit per date" (unique constraint)
- [x] **4.3** — Enforce "no future-date check-ins"
- [x] **4.4** — Enforce "only Active habits accept check-ins"
- [x] **4.5** — Implement `DELETE /habits/:id/check-ins/:date` (undo today's check-in, owner verification)
- [x] **4.6** — Implement `GET /habits/:id/check-ins` (fetch check-in history)
- [x] **4.7** — Implement streak calculation: current streak (consecutive days ending today)
- [x] **4.8** — Implement streak calculation: best streak (historical max, never decreases)
- [x] **4.9** — Implement streak calculation: total check-ins (count)
- [x] **4.10** — Ensure streak recalculates correctly when today's check-in is removed
- [x] **4.11** — Ensure "today" determination is timezone-consistent (document approach)

---

## Phase 5: Backend — WebSocket & Milestones
- [x] **5.1** — Set up WebSocket server
- [x] **5.2** — Implement WebSocket connection handler (user auth verification)
- [x] **5.3** — Implement milestone detection: 3-day milestone
- [x] **5.4** — Implement milestone detection: 7-day milestone
- [x] **5.5** — Implement milestone detection: 30-day milestone
- [x] **5.6** — Implement milestone evaluation on socket connection open
- [x] **5.7** — Persist milestone-sent state
- [x] **5.8** — Implement server → client milestone notification push
- [x] **5.9** — Implement client → server message handling (subscribe/ack pattern)
- [x] **5.10** — Document WebSocket message format in README
- [x] **5.11** — Document milestone rules in README

**Status:** Phase 5 complete. Milestone detection uses `computeStreaks()` from HTTP API. Server handles subscribe/ack messages and persists milestone state to prevent duplicates. README documents WebSocket protocol, milestone rules, streak calculation, and OAuth setup. Next: Phase 6 (Backend Authorization & Security).

---

## Phase 6: Backend — Authorization & Security
- [x] **6.1** — Verify owner on all habit read/write operations
- [x] **6.2** — Verify owner on all check-in read/write operations
- [x] **6.3** — Verify user ownership on WebSocket connection
- [x] **6.4** — Verify user ownership on milestone delivery
- [x] **6.5** — Implement input validation (dates, habit fields, status values)
- [x] **6.6** — Implement error responses with clear messages
- [x] **6.7** — Document OAuth environment variables in README
- [x] **6.8** — Verify backend rejects cross-user data access (test requirement)

**Status:** Phase 6 complete. All authorization checks, input validation, and error handling implemented and tested. Cross-user data access properly rejected (404 for non-owned habits). Next: Phase 7 (Frontend).

---

## Phase 7: Frontend — Project Setup & Auth
- [x] **7.1** — Set up frontend project (framework, build tooling)
- [x] **7.2** — Set up UI library and styling
- [x] **7.3** — Implement authentication entry screen
- [x] **7.4** — Implement Google login button and flow
- [x] **7.5** — Implement GitHub login button and flow
- [x] **7.6** — Implement session persistence across page refresh
- [x] **7.7** — Implement logout functionality
- [x] **7.8** — Implement auth error handling and display

---

## Phase 8: Frontend — Main UI Screens
- [x] **8.1** — Build habit list screen (main dashboard)
- [x] **8.2** — Display habit name and description
- [x] **8.3** — Display current streak per habit
- [x] **8.4** — Display best streak per habit
- [x] **8.5** — Display total check-ins per habit
- [x] **8.6** — Display today's check-in status (checked/unchecked)
- [x] **8.7** — Implement check-in button for today (active habits only)
- [x] **8.8** — Implement undo check-in button for today
- [x] **8.9** — Build habit create form (modal/drawer/page acceptable)
- [x] **8.10** — Build habit edit form (modal/drawer/page acceptable)
- [x] **8.11** — Build habit details screen with monthly calendar view
- [x] **8.12** — Display check-in history on habit details screen

**Status:** Phase 8 complete. Dashboard displays all habits with streak stats and today's status. Users can create, edit, and delete habits. Check-in and undo buttons work for active habits. Details screen shows monthly calendar with check-in history and recent check-ins list. Next: Phase 9 (Search, filter, real-time features).

---

## Phase 9: Frontend — Search, Filter & Real-time
- [x] **9.1** — Implement search input (search by habit name and description)
- [x] **9.2** — Implement filter by status (Active, Paused, Archived)
- [x] **9.3** — Implement filter by check-in status (completed today / not completed)
- [x] **9.4** — Connect to WebSocket server
- [x] **9.5** — Implement milestone notification display (toast/banner/panel acceptable)
- [x] **9.6** — Display real-time milestone notifications when received
- [x] **9.7** — Send client → server WebSocket message (subscribe/ack)

---

## Phase 10: Frontend — UX & Styling
- [x] **10.1** — Apply light theme only (no dark mode)
- [x] **10.2** — Ensure consistent spacing and typography
- [x] **10.3** — Implement visible hover states on all interactive elements
- [x] **10.4** — Implement visible focus states on all interactive elements
- [x] **10.5** — Build empty state: "no habits"
- [x] **10.6** — Build empty state: "no search results"
- [x] **10.7** — Build empty state: "no check-ins yet"
- [x] **10.8** — Implement at least one visible loading state
- [x] **10.9** — Implement client-side form validation feedback
- [x] **10.10** — Implement responsive narrow-screen layout (mobile)
- [x] **10.11** — Implement error state display in UI

**Status:** Phase 10 complete. Skeleton loaders for habits, stats, and check-in history. Real-time form validation with character counters and disabled submit button when invalid. Responsive Tailwind breakpoints (sm:) for mobile screens. ErrorBanner component for network and auth errors. Next: Phase 11 (Testing setup).

---

## Phase 11: Testing — Setup & Mocking
- [x] **11.1** — Set up test framework (backend)
- [x] **11.2** — Set up test framework (frontend)
- [x] **11.3** — Mock Google OAuth provider (no real network calls)
- [x] **11.4** — Mock GitHub OAuth provider (no real network calls)
- [x] **11.5** — Create test fixtures for users, habits, check-ins

**Status:** Phase 11 complete. Backend uses Vitest with sqlite test DB and test-login endpoint for OAuth mocking (no real network calls). Frontend uses Vitest + React Testing Library with jsdom environment. Comprehensive mock interfaces for Google/GitHub OAuth profiles. Reusable fixtures for common test scenarios (new users, streaks, multi-user, milestones). Documentation in TESTING.md. Next: Phase 12 (Test Cases).

---

## Phase 12: Testing — Test Cases
- [x] **12.1** — Test SSO login success path (Google mock)
- [x] **12.2** — Test SSO login success path (GitHub mock)
- [x] **12.3** — Test local user record created on first successful sign-in
- [x] **12.4** — Test create habit
- [x] **12.5** — Test create check-in for today
- [x] **12.6** — Test duplicate check-in prevention (same habit/date)
- [x] **12.7** — Test cross-user authorization denial (user A cannot access user B's data)
- [x] **12.8** — Test WebSocket milestone notification at 3 days
- [x] **12.9** — Test WebSocket milestone notification at 7 days
- [x] **12.10** — Test WebSocket milestone notification at 30 days
- [x] **12.11** — Test milestone not repeated on reconnect
- [x] **12.12** — Test all tests pass locally without real network calls

**Status:** Phase 12 complete. 34 automated tests passing across auth, habits, check-ins, and milestones. Tests verify SSO (Google/GitHub), user creation, habit CRUD, check-in validation, duplicate prevention, cross-user isolation, and streak calculations at milestone thresholds. All tests run locally in ~3 seconds without real network calls using mock OAuth profiles. Next: Phase 13 (Documentation & Deliverables).

---

## Phase 13: Documentation & Deliverables
- [ ] **13.1** — README: "How to run backend" section
- [ ] **13.2** — README: "How to run frontend" section
- [ ] **13.3** — README: "How to run tests" section
- [ ] **13.4** — README: Short API description (endpoints, formats)
- [ ] **13.5** — README: Google OAuth credential setup instructions
- [ ] **13.6** — README: GitHub OAuth credential setup instructions
- [ ] **13.7** — README: WebSocket message format (client → server)
- [ ] **13.8** — README: Milestone notification rules (3, 7, 30 days)
- [ ] **13.9** — README: Streak calculation approach and formula
- [ ] **13.10** — README: Timezone handling (chosen approach and rationale)
- [ ] **13.11** — README: Habit deletion strategy (cascade vs. block) and rationale
- [ ] **13.12** — README: Environment variables required (Google OAuth, GitHub OAuth)
- [ ] **13.13** — (Optional) Create Dockerfile / docker-compose (or document why skipped)
- [ ] **13.14** — Verify all source code is committed to git

**Status:** Phase 13 pending. All implementation complete. Ready to document API, OAuth setup, and test commands for final delivery.

---

## Phase 14: Acceptance Testing & Validation
- [ ] **14.1** — ✓ User can sign in with Google
- [ ] **14.2** — ✓ User can sign in with GitHub
- [ ] **14.3** — ✓ Local user record created automatically on first SSO sign-in
- [ ] **14.4** — ✓ User can create a habit
- [ ] **14.5** — ✓ User can edit a habit
- [ ] **14.6** — ✓ User can delete a habit (respects chosen strategy)
- [ ] **14.7** — ✓ User can check in a habit for today
- [ ] **14.8** — ✓ User can undo a check-in for today
- [ ] **14.9** — ✓ App displays current streak correctly
- [ ] **14.10** — ✓ App displays best streak correctly
- [ ] **14.11** — ✓ App displays total check-ins correctly
- [ ] **14.12** — ✓ User can search habits by name and description
- [ ] **14.13** — ✓ User can filter habits by status (Active, Paused, Archived)
- [ ] **14.14** — ✓ User can filter by check-in status (completed today / not)
- [ ] **14.15** — ✓ Data is private per user (cannot access cross-account)
- [ ] **14.16** — ✓ WebSocket delivers 3-day milestone notification in real-time
- [ ] **14.17** — ✓ WebSocket delivers 7-day milestone notification in real-time
- [ ] **14.18** — ✓ WebSocket delivers 30-day milestone notification in real-time
- [ ] **14.19** — ✓ Same milestone not repeated on reconnect
- [ ] **14.20** — ✓ WebSocket includes meaningful client → server message
- [ ] **14.21** — ✓ App runs locally using README instructions
- [ ] **14.22** — ✓ All automated tests pass locally

---

## Legend

- `[ ]` — Open / Not started
- `[x]` — Completed
- `[~]` — In progress

Edit this file to mark tasks as you complete them. Organize by phase for better tracking.
