

import { queryDatabase } from "./lib/db";
import { generateEmbedding, generateResponse } from "./lib/openai";

export async function askQuestion(question: string) {
  const embedding = await generateEmbedding(question);
  const queryRes = await queryDatabase(embedding.data[0].embedding);
  const response = await generateResponse(question, queryRes.map((doc) => doc.text));
  return response;
}

// askQuestion("Je viens de décrocher mon baccalauréat, quels sont les fillière de UIR").then((res) => {
//   console.log(res);
// });