


import { DataAPIClient } from "@datastax/astra-db-ts"
require("dotenv").config();

const client = new DataAPIClient(process.env.APIClient);
const db = client.db(process.env.CLIENT_DB);
const collection = db.collection('uirgpt4');

export async function createCollection() {
  const res = await db.createCollection("uirgpt4", {
    vector: {
      dimension: 1536,
      metric: "dot_product"
    }
  });
  return res
}

export async function uploadData(data: {
  $vector: number[],
  text: string
}[]) {
  return await collection.insertMany(data);
}


export async function queryDatabase(query: number[]) {
  const res = await collection.find(null, {
    sort: {
      $vector: query
    },
    limit: 10
  }).toArray();

  return res
}