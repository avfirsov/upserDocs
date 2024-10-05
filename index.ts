import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";
import { upsertSitemap } from "./src/upserters/upsertSitemap.js";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(path.dirname(__filename));

// await upsertDocuments("docs");
await upsertSitemap({
  sitemapUrl: "https://js.langchain.com/sitemap.xml",
  contentSelectorOrGetTextFromUrl: "article",
});
