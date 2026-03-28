

## Subtle Animated Wave Background

Add a CSS-only animated wave background using pseudo-elements on the auth page container. The waves will be very faint, slow-moving, and use the existing design token colors at low opacity.

### Approach

**CSS (`src/index.css`)**: Add a `.wave-bg` utility class with `::before` and `::after` pseudo-elements that render large, soft SVG wave shapes. Two layers at different speeds/sizes create depth. Colors will use `hsl(var(--border))` at ~0.08–0.12 opacity. Animation: gentle horizontal drift over 20–30s, infinite, ease-in-out.

**Auth page (`src/pages/Auth.tsx`)**: Add `wave-bg` class to the outer `div` wrapper (the `min-h-screen` container). No other changes.

### CSS Detail

- Two wave layers using `background-image` with inline SVG data URIs (curved paths)
- Layer 1: slower (25s), larger wave, opacity ~0.08
- Layer 2: faster (18s), smaller wave, slightly offset, opacity ~0.06
- Animation: `translateX` keyframes shifting waves horizontally by ~50% of their width
- `pointer-events: none` and `z-index: 0` on pseudo-elements; card content stays above with `relative z-10`
- Works in both light and dark mode since it uses CSS variable-based colors

### Files Changed
1. **`src/index.css`** — Add `@keyframes wave-drift` and `.wave-bg` class with pseudo-element wave layers
2. **`src/pages/Auth.tsx`** — Add `wave-bg` and `relative overflow-hidden` to the outer div; add `relative z-10` to the Card

