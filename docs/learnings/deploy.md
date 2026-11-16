# Learnings: deploying

## A Wrangler run can stop mid-upload, exit 0, and not deploy

**Symptom:** `bun …/node_modules/wrangler/bin/wrangler.js deploy` printed `Uploaded 4 of 10 assets` and exited with status 0. The deployment list still showed the previous version, and the live site kept serving the old bundle.

**Cause:** `bin/wrangler.js` is a Node launcher. It spawns `process.execPath` on `wrangler-dist/cli.js` with an IPC channel. Under Bun, `process.execPath` is Bun, and the child process can end before the upload finishes.

**Fix:** Run Wrangler through its `#!/usr/bin/env node` shebang: `bunx --no-install wrangler …` or `npx wrangler …`. The same Wrangler version then completed the deployment.

**Why this matters:** The truncated run prints no error, so it looks like a success. Confirm every deploy with `wrangler pages deployment list --project-name <project>`, or by fetching a changed asset from the live site.

## A new hostname can fail in a local browser while DNS lookups succeed

**Symptom:** Right after a CNAME was published, `dig` returned the record, but `curl` and the browser failed to resolve the hostname.

**Cause:** `dig` queries DNS servers directly. Browsers and `curl` use the operating system's resolver, which can cache a "no such domain" answer from lookups made before the record existed.

**Fix:** Verify with pinned resolution, for example `curl --resolve <host>:443:<ip> …`, or wait for the negative cache to expire.

**Why this matters:** A successful `dig` does not prove a browser can reach the site, and a failed local browser check does not prove the site is down.
