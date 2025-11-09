import { NextResponse } from "next/server";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

const tools = {
  generateImage: z.object({
    prompt: z.string().describe("Description of the image to generate"),
  }),
  removeBackground: z.object({
    layerId: z
      .string()
      .optional()
      .describe("Layer ID to remove background from"),
  }),
};

export async function POST(req: Request) {
  const { message } = await req.json();

  if (!message)
    return NextResponse.json({ error: "No message provided" }, { status: 400 });

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.4,
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const systemPrompt = `
You are an AI assistant for an image editing app.
You can call the following actions:
1. generateImage(prompt) — when the user asks to create or draw something.
2. removeBackground(layerId) — when the user asks to remove the background.

Respond ONLY in JSON format with one of these two keys:
{
  "action": "generateImage",
  "prompt": "frog dancing on a car"
}

OR

{
  "action": "removeBackground"
}
`;

  const response = await model.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ]);

  // 🧩 Clean + parse the response safely
  let text = "";
  if (typeof response.content === "string") {
    text = response.content.trim();
  } else if (Array.isArray(response.content)) {
    text = response.content
      .map((c: any) => (typeof c === "string" ? c : c?.text || ""))
      .join(" ")
      .trim();
  } else {
    text = String(response.content || "").trim();
  }

  // 🧹 Strip Markdown-style code fences like ```json ... ```
  text = text
    .replace(/```(json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    parsed = { action: "message", text };
  }

  return NextResponse.json(parsed);
}
