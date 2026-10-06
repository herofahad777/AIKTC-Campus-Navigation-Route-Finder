import { describe, it, expect } from 'vitest';
import {
  campusOrigin,
  applyOriginOffset,
  applyOriginOffsetToAll,
  isOriginOffsetActive,
  CampusOrigin,
} from './originConfig';
import { NodeItem } from '../lib/graphViewerUtils';

describe('originConfig - Central Origin Main Axis Control', () => {
  const sampleNode: NodeItem = {
    id: 'test_node',
    name: 'Test Node',
    x: 10,
    y: 5,
    z: -15,
  };

  const sampleNodes: NodeItem[] = [
    { id: 'n1', name: 'Node 1', x: 0, y: 0, z: 0 },
    { id: 'n2', name: 'Node 2', x: 20, y: 10, z: -30 },
  ];

  it('provides default campusOrigin with numeric coordinates', () => {
    expect(typeof campusOrigin.x).toBe('number');
    expect(typeof campusOrigin.y).toBe('number');
    expect(typeof campusOrigin.z).toBe('number');
  });

  it('detects whether origin offset is active or zero', () => {
    expect(isOriginOffsetActive({ x: 0, y: 0, z: 0 })).toBe(false);
    expect(isOriginOffsetActive({ x: 5, y: 0, z: 0 })).toBe(true);
    expect(isOriginOffsetActive({ x: 0, y: -2, z: 0 })).toBe(true);
    expect(isOriginOffsetActive({ x: 0, y: 0, z: 10 })).toBe(true);
  });

  it('translates a node coordinates by custom origin offset', () => {
    const customOrigin: CampusOrigin = { x: 5, y: 10, z: -5 };
    const offsetNode = applyOriginOffset(sampleNode, customOrigin);

    expect(offsetNode.x).toBe(15);
    expect(offsetNode.y).toBe(15);
    expect(offsetNode.z).toBe(-20);
    expect(offsetNode.id).toBe('test_node');
    expect(offsetNode.name).toBe('Test Node');
  });

  it('translates all nodes in an array when origin offset is active', () => {
    const customOrigin: CampusOrigin = { x: -10, y: 5, z: 20 };
    const offsetNodes = applyOriginOffsetToAll(sampleNodes, customOrigin);

    expect(offsetNodes[0].x).toBe(-10);
    expect(offsetNodes[0].y).toBe(5);
    expect(offsetNodes[0].z).toBe(20);

    expect(offsetNodes[1].x).toBe(10);
    expect(offsetNodes[1].y).toBe(15);
    expect(offsetNodes[1].z).toBe(-10);
  });

  it('returns original node list unchanged when origin offset is (0,0,0)', () => {
    const zeroOrigin: CampusOrigin = { x: 0, y: 0, z: 0 };
    const result = applyOriginOffsetToAll(sampleNodes, zeroOrigin);
    expect(result).toBe(sampleNodes);
  });
});
