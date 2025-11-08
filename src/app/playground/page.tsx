"use client";
import { useSearchParams } from "next/navigation";
import LayerflowEditor from "./LayerFlowEditor";

export default function PlaygroundPage() {
  const params = useSearchParams();
  const width = Number(params.get("width")) || 800;
  const height = Number(params.get("height")) || 600;

  return <LayerflowEditor width={width} height={height} />;
}
