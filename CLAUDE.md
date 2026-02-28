# Runbooks — CLAUDE.md

> Project-level instructions for AI-assisted development.
> Read by Claude Code on session start.
> This is a standalone project — NOT part of the SubNetree workspace.
> DevSpace-level conventions: `D:\DevSpace\CLAUDE.md` and `D:\DevSpace\.templates\`

## Project Identity

**Runbooks** is a Docker Desktop Extension that lets users create, organize, and execute saved Docker command scripts directly from the Docker Desktop UI.

- **Repo:** https://github.com/HerbHall/Runbooks
- **License:** MIT
- **Owner:** Herb Hall (HerbHall)
- **Status:** Feature-complete MVP (v0.1.0), untested in Docker Desktop
- **Workspace:** `D:\DevSpace\runbooks.code-workspace` (DevSpace root, per convention)

## Architecture

**Frontend-only Docker Desktop Extension.** No backend service.

```
Runbooks/
├── metadata.json          # Docker extension manifest
├── Dockerfile             # Multi-stage: build React UI, serve from Alpine
├── Makefile               # Build, install, validate, dev workflow targets
├── docker.svg             # Extension icon (blue document + play button)
├── ui/                    # React + TypeScript + Material UI frontend
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts     # Vite build config (base: ./, outDir: build)
│   ├── index.html         # Vite entry HTML (root of ui/, not public/)
│   └── src/
│       ├── index.tsx      # Entry point with DockerMuiThemeProvider
│       ├── App.tsx        # Main layout, version display, ddClient init
│       ├── types.ts       # Runbook type definition
│       ├── storage.ts     # localStorage CRUD + import/export
│       ├── docker-commands.ts  # Command validation rules + syntax data
│       ├── category-defaults.ts # Default category definitions
│       ├── vite-env.d.ts  # Vite type declarations
│       ├── context/
│       │   ├── RunbookContext.tsx   # Runbook state + CRUD operations
│       │   └── CategoryContext.tsx  # Category management state
│       └── components/
│           ├── RunbookList.tsx      # Main view: search, sort, group, layout
│           ├── RunbookCard.tsx      # Individual runbook card display
│           ├── RunbookFormDialog.tsx # Create/edit dialog with tag autocomplete
│           ├── RunbookDeleteDialog.tsx    # Delete confirmation
│           ├── RunbookExecutionDialog.tsx # Command execution + output
│           ├── CommandEditor.tsx    # Syntax-highlighted command input
│           ├── CategoryBadge.tsx    # Colored category chip
│           └── CategoryManagementDialog.tsx # Category CRUD
├── .coordination/         # Session handoff and status tracking
│   └── handoff.md
├── docs/
│   └── decisions/         # Architecture Decision Records (ADR)
│       ├── ADR-001-project-name.md
│       ├── ADR-002-license-and-monetization.md
│       ├── ADR-003-architecture-frontend-only.md
│       ├── ADR-004-scaffold-strategy.md
│       └── ADR-005-storage-backend.md
└── CLAUDE.md              # This file
```

## Key Technical Decisions

All decisions are recorded as ADRs in `docs/decisions/`. Summary:

1. **Name:** "Runbooks" — industry-standard term, available on GitHub (ADR-001)
2. **License:** MIT — maximally permissive, compatible with donations (ADR-002)
3. **Architecture:** Frontend-only — Extension SDK's `docker.cli.exec()` handles all Docker interaction, no Go backend needed (ADR-003)
4. **Scaffold:** Based on `docker extension init` output, hand-built to match DevSpace conventions (ADR-004)
5. **Storage:** localStorage — simple, no backend needed, supports import/export for portability (ADR-005)

## Extension SDK Patterns

The Docker Extension SDK client is initialized in `App.tsx`:

```typescript
import { createDockerDesktopClient } from "@docker/extension-api-client";
const ddClient = createDockerDesktopClient();

// Execute Docker CLI commands
const result = await ddClient.docker.cli.exec("ps", ["--format", "json"]);

// Show toast notifications
ddClient.desktopUI.toast.success("Runbook executed!");
ddClient.desktopUI.toast.error("Command failed");
```

## Development Workflow

```bash
# First time setup
cd ui && npm install

# Hot-reload development
make build-extension
make install-extension
make dev-ui          # Start local dev server on :3000
make dev-attach      # Point extension at local dev server

# Build and test
make build-extension
make validate-extension

# Reset
make dev-reset
make remove-extension
```

## What's Next

Extension needs Docker Desktop integration testing — build, install, and verify all features work in the actual extension environment.

## Conventions

- Follow DevSpace patterns: ADRs for decisions, `.coordination/` for session state
- Material UI components to match Docker Desktop's native look
- TypeScript strict mode enabled
- No Go backend unless a future requirement demands it (document in ADR first)
