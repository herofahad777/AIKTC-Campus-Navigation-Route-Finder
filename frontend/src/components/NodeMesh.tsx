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
}

/**
 * Modular Node component composing the interactive sphere,
 * ground elevation stem, and 3D billboard label.
 */
export const NodeMesh: React.FC<NodeMeshProps> = ({
  node,
  isSelected,
  isNeighbor,
  onSelect,
  showLabels,
  debugMode,
}) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  const position: [number, number, number] = [node.x, node.y, node.z];

  // Visual styling states
  let sphereColor = '#06B6D4'; // Cyan default
  let emissiveColor = '#083344';
  let scale = 1.0;

  if (isSelected) {
    sphereColor = '#F59E0B'; // Amber highlight
    emissiveColor = '#78350F';
    scale = 1.35;
  } else if (isNeighbor) {
    sphereColor = '#10B981'; // Emerald neighbor
    emissiveColor = '#064E3B';
    scale = 1.15;
  } else if (hovered) {
    sphereColor = '#38BDF8';
    scale = 1.2;
  }

  const isLabelVisible = showLabels || isSelected || hovered || debugMode;
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
          emissiveIntensity={isSelected ? 0.8 : hovered ? 0.5 : 0.2}
          roughness={0.25}
          metalness={0.4}
        />
      </mesh>

      {/* Selected Indicator Halo */}
      {isSelected && (
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
        isSelected={isSelected}
        isNeighbor={isNeighbor}
        visible={isLabelVisible}
        position={[0, 1.4, 0]}
      />
    </group>
  );
};
