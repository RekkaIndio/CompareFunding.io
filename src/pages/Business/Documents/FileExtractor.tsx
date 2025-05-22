import React from "react";

export type ExtractedFile = {
  name: string;
  type: string;
  content: string; // extracted text
  file: File;
};

export interface FileExtractorProps {
  accept?: string;
  onExtracted: (result: ExtractedFile) => void;
  children?: React.ReactNode;
  className?: string;
}

// Utility: extract text from file (PDF, CSV, TXT, DOCX, XLSX, etc.)
async function extractTextFromFile(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'txt') {
    return await file.text();
  }
  if (ext === 'csv') {
    const text = await file.text();
    return text;
  }
  if (ext === 'pdf') {
    // Lazy load pdfjs
    const pdfjsLib = await import('pdfjs-dist');
    // Use new URL to get worker path for Vite compatibility
    const workerSrc = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).toString();
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = workerSrc;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await (pdfjsLib as any).getDocument({ data: arrayBuffer }).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return text;
  }
  // Fallback: try to read as text
  return await file.text();
}

const FileExtractor: React.FC<FileExtractorProps> = ({ accept, onExtracted, children, className }) => {
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await extractTextFromFile(file);
    onExtracted({ name: file.name, type: file.type, content, file });
  };

  return (
    <label className={className || "block"}>
      <input
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      {children}
    </label>
  );
};

export default FileExtractor;
