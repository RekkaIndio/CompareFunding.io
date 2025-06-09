import React from "react";

export type ExtractedFile = {
  name: string;
  type: string;
  content: string; // extracted text (empty for PDFs that will be processed directly)
  file: File;
  isPdfForDirectAnalysis?: boolean; // flag to indicate PDF should be sent directly to OpenAI
};

export interface FileExtractorProps {
  accept?: string;
  onExtracted: (result: ExtractedFile) => void;
  children?: React.ReactNode;
  className?: string;
}

// Utility: extract text from file (PDF, CSV, TXT, DOCX, XLSX, etc.)
async function extractTextFromFile(file: File): Promise<{ content: string; isPdfForDirectAnalysis?: boolean }> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  // For PDFs, we'll send them directly to OpenAI Vision API
  if (ext === 'pdf') {
    return {
      content: '', // Empty content for PDFs
      isPdfForDirectAnalysis: true
    };
  }
  
  if (ext === 'txt') {
    return { content: await file.text() };
  }
  if (ext === 'csv') {
    const text = await file.text();
    return { content: text };
  }
  
  // Fallback: try to read as text
  return { content: await file.text() };
}

const FileExtractor: React.FC<FileExtractorProps> = ({ accept, onExtracted, children, className }) => {
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await extractTextFromFile(file);
    onExtracted({ 
      name: file.name, 
      type: file.type, 
      content: result.content, 
      file,
      isPdfForDirectAnalysis: result.isPdfForDirectAnalysis 
    });
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
