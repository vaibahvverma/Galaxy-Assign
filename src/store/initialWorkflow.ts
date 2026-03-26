import { Node, Edge } from '@xyflow/react';

export const initialNodes: Node[] = [
  // Branch A: Image Processing
  {
    id: "upload-image-1",
    type: "imageUpload",
    position: { x: 100, y: 100 },
    data: { label: "Upload Product Photo" }
  },
  {
    id: "crop-1",
    type: "cropImage",
    position: { x: 450, y: 100 },
    data: { label: "Crop Image" }
  },
  {
    id: "text-system",
    type: "text",
    position: { x: 450, y: -80 },
    data: { text: "You are a professional marketing copywriter. Generate a compelling one-paragraph product description." }
  },
  {
    id: "text-user",
    type: "text",
    position: { x: 450, y: 350 },
    data: { text: "Product: Wireless Bluetooth Headphones. Features: Noise cancellation, 30-hour battery, foldable design." }
  },
  {
    id: "llm-1",
    type: "llm",
    position: { x: 800, y: 100 },
    data: { model: "gemini-1.5-pro", label: "Generate Description" }
  },

  // Branch B: Video Frame Extraction
  {
    id: "upload-video-1",
    type: "videoUpload",
    position: { x: 100, y: 600 },
    data: { label: "Upload Video Demo" }
  },
  {
    id: "extract-frame-1",
    type: "extractFrame",
    position: { x: 450, y: 600 },
    data: { timestamp: "50%", label: "Extract Mid Frame" }
  },

  // Convergence Point
  {
    id: "text-summary-system",
    type: "text",
    position: { x: 800, y: 600 },
    data: { text: "You are a social media manager. Create a tweet-length marketing post based on the product image and video frame." }
  },
  {
    id: "llm-2-convergence",
    type: "llm",
    position: { x: 1200, y: 300 },
    data: { model: "gemini-1.5-pro", label: "Final Marketing Summary" }
  }
];

export const initialEdges: Edge[] = [
  // Branch A
  { id: "e-ui1-crop1", source: "upload-image-1", sourceHandle: "output", target: "crop-1", targetHandle: "image_url", animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } },
  { id: "e-sys1-llm1", source: "text-system", sourceHandle: "output", target: "llm-1", targetHandle: "system_prompt", animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } },
  { id: "e-usr1-llm1", source: "text-user", sourceHandle: "output", target: "llm-1", targetHandle: "user_message", animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } },
  { id: "e-crop1-llm1", source: "crop-1", sourceHandle: "output", target: "llm-1", targetHandle: "images", animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } },
  
  // Branch B
  { id: "e-uv1-ex1", source: "upload-video-1", sourceHandle: "output", target: "extract-frame-1", targetHandle: "video_url", animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } },
  
  // Convergence
  { id: "e-sum-sys-llm2", source: "text-summary-system", sourceHandle: "output", target: "llm-2-convergence", targetHandle: "system_prompt", animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } },
  { id: "e-llm1-llm2", source: "llm-1", sourceHandle: "output", target: "llm-2-convergence", targetHandle: "user_message", animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } },
  { id: "e-crop1-llm2", source: "crop-1", sourceHandle: "output", target: "llm-2-convergence", targetHandle: "images", animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } },
  { id: "e-ex1-llm2", source: "extract-frame-1", sourceHandle: "output", target: "llm-2-convergence", targetHandle: "images", animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } },
];
