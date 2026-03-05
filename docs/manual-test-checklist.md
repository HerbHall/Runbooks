# Runbooks Manual Test Checklist

Systematic QA checklist for the Runbooks Docker Desktop Extension.
Test at three window sizes: **narrow** (~800px), **medium** (~1200px), **wide** (~1600px+).

## 1. Card Layout and Display

### 1.1 Window Resizing

- [ ] Narrow: cards display in single column, no horizontal clipping
- [ ] Medium: cards display in 2-3 columns, no overflow beyond edges
- [ ] Wide: cards fill available space with consistent column widths
- [ ] Resize from wide to narrow: cards reflow without content loss
- [ ] Resize from narrow to wide: columns appear smoothly
- [ ] No horizontal scrollbar appears on the main view at any size

### 1.2 Card Content

- [ ] Long runbook title truncates with ellipsis, does not push buttons off-screen
- [ ] Category badge displays correctly on its own row
- [ ] Multiple tags wrap to next line without clipping
- [ ] Tags with long text truncate or wrap gracefully
- [ ] Action buttons (edit, delete, run, pin) always visible and clickable
- [ ] Collapse/expand toggle works on individual cards
- [ ] Collapsed card shows only header row(s)
- [ ] Expanded card shows full command list

### 1.3 Card Interactions

- [ ] Expand All / Collapse All toolbar buttons work
- [ ] Pin/unpin moves card to top of its group
- [ ] Pinned indicator visible on pinned cards
- [ ] Last-run timestamp displays correctly on previously executed runbooks

## 2. Toolbar and Navigation

### 2.1 Search

- [ ] Search filters runbooks by name in real-time
- [ ] Search filters by command content
- [ ] Search filters by tag
- [ ] Clearing search restores full list
- [ ] Keyboard shortcut `/` focuses search field

### 2.2 Sort and Group

- [ ] Sort by name (A-Z, Z-A) works
- [ ] Sort by date created works
- [ ] Sort by last run works
- [ ] Group by category shows section headers
- [ ] Group by tag shows nested groups (first tag = group, second = sub-group)
- [ ] No grouping shows flat list
- [ ] Group collapse state persists across sort changes

### 2.3 Layout Toggle

- [ ] Grid layout displays multi-column cards
- [ ] List layout displays single-column rows
- [ ] Layout preference persists after closing/reopening extension

### 2.4 Toolbar Buttons

- [ ] Create New (Ctrl+N) opens form dialog
- [ ] Ctrl+N while a dialog is open does NOT open another dialog
- [ ] Import button accepts valid JSON file
- [ ] Import rejects invalid/corrupt JSON with error toast
- [ ] Export downloads JSON file with all runbooks
- [ ] Settings button opens settings dialog
- [ ] Help/Getting Started button opens guide dialog

## 3. Create/Edit Runbook (RunbookFormDialog)

### 3.1 Form Fields

- [ ] Name field required — cannot save empty
- [ ] Command editor accepts multi-line input
- [ ] Syntax highlighting appears for known Docker commands
- [ ] Category dropdown shows existing categories + option to create new
- [ ] Tag input: typing + Enter adds a tag chip
- [ ] Tag input: autocomplete suggests existing tags
- [ ] Tag chip X button removes tag
- [ ] Description field is optional

### 3.2 Command Validation

- [ ] Valid Docker commands show no warnings
- [ ] Non-Docker commands show advisory warning (not blocking)
- [ ] Destructive commands (rm, prune, etc.) show warning icon

### 3.3 Save Behavior

- [ ] Save creates new runbook and closes dialog
- [ ] Edit mode pre-fills all fields with existing data
- [ ] Save in edit mode updates runbook without duplicating
- [ ] Cancel discards changes and closes dialog

## 4. Execution Dialog (RunbookExecutionDialog)

### 4.1 Preview Step

- [ ] Preview shows all commands before execution
- [ ] Secret values are masked with dots in preview
- [ ] Copy button copies commands to clipboard
- [ ] Cancel closes without executing
- [ ] Run button starts execution

### 4.2 Streaming Output

- [ ] Command label shows `$ command (running...)` during execution
- [ ] Live output streams in real-time
- [ ] Auto-scroll follows new output
- [ ] Auto-scroll toggle disables/enables scrolling
- [ ] Elapsed timer counts seconds during execution
- [ ] Abort button stops execution mid-stream
- [ ] Ctrl+C stops execution

### 4.3 Final Output Display

- [ ] Completed output is readable and properly formatted
- [ ] Tabular output (e.g., `docker history`) preserves column alignment
- [ ] Horizontal scroll available for wide output (no chaotic wrapping)
- [ ] Multi-command runbooks show output for each command sequentially
- [ ] Empty output shows "(no output)" placeholder
- [ ] Error output displays with red background
- [ ] Success message appears in footer on completion
- [ ] Error message appears in footer on failure

### 4.4 Dialog Sizing

- [ ] Dialog auto-sizes to content (not fixed 80vh for small output)
- [ ] Dialog caps at 85vh for large output
- [ ] DialogContent scrolls when content exceeds max height
- [ ] Navigation buttons (View Containers, View Images, etc.) appear after relevant commands

