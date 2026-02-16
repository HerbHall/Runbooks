# Build the React UI
FROM --platform=$BUILDPLATFORM node:22-alpine AS ui-builder
WORKDIR /app
COPY ui/package.json ui/package-lock.json* ./
RUN npm ci
COPY ui/ ./
RUN npm run build

# Final extension image
FROM alpine:3.19

LABEL org.opencontainers.image.title="Runbooks" \
    org.opencontainers.image.description="Saved command scripts for Docker Desktop" \
    org.opencontainers.image.vendor="HerbHall" \
    org.opencontainers.image.licenses="MIT" \
    com.docker.desktop.extension.api.version="0.3.4" \
    com.docker.desktop.extension.icon="https://raw.githubusercontent.com/HerbHall/Runbooks/main/docker.svg" \
    com.docker.extension.screenshots="" \
    com.docker.extension.detailed-description="Create, organize, and execute saved Docker command scripts directly from Docker Desktop." \
    com.docker.extension.publisher-url="https://github.com/HerbHall" \
    com.docker.extension.changelog=""

COPY metadata.json .
COPY docker.svg .
COPY --from=ui-builder /app/build ui
