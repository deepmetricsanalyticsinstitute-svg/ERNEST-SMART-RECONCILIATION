import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReconciliationResult, FileData } from "../types";

const SYSTEM_INSTRUCTION = `
You are a senior forensic accountant and reconciliation expert. 
Your task is to analyze two financial documents: a Bank Statement and a General Ledger.
The documents may be provided in either PDF or CSV format.
You must extract all transactions from both sources and reconcile them.

Reconciliation Rules:
1. Matching Logic:
   - Amounts must match exactly (or be within 0.01 tolerance).
   - Dates should be close (within 5 days) as bank posting dates vary.
   - Descriptions should be fuzzy matched (e.g., "AMZN MKTPLC" in bank vs "Amazon Purchase" in GL).
2. Data Normalization:
   - Normalize all dates to YYYY-MM-DD format.
   - Ensure all amounts are numbers (floats). Credits/Debits should be handled to ensure directionality matches (usually outflows are negative, inflows positive, or vice versa, but be consistent).
3. Output:
   - Return a strictly structured JSON object containing the summary, matched pairs, and unmatched transactions for both sides.
`;

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.OBJECT,
      properties: {
        totalMatches: { type: Type.NUMBER },
        totalUnmatchedBank: { type: Type.NUMBER },
        totalUnmatchedLedger: { type: Type.NUMBER },
        netDiscrepancy: { type: Type.NUMBER, description: "The sum of all unmatched amounts" },
      },
      required: ["totalMatches", "totalUnmatchedBank", "totalUnmatchedLedger", "netDiscrepancy"],
    },
    matches: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          description: { type: Type.STRING, description: "A combined or representative description" },
          amount: { type: Type.NUMBER },
          bankRef: { type: Type.STRING },
          ledgerRef: { type: Type.STRING },
          matchConfidence: { type: Type.NUMBER },
          notes: { type: Type.STRING, description: "Explanation of why this was matched if fuzzy" },
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
  mode: 'fast' | 'precise' = 'precise'
): Promise<ReconciliationResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }

  const ai = new GoogleGenAI({ apiKey });

  const parts: any[] = [];

  // Handle Bank Statement
  parts.push({ text: "Here is the Bank Statement:" });
  if (bankFile.type === 'pdf') {
    const cleanBankBase64 = bankFile.content.replace(/^data:application\/pdf;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: cleanBankBase64,
      },
    });
  } else {
    // CSV
    parts.push({ text: bankFile.content });
  }

  // Handle General Ledger
  parts.push({ text: "Here is the General Ledger:" });
  if (ledgerFile.type === 'pdf') {
    const cleanLedgerBase64 = ledgerFile.content.replace(/^data:application\/pdf;base64,/, "");
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: cleanLedgerBase64,
      },
    });
  } else {
    // CSV
    parts.push({ text: ledgerFile.content });
  }

  parts.push({ text: "Perform the reconciliation based on the system instructions." });

  // Select model and config based on mode
  let modelName = 'gemini-2.5-flash';
  const config: any = {
    systemInstruction: SYSTEM_INSTRUCTION,
    responseMimeType: "application/json",
    responseSchema: RESPONSE_SCHEMA,
    temperature: 0.1,
  };

  if (mode === 'precise') {
    modelName = 'gemini-3-pro-preview';
    // Add thinking config for complex reasoning tasks
    config.thinkingConfig = { thinkingBudget: 4096 };
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        role: "user",
        parts: parts,
      },
      config: config,
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(text) as ReconciliationResult;
  } catch (error) {
    console.error("Reconciliation failed:", error);
    throw error;
  }
};