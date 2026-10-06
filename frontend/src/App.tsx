import React, { useState, useMemo, useCallback } from 'react';
import {
  Layers,
  MapPin,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  Compass,
  Grid3X3,
  Search,
  Crosshair,
  Maximize2,
  Info,
  ShieldAlert,
  Route,
  Navigation,
  Flag,
  Edit3,
} from 'lucide-react';
import { Scene } from './components/Scene';
import { RouteSelectorPanel } from './components/RouteSelectorPanel';
import { NodeEditorPanel } from './components/NodeEditorPanel';
import rawNodes from './data/nodes.json';
import rawEdges from './data/edges.json';
import {
  NodeItem,
  EdgeItem,
  countNodes,
  countEdges,
  resolveEdgeEndpoints,
  validateGraphData,
} from './lib/graphViewerUtils';
import { requestRoute, clearRoute, RouteResult } from './lib/engineBridge';
import { useRouteAnimation } from './hooks/useRouteAnimation';
import { useNodeEditor } from './hooks/useNodeEditor';
import {
  campusOrigin,
  applyOriginOffsetToAll,
  isOriginOffsetActive,
} from './config/originConfig';

export const App: React.FC = () => {
  const initialTransformedNodes = useMemo(
    () => applyOriginOffsetToAll(rawNodes as NodeItem[], campusOrigin),
    []
  );

  const nodeEditor = useNodeEditor({
    initialNodes: initialTransformedNodes,
    initialEdges: rawEdges as EdgeItem[],
  });

  const { nodes, edges } = nodeEditor;

  // Viewer and Debug State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(() => {
    if (initialTransformedNodes.some((n) => n.id === 'library')) return 'library';
    return initialTransformedNodes[0]?.id ?? null;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [debugMode, setDebugMode] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [rightTab, setRightTab] = useState<'inspector' | 'editor'>('inspector');

  // Left Sidebar Mode: 'locations' or 'route'
  const [leftTab, setLeftTab] = useState<'locations' | 'route'>('locations');

  // Route Navigation State (Strictly decoupled from traversal algorithms per RULES.md)
  const [sourceId, setSourceId] = useState<string | null>(() => {
    if (initialTransformedNodes.some((n) => n.id === 'gate')) return 'gate';
    return initialTransformedNodes[0]?.id ?? null;
  });
  const [destinationId, setDestinationId] = useState<string | null>(() => {
    if (initialTransformedNodes.some((n) => n.id === 'hostel_north')) return 'hostel_north';
    if (initialTransformedNodes.some((n) => n.id === 'library')) return 'library';
    return initialTransformedNodes.length > 1 ? initialTransformedNodes[1]?.id : null;
  });
  const [isEngineLoading, setIsEngineLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<RouteResult | null>(null);

  // Dynamic Resizable Right Sidebar State (persisted to localStorage)
  const [rightPanelWidth, setRightPanelWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('campus_nav_right_panel_width');
      if (saved) {
        const val = parseInt(saved, 10);
        if (!isNaN(val) && val >= 280 && val <= 700) {
          return val;
        }
      }
    } catch {
      // ignore localStorage error
    }
    return 360; // Clean, generous default
  });

  const [isResizingRight, setIsResizingRight] = useState(false);

  const startResizingRight = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizingRight(true);

      const startX = e.clientX;
      const startWidth = rightPanelWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        // Dragging left (smaller clientX) increases width of right panel
        const deltaX = startX - moveEvent.clientX;
        const maxAllowed = Math.min(650, window.innerWidth - 120);
        const newWidth = Math.max(280, Math.min(maxAllowed, startWidth + deltaX));
        setRightPanelWidth(newWidth);
      };

      const handleMouseUp = () => {
        setIsResizingRight(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setRightPanelWidth((current) => {
          try {
            localStorage.setItem('campus_nav_right_panel_width', current.toString());
          } catch {
            // ignore
          }
          return current;
        });
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [rightPanelWidth]
  );

  // Sequential 3D Animation Hook (Visualizes path returned by engine only)
  const animationState = useRouteAnimation(routeResult?.path, 400);

  // Derived counts and visualization data (pure visual mapping, NO traversal)
  const nodeCount = useMemo(() => countNodes(nodes), [nodes]);
  const edgeCount = useMemo(() => countEdges(edges), [edges]);
  const resolvedEdges = useMemo(() => resolveEdgeEndpoints(edges, nodes), [edges, nodes]);
  const validationWarnings = useMemo(() => validateGraphData(nodes, edges), [nodes, edges]);

  // Selected node object
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  // Connected neighbors for the selected node (direct visual adjacency)
  const connectedEdges = useMemo(() => {
    if (!selectedNode) return [];
    return resolvedEdges.filter(
      (re) => re.isValid && (re.source?.id === selectedNode.id || re.target?.id === selectedNode.id)
    );
  }, [selectedNode, resolvedEdges]);

  // Filtered node list for left panel search
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.filter(
      (n) => n.name.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)
    );
  }, [nodes, searchQuery]);

  // Query Route from Engine Adapter (Frontend generates route_request.json and awaits engine route_result.json)
  const handleFindRoute = useCallback(async () => {
    if (!sourceId || !destinationId) return;
    setIsEngineLoading(true);
    try {
      const res = await requestRoute({ source: sourceId, destination: destinationId });
      setRouteResult(res);
      setLeftTab('route');
      if (res.found && res.path.length > 1) {
        setTimeout(() => {
          animationState.play();
        }, 250);
      }
    } finally {
      setIsEngineLoading(false);
    }
  }, [sourceId, destinationId, animationState]);

  // Clear Route
  const handleClearRoute = useCallback(() => {
    clearRoute();
    setRouteResult(null);
    animationState.reset();
  }, [animationState]);

  // Import custom route_result.json produced by routefinder.exe
  const handleImportRouteResult = useCallback((result: RouteResult) => {
    setRouteResult(result);
    if (result.source) setSourceId(result.source);
    if (result.destination) setDestinationId(result.destination);
    setLeftTab('route');
    if (result.found && result.path.length > 1) {
      setTimeout(() => {
        animationState.play();
      }, 250);
    }
  }, [animationState]);

  return (
    <div
      className={`flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans ${
        isResizingRight ? 'select-none cursor-col-resize' : ''
      }`}
    >
      {/* TOP HEADER */}
      <header className="h-14 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Compass className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              Campus Navigation Route Finder
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                3D Graph Viewer
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Data Structures Mini Project • Visual Node Placement & Coordinate Verification
            </p>
          </div>
        </div>

        {/* Header Controls & Mode Toggles */}
        <div className="flex items-center gap-2">
          {/* Debug Placement Mode Toggle */}
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              debugMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Debug Placement Mode"
          >
            <Crosshair className={`w-3.5 h-3.5 ${debugMode ? 'text-amber-400' : 'text-slate-400'}`} />
            <span>{debugMode ? 'Debug Placement ON' : 'Debug Placement OFF'}</span>
          </button>

          {/* Quick Visibility Toggles */}
          <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-md p-1 gap-1">
            <button
              onClick={() => setShowGrid(!showGrid)}
              title={showGrid ? 'Hide Grid' : 'Show Grid'}
              className={`p-1.5 rounded hover:bg-slate-800 transition ${
                showGrid ? 'text-cyan-400' : 'text-slate-600'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowAxes(!showAxes)}
              title={showAxes ? 'Hide Axes' : 'Show Axes'}
              className={`p-1.5 rounded hover:bg-slate-800 transition ${
                showAxes ? 'text-emerald-400' : 'text-slate-600'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowLabels(!showLabels)}
              title={showLabels ? 'Hide Labels' : 'Show Labels'}
              className={`p-1.5 rounded hover:bg-slate-800 transition ${
                showLabels ? 'text-amber-400' : 'text-slate-600'
              }`}
            >
              {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* 3-PANEL APPLICATION LAYOUT */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* =========================================================================
            LEFT PANEL: Stats, Search, Node List OR Route Finder
           ========================================================================= */}
        <aside className="w-84 border-r border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-col shrink-0 z-10">
          {/* Quick Metrics */}
          <div className="p-4 border-b border-slate-800 grid grid-cols-2 gap-2 shrink-0">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-cyan-400" />
                Nodes
              </div>
              <div className="text-xl font-bold font-mono text-cyan-300 mt-1">{nodeCount}</div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1">
                <GitBranch className="w-3 h-3 text-emerald-400" />
                Edges
              </div>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{edgeCount}</div>
            </div>
          </div>

          {/* Left Panel Tabs: Locations vs Route Finder */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 gap-1 shrink-0">
            <button
              onClick={() => setLeftTab('locations')}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                leftTab === 'locations'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Locations</span>
            </button>
            <button
              onClick={() => setLeftTab('route')}
              className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                leftTab === 'route'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Route className="w-3.5 h-3.5 text-emerald-400" />
              <span>Route Finder</span>
              {routeResult?.found && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>
          </div>

          {/* TAB 1: Locations Directory */}
          {leftTab === 'locations' && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search Bar */}
              <div className="p-3 border-b border-slate-800/80 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search campus nodes..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/70"
                  />
                </div>
              </div>

              {/* Node List Header */}
              <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-950/40 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase shrink-0">
                <span>Campus Locations ({filteredNodes.length})</span>
                <span className="text-[10px] font-mono text-slate-500">[X, Y, Z]</span>
              </div>

              {/* Node Scrollable List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
                {filteredNodes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No nodes match search.</div>
                ) : (
                  filteredNodes.map((node) => {
                    const isSelected = node.id === selectedNodeId;
                    const isSource = node.id === sourceId;
                    const isDest = node.id === destinationId;

                    return (
                      <button
                        key={node.id}
                        data-testid={`node-item-${node.id}`}
                        onClick={() => setSelectedNodeId(node.id)}
                        className={`w-full text-left p-3 transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-950/50 border-l-4 border-cyan-400 text-white'
                            : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-medium text-xs truncate flex items-center gap-1.5">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSource
                                  ? 'bg-emerald-400 ring-2 ring-emerald-400/40'
                                  : isDest
                                  ? 'bg-rose-400 ring-2 ring-rose-400/40'
                                  : isSelected
                                  ? 'bg-amber-400 ring-2 ring-amber-400/30'
                                  : 'bg-cyan-400'
                              }`}
                            />
                            {node.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                            ID: {node.id}
                            {isSource && <span className="text-emerald-400 font-semibold ml-1.5">[START]</span>}
                            {isDest && <span className="text-rose-400 font-semibold ml-1.5">[DEST]</span>}
                          </div>
                        </div>
                        <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400 shrink-0">
                          [{node.x}, {node.y}, {node.z}]
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Route Finder & Sequential Animation */}
          {leftTab === 'route' && (
            <div className="flex-1 flex flex-col min-h-0">
              <RouteSelectorPanel
                nodes={nodes}
                sourceId={sourceId}
                destinationId={destinationId}
                onSelectSource={setSourceId}
                onSelectDestination={setDestinationId}
                onFindRoute={handleFindRoute}
                onClearRoute={handleClearRoute}
                onImportRouteResult={handleImportRouteResult}
                isLoading={isEngineLoading}
                routeResult={routeResult}
                animationState={animationState}
              />
            </div>
          )}
        </aside>

        {/* =========================================================================
            CENTER PANEL: 3D Scene Viewer
           ========================================================================= */}
        <main className="flex-1 relative h-full bg-slate-950">
          {/* Floating Coordinate Reference Banner */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-2">
            <div className="glass-panel px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-3 shadow-lg">
              <span className="flex items-center gap-1 text-red-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> +X: East
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> +Y: Elevation
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 text-blue-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> -Z: North
              </span>
              {isOriginOffsetActive(campusOrigin) && (
                <>
                  <span className="text-slate-600">|</span>
                  <span className="flex items-center gap-1 text-purple-300 font-semibold" title="Central Origin Main Axis Offset configured via .env">
                    <Compass className="w-3.5 h-3.5 text-purple-400" />
                    Origin: [{campusOrigin.x}, {campusOrigin.y}, {campusOrigin.z}]
                  </span>
                </>
              )}
            </div>

            {routeResult?.found && (
              <div className="bg-emerald-950/85 border border-emerald-500/60 text-emerald-200 px-3 py-1.5 rounded-md text-[11px] font-mono flex items-center gap-2 backdrop-blur shadow">
                <Navigation className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>
                  ROUTE ACTIVE: {routeResult.source} &rarr; {routeResult.destination} ({routeResult.hops} Hops)
                </span>
                {routeResult.isNativeC ? (
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-cyan-900/80 text-cyan-300 border border-cyan-600/60 font-sans font-bold">
                    NATIVE C ENGINE
                  </span>
                ) : routeResult.isSimulation ? (
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-600/60 font-sans font-bold">
                    DEMO FIXTURE
                  </span>
                ) : null}
              </div>
            )}

            {debugMode && !routeResult?.found && (
              <div className="bg-amber-950/70 border border-amber-600/60 text-amber-200 px-3 py-1 rounded-md text-[11px] font-mono flex items-center gap-2 backdrop-blur shadow">
                <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>DEBUG PLACEMENT ACTIVE • Labels Visible • Inspecting Coords</span>
              </div>
            )}
          </div>

          {/* 3D Canvas */}
          <Scene
            nodes={nodes}
            resolvedEdges={resolvedEdges}
            selectedNode={selectedNode}
            onSelectNode={(node) => setSelectedNodeId(node ? node.id : null)}
            showGrid={showGrid}
            showAxes={showAxes}
            showLabels={showLabels}
            debugMode={debugMode}
            onUpdateNodePosition={nodeEditor.updateNodePosition}
            snapToGrid={snapToGrid}
            routePath={routeResult?.found ? routeResult.path : []}
            sourceId={sourceId}
            destinationId={destinationId}
            illuminatedNodeIds={animationState.illuminatedNodeIds}
            illuminatedEdgeKeys={animationState.illuminatedEdgeKeys}
            activeNodeId={animationState.activeNodeId}
            activeEdgeKey={animationState.activeEdgeKey}
          />
        </main>

        {/* =========================================================================
            RIGHT PANEL: Inspector, Coordinates, Validation Warnings / Node Editor
           ========================================================================= */}
        {/* Resize Divider Handle for Right Sidebar */}
        <div
          onMouseDown={startResizingRight}
          data-testid="right-panel-resizer"
          className={`w-1.5 hover:w-2 transition-all cursor-col-resize shrink-0 z-20 flex items-center justify-center select-none group ${
            isResizingRight
              ? 'bg-cyan-500 w-2 shadow-[0_0_12px_rgba(6,182,212,0.6)]'
              : 'bg-transparent hover:bg-cyan-500/40 border-l border-slate-800/80'
          }`}
          title="Drag to resize panel"
        >
          <div className="w-0.5 h-8 rounded-full bg-slate-700/80 group-hover:bg-cyan-400 transition-colors pointer-events-none" />
        </div>

        <aside
          style={{ width: `${rightPanelWidth}px` }}
          data-testid="right-sidebar-panel"
          className="border-l border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-col shrink-0 z-10 overflow-y-auto overflow-x-hidden min-w-0 max-w-[calc(100vw-80px)]"
        >
          {/* Debug Mode Tabs: Inspector vs Node Editor */}
          {debugMode && (
            <div className="flex border-b border-slate-800 bg-slate-950/80 p-1 gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setRightTab('inspector')}
                data-testid="right-tab-inspector"
                className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  rightTab === 'inspector'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                <span>Inspector</span>
              </button>
              <button
                type="button"
                onClick={() => setRightTab('editor')}
                data-testid="right-tab-editor"
                className={`flex-1 py-1.5 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  rightTab === 'editor'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                <span>Node Editor</span>
                {nodeEditor.hasUnsavedChanges && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                )}
              </button>
            </div>
          )}

          {debugMode && rightTab === 'editor' ? (
            <NodeEditorPanel
              selectedNode={selectedNode}
              allNodes={nodes}
              edges={edges}
              hasUnsavedChanges={nodeEditor.hasUnsavedChanges}
              onUpdateNode={(oldId, updates, cascade) => {
                const res = nodeEditor.updateNode(oldId, updates, cascade);
                if (res.success && updates.id && selectedNodeId === oldId) {
                  setSelectedNodeId(updates.id);
                  if (sourceId === oldId) setSourceId(updates.id);
                  if (destinationId === oldId) setDestinationId(updates.id);
                }
                return res;
              }}
              onUpdatePosition={nodeEditor.updateNodePosition}
              onNudge={nodeEditor.nudgeNode}
              onSnapToGround={nodeEditor.snapNodeToGround}
              onSnapToGrid={nodeEditor.snapNodeToGrid}
              onAddNode={(custom) => {
                const n = nodeEditor.addNode(custom);
                setSelectedNodeId(n.id);
                return n;
              }}
              onDuplicateNode={(id) => {
                const clone = nodeEditor.duplicateNode(id);
                if (clone) setSelectedNodeId(clone.id);
                return clone;
              }}
              onDeleteNode={(id, purge) => {
                const res = nodeEditor.deleteNode(id, purge);
                if (res && selectedNodeId === id) setSelectedNodeId(null);
                if (sourceId === id) setSourceId(null);
                if (destinationId === id) setDestinationId(null);
                return res;
              }}
              onAddEdge={nodeEditor.addEdge}
              onDeleteEdge={nodeEditor.deleteEdge}
              onRevertNode={nodeEditor.revertNode}
              onRevertAll={nodeEditor.revertAll}
              onSaveToDisk={nodeEditor.saveToDisk}
              onExportJson={nodeEditor.exportJson}
              onSelectNode={(node) => setSelectedNodeId(node ? node.id : null)}
              snapToGrid={snapToGrid}
              onToggleSnapToGrid={setSnapToGrid}
            />
          ) : (
            <>
              {/* Section: Selected Node Inspector */}
              <div className="p-4 border-b border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                    Node Inspector
                  </span>
                  {selectedNode && (
                    <div className="flex items-center gap-1.5">
                      {debugMode && (
                        <button
                          type="button"
                          onClick={() => setRightTab('editor')}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/80 hover:bg-amber-900 transition flex items-center gap-1"
                        >
                          <Edit3 className="w-2.5 h-2.5" />
                          Edit Node
                        </button>
                      )}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                        SELECTED
                      </span>
                    </div>
                  )}
                </div>

            {selectedNode ? (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    {selectedNode.name}
                  </div>
                  <div className="text-xs font-mono text-slate-400 mt-1">
                    Node ID: <span className="text-cyan-300 font-semibold">{selectedNode.id}</span>
                  </div>

                  {/* Quick-Set Route Origin & Destination */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        setSourceId(selectedNode.id);
                        setLeftTab('route');
                      }}
                      className="px-2.5 py-1.5 rounded bg-emerald-950/60 border border-emerald-800/60 hover:bg-emerald-900/60 text-emerald-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <MapPin className="w-3 h-3 text-emerald-400" />
                      Set as Start
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDestinationId(selectedNode.id);
                        setLeftTab('route');
                      }}
                      className="px-2.5 py-1.5 rounded bg-rose-950/60 border border-rose-800/60 hover:bg-rose-900/60 text-rose-300 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Flag className="w-3 h-3 text-rose-400" />
                      Set as Dest
                    </button>
                  </div>
                </div>

                {/* Spatial Coordinates Inspection Grid */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-cyan-400" />
                    Spatial Coordinates
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {/* X Coordinate */}
                    <div className="p-2.5 rounded-md bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-red-400 font-semibold uppercase">X (East/West)</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {selectedNode.x}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {selectedNode.x > 0
                          ? `${selectedNode.x}m East`
                          : selectedNode.x < 0
                          ? `${Math.abs(selectedNode.x)}m West`
                          : 'Campus Meridian'}
                      </div>
                    </div>

                    {/* Y Coordinate */}
                    <div className="p-2.5 rounded-md bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-emerald-400 font-semibold uppercase">Y (Elevation)</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {selectedNode.y}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {selectedNode.y > 0 ? `+${selectedNode.y}m Floor` : 'Ground (0m)'}
                      </div>
                    </div>

                    {/* Z Coordinate */}
                    <div className="p-2.5 rounded-md bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-blue-400 font-semibold uppercase">Z (North/South)</div>
                      <div className="text-base font-bold font-mono text-white mt-0.5">
                        {selectedNode.z}
                      </div>
                      <div className="text-[9px] text-slate-500">
                        {selectedNode.z < 0
                          ? `${Math.abs(selectedNode.z)}m North`
                          : selectedNode.z > 0
                          ? `${selectedNode.z}m South`
                          : 'Campus Equator'}
                      </div>
                    </div>
                    {isOriginOffsetActive(campusOrigin) && (
                      <div className="col-span-3 mt-2 p-1.5 px-2.5 rounded bg-purple-950/40 border border-purple-800/50 text-[10px] text-purple-300 flex items-center justify-between font-mono">
                        <span className="flex items-center gap-1">
                          <Compass className="w-3 h-3 text-purple-400" />
                          <span>Main Axis Offset:</span>
                        </span>
                        <span>Δ[{campusOrigin.x}, {campusOrigin.y}, {campusOrigin.z}]</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Connections (Edge Pathways) */}
                <div>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3 text-emerald-400" />
                      Direct Connections
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {connectedEdges.length} Pathways
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {connectedEdges.length === 0 ? (
                      <div className="text-xs text-slate-500 p-2 bg-slate-950 rounded border border-slate-800">
                        Isolated node (no connecting edges)
                      </div>
                    ) : (
                      connectedEdges.map((re, idx) => {
                        const otherNode =
                          re.source?.id === selectedNode.id ? re.target : re.source;
                        return (
                          <div
                            key={idx}
                            onClick={() => otherNode && setSelectedNodeId(otherNode.id)}
                            className="p-2 rounded bg-slate-950 border border-slate-800/80 hover:border-cyan-500/40 flex items-center justify-between cursor-pointer transition text-xs"
                          >
                            <span className="text-slate-200 truncate">{otherNode?.name}</span>
                            <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                              [{otherNode?.x}, {otherNode?.y}, {otherNode?.z}]
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
                <Info className="w-5 h-5 mx-auto mb-2 text-slate-600" />
                Select any node from the left panel or click directly on a 3D sphere to inspect
                coordinates.
              </div>
            )}
          </div>

          {/* Section: Debug Placement Verification */}
          {debugMode && (
            <div className="p-4 border-b border-slate-800 bg-amber-950/15">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2">
                <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                Placement Verification
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Verify node coordinates relative to surrounding buildings before final model integration.
              </p>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded bg-slate-950/80 border border-amber-900/30 flex items-center justify-between">
                  <span className="text-slate-400">Ground Alignment (Y=0):</span>
                  <span className="font-mono text-slate-200">
                    {selectedNode ? (selectedNode.y === 0 ? 'Aligned on Ground' : `Elevated (+${selectedNode.y}m)`) : '-'}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-950/80 border border-amber-900/30 flex items-center justify-between">
                  <span className="text-slate-400">Radial Dist from Origin:</span>
                  <span className="font-mono text-cyan-300">
                    {selectedNode
                      ? `${Math.sqrt(selectedNode.x ** 2 + selectedNode.z ** 2).toFixed(1)}m`
                      : '-'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Data Validation Warnings */}
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Data Validation
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  validationWarnings.length === 0
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                }`}
              >
                {validationWarnings.length === 0 ? '0 ISSUES' : `${validationWarnings.length} WARNINGS`}
              </span>
            </div>

            {validationWarnings.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All nodes and edge endpoints passed data validation.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {validationWarnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-xs text-amber-200 flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-[11px] capitalize">
                        {warning.type.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] text-amber-300/80 mt-0.5">{warning.message}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </aside>
      </div>
    </div>
  );
};

export default App;
