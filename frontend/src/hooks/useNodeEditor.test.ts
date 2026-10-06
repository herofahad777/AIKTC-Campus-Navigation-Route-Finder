import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useNodeEditor } from './useNodeEditor';
import { NodeItem, EdgeItem } from '../lib/graphViewerUtils';

describe('useNodeEditor Hook', () => {
  const mockNodes: NodeItem[] = [
    { id: 'gate', name: 'Main Gate', x: 0, y: 0, z: 25 },
    { id: 'library', name: 'Library', x: -15, y: 3, z: 5 },
    { id: 'admin', name: 'Admin Block', x: 0, y: 0, z: 10 },
  ];

  const mockEdges: EdgeItem[] = [
    { from: 'gate', to: 'library' },
    { from: 'gate', to: 'admin' },
    { from: 'admin', to: 'library' },
  ];

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('initializes with provided nodes and edges', () => {
    const { result } = renderHook(() =>
      useNodeEditor({
        initialNodes: mockNodes,
        initialEdges: mockEdges,
        enableLocalStorage: false,
      })
    );

    expect(result.current.nodes).toHaveLength(3);
    expect(result.current.edges).toHaveLength(3);
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('updates node name and coordinates', () => {
    const { result } = renderHook(() =>
      useNodeEditor({
        initialNodes: mockNodes,
        initialEdges: mockEdges,
        enableLocalStorage: false,
      })
    );

    act(() => {
      const res = result.current.updateNode('gate', {
        name: 'South Campus Gate',
        x: 5,
        y: 2,
        z: 30,
      });
      expect(res.success).toBe(true);
    });

    const updated = result.current.nodes.find((n) => n.id === 'gate');
    expect(updated?.name).toBe('South Campus Gate');
    expect(updated?.x).toBe(5);
    expect(updated?.y).toBe(2);
    expect(updated?.z).toBe(30);
    expect(result.current.hasUnsavedChanges).toBe(true);
  });

  it('cascades node ID changes to connecting edges', () => {
    const { result } = renderHook(() =>
      useNodeEditor({
        initialNodes: mockNodes,
        initialEdges: mockEdges,
        enableLocalStorage: false,
      })
    );

    act(() => {
      const res = result.current.updateNode('gate', { id: 'portal' }, true);
      expect(res.success).toBe(true);
    });

    // Node ID should be changed
    expect(result.current.nodes.find((n) => n.id === 'portal')).toBeDefined();
    expect(result.current.nodes.find((n) => n.id === 'gate')).toBeUndefined();

    // Edges referencing 'gate' should now reference 'portal'
    expect(result.current.edges).toEqual([
      { from: 'portal', to: 'library' },
      { from: 'portal', to: 'admin' },
      { from: 'admin', to: 'library' },
    ]);
  });

  it('prevents renaming to a duplicate or empty ID', () => {
    const { result } = renderHook(() =>
      useNodeEditor({
        initialNodes: mockNodes,
        initialEdges: mockEdges,
        enableLocalStorage: false,
      })
    );

    act(() => {
      const res = result.current.updateNode('gate', { id: 'library' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('already exists');
    });

    act(() => {
      const res = result.current.updateNode('gate', { id: '   ' });
      expect(res.success).toBe(false);
      expect(res.error).toContain('cannot be empty');
    });
  });

  it('nudges coordinates along X, Y, Z axes', () => {
    const { result } = renderHook(() =>
      useNodeEditor({
        initialNodes: mockNodes,
        initialEdges: mockEdges,
        enableLocalStorage: false,
      })
    );

    act(() => {
      result.current.nudgeNode('gate', 'x', 5);
      result.current.nudgeNode('gate', 'y', 1);
      result.current.nudgeNode('gate', 'z', -2);
    });

    const updated = result.current.nodes.find((n) => n.id === 'gate');
    expect(updated?.x).toBe(5);
    expect(updated?.y).toBe(1);
    expect(updated?.z).toBe(23);
  });

  it('snaps node to ground (Y = 0) and grid', () => {
    const { result } = renderHook(() =>
      useNodeEditor({
        initialNodes: mockNodes,
        initialEdges: mockEdges,
        enableLocalStorage: false,
      })
    );

    act(() => {
      result.current.updateNodePosition('library', -14.7, 3.8, 5.2);
    });

    act(() => {
      result.current.snapNodeToGround('library');
    });
    expect(result.current.nodes.find((n) => n.id === 'library')?.y).toBe(0);

    act(() => {
      result.current.snapNodeToGrid('library', 5);
    });
    const snapped = result.current.nodes.find((n) => n.id === 'library');
    expect(snapped?.x).toBe(-15);
    expect(snapped?.z).toBe(5);
  });

  it('adds, duplicates, and deletes nodes while cleaning edges', () => {
    const { result } = renderHook(() =>
      useNodeEditor({
        initialNodes: mockNodes,
        initialEdges: mockEdges,
        enableLocalStorage: false,
      })
    );

    let addedId = '';
    act(() => {
      const newNode = result.current.addNode({ name: 'Innovation Hub', x: 10, y: 0, z: -10 });
      addedId = newNode.id;
    });
    expect(result.current.nodes).toHaveLength(4);
    expect(result.current.nodes.find((n) => n.id === addedId)?.name).toBe('Innovation Hub');

    let clonedId = '';
    act(() => {
      const cloned = result.current.duplicateNode(addedId);
      clonedId = cloned?.id || '';
    });
    expect(result.current.nodes).toHaveLength(5);
    expect(result.current.nodes.find((n) => n.id === clonedId)?.name).toContain('Copy');

    // Delete node and verify edges cleanup
    act(() => {
      result.current.deleteNode('gate', true);
    });
    expect(result.current.nodes.find((n) => n.id === 'gate')).toBeUndefined();
    // Edges with 'gate' removed, only admin->library remains
    expect(result.current.edges).toEqual([{ from: 'admin', to: 'library' }]);
  });

  it('reverts all changes to initial nodes and edges', () => {
    const { result } = renderHook(() =>
      useNodeEditor({
        initialNodes: mockNodes,
        initialEdges: mockEdges,
        enableLocalStorage: false,
      })
    );

    act(() => {
      result.current.updateNode('gate', { name: 'Changed Name' });
      result.current.deleteNode('admin');
    });
    expect(result.current.nodes).toHaveLength(2);

    act(() => {
      result.current.revertAll();
    });
    expect(result.current.nodes).toHaveLength(3);
    expect(result.current.nodes.find((n) => n.id === 'gate')?.name).toBe('Main Gate');
    expect(result.current.hasUnsavedChanges).toBe(false);
  });

  it('adds and deletes edges with validation', () => {
    const { result } = renderHook(() =>
      useNodeEditor({
        initialNodes: mockNodes,
        initialEdges: [
          { from: 'gate', to: 'admin' },
        ],
        enableLocalStorage: false,
      })
    );

    // 1. Add valid edge gate -> library
    act(() => {
      const res = result.current.addEdge('gate', 'library');
      expect(res.success).toBe(true);
    });
    expect(result.current.edges).toHaveLength(2);
    expect(result.current.edges).toContainEqual({ from: 'gate', to: 'library' });

    // 2. Prevent self-loop
    act(() => {
      const res = result.current.addEdge('gate', 'gate');
      expect(res.success).toBe(false);
      expect(res.error).toContain('itself');
    });

    // 3. Prevent duplicate edge (even in reverse direction)
    act(() => {
      const res = result.current.addEdge('library', 'gate');
      expect(res.success).toBe(false);
      expect(res.error).toContain('already exists');
    });

    // 4. Delete edge
    act(() => {
      const deleted = result.current.deleteEdge('gate', 'admin');
      expect(deleted).toBe(true);
    });
    expect(result.current.edges).toEqual([{ from: 'gate', to: 'library' }]);
  });
});
