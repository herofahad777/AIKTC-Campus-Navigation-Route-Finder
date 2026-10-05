/**
 * engineBridge.ts
 *
 * C Navigation Engine File Contract Adapter for Campus Navigation Route Finder.
 *
 * ARCHITECTURAL PRINCIPLE:
 * The frontend NEVER computes routes, traverses graphs, or performs BFS.
 * The standalone C engine (`frontend/src/engine/routefinder.c` / `routefinder.exe`)
 * is the SOLE OWNER of:
 * - Graph construction (Adjacency List)
 * - Queue data structure (FIFO)
 * - Breadth-First Search (BFS)
 * - Route computation and pathfinding
 * - Outputting `route_result.json`
 *
 * AUTOMATED BRIDGE FLOW:
 * 1. UI requests route -> Calls `/api/engine/route`
 * 2. Vite auto-runner checks `routefinder.c`, compiles to `routefinder.exe` if needed,
 *    runs `routefinder.exe`, and returns `route_result.json`.
 * 3. If `.c` or `.exe` is unavailable or compilation fails, responds with available: false,
 *    prompting the UI to show the warning banner and fall back to demo fixtures.
 */

import mockRouteResults from '../data/mock_route_result.json';

export interface RouteRequest {
  source: string;
  destination: string;
}

export interface RouteResult {
  found: boolean;
  path: string[];
  visited?: number;
  hops?: number;
  source?: string;
  destination?: string;
  message?: string;
  isMock?: boolean;
  isSimulation?: boolean;
  isNativeC?: boolean;
  engineLog?: string;
  timestamp?: string;
}

export type EngineRouteResult = RouteResult;

export interface EngineStatusCheck {
  isCEngineActive: boolean;
  mode: 'DEMO_SIMULATION' | 'C_ENGINE_CLI_STANDALONE' | 'C_ENGINE_NATIVE';
  sourceFile: string;
  binaryName: string;
  requestFile: string;
  resultFile: string;
  warningTitle: string;
  warningDetails: string;
}

const customRouteRegistry: Map<string, RouteResult> = new Map();
let currentActiveRoute: RouteResult | null = null;

let cachedEngineStatus: EngineStatusCheck = {
  isCEngineActive: false,
  mode: 'DEMO_SIMULATION',
  sourceFile: 'frontend/src/engine/routefinder.c',
  binaryName: 'routefinder.exe',
  requestFile: 'route_request.json',
  resultFile: 'route_result.json',
  warningTitle: 'DEMO MODE: engine/routefinder.c is Not Compiled',
  warningDetails:
    'The C route engine (routefinder.exe) is not available. Running with simulated output from mock_route_result.json. When routefinder.c or routefinder.exe is available, it will automatically compile and execute.',
};

function buildRouteKey(source: string, destination: string): string {
  return `${source.trim().toLowerCase()}->${destination.trim().toLowerCase()}`;
}

/**
 * Returns the current engine integration status.
 */
export function checkEngineStatus(): EngineStatusCheck {
  return cachedEngineStatus;
}

/**
 * Queries the Vite dev bridge for C engine status.
 */
export async function fetchEngineStatus(): Promise<EngineStatusCheck> {
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/engine/status');
      if (res.ok) {
        const data = await res.json();
        if (data.available) {
          cachedEngineStatus = {
            isCEngineActive: true,
            mode: 'C_ENGINE_NATIVE',
            sourceFile: 'frontend/src/engine/routefinder.c',
            binaryName: 'routefinder.exe',
            requestFile: 'route_request.json',
            resultFile: 'route_result.json',
            warningTitle: 'C Engine Active: routefinder.exe',
            warningDetails:
              'Adjacency List graph, FIFO queue, and BFS algorithm are running natively inside routefinder.exe.',
          };
        } else {
          cachedEngineStatus = {
            isCEngineActive: false,
            mode: 'DEMO_SIMULATION',
            sourceFile: 'frontend/src/engine/routefinder.c',
            binaryName: 'routefinder.exe',
            requestFile: 'route_request.json',
            resultFile: 'route_result.json',
            warningTitle: 'DEMO MODE: engine/routefinder.c is Not Compiled',
            warningDetails:
              'The C route engine (routefinder.exe) is not available. Running with simulated output from mock_route_result.json.',
          };
        }
      }
    } catch {
      // In offline / testing mode, keep default
    }
  }
  return cachedEngineStatus;
}

