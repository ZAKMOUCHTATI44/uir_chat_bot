// Generate vector embeddings using the openai api

import OpenAI from "openai";
require("dotenv").config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string) {

  if (!text || text.trim() === "") {
   return null;
  }
  const embedding = await client.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  return embedding;
}

export async function generateResponse(question: string, context: string[]) {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: `You are a representative of L’Université Internationale de Rabat. Respond naturally and professionally, as if you were a human working at the university. Keep your answer clear, concise, and suitable for a WhatsApp message. Provide direct and relevant information without suggesting visiting the website or contacting the university. **Do not start with a greeting like "Bonjour" or "Hello".**

        QUESTION: ${question}.`,
      },
    ],
  });

  return response.choices[0].message.content.replace(/^(Bonjour|Hello)[!,. ]*/i, "");
}
