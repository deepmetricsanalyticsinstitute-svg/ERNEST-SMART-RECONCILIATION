import { GoogleGenAI, Type } from "@google/genai";
import { ReconciliationResult, FileData } from "../types";

const SYSTEM_INSTRUCTION = `
RECONCILIATION ENGINE: Match Bank vs Ledger.
1. Match by Amount (0.01 tolerance), Date (+/- 5 days), fuzzy Description.
2. Return JSON ONLY. GHc currency. Normalize dates YYYY-MM-DD.
3. Be extremely fast: Skip long reasoning, provide direct results.
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
  ledgerFile: FileData,
  mode: 'fast' | 'precise' = 'fast'
): Promise<ReconciliationResult> => {
  // Obtain API key from pre-configured environment variable
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is not configured in the environment.");
  }

  // Initialize the AI client for this specific call
  const ai = new GoogleGenAI({ apiKey });
  
  const parts: any[] = [];
  parts.push({ text: "BANK_DATA:" });
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

  parts.push({ text: "LEDGER_DATA:" });
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

  // Selection of model based on task complexity
  const model = mode === 'precise' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0,
        // Pro models benefit from thinking budget for complex reconciliation
        ...(mode === 'precise' && { thinkingConfig: { thinkingBudget: 4000 } })
      },
    });

    const text = response.text;
    if (!text) throw new Error("The AI model returned an empty response.");
    
    return JSON.parse(text) as ReconciliationResult;
  } catch (err: any) {
    console.error("Gemini API Error:", err);
    throw new Error(err.message || "An error occurred during the reconciliation process.");
  }
};