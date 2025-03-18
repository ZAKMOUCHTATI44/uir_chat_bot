import fs from "fs";
import csvParser from "csv-parser";
import { createCollection, uploadData } from "./lib/db";
import { generateEmbedding } from "./lib/openai";
import { scrape } from "./lib/scrape";

const urls = [
  "https://www.uir.ac.ma/",
  "https://www.uir.ac.ma/fr/page/scholarships",
  "https://www.uir.ac.ma/fr/page/certificates",
  "https://www.uir.ac.ma/fr/page/library",
  "https://www.uir.ac.ma/fr/page/frais-de-scolarite",
  "https://www.uir.ac.ma/fr/page/calendrier-des-concours",
  "https://www.uir.ac.ma/fr/page/calendrier-de-la-rentree",
  "https://www.uir.ac.ma/fr/page/partenaires",
  "https://www.uir.ac.ma/fr/page/Entreprises",
  "https://www.uir.ac.ma/fr/page/recognition",
  "https://www.uir.ac.ma/fr/page/candidats",
  "https://www.uir.ac.ma/fr/page/Catering",
  "https://www.uir.ac.ma/fr/page/evenements",
  "https://www.uir.ac.ma/fr/page/testmonials",
  "https://www.uir.ac.ma/fr/page/FAQ",
  "https://www.uir.ac.ma/fr/page/Parents",
  "https://www.uir.ac.ma/fr/page/Housing",
  "https://www.uir.ac.ma/fr/page/Alumni",
  "https://www.uir.ac.ma/fr/page/transports",
  "https://www.uir.ac.ma/fr/page/ihecs",
  "https://www.uir.ac.ma/fr/page/claims-management",
  "https://www.uir.ac.ma/fr/page/masters-2",
  "https://www.uir.ac.ma/fr/page/frais-de-concours-1"
];

const TEXT_DATASET_PATH = "./Feuille de calcul sans titre - university_fees.csv";
const CSV_FILE_PATH = "./dataset.csv"; // Path to your CSV file

async function readCSVFile(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const rows: string[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        // Assuming you have a column named "text" in your CSV
        if (row.text) {
          rows.push(row.text);
        }
      })
      .on("end", () => resolve(rows))
      .on("error", (error) => reject(error));
  });
}

async function ingest() {
  let chunks: { text: string; $vector: number[]; source: string }[] = [];

  console.log("Start processing...");

  // Process Web Scraped Data
  await Promise.all(
    urls.map(async (url) => {
      let data = await scrape(url);
      const embeddings = await Promise.all(
        data.map(async (doc) => await generateEmbedding(doc.pageContent))
      );

      chunks = chunks.concat(
        data.map((doc, index) => ({
          text: doc.pageContent,
          $vector: embeddings[index].data[0].embedding,
          source: url,
        }))
      );
    })
  );

  // Process CSV Data
  if (fs.existsSync(CSV_FILE_PATH)) {
    const csvData = await readCSVFile(CSV_FILE_PATH);
    const embeddings = await Promise.all(
      csvData.map(async (text) => await generateEmbedding(text))
    );

    chunks = chunks.concat(
      csvData.map((text, index) => ({
        text,
        $vector: embeddings[index].data[0].embedding,
        source: "dataset.csv",
      }))
    );
  } else {
    console.warn(`CSV file not found at ${CSV_FILE_PATH}`);
  }

  // Process Text File Data
  if (fs.existsSync(TEXT_DATASET_PATH)) {
    const fileContent = fs.readFileSync(TEXT_DATASET_PATH, "utf-8");
    const textChunks = fileContent
      .split("\n")
      .filter((line) => line.trim() !== ""); // Split by line

    const embeddings = await Promise.all(
      textChunks.map(async (text) => await generateEmbedding(text))
    );

    chunks = chunks.concat(
      textChunks.map((text, index) => ({
        text,
        $vector: embeddings[index].data[0].embedding,
        source: "dataset.txt",
      }))
    );
  } else {
    console.warn(`Dataset file not found at ${TEXT_DATASET_PATH}`);
  }

  await createCollection();
  await uploadData(chunks);

  console.log("Ingestion completed.");
}

ingest();