/**
 * Formats a route request object into a JSON string
 * ready to be saved as `route_request.json` for `routefinder.exe`.
 */
export function generateRouteRequestJson(request: RouteRequest): string {
  return JSON.stringify(
    {
      source: request.source.trim(),
      destination: request.destination.trim(),
    },
    null,
    2
  );
}

/**
 * Requests a route from the engine.
 *
 * 1. Checks custom loaded results.
 * 2. Attempts automated C execution via `/api/engine/route`.
 * 3. If C engine is unavailable, flags simulation warning and falls back to mock fixtures.
 *
 * Frontend performs ZERO graph searching or traversal.
 */
export async function requestRoute(request: RouteRequest): Promise<RouteResult> {
  const cleanSource = request.source.trim().toLowerCase();
  const cleanDest = request.destination.trim().toLowerCase();

  // Edge Case: Same source and destination
  if (cleanSource === cleanDest) {
    const directResult: RouteResult = {
      source: cleanSource,
      destination: cleanDest,
      found: true,
      path: [cleanSource],
      hops: 0,
      visited: 1,
      isMock: true,
      isSimulation: true,
      message: 'Source and destination are identical.',
    };
    currentActiveRoute = directResult;
    return directResult;
  }

  // 1. Check if user loaded a custom route_result.json
  const routeKey = buildRouteKey(cleanSource, cleanDest);
  if (customRouteRegistry.has(routeKey)) {
    const customResult = customRouteRegistry.get(routeKey)!;
    currentActiveRoute = customResult;
    return customResult;
  }

  // 2. Query automated C engine via Vite Dev Server bridge
  if (typeof window !== 'undefined' && typeof fetch !== 'undefined') {
    try {
      const res = await fetch('/api/engine/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: cleanSource, destination: cleanDest }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.available && data.isNativeC) {
          const path = Array.isArray(data.path) ? data.path.map(String) : [];
          const result: RouteResult = {
            source: data.source || cleanSource,
            destination: data.destination || cleanDest,
            found: Boolean(data.found),
            path,
            hops: typeof data.hops === 'number' ? data.hops : Math.max(0, path.length - 1),
            visited: typeof data.visited === 'number' ? data.visited : undefined,
            isMock: false,
            isSimulation: false,
            isNativeC: true,
            engineLog: data.engineLog,
            timestamp: new Date().toLocaleTimeString(),
          };

          cachedEngineStatus = {
            isCEngineActive: true,
            mode: 'C_ENGINE_NATIVE',
            sourceFile: 'frontend/src/engine/routefinder.c',
            binaryName: 'routefinder.exe',
            requestFile: 'route_request.json',
            resultFile: 'route_result.json',
            warningTitle: 'C Engine Active: routefinder.exe',
            warningDetails:
              'Adjacency List graph, FIFO queue, and BFS algorithm are running natively inside routefinder.exe.',
          };

          currentActiveRoute = result;
          return result;
        } else {
          // C Engine not available
          cachedEngineStatus.isCEngineActive = false;
        }
      }
    } catch {
      // Endpoint unreachable (e.g. offline, static build, or test environment)
    }
  }

  // 3. Fall back to mock simulated engine output
  const mockMatch = (mockRouteResults as Array<{
    source: string;
    destination: string;
    found: boolean;
    path: string[];
    hops?: number;
    visited?: number;
  }>).find(
    (r) =>
      r.source.toLowerCase() === cleanSource &&
      r.destination.toLowerCase() === cleanDest
  );

  if (mockMatch) {
    const result: RouteResult = {
      source: mockMatch.source,
      destination: mockMatch.destination,
      found: mockMatch.found,
      path: mockMatch.path,
      hops: mockMatch.hops ?? mockMatch.path.length - 1,
      visited: mockMatch.visited ?? mockMatch.path.length,
      isMock: true,
      isSimulation: true,
    };
    currentActiveRoute = result;
    return result;
  }

  // Not found in engine registry
  const notFoundResult: RouteResult = {
    source: cleanSource,
    destination: cleanDest,
    found: false,
    path: [],
    hops: 0,
    visited: 0,
    isMock: true,
    isSimulation: true,
    message: `No route found by engine between '${cleanSource}' and '${cleanDest}'. Ensure routefinder.c or routefinder.exe is available.`,
  };
  currentActiveRoute = notFoundResult;
  return notFoundResult;
}

