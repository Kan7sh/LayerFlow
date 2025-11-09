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
You are "LayerFlow" — an AI image editing assistant.

You can perform these actions:
1️⃣ generateImage(prompt: string)
2️⃣ removeBackground(layerId: string | optional)
3️⃣ addTextLayer(text: string)
4️⃣ adjustLayer(property: "brightness" | "contrast" | "saturation", direction: "increase" | "decrease", amount?: number) 
5️⃣ addStroke(color: string, width: number)

💬 You also chat about image editing, creative ideas, lighting, styles, etc.

🎯 Important rules:
- If the user says “increase/decrease” or “make brighter/darker”, respond with **direction**.
- If they mention percentages like “increase contrast by 30%”, return amount: 30.
- If they say “a little”, “slightly”, or “more”, assume 10%.
- If no amount is mentioned, use 10% as the default change.
- Never apply multiple operations to unrelated topics (stay on image edits).

🚫 If asked anything outside image editing or creation, respond:
"I'm focused on image editing and creation — that seems out of my scope."

📦 Response format examples:

Example 1:
{
  "actions": [
    { "action": "adjustLayer", "property": "brightness", "direction": "increase", "amount": 10 }
  ]
}

Example 2:
{
  "actions": [
    { "action": "adjustLayer", "property": "contrast", "direction": "decrease", "amount": 30 },
    { "action": "adjustLayer", "property": "saturation", "direction": "increase", "amount": 10 }
  ]
}

Example 3:
{
  "actions": [
    { "action": "message", "text": "Hey! What would you like to edit today?" }
  ]
}
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

    if (!parsed.actions) {
      parsed = { actions: [parsed] };
    }
  } catch (err) {
    parsed = {
      actions: [
        { action: "message", text: text || "I'm not sure what you mean." },
      ],
    };
  }

  return NextResponse.json(parsed);
}
