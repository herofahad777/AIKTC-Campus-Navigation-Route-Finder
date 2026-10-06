import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Save,
  Download,
  Copy,
  Plus,
  Trash2,
  CopyPlus,
  RotateCcw,
  Check,
  AlertCircle,
  Grid,
  CheckCircle2,
  SlidersHorizontal,
  GitBranch,
  Link2,
} from 'lucide-react';
import { NodeItem, EdgeItem } from '../lib/graphViewerUtils';

export interface NodeEditorPanelProps {
  selectedNode: NodeItem | null;
  allNodes: NodeItem[];
  edges: EdgeItem[];
  hasUnsavedChanges: boolean;
  onUpdateNode: (
    oldId: string,
    updates: Partial<NodeItem>,
    cascadeIdToEdges?: boolean
  ) => { success: boolean; error?: string };
  onUpdatePosition: (id: string, x: number, y: number, z: number) => void;
  onNudge: (id: string, axis: 'x' | 'y' | 'z', delta: number) => void;
  onSnapToGround: (id: string) => void;
  onSnapToGrid: (id: string, step?: number) => void;
  onAddNode: (custom?: Partial<NodeItem>) => NodeItem;
  onDuplicateNode: (id: string) => NodeItem | null;
  onDeleteNode: (id: string, purgeEdges?: boolean) => boolean;
  onAddEdge: (from: string, to: string) => { success: boolean; error?: string };
  onDeleteEdge: (from: string, to: string) => boolean;
  onRevertNode: (id: string) => void;
  onRevertAll: () => void;
  onSaveToDisk: () => Promise<{ success: boolean; error?: string }>;
  onExportJson: () => string;
  onSelectNode: (node: NodeItem | null) => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: (snap: boolean) => void;
}

