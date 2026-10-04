/**
 * graphViewerUtils.ts
 *
 * VISUALIZATION HELPERS ONLY.
 *
 * CRITICAL DIRECTIVE:
 * This file is NOT a graph algorithm implementation.
 * It strictly performs visual mapping, endpoint resolution for 3D lines,
 * and data integrity validation warnings.
 *
 * Under no circumstances does this file compute routes, queues, or traversals.
 */

export interface NodeItem {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  [key: string]: unknown;
}

export interface EdgeItem {
  from: string;
  to: string;
  [key: string]: unknown;
}

export interface ResolvedEdge {
  edge: EdgeItem;
  source?: NodeItem;
  target?: NodeItem;
  isValid: boolean;
}

export type WarningType =
  | 'duplicate_node_id'
  | 'missing_node_id'
  | 'missing_coordinates'
  | 'unknown_edge_endpoint'
  | 'self_referencing_edge';

export interface ValidationWarning {
  type: WarningType;
  message: string;
  itemId?: string;
}

/**
 * Returns the count of nodes in the array.
 */
export function countNodes(nodes: NodeItem[] | null | undefined): number {
  if (!Array.isArray(nodes)) return 0;
  return nodes.length;
}

/**
 * Returns the count of edges in the array.
 */
export function countEdges(edges: EdgeItem[] | null | undefined): number {
  if (!Array.isArray(edges)) return 0;
  return edges.length;
}

/**
 * Finds a node by its unique string identifier.
 */
export function findNodeById(
  nodes: NodeItem[] | null | undefined,
  id: string
): NodeItem | undefined {
  if (!Array.isArray(nodes) || !id) return undefined;
  return nodes.find((node) => node && node.id === id);
}

/**
 * Resolves 3D endpoints (source and target nodes) for edge rendering.
 * Does not perform traversal or path calculation.
 */
export function resolveEdgeEndpoints(
  edges: EdgeItem[] | null | undefined,
  nodes: NodeItem[] | null | undefined
): ResolvedEdge[] {
  if (!Array.isArray(edges)) return [];
  const nodeList = Array.isArray(nodes) ? nodes : [];
  const nodeMap = new Map<string, NodeItem>();

  for (const node of nodeList) {
    if (node && node.id) {
      nodeMap.set(node.id, node);
    }
  }

  return edges.map((edge) => {
    const source = edge && edge.from ? nodeMap.get(edge.from) : undefined;
    const target = edge && edge.to ? nodeMap.get(edge.to) : undefined;
    const isValid = Boolean(source && target);

    return {
      edge,
      source,
      target,
      isValid,
    };
  });
}

/**
 * Validates node and edge datasets for inconsistencies and issues warnings.
 * Does NOT modify data or block rendering.
 */
export function validateGraphData(
  nodes: NodeItem[] | null | undefined,
  edges: EdgeItem[] | null | undefined
): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const nodeList = Array.isArray(nodes) ? nodes : [];
  const edgeList = Array.isArray(edges) ? edges : [];

  const seenNodeIds = new Set<string>();

  // Validate Nodes
  for (let i = 0; i < nodeList.length; i++) {
    const node = nodeList[i];
    if (!node || !node.id || typeof node.id !== 'string' || node.id.trim() === '') {
      warnings.push({
        type: 'missing_node_id',
        message: `Node at index ${i} is missing a valid 'id' attribute.`,
      });
      continue;
    }

    if (seenNodeIds.has(node.id)) {
      warnings.push({
        type: 'duplicate_node_id',
        message: `Duplicate node ID detected: "${node.id}". Each node must have a unique ID.`,
        itemId: node.id,
      });
    } else {
      seenNodeIds.add(node.id);
    }

    const hasValidCoords =
      typeof node.x === 'number' &&
      !Number.isNaN(node.x) &&
      typeof node.y === 'number' &&
      !Number.isNaN(node.y) &&
      typeof node.z === 'number' &&
      !Number.isNaN(node.z);

    if (!hasValidCoords) {
      warnings.push({
        type: 'missing_coordinates',
        message: `Node "${node.id}" has invalid or missing coordinates (x: ${node.x}, y: ${node.y}, z: ${node.z}).`,
        itemId: node.id,
      });
    }
  }

  // Validate Edges
  for (let i = 0; i < edgeList.length; i++) {
    const edge = edgeList[i];
    if (!edge) continue;

    if (edge.from && edge.to && edge.from === edge.to) {
      warnings.push({
        type: 'self_referencing_edge',
        message: `Self-referencing edge detected on node "${edge.from}".`,
        itemId: edge.from,
      });
    }

    if (edge.from && !seenNodeIds.has(edge.from)) {
      warnings.push({
        type: 'unknown_edge_endpoint',
        message: `Edge references unknown source node "${edge.from}".`,
        itemId: edge.from,
      });
    }

    if (edge.to && !seenNodeIds.has(edge.to)) {
      warnings.push({
        type: 'unknown_edge_endpoint',
        message: `Edge references unknown target node "${edge.to}".`,
        itemId: edge.to,
      });
    }
  }

  return warnings;
}
