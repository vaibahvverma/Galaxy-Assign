import { Handle, Position } from '@xyflow/react';
import { Film } from 'lucide-react';
import BaseNode from './BaseNode';
import { useState } from 'react';

export default function ExtractFrameNode({ id, data, isConnectable }: any) {
  const [timestamp, setTimestamp] = useState(data.timestamp || "50%");

  return (
    <BaseNode id={id} title="Extract Frame" icon={<Film size={16} className="text-cyan-400" />} isRunning={data?.isRunning} hasError={data?.hasError}>
      <div className="flex flex-col gap-4 w-full nodrag cursor-default">
        <div className="relative flex items-center justify-between text-xs text-foreground font-medium border-b border-border/40 pb-2">
          <span>Video URL *</span>
          <Handle type="target" position={Position.Left} id="video_url" isConnectable={isConnectable} className="w-3.5 h-3.5 bg-purple-500 border-2 border-background -left-5" />
        </div>

        <div className="flex flex-col gap-2 relative">
          <Handle type="target" position={Position.Left} id="timestamp" isConnectable={isConnectable} className="w-3.5 h-3.5 bg-cyan-500 border-2 border-background -left-5 top-7" />
          <label className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Timestamp (s or %)</label>
          <input 
            type="text" 
            value={timestamp} 
            onChange={e => setTimestamp(e.target.value)} 
            className="bg-input/40 border border-border/60 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full transition-colors" 
          />
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
        className="w-3.5 h-3.5 bg-emerald-500 border-2 border-background" /* Outputs image URL */
      />
    </BaseNode>
  );
}
