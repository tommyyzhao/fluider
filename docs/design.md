# Design

Fluider is a puzzle game where the water and air are simulated, not scripted. This document records the principles the rooms follow and the engine behaviour they depend on. It contains no room solutions.

## Principles

1. **The fluid's consequence is the discovery; execution is never the test.** Once a plan is known, it must still work across a stated input envelope. Rooms are checked against small perturbations of timing and pointer position, so a correct plan is not defeated by a few milliseconds of input jitter.
2. **The fluid must change the solution.** Removing the air or replacing the liquid with a scripted transfer should break the intended solution. If it does not, the room is not using the simulation.
3. **Show every invariant; never let the picture lie.** Levels, counts, gate and vent states, and air direction are visible. Colour alone never carries state.
4. **Each room breaks one everyday wrong belief,** ideally through a cheap diagnostic action that reveals a second property of something the player already knows. A greedy approach should visibly stall.
5. **Cheap recovery, separate mastery, a way out.** Restart is deterministic and free. Hints relax one constraint at a time. Dewdrops record quality without gating progress. Leaving a room for another is allowed.

Kill rules adopted during design: no tilt or precision courses, no lethal systemic surprises, no exact dye-hue or concentration goals, no requirement for rapid repeated stirring, no single compulsory late room that blocks the story, and no colour-only state.

## Engine behaviour the rooms rely on

- **Air owns falling water; gravity owns still water.** A vent's draft bends a falling stream and can hold a pour aloft while it runs. It does not move a settled pool. Water that is still has to be set moving again (by a gate, an overflow or a jet) before air can steer it.
- **Updrafts are shelves, not levitation points.** A strong updraft holds water for as long as it runs. Measure any updraft mechanic over at least twice the time a room needs it. Short measurements mistake delay for suspension.
- **Head sets reach.** A fuller tank throws a jet farther, and the throw shortens as the tank drains. Draining tanks sweep through a wide range of landing points, so catch zones must be generous.
- **Connected vessels share a level,** not an amount. Overflow order sets a clock: the lower lip spills first.
- **Wax is a limited resource.** It can only be laid on dry air, and lifting a stroke refunds its cells.

## Fixed-lag delivery and determinism

The model runs at 60 ticks per second, and sensor readback lags the model by a fixed two ticks (`READBACK_LAG` in `types.ts`). Given the same level and the same action sequence, replays are intended to be bit-identical on one device. Cross-device determinism is not claimed.

Frame cost is dominated by the liquid's pressure solve. Changing solver iterations or substeps changes replay hashes, so it needs its own change and its own determinism check.

## Solver acceptance

Rooms are tuned with the seeded solver before release. The acceptance criteria for a room are:

1. The canonical solution clears with all three dewdrops on the fixed engine seeds.
2. The solution survives perturbation at each stated magnitude in at least 9 of 10 runs.
3. Naive plans fail: idling, dumping at a fixed time, single-verb plans, random inputs and greedy filling.
4. The air-off run of the solution fails, except in rooms that explicitly allow it.
5. A blind search (random plus MAP-Elites) finds no clear outside the intended route, or any such clear is inspected and either fixed or accepted as an alternative.

The solver code lives in `src/routes/game/solver/`. Its unit tests are in `solver.test.ts`.
