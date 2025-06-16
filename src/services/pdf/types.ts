import { PDFFont, PDFPage, PDFDocument } from 'pdf-lib';

export interface ApplicationPdfOptions {
  isLenderMatched: boolean;
  lenderName?: string;
  generatedDate?: Date;
}

export interface PdfFonts {
  helvetica: PDFFont;
  helveticaBold: PDFFont;
}

export interface PdfColors {
  primaryColor: any;
  accentColor: any;
}

export interface RenderResult {
  page: PDFPage;
  yPosition: number;
}

export interface PdfContext {
  page: PDFPage;
  yPosition: number;
  width: number;
  fonts: PdfFonts;
  colors: PdfColors;
  pdfDoc: PDFDocument;
}
