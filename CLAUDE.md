# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

This repo is **pre-implementation**. The only file is `requirements.md`, a full spec for a
"Habit Tracker with Streaks" full-stack web app. There is no code, no git repo, and no build
tooling yet. The stack (frontend framework, backend language, database, UI library) is
**deliberately left to the developer** — pick one before writing code and record the choice, plus
run/test commands, in a README and in this file.

`requirements.md` is the source of truth and the acceptance checklist. Read it in full before
starting; the rules below only re-state the parts that are easy to implement incorrectly.

## Non-obvious rules that shape the design

**Identity is `(provider, provider_user_id)`, not email.** Auth is SSO-only (Google + GitHub, both
required). GitHub may not return an email, so never key users on email. Google and GitHub logins for
the same person are separate accounts unless linking is explicitly built. Persist: provider,
provider_user_id, email (nullable), display_name, avatar_url (optional). A local user record is
created on first successful sign-in. Auth must survive page refresh, and logout is required.

**Streaks are strict consecutive calendar days.** Current streak = consecutive days ending today;
any missed day resets it. Best streak = maximum consecutive days currently achievable from the
check-in history (recalculated dynamically, not a persisted high-water mark). Removing a check-in
recalculates both current and best streaks. Pausing does not preserve a streak — a gap breaks it.
Because "today" is date-sensitive, the timezone approach must be chosen deliberately and documented
in README.

**Check-in constraints.** One check-in per habit per date (enforce uniqueness). Today only — no
backfilling, no future dates. Only Active habits accept check-ins; Paused and Archived reject new
check-ins; Archived is fully read-only. Deleting a habit must either cascade-delete its check-ins or
be blocked until the habit is archived — pick one and document it in README.

**WebSocket milestones are once-per-habit-per-milestone, ever.** Milestones: 3, 7, 30 days. They are
evaluated when the socket connection *opens*, and a given milestone must never be re-sent for the
same habit on reconnect — so milestone-sent state must be **persisted**, not held in memory. If no
milestone is reached, send nothing. The client must also send at least one meaningful message
(e.g. subscribe / ack) that changes server behavior; document the message format in README.

**Authorization is per-user on everything.** Every habit and check-in operation, plus WebSocket
connection and milestone delivery, must verify ownership. No sharing of any kind exists. A user must
never be able to reach another user's data — this is an explicit acceptance-test requirement.

## Required tests (from the spec)

Automated tests must cover, without any real Google/GitHub network calls (mock/stub the provider):
SSO login success path; create-habit + create-today-check-in; duplicate check-in prevention;
cross-user authorization denial; and WebSocket milestone notifications at 3, 7, and 30 days.

## UI constraints

Light theme only. Must include clear empty states (no habits / no search results / no check-ins),
at least one loading state, client-side form validation feedback, visible hover/focus states, and
responsive narrow-screen layout. Real-time milestone notifications must be visibly surfaced (toast /
banner / panel).

## Deliverables checklist

Local run is mandatory. README must document: how to run backend + frontend, how to run tests, a
short API description, Google and GitHub OAuth credential setup, the WebSocket message format +
milestone rules, and the streak/timezone handling notes. Docker is optional; if skipped, note why in
README. See `requirements.md` §8 for the full acceptance checklist to validate against before
considering the work done.
