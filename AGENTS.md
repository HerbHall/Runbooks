<!--
  Scope: AGENTS.md guides the Copilot coding agent and Copilot Chat.
  For code completion and code review patterns, see .github/copilot-instructions.md
  and .github/instructions/*.instructions.md
  For Claude Code, see CLAUDE.md
-->

# Runbooks

Docker Desktop extension for saving, organizing, and running command scripts directly from the Docker Desktop UI.

## Tech Stack

- **Runtime**: React 18, TypeScript 5, Vite 7
- **UI**: MUI v5 (via @docker/docker-mui-theme), @emotion/react, @emotion/styled
- **Extension SDK**: @docker/extension-api-client
- **Editor**: react-simple-code-editor
- **Testing**: Vitest 4, Testing Library (React, jest-dom, user-event)
- **Linting**: ESLint 9, typescript-eslint, eslint-plugin-react-hooks
- **Container**: Docker (multi-arch linux/amd64 + linux/arm64)

## Build and Test Commands

```bash
# Build
cd ui && npm run build

# Test
cd ui && npm test

# Lint
cd ui && npm run lint

# Type check
cd ui && npm run typecheck

# Full verification (run before any PR)
cd ui && npm run typecheck && npm run lint && npm test && npm run build

# Docker build
docker build -t runbooks .
```

## Project Structure

```text
Runbooks/
├── ui/                  - Frontend source (React + TypeScript)
│   ├── src/             - Application source code
│   ├── build/           - Build output
│   ├── eslint.config.js - ESLint configuration
│   ├── vite.config.ts   - Vite build configuration
│   ├── vitest.config.ts - Vitest test configuration
│   └── package.json     - Dependencies and scripts
├── scripts/             - Build and utility scripts
├── docs/                - Documentation and screenshots
├── Dockerfile           - Multi-arch Docker Desktop extension image
├── docker.svg           - Extension icon
├── metadata.json        - Docker Desktop extension metadata
├── Makefile             - Build automation
├── VERSION              - Version source of truth
├── CLAUDE.md            - Claude Code instructions
└── .github/             - CI workflows and Copilot config
```

## Workflow Rules

### Always Do

- Create a feature branch for every change (`feature/issue-NNN-description`)
- Use conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Run build, test, and lint before opening a PR
- Write tests with descriptive names using Vitest and Testing Library
- Handle errors explicitly -- never silently swallow them
- Fix every error you find, regardless of who introduced it

### Ask First

- Adding new dependencies (check if existing packages cover the need)
- Architectural changes (new major components, routing changes)
- Changes to the Docker Desktop extension metadata or labels
- Changes to CI/CD workflows
- Removing or renaming exported functions or components

### Never Do

- Commit directly to `main` -- always use feature branches
- Skip tests or lint checks -- even for "small changes"
- Use `--no-verify` or `--force` flags
- Commit secrets, credentials, or API keys
- Add TODO comments without a linked issue number
- Mark work as complete when build, test, or lint failures remain

## Core Principles

These are unconditional -- no optimization or time pressure overrides them:

1. **Quality**: Once found, always fix, never leave. There is no "pre-existing" error.
2. **Verification**: Build, test, and lint must pass before any commit.
3. **Safety**: Never force-push `main`. Never skip hooks. Never commit secrets.
4. **Honesty**: Never mark work as complete when it is not.

## TypeScript and React Conventions

- Strict mode enabled -- no `any`; use `unknown` with type guards
- Functional components with explicit props interfaces
- MUI v5 patterns (via @docker/docker-mui-theme) -- use `InputProps` not `slotProps.input`
- Docker Desktop Extension SDK for container operations (`ddClient.docker.cli.exec`)
- Prefer `useState` for local UI state; no global state library needed for this extension

## Testing Conventions

```tsx
// Vitest + Testing Library pattern
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect } from 'vitest'

describe('ComponentName', () => {
    it('renders expected content', () => {
        render(<ComponentName label="test" />)
        expect(screen.getByText('test')).toBeInTheDocument()
    })

    it('calls handler on user interaction', async () => {
        const user = userEvent.setup()
        const handler = vi.fn()
        render(<ComponentName onAction={handler} />)
        await user.click(screen.getByRole('button'))
        expect(handler).toHaveBeenCalledOnce()
    })
})
```

## Commit Format

```text
feat: add runbook export functionality

Implements JSON export for individual runbooks. Includes download
trigger and file naming based on runbook title.

Closes #42
Co-Authored-By: GitHub Copilot <copilot@github.com>
```

Types: `feat` (new feature), `fix` (bug fix), `refactor` (no behavior change),
`docs` (documentation only), `test` (tests only), `chore` (build/tooling).
