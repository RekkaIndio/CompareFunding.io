import OpenAI from "openai";

const openaiClient = new OpenAI({
  apiKey: import.meta.env.VITE_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface TrialBalanceResult {
  json: any;
  summary: string;
}

export async function analyzeTrialBalance(file: File): Promise<TrialBalanceResult> {
  const fileBuffer = await file.arrayBuffer();
  const base64File = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));
  
  const prompt = `Analyze this Trial Balance document and provide a summary of what you can see in the document.`;

  try {
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "user", 
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${file.type};base64,${base64File}`,
                detail: "high"
              }
            }
          ]
        },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });
    
    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }
    
    return {
      json: { documentType: "Trial Balance", content: content },
      summary: content
    };
    
  } catch (error) {
    console.error("OpenAI Trial Balance analysis error:", error);
    throw new Error("Failed to analyze Trial Balance: " + (error instanceof Error ? error.message : String(error)));
  }
}
