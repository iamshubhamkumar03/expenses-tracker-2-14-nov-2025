// --- Vercel Serverless Function ---
// api/get-insights.js

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Get the API key from environment variables
const API_KEY = process.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-preview-09-2025"
});

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * --- THIS IS THE NEW, SMARTER PROMPT ---
 * It builds a detailed set of instructions for the AI.
 */
const getSystemPrompt = (budgets, expenses, limits, notes, repeatedExpenses) => {
    
    // Calculate summaries to make it easier for the AI
    const paidExpenses = expenses.filter(e => e.paid);
    const unpaidExpenses = expenses.filter(e => !e.paid);
    const totalSpent = paidExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);

    return `
You are an expert financial assistant. Your tone is friendly, encouraging, and insightful.
Your goal is to provide a 3-5 bullet-point summary to help the user maintain their budget and manage their finances.
You MUST provide actionable advice.

Format your entire response as an HTML string using <ul> and <li> tags.
Use <b> tags for important numbers, categories, or names.

Here is the user's financial data for the month:

1.  **Monthly Budget (Income/Debts/Savings):**
    ${JSON.stringify(budgets)}

2.  **All Expenses for the Month (Paid & Unpaid):**
    ${JSON.stringify(expenses)}

3.  **Category Spending Limits:**
    ${JSON.stringify(limits)}

4.  **User's Important Notes:**
    ${JSON.stringify(notes.map(n => n.text))}

5.  **User's Repeated Expense Templates:**
    ${JSON.stringify(repeatedExpenses)}

---
**Your Task - Provide Insights based on this data:**

* **Budget vs. Spending:** Compare the <b>Total Budget (₹${totalBudget.toFixed(2)})</b> against the <b>Total Spent (₹${totalSpent.toFixed(2)})</b>. Are they on track?
* **Category Limits:** Check the paid expenses against the <b>Category Spending Limits</b>. Point out any categories where they are over or close to their limit.
* **Unpaid Bills:** Look at the <b>Unpaid Expenses</b> list. Are there any important bills (like 'Rent', 'Bills', or items from the 'Repeated Expenses' list) that are still unpaid? Gently remind them.
* **Spending Habits:** Look at the highest spending categories. Offer a simple, helpful observation.
* **Notes Context:** Use the <b>Important Notes</b> for context. For example, if they wrote "Saving for a trip," acknowledge that in your analysis of their spending.

Provide a 3-5 bullet-point summary in a <ul> list.
`;
};


/**
 * Vercel Serverless Function Handler
 */
export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // --- FIX 1: Receive ALL the new data from the frontend ---
    const { budgets, expenses, limits, notes, repeatedExpenses } = request.body;

    if (!budgets || !expenses) {
      return response.status(400).json({ error: 'Missing financial data' });
    }
    
    // --- FIX 2: Generate the new, powerful prompt ---
    const prompt = getSystemPrompt(budgets, expenses, limits, notes, repeatedExpenses);

    // Call the Gemini API
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        safetySettings,
        // We are asking for HTML, so response type is text/plain
        generationConfig: {
            responseMimeType: "text/plain",
        },
    });
    
    const aiResponse = result.response;
    const text = aiResponse.text();

    // Send the raw HTML insight back to the frontend
    return response.status(200).json({ insights: text });

  } catch (error) {
    console.error('Error in /api/get-insights:', error);
    return response.status(500).json({ error: 'Failed to get insights', details: error.message });
  }
}
