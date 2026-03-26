"use client";

import { useState, useEffect, useCallback } from "react";
import { History, ChevronRight, Zap, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import useWorkflowStore from "@/store/useWorkflowStore";

type NodeRunData = {
  id: string;
  nodeId: string;
  nodeType: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";
  outputData: any;
  error: string | null;
  durationMs: number | null;
  startedAt: string;
};

type RunData = {
  id: string;
  scope: string;
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "PARTIAL";
  startedAt: string;
  durationMs: number | null;
  nodeRuns: NodeRunData[];
};

const StatusBadge = ({ status }: { status: RunData["status"] }) => {
  const config = {
    SUCCESS: { icon: <CheckCircle2 size={12} />, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
    FAILED: { icon: <XCircle size={12} />, cls: "text-red-400 bg-red-500/10 border-red-500/30" },
    PARTIAL: { icon: <Clock size={12} />, cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    RUNNING: { icon: <Loader2 size={12} className="animate-spin" />, cls: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30" },
    PENDING: { icon: <Clock size={12} />, cls: "text-muted-foreground bg-muted/30 border-border" },
  };
  const { icon, cls } = config[status] ?? config.PENDING;
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border", cls)}>
      {icon} {status}
    </span>
  );
};

export default function RightSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [runs, setRuns] = useState<RunData[]>([]);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { workflowId, isExecuting } = useWorkflowStore();

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = workflowId
        ? `/api/history?workflowId=${workflowId}`
        : "/api/history";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch {}
    setIsLoading(false);
  }, [workflowId]);

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen, fetchHistory]);

  // Auto-refresh when execution completes
  useEffect(() => {
    if (!isExecuting && isOpen) {
      const timer = setTimeout(fetchHistory, 500);
      return () => clearTimeout(timer);
    }
  }, [isExecuting, isOpen, fetchHistory]);

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const scopeLabel: Record<string, string> = {
    FULL: "Full Workflow",
    PARTIAL: "Selected Nodes",
    SINGLE: "Single Node",
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="absolute right-4 top-20 bg-card border border-border rounded-full p-2.5 z-20 hover:bg-accent hover:text-accent-foreground text-muted-foreground shadow-sm transition-colors"
        >
          <History size={18} />
        </button>
      )}

      <div className={cn(
        "absolute right-0 top-0 bottom-0 bg-card/90 backdrop-blur-xl border-l border-border transition-all duration-300 z-30 flex flex-col shadow-2xl",
        isOpen ? "w-80 translate-x-0" : "w-80 translate-x-full"
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <div className="flex items-center gap-2 font-medium text-sm">
            <History size={16} className="text-primary" />
            <span>Workflow History</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchHistory}
              disabled={isLoading}
              className="p-1.5 rounded hover:bg-accent text-muted-foreground transition-colors"
              title="Refresh"
            >
              <Loader2 size={14} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded hover:bg-accent text-muted-foreground transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {runs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 gap-3 opacity-60">
              <div className="w-12 h-12 rounded-full bg-accent/50 flex items-center justify-center text-muted-foreground">
                <Zap size={24} />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Run nodes to see your execution history here.
              </p>
            </div>
          ) : (
            <div className="p-3 flex flex-col gap-2">
              {runs.map((run, idx) => (
                <div key={run.id} className="bg-background/50 border border-border/50 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}
                    className="w-full text-left px-3 py-2.5 flex flex-col gap-1.5 hover:bg-accent/20 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground/80">Run #{runs.length - idx}</span>
                      <StatusBadge status={run.status} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{formatTime(run.startedAt)}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <span className="bg-accent/40 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider font-medium">
                          {scopeLabel[run.scope] || run.scope}
                        </span>
                        <span>{formatDuration(run.durationMs)}</span>
                        {expandedRun === run.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </div>
                    </div>
                  </button>

                  {expandedRun === run.id && (
                    <div className="border-t border-border/40 px-3 py-2 flex flex-col gap-1.5">
                      {run.nodeRuns.map((nr) => (
                        <div key={nr.id} className="flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full" style={{
                                backgroundColor: nr.status === 'SUCCESS' ? '#10b981' : nr.status === 'FAILED' ? '#ef4444' : '#f59e0b'
                              }} />
                              <span className="text-[11px] font-medium text-foreground/80 capitalize">
                                {nr.nodeType} ({nr.nodeId.slice(-6)})
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">{formatDuration(nr.durationMs)}</span>
                          </div>
                          {nr.outputData && (
                            <p className="text-[10px] text-muted-foreground pl-3 font-mono truncate">
                              {typeof nr.outputData === 'object'
                                ? (nr.outputData.text?.slice(0, 60) || nr.outputData.imageUrl?.slice(-30) || JSON.stringify(nr.outputData).slice(0, 60))
                                : String(nr.outputData).slice(0, 60)}
                              {JSON.stringify(nr.outputData).length > 60 ? '...' : ''}
                            </p>
                          )}
                          {nr.error && (
                            <p className="text-[10px] text-destructive pl-3 font-mono truncate">{nr.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
