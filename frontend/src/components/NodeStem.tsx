import React from 'react';
import * as THREE from 'three';

export interface NodeStemProps {
  elevation: number;
  stemColor?: string;
  ringColor?: string;
}

/**
 * Reusable modular elevation stem and ground footprint ring.
 * Useful for any node, building, or waypoint with Y != 0.
 */
export const NodeStem: React.FC<NodeStemProps> = ({
  elevation,
  stemColor = '#64748b',
  ringColor = '#06b6d4',
}) => {
  if (Math.abs(elevation) <= 0.001) return null;

  const height = Math.abs(elevation);
  const halfHeight = height / 2;

  return (
    <group position={[0, -elevation / 2, 0]}>
      {/* Vertical Drop Line */}
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, height, 8]} />
        <meshBasicMaterial color={stemColor} transparent opacity={0.5} />
      </mesh>

      {/* Ground Plane Footprint Ring */}
      <mesh position={[0, -halfHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.65, 24]} />
        <meshBasicMaterial color={ringColor} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
