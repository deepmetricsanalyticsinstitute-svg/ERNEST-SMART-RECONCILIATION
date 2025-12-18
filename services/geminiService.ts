import { GoogleGenAI, Type } from "@google/genai";
import { ReconciliationResult, FileData } from "../types";

const SYSTEM_INSTRUCTION = `
RECONCILIATION ENGINE: Match Bank Statement transactions against General Ledger entries.
- Match by Amount (within 0.01 tolerance), Date (within +/- 5 days), and Description similarity.
- Return results in JSON format only.
- Use GHc (GHS) currency symbols.
- Normalize all dates to YYYY-MM-DD.
- Identical entries should be marked as 'matches'. 
- Entries present in only one document should be marked as 'unmatched'.
`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.OBJECT,
      properties: {
        totalMatches: { type: Type.INTEGER },
        totalUnmatchedBank: { type: Type.INTEGER },
        totalUnmatchedLedger: { type: Type.INTEGER },
        netDiscrepancy: { type: Type.NUMBER },
        matchedAmount: { type: Type.NUMBER },
        unmatchedBankAmount: { type: Type.NUMBER },
        unmatchedLedgerAmount: { type: Type.NUMBER },
        bankStatementBalance: { type: Type.NUMBER },
        ledgerBalance: { type: Type.NUMBER },
      },
      required: ["totalMatches", "totalUnmatchedBank", "totalUnmatchedLedger", "netDiscrepancy", "matchedAmount", "unmatchedBankAmount", "unmatchedLedgerAmount"],
    },
    matches: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          bankRef: { type: Type.STRING },
          ledgerRef: { type: Type.STRING },
          matchConfidence: { type: Type.NUMBER },
          notes: { type: Type.STRING },
        },
        required: ["date", "description", "amount"],
      },
    },
    unmatchedBank: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          ref: { type: Type.STRING },
        },
        required: ["date", "description", "amount"],
      },
    },
    unmatchedLedger: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          ref: { type: Type.STRING },
        },
        required: ["date", "description", "amount"],
      },
    },
  },
  required: ["summary", "matches", "unmatchedBank", "unmatchedLedger"],
};

export const reconcileDocuments = async (
  bankFile: FileData,
  ledgerFile: FileData
): Promise<ReconciliationResult> => {
  // Directly initialize the client using the mandatory environment variable access.
  // This is the most robust way to ensure environment variables work on platforms like Netlify.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];
  
  // Add Bank Statement data
  parts.push({ text: "BANK_STATEMENT_DOCUMENT_DATA:" });
  if (bankFile.type === 'pdf') {
    parts.push({ 
      inlineData: { 
        mimeType: "application/pdf", 
        data: bankFile.content.replace(/^data:application\/pdf;base64,/, "") 
      } 
    });
  } else {
    parts.push({ text: bankFile.content });
  }

  // Add Ledger data
  parts.push({ text: "GENERAL_LEDGER_DOCUMENT_DATA:" });
  if (ledgerFile.type === 'pdf') {
    parts.push({ 
      inlineData: { 
        mimeType: "application/pdf", 
        data: ledgerFile.content.replace(/^data:application\/pdf;base64,/, "") 
      } 
    });
  } else {
    parts.push({ text: ledgerFile.content });
  }

  // Use 'gemini-3-flash-preview' - optimized for efficiency and widely available on free tiers.
  const modelName = 'gemini-3-flash-preview';
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0, // Zero temperature for precise financial logic
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("The AI model returned an empty response. This might be due to a safety filter or temporary API issue.");
    }
    
    return JSON.parse(resultText) as ReconciliationResult;
  } catch (err: any) {
    console.error("Gemini API Invocation Error:", err);
    
    // Provide user-friendly errors for common failure modes on free tier / Netlify
    if (err.message?.includes("429") || err.message?.includes("quota")) {
      throw new Error("Free tier rate limit reached. Please wait a minute and try again.");
    }
    if (err.message?.includes("403") || err.message?.includes("key")) {
      throw new Error("API Key Authentication failed. Please ensure your environment variable is correctly configured in Netlify.");
    }
    if (err.message?.includes("404")) {
      throw new Error("The requested model was not found. Your API key might not have access to 'gemini-3-flash-preview' yet.");
    }
    
    throw new Error(err.message || "An unexpected error occurred while reconciling your documents.");
  }
};