import { Document } from "@langchain/core/dist/documents/document.js";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";
import { splitter } from "./splitter";

// Настройка Pinecone
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
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
