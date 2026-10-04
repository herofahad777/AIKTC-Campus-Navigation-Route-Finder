import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { Scene } from './components/Scene';
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

export const App: React.FC = () => {
  const nodes = rawNodes as NodeItem[];
  const edges = rawEdges as EdgeItem[];

  // Viewer and Debug State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [debugMode, setDebugMode] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showLabels, setShowLabels] = useState(true);

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

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
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
            title="Toggle Debug Placement Mode (Always-visible labels, grid, coordinate inspect)"
          >
            <Crosshair className={`w-3.5 h-3.5 ${debugMode ? 'text-amber-400 animate-spin' : ''}`} />
            <span>Debug Placement {debugMode ? 'ON' : 'OFF'}</span>
          </button>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-md border text-xs transition cursor-pointer ${
              showGrid
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Ground Grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          {/* Axes Toggle */}
          <button
            onClick={() => setShowAxes(!showAxes)}
            className={`p-1.5 rounded-md border text-xs transition cursor-pointer ${
              showAxes
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Origin Axes (+X East, +Y Up, +Z South)"
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Labels Toggle */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`p-1.5 rounded-md border text-xs transition cursor-pointer ${
              showLabels
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle Node 3D Labels"
          >
            {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* THREE PANEL MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* =========================================================================
            LEFT PANEL: Stats, Search, Node List, Selection
           ========================================================================= */}
        <aside className="w-80 border-r border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-col shrink-0 z-10">
          {/* Quick Metrics */}
          <div className="p-4 border-b border-slate-800 grid grid-cols-2 gap-2">
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

          {/* Search Bar */}
          <div className="p-3 border-b border-slate-800/80">
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
          <div className="px-4 py-2 border-b border-slate-800/60 bg-slate-950/40 flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase">
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
                            isSelected ? 'bg-amber-400 ring-2 ring-amber-400/30' : 'bg-cyan-400'
                          }`}
                        />
                        {node.name}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">
                        ID: {node.id}
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
            </div>

            {debugMode && (
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
          />
        </main>

        {/* =========================================================================
            RIGHT PANEL: Inspector, Coordinates, Validation Warnings
           ========================================================================= */}
        <aside className="w-88 border-l border-slate-800 bg-slate-900/70 backdrop-blur-md flex flex-col shrink-0 z-10 overflow-y-auto">
          {/* Section: Selected Node Inspector */}
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                Node Inspector
              </span>
              {selectedNode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  SELECTED
                </span>
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
        </aside>
      </div>
    </div>
  );
};

export default App;
