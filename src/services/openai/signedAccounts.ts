import OpenAI from "openai";
import * as pdfjsLib from 'pdfjs-dist';
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Set up PDF.js worker to match library version
pdfjsLib.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface SignedAccountsResult {
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
    const scale = 2;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    const base64 = canvas.toDataURL('image/png').split(',')[1];
    images.push(base64);
  }

  return images;
}

// Build specialized prompt for Signed Accounts standardization
function getSignedAccountsPrompt(pageCount: number): string {
  return `You are a financial data specialist tasked with standardizing Signed Accounts data into a specific template format.

MISSION: Extract financial data from this ${pageCount}-page Signed Accounts document and map it to our standardized template structure. You must perform calculations and derive missing values to complete the template.

STANDARDIZED TEMPLATE STRUCTURE (you must return exactly this format):

{
  "documentType": "signed_accounts",
  "companyName": "Extract exact company name",
  "period": "Extract the period (e.g., 'Year ended 31 December 2024', etc.)",
  "currency": "GBP",
  "profitAndLoss": {
    "turnover": number,
    "costOfSales": number,
    "grossProfit": number,
    "grossProfitPercentage": number,
    "administrativeExpenses": number,
    "ebitda": number,
    "ebitdaPercentage": number,
    "operatingProfitLoss": number,
    "tax": number,
    "netProfitLoss": number,
    "dividendsPaid": number,
    "profitAfterTax": number
  },
  "balanceSheet": {
    "intangibleFixedAssets": number,
    "tangibleFixedAssets": number,
    "totalFixedAssets": number,
    "currentAssets": number,
    "currentLiabilities": number,
    "netCurrentAssets": number,
    "totalAssetsLessCurrentLiabilities": number,
    "nonCurrentLiabilities": number,
    "netAssets": number,
    "shareCapital": number,
    "profitAndLossAccount": number,
    "totalShareholdersFunds": number
  },
  "previousYear": {
    "profitAndLoss": {
      "turnover": number,
      "costOfSales": number,
      "grossProfit": number,
      "grossProfitPercentage": number,
      "administrativeExpenses": number,
      "ebitda": number,
      "ebitdaPercentage": number,
      "operatingProfitLoss": number,
      "tax": number,
      "netProfitLoss": number,
      "dividendsPaid": number,
      "profitAfterTax": number
    },
    "balanceSheet": {
      "intangibleFixedAssets": number,
      "tangibleFixedAssets": number,
      "totalFixedAssets": number,
      "currentAssets": number,
      "currentLiabilities": number,
      "netCurrentAssets": number,
      "totalAssetsLessCurrentLiabilities": number,
      "nonCurrentLiabilities": number,
      "netAssets": number,
      "shareCapital": number,
      "profitAndLossAccount": number,
      "totalShareholdersFunds": number
    }
  },
  "calculations": {
    "grossProfitCalculation": "turnover - costOfSales",
    "grossProfitPercentageCalculation": "(grossProfit / turnover) * 100",
    "ebitdaCalculation": "grossProfit - administrativeExpenses",
    "ebitdaPercentageCalculation": "(ebitda / turnover) * 100", 
    "netCurrentAssetsCalculation": "currentAssets - currentLiabilities",
    "totalFixedAssetsCalculation": "intangibleFixedAssets + tangibleFixedAssets",
    "totalAssetsLessCurrentLiabilitiesCalculation": "totalFixedAssets + netCurrentAssets",
    "netAssetsCalculation": "totalAssetsLessCurrentLiabilities - nonCurrentLiabilities",
    "totalShareholdersFundsCalculation": "shareCapital + profitAndLossAccount"
  }
}

CRITICAL EXTRACTION AND CALCULATION RULES:

1. EXTRACT COMPARATIVE DATA:
   - Signed accounts typically show current year and previous year figures
   - Extract BOTH years' data - current year (most recent) and previous year
   - If only one year is shown, use 0 for missing year data

2. EXTRACT PRIMARY DATA FIRST:
   - Find Turnover/Revenue/Sales figures for both years
   - Find Cost of Sales/Cost of Goods Sold for both years
   - Find Administrative/Operating Expenses for both years
   - Find Tax provisions for both years
   - Find Dividend payments for both years
   - Find all Balance Sheet asset and liability figures for both years

3. PERFORM REQUIRED CALCULATIONS FOR BOTH YEARS:
   - Gross Profit = Turnover - Cost of Sales
   - GP% = (Gross Profit / Turnover) × 100
   - EBITDA = Gross Profit - Administrative Expenses  
   - EBITDA% = (EBITDA / Turnover) × 100
   - Operating Profit = EBITDA (unless depreciation/amortization is shown separately)
   - Net Profit = Operating Profit - Tax
   - Profit After Tax = Net Profit - Dividends Paid
   - Net Current Assets = Current Assets - Current Liabilities
   - Total Fixed Assets = Intangible + Tangible Fixed Assets
   - Total Assets Less Current Liabilities = Total Fixed Assets + Net Current Assets
   - Net Assets = Total Assets Less Current Liabilities - Non Current Liabilities
   - Total Shareholders Funds = Share Capital + Profit and Loss Account

4. MAPPING RULES:
   - Map similar terms to our standard fields (e.g., "Revenue" → turnover, "COGS" → costOfSales)
   - For statutory accounts, look for standard UK accounting format
   - Map "Less: Administrative expenses" → administrativeExpenses
   - Map "Profit before taxation" → operatingProfitLoss
   - If a field is missing, calculate it from available data where possible
   - Use 0 for fields that cannot be found or calculated
   - Ensure mathematical relationships are maintained for both years

5. DATA VALIDATION:
   - Gross Profit should equal Turnover - Cost of Sales for both years
   - Balance Sheet should balance: Total Assets = Total Liabilities + Equity for both years
   - All percentages should be calculated correctly for both years
   - Use negative numbers for expenses and losses
   - Ensure previous year data matches if comparative figures are provided

6. EXTRACTION PRIORITY:
   - Focus on statutory P&L and Balance Sheet sections
   - Extract actual figures, not notes or supplementary information
   - Prefer detailed breakdowns over summary figures
   - Look for "Profit and Loss Account" and "Balance Sheet" headers

RETURN ONLY THE JSON STRUCTURE ABOVE - no additional text or explanation.`;
}

