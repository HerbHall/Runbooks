# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2](https://github.com/HerbHall/Runbooks/compare/v0.2.1...v0.2.2) (2026-03-05)


### Bug Fixes

* add aria-label to all IconButtons for screen reader accessibility ([#162](https://github.com/HerbHall/Runbooks/issues/162)) ([ebde9de](https://github.com/HerbHall/Runbooks/commit/ebde9de81cff04ac30c4773f8785c46bfb4de44d)), closes [#153](https://github.com/HerbHall/Runbooks/issues/153)
* error handling for localStorage quota, clipboard, and ErrorBoundary retry ([#160](https://github.com/HerbHall/Runbooks/issues/160)) ([0d8a7ec](https://github.com/HerbHall/Runbooks/commit/0d8a7ec75dc9c2807828ae6bbf4250e22665bc39))
* improve card layout, execution output, and parameter validation ([540779b](https://github.com/HerbHall/Runbooks/commit/540779b21e41295e6fa11c7f9daf96d976e34d0b))
* sync version across release-please, package.json, and Makefile ([#155](https://github.com/HerbHall/Runbooks/issues/155)) ([f9529d7](https://github.com/HerbHall/Runbooks/commit/f9529d718c85a398b815c0477d30962e79e3cb28)), closes [#147](https://github.com/HerbHall/Runbooks/issues/147)
* treat empty variable values as intentional and add quote-aware command parsing ([#157](https://github.com/HerbHall/Runbooks/issues/157)) ([1349a81](https://github.com/HerbHall/Runbooks/commit/1349a81988b0eaad666dbdfed429ce3af32be0c7)), closes [#149](https://github.com/HerbHall/Runbooks/issues/149)
* update CI action versions, fix icon label, update alpine base image, enforce test gate ([#154](https://github.com/HerbHall/Runbooks/issues/154)) ([e2a8f4b](https://github.com/HerbHall/Runbooks/commit/e2a8f4bbd84dc0921478d2ca337035561379b11d))
* update delete dialog copy for soft-delete ([#158](https://github.com/HerbHall/Runbooks/issues/158)) ([7f933db](https://github.com/HerbHall/Runbooks/commit/7f933dbc259a49f0263f46bcb8f1489bc4137ace))
* UX improvements for trash confirmation, Ctrl+N guard, and collapse scope ([#161](https://github.com/HerbHall/Runbooks/issues/161)) ([dc8bb65](https://github.com/HerbHall/Runbooks/commit/dc8bb650ac855b8d627e467aca250efab366fc32)), closes [#151](https://github.com/HerbHall/Runbooks/issues/151)

## [0.2.1](https://github.com/HerbHall/Runbooks/compare/v0.2.0...v0.2.1) (2026-03-04)


### Features

* add GitHub Copilot integration files ([#143](https://github.com/HerbHall/Runbooks/issues/143)) ([94a5ea2](https://github.com/HerbHall/Runbooks/commit/94a5ea252b540736527815602316c9dc84d68b66))
* add smart collection filter chips for execution history ([#141](https://github.com/HerbHall/Runbooks/issues/141)) ([8d9a561](https://github.com/HerbHall/Runbooks/commit/8d9a56181e24d8abbc70cbc5b97b95194756cd9d)), closes [#103](https://github.com/HerbHall/Runbooks/issues/103)
* add soft delete with trash dialog and auto-purge ([#142](https://github.com/HerbHall/Runbooks/issues/142)) ([2425c2c](https://github.com/HerbHall/Runbooks/commit/2425c2c67bd668ca1dd68c2c2021d65398baa1ba)), closes [#105](https://github.com/HerbHall/Runbooks/issues/105)


### Bug Fixes

* use simple release type for non-root package.json ([#139](https://github.com/HerbHall/Runbooks/issues/139)) ([c0717ed](https://github.com/HerbHall/Runbooks/commit/c0717eddea94d9ee0b0ca5ef03d496055f36a1ea))

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
