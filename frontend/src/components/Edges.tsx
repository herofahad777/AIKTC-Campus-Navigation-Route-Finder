import React from 'react';
import { Line } from '@react-three/drei';
import { ResolvedEdge, NodeItem, getUndirectedEdgeKey } from '../lib/graphViewerUtils';

interface EdgesProps {
  resolvedEdges: ResolvedEdge[];
  selectedNode: NodeItem | null;
  activeRouteEdgeKeys?: Set<string>;
  illuminatedEdgeKeys?: Set<string>;
  currentActiveEdgeKey?: string | null;
}

export const Edges: React.FC<EdgesProps> = ({
  resolvedEdges,
  selectedNode,
  activeRouteEdgeKeys,
  illuminatedEdgeKeys,
  currentActiveEdgeKey,
}) => {
  const isRouteActive = Boolean(activeRouteEdgeKeys && activeRouteEdgeKeys.size > 0);

  return (
    <group>
      {resolvedEdges.map((resEdge, idx) => {
        if (!resEdge.isValid || !resEdge.source || !resEdge.target) {
          return null;
        }

        const { source, target } = resEdge;
        const edgeKey = getUndirectedEdgeKey(source.id, target.id);
        const startPoint: [number, number, number] = [source.x, source.y, source.z];
        const endPoint: [number, number, number] = [target.x, target.y, target.z];

        const isPartOfRoute = Boolean(activeRouteEdgeKeys?.has(edgeKey));
        const isIlluminatedInRoute = Boolean(illuminatedEdgeKeys?.has(edgeKey));
        const isCurrentStepEdge = currentActiveEdgeKey === edgeKey;

        const isConnectedToSelected =
          Boolean(selectedNode) &&
          (source.id === selectedNode?.id || target.id === selectedNode?.id);

        // Visual styling based on Route Mode vs Normal Selection
        let lineColor = '#38BDF8';
        let lineOpacity = 0.45;
        let lineWidth = 1.8;
        let markerColor = '#0EA5E9';
        let markerSize = 0.15;
        let showMarker = true;

        if (isRouteActive) {
          if (isCurrentStepEdge) {
            // Actively traversing edge: Bright vibrant amber
            lineColor = '#F59E0B';
            lineOpacity = 1.0;
            lineWidth = 5.2;
            markerColor = '#F59E0B';
            markerSize = 0.28;
          } else if (isIlluminatedInRoute) {
            // Already traversed route edge: Vibrant glowing cyan
            lineColor = '#38BDF8';
            lineOpacity = 1.0;
            lineWidth = 4.2;
            markerColor = '#38BDF8';
            markerSize = 0.24;
          } else if (isPartOfRoute) {
            // Route path ahead (not yet illuminated): Slate blue anticipation guide
            lineColor = '#60A5FA';
            lineOpacity = 0.55;
            lineWidth = 2.4;
            markerColor = '#3B82F6';
            markerSize = 0.16;
          } else {
            // Other campus pathways: Clearly visible network mesh, but distinct from selected route
            lineColor = '#475569'; // Slate-600 visible pathway
            lineOpacity = 0.38;     // Noticeable network line
            lineWidth = 1.5;
            markerColor = '#334155';
            markerSize = 0.11;
            showMarker = true;
          }
        } else if (isConnectedToSelected) {
          lineColor = '#F59E0B';
          lineOpacity = 0.95;
          lineWidth = 3.5;
          markerColor = '#F59E0B';
          markerSize = 0.22;
        }

        return (
          <React.Fragment key={`${source.id}-${target.id}-${idx}`}>
            <Line
              points={[startPoint, endPoint]}
              color={lineColor}
              lineWidth={lineWidth}
              transparent
              opacity={lineOpacity}
            />

            {/* Midpoint Pathway Node Marker */}
            {showMarker && (
              <mesh
                position={[
                  (source.x + target.x) / 2,
                  (source.y + target.y) / 2,
                  (source.z + target.z) / 2,
                ]}
              >
                <sphereGeometry args={[markerSize, 12, 12]} />
                <meshBasicMaterial
                  color={markerColor}
                  transparent
                  opacity={lineOpacity}
                />
              </mesh>
            )}
          </React.Fragment>
        );
      })}
    </group>
  );
};
