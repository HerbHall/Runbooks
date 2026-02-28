# Runbooks

**Saved command scripts for Docker Desktop.**

A Docker Desktop Extension that lets you create, organize, and execute Docker command scripts with one click. Think of it as a personal runbook library built right into Docker Desktop.

## Screenshots

### Grid View

![Grid view with sample runbooks](docs/screenshots/grid-view.png)

### Expanded Cards

![Expanded cards showing command details](docs/screenshots/expanded-cards.png)

### Search and Filter

![Search filtering runbooks](docs/screenshots/search-filter.png)

## Features

- Create, edit, and delete Docker command scripts
- Organize with tags and nested category grouping
- One-click execution with inline output display
- Search, sort, and filter runbooks
- Grid and list layout modes with compact density option
- Collapsible cards with expand/collapse all
- Tag autocomplete with chip input
- Command validation with syntax highlighting
- Import/export runbooks (JSON and legacy format)
- Category management with color-coded badges
- Version display in footer

## Installation

> **Status:** v0.1.0 — builds locally. Not yet published to Docker Hub.

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
npm run dev

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
