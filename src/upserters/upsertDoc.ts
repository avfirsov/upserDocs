import PQueue from "p-queue";
import { upsertText } from "../utils/upsertChunks";
import { failureWriter, getProcessed, successWriter } from "../utils/csv";
import { extractTextFromDocumentByFilepath } from "../utils/extractTextFromDoc";
import path from "path";
import { promises as fsPromises } from "fs";

export const upsertDocument = async (
  filePath: string,
  shouldCheckIfProcessed = false,
): Promise<void> => {
  try {
    if (shouldCheckIfProcessed) {
      const processedFilePaths = await getProcessed();
      if (processedFilePaths.has(filePath)) {
        return;
      }
    }
    const text = await extractTextFromDocumentByFilepath(filePath);
    if (!text) {
      return;
    }

    console.log("Going to upsert text from the document", filePath);
    console.log("The text:", text);
    await upsertText(text);

    console.log(`Uploaded: ${filePath}`);

    await successWriter.writeRecords([{ url: filePath }]);
  } catch (error) {
    console.error(`Failed to process ${filePath}:`, error);
    // Запись ошибки
    await failureWriter.writeRecords([
      { url: filePath, chunkInd: -1, error: String(error) },
    ]);
  }
};

const extractionQueue = new PQueue({
  concurrency: 5,
  interval: 1000,
  intervalCap: 5,
});

export const upsertDocuments = async (dirname: string): Promise<void> => {
  const dirPath = path.join(__dirname, dirname);
  const filenames = await fsPromises.readdir(dirPath);

  const filePaths: string[] = [];
  for (const filename of filenames) {
    const filePath = path.join(dirPath, filename);
    filePaths.push(filePath);
  }

  const processedFilePaths = await getProcessed();

  for (const filePath in filePaths.filter((filePath) =>
    processedFilePaths.has(filePath),
  )) {
    extractionQueue.add(() => upsertDocument(filePath));
  }

  // Ожидаем завершения всех заданий
  await extractionQueue.onIdle();
  console.log(`All files in directory ${dirname} processed.`);
};
