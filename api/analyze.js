import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { imageBase64, portionGrams } = req.body;

    const userInstructionText = `
      You are an assistant that analyzes a meal photo and returns a concise nutritional estimate.
      Return ONLY a single JSON object with fields: calories, protein_g, fat_g, carbs_g, confidence.
      Optional: use portion weight if provided: portion_g=${portionGrams || 'unknown'}.
    `;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "user", content: [{ type: "input_text", text: userInstructionText }, { type: "input_image", image_url: imageBase64 }] }
      ],
      temperature: 0.2,
      max_output_tokens: 400
    });

    let assistantText = response.output?.[0]?.content?.[0]?.text || "{}";
    let jsonText = assistantText.match(/\{.*\}/s)?.[0] || "{}";
    const parsed = JSON.parse(jsonText);

    res.status(200).json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
