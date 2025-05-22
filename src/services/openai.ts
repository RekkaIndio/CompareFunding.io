// --- OpenAI direct integration for extracting financials and summary ---
const OPENAI_API_KEY = import.meta.env.VITE_OPEN_AI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface OpenAIExtractResult {
  json: any;
  summary: string;
}

export async function extractFinancialsWithOpenAI({
  text,
  docType,
}: {
  text: string;
  docType: string;
}): Promise<OpenAIExtractResult> {
  // Enhanced prompt for OpenAI
  const prompt = `You are a financial data extraction assistant. Given the following ${docType} document text, extract only the financial figures as a JSON object (no business name, address, or identifying info). Then, provide a short summary paragraph of the financials.

For financial figures:
1. Organize data hierarchically by category (e.g., "revenue", "costs", "assets", "liabilities")
2. Use numerical values without currency symbols (£9,340.26 should be stored as 9340.26)
3. Use standardized naming conventions (camelCase or with_underscores)
4. Group related items (e.g., all types of revenue under a "revenue" object)

Document text:
"""${text.slice(0, 8000)}"""

Respond in this JSON format:
{
  "json": {
    // For Profit & Loss statements, include:
    "turnover": number,
    "revenue": { // Group revenue items
      "total": number,
      // Other revenue line items
    },
    "costs": { // Group cost items
      "costOfSales": number,
      "operatingExpenses": number,
      // Other expense categories
    },
    "profits": {
      "grossProfit": number,
      "operatingProfit": number,
      "netProfit": number
    },
    // Add other relevant financial metrics
    
    // For Balance Sheet statements, include:
    "assets": {
      "totalAssets": number,
      "currentAssets": { /* breakdown */ },
      "fixedAssets": { /* breakdown */ }
    },
    "liabilities": {
      "totalLiabilities": number,
      "currentLiabilities": { /* breakdown */ },
      "longTermLiabilities": { /* breakdown */ }
    },
    "equity": {
      "totalEquity": number,
      // Breakdown
    }
    
    // For Aged Receivables/Payables:
    "totalOutstanding": number,
    "currentAmount": number,
    "aging": {
      "days30": number,
      "days60": number,
      "days90": number,
      "days90Plus": number
    }
  },
  "summary": "A concise paragraph that highlights the key financial metrics and what they indicate about the business's performance or financial health."
}`;

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a helpful assistant for financial document analysis. Extract structured financial data from documents." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1, // Lower temperature for more consistent outputs
      max_tokens: 1500, // Increased token limit for more detailed responses
    }),
  });

  if (!response.ok) {
    console.error("OpenAI API error:", response.statusText);
    throw new Error("OpenAI API error: " + response.statusText);
  }

  const data = await response.json();
  
  // Try to parse the JSON from the response
  let result: OpenAIExtractResult = { json: null, summary: "" };
  try {
    const content = data.choices[0].message.content;
    // Try to parse as JSON
    const parsedContent = JSON.parse(content);
    
    // Extract summary and ensure it's a string
    let summaryText = "";
    if (parsedContent.summary && typeof parsedContent.summary === 'string') {
      // Direct string summary - exactly what we want
      summaryText = parsedContent.summary;
    } else {
      summaryText = "No summary available";
    }
    
    // Based on the example provided, we expect a clean structure with json and summary fields
    if (parsedContent.json) {
      // This is the expected case based on the example you provided
      result = {
        json: parsedContent.json,  // Direct reference to the JSON data
        summary: summaryText        // The extracted summary string
      };
      

    } else {
      // Fallback case - if there's no json property
      const cleanedContent = { ...parsedContent };
      
      // Remove the summary to avoid duplicating it in the JSON data
      if ('summary' in cleanedContent) {
        delete cleanedContent.summary;
      }
      
      result = {
        json: cleanedContent,
        summary: summaryText
      };
      

    }
    
    // Validate that we have the expected structure
    if (!result.json) {
      console.warn("OpenAI response missing json field:", result);
    }
  } catch (e) {
    console.error("Error parsing OpenAI response:", e);
    // fallback: just return the content as summary
    result.summary = data.choices?.[0]?.message?.content || "Failed to parse financial data.";
    
    // Try to extract JSON from the response using a regex approach
    try {
      const jsonMatch = data.choices[0].message.content.match(/\{\s*"json"\s*:\s*(\{.*\}),\s*"summary"\s*:/s);
      if (jsonMatch && jsonMatch[1]) {
        result.json = JSON.parse(jsonMatch[1]);
      }
    } catch (jsonError) {
      console.error("Failed to extract JSON using regex:", jsonError);
    }
  }
  
  return result;
}
