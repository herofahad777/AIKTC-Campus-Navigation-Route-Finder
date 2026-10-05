import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getRouteEdgeKeys } from '../lib/graphViewerUtils';

export interface RouteAnimationState {
  isPlaying: boolean;
  isCompleted: boolean;
  currentStep: number;
  totalSteps: number;
  activeNodeId: string | null;
  activeEdgeKey: string | null;
  illuminatedNodeIds: Set<string>;
  illuminatedEdgeKeys: Set<string>;
  speedMs: number;
  play: () => void;
  pause: () => void;
  reset: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  setSpeed: (ms: number) => void;
}

/**
 * Custom hook to control sequential 3D path illumination from source to destination.
 *
 * ARCHITECTURAL MANDATE:
 * This hook receives an already computed path array from the C engine (`route_result.json`).
 * It strictly performs time-based visual indexing (step 0 -> 1 -> N) for 3D WebGL rendering.
 * It NEVER performs graph traversal, pathfinding, or route calculation.
 */
export function useRouteAnimation(
  path: string[] | null | undefined,
  initialSpeedMs = 400
): RouteAnimationState {
  const safePath = useMemo(() => (Array.isArray(path) ? path : []), [path]);
  const totalSteps = safePath.length;
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMs, setSpeedMs] = useState<number>(initialSpeedMs);
  const timerRef = useRef<number | null>(null);

  // When path changes, reset animation state
  useEffect(() => {
    setCurrentStep(0);
    setIsPlaying(false);
  }, [safePath]);

  // Compute all edge keys for the path
  const allEdgeKeys = useMemo(() => getRouteEdgeKeys(safePath), [safePath]);

  // Derived state
  const isCompleted = totalSteps > 0 && currentStep >= totalSteps - 1;
  const activeNodeId = safePath[currentStep] || null;
  const activeEdgeKey = currentStep > 0 ? allEdgeKeys[currentStep - 1] || null : null;

  const illuminatedNodeIds = useMemo(() => {
    const ids = new Set<string>();
    if (totalSteps === 0) return ids;
    for (let i = 0; i <= currentStep && i < totalSteps; i++) {
      ids.add(safePath[i]);
    }
    return ids;
  }, [safePath, currentStep, totalSteps]);

  const illuminatedEdgeKeys = useMemo(() => {
    const keys = new Set<string>();
    if (totalSteps <= 1) return keys;
    for (let i = 0; i < currentStep && i < allEdgeKeys.length; i++) {
      keys.add(allEdgeKeys[i]);
    }
    return keys;
  }, [allEdgeKeys, currentStep, totalSteps]);

  // Controls
  const stepForward = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev < totalSteps - 1) return prev + 1;
      return prev;
    });
  }, [totalSteps]);

  const stepBackward = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const play = useCallback(() => {
    if (totalSteps <= 1) return;
    if (currentStep >= totalSteps - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(true);
  }, [totalSteps, currentStep]);

  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentStep(0);
  }, []);

  // Tick effect
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = window.setInterval(() => {
      setCurrentStep((prev) => {
        const next = prev + 1;
        if (next >= totalSteps - 1) {
          setIsPlaying(false);
          return Math.max(0, totalSteps - 1);
        }
        return next;
      });
    }, speedMs);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, totalSteps, speedMs]);

  return {
    isPlaying,
    isCompleted,
    currentStep,
    totalSteps,
    activeNodeId,
    activeEdgeKey,
    illuminatedNodeIds,
    illuminatedEdgeKeys,
    speedMs,
    play,
    pause,
    reset,
    stepForward,
    stepBackward,
    setSpeed: setSpeedMs,
  };
}
