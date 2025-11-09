"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Type,
  Download,
  Trash2,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  Eraser,
  Undo,
  ImageIcon,
} from "lucide-react";

declare global {
  interface Window {
    editorActions?: {
      generateImage: (prompt: string) => Promise<void>;
      removeBackground: () => Promise<void>;
    };
  }
}

const ChatPanel = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user" as const, text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });

      const data = await res.json();

      if (data.action === "generateImage" && data.prompt) {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: `Generating: ${data.prompt}` },
        ]);
        await window.editorActions?.generateImage(data.prompt);
      } else if (data.action === "removeBackground") {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Removing background..." },
        ]);
        await window.editorActions?.removeBackground();
      } else {
        // Fallback to normal text
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: data.text || "I'm not sure what to do." },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Error connecting to AI service." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      <div className="flex-none p-4 border-b font-semibold text-lg">
        AI Assistant
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg text-sm ${
              msg.sender === "user"
                ? "bg-blue-100 text-blue-800 self-end ml-8"
                : "bg-gray-100 text-gray-700 mr-8"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && <div className="text-gray-400 text-sm">Thinking...</div>}
      </div>
      <div className="flex-none p-3 border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI..."
          className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-3 py-2 rounded text-sm hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};
type LayerflowEditorProps = {
  width?: number;
  height?: number;
};

type Layer = {
  id: string;
  type: "image" | "text";
  name?: string;
  text?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  opacity: number;
  visible: boolean;
  imageData?: HTMLImageElement;
  originalImageData?: HTMLImageElement;
};

type ResizeHandle = "tl" | "tr" | "bl" | "br" | null;

