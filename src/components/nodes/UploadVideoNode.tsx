"use client";

import { Handle, Position } from "@xyflow/react";
import { Video as VideoIcon, UploadCloud, X, Loader2, Play } from "lucide-react";
import BaseNode from "./BaseNode";
import { useCallback, useRef, useState } from "react";
import useWorkflowStore from "@/store/useWorkflowStore";

export default function UploadVideoNode({ id, data, isConnectable }: any) {
  const videoUrl = data?.videoUrl;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(data?.fileName || null);

  const uploadFile = useCallback(
    async (file: File) => {
      const allowedTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v", "video/ogg"];
      if (!allowedTypes.includes(file.type) && !file.type.startsWith("video/")) {
        setUploadError("Please select a video file (mp4, mov, webm, m4v)");
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        setUploadError("File too large (max 500MB)");
        return;
      }

      setUploadError(null);
      setIsUploading(true);
      setFileName(file.name);

      // Show local preview immediately
      const localUrl = URL.createObjectURL(file);
      updateNodeData(id, { videoUrl: localUrl, fileName: file.name });

      try {
        const form = new FormData();
        form.append("file", file);
        form.append("type", "video");

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || "Upload failed");
        }

        // Replace local URL with CDN URL
        updateNodeData(id, { videoUrl: data.url, fileName: data.fileName || file.name });
      } catch (err: any) {
        console.error("[UploadVideoNode] upload error:", err.message);
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
    updateNodeData(id, { videoUrl: null, fileName: null });
    setUploadError(null);
    setFileName(null);
  };

  return (
    <BaseNode
      id={id}
      title="Upload Video"
      icon={<VideoIcon size={16} className="text-purple-400" />}
      isRunning={data?.isRunning}
      hasError={!!uploadError || data?.hasError}
    >
      <div className="flex flex-col gap-3 w-full nodrag">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        {!videoUrl ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`w-full relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
              isDragging
                ? "border-purple-500 bg-purple-500/10 scale-[1.01]"
                : "border-border/60 hover:border-purple-500/50 hover:bg-purple-500/5 bg-input/20"
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 size={24} className="text-purple-400 animate-spin" />
                <span className="text-[11px] font-medium text-purple-400 uppercase tracking-wider">
                  Uploading…
                </span>
                {fileName && (
                  <span className="text-[10px] text-muted-foreground/60 truncate max-w-full px-2">
                    {fileName}
                  </span>
                )}
              </>
            ) : (
              <>
                <UploadCloud
                  size={24}
                  className={`mb-1 ${isDragging ? "text-purple-400" : "text-muted-foreground"}`}
                />
                <span className="text-[11px] font-medium text-muted-foreground text-center uppercase tracking-wider">
                  {isDragging ? "Drop to upload" : "Click or Drop Video"}
                </span>
                <span className="text-[10px] text-muted-foreground/60">
                  (mp4, mov, webm, m4v — max 500MB)
                </span>
              </>
            )}
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden border border-purple-500/30 group bg-black">
            <video
              src={videoUrl}
              className="w-full h-auto max-h-[160px] object-contain"
              controls
              playsInline
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                <Loader2 size={24} className="animate-spin text-purple-400" />
                <span className="text-xs text-purple-300">Uploading to cloud…</span>
              </div>
            )}
            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            >
              <span className="text-[10px] text-white font-medium bg-black/60 px-2 py-1 rounded-md backdrop-blur-md hover:bg-black/80">
                Replace
              </span>
            </div>
            <button
              onClick={handleClear}
              className="absolute top-2 right-2 bg-black/70 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600/80"
            >
              <X size={12} className="text-white" />
            </button>
            {fileName && !isUploading && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[9px] text-white/70 truncate">{fileName}</p>
              </div>
            )}
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
        className="w-3.5 h-3.5 bg-purple-500 border-2 border-background"
      />
    </BaseNode>
  );
}
