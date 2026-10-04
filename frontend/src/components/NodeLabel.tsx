import React from 'react';
import { Billboard, Text } from '@react-three/drei';

export interface NodeLabelProps {
  name: string;
  coordsText?: string;
  isSelected?: boolean;
  isNeighbor?: boolean;
  visible?: boolean;
  position?: [number, number, number];
}

/**
 * Reusable, modular 3D Billboard Label with background card.
 * Rendered natively in WebGL so it never suffers from DOM overlay desync
 * or React 19 createRoot unmounting race conditions.
 */
export const NodeLabel: React.FC<NodeLabelProps> = ({
  name,
  coordsText,
  isSelected = false,
  isNeighbor = false,
  visible = true,
  position = [0, 1.4, 0],
}) => {
  if (!visible) return null;

  // Background and border colors matching the design system
  const bgColor = isSelected ? '#451a03' : isNeighbor ? '#064e3b' : '#0f172a';
  const borderColor = isSelected ? '#f59e0b' : isNeighbor ? '#10b981' : '#334155';
  const textColor = isSelected ? '#fef3c7' : isNeighbor ? '#a7f3d0' : '#f8fafc';
  const subtextColor = isSelected ? '#fde68a' : '#94a3b8';

  // Dynamic width based on string length to fit pill cleanly
  const labelLength = Math.max(name.length, (coordsText?.length ?? 0) * 0.85);
  const cardWidth = Math.max(3.4, labelLength * 0.22 + 0.8);
  const cardHeight = coordsText ? 1.35 : 0.8;

  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      {/* Background Pill & Border */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[cardWidth + 0.1, cardHeight + 0.1]} />
        <meshBasicMaterial color={borderColor} transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[cardWidth, cardHeight]} />
        <meshBasicMaterial color={bgColor} transparent opacity={0.9} />
      </mesh>

      {/* Primary Label (Node Name) */}
      <Text
        position={[0, coordsText ? 0.24 : 0, 0]}
        fontSize={0.42}
        color={textColor}
        anchorX="center"
        anchorY="middle"
        maxWidth={cardWidth - 0.25}
      >
        {name}
      </Text>

      {/* Secondary Label (Coordinates Badge) */}
      {coordsText && (
        <Text
          position={[0, -0.3, 0]}
          fontSize={0.28}
          color={subtextColor}
          anchorX="center"
          anchorY="middle"
        >
          {coordsText}
        </Text>
      )}
    </Billboard>
  );
};
