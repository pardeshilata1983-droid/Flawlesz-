import * as pdfParseModule from 'pdf-parse';
const pdfParse: any = (pdfParseModule as any).default || pdfParseModule;

export interface ParsedDocument {
  name: string;
  type: string;
  size: number;
  text: string;
  pageCount?: number;
  wordCount: number;
}

export async function parseDocumentBuffer(
  fileName: string,
  fileType: string,
  fileBuffer: Buffer
): Promise<ParsedDocument> {
  const size = fileBuffer.length;
  let extractedText = '';
  let pageCount: number | undefined;

  const lowerName = fileName.toLowerCase();

  if (fileType.includes('pdf') || lowerName.endsWith('.pdf')) {
    try {
      const data = await pdfParse(fileBuffer);
      extractedText = data.text || '';
      pageCount = data.numpages;
    } catch (err: any) {
      console.warn('[PARSER] Error parsing PDF with pdf-parse:', err.message);
      // Fallback: extract visible text from buffer
      extractedText = fileBuffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
    }
  } else {
    // Text, Markdown, JSON, CSV, etc.
    extractedText = fileBuffer.toString('utf-8');
  }

  // Clean up excessive whitespace
  extractedText = extractedText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  const words = extractedText.split(/\s+/).filter(Boolean);

  return {
    name: fileName,
    type: fileType,
    size,
    text: extractedText,
    pageCount,
    wordCount: words.length
  };
}
