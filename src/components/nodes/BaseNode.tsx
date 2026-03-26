import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BaseNodeProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
  isRunning?: boolean;
  hasError?: boolean;
  className?: string;
}

export default function BaseNode({ 
  title, 
  icon, 
  children, 
  isRunning = false, 
  hasError = false,
  className
}: BaseNodeProps) {
  return (
    <div 
      className={cn(
        "bg-card/90 backdrop-blur-xl border border-border shadow-xl rounded-xl w-80 overflow-hidden transition-all",
        isRunning && "animate-pulse-glow border-primary",
        hasError && "border-destructive",
        className
      )}
    >
      <div className="bg-muted/30 px-4 py-2.5 flex items-center gap-2.5 border-b border-border/60">
        <div className="text-muted-foreground p-1 rounded-md bg-accent/30 shadow-sm">{icon}</div>
        <h3 className="font-semibold text-sm text-card-foreground select-none flex-1 tracking-wide">{title}</h3>
      </div>
      <div className="p-4 flex flex-col gap-4 relative">
        {children}
      </div>
    </div>
  );
}
