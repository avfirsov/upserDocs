import "dotenv/config";
import { upsertSitemap } from "./src/upserters/upsertSitemap";

const SITEMAP_URL = "https://js.langchain.com/v0.1/sitemap.xml";
const TEXT_CONTENT_SELECTOR = "article .theme-doc-markdown.markdown";

// Укажите нужный sitemap.xml URL
upsertSitemap(SITEMAP_URL, TEXT_CONTENT_SELECTOR);
