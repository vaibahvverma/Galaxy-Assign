"use client";

import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Type, 
  Image as ImageIcon, 
  Video, 
  Cpu, 
  Crop, 
  Film 
} from "lucide-react";

export default function LeftSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const nodeTypes = [
    { type: "text", label: "Text", icon: <Type size={18} />, bg: "bg-blue-500/20", color: "text-blue-400" },
    { type: "imageUpload", label: "Upload Image", icon: <ImageIcon size={18} />, bg: "bg-emerald-500/20", color: "text-emerald-400" },
    { type: "videoUpload", label: "Upload Video", icon: <Video size={18} />, bg: "bg-purple-500/20", color: "text-purple-400" },
    { type: "llm", label: "Run Any LLM", icon: <Cpu size={18} />, bg: "bg-rose-500/20", color: "text-rose-400" },
    { type: "cropImage", label: "Crop Image", icon: <Crop size={18} />, bg: "bg-amber-500/20", color: "text-amber-400" },
    { type: "extractFrame", label: "Extract Frame from Video", icon: <Film size={18} />, bg: "bg-cyan-500/20", color: "text-cyan-400" },
  ];

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const filteredNodes = nodeTypes.filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className={`relative h-full bg-card/50 backdrop-blur-md border-r border-border transition-all duration-300 z-10 flex flex-col ${isCollapsed ? 'w-16' : 'w-72'}`}>
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 transform -translate-y-1/2 bg-card border border-border rounded-full p-1 z-20 hover:bg-accent/80 hover:text-accent-foreground text-muted-foreground transition-colors shadow-sm"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {!isCollapsed ? (
        <div className="p-4 flex flex-col h-full overflow-hidden">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <input 
              type="text" 
              placeholder="Search nodes..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input/20 border border-border rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-ring placeholder-muted-foreground transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4 ml-1">Quick Access</h3>
            <div className="space-y-1.5">
              {filteredNodes.map((node) => (
                <div 
                  key={node.type}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-transparent border border-transparent hover:bg-accent/30 hover:border-border/50 cursor-grab active:cursor-grabbing transition-all group"
                  onDragStart={(event) => onDragStart(event, node.type)}
                  draggable
                >
                  <div className={`p-2 rounded-md ${node.bg} ${node.color} group-hover:scale-105 transition-transform duration-200 shadow-sm`}>
                    {node.icon}
                  </div>
                  <span className="text-sm font-medium text-card-foreground/90 select-none">{node.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="py-6 flex flex-col items-center gap-5 h-full overflow-y-auto">
          {nodeTypes.map((node) => (
            <div 
              key={node.type}
              className={`p-2.5 rounded-md ${node.bg} ${node.color} cursor-grab active:cursor-grabbing hover:scale-110 transition-transform shadow-sm`}
              onDragStart={(event) => onDragStart(event, node.type)}
              draggable
              title={node.label}
            >
              {node.icon}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
