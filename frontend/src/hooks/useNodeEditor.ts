import { useState, useCallback, useEffect } from 'react';
import { NodeItem, EdgeItem } from '../lib/graphViewerUtils';

export interface UseNodeEditorOptions {
  initialNodes: NodeItem[];
  initialEdges: EdgeItem[];
  enableLocalStorage?: boolean;
}

export interface UseNodeEditorReturn {
  nodes: NodeItem[];
  edges: EdgeItem[];
  hasUnsavedChanges: boolean;
  updateNode: (
    oldId: string,
    updates: Partial<NodeItem>,
    cascadeIdToEdges?: boolean
  ) => { success: boolean; error?: string };
  updateNodePosition: (id: string, x: number, y: number, z: number) => void;
  nudgeNode: (id: string, axis: 'x' | 'y' | 'z', delta: number) => void;
  snapNodeToGround: (id: string) => void;
  snapNodeToGrid: (id: string, step?: number) => void;
  addNode: (custom?: Partial<NodeItem>) => NodeItem;
  duplicateNode: (id: string) => NodeItem | null;
  deleteNode: (id: string, purgeEdges?: boolean) => boolean;
  addEdge: (from: string, to: string) => { success: boolean; error?: string };
  deleteEdge: (from: string, to: string) => boolean;
  revertNode: (id: string) => void;
  revertAll: () => void;
  saveToDisk: () => Promise<{ success: boolean; error?: string }>;
  exportJson: () => string;
}

const STORAGE_KEY_NODES = 'campus_nav_nodes_draft';
const STORAGE_KEY_EDGES = 'campus_nav_edges_draft';

