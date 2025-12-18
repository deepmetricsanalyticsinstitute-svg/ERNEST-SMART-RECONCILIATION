import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ReconciliationResult, FileData } from "../types";

const SYSTEM_INSTRUCTION = `
RECONCILIATION ENGINE: Match Bank vs Ledger.
1. Match by Amount (0.01 tolerance), Date (+/- 5 days), fuzzy Description.
2. Return JSON ONLY. GHc currency. Normalize dates YYYY-MM-DD.
3. Be extremely fast: Skip long reasoning, provide direct results.
`;

const RESPONSE_SCHEMA: Schema = {
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
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });
  const parts: any[] = [];

  parts.push({ text: "BANK_DATA:" });
  if (bankFile.type === 'pdf') {
    parts.push({ inlineData: { mimeType: "application/pdf", data: bankFile.content.replace(/^data:application\/pdf;base64,/, "") } });
  } else {
    parts.push({ text: bankFile.content });
  }

  parts.push({ text: "LEDGER_DATA:" });
  if (ledgerFile.type === 'pdf') {
    parts.push({ inlineData: { mimeType: "application/pdf", data: ledgerFile.content.replace(/^data:application\/pdf;base64,/, "") } });
  } else {
    parts.push({ text: ledgerFile.content });
  }

  // Use gemini-3-flash-preview for high speed. Disable thinking for maximum velocity.
  const modelName = mode === 'precise' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model: modelName,
    contents: { role: "user", parts: parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      temperature: 0,
      thinkingConfig: { thinkingBudget: mode === 'precise' ? 1024 : 0 },
    },
  });

  if (!response.text) throw new Error("Empty response from AI engine.");
  
  try {
    return JSON.parse(response.text) as ReconciliationResult;
  } catch (e) {
    console.error("Failed to parse JSON response:", response.text);
    throw new Error("AI returned invalid format. Please retry.");
  }
};