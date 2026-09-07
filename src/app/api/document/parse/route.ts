import { NextRequest, NextResponse } from "next/server";
import { UploadedDocument } from "@/lib/types";

export const maxDuration = 60;

/**
 * Extracts text from PDF buffer using battle-tested pdf-parse,
 * with an emergency regex stream fallback for malformed/uncompressed PDFs.
 */
async function parsePdfBuffer(buffer: Buffer, fileName: string): Promise<string> {
  let extractedText = "";

  // 1. Primary: Standard pdf-parse (require library directly to avoid index.js test harness)
  try {
    let pdf: any;
    try {
      pdf = require("pdf-parse/lib/pdf-parse.js");
    } catch {
      pdf = require("pdf-parse");
    }
    const data = await pdf(buffer);
    extractedText = data?.text || "";
    console.log(`[PDF Parser] pdf-parse extracted ${extractedText.length} characters across ${data?.numpages || 1} pages for ${fileName}`);
  } catch (err: any) {
    console.warn(`[PDF Parser] pdf-parse primary failed for ${fileName}:`, err?.message);
  }

  // 2. Fallback: Raw stream text recovery if primary parser produced no text
  if (!extractedText || extractedText.trim().length === 0) {
    try {
      const rawString = buffer.toString("latin1");
      const textPieces: string[] = [];
      const textRegex = /\(([^)\r\n]+)\)\s*(?:Tj|'|")/g;
      let match: RegExpExecArray | null;
      while ((match = textRegex.exec(rawString)) !== null) {
        const piece = match[1]
          .replace(/\\([()\\])/g, "$1")
          .replace(/\\[nrtbf]/g, " ")
          .trim();
        if (piece && piece.length > 1) {
          textPieces.push(piece);
        }
      }
      if (textPieces.length > 0) {
        extractedText = textPieces.join(" ");
        console.log(`[PDF Parser] Recovered ${textPieces.length} text fragments via raw stream parsing for ${fileName}`);
      }
    } catch (rawErr: any) {
      console.warn(`[PDF Parser] Raw stream fallback failed for ${fileName}:`, rawErr?.message);
    }
  }

  return extractedText;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const parsedDocuments: UploadedDocument[] = [];

    for (const file of files) {
      const fileName = file.name;
      const fileType = file.type || "application/octet-stream";
      const fileSize = file.size;
      const fileExt = fileName.split(".").pop()?.toLowerCase() || "";

      console.log(`[Document Parser] Processing ${fileName} (${(fileSize / 1024).toFixed(1)} KB, ext: .${fileExt})`);

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      let extractedText = "";

      // 1. PDF Documents
      if (fileType === "application/pdf" || fileExt === "pdf") {
        try {
          extractedText = await parsePdfBuffer(buffer, fileName);
          if (!extractedText || extractedText.trim().length === 0) {
            extractedText = `[PDF Document: ${fileName} contains scanned images or non-extractable text without an OCR layer. Please verify if the PDF has selectable text.]`;
          }
        } catch (pdfErr: any) {
          console.error(`[Document Parser] PDF parse error for ${fileName}:`, pdfErr);
          extractedText = `[Could not parse PDF text: ${pdfErr?.message || "Unknown PDF parsing error"}]`;
        }
      }
      // 2. Word Documents (.docx)
      else if (
        fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileExt === "docx"
      ) {
        try {
          const mammoth = require("mammoth");
          const res = await mammoth.extractRawText({ buffer });
          extractedText = res.value || "";
        } catch (docxErr: any) {
          console.error(`[Document Parser] Docx parse error for ${fileName}:`, docxErr);
          extractedText = `[Could not parse Word document: ${docxErr?.message}]`;
        }
      }
      // 3. Plain Text, Code, CSV, TSV, Markdown, JSON, YAML, etc.
      else {
        try {
          extractedText = buffer.toString("utf-8");
        } catch (txtErr: any) {
          console.error(`[Document Parser] Text parse error for ${fileName}:`, txtErr);
          extractedText = `[Unsupported file format for ${fileName}]`;
        }
      }

      // Sanitize null bytes or problematic binary control characters that might corrupt JSON payloads
      extractedText = extractedText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

      // Safe truncate to avoid exceeding model context (200k characters max per document)
      const maxChars = 200000;
      let cleanContent = extractedText.trim();
      if (cleanContent.length > maxChars) {
        cleanContent =
          cleanContent.slice(0, maxChars) +
          `\n\n[... Truncated: Showing first ${maxChars.toLocaleString()} characters ...]`;
      }

      console.log(`[Document Parser] Successfully parsed ${fileName}: ${cleanContent.length} characters extracted`);

      parsedDocuments.push({
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: fileName,
        size: fileSize,
        type: fileType,
        content: cleanContent || `[Empty document: ${fileName}]`,
      });
    }

    return NextResponse.json({ documents: parsedDocuments });
  } catch (err: any) {
    console.error("[Document Parser] Fatal route error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to parse uploaded documents" },
      { status: 500 }
    );
  }
}
