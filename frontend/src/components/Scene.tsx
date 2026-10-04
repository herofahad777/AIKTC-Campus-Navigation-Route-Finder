import React, { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import * as THREE from 'three';
import { NodeMesh } from './NodeMesh';
import { Edges } from './Edges';
import { NodeItem, ResolvedEdge } from '../lib/graphViewerUtils';

interface SceneProps {
  nodes: NodeItem[];
  resolvedEdges: ResolvedEdge[];
  selectedNode: NodeItem | null;
  onSelectNode: (node: NodeItem | null) => void;
  showGrid: boolean;
  showAxes: boolean;
  showLabels: boolean;
  debugMode: boolean;
}

export interface CameraControlHandle {
  resetCamera: () => void;
  setTopView: () => void;
  setSideView: () => void;
  setIsometricView: () => void;
}

export const Scene: React.FC<SceneProps> = ({
  nodes,
  resolvedEdges,
  selectedNode,
  onSelectNode,
  showGrid,
  showAxes,
  showLabels,
  debugMode,
}) => {
  const controlsRef = useRef<OrbitControlsType>(null);

  // Compute neighboring node IDs for selected node (direct edge partners)
  const neighborIds = React.useMemo(() => {
    if (!selectedNode) return new Set<string>();
    const neighbors = new Set<string>();
    for (const re of resolvedEdges) {
      if (re.isValid && re.source && re.target) {
        if (re.source.id === selectedNode.id) {
          neighbors.add(re.target.id);
        } else if (re.target.id === selectedNode.id) {
          neighbors.add(re.source.id);
        }
      }
    }
    return neighbors;
  }, [selectedNode, resolvedEdges]);

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden">
      <Canvas
        camera={{ position: [35, 45, 55], fov: 45, near: 0.1, far: 1000 }}
        shadows
        onPointerDown={(e) => {
          // Deselect when clicking on empty canvas background
          if (e.target === e.currentTarget) {
            onSelectNode(null);
          }
        }}
      >
        <color attach="background" args={['#090D16']} />
        <fog attach="fog" args={['#090D16', 60, 160]} />

        {/* Ambient & Directional Lights */}
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[30, 45, 20]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-20, 25, -20]} intensity={0.4} color="#38BDF8" />

        {/* Orbit Controls */}
        <OrbitControls
          ref={controlsRef}
          makeDefault
          enableDamping
          dampingFactor={0.06}
          minDistance={5}
          maxDistance={150}
          maxPolarAngle={Math.PI / 2 + 0.05} // Prevent dipping too far below horizon
        />

        {/* Infinite Reference Grid */}
        {showGrid && (
          <Grid
            position={[0, -0.01, 0]}
            args={[120, 120]}
            cellSize={2}
            cellThickness={0.7}
            cellColor="#1E293B"
            sectionSize={10}
            sectionThickness={1.2}
            sectionColor="#334155"
            fadeDistance={75}
            fadeStrength={1.2}
            infiniteGrid
          />
        )}

        {/* 3D Axis Helper at Origin */}
        {showAxes && (
          <group position={[0, 0.01, 0]}>
            <primitive object={new THREE.AxesHelper(10)} />
          </group>
        )}

        {/* Orientation Compass Gizmo */}
        <GizmoHelper alignment="bottom-right" margin={[70, 70]}>
          <GizmoViewport
            axisColors={['#EF4444', '#10B981', '#3B82F6']}
            labelColor="#F8FAFC"
          />
        </GizmoHelper>

        {/* Render Edges (Pathways) */}
        <Edges resolvedEdges={resolvedEdges} selectedNode={selectedNode} />

        {/* Render Nodes (Spheres + Labels) */}
        <group>
          {nodes.map((node) => (
            <NodeMesh
              key={node.id}
              node={node}
              isSelected={selectedNode?.id === node.id}
              isNeighbor={neighborIds.has(node.id)}
              onSelect={onSelectNode}
              showLabels={showLabels}
              debugMode={debugMode}
            />
          ))}
        </group>
      </Canvas>
    </div>
  );
};
