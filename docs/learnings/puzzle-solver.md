# Learnings: the puzzle solver and fluid engine

## A blind search's "no shortcut" holds only for actions its genome can generate

**Symptom:** For three rooms, a random search of 100 plus a MAP-Elites search of 200 reported 0 clears. One room had 1 clear in 4 when every control combination was enumerated by hand.

**Cause:** Coverage gaps in `src/routes/game/solver/genome.ts`:
1. `randomGenome` never emitted player gate toggles.
2. The first fix then toggled every gate in every candidate, so rooms with urn plugs drained themselves.
3. Sweep (stir) genes were generated only inside the spring loop, so rooms without springs never got stirring.

There was also a stop bug in `solver/evaluate.ts`: an idle pool counted toward the 120-frame settle window, ending runs before a delayed gate action fired.

**Fix:**
- Controls are sampled at 50% per genome, and mutation can add a control.
- Sweeps are generated independently of springs.
- Early stop requires 120 ticks after the last action.
- Each has a coverage test in `solver.test.ts`, such as `samples player gates independently in $id` and `generates and mutates sweeps without springs in %s`.

**Why this matters:** Before trusting a zero, count how many candidates contained the intended action combination. Classify every clear by the control state when the first urn fills, then run ablations (no stir, no vent) before calling anything a shortcut.

## A short simulation horizon can report a mechanic that does not hold

**Symptom:** A toy reported that a strong updraft kept all of the water aloft at tick 180. The same vent in a room accepted only a small fraction of the water into the urn, and the water fell after about 3 seconds.

**Cause:** The toy measured at one instant. A delay was misread as suspension.

**Fix:** Before a mechanic becomes a level premise, measure it for at least twice the time the level needs it. Read the steady state, not a snapshot.

**Why this matters:** Two planned rooms were dropped at tuning for this reason. A long-horizon check catches this before much time is spent on a room.

## Headless Chrome frame timestamps quantize near 16.7 ms

**Symptom:** A run with 0% dropped frames reported a p95 frame time of 16.8 ms and failed a literal ≤16.7 ms gate.

**Cause:** Headless synthetic-vsync timestamps step through about 16.6, 16.7 and 16.8 ms. Chrome logs `CVDisplayLinkCreateWithCGDisplay failed` because there is no real display link.

**Fix:** Gate on dropped-frame percentage (intervals above 1.5 × 16.67 ms) alongside p95, and allow one quantization step of tolerance.

**Why this matters:** A literal p95 gate can select the wrong solver configuration. It preferred a setting that lost about 13% of jet reach over one with near-baseline quality.
