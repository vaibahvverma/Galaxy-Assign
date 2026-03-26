import { Handle, Position } from '@xyflow/react';
import { Type } from 'lucide-react';
import BaseNode from './BaseNode';
import { useState } from 'react';

export default function TextNode({ id, data, isConnectable }: any) {
  const [text, setText] = useState(data.text || '');

  return (
    <BaseNode id={id} title="Text" icon={<Type size={16} className="text-blue-400" />} isRunning={data?.isRunning}>
      <div className="flex flex-col gap-1.5 w-full nodrag">
        <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Text Input</label>
        <textarea 
          placeholder="Enter text..."
          className="w-full min-h-[100px] bg-input/40 border border-border/60 rounded-lg p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring text-foreground resize-y transition-colors"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        id="output" 
        isConnectable={isConnectable} 
        className="w-3.5 h-3.5 bg-blue-500 border-2 border-background"
      />
    </BaseNode>
  );
}
