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
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

declare global {
  interface Window {
    editorActions?: {
      generateImage: (prompt: string) => Promise<void>;
      removeBackground: () => Promise<void>;
      addTextLayer: (text: string) => Promise<void> | void;
      adjustLayer: (
        property: "brightness" | "contrast" | "saturation",
        direction: "increase" | "decrease",
        amount: number
      ) => Promise<void> | void;
      addStroke: (color: string, width: number) => Promise<void> | void;
    };
  }
}

const TypewriterText = ({ text }: { text?: string }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (typeof text !== "string" || text.trim() === "") {
      setDisplayed("");
      return;
    }

    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [text]);

  if (!text || typeof text !== "string") return null;

  return (
    <span className="transition-opacity duration-300 ease-in opacity-100">
      {displayed}
    </span>
  );
};

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

      if (Array.isArray(data.actions)) {
        for (const act of data.actions) {
          if (act.action === "generateImage" && act.prompt) {
            setMessages((prev) => [
              ...prev,
              { sender: "ai", text: `Generating: ${act.prompt}` },
            ]);
            await window.editorActions?.generateImage(act.prompt);
          } else if (act.action === "removeBackground") {
            setMessages((prev) => [
              ...prev,
              { sender: "ai", text: "Removing background..." },
            ]);
            await window.editorActions?.removeBackground();
          } else if (act.action === "adjustLayer") {
            setMessages((prev) => [
              ...prev,
              {
                sender: "ai",
                text: `${
                  act.direction === "increase" ? "Increasing" : "Decreasing"
                } ${act.property} by ${act.amount || 10}%`,
              },
            ]);
            await window.editorActions?.adjustLayer?.(
              act.property,
              act.direction,
              act.amount
            );
          } else if (act.action === "addTextLayer") {
            setMessages((prev) => [
              ...prev,
              { sender: "ai", text: `Adding text: ${act.text}` },
            ]);
            await window.editorActions?.addTextLayer?.(act.text);
          } else if (act.action === "addStroke") {
            setMessages((prev) => [
              ...prev,
              { sender: "ai", text: `Adding stroke to selected layer.` },
            ]);
            await window.editorActions?.addStroke?.(act.color, act.width);
          } else if (act.action === "message") {
            setMessages((prev) => [...prev, { sender: "ai", text: act.text }]);
          }
        }
      } else {
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
    <Card className="p-0 w-70 flex flex-col bg-neutral-900 border-neutral-600">
      <div className="flex-none p-4 h-14 border-b border-neutral-600 font-semibold text-lg text-neutral-300">
        AI Assistant
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg text-xs ${
              msg.sender === "user"
                ? "bg-[#e4aeb7] text-black self-end ml-8"
                : "bg-neutral-100 text-neutral-700 mr-8"
            }`}
          >
            {msg.sender === "ai" ? (
              <TypewriterText text={msg.text} />
            ) : (
              msg.text
            )}
          </div>
        ))}

        {loading && <Spinner className="text-white" />}
      </div>
      <div className="flex-none p-3 border-t border-neutral-600 flex gap-2">
        <Input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask AI..."
          className="flex-1 border-neutral-500 rounded-lg px-3 py-2 text-xs text-neutral-300 placeholder-neutral-500"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-[#b61b44] text-white px-3 text-bold py-2 rounded-lg text-xs hover:bg-[#811f39]"
        >
          Send
        </button>
      </div>
    </Card>
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
  strokeColor?: string;
  strokeWidth?: number;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  brightness?: number;
  contrast?: number;
  saturation?: number;
  vignette?: number;
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
      addTextLayer: (text: string) => addTextLayerFromAI(text),
      adjustLayer: (
        property: "brightness" | "contrast" | "saturation",
        direction: "increase" | "decrease",
        amount: number
      ) => adjustLayerFromAI(property, direction, amount),
      addStroke: (color: string, width: number) =>
        addStrokeToSelectedLayer(color, width),
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
        const {
          brightness = 1,
          contrast = 1,
          saturation = 1,
          vignette = 0,
        } = layer;

        ctx.filter = `
    brightness(${brightness})
    contrast(${contrast})
    saturate(${saturation})
  `;
        ctx.drawImage(
          layer.imageData,
          layer.x,
          layer.y,
          layer.width!,
          layer.height!
        );

        if (vignette > 0) {
          const gradient = ctx.createRadialGradient(
            layer.x + layer.width! / 2,
            layer.y + layer.height! / 2,
            Math.min(layer.width!, layer.height!) / 2,
            layer.x + layer.width! / 2,
            layer.y + layer.height! / 2,
            Math.max(layer.width!, layer.height!) / 1.2
          );
          gradient.addColorStop(0, "rgba(0,0,0,0)");
          gradient.addColorStop(1, `rgba(0,0,0,${vignette})`);
          ctx.fillStyle = gradient;
          ctx.fillRect(layer.x, layer.y, layer.width!, layer.height!);
        }

        ctx.filter = "none";
      } else if (layer.type === "text") {
        let fontStyle = "";
        if (layer.italic) fontStyle += "italic ";
        if (layer.bold) fontStyle += "bold ";
        ctx.font = `${fontStyle}${layer.fontSize}px ${layer.fontFamily}`;
        ctx.fillStyle = layer.color!;

        // Draw stroke first (behind fill)
        if (layer.strokeWidth && layer.strokeWidth > 0) {
          ctx.lineWidth = layer.strokeWidth;
          ctx.strokeStyle = layer.strokeColor || "#000000";
          ctx.strokeText(layer.text || "", layer.x, layer.y);
        }

        ctx.fillText(layer.text || "", layer.x, layer.y);

        if (layer.underline) {
          const textMetrics = ctx.measureText(layer.text || "");
          const underlineY = layer.y + 4;
          ctx.beginPath();
          ctx.moveTo(layer.x, underlineY);
          ctx.lineTo(layer.x + textMetrics.width, underlineY);
          ctx.lineWidth = Math.max(1, (layer.strokeWidth || 1) / 2);
          ctx.strokeStyle = layer.color!;
          ctx.stroke();
        }
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
    ctx.fillStyle = "#3b3b3b";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#262626";

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
          brightness: 1,
          contrast: 1,
          saturation: 1,
          vignette: 0,
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
      strokeColor: "#000000",
      strokeWidth: 0,
      opacity: 1,
      visible: true,
      italic: false,
      bold: false,
      underline: false,
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
    toast("Prompt your Image to AI Assistant");
  };

  const addTextLayerFromAI = (text: string): void => {
    const newLayer: Layer = {
      id: Date.now().toString(),
      type: "text",
      name: "AI Text",
      text,
      x: 200,
      y: 200,
      fontSize: 36,
      fontFamily: "Arial",
      color: "#000000",
      strokeColor: "#000000",
      strokeWidth: 0,
      opacity: 1,
      visible: true,
      italic: false,
      bold: false,
      underline: false,
    };
    setLayers((prev) => [...prev, newLayer]);
    setSelectedLayerId(newLayer.id);
  };

  const adjustLayerFromAI = (
    property: "brightness" | "contrast" | "saturation",
    direction: "increase" | "decrease",
    amount = 10
  ): void => {
    const selected = selectedLayerRef.current;
    if (!selected || selected.type !== "image") {
      alert("Please select an image layer to adjust.");
      return;
    }

    const step = amount / 100;
    setLayers((prev) =>
      prev.map((layer) => {
        if (layer.id !== selected.id) return layer;

        let current = layer[property] ?? 1;
        const delta = direction === "increase" ? step : -step;
        const newValue = Math.max(0, current + delta); // prevent negative

        return { ...layer, [property]: newValue };
      })
    );
  };

  const addStrokeToSelectedLayer = (color: string, width: number): void => {
    const layer = selectedLayerRef.current;
    if (!layer || layer.type !== "text")
      return alert("Select a text layer first.");

    setLayers((prev) =>
      prev.map((l) =>
        l.id === layer.id ? { ...l, strokeColor: color, strokeWidth: width } : l
      )
    );
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
          brightness: 1,
          contrast: 1,
          saturation: 1,
          vignette: 0,
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
      // Draw selected image onto a temporary canvas (same as you already do)
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = selectedLayer.width!;
      canvas.height = selectedLayer.height!;
      ctx.drawImage(selectedLayer.imageData, 0, 0, canvas.width, canvas.height);

      // Convert to Blob
      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/png")
      );

      if (!blob) throw new Error("Failed to create blob from canvas");

      console.log(
        "🛰️ Calling background-removal in browser, blob size:",
        blob.size
      );

      // Dynamic import the browser package
      const { removeBackground } = await import("@imgly/background-removal");

      const outputBlob = await removeBackground(blob, { debug: true });

      console.log(
        "✅ Background removal finished, size:",
        outputBlob.size || "(unknown)"
      );

      // Convert outputBlob to Image and update layer (same approach as before)
      const imgUrl = URL.createObjectURL(outputBlob);
      const newImg = new Image();

      await new Promise<void>((resolve, reject) => {
        newImg.onload = () => resolve();
        newImg.onerror = (ev) =>
          reject(new Error("Failed to load resulting image"));
        newImg.src = imgUrl;
      });

      // Update layers: keep original in originalImageData for undo
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
      console.log("Layer updated with processed image");
    } catch (err: any) {
      console.error("Error removing background (client):", err);
      alert(`Error removing background: ${err.message || err}`);
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
    <div className="flex h-screen bg-neutral-900">
      <Card className="w-60  border-r  p-0  bg-neutral-900 border-neutral-600">
        <div className="flex-none p-4 border-b h-14 border-neutral-600 font-semibold text-lg text-neutral-300">
          Layers
        </div>
        <div className="space-y-1 px-3">
          {[...layers].reverse().map((layer, idx) => (
            <div
              key={layer.id}
              className={`p-2 rounded-lg border  cursor-pointer ${
                layer.id === selectedLayerId
                  ? "border-[#b61b44] bg-[#b61b44]"
                  : "border-neutral-600 hover:border-gray-300"
              }`}
              onClick={() => setSelectedLayerId(layer.id)}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs ${
                    layer.id === selectedLayerId
                      ? "text-white"
                      : "text-neutral-300"
                  } font-medium truncate flex-1 `}
                >
                  {layer.name || layer.text || "Layer"}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                    className={`p-1 ${
                      layer.id === selectedLayerId
                        ? "hover:bg-[#8a0b2d]"
                        : "hover:bg-gray-200"
                    }  rounded`}
                  >
                    {layer.visible ? (
                      <Eye
                        size={14}
                        className={` ${
                          layer.id === selectedLayerId
                            ? "text-white"
                            : "text-neutral-500"
                        }`}
                      />
                    ) : (
                      <EyeOff
                        size={14}
                        className={` ${
                          layer.id === selectedLayerId
                            ? "text-white"
                            : "text-neutral-500"
                        }`}
                      />
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, "up");
                    }}
                    className={`p-1 ${
                      layer.id === selectedLayerId
                        ? "hover:bg-[#8a0b2d]"
                        : "hover:bg-gray-200"
                    }  rounded`}
                    disabled={layers.length - 1 - idx === layers.length - 1}
                  >
                    <ChevronUp
                      size={14}
                      className={` ${
                        layer.id === selectedLayerId
                          ? "text-white"
                          : "text-neutral-500"
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      moveLayer(layer.id, "down");
                    }}
                    className={`p-1 ${
                      layer.id === selectedLayerId
                        ? "hover:bg-[#8a0b2d]"
                        : "hover:bg-gray-200"
                    }  rounded`}
                    disabled={layers.length - 1 - idx === 0}
                  >
                    <ChevronDown
                      size={14}
                      className={` ${
                        layer.id === selectedLayerId
                          ? "text-white"
                          : "text-neutral-500"
                      }`}
                    />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer.id);
                    }}
                    className={`p-1 hover:bg-red-200 rounded ${
                      layer.id === selectedLayerId
                        ? "text-[#450214]"
                        : "text-red-600"
                    } `}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div
                className={`text-xs ${
                  layer.id === selectedLayerId ? "" : "text-gray-500"
                } mt-1`}
              >
                {layer.type} • {Math.round(layer.opacity * 100)}%
              </div>
            </div>
          ))}
          {layers.length === 0 && (
            <div className="text-xs text-gray-400 text-center py-8">
              No layers yet
            </div>
          )}
        </div>
      </Card>

      <Card className="flex-1 flex flex-col  bg-neutral-900 border-neutral-600 p-0">
        <div className="border-neutral-600 border-b h-14  p-2 flex justify-between gap-2">
          <img
            src={logo.src}
            alt="AI Image"
            width={45}
            height={50}
            className="relative rounded-2xl"
          />
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 bg-[#b61b44] text-white rounded-lg hover:bg-[#811f39] text-xs flex items-center gap-2"
            >
              <Upload size={14} /> Add Image
            </button>
            <button
              onClick={addTextLayer}
              className="px-3 py-2 bg-[#b61b44] text-white rounded-lg text-xs hover:bg-[#811f39] flex items-center gap-2"
            >
              <Type size={14} /> Add Text
            </button>
            <button
              onClick={handleGenerateImage}
              disabled={isGenerating}
              className="px-3 py-2 bg-[#b61b44] dark text-white rounded-lg text-xs hover:bg-[#811f39] flex items-center gap-2"
            >
              <ImageIcon size={14} />
              {"Generate Image"}
            </button>

            {/* <button
            onClick={handleRemoveBg}
            disabled={isRemovingBg}
            className={`px-4 py-2 rounded text-white flex items-center gap-2 ${
              isRemovingBg ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"
            }`}
          >
            <Eraser size={16} />
            {isRemovingBg ? "Removing..." : "Remove BG"}
          </button> */}

            {/* <div className="flex-1" /> */}
            <button
              onClick={handleUndo}
              className="px-3 py-2 bg-neutral-700 text-xs text-white rounded-lg hover:bg-neutral-700 flex items-center gap-2"
            >
              <Undo size={14} /> Undo
            </button>
            <button
              onClick={exportImage}
              className="px-3 py-2 bg-[#24005b] text-white rounded-lg text-xs hover:bg-[#2a0041] flex items-center gap-2"
            >
              <Download size={14} /> Export
            </button>
          </div>
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
              className=" shadow-lg cursor-move"
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
      </Card>

      <Card className="w-64 border-l  p-0 overflow-y-auto bg-neutral-900 border-neutral-600">
        <div className="flex-none p-4 h-14 border-b border-neutral-600 font-semibold text-lg text-neutral-300">
          Properties
        </div>
        {selectedLayer ? (
          <div className="space-y-4 px-4">
            <div>
              <label className="text-xs font-medium text-neutral-400">
                Layer Name
              </label>
              <input
                type="text"
                value={selectedLayer.name || selectedLayer.text || ""}
                onChange={(e) => updateSelectedLayer("name", e.target.value)}
                className=" text-xs w-full mt-1 px-3 py-2 border border-neutral-500 text-neutral-300  rounded-lg"
              />
            </div>

            {selectedLayer.type === "text" && (
              <>
                <div>
                  <label className="text-xs font-medium text-neutral-400">
                    Text
                  </label>
                  <input
                    type="text"
                    value={selectedLayer.text || ""}
                    onChange={(e) =>
                      updateSelectedLayer("text", e.target.value)
                    }
                    className=" text-xs w-full mt-1 px-3 py-2 border border-neutral-500 text-neutral-300  rounded-lg"
                  />
                </div>
                <div className="flex flex-row justify-between gap-5">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-neutral-400">
                      Font Size
                    </label>
                    <input
                      type="number"
                      value={selectedLayer.fontSize}
                      onChange={(e) =>
                        updateSelectedLayer(
                          "fontSize",
                          parseInt(e.target.value)
                        )
                      }
                      className=" text-xs w-full mt-1 px-3 py-2 border border-neutral-500 text-neutral-300  rounded-lg"
                      min="8"
                      max="200"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-neutral-400">
                      Stroke Width
                    </label>
                    <input
                      type="number"
                      value={selectedLayer.strokeWidth ?? 0}
                      onChange={(e) =>
                        updateSelectedLayer(
                          "strokeWidth",
                          parseInt(e.target.value)
                        )
                      }
                      className=" text-xs w-full mt-1 px-3 py-2 border border-neutral-500 text-neutral-300  rounded-lg"
                      min="0"
                      max="20"
                    />
                  </div>
                </div>

                <div className="flex flex-row justify-between gap-5">
                  <div className="flex-1">
                    <label className="text-xs font-medium text-neutral-400">
                      Color
                    </label>
                    <Input
                      type="color"
                      value={selectedLayer.color}
                      onChange={(e) =>
                        updateSelectedLayer("color", e.target.value)
                      }
                      className=" text-xs w-full mt-1 px-3 py-2 border border-neutral-500 text-neutral-300  rounded-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-medium text-neutral-400">
                      Stroke Color
                    </label>
                    <Input
                      type="color"
                      value={selectedLayer.strokeColor || "#000000"}
                      onChange={(e) =>
                        updateSelectedLayer("strokeColor", e.target.value)
                      }
                      className=" text-xs w-full mt-1 px-3 py-2 border border-neutral-500 text-neutral-300  rounded-lg"
                    />
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <label className="text-xs font-medium text-neutral-400 w-24">
                    Font
                  </label>
                  <Select
                    value={selectedLayer.fontFamily || "Arial"}
                    onValueChange={(value) =>
                      updateSelectedLayer("fontFamily", value)
                    }
                  >
                    <SelectTrigger className="w-[180px]  border-neutral-700 text-neutral-400">
                      <SelectValue placeholder="Select Font" />
                    </SelectTrigger>
                    <SelectContent className="dark bg-neutral-700 border rounded">
                      <SelectGroup>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Times New Roman">
                          Times New Roman
                        </SelectItem>
                        <SelectItem value="Courier New">Courier New</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                        <SelectItem value="Verdana">Verdana</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center gap-5 mt-2">
                  <button
                    onClick={() =>
                      updateSelectedLayer("bold", !selectedLayer.bold)
                    }
                    className={`px-4 py-2 rounded  text-xs border-none text-white ${
                      selectedLayer.bold ? "bg-[#b61b44] " : "bg-neutral-600 "
                    }`}
                  >
                    B
                  </button>
                  <button
                    onClick={() =>
                      updateSelectedLayer("italic", !selectedLayer.italic)
                    }
                    className={`px-4 py-2 rounded text-xs text-white italic ${
                      selectedLayer.italic ? "bg-[#b61b44]" : "bg-neutral-600"
                    }`}
                  >
                    I
                  </button>
                  <button
                    onClick={() =>
                      updateSelectedLayer("underline", !selectedLayer.underline)
                    }
                    className={`px-4 py-2 rounded text-xs underline text-white ${
                      selectedLayer.underline
                        ? "bg-[#b61b44]"
                        : "bg-neutral-600"
                    }`}
                  >
                    U
                  </button>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-medium text-neutral-400">
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
                className="w-full mt-1 accent-[#b61b44] border-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-neutral-400">
                  X
                </label>
                <input
                  type="number"
                  value={Math.round(selectedLayer.x)}
                  onChange={(e) =>
                    updateSelectedLayer("x", parseInt(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-2 border rounded-lg text-xs border-neutral-500 text-neutral-300"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-neutral-400">
                  Y
                </label>
                <input
                  type="number"
                  value={Math.round(selectedLayer.y)}
                  onChange={(e) =>
                    updateSelectedLayer("y", parseInt(e.target.value))
                  }
                  className="w-full mt-1 px-3 py-2 border border-neutral-500 rounded-lg text-xs text-neutral-300"
                />
              </div>
            </div>

            {selectedLayer.type === "image" && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-neutral-400">
                    Width
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedLayer.width || 0)}
                    onChange={(e) =>
                      updateSelectedLayer("width", parseInt(e.target.value))
                    }
                    className="w-full mt-1 px-3 py-2 border border-neutral-500 rounded-lg text-neutral-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400">
                    Height
                  </label>
                  <input
                    type="number"
                    value={Math.round(selectedLayer.height || 0)}
                    onChange={(e) =>
                      updateSelectedLayer("height", parseInt(e.target.value))
                    }
                    className="w-full mt-1 px-3 py-2 border border-neutral-500 rounded-lg text-neutral-300 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-400">
                    Brightness:
                    {Math.round((selectedLayer.brightness ?? 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={(selectedLayer.brightness ?? 1) * 100}
                    onChange={(e) =>
                      updateSelectedLayer(
                        "brightness",
                        parseInt(e.target.value) / 100
                      )
                    }
                    className="w-full mt-1 accent-[#b61b44] border-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-400">
                    Contrast: {Math.round((selectedLayer.contrast ?? 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={(selectedLayer.contrast ?? 1) * 100}
                    onChange={(e) =>
                      updateSelectedLayer(
                        "contrast",
                        parseInt(e.target.value) / 100
                      )
                    }
                    className="w-full mt-1 accent-[#b61b44] border-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-400">
                    Saturation:
                    {Math.round((selectedLayer.saturation ?? 1) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={(selectedLayer.saturation ?? 1) * 100}
                    onChange={(e) =>
                      updateSelectedLayer(
                        "saturation",
                        parseInt(e.target.value) / 100
                      )
                    }
                    className="w-full mt-1 accent-[#b61b44] border-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-neutral-400">
                    Vignette: {Math.round((selectedLayer.vignette ?? 0) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(selectedLayer.vignette ?? 0) * 100}
                    onChange={(e) =>
                      updateSelectedLayer(
                        "vignette",
                        parseInt(e.target.value) / 100
                      )
                    }
                    className="w-full mt-1 accent-[#b61b44] border-none"
                  />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-neutral-400 text-center py-8">
            Select a layer to edit properties
          </div>
        )}
      </Card>
      {/* {showPromptModal && (
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
      )} */}
      <ChatPanel />
    </div>
  );
};

export default LayerflowEditor;
