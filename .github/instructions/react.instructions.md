---
applyTo: "ui/**/*.{ts,tsx}"
---

# React/TypeScript Coding Instructions

## Component Patterns

Define props interfaces above the component, use functional components:

```tsx
interface ItemCardProps {
    id: string
    label: string
    onSelect: (id: string) => void
}

export function ItemCard({ id, label, onSelect }: ItemCardProps) {
    return <button onClick={() => onSelect(id)}>{label}</button>
}
```

## State Management

- **useState** for local UI state (this extension does not use a global state library)
- **Docker Extension SDK** (`ddClient`) for all container and backend operations
- **No `useEffect` for data syncing** -- use nullable local override instead:

```tsx
// GOOD: nullable override, no useEffect sync
const [localOverride, setLocalOverride] = useState<string | null>(null)
const displayValue = localOverride ?? serverValue ?? ''

// Reset on save success to re-sync from server
onSuccess: () => { setLocalOverride(null) }
```

## Docker Extension SDK Integration

Always use the typed Docker Desktop client; never call `fetch` directly:

```tsx
import { createDockerDesktopClient } from '@docker/extension-api-client'

const ddClient = createDockerDesktopClient()

// Execute Docker CLI commands
const result = await ddClient.docker.cli.exec('ps', ['--format', 'json'])

// Show toast notifications
ddClient.desktopUI.toast.success('Runbook executed successfully')
ddClient.desktopUI.toast.error('Failed to execute runbook')
```

## Union Return Types

When a function returns a union type, add a type guard and use it at EVERY call site:

```tsx
// BAD: TS2339 -- property not on union
const result = await someApi()
doSomething(result.specificProp)

// GOOD: narrow first
const result = await someApi()
if (isExpectedType(result)) {
    doSomething(result.specificProp)
}
```

## TypeScript

- Strict mode -- no `any`; use `unknown` with type guards
- JSX short-circuit: `{expanded && item.details != null && <div/>}` (use `!= null`, not bare `&&` on `unknown`)
- Unused imports: ESLint catches these even when `tsc` does not -- verify every named import is used

## React Compiler Lint

Do not mutate `ref.current` during render -- wrap in `useEffect`:

```tsx
// BAD: ref mutation during render
onMessageRef.current = onMessage

// GOOD: wrap in effect
useEffect(() => { onMessageRef.current = onMessage }, [onMessage])
```

For Popper/Popover anchor elements, use callback ref with `useState` instead of `useRef`:

```tsx
// GOOD: callback ref avoids reading ref.current during render
const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)
<Button ref={setAnchorEl}>Menu</Button>
<Popper anchorEl={anchorEl} open={open}>...</Popper>
```

## UI Components

This project uses **MUI v5** via `@docker/docker-mui-theme`. Key patterns:

- Use `InputProps` (not `slotProps.input`) for TextField adornments
- Use `SelectProps` (not `slotProps.select`) for Select customization
- Import theme from `@docker/docker-mui-theme` for Docker Desktop visual consistency
- Support both light and dark mode (Docker Desktop > Settings > Appearance)

```tsx
import { DockerMuiThemeProvider } from '@docker/docker-mui-theme'
import { CssBaseline } from '@mui/material'

function App() {
    return (
        <DockerMuiThemeProvider>
            <CssBaseline />
            {/* Application content */}
        </DockerMuiThemeProvider>
    )
}
```

## Testing

Vitest + Testing Library. Prefer `mergeConfig(viteConfig, defineConfig(...))` so Vite
plugins and defines are inherited:

```ts
// vitest.config.ts
import { mergeConfig, defineConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
    test: { environment: 'jsdom', globals: true, setupFiles: './src/test-setup.ts' }
}))
```