### 4.5 Output Types to Test

- [ ] Short output: `docker version` — small dialog, readable
- [ ] Tabular output: `docker ps --format table` or `docker history` — columns aligned
- [ ] Long output: `docker system df -v` — scrollable, large dialog
- [ ] Error output: invalid command — red background, clear error text
- [ ] Empty output: command with no stdout — "(no output)" shown
- [ ] Multi-command: runbook with 3+ commands — each shows sequentially

## 5. Parameter Input Dialog (ParameterInputDialog)

### 5.1 Variable Types

- [ ] `{{name}}` — plain text field, required (no default)
- [ ] `{{name=default}}` — pre-filled with default, editable
- [ ] `{{name|opt1,opt2}}` — dropdown with options
- [ ] `{{name=default|opt1,opt2}}` — dropdown with default selected
- [ ] Multiple variables in one runbook — all fields shown

### 5.2 Docker Resource Autocomplete

- [ ] Variable named `container_name` shows container suggestions
- [ ] Variable named `image` shows image suggestions
- [ ] Variable named `volume_name` shows volume suggestions
- [ ] Variable named `network` shows network suggestions
- [ ] No containers available: field shows "No containers available — start a container first"
- [ ] Free-text entry still allowed even with suggestions

### 5.3 Global Constants

- [ ] Variable matching a global constant shows as disabled with "Global" chip
- [ ] Secret constant shows masked value with "Secret" chip
- [ ] Constants are not editable in the parameter dialog

### 5.4 Validation

- [ ] Required fields (no default, no value entered) show red error state
- [ ] Run button disabled when required fields are empty
- [ ] Run button enabled when all required fields have values
- [ ] Preview panel updates live as values change
- [ ] Copy button copies resolved commands

## 6. Destructive Command Confirmation

- [ ] Commands with `rm`, `prune`, `kill`, `stop` trigger confirmation dialog
- [ ] Warning dialog lists each destructive command with description
- [ ] Cancel returns to preview without executing
- [ ] "Execute Anyway" proceeds with execution
- [ ] Non-destructive commands skip confirmation entirely

## 7. Delete Runbook (RunbookDeleteDialog)

- [ ] Delete button on card opens confirmation dialog
- [ ] Dialog shows runbook name
- [ ] Cancel closes without deleting
- [ ] Confirm moves runbook to trash (soft delete)
- [ ] Deleted runbook no longer visible in main list
- [ ] Trash/deleted runbooks recoverable (if trash feature exists)

## 8. Settings Dialog

- [ ] "Show example runbooks" toggle hides/shows example- prefixed runbooks
- [ ] Toggle state persists after closing and reopening
- [ ] "Reset to defaults" restores example runbooks
- [ ] Reset confirmation required before proceeding

## 9. Category Management

- [ ] Create new category with name and color
- [ ] Edit existing category name/color
- [ ] Delete category (runbooks in category become uncategorized)
- [ ] Category colors display consistently on badges
- [ ] Category badge in cards matches management dialog colors

## 10. Global Variables/Constants

- [ ] Create new constant with name and value
- [ ] Create secret constant (value masked in UI)
- [ ] Edit existing constant
- [ ] Delete constant
- [ ] Constants auto-fill matching `{{name}}` variables in parameter dialog
- [ ] Secret values masked everywhere: parameter dialog, preview, execution output

## 11. Import/Export

- [ ] Export creates valid JSON file
- [ ] Import valid file adds runbooks
- [ ] Import handles duplicates gracefully (merge or skip)
- [ ] Import invalid JSON shows error toast
- [ ] Import file with missing required fields shows error
- [ ] Round-trip: export then import produces identical data

## 12. Keyboard Shortcuts

- [ ] `/` — focuses search field
- [ ] `Ctrl+N` — opens create dialog (when no dialog open)
- [ ] `Ctrl+C` — aborts running execution
- [ ] `Ctrl+Enter` — submits form dialog (if applicable)
- [ ] `Escape` — closes open dialog

## 13. Error Handling

- [ ] Extension loads with empty localStorage (first run)
- [ ] Extension loads with corrupt localStorage (shows error, recovers)
- [ ] Network error during Docker command shows meaningful message
- [ ] React Error Boundary catches component crashes with recovery button
- [ ] Toast notifications appear for success and error states

## 14. Theme and Appearance

- [ ] Light mode: all text readable, proper contrast
- [ ] Dark mode: all text readable, proper contrast
- [ ] Switch between light/dark (Docker Desktop > Settings > Appearance)
- [ ] Dialog backgrounds match theme
- [ ] Code/output blocks readable in both themes
- [ ] Category badge colors work in both themes

## 15. Getting Started Dialog

- [ ] Opens from help menu
- [ ] Shows feature overview
- [ ] Shows keyboard shortcuts list
- [ ] Shows variable syntax reference with examples
- [ ] Close button works

## Notes

- Test with at least 10+ runbooks to verify scroll and grouping behavior
- Test with 0 runbooks to verify empty state
- Test after clearing localStorage to verify first-run experience
- Run each execution test with Docker Desktop connected and with Docker stopped
