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
    temperature: 0.6,
    apiKey: process.env.GEMINI_API_KEY!,
  });

  const systemPrompt = `
You are an AI assistant named "LayerFlow" for an advanced image editing app.
You can perform two **actions**:
1️⃣ generateImage(prompt) — to create or draw something based on a description.
2️⃣ removeBackground(layerId) — to remove the background from the selected image layer.

💬 You are also a friendly conversational assistant who helps with:
- Image editing ideas (composition, lighting, contrast, styles)
- Design advice (layouts, filters, color palettes, balance)
- Explaining how to use editing features
- Responding to greetings or small talk like "hello", "thanks", etc.

🚫 Do NOT answer questions unrelated to image editing, AI image generation, or art.
If the user asks something outside this context, politely reply:
"I'm focused on image editing and creation — that seems out of my scope."

🎯 Response format:
- If it's an **action**, respond as pure JSON:
  { "action": "generateImage", "prompt": "frog dancing on a car" }

  or

  { "action": "removeBackground" }

- If it's a **normal message or chat**, respond as:
  { "action": "message", "text": "Hey there! How can I help you with your image edits today?" }
`;

  const response = await model.invoke([
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ]);

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

  text = text
    .replace(/```(json)?/gi, "")
    .replace(/```/g, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    parsed = { action: "message", text: text || "I'm not sure what you mean." };
  }

  return NextResponse.json(parsed);
}
