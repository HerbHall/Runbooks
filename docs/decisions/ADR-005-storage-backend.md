# ADR-005: Storage Backend — localStorage with Export/Import

**Date:** 2026-02-16
**Status:** Accepted
**Deciders:** Herb Hall, Claude (AI assistant)

## Context

Runbooks needs persistent storage for user-created command scripts. ADR-003 established a frontend-only architecture (no backend VM service). We need to choose a storage mechanism that works within this constraint.

## Options Considered

### 1. Browser localStorage

- **How:** `window.localStorage.setItem("runbooks", JSON.stringify(data))`
- **Pros:** Zero infrastructure, instant read/write, works today
- **Cons:** Data lost on extension reinstall/update; ~5-10MB limit (plenty for runbooks); no cross-device sync

### 2. Docker volume via CLI exec

- **How:** Spawn Alpine containers to read/write a JSON file on a Docker volume using `ddClient.docker.cli.exec()`
- **Pros:** Persists across extension reinstalls; uses standard Docker primitives
- **Cons:** Spawns a container for every read/write (slow, ~1-2s per operation); fragile; visible in container logs

### 3. Add a backend service (revise ADR-003)

- **How:** Add a Go/Node HTTP server in `docker-compose.yaml` with a persistent volume; frontend calls REST API
- **Pros:** Most robust; standard pattern used by all official samples that persist data
- **Cons:** Contradicts ADR-003; adds build complexity (multi-arch binary); heavier image

### 4. Host binaries

- **How:** Bundle platform-specific scripts that write to `~/.runbooks/`; invoke via `ddClient.extension.host`
- **Pros:** Persists on host filesystem; fast I/O
- **Cons:** Must maintain Windows/macOS/Linux scripts; adds host binary packaging to Dockerfile

## Decision

**localStorage for MVP**, with export/import to mitigate data loss risk.

Rationale:

1. **Runbook data is small** — A user with 50 runbooks produces maybe 20KB of JSON. Well within localStorage limits.
2. **Speed to working CRUD** — No infrastructure changes needed. Wire up React state + localStorage today.
3. **Export/Import covers the gap** — Users can export runbooks as a JSON file and re-import after an extension update. This is explicit and transparent.
4. **Backend can come later** — If the extension grows to need sync, sharing, or large-scale storage, ADR-003 can be revisited. localStorage is easy to migrate from.

## Implementation Plan

```typescript
// Storage key
const STORAGE_KEY = "runbooks-data";

// Save
localStorage.setItem(STORAGE_KEY, JSON.stringify(runbooks));

// Load
const data = localStorage.getItem(STORAGE_KEY);
const runbooks = data ? JSON.parse(data) : [];

// Export (download as file)
const blob = new Blob([JSON.stringify(runbooks, null, 2)], { type: "application/json" });

// Import (file upload + parse)
const reader = new FileReader();
reader.onload = (e) => setRunbooks(JSON.parse(e.target.result));
```

## Trade-offs

**Accepted risks:**

- Data lost on extension reinstall without prior export (mitigated by export/import UX)
- No cross-device sync (acceptable for a local tool)
- localStorage is per-extension-context in Docker Desktop (no collision with other extensions)

**Upgrade path:**

- If a backend is added later, migrate by reading localStorage on first launch, posting to backend API, then clearing localStorage. One-time migration, no data loss.

## Consequences

- ADR-003 (frontend-only) remains valid
- Must implement export/import early to prevent user frustration
- Storage abstraction layer recommended so swapping backends later is easy
