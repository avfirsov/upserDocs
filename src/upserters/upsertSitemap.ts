import axios from "axios/index";
import { load } from "cheerio";
import { getProcessed } from "../utils/csv";
import { upsertUrl, upsertUrls } from "./upsertUrl";

// Получение ссылок из sitemap.xml
export async function getUrlsFromSitemap(
  sitemapUrl: string,
  processedUrls: Set<string>,
): Promise<string[]> {
  const response = await axios.get(sitemapUrl);
  const $ = load(response.data, { xmlMode: true });

  return Array.from(
    $("url > loc").map((_, el) =>
      !processedUrls.has($(el).text()) ? $(el).text() : "",
    ),
  ).filter(Boolean);
}

// Основная функция для выполнения парсинга, векторизации и загрузки
export async function upsertSitemap(
  sitemapUrl: string,
  contentSelectorOrGetTextFromUrl: string | { (url: string): Promise<string> },
): Promise<void> {
  const processedUrls = await getProcessed();

  const urls = await getUrlsFromSitemap(sitemapUrl, processedUrls);

  await upsertUrls(urls, contentSelectorOrGetTextFromUrl);

  console.log(`All pages from the sitemap ${sitemapUrl} processed.`);
}
