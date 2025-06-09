import OpenAI, { OpenAIError } from "openai";
import * as pdfjsLib from 'pdfjs-dist';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Set up PDF.js worker to match library version
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface FinancialDataResult {
  json: any;
  summary: string;
}

// Convert ArrayBuffer to Base64 safely in chunks
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 1024;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  return btoa(binary);
}

// Convert PDF pages to Base64 images
async function convertPDFToImages(file: File): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images: string[] = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    if (!ctx) throw new Error('Canvas context error');
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push(canvas.toDataURL('image/png').split(',')[1]);
  }
  return images;
}

// Build a flexible extraction prompt that adapts to different financial document structures
function getPrompt(pageCount: number): string {
  return `You are a financial data extraction specialist analyzing a ${pageCount}-page financial document. 

IMPORTANT: Extract ALL financial data from EVERY page. Many financial documents contain BOTH Profit & Loss AND Balance Sheet statements. Analyze all pages and extract both sections when present.

Your response should be a JSON object that can handle multiple financial statements:

FOR DOCUMENTS WITH BOTH P&L AND BALANCE SHEET:
{
  "documentType": "mixed_financial", // Use this when both P&L and Balance Sheet are present
  "companyName": "Exact company name from document",
  "statementTitle": "Annual Report and Unaudited Financial Statements" // or similar overall title
  "period": "Year ended 31 August 2023", // or equivalent period
  "currency": "GBP",
  "profitAndLoss": {
    "statementTitle": "Profit and Loss Account for the Year Ended...",
    "columns": ["item", "note", "2023", "2022"], // Actual column headers
    "lineItems": [
      {
        "item": "Turnover",
        "note": "",
        "2023": 9860854,
        "2022": 5978396,
        "category": "revenue"
      },
      {
        "item": "Cost of sales", 
        "note": "",
        "2023": -7622268,
        "2022": -4482232,
        "category": "expense"
      }
      // ... more P&L line items
    ],
    "notes": ["Footnotes specific to P&L"]
  },
  "balanceSheet": {
    "statementTitle": "Balance Sheet as at 31 August 2023",
    "columns": ["item", "note", "2023", "2022"],
    "lineItems": [
      {
        "item": "FIXED ASSETS",
        "note": "",
        "2023": 0,
        "2022": 0,
        "category": "header"
      },
      {
        "item": "Intangible assets",
        "note": "5",
        "2023": 47173,
        "2022": 47173,
        "category": "asset"
      }
      // ... more Balance Sheet line items
    ],
    "notes": ["Footnotes specific to Balance Sheet"]
  },
  "notes": ["General document notes"]
}

FOR SINGLE STATEMENT DOCUMENTS (keep existing format):
{
  "documentType": "profit_and_loss" | "balance_sheet" | "trial_balance" | "other",
  "companyName": "Exact company name from document",
  "statementTitle": "Exact title from document",
  "period": "Exact period from document", 
  "currency": "GBP",
  "columns": ["item", "note", "2023", "2022"], // Dynamic column names as they appear
  "lineItems": [
    {
      "item": "Exact line item name",
      "note": "Note reference if any",
      "2023": 1234567,  // Use actual column names from document
      "2022": 987654,   // Use actual years/periods found
      "category": "revenue" | "expense" | "asset" | "liability" | "equity" | "header" | "subtotal" | "total",
      "isHeader": true, // if this is a section header
      "isSubtotal": true, // if this is a subtotal row
      "isTotal": true, // if this is a final total
      "level": 0 // indentation level for hierarchy
    }
  ],
  "notes": ["Any footnotes or additional notes"]
}

EXTRACTION RULES:
1. SCAN ALL PAGES - Look for both Profit & Loss AND Balance Sheet sections
2. If you find both P&L and Balance Sheet, use the "mixed_financial" format with separate sections
3. Extract line items EXACTLY as written in the document
4. Use the ACTUAL column headers from the document (preserve exact year format)
5. Preserve all numerical values with correct signs:
   - Negative values for expenses, costs, liabilities (use parentheses notation like (7,622,268) = -7622268)
   - Positive values for revenues, assets, equity
6. Categorize line items accurately:
   - P&L: "revenue", "expense", "subtotal", "total", "header"
   - Balance Sheet: "asset", "liability", "equity", "subtotal", "total", "header"
7. Maintain document hierarchy (FIXED ASSETS, CURRENT ASSETS, etc.)
8. Include ALL notes and references exactly as shown
9. Extract exact company name and statement titles
10. Handle section headers that span all columns (like "FIXED ASSETS", "CURRENT ASSETS")

CRITICAL: If the document contains multiple financial statements, extract ALL of them. Don't stop after finding just one section.

JSON FORMATTING REQUIREMENTS:
- Use ONLY double quotes (") for strings, never single quotes
- All property names must be quoted
- No trailing commas
- Numbers should be numeric values, not strings (except for note references)
- Negative numbers should be negative values (-123), not parentheses
- Ensure all braces and brackets are properly closed

Return ONLY the JSON structure, no additional text. Ensure the JSON is valid and parseable.`;
}

