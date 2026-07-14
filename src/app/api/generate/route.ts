import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { rateLimitOrResponse } from "@/lib/rate-limit";

interface WorkInput {
  category: string;
  descriptionRaw: string;
}

interface GenerateRequest {
  name: string;
  roleTitle: string;
  bioRaw: string;
  works: WorkInput[];
}

interface GenerateResult {
  aiUsed: boolean;
  tagline: string;
  bioPolished: string;
  works: { category: string; descriptionPolished: string }[];
}

export async function POST(req: NextRequest) {
  const limited = rateLimitOrResponse(req, "generate", 15, 60 * 60 * 1000);
  if (limited) return limited;

  const body = (await req.json()) as GenerateRequest;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    const fallback: GenerateResult = {
      aiUsed: false,
      tagline: "",
      bioPolished: body.bioRaw,
      works: body.works.map((w) => ({
        category: w.category,
        descriptionPolished: w.descriptionRaw,
      })),
    };
    return NextResponse.json(fallback);
  }

  const anthropic = new Anthropic({ apiKey });

  const prompt = `Ты помогаешь оформить страницу-визитку мастера/специалиста. На входе — сырые тезисные заметки, на выходе нужен связный, тёплый, но не приторный текст на русском языке. Не выдумывай факты, которых нет во входных данных.

Имя: ${body.name}
Чем занимается: ${body.roleTitle}
Сырое био (тезисно): ${body.bioRaw || "(не указано)"}

Работы (тезисные описания):
${body.works.map((w, i) => `${i + 1}. Категория: ${w.category || "(без категории)"}. Описание: ${w.descriptionRaw || "(без описания)"}`).join("\n")}

Верни СТРОГО валидный JSON без markdown-обёртки, формата:
{
  "tagline": "короткий слоган до 6 слов",
  "bioPolished": "связное био, 2-4 предложения",
  "works": [{"category": "категория", "descriptionPolished": "причёсанное описание, 1-2 предложения"}]
}
Порядок works должен совпадать с порядком во входных данных.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    const result: GenerateResult = {
      aiUsed: true,
      tagline: parsed.tagline ?? "",
      bioPolished: parsed.bioPolished ?? body.bioRaw,
      works: Array.isArray(parsed.works)
        ? parsed.works.map((w: { category?: string; descriptionPolished?: string }, i: number) => ({
            category: w.category ?? body.works[i]?.category ?? "",
            descriptionPolished: w.descriptionPolished ?? body.works[i]?.descriptionRaw ?? "",
          }))
        : body.works.map((w) => ({ category: w.category, descriptionPolished: w.descriptionRaw })),
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error("generate error", err);
    const fallback: GenerateResult = {
      aiUsed: false,
      tagline: "",
      bioPolished: body.bioRaw,
      works: body.works.map((w) => ({
        category: w.category,
        descriptionPolished: w.descriptionRaw,
      })),
    };
    return NextResponse.json(fallback);
  }
}
