import React from 'react';
import { Billboard, Text } from '@react-three/drei';

export interface NodeLabelProps {
  name: string;
  coordsText?: string;
  roleBadge?: string; // 'START' | 'DEST' | 'WAYPOINT'
  isSelected?: boolean;
  isNeighbor?: boolean;
  isSource?: boolean;
  isDestination?: boolean;
  isIlluminated?: boolean;
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
  roleBadge,
  isSelected = false,
  isNeighbor = false,
  isSource = false,
  isDestination = false,
  isIlluminated = false,
  visible = true,
  position = [0, 1.4, 0],
}) => {
  if (!visible) return null;

  // Background and border colors matching the design system
  let bgColor = '#0f172a';
  let borderColor = '#334155';
  let textColor = '#f8fafc';
  let subtextColor = '#94a3b8';

  if (isSource) {
    bgColor = '#064e3b';
    borderColor = '#10b981';
    textColor = '#a7f3d0';
    subtextColor = '#6ee7b7';
  } else if (isDestination) {
    bgColor = '#4c0519';
    borderColor = '#f43f5e';
    textColor = '#ffe4e6';
    subtextColor = '#fca5a5';
  } else if (isSelected) {
    bgColor = '#451a03';
    borderColor = '#f59e0b';
    textColor = '#fef3c7';
    subtextColor = '#fde68a';
  } else if (isIlluminated) {
    bgColor = '#0c4a6e';
    borderColor = '#38bdf8';
    textColor = '#e0f2fe';
    subtextColor = '#7dd3fc';
  } else if (isNeighbor) {
    bgColor = '#064e3b';
    borderColor = '#10b981';
    textColor = '#a7f3d0';
    subtextColor = '#94a3b8';
  }

  // Dynamic width based on string length to fit pill cleanly
  const labelLength = Math.max(name.length, (coordsText?.length ?? 0) * 0.85);
  const cardWidth = Math.max(3.6, labelLength * 0.22 + 0.9);
  const cardHeight = roleBadge ? 1.6 : coordsText ? 1.35 : 0.85;

  return (
    <Billboard position={position} follow lockX={false} lockY={false} lockZ={false}>
      {/* Background Pill & Border */}
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[cardWidth + 0.12, cardHeight + 0.12]} />
        <meshBasicMaterial color={borderColor} transparent opacity={0.95} />
      </mesh>
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[cardWidth, cardHeight]} />
        <meshBasicMaterial color={bgColor} transparent opacity={0.92} />
      </mesh>

      {/* Role Badge (START / DEST) */}
      {roleBadge && (
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.26}
          color={isSource ? '#34d399' : isDestination ? '#fb7185' : '#fbbf24'}
          anchorX="center"
          anchorY="middle"
        >
          {`● ${roleBadge} ●`}
        </Text>
      )}

      {/* Primary Label (Node Name) */}
      <Text
        position={[0, roleBadge ? 0.08 : coordsText ? 0.24 : 0, 0]}
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
          position={[0, roleBadge ? -0.42 : -0.3, 0]}
          fontSize={0.26}
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
