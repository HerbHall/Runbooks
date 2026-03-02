# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-03-01

### Added

- Parameterized commands with `{{name=default|opts}}` variable substitution (#108)
- Copy-to-clipboard button on runbook cards (#109)
- Persist group collapse state across reloads (#109)
- React Error Boundary with themed fallback UI and recovery (#78)
- Confirmation dialog for destructive Docker commands (#80)
- Unit test suite with Vitest -- 76 tests across 4 files (#81)
- Test job in CI pipeline (#81)
- User feedback and support links with diagnostic review (#65)
- Community health files: CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, PR template, CODEOWNERS (#66)
- ESLint with TypeScript and React plugins (#67)
- Dependabot for npm and GitHub Actions dependencies (#69)
- Dockerfile extension labels: screenshots, changelog, additional URLs (#79)
- GitHub Actions release workflow for automated Docker Hub publishing (#84)
- Static extension validation gate in CI and release (#110)
- Extension categories label and host.binaries for marketplace validation (#85)

### Changed

- CI split into parallel Lint, Type Check, Test, and Build jobs (#68)
- Repo settings: squash-only merges, auto-delete branches, branch protection (#69)

## [0.1.0] - 2026-02-28

### Added

- Create, edit, and delete Docker command scripts
- Tag-based organization with nested category grouping
- One-click execution with inline output display
- Search, sort, and filter runbooks
- Grid and list layout modes with compact density option
- Collapsible cards with expand/collapse all
- Tag autocomplete with chip input
- Command validation with syntax highlighting
- Import/export runbooks (JSON and legacy format)
- Category management with color-coded badges
- GitHub Actions CI pipeline
- Version display in footer

[Unreleased]: https://github.com/HerbHall/Runbooks/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/HerbHall/Runbooks/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/HerbHall/Runbooks/releases/tag/v0.1.0