export const NodeEditorPanel: React.FC<NodeEditorPanelProps> = ({
  selectedNode,
  allNodes,
  edges = [],
  hasUnsavedChanges,
  onUpdateNode,
  onUpdatePosition,
  onNudge,
  onSnapToGround,
  onSnapToGrid,
  onAddNode,
  onDuplicateNode,
  onDeleteNode,
  onAddEdge,
  onDeleteEdge,
  onRevertNode,
  onRevertAll,
  onSaveToDisk,
  onExportJson,
  onSelectNode,
  snapToGrid,
  onToggleSnapToGrid,
}) => {
  // Local form state for selected node
  const [nameInput, setNameInput] = useState('');
  const [idInput, setIdInput] = useState('');
  const [cascadeEdges, setCascadeEdges] = useState(true);
  const [targetNodeId, setTargetNodeId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSavingDisk, setIsSavingDisk] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  // Sync form when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setNameInput(selectedNode.name);
      setIdInput(selectedNode.id);
      setTargetNodeId('');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [selectedNode?.id]);

  if (!selectedNode) {
    return (
      <div className="p-4 space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
            <SlidersHorizontal className="w-4 h-4" />
            Node Editor
          </div>
          <button
            type="button"
            onClick={() => {
              const newNode = onAddNode();
              onSelectNode(newNode);
            }}
            data-testid="add-node-btn"
            className="px-2.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Node
          </button>
        </div>
        <div className="p-6 text-center text-slate-400 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
          <p className="text-slate-300 font-semibold mb-1">No Node Selected</p>
          <p className="text-[11px] text-slate-500 mb-3">
            Select a node from the scene or click &quot;Add Node&quot; to spawn a new waypoint.
          </p>
        </div>
      </div>
    );
  }

  // Handle saving name and ID changes
  const handleApplyMetadata = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const res = onUpdateNode(
      selectedNode.id,
      { name: nameInput, id: idInput },
      cascadeEdges
    );

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update node.');
    } else {
      setSuccessMessage('Node details updated.');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Handle Save to Disk
  const handleSaveDisk = async () => {
    setIsSavingDisk(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const res = await onSaveToDisk();
    setIsSavingDisk(false);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to save to disk.');
    } else {
      setSuccessMessage('Successfully saved to nodes.json on disk!');
      setTimeout(() => setSuccessMessage(null), 3500);
    }
  };

  // Handle Export / Download
  const handleDownloadJson = () => {
    const jsonStr = onExportJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nodes.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle Copy JSON
  const handleCopyJson = async () => {
    const jsonStr = onExportJson();
    await navigator.clipboard.writeText(jsonStr);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Handle adding a new edge
  const handleConnectEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetNodeId) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    const res = onAddEdge(selectedNode.id, targetNodeId);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to connect pathway.');
    } else {
      setSuccessMessage(`Connected pathway to ${targetNodeId}!`);
      setTargetNodeId('');
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const connectedEdgesForSelected = edges.filter(
    (e) => e.from === selectedNode.id || e.to === selectedNode.id
  );

  const isIdDuplicate =
    idInput.trim() !== selectedNode.id &&
    allNodes.some((n) => n.id === idInput.trim());

  return (
    <div className="space-y-4 p-4 text-xs font-sans">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
            <Edit3 className="w-3.5 h-3.5" />
          </span>
          <div>
            <h3 className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
              Node Editor
              {hasUnsavedChanges && (
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/80">
                  DRAFT
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400">In-Browser Debug Tools</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const newNode = onAddNode({
              x: selectedNode.x + 4,
              y: selectedNode.y,
              z: selectedNode.z + 4,
            });
            onSelectNode(newNode);
          }}
          data-testid="add-node-btn"
          className="px-2.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-[11px] flex items-center gap-1 transition cursor-pointer shadow-sm"
          title="Add a new node adjacent to selected"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Node
        </button>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800/70 text-rose-300 text-[11px] flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800/70 text-emerald-300 text-[11px] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* SECTION 1: Identity & Metadata Form */}
      <form onSubmit={handleApplyMetadata} className="space-y-2.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
            Node Name
          </label>
          <input
            type="text"
            data-testid="node-editor-name-input"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:border-amber-400/80 font-medium"
            placeholder="e.g. Central Library"
          />
        </div>

        <div>
          <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1 flex items-center justify-between">
            <span>Node ID</span>
            {isIdDuplicate && (
              <span className="text-rose-400 font-normal">Duplicate ID</span>
            )}
          </label>
          <input
            type="text"
            data-testid="node-editor-id-input"
            value={idInput}
            onChange={(e) => setIdInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            className={`w-full px-2.5 py-1.5 rounded bg-slate-900 border text-slate-100 text-xs font-mono focus:outline-none ${
              isIdDuplicate
                ? 'border-rose-500 bg-rose-950/20'
                : 'border-slate-700 focus:border-amber-400/80'
            }`}
            placeholder="e.g. central_library"
          />
        </div>

        <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer pt-0.5">
          <input
            type="checkbox"
            checked={cascadeEdges}
            onChange={(e) => setCascadeEdges(e.target.checked)}
            className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
          />
          <span>Cascade ID change to connecting edges</span>
        </label>

        <button
          type="submit"
          disabled={isIdDuplicate || !nameInput.trim() || !idInput.trim()}
          data-testid="save-metadata-btn"
          className="w-full py-1.5 px-3 rounded bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-1.5 mt-2"
        >
          <Check className="w-3.5 h-3.5" />
          Apply Name & ID
        </button>
      </form>

      {/* SECTION 2: 3D Spatial Position & Nudge Tools */}
      <div className="space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
            Spatial Position (Meters)
          </span>
          <button
            type="button"
            onClick={() => onToggleSnapToGrid(!snapToGrid)}
            className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border transition cursor-pointer ${
              snapToGrid
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Snap 3D Drag Gizmo to 1m grid"
          >
            <Grid className="w-3 h-3" />
            {snapToGrid ? 'Snap: 1m ON' : 'Snap: OFF'}
          </button>
        </div>

        {/* X Axis Control */}
        <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-red-400">X (East / West)</span>
            <input
              type="number"
              value={selectedNode.x}
              onChange={(e) =>
                onUpdatePosition(
                  selectedNode.id,
                  parseFloat(e.target.value) || 0,
                  selectedNode.y,
                  selectedNode.z
                )
              }
              className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-right text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'x', -5)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              -5m
            </button>
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'x', -1)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              -1m
            </button>
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'x', 1)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              +1m
            </button>
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'x', 5)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              +5m
            </button>
          </div>
        </div>

        {/* Y Axis Control */}
        <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-emerald-400">Y (Elevation)</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSnapToGround(selectedNode.id)}
                className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] hover:bg-emerald-900"
                title="Ground to Y = 0"
              >
                Ground (0m)
              </button>
              <input
                type="number"
                value={selectedNode.y}
                onChange={(e) =>
                  onUpdatePosition(
                    selectedNode.id,
                    selectedNode.x,
                    parseFloat(e.target.value) || 0,
                    selectedNode.z
                  )
                }
                className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-right text-xs text-white"
              />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'y', -5)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              -5m
            </button>
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'y', -1)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              -1m
            </button>
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'y', 1)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              +1m
            </button>
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'y', 5)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              +5m
            </button>
          </div>
        </div>

        {/* Z Axis Control */}
        <div className="p-2 rounded bg-slate-900/90 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-blue-400">Z (North / South)</span>
            <input
              type="number"
              value={selectedNode.z}
              onChange={(e) =>
                onUpdatePosition(
                  selectedNode.id,
                  selectedNode.x,
                  selectedNode.y,
                  parseFloat(e.target.value) || 0
                )
              }
              className="w-16 px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-right text-xs text-white"
            />
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'z', -5)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              -5m
            </button>
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'z', -1)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              -1m
            </button>
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'z', 1)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              +1m
            </button>
            <button
              type="button"
              onClick={() => onNudge(selectedNode.id, 'z', 5)}
              className="py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
            >
              +5m
            </button>
          </div>
        </div>

        {/* Quick Snapping Tools */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => onSnapToGrid(selectedNode.id, 1)}
            className="py-1.5 px-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] text-slate-300 font-mono text-center"
          >
            Snap 1m
          </button>
          <button
            type="button"
            onClick={() => onSnapToGrid(selectedNode.id, 5)}
            className="py-1.5 px-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] text-slate-300 font-mono text-center"
          >
            Snap 5m
          </button>
          <button
            type="button"
            onClick={() => onUpdatePosition(selectedNode.id, 0, selectedNode.y, 0)}
            className="py-1.5 px-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[10px] text-purple-300 font-mono text-center"
            title="Center X and Z to (0,0)"
          >
            Center (0,0)
          </button>
        </div>
      </div>

      {/* SECTION 3: Edge Creator & Connected Pathways */}
      <div className="space-y-3 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-emerald-400" />
            Edge Creator & Pathways
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800/60">
            {connectedEdgesForSelected.length} Connected
          </span>
        </div>

        {/* Form to connect selected node to a target */}
        <form onSubmit={handleConnectEdge} className="space-y-2">
          <label className="text-[10px] text-slate-400 block">
            Connect <span className="text-white font-mono font-semibold">{selectedNode.id}</span> to:
          </label>
          <div className="flex gap-1.5">
            <select
              value={targetNodeId}
              onChange={(e) => setTargetNodeId(e.target.value)}
              data-testid="edge-target-select"
              className="flex-1 px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="">Select destination node...</option>
              {allNodes
                .filter((n) => n.id !== selectedNode.id)
                .map((n) => {
                  const isConnected = edges.some(
                    (e) =>
                      (e.from === selectedNode.id && e.to === n.id) ||
                      (e.from === n.id && e.to === selectedNode.id)
                  );
                  return (
                    <option key={n.id} value={n.id} disabled={isConnected}>
                      {n.name} ({n.id}) {isConnected ? '— Connected' : ''}
                    </option>
                  );
                })}
            </select>
            <button
              type="submit"
              disabled={!targetNodeId}
              data-testid="add-edge-btn"
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center gap-1 transition cursor-pointer shrink-0 shadow-sm"
              title="Add a bidirectional campus pathway"
            >
              <Link2 className="w-3.5 h-3.5" />
              Connect
            </button>
          </div>
        </form>

        {/* Attached Pathways List */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] uppercase font-semibold text-slate-500 flex items-center justify-between">
            <span>Attached Pathways</span>
          </div>
          {connectedEdgesForSelected.length === 0 ? (
            <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-900/40 rounded border border-slate-800">
              No pathways attached to this node. Select a target above to connect.
            </div>
          ) : (
            <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
              {connectedEdgesForSelected.map((e, idx) => {
                const partnerId = e.from === selectedNode.id ? e.to : e.from;
                const partnerNode = allNodes.find((n) => n.id === partnerId);
                return (
                  <div
                    key={`${e.from}-${e.to}-${idx}`}
                    className="p-1.5 px-2 rounded bg-slate-900/90 border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 pr-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="truncate text-slate-200 font-medium">
                        {partnerNode?.name || partnerId}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        ({partnerId})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteEdge(e.from, e.to)}
                      data-testid={`delete-edge-${partnerId}`}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/50 transition cursor-pointer shrink-0"
                      title={`Disconnect pathway between ${selectedNode.id} and ${partnerId}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: Node Actions (Duplicate, Revert, Delete) */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => {
            const clone = onDuplicateNode(selectedNode.id);
            if (clone) onSelectNode(clone);
          }}
          className="py-1.5 px-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 transition"
          title="Duplicate selected node"
        >
          <CopyPlus className="w-3.5 h-3.5 text-cyan-400" />
          Clone
        </button>

        <button
          type="button"
          onClick={() => onRevertNode(selectedNode.id)}
          className="py-1.5 px-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-[11px] font-medium flex items-center justify-center gap-1 transition"
          title="Revert this node to pristine file coordinates"
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          Revert
        </button>

        <button
          type="button"
          onClick={() => {
            if (window.confirm(`Delete node "${selectedNode.name}" (${selectedNode.id})?`)) {
              onDeleteNode(selectedNode.id, true);
              onSelectNode(null);
            }
          }}
          data-testid="delete-node-btn"
          className="py-1.5 px-2 rounded bg-rose-950/40 border border-rose-900/60 hover:bg-rose-900/60 text-rose-300 text-[11px] font-medium flex items-center justify-center gap-1 transition"
          title="Delete node and purge connected edges"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          Delete
        </button>
      </div>

      {/* SECTION 4: Workspace Persistence & JSON Export Bar */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <div className="text-[10px] font-semibold uppercase text-slate-400">
          Persistence & Export
        </div>

        <button
          type="button"
          onClick={handleSaveDisk}
          disabled={isSavingDisk}
          data-testid="save-to-disk-btn"
          className="w-full py-2 px-3 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
        >
          <Save className="w-3.5 h-3.5" />
          {isSavingDisk ? 'Saving to Disk...' : 'Save to Disk (nodes.json)'}
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownloadJson}
            className="py-1.5 px-2.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-[11px] flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            Download JSON
          </button>
          <button
            type="button"
            onClick={handleCopyJson}
            className="py-1.5 px-2.5 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-[11px] flex items-center justify-center gap-1.5 transition"
          >
            {copiedJson ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                Copy JSON
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all nodes and edges to original defaults? All unsaved edits will be discarded.')) {
              onRevertAll();
            }
          }}
          className="w-full py-1 text-center text-[10px] text-slate-500 hover:text-slate-400 transition"
        >
          Reset All to Factory Defaults
        </button>
      </div>
    </div>
  );
};
