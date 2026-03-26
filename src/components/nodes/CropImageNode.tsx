import { Handle, Position } from '@xyflow/react';
import { Crop } from 'lucide-react';
import BaseNode from './BaseNode';
import { useState } from 'react';

export default function CropImageNode({ id, data, isConnectable }: any) {
  const [params, setParams] = useState({ x: 0, y: 0, w: 100, h: 100 });

  return (
    <BaseNode id={id} title="Crop Image" icon={<Crop size={16} className="text-amber-400" />} isRunning={data?.isRunning} hasError={data?.hasError}>
      <div className="flex flex-col gap-3 w-full nodrag cursor-default">
        {/* Input Handles representation */}
        <div className="relative flex items-center justify-between text-xs text-foreground font-medium mb-1 border-b border-border/40 pb-2">
          <span>Image URL *</span>
          <Handle type="target" position={Position.Left} id="image_url" isConnectable={isConnectable} className="w-3.5 h-3.5 bg-emerald-500 border-2 border-background -left-5" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1 relative">
             <Handle type="target" position={Position.Left} id="x_percent" isConnectable={isConnectable} className="w-2.5 h-2.5 bg-amber-500 border-2 border-background -left-[23px] top-7" />
             <label className="text-[10px] text-muted-foreground uppercase tracking-wider text-center">X (%)</label>
             <input type="number" value={params.x} onChange={e => setParams({...params, x: Number(e.target.value)})} className="bg-input/40 border border-border/60 rounded p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-center transition-colors" />
          </div>
          <div className="flex flex-col gap-1 relative">
             <Handle type="target" position={Position.Left} id="y_percent" isConnectable={isConnectable} className="w-0 h-0 opacity-0 border-0 -left-5 top-7 pointer-events-none" /> 
             <label className="text-[10px] text-muted-foreground uppercase tracking-wider text-center">Y (%)</label>
             <input type="number" value={params.y} onChange={e => setParams({...params, y: Number(e.target.value)})} className="bg-input/40 border border-border/60 rounded p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-center transition-colors" />
          </div>
          <div className="flex flex-col gap-1 relative">
             <Handle type="target" position={Position.Left} id="width_percent" isConnectable={isConnectable} className="w-2.5 h-2.5 bg-amber-500 border-2 border-background -left-[23px] top-7" />
             <label className="text-[10px] text-muted-foreground uppercase tracking-wider text-center">Width (%)</label>
             <input type="number" value={params.w} onChange={e => setParams({...params, w: Number(e.target.value)})} className="bg-input/40 border border-border/60 rounded p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-center transition-colors" />
          </div>
          <div className="flex flex-col gap-1 relative">
             <Handle type="target" position={Position.Left} id="height_percent" isConnectable={isConnectable} className="w-0 h-0 opacity-0 border-0 -left-5 top-7 pointer-events-none" />
             <label className="text-[10px] text-muted-foreground uppercase tracking-wider text-center">Height (%)</label>
             <input type="number" value={params.h} onChange={e => setParams({...params, h: Number(e.target.value)})} className="bg-input/40 border border-border/60 rounded p-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-center transition-colors" />
          </div>
        </div>

        {data?.imageUrl && (
          <div className="mt-1 text-[10px] text-muted-foreground font-mono bg-black/20 p-2 rounded truncate border border-border/40">
            Output: ...{data.imageUrl.slice(-20)}
          </div>
        )}
      </div>

      <Handle 
        type="source" 
        position={Position.Right} 
        id="output" 
        isConnectable={isConnectable} 
        className="w-3.5 h-3.5 bg-emerald-500 border-2 border-background"
      />
    </BaseNode>
  );
}
