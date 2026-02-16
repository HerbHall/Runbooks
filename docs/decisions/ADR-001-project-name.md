# ADR-001: Project Name — "Runbooks"

**Date:** 2026-02-16
**Status:** Accepted
**Deciders:** Herb Hall, Claude (AI assistant)

## Context

Needed a name for a Docker Desktop Extension that stores and executes saved Docker command scripts. The name had to be available on GitHub and clearly communicate the tool's purpose.

## Options Considered

1. **Runbooks** — Industry-standard term for saved operational procedures
2. **Docker Runbooks** — More specific but potentially implies Docker Inc. affiliation
3. **CommandDeck** — Creative but doesn't leverage existing terminology
4. **ScriptRunner** — Generic, conflicts with many existing projects

## Decision

**Runbooks.** The term is well-understood in DevOps/SRE communities as "a set of standardized procedures for routine operations." It accurately describes the extension's purpose without being overly clever. The GitHub namespace `HerbHall/Runbooks` was available.

## Consequences

- Immediately communicable purpose to Docker/DevOps users
- Short, memorable, easy to type
- No trademark concerns with a generic industry term
