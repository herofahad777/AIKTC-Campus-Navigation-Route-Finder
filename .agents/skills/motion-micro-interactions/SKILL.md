---
name: motion-micro-interactions
description: >
  Motion design and micro-interactions cheatsheet for web and 3D interfaces.
  Covers purposeful motion, 60fps performance optimization (transform/opacity),
  easing curves, timing guidelines, and accessible reduced-motion rules.
---

# Motion & Micro-Interactions — Active Rules

> Motion must always be purposeful, functional, and snappy. Never animate for mere decoration.

## ✅ DO

| Rule | Why |
|---|---|
| **Animate only compositor properties**: `transform` (scale, translate, rotate) and `opacity` | Runs on GPU; avoids layout reflows and repaints, guaranteeing 60fps |
| **Keep micro-interactions snappy**: 100ms–250ms for button/hover feedback | Gives immediate response without feeling sluggish |
| **Use natural easing curves**: `cubic-bezier(0.16, 1, 0.3, 1)` or `ease-out` for entrances | Feels physically grounded and responsive |
| **Respect `prefers-reduced-motion`** in CSS and JS | Critical accessibility requirement; prevents motion sickness |
| **Micro-feedback on state change**: subtle pulse, outline flash, or color transition | Confirms user action without distracting popups |
| **Orchestrate staggered reveals** with short delays (20–40ms per item) | Guides visual attention hierarchically |

## ❌ DON'T

| Anti-Pattern | Alternative |
|---|---|
| Animating `width`, `height`, `top`, `left`, `margin`, `padding` | Use `transform: scale()` or `translate()` |
| Animating `box-shadow` or `filter` heavily | Use pseudo-element opacity cross-fades |
| Animation durations over 400ms for routine UI interactions | Cap at 200–300ms |
| Constant looping animations without user focus | Static indicator or one-shot accent animation |
| Heavy animation libraries when CSS transitions suffice | CSS transitions & `@keyframes` |

---

## Extended Reference

### Micro-Interaction Timing & Easing Matrix

| Interaction Type | Recommended Duration | Easing Curve | Purpose |
|---|---|---|---|
| **Hover / Press** | `100ms - 150ms` | `ease-out` | Immediate tactile acknowledgement |
| **Dropdown / Flyout** | `180ms - 240ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Smooth reveal with snappy settle |
| **Modal / Dialog** | `250ms - 300ms` | `cubic-bezier(0.16, 1, 0.3, 1)` | Spatial zoom and backdrop fade |
| **Toast / Notification** | `250ms - 350ms` | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring-like) | Noticeable entrance from edge |
| **Node Selection (3D)** | `300ms - 500ms` | camera lerp / damped spring | Smooth camera translation to target |

### CSS GPU Acceleration & Reduced Motion Snippet

```css
/* Performant interactive button */
.btn-interactive {
  transition: transform 150ms cubic-bezier(0.16, 1, 0.3, 1),
              opacity 150ms ease-out;
  will-change: transform;
}

.btn-interactive:hover {
  transform: translateY(-1px) scale(1.02);
}

.btn-interactive:active {
  transform: translateY(0) scale(0.98);
}

/* Accessibility: Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Three.js / R3F Micro-Interactions

In 3D canvas, avoid re-rendering entire component trees for subtle animations. Use `useFrame` with math damping or lerping:

```tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function PulsingNode({ isSelected }: { isSelected: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Subtle scale breathing when selected
    const targetScale = isSelected 
      ? 1 + Math.sin(state.clock.elapsedTime * 4) * 0.08 
      : 1;

    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale), 
      delta * 10
    );
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[0.4, 16, 16]} />
      <meshStandardMaterial color={isSelected ? "#38bdf8" : "#94a3b8"} />
    </mesh>
  );
}
```

### Motion Checklist for PRs
- [ ] Only compositor properties (`transform`, `opacity`) are animated.
- [ ] No transitions exceed 350ms unless it is a deliberate 3D camera pan.
- [ ] `@media (prefers-reduced-motion)` is respected.
- [ ] No animation triggers continuous 100% CPU/GPU load while idle.
