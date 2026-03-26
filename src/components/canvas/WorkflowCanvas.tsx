"use client";

import { useCallback, useRef } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import useWorkflowStore from "@/store/useWorkflowStore";

import TextNode from "../nodes/TextNode";
import UploadImageNode from "../nodes/UploadImageNode";
import UploadVideoNode from "../nodes/UploadVideoNode";
import LLMNode from "../nodes/LLMNode";
import CropImageNode from "../nodes/CropImageNode";
import ExtractFrameNode from "../nodes/ExtractFrameNode";

const nodeTypes = {
  text: TextNode,
  imageUpload: UploadImageNode,
  videoUpload: UploadVideoNode,
  llm: LLMNode,
  cropImage: CropImageNode,
  extractFrame: ExtractFrameNode,
}; 

function WorkflowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addNode } = useWorkflowStore();
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `${type} node` },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode],
  );

  return (
    <div className="w-full h-full" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
        minZoom={0.1}
        maxZoom={4}
      >
        <Background 
          variant={BackgroundVariant.Dots}
          color="#3f3f46" // zinc-700
          gap={16} 
          size={1.5} 
        />
        <MiniMap 
          className="!bg-card !border !border-border rounded-lg shadow-xl !mb-6 !mr-80"
          maskColor="rgba(0, 0, 0, 0.4)"
          nodeColor="#7c3aed" // primary purple
          pannable
          zoomable
        />
        <Controls 
          className="!bg-card !border !border-border !fill-foreground [&>button]:!border-b-border [&>button]:hover:!bg-accent" 
        />
      </ReactFlow>
    </div>
  );
}

export default function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}