export async function analyzeSignedAccounts(
  file: File
): Promise<SignedAccountsResult> {
  const openaiClient = new OpenAI({
    apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
    dangerouslyAllowBrowser: true,
  });
  
  let pageCount = 1;

  const messages: ChatCompletionMessageParam[] = [
    { 
      role: 'system', 
      content: 'You are a financial data extraction and standardization expert specializing in UK statutory accounts. Your mission is to extract financial data from Signed Accounts documents and map it to a standardized template structure with comparative figures. Always perform the required calculations and return data in the exact JSON format specified.' 
    }
  ];
  
  if (file.type === 'application/pdf') {
    const images = await convertPDFToImages(file);
    pageCount = images.length;
    
    let content: ({ type: "text"; text: string; } | { type: "image_url"; image_url: { url: string; detail: "auto" | "low" | "high"; }; })[] = [];
    
    // Add the prompt as text content
    content.push({ 
      type: 'text', 
      text: getSignedAccountsPrompt(pageCount) 
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
    
    messages.push({ 
      role: 'user', 
      content: content 
    });
  } else if (file.type.startsWith('image/')) {
    const buf = await file.arrayBuffer();
    const b64 = arrayBufferToBase64(buf);
    
    const content: ({ type: "text"; text: string; } | { type: "image_url"; image_url: { url: string; detail: "auto" | "low" | "high"; }; })[] = [
      { 
        type: 'text', 
        text: getSignedAccountsPrompt(1) 
      },
      { 
        type: 'image_url', 
        image_url: { 
          url: `data:${file.type};base64,${b64}`, 
          detail: 'high' 
        } 
      }
    ];
    
    messages.push({ 
      role: 'user', 
      content: content 
    });
  } else {
    throw new Error('Unsupported file type for Signed Accounts analysis');
  }
  
  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o',
    messages,
    temperature: 0.1,
    max_tokens: 6000,
  });
  
  const content = completion.choices[0].message.content;
  if (!content) throw new Error('Empty OpenAI response');
  
  console.log('Signed Accounts OpenAI response:', content);
  
  // Parse JSON from response
  let parsed;
  try {
    parsed = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    console.log('Successfully parsed Signed Accounts response:', parsed);
  } catch (e) {
    console.log('Initial JSON parse failed for Signed Accounts, attempting to clean:', e);
    
    // Extract JSON block from response
    const jsonMatch = (content as string).match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in Signed Accounts response');
    }
    
    let jsonStr = jsonMatch[0];
    
    try {
      parsed = JSON.parse(jsonStr);
      console.log('Successfully parsed cleaned Signed Accounts JSON');
    } catch (secondError) {
      console.error('Failed to parse Signed Accounts JSON after cleanup:', secondError);
      throw new Error(`Failed to parse Signed Accounts JSON: ${secondError}`);
    }
  }
  
  // Validate that we have the expected structure
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Signed Accounts returned invalid data structure');
  }
  
  // Ensure we have the required structure
  if (!parsed.profitAndLoss && !parsed.balanceSheet) {
    throw new Error('Signed Accounts response missing required profitAndLoss or balanceSheet data');
  }
  
  // Perform validation and calculations for current year
  if (parsed.profitAndLoss) {
    const pl = parsed.profitAndLoss;
    
    // Validate/calculate Gross Profit
    if (pl.turnover && pl.costOfSales && !pl.grossProfit) {
      pl.grossProfit = pl.turnover - pl.costOfSales;
    }
    
    // Validate/calculate GP%
    if (pl.turnover && pl.grossProfit && !pl.grossProfitPercentage) {
      pl.grossProfitPercentage = Math.round((pl.grossProfit / pl.turnover) * 100 * 100) / 100;
    }
    
    // Validate/calculate EBITDA
    if (pl.grossProfit && pl.administrativeExpenses && !pl.ebitda) {
      pl.ebitda = pl.grossProfit - pl.administrativeExpenses;
    }
    
    // Validate/calculate EBITDA%
    if (pl.turnover && pl.ebitda && !pl.ebitdaPercentage) {
      pl.ebitdaPercentage = Math.round((pl.ebitda / pl.turnover) * 100 * 100) / 100;
    }
    
    // Validate/calculate Profit After Tax
    if (pl.netProfitLoss && pl.dividendsPaid && !pl.profitAfterTax) {
      pl.profitAfterTax = pl.netProfitLoss - pl.dividendsPaid;
    }
  }
  
  if (parsed.balanceSheet) {
    const bs = parsed.balanceSheet;
    
    // Validate/calculate Total Fixed Assets
    if (bs.intangibleFixedAssets !== undefined && bs.tangibleFixedAssets !== undefined && !bs.totalFixedAssets) {
      bs.totalFixedAssets = bs.intangibleFixedAssets + bs.tangibleFixedAssets;
    }
    
    // Validate/calculate Net Current Assets
    if (bs.currentAssets && bs.currentLiabilities && !bs.netCurrentAssets) {
      bs.netCurrentAssets = bs.currentAssets - bs.currentLiabilities;
    }
    
    // Validate/calculate Total Assets Less Current Liabilities
    if (bs.totalFixedAssets !== undefined && bs.netCurrentAssets !== undefined && !bs.totalAssetsLessCurrentLiabilities) {
      bs.totalAssetsLessCurrentLiabilities = bs.totalFixedAssets + bs.netCurrentAssets;
    }
    
    // Validate/calculate Net Assets
    if (bs.totalAssetsLessCurrentLiabilities && bs.nonCurrentLiabilities && !bs.netAssets) {
      bs.netAssets = bs.totalAssetsLessCurrentLiabilities - bs.nonCurrentLiabilities;
    }
    
    // Validate/calculate Total Shareholders Funds
    if (bs.shareCapital !== undefined && bs.profitAndLossAccount !== undefined && !bs.totalShareholdersFunds) {
      bs.totalShareholdersFunds = bs.shareCapital + bs.profitAndLossAccount;
    }
  }
  
  // Perform validation and calculations for previous year if it exists
  if (parsed.previousYear) {
    if (parsed.previousYear.profitAndLoss) {
      const plPrev = parsed.previousYear.profitAndLoss;
      
      // Validate/calculate Gross Profit for previous year
      if (plPrev.turnover && plPrev.costOfSales && !plPrev.grossProfit) {
        plPrev.grossProfit = plPrev.turnover - plPrev.costOfSales;
      }
      
      // Validate/calculate GP% for previous year
      if (plPrev.turnover && plPrev.grossProfit && !plPrev.grossProfitPercentage) {
        plPrev.grossProfitPercentage = Math.round((plPrev.grossProfit / plPrev.turnover) * 100 * 100) / 100;
      }
      
      // Validate/calculate EBITDA for previous year
      if (plPrev.grossProfit && plPrev.administrativeExpenses && !plPrev.ebitda) {
        plPrev.ebitda = plPrev.grossProfit - plPrev.administrativeExpenses;
      }
      
      // Validate/calculate EBITDA% for previous year
      if (plPrev.turnover && plPrev.ebitda && !plPrev.ebitdaPercentage) {
        plPrev.ebitdaPercentage = Math.round((plPrev.ebitda / plPrev.turnover) * 100 * 100) / 100;
      }
      
      // Validate/calculate Profit After Tax for previous year
      if (plPrev.netProfitLoss && plPrev.dividendsPaid && !plPrev.profitAfterTax) {
        plPrev.profitAfterTax = plPrev.netProfitLoss - plPrev.dividendsPaid;
      }
    }
    
    if (parsed.previousYear.balanceSheet) {
      const bsPrev = parsed.previousYear.balanceSheet;
      
      // Validate/calculate Total Fixed Assets for previous year
      if (bsPrev.intangibleFixedAssets !== undefined && bsPrev.tangibleFixedAssets !== undefined && !bsPrev.totalFixedAssets) {
        bsPrev.totalFixedAssets = bsPrev.intangibleFixedAssets + bsPrev.tangibleFixedAssets;
      }
      
      // Validate/calculate Net Current Assets for previous year
      if (bsPrev.currentAssets && bsPrev.currentLiabilities && !bsPrev.netCurrentAssets) {
        bsPrev.netCurrentAssets = bsPrev.currentAssets - bsPrev.currentLiabilities;
      }
      
      // Validate/calculate Total Assets Less Current Liabilities for previous year
      if (bsPrev.totalFixedAssets !== undefined && bsPrev.netCurrentAssets !== undefined && !bsPrev.totalAssetsLessCurrentLiabilities) {
        bsPrev.totalAssetsLessCurrentLiabilities = bsPrev.totalFixedAssets + bsPrev.netCurrentAssets;
      }
      
      // Validate/calculate Net Assets for previous year
      if (bsPrev.totalAssetsLessCurrentLiabilities && bsPrev.nonCurrentLiabilities && !bsPrev.netAssets) {
        bsPrev.netAssets = bsPrev.totalAssetsLessCurrentLiabilities - bsPrev.nonCurrentLiabilities;
      }
      
      // Validate/calculate Total Shareholders Funds for previous year
      if (bsPrev.shareCapital !== undefined && bsPrev.profitAndLossAccount !== undefined && !bsPrev.totalShareholdersFunds) {
        bsPrev.totalShareholdersFunds = bsPrev.shareCapital + bsPrev.profitAndLossAccount;
      }
    }
  }
  
  console.log('Final Signed Accounts parsed result:', parsed);
  
  // Generate summary
  const summary = generateSignedAccountsSummary(parsed);
  
  return { 
    json: { 
      fileName: file.name, 
      pages: pageCount, 
      ...parsed 
    }, 
    summary 
  };
}

