import { createCollection, uploadData } from "./lib/db";
import { generateEmbedding } from "./lib/openai";
import { scrape } from "./lib/scrape";

const urls = [
  "https://www.uir.ac.ma/",
  "https://www.uir.ac.ma/fr/page/scholarships",
  "https://www.uir.ac.ma/fr/page/certificates",
  // "https://www.uir.ac.ma/fr/page/library",
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

async function ingest() {
  let chunks: { text: string; $vector: number[]; url: string }[] = [];

  await Promise.all(
    urls.map(async (url) => {
      let data = await scrape(url);

      const embeddings = await Promise.all(
        data.map(async (doc, index) => {
          const embedding = await generateEmbedding(doc.pageContent);
          return embedding;
        })
      );

      chunks = chunks.concat(
        data.map((doc, index) => {
          return {
            text: doc.pageContent,
            $vector: embeddings[index].data[0].embedding,
            url: url,
          };
        })
      );
    })
  );

  await createCollection();

  await uploadData(
    chunks.map((doc, index) => {
      return {
        $vector: doc.$vector,
        text: doc.text,
        source: doc.url,
      };
    })
  );
}

ingest();
