# Contributing to Runbooks

Thanks for your interest in contributing! This guide covers everything you need to get started.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) 4.x or later
- [Node.js](https://nodejs.org/) 22 or later (npm is bundled)
- Git

## Development Setup

```bash
# Clone and install
git clone https://github.com/HerbHall/Runbooks.git
cd Runbooks/ui
npm install

# Start hot-reload dev server
npm run dev

# In another terminal — build, install, and attach to dev server
cd Runbooks
make build-extension
make install-extension
make dev-attach
```

See the [Makefile](Makefile) for all available targets (`make build-extension`, `make validate-extension`, `make dev-reset`, etc.).

## Making Changes

### Find or Create an Issue

Every change should be tied to a GitHub issue. Check [existing issues](https://github.com/HerbHall/Runbooks/issues) first, or open a new one using the issue templates.

### Branch Naming

Create a branch from `main` using this convention:

- `feature/issue-NNN-short-desc` — new features
- `fix/issue-NNN-short-desc` — bug fixes
- `chore/issue-NNN-short-desc` — maintenance tasks
- `docs/issue-NNN-short-desc` — documentation changes

### Commit Messages

This project uses [conventional commits](https://www.conventionalcommits.org/):

- `feat:` new features
- `fix:` bug fixes
- `refactor:` code restructuring (no behavior change)
- `docs:` documentation only
- `test:` adding or updating tests
- `chore:` maintenance, dependencies, CI

### Code Style

- TypeScript strict mode is enforced
- ESLint is configured — run `npm run lint` before submitting
- 2-space indentation (enforced by EditorConfig)
- Material UI components to match Docker Desktop's theme
- No Go backend — all Docker interaction uses the Extension SDK's `docker.cli.exec()`

### Before Submitting

From the `ui/` directory, verify your changes pass all checks:

```bash
npm run lint       # ESLint
npm run typecheck  # TypeScript strict checking
npm run build      # Full build
```

## Pull Request Process

1. Fork the repo and create your branch from `main`
2. Make your changes and verify checks pass (see above)
3. Push your branch and open a PR against `main`
4. Fill out the PR template — link the related issue
5. CI must pass before merge
6. PRs are squash-merged to keep a clean history

## Architecture Overview

Runbooks is a **frontend-only** Docker Desktop Extension. There is no backend service.

- `ui/src/components/` — React components
- `ui/src/context/` — React context providers (RunbookContext, CategoryContext)
- `ui/src/storage.ts` — localStorage CRUD and import/export
- `ui/src/docker-commands.ts` — Command validation rules and syntax data
- `ui/src/types.ts` — TypeScript type definitions

All Docker interaction goes through the Extension SDK client initialized in `App.tsx`. See `docs/decisions/` for Architecture Decision Records.

## Reporting Issues

Use the [issue templates](https://github.com/HerbHall/Runbooks/issues/new/choose) for bug reports, feature requests, or general feedback.

For security vulnerabilities, see [SECURITY.md](SECURITY.md).
