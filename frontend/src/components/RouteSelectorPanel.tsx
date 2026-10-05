import React, { useState, useRef, useEffect } from 'react';
import {
  Navigation,
  ArrowUpDown,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  MapPin,
  Flag,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  RefreshCw,
  XCircle,
  Clock,
  Layers,
  Download,
  Upload,
} from 'lucide-react';
import { NodeItem } from '../lib/graphViewerUtils';
import {
  RouteResult,
  EngineStatusCheck,
  checkEngineStatus,
  fetchEngineStatus,
  generateRouteRequestJson,
  loadRouteResult,
  loadLatestStaticRouteResult,
} from '../lib/engineBridge';
import { RouteAnimationState } from '../hooks/useRouteAnimation';

export interface RouteSelectorPanelProps {
  nodes: NodeItem[];
  sourceId: string | null;
  destinationId: string | null;
  onSelectSource: (id: string | null) => void;
  onSelectDestination: (id: string | null) => void;
  onFindRoute: () => void;
  onClearRoute: () => void;
  onImportRouteResult?: (result: RouteResult) => void;
  isLoading: boolean;
  routeResult: RouteResult | null;
  animationState: RouteAnimationState;
}

export const RouteSelectorPanel: React.FC<RouteSelectorPanelProps> = ({
  nodes,
  sourceId,
  destinationId,
  onSelectSource,
  onSelectDestination,
  onFindRoute,
  onClearRoute,
  onImportRouteResult,
  isLoading,
  routeResult,
  animationState,
}) => {
  const [engineStatus, setEngineStatus] = useState<EngineStatusCheck>(() => checkEngineStatus());
  const [showLog, setShowLog] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check C engine availability on mount
  useEffect(() => {
    fetchEngineStatus().then((status) => {
      setEngineStatus(status);
    });
  }, [routeResult]);

  const handleSwap = () => {
    const temp = sourceId;
    onSelectSource(destinationId);
    onSelectDestination(temp);
  };

  const isFormValid = Boolean(sourceId && destinationId);

  // Helper to download route_request.json for routefinder.exe
  const handleExportRequestJson = () => {
    if (!sourceId || !destinationId) return;
    const jsonStr = generateRouteRequestJson({ source: sourceId, destination: destinationId });
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'route_request.json';
    a.click();
    URL.revokeObjectURL(url);
    setFeedbackMessage({ text: 'Exported route_request.json to download folder.', type: 'success' });
  };

  // Helper to load latest public/route_result.json
  const handleLoadLatestStatic = async () => {
    setIsRefreshing(true);
    setFeedbackMessage(null);
    try {
      const result = await loadLatestStaticRouteResult();
      if (onImportRouteResult) {
        onImportRouteResult(result);
      }
      setFeedbackMessage({
        text: `Loaded latest C engine result (${result.path.length} nodes, ${result.hops} hops).`,
        type: 'success',
      });
    } catch (err) {
      setFeedbackMessage({
        text: (err as Error).message || 'Failed to load public/route_result.json.',
        type: 'error',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Helper to import route_result.json produced by routefinder.exe
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeedbackMessage(null);
    try {
      const text = await file.text();
      const result = await loadRouteResult(text);
      if (onImportRouteResult) {
        onImportRouteResult(result);
      }
      setFeedbackMessage({
        text: `Imported route_result.json successfully (${result.path.length} nodes).`,
        type: 'success',
      });
    } catch (err) {
      setFeedbackMessage({ text: (err as Error).message, type: 'error' });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto divide-y divide-slate-800/80">
      {/* SECTION 0: C Engine Status & Verification Check Banner */}
      {engineStatus.isCEngineActive ? (
        <div
          data-testid="engine-connected-status"
          className="p-3 bg-emerald-950/40 border-b border-emerald-600/40 text-emerald-200 text-xs space-y-1.5 backdrop-blur-sm shrink-0"
        >
          <div className="flex items-center gap-1.5 font-bold text-emerald-300 text-[11px] uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{engineStatus.warningTitle}</span>
            <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 shrink-0">
              NATIVE C BFS
            </span>
          </div>
          <p className="text-[11px] text-emerald-200/80 leading-relaxed">
            {engineStatus.warningDetails}
          </p>
        </div>
      ) : (
        <div
          data-testid="engine-demo-warning"
          className="p-3 bg-amber-950/40 border-b border-amber-600/40 text-amber-200 text-xs space-y-1.5 backdrop-blur-sm shrink-0"
        >
          <div className="flex items-center gap-1.5 font-bold text-amber-300 text-[11px] uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{engineStatus.warningTitle}</span>
            <span className="ml-auto text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-900/80 text-amber-300 border border-amber-700/60 shrink-0">
              SIMULATION
            </span>
          </div>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            {engineStatus.warningDetails}
          </p>
        </div>
      )}

      {/* SECTION 1: Waypoint Selection & Engine Request Form */}
      <div className="p-4 space-y-3 bg-slate-900/40 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            Route Endpoints
          </span>
          {routeResult && (
            <button
              onClick={onClearRoute}
              className="text-[10px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition cursor-pointer"
            >
              <XCircle className="w-3 h-3" />
              Clear Route
            </button>
          )}
        </div>

        {/* Source (Starting Point) */}
        <div>
          <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block ring-2 ring-emerald-500/20" />
            <span>Starting Point (Source)</span>
          </label>
          <div className="relative">
            <select
              data-testid="route-source-select"
              value={sourceId || ''}
              onChange={(e) => onSelectSource(e.target.value || null)}
              className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500/70 cursor-pointer"
            >
              <option value="">Select campus origin...</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.id})
                </option>
              ))}
            </select>
            <MapPin className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-emerald-400 pointer-events-none" />
          </div>
        </div>

        {/* Swap Button Divider */}
        <div className="flex items-center justify-center my-1">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap source and destination"
            className="p-1.5 rounded-full bg-slate-950 border border-slate-800 hover:border-cyan-500/60 text-slate-400 hover:text-cyan-300 transition cursor-pointer shadow-sm"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destination (Ending Point) */}
        <div>
          <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1.5 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block ring-2 ring-rose-500/20" />
            <span>Ending Point (Destination)</span>
          </label>
          <div className="relative">
            <select
              data-testid="route-dest-select"
              value={destinationId || ''}
              onChange={(e) => onSelectDestination(e.target.value || null)}
              className="w-full pl-3 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-rose-500/70 cursor-pointer"
            >
              <option value="">Select campus destination...</option>
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.id})
                </option>
              ))}
            </select>
            <Flag className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-rose-400 pointer-events-none" />
          </div>
        </div>

        {/* Action Button: Find Route (Automated Execution) */}
        <button
          type="button"
          data-testid="find-route-btn"
          disabled={!isFormValid || isLoading}
          onClick={onFindRoute}
          className={`w-full py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer ${
            !isFormValid || isLoading
              ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white border border-cyan-400/40 shadow-cyan-900/30 active:scale-[0.99]'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running C BFS Engine...
            </span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Find Route (C Engine)</span>
            </>
          )}
        </button>

        {/* Load Latest Static Result Quick Action */}
        <button
          type="button"
          onClick={handleLoadLatestStatic}
          disabled={isRefreshing}
          className="w-full py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-300 hover:text-emerald-300 transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Reload Result (public/route_result.json)</span>
        </button>

        {/* File Workflow Helpers */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
          {/* Export route_request.json */}
          <button
            type="button"
            onClick={handleExportRequestJson}
            disabled={!isFormValid}
            title="Download route_request.json"
            className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 disabled:opacity-30 transition cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Export route_request.json</span>
          </button>

          {/* Import route_result.json */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Import route_result.json file"
              className="flex items-center gap-1 text-slate-400 hover:text-emerald-300 transition cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Import route_result.json</span>
            </button>
          </div>
        </div>

        {feedbackMessage && (
          <div
            className={`text-[10px] p-2 rounded border leading-relaxed ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                : 'bg-rose-950/40 text-rose-300 border-rose-800/50'
            }`}
          >
            {feedbackMessage.text}
          </div>
        )}
      </div>

      {/* SECTION 2: Route Result Summary */}
      {routeResult && (
        <div className="p-4 space-y-3 bg-slate-950/60 flex-1">
          {routeResult.found ? (
            <>
              {/* Metrics Header */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {routeResult.isNativeC ? 'Native C BFS Route' : 'Engine Path Returned'}
                </span>
                <div className="flex items-center gap-1.5">
                  {routeResult.isNativeC && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                      NATIVE C
                    </span>
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    {routeResult.hops ?? routeResult.path.length - 1} HOPS
                  </span>
                </div>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                    <Layers className="w-3 h-3 text-cyan-400" />
                    Hop Count
                  </span>
                  <div className="text-base font-bold font-mono text-cyan-300 mt-0.5">
                    {routeResult.hops ?? routeResult.path.length - 1} Hops
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-400" />
                    Path Nodes
                  </span>
                  <div className="text-base font-bold font-mono text-amber-300 mt-0.5">
                    {routeResult.path.length} Nodes
                  </div>
                </div>
              </div>

              {/* C Engine stdout terminal drawer */}
              {routeResult.engineLog && (
                <div className="rounded-lg bg-slate-900/90 border border-emerald-900/40 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setShowLog(!showLog)}
                    className="w-full px-3 py-2 bg-slate-950/70 hover:bg-slate-950 text-slate-300 flex items-center justify-between text-[11px] font-mono transition cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>routefinder.exe stdout log</span>
                    </span>
                    <span className="text-[10px] text-slate-500">{showLog ? 'Hide' : 'Show'}</span>
                  </button>
                  {showLog && (
                    <pre className="p-3 text-[10px] font-mono text-emerald-300/90 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed border-t border-slate-800 bg-slate-950">
                      {routeResult.engineLog}
                    </pre>
                  )}
                </div>
              )}

              {/* Sequential Animation HUD */}
              <div className="p-3 rounded-lg bg-slate-900/90 border border-cyan-900/40 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400" />
                    Sequential Animation
                  </span>
                  <span className="font-mono text-[11px] text-cyan-400">
                    Step {animationState.totalSteps > 0 ? animationState.currentStep + 1 : 0} /{' '}
                    {animationState.totalSteps}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500 h-full transition-all duration-300"
                    style={{
                      width: `${
                        animationState.totalSteps > 1
                          ? ((animationState.currentStep + 1) / animationState.totalSteps) * 100
                          : 100
                      }%`,
                    }}
                  />
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={animationState.stepBackward}
                      disabled={animationState.currentStep <= 0}
                      title="Step Backward"
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
                    >
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>

                    {animationState.isPlaying ? (
                      <button
                        type="button"
                        onClick={animationState.pause}
                        title="Pause"
                        className="p-1.5 px-3 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold flex items-center gap-1 text-xs transition cursor-pointer shadow"
                      >
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>Pause</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={animationState.play}
                        title="Play Sequential Animation"
                        className="p-1.5 px-3 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold flex items-center gap-1 text-xs transition cursor-pointer shadow"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{animationState.isCompleted ? 'Replay' : 'Play'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={animationState.stepForward}
                      disabled={animationState.isCompleted}
                      title="Step Forward"
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition cursor-pointer"
                    >
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={animationState.reset}
                      title="Reset to Start"
                      className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Speed Selector */}
                  <select
                    value={animationState.speedMs}
                    onChange={(e) => animationState.setSpeed(Number(e.target.value))}
                    className="bg-slate-950 border border-slate-800 text-[10px] text-slate-300 rounded px-1.5 py-1 focus:outline-none cursor-pointer"
                  >
                    <option value={700}>0.5x Slow</option>
                    <option value={400}>1.0x Normal</option>
                    <option value={200}>2.0x Fast</option>
                  </select>
                </div>
              </div>

              {/* Waypoint Breadcrumbs */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Path Sequence ({routeResult.path.length} Nodes)
                </span>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {routeResult.path.map((nodeId, idx) => {
                    const node = nodes.find((n) => n.id === nodeId);
                    const isSource = idx === 0;
                    const isDest = idx === routeResult.path.length - 1;
                    const isCurrent = idx === animationState.currentStep;
                    const isIlluminated = animationState.illuminatedNodeIds.has(nodeId);

                    return (
                      <div
                        key={`${nodeId}-${idx}`}
                        className={`p-2 rounded flex items-center justify-between text-xs transition border ${
                          isCurrent
                            ? 'bg-amber-950/60 border-amber-500/80 text-white shadow-sm'
                            : isIlluminated
                            ? 'bg-slate-900 border-slate-700 text-slate-200'
                            : 'bg-slate-950/40 border-slate-800/40 text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`w-4 h-4 rounded-full text-[9px] font-mono font-bold flex items-center justify-center shrink-0 ${
                              isSource
                                ? 'bg-emerald-500 text-slate-950'
                                : isDest
                                ? 'bg-rose-500 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <span className="truncate font-medium">{node?.name || nodeId}</span>
                        </div>

                        <span
                          className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded shrink-0 ${
                            isSource
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                              : isDest
                              ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                              : 'text-slate-500'
                          }`}
                        >
                          {isSource ? 'START' : isDest ? 'DEST' : `STEP ${idx}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-xs">Route Not Found</div>
                <div className="text-[11px] text-rose-300/80 mt-0.5">
                  {routeResult.message || 'The engine could not find a path between the selected nodes.'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
