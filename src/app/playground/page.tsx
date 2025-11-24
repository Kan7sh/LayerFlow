"use client";

import { Suspense } from "react";
import { redirect, useSearchParams } from "next/navigation";
import LayerflowEditor from "./LayerFlowEditor";
import { Spinner } from "@/components/ui/spinner";
import { useSession } from "next-auth/react";

function PlaygroundContent() {
  const params = useSearchParams();
  const width = Number(params.get("width")) || 800;
  const height = Number(params.get("height")) || 600;

  return <LayerflowEditor width={width} height={height} />;
}

export default function PlaygroundPage() {
  const session = useSession();

  if (session.status === "loading") {
    return (
      <div className="h-screen w-screen flex items-center justify-center self-center">
        <Spinner />
      </div>
    );
  }

  if (session.status === "unauthenticated") {
    redirect("/");
  }

  return (
    <Suspense
      fallback={<div className="text-neutral-400 p-4">Loading editor...</div>}
    >
      <PlaygroundContent />
    </Suspense>
  );
}
