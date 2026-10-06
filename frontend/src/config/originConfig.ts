/**
 * originConfig.ts
 *
 * Central Origin & Main Axis Control for Campus Navigation Route Finder.
 *
 * Defines the central world offset applied to every node in the campus graph.
 * Configured permanently via .env (VITE_CAMPUS_ORIGIN_X/Y/Z) or defaults to (0,0,0).
 *
 * All nodes and connecting edges are translated by (origin.x, origin.y, origin.z)
 * relative to the 3D world origin, grid, and orientation axes.
 */

import { NodeItem } from '../lib/graphViewerUtils';

export interface CampusOrigin {
  x: number;
  y: number;
  z: number;
}

function parseOriginCoord(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

export const campusOrigin: CampusOrigin = {
  x: parseOriginCoord(import.meta.env.VITE_CAMPUS_ORIGIN_X),
  y: parseOriginCoord(import.meta.env.VITE_CAMPUS_ORIGIN_Y),
  z: parseOriginCoord(import.meta.env.VITE_CAMPUS_ORIGIN_Z),
};

/**
 * Returns true if the central origin offset is non-zero.
 */
export function isOriginOffsetActive(origin: CampusOrigin = campusOrigin): boolean {
  return origin.x !== 0 || origin.y !== 0 || origin.z !== 0;
}

/**
 * Translates a single node's coordinates by the central origin offset.
 */
export function applyOriginOffset(node: NodeItem, origin: CampusOrigin = campusOrigin): NodeItem {
  return {
    ...node,
    x: node.x + origin.x,
    y: node.y + origin.y,
    z: node.z + origin.z,
  };
}

/**
 * Translates all nodes in an array by the central origin offset.
 */
export function applyOriginOffsetToAll(nodes: NodeItem[], origin: CampusOrigin = campusOrigin): NodeItem[] {
  if (!isOriginOffsetActive(origin)) {
    return nodes;
  }
  return nodes.map((node) => applyOriginOffset(node, origin));
}
