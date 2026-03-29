"use client";

import { Play, Save, Download, Upload, Loader2, Zap } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import useWorkflowStore from "@/store/useWorkflowStore";
import { useRef } from "react";

export default function WorkflowToolbar() {
  const { executeWorkflow, saveWorkflow, isExecuting, workflowName, workflowId, nodes, edges } = useWorkflowStore();
  const importRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (workflowId) {
      window.open(`/api/export?workflowId=${workflowId}`, "_blank");
    } else {
      const blob = new Blob(
        [JSON.stringify({ name: workflowName, nodes, edges }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${workflowName.replace(/\s+/g, "_")}.json`;
      a.click();
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const json = JSON.parse(text);
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(json),
    });
    const data = await res.json();
    if (data.workflow?.id) {
      await useWorkflowStore.getState().loadWorkflow(data.workflow.id);
    }
  };

  return (
    <>
      {/* Floating toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-card/80 backdrop-blur-md border border-border/60 rounded-full px-4 py-2 shadow-lg pointer-events-auto">
        <span className="text-sm font-semibold text-foreground/70 mr-2 select-none truncate max-w-[200px]">
          {workflowName}
        </span>

        <button
          onClick={() => saveWorkflow()}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-foreground/80 transition-colors"
        >
          <Save size={13} /> Save
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-foreground/80 transition-colors"
        >
          <Download size={13} /> Export
        </button>

        <button
          onClick={() => importRef.current?.click()}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-secondary hover:bg-accent text-foreground/80 transition-colors"
        >
          <Upload size={13} /> Import
        </button>
        <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImport} />

        <button
          onClick={() => executeWorkflow("FULL")}
          disabled={isExecuting}
          className="flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground transition-colors disabled:opacity-60 shadow-sm ml-1"
        >
          {isExecuting ? (
            <><Loader2 size={13} className="animate-spin" /> Running…</>
          ) : (
            <><Zap size={13} /> Run All</>
          )}
        </button>
      </div>

      {/* UserButton */}
      <div className="absolute top-4 right-4 z-20 pointer-events-auto">
        <UserButton />
      </div>
    </>
  );
}
