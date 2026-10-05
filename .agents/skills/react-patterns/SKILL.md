---
name: react-patterns
description: >
  React component design patterns and atomic design cheatsheet for the Campus
  Navigation Route Finder project. Covers compound components, custom hooks,
  feature-based colocation, and TypeScript prop interfaces.
---

# React Patterns — Active Rules

> Use these rules on every React/TypeScript file you write or review in this project.

## ✅ DO

| Rule | Why |
|---|---|
| **Custom hooks for all logic reuse** — prefix with `use` | Avoids HOC wrapper hell; logic stays testable |
| **Compound components** for multi-part UI groups (panels, tabs, modals) | Clean HTML-like API, no prop drilling |
| **Colocate** sub-components that are only used by one parent | Reduces folder-jumping; keeps context together |
| **TypeScript `interface` for all props** | Predictable, self-documenting contracts |
| **Separate stateful logic from JSX** (container/presentational *principle*, not rigid folders) | Keeps components clean and independently testable |
| **Composition over configuration** — prefer `children` / slots over mega-prop objects | More flexible; consumers control layout |

## ❌ DON'T

| Anti-Pattern | Alternative |
|---|---|
| HOCs or Render Props for logic sharing | Custom hook |
| Prop drilling more than 2 levels | Context or compound component |
| "Mega component" with 10+ props controlling layout | Split into subcomponents; use `children` |
| Global `atoms/molecules/organisms/` folders | Feature folders: `components/NodeMesh/index.tsx` |
| Premature abstraction (DRY before pain) | Repeat twice, then extract |

---

## Extended Reference

### Folder Structure (this project)

```
frontend/src/
  components/          ← 3D scene components (R3F world)
    NodeMesh.tsx
    NodeLabel.tsx
    NodeStem.tsx
    Edges.tsx
    Scene.tsx
  panels/              ← 2D HTML overlay panels (sidebar, inspector)
    InfoPanel.tsx
    ControlPanel.tsx
  hooks/               ← Custom hooks (useNodeSelection, useGraphData)
  lib/                 ← Pure utilities, no React
  data/                ← JSON datasets
```

### Compound Component Pattern (example)

```tsx
// Usage:
<InfoPanel>
  <InfoPanel.Header title="Node Info" />
  <InfoPanel.Body>...</InfoPanel.Body>
</InfoPanel>

// Implementation:
const InfoPanel = ({ children }) => <aside>{children}</aside>;
InfoPanel.Header = ({ title }) => <h2>{title}</h2>;
InfoPanel.Body = ({ children }) => <div>{children}</div>;
```

### Custom Hook Pattern (example)

```tsx
// hooks/useNodeSelection.ts
export function useNodeSelection(nodes: Node[]) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedNode = useMemo(
    () => nodes.find(n => n.id === selected) ?? null,
    [nodes, selected]
  );
  return { selected, setSelected, selectedNode };
}
```

### TypeScript Props (always explicit)

```tsx
interface NodeMeshProps {
  node: CampusNode;
  isSelected: boolean;
  onSelect: (id: string) => void;
}
```

### Key Ponytail Constraint

> **Never abstract until you have 2+ real uses.** Repeat code once — extract on the second repetition.
