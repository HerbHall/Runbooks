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
- **Status:** Scaffold complete, pre-`npm install`

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
│   ├── public/index.html
│   └── src/
│       ├── index.tsx      # Entry point with DockerMuiThemeProvider
│       ├── App.tsx        # Main layout, initializes ddClient
│       └── components/
│           └── RunbookList.tsx  # Card-based list with sample data
├── .coordination/         # Session handoff and status tracking
│   └── handoff.md         # ← START HERE for continuation context
├── docs/
│   └── decisions/         # Architecture Decision Records (ADR)
│       ├── ADR-001-project-name.md
│       ├── ADR-002-license-and-monetization.md
│       ├── ADR-003-architecture-frontend-only.md
│       └── ADR-004-scaffold-strategy.md
├── runbooks.code-workspace # VS Code workspace (standalone project)
└── CLAUDE.md              # This file
```

## Key Technical Decisions

All decisions are recorded as ADRs in `docs/decisions/`. Summary:

1. **Name:** "Runbooks" — industry-standard term, available on GitHub (ADR-001)
2. **License:** MIT — maximally permissive, compatible with donations (ADR-002)
3. **Architecture:** Frontend-only — Extension SDK's `docker.cli.exec()` handles all Docker interaction, no Go backend needed (ADR-003)
4. **Scaffold:** Based on `docker extension init` output, hand-built to match DevSpace conventions (ADR-004)

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

See `.coordination/handoff.md` for current status and next steps.

## Conventions

- Follow DevSpace patterns: ADRs for decisions, `.coordination/` for session state
- Material UI components to match Docker Desktop's native look
- TypeScript strict mode enabled
- No Go backend unless a future requirement demands it (document in ADR first)
