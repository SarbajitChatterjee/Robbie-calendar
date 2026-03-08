

# Code Cleanup and Senior-Level Comments

The codebase is already well-commented from the previous pass. This cleanup focuses on **actual redundancy** and **remaining gaps**.

## What will be removed

### 1. Delete `src/styles/theme.css` (dead file)
This file is **never imported** anywhere in the codebase. Every token it defines is either:
- Already duplicated in `src/index.css` (source colors, status colors, platform colors, radii, surfaces, shadows, fuse-primary)
- Completely unused by any component (`--font-body`, `--pastel-*`, `--source-gmail`)

The `@import` for Inter font is also duplicated — `index.css` already imports it.

### 2. Rename "Fuse Calendar" → "Robbie" in `src/index.css`
Line 7 still says `/* Fuse Calendar Design System */`. Update to `/* Robbie Design System */`.

### 3. Add comments to `src/pages/NotFound.tsx`
Only file missing a file-level doc comment.

### 4. Add comment to `src/main.tsx`
Missing file-level doc comment explaining it as the React DOM entry point.

### 5. Update `STRUCTURE.md`
Remove all references to `src/styles/theme.css` since the file will be deleted. Consolidate the token documentation to point only at `src/index.css`.

---

## Files touched

| File | Change |
|---|---|
| `src/styles/theme.css` | **Delete** — dead file, never imported |
| `src/index.css` | Rename comment from "Fuse Calendar" to "Robbie" |
| `src/main.tsx` | Add file-level doc comment |
| `src/pages/NotFound.tsx` | Add file-level doc comment |
| `STRUCTURE.md` | Remove `theme.css` references, consolidate token docs |

No logic changes. No component behavior changes.