export function useNodeEditor({
  initialNodes,
  initialEdges,
  enableLocalStorage = true,
}: UseNodeEditorOptions): UseNodeEditorReturn {
  const [nodes, setNodes] = useState<NodeItem[]>(() => {
    if (enableLocalStorage && typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_NODES);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // Fallback to initial
      }
    }
    return initialNodes;
  });

  const [edges, setEdges] = useState<EdgeItem[]>(() => {
    if (enableLocalStorage && typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY_EDGES);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch {
        // Fallback to initial
      }
    }
    return initialEdges;
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    if (enableLocalStorage && typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY_NODES, JSON.stringify(nodes));
        window.localStorage.setItem(STORAGE_KEY_EDGES, JSON.stringify(edges));
      } catch {
        // Ignore storage errors
      }
    }
  }, [nodes, edges, enableLocalStorage]);

  // Update node metadata or position
  const updateNode = useCallback(
    (
      oldId: string,
      updates: Partial<NodeItem>,
      cascadeIdToEdges: boolean = true
    ): { success: boolean; error?: string } => {
      const targetIndex = nodes.findIndex((n) => n.id === oldId);
      if (targetIndex === -1) {
        return { success: false, error: `Node with id "${oldId}" not found.` };
      }

      // If ID is changing, ensure uniqueness
      if (updates.id && updates.id !== oldId) {
        const trimmedNewId = updates.id.trim();
        if (!trimmedNewId) {
          return { success: false, error: 'Node ID cannot be empty.' };
        }
        if (nodes.some((n) => n.id === trimmedNewId)) {
          return {
            success: false,
            error: `A node with ID "${trimmedNewId}" already exists.`,
          };
        }
        updates.id = trimmedNewId;
      }

      const updatedNode = { ...nodes[targetIndex], ...updates };
      const newNodes = [...nodes];
      newNodes[targetIndex] = updatedNode;
      setNodes(newNodes);
      setHasUnsavedChanges(true);

      // Cascade ID change to edges
      if (updates.id && updates.id !== oldId && cascadeIdToEdges) {
        const newId = updates.id;
        setEdges((prevEdges) =>
          prevEdges.map((e) => {
            const matchFrom = e.from === oldId;
            const matchTo = e.to === oldId;
            if (!matchFrom && !matchTo) return e;
            return {
              ...e,
              from: matchFrom ? newId : e.from,
              to: matchTo ? newId : e.to,
            };
          })
        );
      }

      return { success: true };
    },
    [nodes]
  );

  // Direct coordinate update
  const updateNodePosition = useCallback(
    (id: string, x: number, y: number, z: number) => {
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, x, y, z } : n))
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  // Nudge along specific axis
  const nudgeNode = useCallback(
    (id: string, axis: 'x' | 'y' | 'z', delta: number) => {
      setNodes((prev) =>
        prev.map((n) => {
          if (n.id !== id) return n;
          return {
            ...n,
            [axis]: Math.round((n[axis] + delta) * 10) / 10,
          };
        })
      );
      setHasUnsavedChanges(true);
    },
    []
  );

  // Snap to ground (Y = 0)
  const snapNodeToGround = useCallback((id: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, y: 0 } : n))
    );
    setHasUnsavedChanges(true);
  }, []);

  // Snap to nearest grid step
  const snapNodeToGrid = useCallback((id: string, step: number = 1) => {
    setNodes((prev) =>
      prev.map((n) => {
        if (n.id !== id) return n;
        return {
          ...n,
          x: Math.round(n.x / step) * step,
          y: Math.round(n.y / step) * step,
          z: Math.round(n.z / step) * step,
        };
      })
    );
    setHasUnsavedChanges(true);
  }, []);

  // Add new node
  const addNode = useCallback(
    (custom?: Partial<NodeItem>): NodeItem => {
      const timestamp = Date.now().toString(36).slice(-4);
      let newId = custom?.id || `node_${timestamp}`;
      let counter = 1;
      while (nodes.some((n) => n.id === newId)) {
        newId = `node_${timestamp}_${counter++}`;
      }

      const newNode: NodeItem = {
        id: newId,
        name: custom?.name || `New Location ${newId}`,
        x: custom?.x ?? 0,
        y: custom?.y ?? 0,
        z: custom?.z ?? 0,
      };

      setNodes((prev) => [...prev, newNode]);
      setHasUnsavedChanges(true);
      return newNode;
    },
    [nodes]
  );

  // Duplicate an existing node
  const duplicateNode = useCallback(
    (id: string): NodeItem | null => {
      const source = nodes.find((n) => n.id === id);
      if (!source) return null;

      let newId = `${source.id}_copy`;
      let counter = 2;
      while (nodes.some((n) => n.id === newId)) {
        newId = `${source.id}_copy${counter++}`;
      }

      const clonedNode: NodeItem = {
        ...source,
        id: newId,
        name: `${source.name} (Copy)`,
        x: source.x + 3,
        y: source.y,
        z: source.z + 3,
      };

      setNodes((prev) => [...prev, clonedNode]);
      setHasUnsavedChanges(true);
      return clonedNode;
    },
    [nodes]
  );

  // Delete node and clean up connected edges
  const deleteNode = useCallback(
    (id: string, purgeEdges: boolean = true): boolean => {
      const exists = nodes.some((n) => n.id === id);
      if (!exists) return false;

      setNodes((prev) => prev.filter((n) => n.id !== id));
      if (purgeEdges) {
        setEdges((prev) => prev.filter((e) => e.from !== id && e.to !== id));
      }
      setHasUnsavedChanges(true);
      return true;
    },
    [nodes]
  );

  // Add an edge connecting two nodes
  const addEdge = useCallback(
    (from: string, to: string): { success: boolean; error?: string } => {
      const cleanFrom = from.trim();
      const cleanTo = to.trim();

      if (!cleanFrom || !cleanTo) {
        return { success: false, error: 'Source and target nodes are required.' };
      }

      if (cleanFrom === cleanTo) {
        return { success: false, error: 'Cannot connect a node to itself.' };
      }

      const hasFrom = nodes.some((n) => n.id === cleanFrom);
      const hasTo = nodes.some((n) => n.id === cleanTo);
      if (!hasFrom || !hasTo) {
        return { success: false, error: 'Both connected nodes must exist in the campus graph.' };
      }

      const alreadyExists = edges.some(
        (e) =>
          (e.from === cleanFrom && e.to === cleanTo) ||
          (e.from === cleanTo && e.to === cleanFrom)
      );
      if (alreadyExists) {
        return { success: false, error: 'A pathway between these nodes already exists.' };
      }

      const newEdge: EdgeItem = { from: cleanFrom, to: cleanTo };
      setEdges((prev) => [...prev, newEdge]);
      setHasUnsavedChanges(true);
      return { success: true };
    },
    [nodes, edges]
  );

  // Delete an edge connecting two nodes
  const deleteEdge = useCallback(
    (from: string, to: string): boolean => {
      const exists = edges.some(
        (e) =>
          (e.from === from && e.to === to) ||
          (e.from === to && e.to === from)
      );
      if (!exists) return false;

      setEdges((prev) =>
        prev.filter(
          (e) =>
            !(
              (e.from === from && e.to === to) ||
              (e.from === to && e.to === from)
            )
        )
      );
      setHasUnsavedChanges(true);
      return true;
    },
    [edges]
  );

  // Revert a single node to initial state
  const revertNode = useCallback(
    (id: string) => {
      const original = initialNodes.find((n) => n.id === id);
      if (!original) return;
      setNodes((prev) => prev.map((n) => (n.id === id ? { ...original } : n)));
      setHasUnsavedChanges(true);
    },
    [initialNodes]
  );

  // Revert all changes
  const revertAll = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setHasUnsavedChanges(false);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_KEY_NODES);
      window.localStorage.removeItem(STORAGE_KEY_EDGES);
    }
  }, [initialNodes, initialEdges]);

  // Save to disk via Vite dev-server API
  const saveToDisk = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const res = await fetch('/api/nodes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes, edges }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return {
          success: false,
          error: errJson.error || `Server responded with ${res.status}`,
        };
      }
      setHasUnsavedChanges(false);
      return { success: true };
    } catch (err) {
      return { success: false, error: (err as Error).message };
    }
  }, [nodes, edges]);

  // Export JSON string
  const exportJson = useCallback((): string => {
    return JSON.stringify(nodes, null, 2);
  }, [nodes]);

  return {
    nodes,
    edges,
    hasUnsavedChanges,
    updateNode,
    updateNodePosition,
    nudgeNode,
    snapNodeToGround,
    snapNodeToGrid,
    addNode,
    duplicateNode,
    deleteNode,
    addEdge,
    deleteEdge,
    revertNode,
    revertAll,
    saveToDisk,
    exportJson,
  };
}
