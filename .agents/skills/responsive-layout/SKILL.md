---
name: responsive-layout
description: >
  Responsive layout, CSS Grid, Flexbox, and fluid geometry cheatsheet.
  Covers content-aware breakpoints, hybrid Grid/Flexbox architectures, fluid
  clamp() typography/spacing, and modern CSS container queries (@container).
---

# Responsive Layout & Grid Systems — Active Rules

> Design mobile-first, think fluidly with intrinsic sizing, and use breakpoints only where content breaks.

## ✅ DO

| Rule | Why |
|---|---|
| **Mobile-First CSS hierarchy**: base styling for small screens, progressive `min-width` expansion | Cleaner stylesheets, fewer overrides, faster mobile rendering |
| **Hybrid Grid + Flexbox**: CSS Grid for 2D page framing (sidebar + viewer + dock), Flexbox for 1D element flow | Leverages each engine's natural strengths |
| **Fluid typography & padding** with `clamp(min, preferred, max)` | Eliminates jumpy layout shifts between fixed breakpoint steps |
| **Container queries (`@container`)** for self-contained components | Allows widgets (like node inspector cards) to reflow whether in a 300px sidebar or full modal |
| **Intrinsic column grids**: `repeat(auto-fit, minmax(260px, 1fr))` | Adapts automatically to any available width without media queries |
| **Protect 3D Canvas aspect ratio**: set full flex/grid container sizing with `min-h-0` / `min-w-0` | Prevents Three.js canvas overflow / infinite growth bugs |

## ❌ DON'T

| Anti-Pattern | Alternative |
|---|---|
| Rigid device-specific breakpoints (`@media (width: 375px)`) | Content-driven breakpoints: `sm (640px)`, `md (768px)`, `lg (1024px)`, `xl (1280px)` |
| Hardcoded pixel dimensions on major layout panels | Relative units, `minmax()`, or container queries |
| Overusing complex nested flex wrappers | Single CSS Grid with named template areas |
| Neglecting `overflow: hidden` on viewport roots with 3D canvas | Maintain canvas container bounding with `overflow: hidden; touch-action: none;` |
| Fixed height on dynamic text containers | Fluid heights with `min-height` |

---

## Extended Reference

### Campus Route Finder Layout Blueprint

```
+-------------------------------------------------------------------+
| Top Navigation / Status Header (h-14, flex, sticky)               |
+-------------------+-----------------------------------------------+
| Left Panel        | Main Viewport: Three.js Canvas Container      |
| (Control / List)  | (flex-1 or grid-area, relative, overflow-hidden|
| w-80 (desktop)    |                                               |
| Overlay (mobile)  | +-------------------------------------------+ |
|                   | | Floating Info Panel / HUD (absolute right)| |
|                   | +-------------------------------------------+ |
+-------------------+-----------------------------------------------+
| Bottom Stats / Quick Actions Dock (optional collapsible)          |
+-------------------------------------------------------------------+
```

### CSS Grid Page Shell Implementation

```css
/* Layout root for desktop & mobile */
.app-shell {
  display: grid;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: minmax(280px, 340px) 1fr;
  grid-template-areas:
    "header header"
    "sidebar main"
    "footer  main";
}

/* Mobile responsive collapse */
@media (max-width: 768px) {
  .app-shell {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "sidebar";
  }
}

.shell-header  { grid-area: header; }
.shell-sidebar { grid-area: sidebar; }
.shell-main    { grid-area: main; position: relative; min-width: 0; min-height: 0; }
.shell-footer  { grid-area: footer; }
```

### Fluid Spacing & Sizing Utility Formulae

```css
/* Fluid scale utilities */
:root {
  --space-sm: clamp(0.5rem, 0.8vw + 0.2rem, 0.75rem);
  --space-md: clamp(1rem, 1.5vw + 0.5rem, 1.5rem);
  --space-lg: clamp(1.5rem, 2.5vw + 0.8rem, 2.5rem);

  --font-heading: clamp(1.25rem, 2vw + 0.5rem, 2rem);
  --font-body: clamp(0.875rem, 0.5vw + 0.75rem, 1rem);
}
```

### Container Query for Modular Panels

```css
/* Mark container */
.inspector-card-container {
  container-type: inline-size;
}

/* Default vertical layout for narrow containers */
.inspector-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Switch to horizontal columns when parent container >= 420px */
@container (min-width: 420px) {
  .inspector-card {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
  }
}
```

### Layout Responsiveness Checklist
- [ ] Viewport `<meta name="viewport" content="width=device-width, initial-scale=1">` present.
- [ ] Canvas parent has `min-w-0` and `min-h-0` to avoid flex expansion bugs.
- [ ] Tested at mobile (375px), tablet (768px), and desktop (1280px).
- [ ] No horizontal scrollbars on the main document.
