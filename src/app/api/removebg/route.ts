import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const inputBlob = new Blob([arrayBuffer], { type: file.type });

    let removeBackgroundFn: any;

    if (process.env.VERCEL === "1") {
      const { removeBackground } = await import("@imgly/background-removal");
      removeBackgroundFn = removeBackground;
      console.log("🧠 Using WASM background remover (Vercel Edge)...");
    } else {
      const { removeBackground } = await import(
        "@imgly/background-removal-node"
      );
      removeBackgroundFn = removeBackground;
      console.log("⚡ Using Node background remover (Local Dev)...");
    }

    const outputBlob = await removeBackgroundFn(inputBlob);

    return new Response(outputBlob, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=removed-bg.png",
      },
    });
  } catch (error: any) {
    console.error("❌ Error removing background:", error);
    return NextResponse.json(
      { error: "Background removal failed", details: error.message },
      { status: 500 }
    );
  }
}
