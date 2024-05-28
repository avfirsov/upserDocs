import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});
