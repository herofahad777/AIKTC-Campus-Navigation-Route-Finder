import React from 'react';
import { Line } from '@react-three/drei';
import { ResolvedEdge, NodeItem } from '../lib/graphViewerUtils';

interface EdgesProps {
  resolvedEdges: ResolvedEdge[];
  selectedNode: NodeItem | null;
}

export const Edges: React.FC<EdgesProps> = ({ resolvedEdges, selectedNode }) => {
  return (
    <group>
      {resolvedEdges.map((resEdge, idx) => {
        if (!resEdge.isValid || !resEdge.source || !resEdge.target) {
          return null;
        }

        const { source, target } = resEdge;
        const startPoint: [number, number, number] = [source.x, source.y, source.z];
        const endPoint: [number, number, number] = [target.x, target.y, target.z];

        const isConnectedToSelected =
          Boolean(selectedNode) &&
          (source.id === selectedNode?.id || target.id === selectedNode?.id);

        const lineColor = isConnectedToSelected ? '#F59E0B' : '#38BDF8';
        const lineOpacity = isConnectedToSelected ? 0.95 : 0.45;
        const lineWidth = isConnectedToSelected ? 3.5 : 1.8;

        return (
          <React.Fragment key={`${source.id}-${target.id}-${idx}`}>
            <Line
              points={[startPoint, endPoint]}
              color={lineColor}
              lineWidth={lineWidth}
              transparent
              opacity={lineOpacity}
            />

            {/* Directional / pathway marker at midpoint */}
            <mesh
              position={[
                (source.x + target.x) / 2,
                (source.y + target.y) / 2,
                (source.z + target.z) / 2,
              ]}
            >
              <sphereGeometry args={[0.15, 12, 12]} />
              <meshBasicMaterial
                color={isConnectedToSelected ? '#F59E0B' : '#0EA5E9'}
                transparent
                opacity={0.7}
              />
            </mesh>
          </React.Fragment>
        );
      })}
    </group>
  );
};
