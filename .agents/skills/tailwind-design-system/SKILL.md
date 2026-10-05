---
name: tailwind-design-system
description: >
  TailwindCSS v4 design system cheatsheet for the Campus Navigation Route Finder.
  Covers @theme tokens, dark mode, semantic naming, OKLCH colors, and utility
  patterns. Zero JavaScript config — CSS-first.
---

# Tailwind v4 Design System — Active Rules

> This project uses **TailwindCSS v4** (CSS-first config). No `tailwind.config.js`.

## ✅ DO

| Rule | Why |
|---|---|
| Define all tokens in `@theme {}` in `index.css` | Single source of truth; Tailwind auto-generates utilities |
| Use **semantic naming** for colors: `--color-surface`, `--color-primary` | Survives rebrands; no `dark:bg-gray-900` everywhere in HTML |
| Use **OKLCH** for all color values | Perceptually uniform; better dark-mode contrast |
| Re-declare semantic vars inside `.dark {}` — no `dark:` class spam | Clean HTML markup |
| Use `clamp()` for fluid typography | Scales without breakpoints |
| Use `@container` for component-level responsiveness | Truly portable, reusable components |

## ❌ DON'T

| Anti-Pattern | Alternative |
|---|---|
| `tailwind.config.js` / `tailwind.config.ts` | `@theme {}` in CSS |
| Hard-coded color values in JSX classes (`bg-[#1a1a2e]`) | CSS token → semantic utility |
| `dark:bg-gray-900` in every component | Re-declare semantic var inside `.dark {}` |
| Fixed px font sizes | `clamp()` or rem units |
| RGB/HEX colors in tokens | OKLCH |

---

## Extended Reference

### Color Token Architecture

```css
/* index.css */
@import "tailwindcss";

@theme {
  /* === Primitives === */
  --color-slate-950: oklch(0.10 0.02 260);
  --color-slate-900: oklch(0.13 0.03 260);
  --color-slate-800: oklch(0.20 0.03 260);
  --color-slate-400: oklch(0.55 0.02 260);
  --color-slate-100: oklch(0.93 0.01 260);
  --color-cyan-500:  oklch(0.70 0.15 200);
  --color-cyan-400:  oklch(0.78 0.13 200);
  --color-amber-400: oklch(0.82 0.14 80);

  /* === Semantic Tokens (light-mode defaults) === */
  --color-bg:       var(--color-slate-100);
  --color-surface:  #ffffff;
  --color-primary:  var(--color-cyan-500);
  --color-accent:   var(--color-amber-400);
  --color-text:     var(--color-slate-950);
  --color-muted:    var(--color-slate-400);
  --color-border:   oklch(0.80 0.01 260);

  /* === Typography === */
  --font-sans: "Inter", "system-ui", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* === Radii === */
  --radius-sm: 0.375rem;
  --radius-md: 0.75rem;
  --radius-lg: 1.25rem;
}

/* Dark mode swap — re-declare semantics only */
.dark {
  --color-bg:      var(--color-slate-950);
  --color-surface: var(--color-slate-900);
  --color-text:    var(--color-slate-100);
  --color-border:  var(--color-slate-800);
  --color-muted:   var(--color-slate-400);
}
```

### This Project's Color Palette

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg` | `#f0f4f8` | `oklch(0.10)` | Page background |
| `surface` | `#ffffff` | `oklch(0.13)` | Panel, card bg |
| `primary` | `oklch(0.70 0.15 200)` cyan | same | Interactive, selected nodes |
| `accent` | `oklch(0.82 0.14 80)` amber | same | Highlighted paths, debug |
| `border` | `oklch(0.80)` | `oklch(0.20)` | Panel borders |

### Fluid Typography Snippet

```css
h1 { font-size: clamp(1.5rem, 2.5vw + 0.5rem, 2.5rem); }
p  { font-size: clamp(0.875rem, 1vw + 0.25rem, 1.125rem); }
```

### Container Query Snippet

```css
.panel-wrapper { container-type: inline-size; }

@container (max-width: 320px) {
  .panel-body { flex-direction: column; }
}
```

### Dark Mode Toggle (class-based)

```css
/* index.css */
@custom-variant dark (&:where(.dark, .dark *));
```

```tsx
// hooks/useDarkMode.ts
export function useDarkMode() {
  const toggle = () => document.documentElement.classList.toggle("dark");
  return { toggle };
}
```
