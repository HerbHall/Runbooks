# ADR-002: License and Monetization — MIT with Donations

**Date:** 2026-02-16
**Status:** Accepted
**Deciders:** Herb Hall, Claude (AI assistant)

## Context

Herb wanted to open-source the extension while retaining the option to accept donations or sponsorships. Needed clarity on whether open-source licenses conflict with accepting money.

## Options Considered

1. **MIT** — Maximally permissive, widely understood
2. **Apache 2.0** — Permissive with patent grant
3. **BSL 1.1 / Apache 2.0 dual** — Used by SubNetree, but overly complex for this project
4. **No license (proprietary)** — Limits community adoption

## Decision

**MIT license.** Licenses govern what *recipients* can do with the code — they place zero restrictions on how the *author* funds development. MIT is the simplest permissive license and maximizes adoption potential.

Donation/sponsorship channels are fully compatible:
- GitHub Sponsors
- Ko-fi
- Buy Me a Coffee
- Open Collective
- Patreon

## Consequences

- Anyone can fork, modify, redistribute (with attribution)
- No barrier to Docker Marketplace listing
- Donations are a courtesy, not a requirement — aligns with Herb's goal of "if people want to throw money, let them"
- Simpler than SubNetree's dual-license approach, appropriate for this scope
