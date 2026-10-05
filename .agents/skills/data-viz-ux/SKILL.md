---
name: data-viz-ux
description: >
  Data visualization UX cheatsheet for 3D graphs, spatial UI, node-link diagrams,
  and campus wayfinding interfaces. Covers clutter reduction, progressive
  disclosure, semantic encoding, billboarding, and spatial wayfinding cues.
---

# Data Visualization UX (3D Graphs & Spatial UI) — Active Rules

> 3D graphs must justify their dimensionality. Use depth for spatial understanding, not decoration. Prioritize legibility and cognitive ease.

## ✅ DO

| Rule | Why |
|---|---|
| **Justify the 3rd dimension**: represent actual physical/campus coordinates $(x, y, z)$ | Avoids gratuitous 3D distortion; matches real-world spatial mental models |
| **Progressive Disclosure**: show node IDs and summary first; expand connections/weights on click | Prevents visual clutter ("hairball effect") in graph scenes |
| **Semantic color encoding**: assign consistent colors for node types (Gates, Depts, Facilities, Landmarks) | Users immediately categorize nodes without reading text |
| **Visual hierarchy on hover/selection**: dim unrelated nodes/edges, highlight adjacent paths | Isolates subgraphs for rapid cognitive processing |
| **Screen-aligned text (Billboard)** for labels in 3D | Labels remain readable at all camera tilt and rotation angles |
| **Provide 2D parallel representations**: table/list view alongside the 3D canvas | Accessibility fallback; faster search for experienced keyboard users |
| **Clear depth cues**: subtle shadows, ground grid, and vertical stems | Anchors floating 3D objects to a ground plane so height is obvious |

## ❌ DON'T

| Anti-Pattern | Alternative |
|---|---|
| Showing all node labels simultaneously at high density | Filter labels by zoom level, camera distance, or selection |
| Using 3D for non-spatial abstract metrics (e.g. 3D bar/pie charts) | Keep 3D strictly for physical spatial campus topologies |
| Low-contrast edge lines that blend into the background grid | Use contrasting accent colors for edges (`#475569` base, `#f59e0b` active) |
| Hard-to-click thin 3D lines | Add invisible larger bounding interaction cylinder/hitbox |
| Disorienting instant camera teleportation | Smooth camera transitions with `CameraControls` or lerp |

---

## Extended Reference

### Spatial Graph Visual Hierarchy

```
[Layer 1: Ground Plane]   → Grid helper + subtle campus boundary outline (Context)
[Layer 2: Stems]          → Vertical line/cylinder connecting ground to node $(x,0,z) \rightarrow (x,y,z)$
[Layer 3: Edges/Paths]    → Polyline segments showing navigable roads/walkways
[Layer 4: Nodes]          → Sphere meshes with category-specific colors
[Layer 5: Billboard HUD]  → Screen-facing label pill floating above selected/hovered node
```

### Campus Category Semantic Palette

| Category | Color Code | Role / Meaning |
|---|---|---|
| **Entrances / Gates** | `#10b981` (Emerald) | Entry and exit points |
| **Academic Buildings** | `#3b82f6` (Blue) | Lecture halls, departments, labs |
| **Administrative** | `#8b5cf6` (Purple) | Offices, registration, central admin |
| **Amenities / Food** | `#f59e0b` (Amber) | Cafeterias, sports, libraries |
| **Selected / Focused** | `#38bdf8` (Sky) | Currently inspected node |
| **Path / Route Traversed** | `#ef4444` (Crimson) | Highlighted route output |

### Progressive Disclosure Graph Component Example

```tsx
// Pattern: Focus + Context Subgraph Highlighting
export function EdgeLine({ edge, selectedNodeId }: { edge: CampusEdge; selectedNodeId: string | null }) {
  const isConnected = edge.source === selectedNodeId || edge.target === selectedNodeId;
  const opacity = selectedNodeId ? (isConnected ? 1.0 : 0.15) : 0.6;
  const color = isConnected ? "#f59e0b" : "#64748b";

  return (
    <line>
      <bufferGeometry {...getEdgeGeometry(edge)} />
      <lineBasicMaterial color={color} transparent opacity={opacity} linewidth={isConnected ? 3 : 1} />
    </line>
  );
}
```

### Interaction Affordance Matrix for 3D Nodes

| Event | Node State | Visual Feedback |
|---|---|---|
| **Default** | Normal | Base category color, standard size, subtle ground shadow |
| **Hover** | Highlighted | Cursor changes to pointer, scale 1.15x, label appears if hidden |
| **Click / Select** | Active | Camera glides to focus, bright glowing outline, inspector panel updates |
| **Unfocused (when another is selected)** | Dimmed | Opacity drops to 0.35, edge opacity drops to 0.15 |

### Spatial Data Visualization Checklist
- [ ] Nodes are anchored to ground with visual cues (stems or shadows).
- [ ] Camera transitions are smooth, maintaining user orientation.
- [ ] Hover and selection states give unambiguous feedback.
- [ ] Text labels remain legible regardless of camera orientation (Billboarding).
- [ ] An alternative list or search view is available for accessibility.
