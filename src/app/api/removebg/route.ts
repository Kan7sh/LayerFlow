import { NextResponse } from "next/server";

// Use edge runtime for WASM compatibility on Vercel
export const runtime = "edge";

// Increase timeout
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    console.log("🎯 Starting background removal...");

    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    console.log(
      `📁 File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`
    );

    // Use WASM version for serverless compatibility
    const { removeBackground } = await import("@imgly/background-removal");

    console.log("⚡ Using WASM background remover (serverless-compatible)...");

    // Process the image - WASM version works directly with File objects
    const outputBlob = await removeBackground(file, {
      publicPath:
        "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.4.5/dist/",
    });

    console.log("✅ Background removed successfully");

    return new Response(outputBlob, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=removed-bg.png",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("❌ Error removing background:", error);
    console.error("Stack trace:", error.stack);

    return NextResponse.json(
      {
        error: "Background removal failed",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
