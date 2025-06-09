import OpenAI from "openai";
import * as pdfjsLib from 'pdfjs-dist';

// Set up PDF.js worker - use the same version as the library
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Simple interface for results
export interface OpenAIExtractResult {
  json: any;
  summary: string;
}

// Safe base64 conversion for large files
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 1024; // Process in smaller chunks to avoid stack overflow
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// Check if file is an image
function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

// Check if file is a PDF
function isPdfFile(file: File): boolean {
  return file.type === 'application/pdf';
}

// Convert PDF to images (all pages)
async function pdfToImages(file: File): Promise<string[]> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = pdf.numPages;
    const images: string[] = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        throw new Error('Could not get canvas context');
      }
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport,
      }).promise;
      
      // Convert canvas to base64 image (without data URL prefix)
      const base64Image = canvas.toDataURL('image/png').split(',')[1];
      images.push(base64Image);
    }
    
    return images;
  } catch (error) {
    console.error('PDF conversion error:', error);
    throw new Error('Failed to convert PDF to images: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Single simple function to analyze any document
export async function analyzeDocumentWithVision({
  file,
  docType,
}: {
  file: File;
  docType: string;
}): Promise<OpenAIExtractResult> {
  
  // Create OpenAI client
  const openaiClient = new OpenAI({
    apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  try {
    let content: any[] = [];
    let pageCount = 1;
    
    if (isPdfFile(file)) {
      // Convert all PDF pages to images
      const base64Images = await pdfToImages(file);
      pageCount = base64Images.length;
      
      // Try multi-page approach first
      try {
        return await analyzeMultiplePages(openaiClient, base64Images, docType, pageCount);
      } catch (error) {
        console.log("Multi-page analysis failed, trying page-by-page approach:", error);
        // Fallback to page-by-page analysis
        return await analyzePageByPage(openaiClient, base64Images, docType, pageCount);
      }
      
    } else if (isImageFile(file)) {
      // Convert single image file to base64 safely
      const fileBuffer = await file.arrayBuffer();
      const base64File = arrayBufferToBase64(fileBuffer);
      
      content = [
        {
          type: "text",
          text: `Analyze this ${docType} document and provide a comprehensive summary of the key information you can see, including any financial figures, dates, and important details.`
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${file.type};base64,${base64File}`,
            detail: "high"
          }
        }
      ];
      
    } else {
      // Unsupported file type
      return {
        json: { 
          documentType: docType, 
          fileName: file.name,
          fileType: file.type,
          error: "Unsupported file type. Only PDF and image files are supported." 
        },
        summary: `Unable to analyze ${file.name} (${file.type}). Only PDF and image files (JPEG, PNG, etc.) are supported. Please upload a PDF or image file.`
      };
    }

    // For single images, proceed with original logic
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system",
          content: "You are a financial document analyst. Analyze the provided document thoroughly and provide comprehensive summaries."
        },
        { 
          role: "user", 
          content: content
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });
    
    const responseContent = completion.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from OpenAI");
    }
    
    // Return comprehensive result
    return {
      json: { 
        documentType: docType, 
        content: responseContent, 
        fileName: file.name,
        pages: pageCount
      },
      summary: responseContent
    };
    
  } catch (error) {
    console.error("OpenAI analysis error:", error);
    throw new Error("Failed to analyze document: " + (error instanceof Error ? error.message : String(error)));
  }
}

// Get document-specific extraction prompts
function getDocumentSpecificPrompt(docType: string, pageCount: number): string {
  const baseInstruction = `You are analyzing a complete ${docType} document that contains ${pageCount} pages. I am providing you with images of ALL ${pageCount} pages of this document. IMPORTANT: You must analyze EVERY single page I'm providing.`;
  
  switch (docType.toLowerCase()) {
    case 'profit and loss':
    case 'profit & loss':
    case 'p&l':
      return `${baseInstruction}

Extract the Profit and Loss data from this document. Format it exactly like a standard P&L statement with proper line items and structure. Return the data in JSON format with this EXACT structure:

{
  "companyName": "Company Name",
  "statementTitle": "Profit and Loss Account for the Year Ended [Date]",
  "period": "Year ended date",
  "columns": ["Item", "Note", "Current Year", "Previous Year"],
  "lineItems": [
    {
      "item": "Turnover",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "revenue"
    },
    {
      "item": "Cost of sales",
      "note": "",
      "currentYear": -amount,
      "previousYear": -amount,
      "category": "cost"
    },
    {
      "item": "Gross profit",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "subtotal",
      "calculated": true
    },
    {
      "item": "Administrative expenses",
      "note": "",
      "currentYear": -amount,
      "previousYear": -amount,
      "category": "expense"
    },
    {
      "item": "Operating profit",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "subtotal",
      "calculated": true
    },
    {
      "item": "Profit before tax",
      "note": "4",
      "currentYear": amount,
      "previousYear": amount,
      "category": "subtotal"
    },
    {
      "item": "Taxation",
      "note": "",
      "currentYear": -amount,
      "previousYear": amount,
      "category": "tax"
    },
    {
      "item": "Profit for the financial year",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "total",
      "isTotal": true
    }
  ],
  "notes": [
    "The above results were derived from continuing operations.",
    "The company has no recognised gains or losses for the year other than the results above."
  ]
}

Extract ALL line items exactly as they appear, including subtotals and calculations. Use negative amounts for expenses and costs. Include any notes or references. Preserve the exact terminology and structure.`;

    case 'balance sheet':
      return `${baseInstruction}

Extract the Balance Sheet data from this document. Format it exactly like a standard balance sheet statement with proper line items and structure. Return the data in JSON format with this EXACT structure:

{
  "companyName": "Company Name",
  "statementTitle": "Balance Sheet as at [Date]",
  "period": "As at specific date",
  "columns": ["Item", "Note", "Current Year", "Previous Year"],
  "lineItems": [
    {
      "item": "FIXED ASSETS",
      "note": "",
      "currentYear": 0,
      "previousYear": 0,
      "category": "header"
    },
    {
      "item": "Tangible assets",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "fixed-asset"
    },
    {
      "item": "CURRENT ASSETS",
      "note": "",
      "currentYear": 0,
      "previousYear": 0,
      "category": "header"
    },
    {
      "item": "Debtors",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "current-asset"
    },
    {
      "item": "Cash at bank and in hand",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "current-asset"
    },
    {
      "item": "TOTAL CURRENT ASSETS",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "subtotal"
    },
    {
      "item": "CREDITORS: Amounts falling due within one year",
      "note": "",
      "currentYear": -amount,
      "previousYear": -amount,
      "category": "current-liability"
    },
    {
      "item": "NET CURRENT ASSETS",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "subtotal"
    },
    {
      "item": "TOTAL ASSETS LESS CURRENT LIABILITIES",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "subtotal"
    },
    {
      "item": "CREDITORS: Amounts falling due after more than one year",
      "note": "",
      "currentYear": -amount,
      "previousYear": -amount,
      "category": "non-current-liability"
    },
    {
      "item": "NET ASSETS",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "total"
    },
    {
      "item": "CAPITAL AND RESERVES",
      "note": "",
      "currentYear": 0,
      "previousYear": 0,
      "category": "header"
    },
    {
      "item": "Called up share capital",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "equity"
    },
    {
      "item": "Profit and loss account",
      "note": "",
      "currentYear": amount,
      "previousYear": amount,
      "category": "equity"
    },
    {
      "item": "SHAREHOLDERS' FUNDS",
      "note": "",
      "currentYear": amount, 
      "previousYear": amount,
      "category": "total",
      "isTotal": true
    }
  ],
  "notes": []
}

Extract ALL line items exactly as they appear, including subtotals and calculations. Use negative amounts for liabilities. Include any notes or references. Preserve the exact terminology and structure.`;

    case 'trial balance':
      return `${baseInstruction}

Extract ONLY the Trial Balance data from this document. Return the data in JSON format with the following structure:

{
  "trialBalance": {
    "accounts": [
      {
        "accountName": "name",
        "debit": amount or 0,
        "credit": amount or 0
      }
    ],
    "totalDebits": amount,
    "totalCredits": amount,
    "period": "time period covered"
  }
}

Extract only account names, debit amounts, credit amounts, and totals. Ignore any other information.`;

    case 'aged payables':
    case 'aged payables report':
      return `${baseInstruction}

Extract ONLY the Aged Payables data from this document. Return the data in JSON format with the following structure:

{
  "agedPayables": {
    "suppliers": [
      {
        "supplierName": "name",
        "current": amount,
        "30days": amount,
        "60days": amount,
        "90days": amount,
        "over90days": amount,
        "total": amount
      }
    ],
    "totals": {
      "current": amount,
      "30days": amount,
      "60days": amount,
      "90days": amount,
      "over90days": amount,
      "grandTotal": amount
    },
    "asOfDate": "date of the report"
  }
}

Extract only supplier names, aging amounts, and totals. Ignore any other information.`;

    case 'aged receivables':
    case 'aged receivables report':
      return `${baseInstruction}

Extract ONLY the Aged Receivables data from this document. Return the data in JSON format with the following structure:

{
  "agedReceivables": {
    "customers": [
      {
        "customerName": "name",
        "current": amount,
        "30days": amount,
        "60days": amount,
        "90days": amount,
        "over90days": amount,
        "total": amount
      }
    ],
    "totals": {
      "current": amount,
      "30days": amount,
      "60days": amount,
      "90days": amount,
      "over90days": amount,
      "grandTotal": amount
    },
    "asOfDate": "date of the report"
  }
}

Extract only customer names, aging amounts, and totals. Ignore any other information.`;

    default:
      return `${baseInstruction}

Extract the key financial data from this ${docType} document. Focus on:
1. Financial figures and amounts
2. Account names and categories
3. Dates and periods
4. Totals and subtotals

Return the data in a structured JSON format appropriate for the document type. Extract only financial information, ignore descriptive text and general content.`;
  }
}

// Multi-page analysis function
async function analyzeMultiplePages(
  openaiClient: OpenAI, 
  base64Images: string[], 
  docType: string, 
  pageCount: number
): Promise<OpenAIExtractResult> {
  const content: any[] = [];
  
  // Get specific prompt based on document type
  const specificPrompt = getDocumentSpecificPrompt(docType, pageCount);
  
  content.push({
    type: "text",
    text: specificPrompt
  });
  
  // Add all page images with page labels
  base64Images.forEach((base64Image, index) => {
    content.push({
      type: "text",
      text: `--- PAGE ${index + 1} of ${pageCount} ---`
    });
    content.push({
      type: "image_url",
      image_url: {
        url: `data:image/png;base64,${base64Image}`,
        detail: "high"
      }
    });
  });

  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { 
        role: "system",
        content: "You are a financial data extraction specialist. When presented with financial documents, extract only the specific financial data requested in structured JSON format. Focus on numbers, account names, and financial figures. Ignore descriptive text and general content."
      },
      { 
        role: "user", 
        content: content
      },
    ],
    temperature: 0.1,
    max_tokens: 4000,
  });
  
  const responseContent = completion.choices[0].message.content;
  if (!responseContent) {
    throw new Error("Empty response from OpenAI");
  }
  
  return {
    json: { 
      documentType: docType, 
      content: responseContent, 
      fileName: "multi-page-document",
      pages: pageCount,
      analysisMethod: "multi-page"
    },
    summary: responseContent
  };
}

// Page-by-page analysis function (fallback)
async function analyzePageByPage(
  openaiClient: OpenAI, 
  base64Images: string[], 
  docType: string, 
  pageCount: number
): Promise<OpenAIExtractResult> {
  const pageAnalyses: string[] = [];
  
  // Get specific prompt for this document type
  const basePrompt = getDocumentSpecificPrompt(docType, 1).replace(`${pageCount} pages`, '1 page');
  
  // Analyze each page individually
  for (let i = 0; i < base64Images.length; i++) {
    const pageNum = i + 1;
    const base64Image = base64Images[i];
    
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system",
          content: `You are a financial data extraction specialist. Extract only the specific financial data requested. Return data in JSON format.`
        },
        { 
          role: "user", 
          content: [
            {
              type: "text",
              text: `Page ${pageNum} of ${pageCount}: ${basePrompt}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        },
      ],
      temperature: 0.1,
      max_tokens: 2000,
    });
    
    const pageContent = completion.choices[0].message.content;
    if (pageContent) {
      pageAnalyses.push(`**Page ${pageNum} Data:**\n${pageContent}\n`);
    }
  }
  
  // For financial documents, try to merge the JSON data from all pages
  const mergedData = await mergeFinancialData(openaiClient, pageAnalyses, docType);
  
  return {
    json: { 
      documentType: docType, 
      content: mergedData, 
      fileName: "multi-page-document",
      pages: pageCount,
      analysisMethod: "page-by-page",
      pageAnalyses: pageAnalyses
    },
    summary: mergedData
  };
}

// Merge financial data from multiple pages
async function mergeFinancialData(
  openaiClient: OpenAI,
  pageAnalyses: string[],
  docType: string
): Promise<string> {
  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a financial data consolidation specialist. Merge JSON data from multiple pages of a ${docType} document into a single, complete JSON structure.`
        },
        {
          role: "user",
          content: `Merge the following ${docType} data from multiple pages into a single comprehensive JSON structure. Remove duplicates and combine related items:

${pageAnalyses.join('\n\n')}

Return only the final merged JSON structure with all data consolidated.`
        }
      ],
      temperature: 0.1,
      max_tokens: 3000,
    });

    return completion.choices[0].message.content || pageAnalyses.join('\n');
  } catch (error) {
    console.log("Failed to merge data, returning combined analyses:", error);
    return pageAnalyses.join('\n');
  }
}
