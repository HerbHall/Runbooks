# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Settings dialog with toggle to show/hide example runbooks and reset-to-defaults (#133)
- Getting Started guide accessible from help menu with features, keyboard shortcuts, and variable syntax (#133)
- 8 feature-showcasing default examples demonstrating variables, autocomplete, multi-command, and destructive confirmation (#133)
- Categories-view screenshot (#133)

### Changed

- Replaced generic default examples with feature-showcasing ones (#133)
- Makefile `reinstall-extension` builds after removing old extension to prevent stale Docker Hub pull (#133)

## [0.2.0] - 2026-03-01

### Added

- Parameterized commands with `{{name=default|opts}}` variable substitution (#108)
- Copy-to-clipboard button on runbook cards (#109)
- Persist group collapse state across reloads (#109)
- Favorites/pin runbooks with star icon, pinned items sort to top (#112)
- Streaming command output with auto-scroll and elapsed timer (#113)
- Execution history with last-run display and "Recently Executed" sort (#114)
- Tag suggestions from existing runbooks only, no hardcoded tags (#121)
- Keyboard shortcuts: Ctrl+N new, / search, Ctrl+C abort, Ctrl+Enter save (#122)
- Dry-run preview showing resolved commands before execution (#123)
- Navigation links: contextual View Containers/Images/Volumes after execution (#124)
- Container/image autocomplete: context-aware suggestions in command editor (#125)
- Parameter autocomplete: variables named container/image/volume/network get Docker resource dropdowns (#127)
- React Error Boundary with themed fallback UI and recovery (#78)
- Confirmation dialog for destructive Docker commands (#80)
- Unit test suite with Vitest -- 142 tests across 10 files (#81, #115)
- Test job in CI pipeline (#81)
- User feedback and support links with diagnostic review (#65)
- Community health files: CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, PR template, CODEOWNERS (#66)
- ESLint with TypeScript and React plugins (#67)
- Dependabot for npm and GitHub Actions dependencies (#69)
- Dockerfile extension labels: screenshots, changelog, additional URLs (#79)
- GitHub Actions release workflow for automated Docker Hub publishing (#84)
- Static extension validation gate in CI and release (#110)
- Extension categories label and host.binaries for marketplace validation (#85)
- CHANGELOG.md (#77)
- Makefile `reinstall-extension` target for one-command build/remove/install cycle (#129)

### Changed

- CI split into parallel Lint, Type Check, Test, and Build jobs (#68)
- Repo settings: squash-only merges, auto-delete branches, branch protection (#69)
- Version display reads from package.json at build time via Vite define (#126)

### Fixed

- Individual card expand/collapse working independently (#128)
- Collapsed cards no longer leave empty space in grid layout (#130)
- Version display showing correct version in Docker Desktop (#126)

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
