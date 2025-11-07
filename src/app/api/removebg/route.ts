import { NextResponse } from "next/server";
import { removeBackground } from "@imgly/background-removal-node";
import fs from "fs";
import path from "path";

export const runtime = "nodejs"; // Must run in Node.js (not Edge)

export async function POST(req: Request) {
  try {
    // Parse multipart form-data directly (Next.js built-in)
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    // Convert uploaded File to buffer
    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/png";

    console.log("🧠 Removing background...");

    // Use the Imgly background remover
    const blob = new Blob([inputBuffer], { type: mimeType });
    const outputBlob = await removeBackground(blob);

    const outputArrayBuffer = await outputBlob.arrayBuffer();
    const outputBuffer = Buffer.from(outputArrayBuffer);

    const saveDir = path.join(process.cwd(), "public", "processed");
    // if (!fs.existsSync(saveDir)) {
    //   fs.mkdirSync(saveDir, { recursive: true });
    // }
    // const outputFileName = `no-bg-${Date.now()}.png`;
    // const outputFilePath = path.join(saveDir, outputFileName);
    // fs.writeFileSync(outputFilePath, outputBuffer);

    // console.log(`✅ Background removed successfully -> ${outputFileName}`);

    return new Response(outputBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=removed-bg.png",
      },
    });
  } catch (error: any) {
    console.error("❌ Error removing background:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
