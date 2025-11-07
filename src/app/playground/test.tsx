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
  Undo,
  Image as ImageIcon,
  Eraser,
} from "lucide-react";

/* --------------------------- 💬 CHAT PANEL --------------------------- */
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
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      const aiMsg = {
        sender: "ai" as const,
        text: data.text || "Sorry, I couldn't generate a response.",
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
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
        🤖 AI Assistant
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

/* --------------------------- 🧩 MAIN EDITOR --------------------------- */
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
  originalImageData?: HTMLImageElement; // for undo BG
};

const LayerflowEditor: React.FC = () => {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptText, setPromptText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  /* ----------------------- 🧠 CANVAS DRAWING ----------------------- */
  useEffect(() => {
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
      if (layer.type === "image" && layer.imageData)
        ctx.drawImage(layer.imageData, layer.x, layer.y, layer.width!, layer.height!);
      else if (layer.type === "text") {
        ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
        ctx.fillStyle = layer.color!;
        ctx.fillText(layer.text || "", layer.x, layer.y);
      }
      ctx.restore();
    });
  }, [layers]);

  const drawCheckerboard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const size = 20;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#e5e7eb";
    for (let x = 0; x < width; x += size)
      for (let y = 0; y < height; y += size)
        if ((x / size + y / size) % 2 === 0) ctx.fillRect(x, y, size, size);
  };

  /* ----------------------- 🪄 GENERATE IMAGE ----------------------- */
  const handleGenerateImage = () => setShowPromptModal(true);

  const generateImage = async () => {
    if (!promptText.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/pollination", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText }),
      });
      if (!res.ok) throw new Error("Image generation failed");
      const blob = await res.blob();
      const imgUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const newLayer: Layer = {
          id: Date.now().toString(),
          type: "image",
          name: "Generated Image",
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
    } catch {
      alert("Error generating image");
    } finally {
      setIsGenerating(false);
      setShowPromptModal(false);
      setPromptText("");
    }
  };

  /* ----------------------- 🧼 REMOVE BACKGROUND ----------------------- */
  const handleRemoveBg = async () => {
    if (!selectedLayer || selectedLayer.type !== "image" || !selectedLayer.imageData)
      return alert("Select an image layer first.");

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
      if (!blob) throw new Error("Blob error");
      const formData = new FormData();
      formData.append("image", blob, "layer.png");

      const res = await fetch("/api/removebg", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Remove BG failed");

      const outputBlob = await res.blob();
      const imgUrl = URL.createObjectURL(outputBlob);
      const newImg = new Image();
      newImg.onload = () =>
        setLayers((prev) =>
          prev.map((layer) =>
            layer.id === selectedLayer.id
              ? { ...layer, originalImageData: layer.imageData, imageData: newImg }
              : layer
          )
        );
      newImg.src = imgUrl;
    } catch {
      alert("Error removing background");
    } finally {
      setIsRemovingBg(false);
    }
  };

  /* ----------------------- ⏪ UNDO ----------------------- */
  const handleUndo = () => {
    if (!selectedLayer || !selectedLayer.originalImageData)
      return alert("Nothing to undo.");
    setLayers((prev) =>
      prev.map((l) =>
        l.id === selectedLayer.id
          ? { ...l, imageData: l.originalImageData, originalImageData: undefined }
          : l
      )
    );
  };

  /* ----------------------- 🎨 RENDER ----------------------- */
  return (
    <div className="flex h-screen bg-gray-50">
      <ChatPanel />

      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4 flex gap-2">
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
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
          <canvas ref={canvasRef} width={800} height={600} className="border shadow-lg" />
        </div>
      </div>

      {/* Modal */}
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
                onClick={generateImage}
                disabled={isGenerating}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayerflowEditor;
