# Runbooks

**Saved command scripts for Docker Desktop.**

A Docker Desktop Extension that lets you create, organize, and execute Docker command scripts with one click. Think of it as a personal runbook library built right into Docker Desktop.

## Features (Planned)

- Create and save Docker command scripts
- Organize with tags and categories
- One-click execution from Docker Desktop
- View command output inline
- Import/export runbooks

## Installation

> **Status:** In development. Not yet published to Docker Hub.

```bash
# Build locally
make build-extension

# Install into Docker Desktop
make install-extension
```

## Development

```bash
# Install UI dependencies
cd ui && npm install

# Start hot-reload dev server
npm start

# In another terminal — build and attach
cd ..
make build-extension
make install-extension
make dev-attach
```

## Architecture

Frontend-only Docker Desktop Extension built with React, TypeScript, and Material UI. Uses the Docker Extension SDK's `docker.cli.exec()` to run commands directly — no backend service required.

See `docs/decisions/` for Architecture Decision Records documenting all technical choices.

## License

[MIT](LICENSE)

## Author

**Herb Hall** — [GitHub](https://github.com/HerbHall) · [herbhall.net](https://herbhall.net)
