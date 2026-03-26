import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Cpu, Settings2, Sparkles } from 'lucide-react';
import BaseNode from './BaseNode';
import { useState, useCallback } from 'react';

export default function LLMNode({ id, data, isConnectable }: any) {
  const [model, setModel] = useState(data.model || 'gemini-2.5-flash');
  const { updateNodeData } = useReactFlow();

  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModel = e.target.value;
    setModel(newModel);
    updateNodeData(id, { model: newModel });
  }, [id, updateNodeData]);

  return (
    <BaseNode id={id} title="Run Any LLM" icon={<Cpu size={16} className="text-rose-400" />} isRunning={data?.isRunning} hasError={data?.hasError}>
      <div className="flex flex-col gap-4 w-full nodrag">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1">
            <Settings2 size={12} /> Model
          </label>
          <select 
            className="w-full bg-input/40 border border-border/60 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground appearance-none cursor-pointer transition-colors"
            value={model}
            onChange={handleModelChange}
          >
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
          </select>
        </div>

        {/* Input handles visually represented */}
        <div className="flex flex-col gap-3 border-t border-border/40 pt-4">
          <div className="relative flex items-center justify-between text-xs text-muted-foreground">
            <span>System Prompt</span>
            <Handle type="target" position={Position.Left} id="system_prompt" isConnectable={isConnectable} className="w-3.5 h-3.5 bg-blue-500 border-2 border-background -left-5" />
          </div>
          <div className="relative flex items-center justify-between text-xs text-foreground font-medium">
            <span>User Message *</span>
            <Handle type="target" position={Position.Left} id="user_message" isConnectable={isConnectable} className="w-3.5 h-3.5 bg-blue-500 border-2 border-background -left-5" />
          </div>
          <div className="relative flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">Images <span className="text-[10px] opacity-60">(Multiple)</span></span>
            <Handle type="target" position={Position.Left} id="images" isConnectable={isConnectable} className="w-3.5 h-3.5 bg-emerald-500 border-2 border-background -left-5" />
          </div>
        </div>

        {/* Output result area */}
        {data?.result && (
          <div className="mt-2 bg-primary/10 border border-primary/20 rounded-lg p-3 relative max-h-[300px] overflow-y-auto custom-scrollbar">
            <div className="flex items-center gap-1.5 mb-2 text-primary text-[11px] font-bold uppercase tracking-wider">
              <Sparkles size={12} /> Result
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed font-mono whitespace-pre-wrap text-left break-words">
              {data.result}
            </p>
          </div>
        )}
        
        {data?.error && (
          <div className="mt-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
             <p className="text-xs text-destructive font-medium">{data.error}</p>
          </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        id="output" 
        isConnectable={isConnectable} 
        className="w-3.5 h-3.5 bg-rose-500 border-2 border-background"
      />
    </BaseNode>
  );
}