/**
 * Loads a `route_result.json` produced by the C engine `routefinder.exe`.
 * Can take a raw JSON string or pre-parsed object.
 */
export async function loadRouteResult(input: unknown): Promise<RouteResult> {
  try {
    const parsed =
      typeof input === 'string' ? JSON.parse(input) : (input as Record<string, unknown>);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error("Invalid route_result.json: expected a JSON object.");
    }

    if (!Array.isArray(parsed.path)) {
      throw new Error("Invalid route_result.json: missing 'path' array.");
    }

    const path = parsed.path.map((item: unknown) => String(item));
    const found = Boolean(parsed.found ?? path.length > 0);
    const source = parsed.source ? String(parsed.source) : path[0] || '';
    const destination = parsed.destination
      ? String(parsed.destination)
      : path[path.length - 1] || '';

    const result: RouteResult = {
      source,
      destination,
      found,
      path,
      hops: typeof parsed.hops === 'number' ? parsed.hops : Math.max(0, path.length - 1),
      visited: typeof parsed.visited === 'number' ? parsed.visited : undefined,
      isMock: false,
      isSimulation: false,
      isNativeC: true,
      message: parsed.message ? String(parsed.message) : undefined,
      timestamp: new Date().toLocaleTimeString(),
    };

    if (source && destination) {
      const key = buildRouteKey(source, destination);
      customRouteRegistry.set(key, result);
    }

    currentActiveRoute = result;
    return result;
  } catch (err) {
    throw new Error(`Failed to load route_result.json: ${(err as Error).message}`);
  }
}

/**
 * Fetches the latest route_result.json from the shared static directory (public/route_result.json).
 */
export async function loadLatestStaticRouteResult(): Promise<RouteResult> {
  try {
    const res = await fetch(`/route_result.json?t=${Date.now()}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: public/route_result.json not found`);
    }
    const data = await res.json();
    return await loadRouteResult(data);
  } catch (err) {
    throw new Error(`Could not load public/route_result.json: ${(err as Error).message}`);
  }
}

/**
 * Clears the active route in the adapter.
 */
export function clearRoute(): void {
  currentActiveRoute = null;
}

/**
 * Gets the current active route from the adapter.
 */
export function getActiveRoute(): RouteResult | null {
  return currentActiveRoute;
}

// ============================================================================
// Backward Compatibility Wrappers
// ============================================================================

export async function queryEngineRoute(
  sourceId: string,
  destinationId: string
): Promise<RouteResult> {
  return requestRoute({ source: sourceId, destination: destinationId });
}

export function importCustomEngineRoute(jsonString: string): RouteResult {
  const parsed = JSON.parse(jsonString);
  const path = Array.isArray(parsed.path) ? parsed.path.map((i: unknown) => String(i)) : [];
  const result: RouteResult = {
    source: String(parsed.source || path[0] || ''),
    destination: String(parsed.destination || path[path.length - 1] || ''),
    found: Boolean(parsed.found ?? path.length > 0),
    path,
    hops: typeof parsed.hops === 'number' ? parsed.hops : Math.max(0, path.length - 1),
    visited: typeof parsed.visited === 'number' ? parsed.visited : undefined,
    isMock: false,
    isSimulation: false,
    isNativeC: true,
    message: parsed.message ? String(parsed.message) : undefined,
  };
  if (result.source && result.destination) {
    customRouteRegistry.set(buildRouteKey(result.source, result.destination), result);
  }
  currentActiveRoute = result;
  return result;
}

export function getRegisteredEngineRoutePairs(): Array<{ source: string; destination: string }> {
  return (mockRouteResults as Array<{ source: string; destination: string }>).map((r) => ({
    source: r.source,
    destination: r.destination,
  }));
}
