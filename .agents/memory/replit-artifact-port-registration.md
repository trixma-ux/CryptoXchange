---
name: Replit artifact port registration
description: Artifacts created after initial project setup may not get their port registered in .replit [[ports]], causing workflow health checks to always fail.
---

## The Rule
When a new artifact is created (`createArtifact`) and its workflow shows `FAILED` with "didn't open port X" — even though Vite logs show it starting correctly — the root cause is almost always a missing `[[ports]]` entry in `.replit`.

**Why:** The Replit workflow health check routes through the proxy, not localhost. If the artifact's `localPort` isn't in `.replit`'s `[[ports]]` table, the proxy can't reach it, and the health check always fails even though Vite IS listening.

**How to apply:**
1. Check `.replit` for `[[ports]]` entries — if the artifact's `localPort` is missing, that's the bug.
2. Use `verifyAndReplaceDotReplit` (code_execution callback) to add `[[ports]] localPort = X / externalPort = Y`.
3. Pick an unused `externalPort` (3000–3003, 4200, etc.) that isn't already in `.replit`.
4. The artifact port itself must also be in Replit's supported list: 3000, 3001, 3002, 3003, 4200, 5000, 5173, 6000, 6800, 8000, 8008, 8080, 8099, 9000.
5. After updating `.replit`, restart the workflow — it will succeed.

**Note:** `verifyAndReplaceArtifactToml` does NOT automatically update `.replit`. They are separate files.
