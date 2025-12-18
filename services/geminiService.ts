
import { GoogleGenAI, Type } from "@google/genai";
import { ReconciliationResult, FileData, ProcessingMode } from "../types";

const SYSTEM_INSTRUCTION = `
You are a World-Class Financial Auditor specializing in Bank Reconciliations.
Task: Match Bank Statement (PDF or Text) against General Ledger (CSV or Text).

AUDIT PROTOCOL:
1. MATCHING LOGIC:
   - Level 1 (Exact): Identical Date, Amount (within 0.01), and Description keywords.
   - Level 2 (Fuzzy): Amount matches exactly, but Date is +/- 7 days apart. Use description similarity (e.g., 'Amazon' vs 'AMZN MKT').
   - Level 3 (Grouped): Check if multiple Ledger entries sum up to one Bank entry or vice versa.
   - Level 4 (References): Prioritize matching by check numbers or reference IDs.

2. DISCREPANCY ANALYSIS:
   - Identify timing differences, bank fees, interest not yet recorded, or errors.

3. OUTPUT FORMAT:
   - Return strict JSON.
   - Functional currency: GH¢ (GHS).
   - Dates: YYYY-MM-DD.
   - Provide 'matchConfidence' (0-100) and 'notes' for matches.
   - Calculate 'auditScore' (0-100).
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
        auditScore: { type: Type.INTEGER },
      },
      required: ["totalMatches", "totalUnmatchedBank", "totalUnmatchedLedger", "netDiscrepancy", "matchedAmount", "unmatchedBankAmount", "unmatchedLedgerAmount", "auditScore"],
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
          reasoning: { type: Type.STRING },
        },
        required: ["date", "description", "amount", "matchConfidence"],
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
  mode: ProcessingMode = 'accuracy'
): Promise<ReconciliationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const parts: any[] = [];
  parts.push({ text: "### SOURCE: BANK STATEMENT DATA" });
  if (bankFile.type === 'pdf') {
    parts.push({ 
      inlineData: { 
        mimeType: "application/pdf", 
        data: bankFile.content.split(',')[1] 
      } 
    });
  } else {
    parts.push({ text: bankFile.content });
  }

  parts.push({ text: "### SOURCE: GENERAL LEDGER DATA" });
  if (ledgerFile.type === 'pdf') {
     parts.push({ 
        inlineData: { 
          mimeType: "application/pdf", 
          data: ledgerFile.content.split(',')[1] 
        } 
      });
  } else {
    parts.push({ text: ledgerFile.content });
  }

  const modelName = mode === 'accuracy' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.1,
        thinkingConfig: mode === 'accuracy' ? { thinkingBudget: 32768 } : undefined
      },
    });

    const resultText = response.text;
    if (!resultText) throw new Error("The AI failed to generate a response.");
    
    return JSON.parse(resultText) as ReconciliationResult;
  } catch (err: any) {
    console.error("Gemini Error:", err);
    throw new Error(err.message || "Financial reconciliation failed.");
  }
};
