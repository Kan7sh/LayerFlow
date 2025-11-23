import { NextResponse } from "next/server";

// Use nodejs runtime for better compatibility with background-removal-node
export const runtime = "nodejs";

// Increase timeout for background removal processing
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    console.log("🎯 Starting background removal...");
    
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    console.log(`📁 File received: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

    // Convert file to blob (the library works better with Blob objects)
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type || "image/png" });

    // Always use Node.js version for better reliability
    const { removeBackground } = await import("@imgly/background-removal-node");
    
    console.log("⚡ Using Node.js background remover...");

    // Process the image - pass blob with minimal config
    // The library is picky about configuration, so we use defaults
    const outputBlob = await removeBackground(blob);

    console.log("✅ Background removed successfully");

    // Convert the output to buffer
    let outputBuffer: Buffer;
    if (outputBlob instanceof Blob) {
      const ab = await outputBlob.arrayBuffer();
      outputBuffer = Buffer.from(ab);
    } else if (Buffer.isBuffer(outputBlob)) {
      outputBuffer = outputBlob;
    } else {
      // Handle Uint8Array or other array buffer views
      outputBuffer = Buffer.from(outputBlob as any);
    }

    console.log(`📦 Output size: ${outputBuffer.length} bytes`);

    // Convert the Buffer to Uint8Array so it's accepted as BodyInit by the Web Response
    const responseBody = new Uint8Array(outputBuffer);

    return new Response(responseBody, {
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
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}