function generateSignedAccountsSummary(data: any): string {
  const pl = data.profitAndLoss || {};
  const bs = data.balanceSheet || {};
  const plPrev = data.previousYear?.profitAndLoss || {};
  
  let summary = `Signed Accounts processed for ${data.companyName || 'the business'}`;
  
  if (data.period) {
    summary += ` for period: ${data.period}`;
  }
  
  summary += '. ';
  
  if (pl.turnover) {
    summary += `Current year revenue of £${pl.turnover.toLocaleString()}`;
    
    if (plPrev.turnover) {
      const growth = ((pl.turnover - plPrev.turnover) / plPrev.turnover) * 100;
      summary += ` (${growth > 0 ? '+' : ''}${growth.toFixed(1)}% vs previous year)`;
    }
    
    if (pl.grossProfit) {
      summary += ` with gross profit of £${pl.grossProfit.toLocaleString()}`;
      if (pl.grossProfitPercentage) {
        summary += ` (${pl.grossProfitPercentage}% margin)`;
      }
    }
    
    if (pl.ebitda) {
      summary += `. EBITDA of £${pl.ebitda.toLocaleString()}`;
      if (pl.ebitdaPercentage) {
        summary += ` (${pl.ebitdaPercentage}% of revenue)`;
      }
    }
    
    if (pl.netProfitLoss) {
      summary += `. Net profit of £${pl.netProfitLoss.toLocaleString()}`;
    }
  }
  
  if (bs.totalFixedAssets || bs.currentAssets) {
    summary += '. Balance sheet shows';
    
    if (bs.totalFixedAssets) {
      summary += ` fixed assets of £${bs.totalFixedAssets.toLocaleString()}`;
    }
    
    if (bs.currentAssets) {
      summary += ` and current assets of £${bs.currentAssets.toLocaleString()}`;
    }
    
    if (bs.netAssets) {
      summary += `. Net assets total £${bs.netAssets.toLocaleString()}`;
    }
  }
  
  summary += '.';
  
  return summary;
}
