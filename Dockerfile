# Build the React UI
FROM --platform=$BUILDPLATFORM node:22-alpine AS ui-builder
ARG VERSION=0.2.1 # x-release-please-version
WORKDIR /app
COPY ui/package.json ui/package-lock.json* ./
RUN npm ci
COPY ui/ ./
RUN npm version "$VERSION" --no-git-tag-version --allow-same-version && npm run build

# Final extension image
FROM alpine:3.21

ARG VERSION=0.2.1 # x-release-please-version

LABEL org.opencontainers.image.title="Runbooks" \
    org.opencontainers.image.description="Saved command scripts for Docker Desktop" \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.vendor="HerbHall" \
    org.opencontainers.image.licenses="MIT" \
    com.docker.desktop.extension.api.version="0.3.4" \
    com.docker.desktop.extension.icon="docker.svg" \
    com.docker.extension.screenshots="[{\"alt\":\"Grid view with sample runbooks\",\"url\":\"https://raw.githubusercontent.com/HerbHall/Runbooks/main/docs/screenshots/grid-view.png\"},{\"alt\":\"Expanded cards showing command details\",\"url\":\"https://raw.githubusercontent.com/HerbHall/Runbooks/main/docs/screenshots/expanded-cards.png\"},{\"alt\":\"Search filtering runbooks\",\"url\":\"https://raw.githubusercontent.com/HerbHall/Runbooks/main/docs/screenshots/search-filter.png\"}]" \
    com.docker.extension.detailed-description="Create, organize, and execute saved Docker command scripts directly from Docker Desktop." \
    com.docker.extension.publisher-url="https://github.com/HerbHall" \
    com.docker.extension.additional-urls="[{\"title\":\"Documentation\",\"url\":\"https://github.com/HerbHall/Runbooks#readme\"},{\"title\":\"Report a Bug\",\"url\":\"https://github.com/HerbHall/Runbooks/issues/new?template=bug_report.yml\"},{\"title\":\"Support\",\"url\":\"https://github.com/HerbHall/Runbooks/discussions\"}]" \
    com.docker.extension.categories="utility-tools" \
    com.docker.extension.changelog="<ul><li>Parameterized commands with variable syntax</li><li>Favorites and pinned runbooks</li><li>Streaming command output with auto-scroll</li><li>Execution history tracking</li><li>Keyboard shortcuts</li><li>Destructive command confirmation</li><li>Smart collection filter chips</li><li>Soft delete with trash and auto-purge</li><li>Global variables with secret masking</li></ul>"

COPY metadata.json .
COPY docker.svg .
COPY --from=ui-builder /app/build ui
