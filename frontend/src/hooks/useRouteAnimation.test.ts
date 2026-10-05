import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouteAnimation } from './useRouteAnimation';

describe('useRouteAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const samplePath = ['gate', 'library', 'cs_dept', 'eng_quad'];

  it('initializes with step 0 and initial node illuminated', () => {
    const { result } = renderHook(() => useRouteAnimation(samplePath));
    expect(result.current.currentStep).toBe(0);
    expect(result.current.totalSteps).toBe(4);
    expect(result.current.activeNodeId).toBe('gate');
    expect(result.current.illuminatedNodeIds.has('gate')).toBe(true);
    expect(result.current.illuminatedNodeIds.has('library')).toBe(false);
    expect(result.current.illuminatedEdgeKeys.size).toBe(0);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.isCompleted).toBe(false);
  });

  it('steps forward manually through the path', () => {
    const { result } = renderHook(() => useRouteAnimation(samplePath));

    act(() => {
      result.current.stepForward();
    });

    expect(result.current.currentStep).toBe(1);
    expect(result.current.activeNodeId).toBe('library');
    expect(result.current.illuminatedNodeIds.has('gate')).toBe(true);
    expect(result.current.illuminatedNodeIds.has('library')).toBe(true);
    expect(result.current.illuminatedEdgeKeys.has('gate<->library')).toBe(true);
  });

  it('plays sequential animation and halts at the destination', () => {
    const { result } = renderHook(() => useRouteAnimation(samplePath, 200));

    act(() => {
      result.current.play();
    });

    expect(result.current.isPlaying).toBe(true);

    // Advance 1 tick (200ms) -> step 1
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.currentStep).toBe(1);

    // Advance another 200ms -> step 2
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.currentStep).toBe(2);

    // Advance another 200ms -> step 3 (destination: eng_quad)
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.currentStep).toBe(3);
    expect(result.current.isCompleted).toBe(true);
    expect(result.current.isPlaying).toBe(false);

    // Confirm all path nodes and edges are illuminated
    expect(result.current.illuminatedNodeIds.size).toBe(4);
    expect(result.current.illuminatedEdgeKeys.size).toBe(3);
  });

  it('resets animation to start', () => {
    const { result } = renderHook(() => useRouteAnimation(samplePath));

    act(() => {
      result.current.stepForward();
      result.current.stepForward();
    });
    expect(result.current.currentStep).toBe(2);

    act(() => {
      result.current.reset();
    });
    expect(result.current.currentStep).toBe(0);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.illuminatedEdgeKeys.size).toBe(0);
  });
});
