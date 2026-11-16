# Playtest log

Fluider has an optional, local-only log for playtesting. It records what a player did in a room, so a facilitator can review the sequence afterwards. It is off by default and does nothing unless the player opts in.

## Enabling

Open the game with `?study=1`. A consent dialog appears. The player can:

- accept, which starts a recording under the study codes they entered (round and participant, letters, numbers, `.`, `_` or `-` only, up to 40 characters);
- decline, which leaves gameplay unchanged.

Declining or stopping never affects gameplay.

## What is recorded

With consent, the log records board actions, tool choices, hint offers and openings, pauses, room starts and ends, attempts, clears, urn and seed status changes, and elapsed times. Session metadata uses study codes and a coarse viewport bucket. Board coordinates are rounded to 0.1 board units. Pour paths, stir segments, cursor dwell and idle gaps are sampled rather than recorded frame by frame.

Event names and their fields are defined in `src/routes/game/telemetry.ts` (`EVENT_FIELDS`). Imports are validated against the same allowlist, and unknown events and fields are rejected.

## Where the data goes

- The log is held in memory for the lifetime of the page.
- Nothing is sent over the network.
- Nothing is written to browser storage, and nothing is kept after the page closes.
- The only way out is an explicit local export: the **Download log** or **Copy log** controls, or the one download that the player allows when they press **Finish study**.

A player can stop recording at any time with **Stop recording / withdraw**. Stopping ends capture immediately. Deleting the log is a separate, explicit action.

The in-memory buffer is capped at 20,000 summary events per session. Lifecycle and outcome events are kept in a reserved set of 2,000 critical slots. When the cap is reached, the log stops adding sampled events, shows a warning, and marks the affected analysis as incomplete. Gameplay continues.

## Limits

A log records a timeline of inputs and outcomes. It cannot show what the player intended or felt, and it cannot replay the screen exactly, because rounded paths and asynchronous GPU state are not reproducible. Pair it with observation or a questionnaire when you need intent.

`src/routes/game/telemetry.test.ts` covers consent, pairing of pour and clear events, the summary cap and critical reserve, import rejection, and withdrawal.