export async function analyzeFinancialDocument(
  file: File
): Promise<FinancialDataResult> {
  const openaiClient = new OpenAI({
    apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  let pageCount = 1;

  const messages: ChatCompletionMessageParam[] = [
    { 
      role: 'system', 
      content: 'You extract full financial data in JSON format, focusing only on the tabular data. Ignore document headers, company names, and any text outside the main financial table.' 
    }
  ];
  
  if (file.type === 'application/pdf') {
    const images = await convertPDFToImages(file);
    pageCount = images.length;
    
    // The content must be an array for multimodal messages
    let content: ({ type: "text"; text: string; } | { type: "image_url"; image_url: { url: string; detail: "auto" | "low" | "high"; }; })[] = [];
    
    // Add the prompt as text content
    content.push({ 
      type: 'text', 
      text: getPrompt(pageCount) 
    });
    
    // Add each page as an image
    images.forEach((img, idx) => {
      content.push({ 
        type: 'text', 
        text: `--- PAGE ${idx + 1} of ${pageCount} ---` 
      });
      
      content.push({ 
        type: 'image_url', 
        image_url: { 
          url: `data:image/png;base64,${img}`, 
          detail: 'high' 
        } 
      });
    });
    
    // Add the content array to the messages
    messages.push({ 
      role: 'user', 
      content: content 
    });
  } else if (file.type.startsWith('image/')) {
    const buf = await file.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);
    
    // For image files, create the content array
    const content: ({ type: "text"; text: string; } | { type: "image_url"; image_url: { url: string; detail: "auto" | "low" | "high"; }; })[] = [
      { 
        type: 'text', 
        text: getPrompt(1) 
      },
      { 
        type: 'image_url', 
        image_url: { 
          url: `data:${file.type};base64,${b64}`, 
          detail: 'high' 
        } 
      }
    ];
    
    // Add the content array to the messages
    messages.push({ 
      role: 'user', 
      content: content 
    });
  } else {
    throw new Error('Unsupported file type');
  }
  
  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.1,
    max_tokens: 4000,
  });
  const content = completion.choices[0].message.content;
  if (!content) throw new Error('Empty OpenAI response');
  
  // Parse JSON from response with robust error handling
  let parsed;
  try {
    parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
  } catch (e) {
    console.log('Initial JSON parse failed, attempting to clean and retry:', e);
    console.log('Raw content:', content);
    
    // Extract JSON block from response
    const jsonMatch = (content as string).match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON structure found in OpenAI response');
    }
    
    let jsonStr = jsonMatch[0];
    console.log('Extracted JSON string:', jsonStr);
    
    // Apply multiple cleanup strategies
    jsonStr = cleanMalformedJSON(jsonStr);
    
    try {
      parsed = JSON.parse(jsonStr);
      console.log('Successfully parsed cleaned JSON');
    } catch (secondError) {
      console.error('Failed to parse even after cleanup:', secondError);
      console.log('Final JSON string:', jsonStr);
      
      // Last resort: try to extract key data manually
      parsed = extractDataManually(jsonStr);
      if (!parsed) {
        throw new Error(`Failed to parse JSON after all cleanup attempts: ${secondError}`);
      }
    }
  }
  
  return { json: { fileName: file.name, pages: pageCount, ...parsed }, summary: `Extracted financial data (${pageCount} pages)` };
}

// Helper function to clean malformed JSON from OpenAI
function cleanMalformedJSON(jsonStr: string): string {
  console.log('Cleaning malformed JSON...');
  
  // Remove any text before the first { and after the last }
  const startIndex = jsonStr.indexOf('{');
  const lastIndex = jsonStr.lastIndexOf('}');
  if (startIndex !== -1 && lastIndex !== -1) {
    jsonStr = jsonStr.substring(startIndex, lastIndex + 1);
  }
  
  // Fix common malformed JSON issues
  let cleaned = jsonStr
    // Fix unquoted property names (common OpenAI issue)
    .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":')
    // Fix single quotes to double quotes
    .replace(/'/g, '"')
    // Remove trailing commas before closing braces/brackets
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix missing commas between properties (basic case)
    .replace(/}(\s*)([a-zA-Z_$"])/g, '},$1$2')
    .replace(/](\s*)([a-zA-Z_$"])/g, '],$1$2')
    // Fix numbers with parentheses to negative numbers
    .replace(/:\s*\(([0-9,]+)\)/g, ': -$1')
    // Remove commas from numbers inside quotes
    .replace(/"([0-9,]+)"/g, (match, number) => {
      return number.replace(/,/g, '');
    });
  
  console.log('Cleaned JSON:', cleaned);
  return cleaned;
}

// Manual extraction as last resort
function extractDataManually(jsonStr: string): any | null {
  console.log('Attempting manual data extraction...');
  
  try {
    // Basic manual parsing for simple cases
    const result: any = {};
    
    // Extract company name
    const companyMatch = jsonStr.match(/"companyName"\s*:\s*"([^"]+)"/);
    if (companyMatch) result.companyName = companyMatch[1];
    
    // Extract document type
    const docTypeMatch = jsonStr.match(/"documentType"\s*:\s*"([^"]+)"/);
    if (docTypeMatch) result.documentType = docTypeMatch[1];
    
    // Extract period
    const periodMatch = jsonStr.match(/"period"\s*:\s*"([^"]+)"/);
    if (periodMatch) result.period = periodMatch[1];
    
    // Extract currency
    const currencyMatch = jsonStr.match(/"currency"\s*:\s*"([^"]+)"/);
    if (currencyMatch) result.currency = currencyMatch[1];
    
    // If we got some basic data, return it with empty line items
    if (result.companyName || result.documentType) {
      result.lineItems = [];
      result.columns = ["item"];
      result.notes = [];
      console.log('Manual extraction successful with basic data:', result);
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Manual extraction failed:', error);
    return null;
  }
}
