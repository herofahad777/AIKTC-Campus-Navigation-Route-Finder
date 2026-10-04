import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { NodeItem } from '../lib/graphViewerUtils';

interface NodeMeshProps {
  node: NodeItem;
  isSelected: boolean;
  isNeighbor: boolean;
  onSelect: (node: NodeItem) => void;
  showLabels: boolean;
  debugMode: boolean;
}

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
  const hasElevation = Math.abs(node.y) > 0.001;

  // Visual styling based on state
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

  return (
    <group position={position}>
      {/* Node Sphere */}
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

      {/* Outer selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.1, 1.3, 32]} />
          <meshBasicMaterial color="#F59E0B" side={THREE.DoubleSide} transparent opacity={0.8} />
        </mesh>
      )}

      {/* Elevation Drop-Stem down to ground plane (y = 0) */}
      {hasElevation && (
        <group position={[0, -node.y / 2, 0]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, Math.abs(node.y), 8]} />
            <meshBasicMaterial color="#64748B" transparent opacity={0.5} />
          </mesh>
          {/* Ground Footprint Ring */}
          <mesh position={[0, -Math.abs(node.y) / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 0.65, 24]} />
            <meshBasicMaterial color="#06B6D4" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* Floating 3D HTML Label */}
      {(showLabels || isSelected || hovered || debugMode) && (
        <Html
          position={[0, 1.2, 0]}
          center
          distanceFactor={18}
          zIndexRange={[100, 0]}
          className="pointer-events-none select-none transition-all duration-200"
        >
          <div
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-xl backdrop-blur-md border ${
              isSelected
                ? 'bg-amber-950/90 text-amber-200 border-amber-500/80 ring-2 ring-amber-500/30'
                : hovered
                ? 'bg-slate-900/90 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-900/80 text-slate-200 border-slate-700/60'
            }`}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSelected ? 'bg-amber-400' : isNeighbor ? 'bg-emerald-400' : 'bg-cyan-400'
                }`}
              />
              <span>{node.name}</span>
            </div>
            {(debugMode || isSelected) && (
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                [{node.x}, {node.y}, {node.z}]
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
};
