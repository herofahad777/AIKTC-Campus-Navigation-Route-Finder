---
name: r3f-3d-ux
description: >
  React Three Fiber (R3F) + Drei 3D scene UX cheatsheet for the Campus
  Navigation Route Finder. Covers camera controls, event handling, performance,
  spatial UI layering, and WebGL billboard/label patterns specific to this project.
---

# R3F / Three.js 3D UX — Active Rules

> These rules apply to all code inside `<Canvas>` and components that import from
> `@react-three/fiber` or `@react-three/drei`.

## ✅ DO

| Rule | Why |
|---|---|
| Use **`CameraControls`** (drei) instead of `OrbitControls` | Smooth programmatic transitions (lerp/ease); better UX |
| Use **mutable refs** for per-frame 3D mutations | Bypass React reconciliation; keep 60fps |
| Set `frameloop="demand"` on static/low-interaction scenes | Saves GPU; only re-renders on interaction |
| Use **`Billboard` + `Text`** (drei) for node labels | WebGL-native; always faces camera; no DOM race conditions |
| Layer 2D HTML panels **outside** the `<Canvas>` element | High-perf overlays; no `Html` component overhead |
| Handle pointer events declaratively: `onPointerOver`, `onClick` on meshes | Mirrors standard React event model |
| Use `useThree()` to read canvas size for responsive camera | No hardcoded FOV or positions |

## ❌ DON'T

| Anti-Pattern | Alternative |
|---|---|
| Mutate React state inside `useFrame` | Mutate a ref; setState on event handlers only |
| `<Html>` component (drei) for labels inside Canvas | `<Billboard><Text>` for stable WebGL labels |
| Hard-code camera position without reading viewport | `useThree({ viewport })` + responsive calc |
| Skip `frameloop="demand"` on static graphs | Always set it; invalidate manually on user events |
| Render complex DOM components inside Canvas | Place them outside Canvas as overlay divs |
| Ignore context loss | Add `webglcontextlost` listener; show fallback |

---

## Extended Reference

### Project Architecture: Canvas vs. HTML Layers

```
App.tsx
├── <div class="layout">                   ← HTML layer (Tailwind)
│   ├── <ControlPanel />                   ← sidebar: node list, mode toggle
│   ├── <Canvas frameloop="demand">        ← WebGL layer
│   │   ├── <CameraControls />
│   │   ├── <Scene />
│   │   │   ├── <NodeMesh />              ← sphere + Billboard label
│   │   │   │   ├── <NodeLabel />         ← Billboard > Text
│   │   │   │   └── <NodeStem />          ← cylinder stem
│   │   │   └── <Edges />                 ← Line segments
│   └── <InfoPanel />                      ← node inspector overlay
```

### CameraControls Usage

```tsx
import { CameraControls } from "@react-three/drei";
import { useRef } from "react";

const controlsRef = useRef<CameraControls>(null);

// Smooth fly-to on node click:
const flyToNode = (pos: [number, number, number]) => {
  controlsRef.current?.setLookAt(
    pos[0], pos[1] + 3, pos[2] + 5,  // camera position
    pos[0], pos[1], pos[2],           // look-at target
    true                               // enable transition
  );
};

<CameraControls ref={controlsRef} />
```

### Demand Rendering + Invalidation

```tsx
import { useThree } from "@react-three/fiber";

function NodeMesh({ ... }) {
  const { invalidate } = useThree();

  const handleClick = () => {
    onSelect(node.id);
    invalidate(); // trigger re-render
  };
  ...
}

// Canvas setup:
<Canvas frameloop="demand">
```

### Ref-based per-frame mutation (avoid state in useFrame)

```tsx
const meshRef = useRef<THREE.Mesh>(null);

useFrame((_, delta) => {
  if (meshRef.current && isSelected) {
    meshRef.current.rotation.y += delta * 0.5; // direct mutation ✅
  }
});
```

### Billboard Label (project standard)

```tsx
// components/NodeLabel.tsx
import { Billboard, Text } from "@react-three/drei";

export function NodeLabel({ label, color }: { label: string; color: string }) {
  return (
    <Billboard position={[0, 1.4, 0]}>
      {/* Background pill */}
      <mesh>
        <planeGeometry args={[label.length * 0.14 + 0.3, 0.38]} />
        <meshBasicMaterial color="#0f172a" transparent opacity={0.85} />
      </mesh>
      <Text fontSize={0.22} color={color} anchorX="center" anchorY="middle">
        {label}
      </Text>
    </Billboard>
  );
}
```

### Context Loss Handler

```tsx
useEffect(() => {
  const canvas = document.querySelector("canvas");
  canvas?.addEventListener("webglcontextlost", () => {
    setHasFallback(true);
  });
}, []);
```

### Performance Checklist

- [ ] `frameloop="demand"` on `<Canvas>`
- [ ] `invalidate()` called on every user interaction that changes 3D state
- [ ] No `setState` inside `useFrame`
- [ ] Mesh geometries shared via `useMemo` or `useGLTF` caching
- [ ] `Suspense` wrapping for any async asset loading
