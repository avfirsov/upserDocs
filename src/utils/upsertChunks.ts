import { Document } from "@langchain/core/documents";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { splitter } from "./splitter.js";

// Настройка Pinecone
const pinecone = new Pinecone({ apiKey: 'efa0c8c1-5887-4c45-a3e0-1103b300282e' });
export const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

export async function upsertChunks(
  chunks: Document<Record<string, string>>[],
): Promise<PineconeStore> {
  return PineconeStore.fromDocuments(
    chunks,
    new OpenAIEmbeddings({
      model: process.env.EMBEDDING_MODEL!,
      apiKey: process.env.OPENAI_API_KEY!,
    }),
    {
      pineconeIndex,
      maxConcurrency: 5,
    },
  );
}

export const upsertText = async (text: string): Promise<void> => {
  const docOutput = await splitter.createDocuments(
    [text],
    [
      {
        blobType: "",
        source: "blob",
        text,
      },
    ],
  );

  await upsertChunks(docOutput);
  return;
};
