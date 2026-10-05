# Implementation Plan: UI/UX Skills & Design System Modernization

- **Date**: 2026-10-05
- **Project**: Campus Navigation Route Finder
- **Scope**: UI/UX Architecture, Skills Installation, Design System, & Component Modularization
- **Status**: Completed / Ready for Iteration
- **Guiding Rule**: Strict compliance with `RULES.md` — frontend visualizer only; all graph pathfinding, BFS, and route traversal algorithms remain reserved for manual C implementation in `engine/routefinder.c`.

---

## 1. Executive Summary

This plan formalizes the UI/UX enhancement strategy and design system architecture for the Campus Navigation Route Finder. Following a comprehensive web search for 2026 frontend, Three.js, and design token best practices, six dedicated project-level skills have been codified and installed under `.agents/skills/`.

Each skill adheres to a dual-format structure:
1. **Active Rules (`DO` vs. `DON'T`)**: Rapid-reference tables for instant guidance during implementation.
2. **Extended Reference Appendix**: Code patterns, concrete examples, and architectural constraints tailored directly to this project.

---

## 2. UI/UX Skills Inventory

The following 6 skills are installed in `.agents/skills/` and immediately available to the agent pairing system:

| Skill Directory | Primary Domain | Core Focus |
|---|---|---|
| `react-patterns/` | React Architecture | Custom hooks for logic reuse, compound components for complex panels, atomic design guidelines, feature-based colocation. |
| `tailwind-design-system/` | CSS & Token System | TailwindCSS v4 `@theme {}` tokens in OKLCH, semantic color naming (`--color-surface`, `--color-primary`), dark mode via `.dark` re-declarations without class spam. |
| `r3f-3d-ux/` | Three.js & Spatial UX | CameraControls for smooth transitions, Billboard + Text for occlusion-free 3D labels, mutable ref animations in `useFrame`, `frameloop="demand"` for GPU preservation. |
| `motion-micro-interactions/` | Motion & Animation | 60fps compositor-only animations (`transform`, `opacity`), 100ms–250ms feedback timings, natural easing curves, full `prefers-reduced-motion` compliance. |
| `responsive-layout/` | Layout & Geometries | Hybrid CSS Grid (page shell) + Flexbox (1D elements), fluid `clamp()` sizing, `@container` queries for modular inspector cards, canvas aspect-ratio protection. |
| `data-viz-ux/` | Spatial Data Visualization | Physical $(x,y,z)$ coordinates justification, progressive disclosure (focus + context subgraph dimming), semantic category coloring (Gates, Academic, Admin, Food), stem height cues. |

---

## 3. Design System & Token Architecture

The project utilizes **TailwindCSS v4** with a zero-config, CSS-first architecture inside `frontend/src/index.css`.

### 3.1 OKLCH Semantic Color Tokens

```css
@theme {
  /* Surface & Base */
  --color-canvas-bg:      oklch(0.12 0.02 260);
  --color-panel-surface:  oklch(0.16 0.03 260);
  --color-panel-border:   oklch(0.24 0.03 260);

  /* Typography */
  --color-text-primary:   oklch(0.95 0.01 260);
  --color-text-secondary: oklch(0.68 0.02 260);
  --color-text-muted:     oklch(0.48 0.02 260);

  /* Category Visual Encoding */
  --color-cat-gate:       oklch(0.72 0.17 155); /* Emerald */
  --color-cat-academic:   oklch(0.65 0.18 250); /* Blue */
  --color-cat-admin:      oklch(0.68 0.16 300); /* Purple */
  --color-cat-amenity:    oklch(0.78 0.15 80);  /* Amber */

  /* Interactive States */
  --color-node-selected:  oklch(0.75 0.16 210); /* Cyan */
  --color-edge-default:   oklch(0.38 0.02 260); /* Slate-600 */
  --color-edge-active:    oklch(0.80 0.16 85);  /* Amber glow */
}
```

### 3.2 Typography & Spacing Hierarchy
- **Primary Font**: `"Inter", system-ui, -apple-system, sans-serif`
- **Monospace Coordinates**: `"JetBrains Mono", ui-monospace, monospace`
- **Fluid Title Scale**: `font-size: clamp(1.25rem, 1.8vw + 0.5rem, 2rem)`
- **Fluid Body Scale**: `font-size: clamp(0.875rem, 0.4vw + 0.75rem, 1rem)`

---

## 4. 3D Scene UX & Spatial Guidelines

### 4.1 Billboard Node Labels & Stems
- **Problem**: 2D DOM overlays rendered inside Three.js `<Canvas>` via `Html` caused React lifecycle synchronization errors and flickering during camera pans.
- **Solution**: Native WebGL `Billboard` primitives wrapping `@react-three/drei`'s `Text` component paired with a backing plane geometry and a vertical ground `NodeStem`.
- **Label Sizing**: Fluid width calculation based on string length: `width = label.length * 0.14 + 0.3`.

### 4.2 Camera Management
- Integrate `CameraControls` for fluid interpolated camera pans (`setLookAt`) when nodes are clicked in the list or in the 3D space.
- Disable aggressive panning bounds; maintain smooth damping on rotational orbit.

### 4.3 Rendering Optimization
- Use `frameloop="demand"` on `<Canvas>`.
- Call `invalidate()` on selection updates and camera changes to avoid running GPU loops at idle.

---

## 5. Responsive Layout Architecture

### 5.1 Hybrid Grid/Flexbox Layout Shell
```
+-------------------------------------------------------------------+
| App Header: Campus Navigation Route Finder (h-14, flex, border-b)  |
+-------------------+-----------------------------------------------+
| Left Panel        | Main 3D Viewport                              |
| (Nodes/Edges List)| (Canvas, relative, min-w-0, min-h-0)          |
| 320px (Desktop)   | +-------------------------------------------+ |
| Collapsible Drawer| | Floating Node Inspector Card (Top-Right)  | |
| (Mobile <768px)   | +-------------------------------------------+ |
|                   | | Debug Placement HUD (Bottom-Right)        | |
|                   | +-------------------------------------------+ |
+-------------------+-----------------------------------------------+
```

### 5.2 Responsive Breakpoints
- **Mobile (`<768px`)**: Single column layout. 3D canvas takes primary viewport; left panel collapses into a bottom sheet / drawer toggle.
- **Desktop (`>=768px`)**: Split 3-panel display with persistent node directory and floating inspector.

---

## 6. Implementation Milestones

- [x] **Milestone 1**: UI/UX best practices research (Web search completed across 6 domains).
- [x] **Milestone 2**: Codify and install all 6 Antigravity skills in `.agents/skills/`.
- [x] **Milestone 3**: Document implementation plan (`2026-10-05-uiux-skills-and-design-system.md`).
- [ ] **Milestone 4**: Apply token definitions to `frontend/src/index.css`.
- [ ] **Milestone 5**: Refactor `App.tsx` panels into compound components adhering to `react-patterns`.
- [ ] **Milestone 6**: Validate responsiveness and test suite pass rate (23/23 tests minimum).

---

## 7. Verification & Guardrails

1. **Algorithm Boundary**: Confirm NO graph traversal (BFS/DFS/Dijkstra/A*) exists in any frontend code.
2. **Test Suite**: Run `npm test` inside `frontend/` to confirm all unit tests pass without regressions.
3. **Build Integrity**: Run `npm run build` to verify zero TypeScript or Vite bundle errors.
