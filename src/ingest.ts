import axios from "axios";
import cheerio from "cheerio";
import { createCollection, uploadData } from "./lib/db";
import { generateEmbedding } from "./lib/openai";

const baseURL = "https://www.uir.ac.ma/";
const visited = new Set<string>();
let allPages: { text: string; url: string }[] = [];

async function scrapePage(url: string) {
  if (visited.has(url)) return; 
  visited.add(url);

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    const textContent = $("body").text().replace(/\s+/g, " ").trim(); // Extract text
    allPages.push({ text: textContent, url });

    // Extract internal links
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href && href.startsWith("/") && !href.includes("#")) {
        scrapePage(new URL(href, baseURL).href);
      }
    });

  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error.message);
  }
}

async function ingest() {
  console.log("Starting scrape...");
  await scrapePage(baseURL);

  console.log(`Scraped ${allPages.length} pages. Generating embeddings...`);
  
  let chunks: { text: string; $vector: number[]; url: string }[] = [];

  for (const page of allPages) {
    const embedding = await generateEmbedding(page.text);
    chunks.push({ text: page.text, $vector: embedding.data[0].embedding, url: page.url });
  }

  await createCollection();
  await uploadData(chunks.map(doc => ({ $vector: doc.$vector, text: doc.text, source: doc.url })));

  console.log("Data ingestion complete!");
}

ingest();
