import { create } from 'zustand';
import { 
  Connection, 
  Edge, 
  EdgeChange, 
  Node, 
  NodeChange, 
  addEdge, 
  OnNodesChange, 
  OnEdgesChange, 
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import { initialNodes, initialEdges } from './initialWorkflow';

export type ExecutionScope = 'FULL' | 'PARTIAL' | 'SINGLE';

export type WorkflowState = {
  nodes: Node[];
  edges: Edge[];
  workflowId: string | null;
  workflowName: string;
  isExecuting: boolean;
  
  // React Flow handlers
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  
  // Node management
  addNode: (node: Node) => void;
  updateNodeData: (id: string, data: any) => void;
  deleteNode: (id: string) => void;
  
  // Workflow persistence
  saveWorkflow: () => Promise<string | null>;
  loadWorkflow: (id: string) => Promise<void>;
  
  // Execution
  executeWorkflow: (scope?: ExecutionScope, selectedNodeIds?: string[]) => Promise<void>;
};

const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  workflowId: null,
  workflowName: 'Product Marketing Kit Generator',
  isExecuting: false,
  
  onNodesChange: (changes: NodeChange[]) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
  },
  onConnect: (connection: Connection) => {
    set({
      edges: addEdge({ 
        ...connection, 
        animated: true, 
        style: { stroke: '#7c3aed', strokeWidth: 2 } 
      }, get().edges),
    });
  },
  
  addNode: (node: Node) => {
    set({ nodes: [...get().nodes, node] });
  },
  
  updateNodeData: (id: string, data: any) => {
    set({
      nodes: get().nodes.map((node) => 
        node.id === id ? { ...node, data: { ...node.data, ...data } } : node
      )
    });
  },
  
  deleteNode: (id: string) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== id),
      edges: get().edges.filter((e) => e.source !== id && e.target !== id),
    });
  },
  
  saveWorkflow: async () => {
    const { nodes, edges, workflowId, workflowName } = get();
    try {
      // Strip base64 data URLs from nodes before saving to avoid 413 Payload Too Large
      const safeNodes = nodes.map(n => ({
        ...n,
        data: {
          ...n.data,
          imageUrl: (typeof n.data?.imageUrl === 'string' && n.data.imageUrl.startsWith('data:')) ? null : n.data?.imageUrl,
          videoUrl: (typeof n.data?.videoUrl === 'string' && n.data.videoUrl.startsWith('data:')) ? null : n.data?.videoUrl,
        }
      }));

      if (workflowId) {
        await fetch(`/api/workflows/${workflowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: safeNodes, edges, name: workflowName }),
        });
        return workflowId;
      } else {
        const res = await fetch('/api/workflows', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodes: safeNodes, edges, name: workflowName }),
        });
        const data = await res.json();
        set({ workflowId: data.workflow?.id });
        return data.workflow?.id || null;
      }
    } catch (err) {
      console.error('Failed to save workflow', err);
      return null;
    }
  },
  
  loadWorkflow: async (id: string) => {
    try {
      const res = await fetch(`/api/workflows/${id}`);
      const data = await res.json();
      if (data.workflow) {
        set({
          nodes: data.workflow.nodes,
          edges: data.workflow.edges,
          workflowId: data.workflow.id,
          workflowName: data.workflow.name,
        });
      }
    } catch (err) {
      console.error('Failed to load workflow', err);
    }
  },
  
  executeWorkflow: async (scope: ExecutionScope = 'FULL', selectedNodeIds?: string[]) => {
    const { nodes, edges, workflowId, isExecuting } = get();
    if (isExecuting) return;
    
    set({ isExecuting: true });
    
    // Mark all targeted nodes as running
    const targetIds = scope === 'FULL' ? nodes.map(n => n.id) : (selectedNodeIds || []);
    set({
      nodes: get().nodes.map(n =>
        targetIds.includes(n.id) ? { ...n, data: { ...n.data, isRunning: true, hasError: false } } : n
      )
    });
    
    try {
      // Ensure we have a saved workflow
      let wfId = workflowId;
      if (!wfId) {
        wfId = await get().saveWorkflow();
      }
      if (!wfId) throw new Error('No workflow ID');
      
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workflowId: wfId,
          // Strip base64 data URLs from nodes — only keep real /uploads/ URLs and text
          nodes: nodes.map(n => ({
            ...n,
            data: {
              ...n.data,
              // Replace base64 with null (execute route won't need it — it uses Gemini inline data from the URL)
              imageUrl: (typeof n.data?.imageUrl === 'string' && n.data.imageUrl.startsWith('data:')) ? null : n.data?.imageUrl,
              videoUrl: (typeof n.data?.videoUrl === 'string' && n.data.videoUrl.startsWith('data:')) ? null : n.data?.videoUrl,
            }
          })),
          edges,
          scope,
          selectedNodeIds,
        }),
      });
      
      const data = await res.json();
      
      // Update node data with outputs from execution
      if (data.outputs) {
        set({
          nodes: get().nodes.map(n => {
            const output = data.outputs[n.id];
            const nodeRunInfo = data.nodeRuns?.find((nr: any) => nr.nodeId === n.id);
            if (!output && !nodeRunInfo) return n;
            return {
              ...n,
              data: {
                ...n.data,
                isRunning: false,
                hasError: nodeRunInfo?.status === 'FAILED',
                result: output?.text || null,
                imageUrl: output?.imageUrl || n.data?.imageUrl,
                videoUrl: output?.videoUrl || n.data?.videoUrl,
                error: nodeRunInfo?.error || null,
              }
            };
          })
        });
      }
    } catch (err: any) {
      console.error('Execution failed:', err);
      // Mark all targeted nodes as error
      set({
        nodes: get().nodes.map(n =>
          targetIds.includes(n.id) ? { ...n, data: { ...n.data, isRunning: false, hasError: true, error: err.message } } : n
        )
      });
    } finally {
      set({ isExecuting: false });
    }
  },
}));

export default useWorkflowStore;
