# Fluider

A sleeping machine-garden. A little water, a little patience.

**[Play Fluider](https://fluider.sloprefinery.ai)**

An intimate liquid puzzle game in six rooms. Desktop or laptop, with WebGL2 and hardware acceleration.

Fluider is built on [svelte-fluid](https://github.com/tommyyzhao/svelte-fluid). The air is its Navier–Stokes `FluidEngine`, and the water is its PIC/FLIP `LiquidEngine`, both from `svelte-fluid/experimental`. The game was split out of svelte-fluid's former `/puzzles` route on 2026-11-01. svelte-fluid's git history holds the earlier engine work.

## How to play

Each room is a small machine-garden. Pour water from springs, guide it with gates, plugs and vents, and fill the urns and seeds to revive the room. Rooms are unlocked in order, and each one can be replayed.

Mouse or trackpad:

- Press and hold a spring to pour. Move while holding to keep pouring from that spring.
- Drag on empty board to stir the air. A short click puffs a mist that shows the air's direction.
- Click a gate or plug to toggle it. Click a vent to switch it or cycle its heading. Drag or click a gutter to change its angle.
- Right-click erases wax. In rooms with wax, key `4` selects the erase tool.
- Tools appear in the bottom bar when a room needs them: hand (`1`), wax quill (`2`) and trowel (`3`).

Keyboard:

- Arrow keys move the virtual cursor, and `Enter` acts at it (pour, stir, wax or dig, depending on the tool).
- `P` puffs mist at the virtual cursor.
- `Escape` or `Space` pauses and resumes.
- `R` twice restarts the room.

Hints are available from the seed-pod button, in up to three tiers. Restarting never loses progress. Dewdrops (up to three per room) record how well a room was solved. They never block progress.

Progress is saved in your browser, per hostname. After the last room, the game shows its finale.

## Run locally

Requires [Bun](https://bun.sh).

```sh
bun install
bun run dev        # http://localhost:5173
```

- `/`: the game. `?study=1` opens the optional playtest log (see [docs/playtest.md](docs/playtest.md)).
- `/check`: compatibility preflight, which reports whether the browser can run the engines.
- `/lab/solver`: solver lab for development.

## Develop

```sh
bun run test       # node unit suite (vitest)
bun run check      # svelte-check
bun run build      # static site in build/
```

Real-GPU browser suites (solutions, determinism, rooms) need hardware-accelerated Chrome and are not run in CI:

```sh
VITEST_BROWSER=1 VITEST_CHROME_PATH="/path/to/Chrome" bun run test:browser
```

Contributors should read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Docs

- [docs/design.md](docs/design.md): design principles and the engine behaviour the rooms rely on. Contains spoilers.
- [docs/playtest.md](docs/playtest.md): the optional study log, what it records and how it stays local.
- [docs/learnings/](docs/learnings/): gotchas with symptom, cause and fix, for the solver and for deploys.

## Deploy

The maintainers deploy Fluider to a Cloudflare Pages project with Wrangler. `wrangler.jsonc` sets the static output directory to `./build`.

```sh
VITE_STUDY_BUILD_HASH=$(git rev-parse HEAD) bun run build
bunx wrangler pages deploy build --project-name <project> --branch main
```

Forks can deploy the output of `bun run build` (the `build/` directory) to any static host. Fluider has no server-side code.

## License

Fluider is MIT licensed. See [LICENSE](LICENSE). Third-party attributions are in [NOTICE](NOTICE).
