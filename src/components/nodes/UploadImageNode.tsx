"use client";

import { Handle, Position } from "@xyflow/react";
import { Image as ImageIcon, UploadCloud, X, Loader2 } from "lucide-react";
import BaseNode from "./BaseNode";
import { useCallback, useRef, useState } from "react";
import useWorkflowStore from "@/store/useWorkflowStore";

export default function UploadImageNode({ id, data, isConnectable }: any) {
  const imageUrl = data?.imageUrl;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select an image file (jpg, png, webp, gif)");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setUploadError("File too large (max 50MB)");
        return;
      }

      setUploadError(null);
      setIsUploading(true);

      // Immediately show a local preview
      const localUrl = URL.createObjectURL(file);
      updateNodeData(id, { imageUrl: localUrl });

      try {
        const form = new FormData();
        form.append("file", file);
        form.append("type", "image");

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || "Upload failed");
        }

        // Replace with the permanent CDN URL
        updateNodeData(id, { imageUrl: data.url });
      } catch (err: any) {
        // Keep the local preview even if CDN upload fails
        console.error("[UploadImageNode] upload error:", err.message);
        setUploadError(`Upload issue: ${err.message}. Preview stored locally.`);
      } finally {
        setIsUploading(false);
      }
    },
    [id, updateNodeData]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateNodeData(id, { imageUrl: null });
    setUploadError(null);
  };

  return (
    <BaseNode
      id={id}
      title="Upload Image"
      icon={<ImageIcon size={16} className="text-emerald-400" />}
      isRunning={data?.isRunning}
      hasError={!!uploadError || data?.hasError}
    >
      <div className="flex flex-col gap-3 w-full nodrag">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {!imageUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              isDragging
                ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                : "border-border/60 hover:border-emerald-500/50 hover:bg-emerald-500/5 bg-input/20"
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 size={24} className="text-emerald-400 animate-spin" />
                <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">
                  Uploading…
                </span>
              </>
            ) : (
              <>
                <UploadCloud
                  size={24}
                  className={`mb-1 ${isDragging ? "text-emerald-400" : "text-muted-foreground"}`}
                />
                <span className="text-[11px] font-medium text-muted-foreground text-center uppercase tracking-wider">
                  {isDragging ? "Drop to upload" : "Click or Drop Image"}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  (jpg, png, webp, gif — max 50MB)
                </span>
              </>
            )}
          </div>
        ) : (
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="relative rounded-xl overflow-hidden border border-border group bg-black cursor-pointer"
          >
            <img
              src={imageUrl}
              alt="Uploaded"
              className="w-full h-auto max-h-[160px] object-cover"
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-emerald-400" />
              </div>
            )}
            {!isUploading && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs text-white font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  Change Image
                </span>
              </div>
            )}
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600/80"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        )}

        {uploadError && (
          <p className="text-[10px] text-amber-400 font-medium leading-tight">
            ⚠ {uploadError}
          </p>
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
