# Runbooks -- Copilot Instructions

Docker Desktop extension for saving, organizing, and running command scripts directly from the Docker Desktop UI.

## Tech Stack

- **Runtime**: React 18, TypeScript 5, Vite 7
- **UI**: MUI v5 (via @docker/docker-mui-theme), @emotion/react, @emotion/styled
- **Extension SDK**: @docker/extension-api-client
- **Editor**: react-simple-code-editor
- **Testing**: Vitest 4, Testing Library (React, jest-dom, user-event)
- **Linting**: ESLint 9, typescript-eslint, eslint-plugin-react-hooks
- **Container**: Docker (multi-arch linux/amd64 + linux/arm64)

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

## Code Style

- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- Co-author tag: `Co-Authored-By: GitHub Copilot <noreply@github.com>`
- Strict TypeScript -- no `any`, use `unknown` with type guards
- Functional React components with explicit props interfaces
- All lint checks must pass before committing (ESLint 9)

## Coding Guidelines

- Fix errors immediately -- never classify them as pre-existing
- Build, test, and lint must pass before any commit
- Never skip hooks (`--no-verify`) or force-push main
- Validate only at system boundaries (user input, extension SDK responses)
- Remove unused code completely; no backwards-compatibility hacks

## Available Resources

```bash
cd ui && npm run build        # Compile the project
cd ui && npm test             # Run all tests
cd ui && npm run lint         # Run ESLint
cd ui && npm run typecheck    # TypeScript type checking
docker build -t runbooks .    # Build Docker extension image
```

## Do NOT

- Use `any` in TypeScript or suppress TypeScript errors with `as unknown`
- Commit generated files without regenerating them first
- Add dependencies without updating the lock file (`npm install`)
- Store secrets, tokens, or credentials in code or config files
- Mark work as complete when known errors remain
- Use MUI v6 patterns (this project is pinned to MUI v5 via @docker/docker-mui-theme)
