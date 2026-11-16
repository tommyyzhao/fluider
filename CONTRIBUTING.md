# Contributing

Thanks for looking at Fluider. Small fixes, bug reports and room ideas are all welcome.

## Setup

Fluider uses [Bun](https://bun.sh) only. Do not use npm or yarn for development.

```sh
bun install
bun run dev        # http://localhost:5173
```

The package manager is pinned by `bun.lock`. CI installs with `--frozen-lockfile`, so commit lockfile changes with the code that needs them.

## Gates

Before opening a pull request, run:

```sh
bun run test       # node unit suite
bun run check      # svelte-check, expects 0 errors
bun run build      # static site in build/
```

CI runs the same three commands on every push and pull request.

Browser suites need a hardware-accelerated Chrome and run locally only:

```sh
VITEST_BROWSER=1 VITEST_CHROME_PATH="/path/to/Chrome" bun run test:browser
```

Run them when you change rendering, the liquid or air engines, or room content. Software WebGL does not reproduce the real-GPU timings these suites check.

## Solver and determinism tests

The room solver (`src/routes/game/solver/`) is seeded and headless in its unit tests. Changing the genome, fitness or evaluation code needs:

- the solver unit tests (`bun run test`), which check operator purity, budget use and resumable search;
- a determinism check, which requires hardware Chrome (`determinism.browser.test.ts`), when the sim cadence or the fixed-lag delivery changes.

Room changes must keep the existing room solutions valid. Solution tests live in the browser suite.

## Pull requests

- Keep one logical change per pull request.
- Add or update a test for any non-trivial logic. Trivial one-line changes need none.
- Describe what changed and why in the pull request. Include screenshots for visual changes.
- Do not commit generated output such as `build/`, `.svelte-kit/` or screenshots.
- Do not add runtime dependencies without discussion. Dev dependencies are fine when they serve tests or the build.

## Code style

- Tabs and Prettier formatting. Svelte 5 runes only.
- Comments explain why, not what.
- Engine-facing game rules belong in `src/routes/game/model.ts`. Presentation reads `RoomView` and `GameEvent` only.

## License

By contributing you agree that your contribution is released under the MIT License in `LICENSE`.
