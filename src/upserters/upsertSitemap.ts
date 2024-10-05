import axios from "axios";
import { load } from "cheerio";
import { getProcessed } from "../utils/csv.js";
import { upsertUrls } from "./upsertUrl.js";
import fs from "fs";
import { parseString } from "xml2js";

// Получение ссылок из sitemap.xml
export async function getUrlsFromSitemapByUrl(
  sitemapUrl: string,
): Promise<string[]> {
  const response = await axios.get(sitemapUrl);
  const $ = load(response.data, { xmlMode: true });

  return Array.from($("url > loc").map((_, el) => $(el).text())).filter(
    Boolean,
  );
}

// Функция для чтения и парсинга файла sitemap.xml
export const parseSitemap = (filePath: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }

      parseString(data, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        // Предполагаем, что ссылки находятся в теге <url><loc>
        try {
          const urls = result.urlset.url.map((entry: any) => entry.loc[0]);
          resolve(urls);
        } catch (e) {
          reject(e);
        }
      });
    });
  });
};

// Основная функция для выполнения парсинга, векторизации и загрузки
export async function upsertSitemap(params: {
  sitemapUrl?: string;
  filePath?: string;
  contentSelectorOrGetTextFromUrl: string | { (url: string): Promise<string> };
}): Promise<void> {
  const processedUrls = await getProcessed();

  const urls = params.sitemapUrl
    ? await getUrlsFromSitemapByUrl(params.sitemapUrl)
    : params.filePath
      ? await parseSitemap(params?.filePath)
      : [];

  await upsertUrls(
    urls.filter((url) => !processedUrls.has(url)).filter(Boolean),
    params.contentSelectorOrGetTextFromUrl,
  );

  console.log(
    `All pages from the sitemap ${params.sitemapUrl ? params.sitemapUrl : params.filePath} processed.`,
  );
}
