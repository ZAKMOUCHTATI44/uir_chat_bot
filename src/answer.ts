import { queryDatabase } from "./lib/db";
import { generateEmbedding, generateResponse } from "./lib/openai";

export async function askQuestion(question: string) {

  console.log(question)
  const embedding = await generateEmbedding(question);

  const queryRes = await queryDatabase(embedding.data[0].embedding);
  // console.log(queryRes);

  const response = await generateResponse(
    question,
    queryRes.map((doc) => doc.text)
  );


  console.log(response)
  return response;
}
