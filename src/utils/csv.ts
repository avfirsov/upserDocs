import * as csvWriter from "csv-writer";
import fs from "fs";
import csvParser from "csv-parser";

// Инициализация CSV-писателей
export const successWriter = csvWriter.createObjectCsvWriter({
  path: "success.csv",
  header: [{ id: "url", title: "URL" }],
});
export const failureWriter = csvWriter.createObjectCsvWriter({
  path: "failure.csv",
  header: [
    { id: "url", title: "URL" },
    { id: "chunkInd", title: "Chunk Index" },
    { id: "error", title: "Error Description" },
  ],
});

// Функция для чтения URL из CSV-файлов и добавления их в набор
export async function readUrlsFromCsv(filePath: string): Promise<Set<string>> {
  const urls = new Set<string>();
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return resolve(urls); // Если файла нет, возвращаем пустой набор
    }

    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on("data", (row) => {
        urls.add(row.URL);
      })
      .on("end", () => resolve(urls))
      .on("error", reject);
  });
}

export const getProcessed = async (): Promise<Set<string>> => {
  const successUrls = await readUrlsFromCsv("success.csv");
  const failureUrls = await readUrlsFromCsv("failure.csv");
  return new Set<string>([...successUrls, ...failureUrls]);
};
