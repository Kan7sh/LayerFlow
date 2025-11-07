import { error } from "console";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt } = body;
    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is Required" },
        { status: 400 }
      );
    }
    const encodedPrompt = encodeURIComponent(prompt);
    const pollinationBaseUrl = process.env.POLLINATION_URL;
    const url =
      pollinationBaseUrl +
      encodedPrompt +
      "?width=1024&height=1024&nologo=true";
    const response = await fetch(url);
    if (!response.ok) {
      const text = response.text();
      return NextResponse.json(
        { error: "Failed to generate image", details: text },
        { status: response.status }
      );
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer());

    return new Response(imageBuffer, {
      headers: {
        "Content-type": "image/png",
        "Content-Disposition": "inline; filename=generated.png",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
