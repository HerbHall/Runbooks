# ADR-004: Scaffold Strategy — Hand-Built from Init Template

**Date:** 2026-02-16
**Status:** Accepted
**Deciders:** Herb Hall, Claude (AI assistant)

## Context

Docker recommends `docker extension init` as the starting point for new extensions. This interactive CLI tool generates a complete scaffold with React frontend, optional Go backend, Dockerfile, Makefile, and metadata.json.

However, we were working in a Claude.ai web session without Windows shell access, and we wanted the scaffold to match DevSpace project conventions (CLAUDE.md, .coordination/, docs/decisions/).

## Options Considered

1. **Run `docker extension init` then reorganize** — Docker's recommended path
2. **Hand-build from init template output** — Create equivalent files directly, already organized
3. **Copy from Docker SDK samples repo** — Use an existing sample as base

## Decision

**Hand-build from init template.** We studied the `docker extension init` output structure and Docker's extension SDK documentation, then created equivalent files directly with:
- Same React + TypeScript + Material UI stack
- Same Dockerfile multi-stage pattern
- Same Makefile targets
- DevSpace conventions (CLAUDE.md, ADRs, .coordination/) included from the start
- Backend sections intentionally omitted per ADR-003

## Consequences

- Scaffold is ready immediately without needing interactive prompts
- Structure matches DevSpace conventions from day one
- Package versions chosen from Docker SDK samples may need verification at `npm install` time
- `@docker/docker-mui-theme` version is a known risk — verify against current SDK samples

## Verification Needed

After `npm install`, confirm these Docker-specific packages resolve correctly:
- `@docker/extension-api-client`
- `@docker/docker-mui-theme`

If they fail, check: https://github.com/docker/extensions-sdk/tree/main/samples
