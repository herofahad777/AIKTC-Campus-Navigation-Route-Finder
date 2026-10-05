import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { NodeItem } from '../lib/graphViewerUtils';
import { NodeLabel } from './NodeLabel';
import { NodeStem } from './NodeStem';

export interface NodeMeshProps {
  node: NodeItem;
  isSelected: boolean;
  isNeighbor: boolean;
  onSelect: (node: NodeItem) => void;
  showLabels: boolean;
  debugMode: boolean;
  // Route specific props
  isSource?: boolean;
  isDestination?: boolean;
  isRouteWaypoint?: boolean;
  isIlluminated?: boolean;
  isCurrentStep?: boolean;
  isRouteActive?: boolean;
}

/**
 * Modular Node component composing the interactive sphere,
 * ground elevation stem, and 3D billboard label with route navigation highlights.
 */
export const NodeMesh: React.FC<NodeMeshProps> = ({
  node,
  isSelected,
  isNeighbor,
  onSelect,
  showLabels,
  debugMode,
  isSource = false,
  isDestination = false,
  isRouteWaypoint = false,
  isIlluminated = false,
  isCurrentStep = false,
  isRouteActive = false,
}) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const position: [number, number, number] = [node.x, node.y, node.z];

  // Visual styling calculation
  let sphereColor = '#06B6D4'; // Cyan default
  let emissiveColor = '#083344';
  let emissiveIntensity = 0.2;
  let scale = 1.0;
  let opacity = 1.0;

  if (isSource) {
    sphereColor = '#10B981'; // Emerald
    emissiveColor = '#064E3B';
    emissiveIntensity = 0.85;
    scale = isCurrentStep ? 1.45 : 1.35;
  } else if (isDestination) {
    sphereColor = '#F43F5E'; // Crimson
    emissiveColor = '#4C0519';
    emissiveIntensity = 0.85;
    scale = isCurrentStep ? 1.45 : 1.35;
  } else if (isCurrentStep) {
    sphereColor = '#F59E0B'; // Amber pulse
    emissiveColor = '#78350F';
    emissiveIntensity = 0.9;
    scale = 1.4;
  } else if (isIlluminated) {
    sphereColor = '#38BDF8'; // Sky blue illuminated
    emissiveColor = '#0C4A6E';
    emissiveIntensity = 0.6;
    scale = 1.25;
  } else if (isRouteWaypoint) {
    sphereColor = '#60A5FA'; // Route ahead, not yet traversed
    emissiveColor = '#1D4ED8';
    emissiveIntensity = 0.4;
    scale = 1.15;
  } else if (isRouteActive) {
    // Non-route campus nodes: Clearly visible but noticeably unselected (muted slate metallic)
    sphereColor = '#64748B'; // Slate-500 clearly visible
    emissiveColor = '#1E293B';
    emissiveIntensity = 0.2;
    scale = 0.95;
    opacity = 0.85;
  } else if (isSelected) {
    sphereColor = '#F59E0B'; // Amber highlight
    emissiveColor = '#78350F';
    emissiveIntensity = 0.8;
    scale = 1.35;
  } else if (isNeighbor) {
    sphereColor = '#10B981'; // Emerald neighbor
    emissiveColor = '#064E3B';
    emissiveIntensity = 0.6;
    scale = 1.15;
  } else if (hovered) {
    sphereColor = '#38BDF8';
    emissiveColor = '#0284C7';
    emissiveIntensity = 0.5;
    scale = 1.2;
  }

  // Label visibility logic
  const isLabelVisible =
    isSource ||
    isDestination ||
    isCurrentStep ||
    (isIlluminated && isRouteActive) ||
    showLabels ||
    isSelected ||
    hovered ||
    debugMode;

  const roleBadge = isSource
    ? 'START'
    : isDestination
    ? 'DEST'
    : isCurrentStep
    ? 'ACTIVE'
    : undefined;

  const coordsText = debugMode || isSelected ? `[${node.x}, ${node.y}, ${node.z}]` : undefined;

  return (
    <group position={position}>
      {/* Node Interactive Sphere */}
      <mesh
        ref={meshRef}
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => {
          setHovered(false);
        }}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshStandardMaterial
          color={sphereColor}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.3}
          metalness={isRouteActive && !isRouteWaypoint && !isSource && !isDestination ? 0.6 : 0.4}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Ring Halo Indicators */}
      {isSource && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.15, 1.4, 32]} />
          <meshBasicMaterial color="#10B981" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}

      {isDestination && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.15, 1.4, 32]} />
          <meshBasicMaterial color="#F43F5E" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      )}

      {(isSelected || isCurrentStep) && !isSource && !isDestination && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.3, 32]} />
          <meshBasicMaterial color="#F59E0B" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Modular Elevation Stem */}
      <NodeStem elevation={node.y} />

      {/* Modular 3D Billboard Label */}
      <NodeLabel
        name={node.name}
        coordsText={coordsText}
        roleBadge={roleBadge}
        isSelected={isSelected}
        isNeighbor={isNeighbor}
        isSource={isSource}
        isDestination={isDestination}
        isIlluminated={isIlluminated}
        visible={isLabelVisible}
        position={[0, 1.4, 0]}
      />
    </group>
  );
};
