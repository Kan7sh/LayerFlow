import { NextResponse } from "next/server";
import { removeBackground } from "@imgly/background-removal-node";
import fs from "fs";
import path from "path";

export const runtime = "nodejs"; 

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);
    const mimeType = file.type || "image/png";

    console.log("🧠 Removing background...");

    const blob = new Blob([inputBuffer], { type: mimeType });
    const outputBlob = await removeBackground(blob);

    const outputArrayBuffer = await outputBlob.arrayBuffer();
    const outputBuffer = Buffer.from(outputArrayBuffer);

    const saveDir = path.join(process.cwd(), "public", "processed");

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
