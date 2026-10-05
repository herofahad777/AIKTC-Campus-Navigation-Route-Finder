import { describe, it, expect } from 'vitest';
import {
  countNodes,
  countEdges,
  findNodeById,
  resolveEdgeEndpoints,
  validateGraphData,
  getUndirectedEdgeKey,
  getRouteEdgeKeys,
  NodeItem,
  EdgeItem,
} from './graphViewerUtils';

describe('graphViewerUtils - Visualization Helpers (No Traversal)', () => {
  const sampleNodes: NodeItem[] = [
    { id: 'gate', name: 'Main Gate', x: 0, y: 0, z: 25 },
    { id: 'library', name: 'Library', x: 10, y: 0, z: 5 },
    { id: 'admin', name: 'Admin Block', x: 0, y: 0, z: 10 },
  ];

  const sampleEdges: EdgeItem[] = [
    { from: 'gate', to: 'library' },
    { from: 'admin', to: 'library' },
  ];

  describe('countNodes', () => {
    it('returns 0 for empty or null array', () => {
      expect(countNodes([])).toBe(0);
      expect(countNodes(null as unknown as NodeItem[])).toBe(0);
      expect(countNodes(undefined as unknown as NodeItem[])).toBe(0);
    });

    it('returns the exact count of nodes in the array', () => {
      expect(countNodes(sampleNodes)).toBe(3);
    });
  });

  describe('countEdges', () => {
    it('returns 0 for empty or null array', () => {
      expect(countEdges([])).toBe(0);
      expect(countEdges(null as unknown as EdgeItem[])).toBe(0);
      expect(countEdges(undefined as unknown as EdgeItem[])).toBe(0);
    });

    it('returns the exact count of edges in the array', () => {
      expect(countEdges(sampleEdges)).toBe(2);
    });
  });

  describe('findNodeById', () => {
    it('finds node when ID exists', () => {
      const node = findNodeById(sampleNodes, 'library');
      expect(node).toBeDefined();
      expect(node?.name).toBe('Library');
      expect(node?.x).toBe(10);
    });

    it('returns undefined when ID does not exist', () => {
      expect(findNodeById(sampleNodes, 'nonexistent')).toBeUndefined();
    });

    it('returns undefined when nodes array is null or empty', () => {
      expect(findNodeById([], 'library')).toBeUndefined();
      expect(findNodeById(null as unknown as NodeItem[], 'library')).toBeUndefined();
    });
  });

  describe('resolveEdgeEndpoints', () => {
    it('resolves endpoints for valid edges', () => {
      const resolved = resolveEdgeEndpoints(sampleEdges, sampleNodes);
      expect(resolved).toHaveLength(2);
      expect(resolved[0].isValid).toBe(true);
      expect(resolved[0].source?.id).toBe('gate');
      expect(resolved[0].target?.id).toBe('library');
      expect(resolved[1].isValid).toBe(true);
      expect(resolved[1].source?.id).toBe('admin');
      expect(resolved[1].target?.id).toBe('library');
    });

    it('flags edge as invalid when endpoint is unknown', () => {
      const brokenEdges: EdgeItem[] = [{ from: 'gate', to: 'unknown_building' }];
      const resolved = resolveEdgeEndpoints(brokenEdges, sampleNodes);
      expect(resolved).toHaveLength(1);
      expect(resolved[0].isValid).toBe(false);
      expect(resolved[0].source?.id).toBe('gate');
      expect(resolved[0].target).toBeUndefined();
    });

    it('handles empty edges or nodes safely', () => {
      expect(resolveEdgeEndpoints([], sampleNodes)).toEqual([]);
      expect(resolveEdgeEndpoints(sampleEdges, [])).toHaveLength(2);
      expect(resolveEdgeEndpoints(sampleEdges, [])[0].isValid).toBe(false);
    });
  });

  describe('validateGraphData', () => {
    it('returns no warnings for valid nodes and edges', () => {
      const warnings = validateGraphData(sampleNodes, sampleEdges);
      expect(warnings).toEqual([]);
    });

    it('detects duplicate node IDs', () => {
      const duplicateNodes: NodeItem[] = [
        { id: 'library', name: 'Library 1', x: 0, y: 0, z: 0 },
        { id: 'library', name: 'Library 2', x: 5, y: 0, z: 5 },
      ];
      const warnings = validateGraphData(duplicateNodes, []);
      const dupWarning = warnings.find((w) => w.type === 'duplicate_node_id');
      expect(dupWarning).toBeDefined();
      expect(dupWarning?.message).toContain('Duplicate node ID');
    });

    it('detects missing node IDs', () => {
      const missingIdNodes = [
        { id: '', name: 'Nameless', x: 0, y: 0, z: 0 },
      ] as NodeItem[];
      const warnings = validateGraphData(missingIdNodes, []);
      const missingWarning = warnings.find((w) => w.type === 'missing_node_id');
      expect(missingWarning).toBeDefined();
    });

    it('detects missing or non-numeric coordinates', () => {
      const invalidCoordNodes = [
        { id: 'node_bad', name: 'Bad Coords', x: NaN, y: 0, z: 0 },
        { id: 'node_missing', name: 'Missing Coords', x: 0 } as unknown as NodeItem,
      ];
      const warnings = validateGraphData(invalidCoordNodes, []);
      const coordWarnings = warnings.filter((w) => w.type === 'missing_coordinates');
      expect(coordWarnings.length).toBeGreaterThanOrEqual(2);
    });

    it('detects unknown edge endpoints (dangling references)', () => {
      const danglingEdges: EdgeItem[] = [
        { from: 'gate', to: 'mars_rover' },
        { from: 'lost_island', to: 'admin' },
      ];
      const warnings = validateGraphData(sampleNodes, danglingEdges);
      const unknownWarnings = warnings.filter((w) => w.type === 'unknown_edge_endpoint');
      expect(unknownWarnings.length).toBe(2);
    });

    it('detects self-referencing edges', () => {
      const selfEdges: EdgeItem[] = [{ from: 'gate', to: 'gate' }];
      const warnings = validateGraphData(sampleNodes, selfEdges);
      const selfWarning = warnings.find((w) => w.type === 'self_referencing_edge');
      expect(selfWarning).toBeDefined();
      expect(selfWarning?.message).toContain('Self-referencing');
    });
  });

  describe('edge key helpers', () => {
    it('generates canonical undirected edge keys regardless of parameter order', () => {
      expect(getUndirectedEdgeKey('gate', 'library')).toBe('gate<->library');
      expect(getUndirectedEdgeKey('library', 'gate')).toBe('gate<->library');
    });

    it('generates ordered array of undirected edge keys along a route path', () => {
      const path = ['gate', 'library', 'cs_dept'];
      expect(getRouteEdgeKeys(path)).toEqual(['gate<->library', 'cs_dept<->library']);
    });

    it('returns empty array when path has fewer than 2 nodes', () => {
      expect(getRouteEdgeKeys([])).toEqual([]);
      expect(getRouteEdgeKeys(['gate'])).toEqual([]);
    });
  });
});
