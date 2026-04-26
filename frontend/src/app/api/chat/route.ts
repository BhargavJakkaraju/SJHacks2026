import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

const SYSTEM_PROMPT = `You are a creative assistant built into Bloom, an IDE for artists.
You can see the user's sketch/drawing on the canvas. Analyze it carefully and:
- Describe what you see in the sketch
- Identify what they might be trying to build or create
- Offer specific, detailed creative suggestions to expand or improve it
- Suggest complementary elements, scenery, or details they could add
- Be encouraging, specific, and actionable

Keep responses concise but insightful. Format key suggestions as short bullet points when helpful.`;

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response("GEMINI_API_KEY not configured", { status: 500 });
  }

  const { messages, sketchDataUrl } = (await req.json()) as {
    messages: Message[];
    sketchDataUrl: string | null;
  };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL ?? "gemini-1.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  // Map prior turns into Gemini history format (all but the last user message)
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];

  // Build parts for the current user turn — attach sketch image if present
  const parts: Part[] = [];
  if (sketchDataUrl) {
    const base64 = sketchDataUrl.replace(/^data:image\/\w+;base64,/, "");
    parts.push({ inlineData: { data: base64, mimeType: "image/png" } });
  }
  parts.push({ text: lastMessage.content });

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(parts);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) controller.enqueue(encoder.encode(text));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
