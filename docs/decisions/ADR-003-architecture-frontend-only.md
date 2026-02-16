# ADR-003: Architecture — Frontend-Only (No Go Backend)

**Date:** 2026-02-16
**Status:** Accepted
**Deciders:** Herb Hall, Claude (AI assistant)

## Context

Docker Desktop Extensions support three execution contexts:
1. **Frontend (UI)** — React app running in Docker Desktop's embedded browser
2. **Backend (VM service)** — Go/Node binary running inside Docker Desktop's VM
3. **Host binaries** — Executables running directly on the host OS

The `docker extension init` scaffold generates all three by default. We needed to decide which Runbooks actually requires.

## Decision

**Frontend-only.** The Docker Extension SDK provides `ddClient.docker.cli.exec()` which lets the React frontend execute any Docker CLI command directly. Since Runbooks' core function is:

1. Store command scripts (CRUD on a data structure)
2. Execute them via Docker CLI
3. Display results

...all of this can be handled by the frontend using the Extension SDK. No backend process is needed.

## Trade-offs

**Advantages:**
- Simpler build (no Go compilation, no multi-arch binary concerns)
- Faster iteration (hot-reload with `react-scripts start`)
- Smaller extension image (no backend binary)
- Easier for contributors to understand

**Risks:**
- If we later need filesystem access beyond what the Extension SDK provides, we'd need to add a backend. This would require a new ADR and Dockerfile changes.
- Extension SDK's `docker.cli.exec()` runs commands as the Docker Desktop user — this is fine for Docker commands but limits general system access.

## Consequences

- `metadata.json` has empty `vm` and `host` sections
- Dockerfile only builds the React UI, no backend binary stage
- Storage must use a mechanism accessible from the frontend (Extension SDK volume, localStorage, or Docker volume)
