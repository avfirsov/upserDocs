import fs, { promises as fsPromises } from "fs";
import pdfParse from "pdf-parse";
import { read, utils } from "xlsx";
import csvParse from "csv-parser";
import textract from "textract";
import MarkdownIt from "markdown-it";
import { getMimeType } from "./mime";

// Инициализация Markdown парсера
const mdParser = new MarkdownIt();

export async function extractTextFromDocumentBuffer(
  buffer: Buffer,
  mimeType: string,
): Promise<string | void> {
  switch (mimeType) {
    case "text/plain":
      return buffer.toString("utf8");
    case "text/markdown":
      return mdParser.render(buffer.toString("utf8"));
    case "application/pdf":
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "application/msword":
      return new Promise((resolve, reject) => {
        textract.fromBufferWithMime(mimeType, buffer, (error, text) => {
          if (error) reject("Ошибка при извлечении текста из DOC/DOCX файла.");
          else resolve(text);
        });
      });
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
    case "application/vnd.ms-excel":
      try {
        const workbook = read(buffer, { type: "buffer" });
        let text = "";
        workbook.SheetNames.forEach((name) => {
          const sheet = workbook.Sheets[name];
          const data = utils.sheet_to_csv(sheet);
          text += data;
        });
        return text;
      } catch (error) {
        return "Ошибка при обработке XLS/XLSX файла.";
      }
    case "text/csv":
      return new Promise((resolve, reject) => {
        let csvText = "";
        const stream = fs.createReadStream(buffer).pipe(csvParse());
        stream.on(
          "data",
          (data) => (csvText += Object.values(data).join(", ") + "\n"),
        );
        stream.on("end", () => resolve(csvText));
        stream.on("error", () => reject("Ошибка при чтении CSV файла."));
      });
    default:
      throw new Error("Формат файла не поддерживается.");
  }
}

export const extractTextFromDocumentByFilepath = async (
  filePath: string,
): Promise<string | void> => {
  const mime = getMimeType(filePath);
  const buffer = await fsPromises.readFile(filePath);

  if (!mime) {
    console.log("Unsupported filetype", filePath);
    return;
  }

  return extractTextFromDocumentBuffer(buffer, mime);
};
