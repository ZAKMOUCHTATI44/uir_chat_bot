import fs from 'fs';
import { createCollection, uploadData } from "./lib/db";
import { generateEmbedding } from "./lib/openai";
import { scrape } from "./lib/scrape";

const urls = [
  "https://www.uir.ac.ma/",
  "https://www.uir.ac.ma/fr/page/scholarships",
  "https://deluxe-daifuku-73f7f6.netlify.app/",
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
];

// Load extracted dataset
const pricingData = JSON.parse(fs.readFileSync('./src/university_pricing.json', 'utf-8'));


async function ingest() {
  let chunks = [];


  console.log("Start ")
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
          url: url,
        }))
      );
    })
  );

  // // Process Extracted Pricing Data
  // const pricingEmbeddings = await Promise.all(
  //   pricingData.map(async (doc) => await generateEmbedding(doc.Program))
  // );

  // chunks = chunks.concat(
  //   pricingData.map((doc, index) => ({
  //     text: `${doc.College} - ${doc.Program} costs ${doc["Price (Dhs/Year)"]}`,
  //     $vector: pricingEmbeddings[index].data[0].embedding,
  //     url: "local-dataset",
  //   }))
  // );

  await createCollection();

  await uploadData(
    chunks.map((doc) => ({
      $vector: doc.$vector,
      text: doc.text,
      source: doc.url,
    }))
  );

  console.log("End ")

}

ingest();
