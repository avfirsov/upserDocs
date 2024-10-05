// Извлечение текста из HTML с помощью Puppeteer
import axios from "axios";
import { load } from "cheerio";
import { upsertText } from "../utils/upsertChunks.js";
import { failureWriter, getProcessed, successWriter } from "../utils/csv.js";
import PQueue from "p-queue";

//default text extractor by selector
async function extractTextFromUrl(
  url: string,
  contentSelector: string,
): Promise<string> {
  const response = await axios.get(url);
  const $ = load(response.data);

  // Поменяйте селектор в зависимости от структуры страницы
  return $(contentSelector).text();
}

// Функция обработки одной страницы
export async function upsertUrl(
  url: string,
  contentSelectorOrGetTextFromUrl: string | { (url: string): Promise<string> },
  shouldCheckIfProcessed = false,
) {
  try {
    if (shouldCheckIfProcessed) {
      const processedUrls = await getProcessed();
      if (processedUrls.has(url)) {
        return;
      }
    }
    let text = "";
    if (typeof contentSelectorOrGetTextFromUrl === "function") {
      text = await contentSelectorOrGetTextFromUrl(url);
    } else {
      text = await extractTextFromUrl(url, contentSelectorOrGetTextFromUrl);
    }

    console.log("Going to upsert text from an url", url);
    console.log("The text:", text);
    await upsertText(text);

    console.log(`Uploaded: ${url}`);

    await successWriter.writeRecords([{ url }]);
  } catch (error) {
    console.error(`Failed to process ${url}:`, error);
    // Запись ошибки
    await failureWriter.writeRecords([
      { url, chunkInd: -1, error: String(error) },
    ]);
  }
}

const extractionQueue = new PQueue({
  concurrency: 5,
  interval: 1000,
  intervalCap: 5,
});

export const upsertUrls = async (
  urls: string[],
  contentSelectorOrGetTextFromUrl: string | { (url: string): Promise<string> },
): Promise<void> => {
  const processedUrls = await getProcessed();

  // Добавляем задания в очередь
  for (const url of urls.filter((url) => !processedUrls.has(url))) {
    extractionQueue.add(() => upsertUrl(url, contentSelectorOrGetTextFromUrl));
  }

  // Ожидаем завершения всех заданий
  await extractionQueue.onIdle();
  console.log("All pages processed.");
};