const LayerflowEditor: React.FC<LayerflowEditorProps> = ({
  width = 800,
  height = 600,
}) => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [draggedLayer, setDraggedLayer] = useState<Layer | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const selectedLayerRef = useRef<Layer | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [initialSize, setInitialSize] = useState<{
    width: number;
    height: number;
    x: number;
    y: number;
  }>({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    drawCanvas();
  }, [layers, selectedLayerId]);

  useEffect(() => {
    selectedLayerRef.current =
      layers.find((l) => l.id === selectedLayerId) || null;
  }, [selectedLayerId, layers]);

  useEffect(() => {
    window.editorActions = {
      generateImage: (prompt: string) => generateImage(prompt),
      removeBackground: () => handleRemoveBg(),
    };

    return () => {
      window.editorActions = undefined;
    };
  }, []);

  const drawCanvas = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCheckerboard(ctx, canvas.width, canvas.height);

    layers.forEach((layer) => {
      if (!layer.visible) return;
      ctx.save();
      ctx.globalAlpha = layer.opacity;

      if (layer.type === "image" && layer.imageData) {
        ctx.drawImage(
          layer.imageData,
          layer.x,
          layer.y,
          layer.width!,
          layer.height!
        );
      } else if (layer.type === "text") {
        ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
        ctx.fillStyle = layer.color!;
        ctx.fillText(layer.text || "", layer.x, layer.y);
      }

      if (layer.id === selectedLayerId) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        if (layer.type === "image") {
          ctx.strokeRect(layer.x, layer.y, layer.width!, layer.height!);

          ctx.setLineDash([]);
          ctx.fillStyle = "#3b82f6";
          const handleSize = 8;

          ctx.fillRect(
            layer.x - handleSize / 2,
            layer.y - handleSize / 2,
            handleSize,
            handleSize
          );
          ctx.fillRect(
            layer.x + layer.width! - handleSize / 2,
            layer.y - handleSize / 2,
            handleSize,
            handleSize
          );
          ctx.fillRect(
            layer.x - handleSize / 2,
            layer.y + layer.height! - handleSize / 2,
            handleSize,
            handleSize
          );
          ctx.fillRect(
            layer.x + layer.width! - handleSize / 2,
            layer.y + layer.height! - handleSize / 2,
            handleSize,
            handleSize
          );
        } else if (layer.type === "text") {
          const metrics = ctx.measureText(layer.text || "");
          ctx.strokeRect(
            layer.x,
            layer.y - (layer.fontSize || 20),
            metrics.width,
            layer.fontSize || 20
          );
        }
      }
      ctx.restore();
    });
  };

  const drawCheckerboard = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ): void => {
    const squareSize = 20;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#e5e7eb";

    for (let i = 0; i < width; i += squareSize) {
      for (let j = 0; j < height; j += squareSize) {
        if ((i / squareSize + j / squareSize) % 2 === 0) {
          ctx.fillRect(i, j, squareSize, squareSize);
        }
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 400;
        const maxHeight = 400;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        const newLayer: Layer = {
          id: Date.now().toString(),
          type: "image",
          name: file.name,
          x: 100,
          y: 100,
          width,
          height,
          opacity: 1,
          visible: true,
          imageData: img,
        };
        setLayers((prev) => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const addTextLayer = (): void => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: "text",
      name: "Text Layer",
      text: "Double click to edit",
      x: 200,
      y: 200,
      fontSize: 32,
      fontFamily: "Arial",
      color: "#000000",
      opacity: 1,
      visible: true,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const getResizeHandle = (
    x: number,
    y: number,
    layer: Layer
  ): ResizeHandle => {
    if (layer.type !== "image" || !layer.width || !layer.height) return null;

    const handleSize = 8;
    const threshold = handleSize;

    if (
      Math.abs(x - layer.x) <= threshold &&
      Math.abs(y - layer.y) <= threshold
    ) {
      return "tl";
    }
    if (
      Math.abs(x - (layer.x + layer.width)) <= threshold &&
      Math.abs(y - layer.y) <= threshold
    ) {
      return "tr";
    }
    if (
      Math.abs(x - layer.x) <= threshold &&
      Math.abs(y - (layer.y + layer.height)) <= threshold
    ) {
      return "bl";
    }
    if (
      Math.abs(x - (layer.x + layer.width)) <= threshold &&
      Math.abs(y - (layer.y + layer.height)) <= threshold
    ) {
      return "br";
    }

    return null;
  };

  const handleCanvasMouseDown = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { x, y } = getMousePos(canvas, e);
    let layerClicked = false;
    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    if (selectedLayer && selectedLayer.type === "image") {
      const handle = getResizeHandle(x, y, selectedLayer);
      if (handle) {
        setIsResizing(true);
        setResizeHandle(handle);
        setDraggedLayer(selectedLayer);
        setInitialSize({
          width: selectedLayer.width!,
          height: selectedLayer.height!,
          x: selectedLayer.x,
          y: selectedLayer.y,
        });
        setDragOffset({ x, y });
        return;
      }
    }

    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (!layer.visible) continue;
      let isHit = false;

      if (layer.type === "image" && layer.width && layer.height) {
        isHit =
          x >= layer.x &&
          x <= layer.x + layer.width &&
          y >= layer.y &&
          y <= layer.y + layer.height;
      } else if (layer.type === "text") {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) continue;
        tempCtx.font = `${layer.fontSize}px ${layer.fontFamily}`;
        const metrics = tempCtx.measureText(layer.text || "");
        isHit =
          x >= layer.x &&
          x <= layer.x + metrics.width &&
          y >= layer.y - (layer.fontSize || 20) &&
          y <= layer.y;
      }

      if (isHit) {
        setSelectedLayerId(layer.id);
        setDraggedLayer(layer);
        setIsDragging(true);
        setDragOffset({ x: x - layer.x, y: y - layer.y });
        layerClicked = true;
        break;
      }
    }
    if (!layerClicked) {
      setSelectedLayerId(null);
    }
  };

  const handleCanvasMouseMove = (
    e: React.MouseEvent<HTMLCanvasElement>
  ): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getMousePos(canvas, e);

    if (isResizing && draggedLayer && resizeHandle) {
      const dx = x - dragOffset.x;
      const dy = y - dragOffset.y;

      setLayers((prev) =>
        prev.map((layer) => {
          if (layer.id !== draggedLayer.id) return layer;

          let newWidth = initialSize.width;
          let newHeight = initialSize.height;
          let newX = initialSize.x;
          let newY = initialSize.y;

          switch (resizeHandle) {
            case "br":
              newWidth = initialSize.width + dx;
              newHeight = initialSize.height + dy;
              break;
            case "bl":
              newWidth = initialSize.width - dx;
              newHeight = initialSize.height + dy;
              newX = initialSize.x + dx;
              break;
            case "tr":
              newWidth = initialSize.width + dx;
              newHeight = initialSize.height - dy;
              newY = initialSize.y + dy;
              break;
            case "tl":
              newWidth = initialSize.width - dx;
              newHeight = initialSize.height - dy;
              newX = initialSize.x + dx;
              newY = initialSize.y + dy;
              break;
          }

          if (newWidth < 20) newWidth = 20;
          if (newHeight < 20) newHeight = 20;

          return {
            ...layer,
            width: newWidth,
            height: newHeight,
            x: newX,
            y: newY,
          };
        })
      );
      return;
    }

    if (isDragging && draggedLayer) {
      setLayers((prev) =>
        prev.map((layer) =>
          layer.id === draggedLayer.id
            ? { ...layer, x: x - dragOffset.x, y: y - dragOffset.y }
            : layer
        )
      );
      return;
    }

    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    if (selectedLayer && selectedLayer.type === "image") {
      const handle = getResizeHandle(x, y, selectedLayer);
      if (handle) {
        const cursors: Record<string, string> = {
          tl: "nwse-resize",
          tr: "nesw-resize",
          bl: "nesw-resize",
          br: "nwse-resize",
        };
        canvas.style.cursor = cursors[handle];
        return;
      }
    }
    canvas.style.cursor = "move";
  };

  const getMousePos = (
    canvas: HTMLCanvasElement,
    evt: React.MouseEvent<HTMLCanvasElement>
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (evt.clientX - rect.left) * scaleX,
      y: (evt.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseUp = (): void => {
    setIsDragging(false);
    setIsResizing(false);
    setDraggedLayer(null);
    setResizeHandle(null);
  };

  const handleCanvasDoubleClick = (): void => {
    const selectedLayer = layers.find((l) => l.id === selectedLayerId);
    if (selectedLayer && selectedLayer.type === "text") {
      const newText = prompt("Edit text:", selectedLayer.text);
      if (newText !== null) {
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === selectedLayerId ? { ...layer, text: newText } : layer
          )
        );
      }
    }
  };

  const deleteLayer = (id: string): void => {
    setLayers((prev) => prev.filter((layer) => layer.id !== id));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const toggleLayerVisibility = (id: string): void => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer
      )
    );
  };

  const moveLayer = (id: string, direction: "up" | "down"): void => {
    const index = layers.findIndex((l) => l.id === id);
    if (
      (direction === "up" && index === layers.length - 1) ||
      (direction === "down" && index === 0)
    )
      return;

    const newLayers = [...layers];
    const targetIndex = direction === "up" ? index + 1 : index - 1;
    [newLayers[index], newLayers[targetIndex]] = [
      newLayers[targetIndex],
      newLayers[index],
    ];
    setLayers(newLayers);
  };

  const updateSelectedLayer = (property: keyof Layer, value: any): void => {
    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === selectedLayerId ? { ...layer, [property]: value } : layer
      )
    );
  };

  const exportImage = (): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "layerflow-export.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleGenerateImage = async () => {
    setShowPromptModal(true);
  };

  const generateImage = async (customPrompt?: string) => {
    const promptToUse = customPrompt || promptText;
    if (!promptToUse.trim()) return;
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptToUse }),
      });

      if (!res.ok) throw new Error("Failed to generate image");
      const blob = await res.blob();
      const imgUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const newLayer: Layer = {
          id: Date.now().toString(),
          type: "image",
          name: "AI Generated Image",
          x: 100,
          y: 100,
          width: 400,
          height: 400,
          opacity: 1,
          visible: true,
          imageData: img,
        };
        setLayers((prev) => [...prev, newLayer]);
        setSelectedLayerId(newLayer.id);
      };
      img.src = imgUrl;
    } catch (err) {
      alert("Error generating image.");
    } finally {
      setIsGenerating(false);
      setShowPromptModal(false);
      setPromptText("");
    }
  };

  const handleRemoveBg = async () => {
    const selectedLayer = selectedLayerRef.current;

    if (
      !selectedLayer ||
      selectedLayer.type !== "image" ||
      !selectedLayer.imageData
    ) {
      alert("Please select an image layer to remove background.");
      return;
    }

    setIsRemovingBg(true);
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = selectedLayer.width!;
      canvas.height = selectedLayer.height!;
      ctx.drawImage(selectedLayer.imageData, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );
      if (!blob) throw new Error("Failed to create blob");

      const formData = new FormData();
      formData.append("image", blob, "layer.png");

      const res = await fetch("/api/removebg", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to remove background");

      const outputBlob = await res.blob();
      const imgUrl = URL.createObjectURL(outputBlob);
      const newImg = new Image();
      newImg.onload = () => {
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === selectedLayer.id
              ? {
                  ...layer,
                  originalImageData: layer.imageData,
                  imageData: newImg,
                }
              : layer
          )
        );
      };
      newImg.src = imgUrl;
    } catch (err) {
      alert("Error removing background.");
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleUndo = () => {
    if (!selectedLayer || !selectedLayer.originalImageData) {
      alert("Nothing to undo for this layer.");
      return;
    }

    setLayers((prev) =>
      prev.map((layer) =>
        layer.id === selectedLayer.id
          ? {
              ...layer,
              imageData: layer.originalImageData,
              originalImageData: undefined,
            }
          : layer
      )
    );
  };

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Layers</h2>
        <div className="space-y-2">
          {[...layers].reverse().map((layer, idx) => (
            <div
              key={layer.id}
              className={`p-2 rounded border cursor-pointer ${
                layer.id === selectedLayerId
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedLayerId(layer.id)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium truncate flex-1">
                  {layer.name || layer.text || "Layer"}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                  >
                    {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, "up");
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    disabled={layers.length - 1 - idx === layers.length - 1}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, "down");
                    }}
                    className="p-1 hover:bg-gray-200 rounded"
                    disabled={layers.length - 1 - idx === 0}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer.id);
                    }}
                    className="p-1 hover:bg-red-200 rounded text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {layer.type} • {Math.round(layer.opacity * 100)}%
              </div>
            </div>
          ))}
          {layers.length === 0 && (
            <div className="text-sm text-gray-400 text-center py-8">
              No layers yet
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-4 flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <Upload size={16} /> Add Image
          </button>
          <button
            onClick={addTextLayer}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
          >
            <Type size={16} /> Add Text
          </button>
          <button
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
              isGenerating ? "bg-gray-400" : "bg-indigo-500 hover:bg-indigo-600"
            }`}
          >
            <ImageIcon size={16} />
            {isGenerating ? "Generating..." : "Generate Image"}
          </button>

          <button
            onClick={handleRemoveBg}
            disabled={isRemovingBg}
            className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
              isRemovingBg ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            <Eraser size={16} />
            {isRemovingBg ? "Removing..." : "Remove BG"}
          </button>

          <button
            onClick={handleUndo}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 flex items-center gap-2"
          >
            <Undo size={16} /> Undo
          </button>
          <div className="flex-1" />
          <button
            onClick={exportImage}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center gap-2"
          >
            <Download size={16} /> Export
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <div
            className="relative"
            style={{
              width: "90%",
              height: "90%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
              onDoubleClick={handleCanvasDoubleClick}
              className="border border-gray-300 shadow-lg cursor-move"
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                aspectRatio: `${width} / ${height}`,
                width: "100%",
                height: "auto",
              }}
            />
          </div>
        </div>
      </div>

      <div className="w-64 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Properties</h2>
        {selectedLayer ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Layer Name
              </label>
              <input
                type="text"
                value={selectedLayer.name || selectedLayer.text || ""}
                onChange={(e) => updateSelectedLayer("name", e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
              />
            </div>

            {selectedLayer.type === "text" && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Text
                  </label>
                  <input
                    type="text"
                    value={selectedLayer.text || ""}
                    onChange={(e) =>
                      updateSelectedLayer("text", e.target.value)
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Font Size
                  </label>
                  <input
                    type="number"
                    value={selectedLayer.fontSize}
                    onChange={(e) =>
                      updateSelectedLayer("fontSize", parseInt(e.target.value))
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
                    min="8"
                    max="200"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Color
                  </label>
                  <input
                    type="color"
                    value={selectedLayer.color}
                    onChange={(e) =>
                      updateSelectedLayer("color", e.target.value)
                    }
                    className="w-full mt-1 h-10 border border-gray-300 rounded"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">
                Opacity: {Math.round(selectedLayer.opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={selectedLayer.opacity * 100}
                onChange={(e) =>
                  updateSelectedLayer("opacity", parseInt(e.target.value) / 100)
                }
                className="w-full mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-sm font-medium text-gray-700">X</label>
                <input
                  type="number"
                  value={Math.round(selectedLayer.x)}
                  onChange={(e) =>
                    updateSelectedLayer("x", parseInt(e.target.value))
                  }
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Y</label>
                <input
                  type="number"
                  value={Math.round(selectedLayer.y)}
                  onChange={(e) =>
                    updateSelectedLayer("y", parseInt(e.target.value))
                  }
                  className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            {selectedLayer.type === "image" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Width
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedLayer.width || 0)}
                    onChange={(e) =>
                      updateSelectedLayer("width", parseInt(e.target.value))
                    }
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Height
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedLayer.height || 0)}
                    onChange={(e) =>
                      updateSelectedLayer("height", parseInt(e.target.value))
                    }
                    className="w-full mt-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400 text-center py-8">
            Select a layer to edit properties
          </div>
        )}
      </div>
      {showPromptModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Generate Image</h3>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Describe the image..."
              className="w-full border rounded p-2 mb-4 h-24"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowPromptModal(false)}
                className="px-4 py-2 rounded border"
              >
                Cancel
              </button>
              <button
                onClick={() => generateImage()}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ChatPanel />
    </div>
  );
};

export default LayerflowEditor;
