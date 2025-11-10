"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import LayerflowEditor from "./LayerFlowEditor";

function PlaygroundContent() {
  const params = useSearchParams();
  const width = Number(params.get("width")) || 800;
  const height = Number(params.get("height")) || 600;

  return <LayerflowEditor width={width} height={height} />;
}

export default function PlaygroundPage() {
  return (
    <Suspense
      fallback={<div className="text-neutral-400 p-4">Loading editor...</div>}
    >
      <PlaygroundContent />
    </Suspense>
  );
}
