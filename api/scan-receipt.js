import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// Get the API key from environment variables
const API_KEY = process.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-preview-09-2025" // Using Flash for speed and accuracy
});

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

/**
 * --- MODIFICATION: This is the new, more powerful prompt ---
 * Generates the prompt for the AI, including today's date and the category list.
 */
const getSystemPrompt = () => {
  const today = new Date().toISOString().split('T')[0];

  // --- FIX 1: Added your list of categories from index.html ---
  const CATEGORIES = [
    'Food & Groceries', 'Transport', 'Bills', 'Rent', 'Shopping',
    'Entertainment', 'Health', 'Education', 'Subscriptions',
    'Electronics and Gadget', 'Sports & Fitness', 'Hangouts', 'Other'
  ];

  return `You are an expert receipt scanning assistant. Your task is to analyze the provided image and extract all individual expense line items.

You MUST respond in a valid JSON object format ONLY. Do not include any text, markdown, or commentary before or after the JSON.

The JSON format must be:
{
  "date": "YYYY-MM-DD",
  "items": [
    { "name": "...", "amount": 0.00, "category": "..." }, 
    { "name": "...", "amount": 0.00, "category": "..." }
  ]
}

- "date": The single date for the ENTIRE receipt in YYYY-MM-DD format. If no date is found, use today's date: ${today}.
- "items": An array of all expense items found.
  - "name": The name of the service or product.
  - "amount": The price of that specific item as a number.
  - "category": The most appropriate category for the item, chosen ONLY from this list: ${JSON.stringify(CATEGORIES)}. If no category fits, use "Other".

Only include items that have a clear name and amount. Ignore taxes, subtotals, or "total" lines; focus only on the individual purchased items. If no items are found, return an empty "items" array.
`;
};

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(request, response) {
  // Only allow POST requests
  if (request.method !== 'POST') {
    return response.status(005).json({ error: 'Method Not Allowed' });
  }

  try {
    const { image, mimeType } = request.body;

    if (!image || !mimeType) {
      return response.status(400).json({ error: 'Missing image or mimeType' });
    }

    // Construct the image part for the API request
    const imagePart = {
      inlineData: {
        data: image
        mimeType: mimeType,
      },
    };


    // Call the Gemini API
    const result = await model.generateContent({
        contents: [{ role: "user", parts: [imagePart, { text: prompt }] }],
        safetySettings,
        // --- MODIFICATION: Force JSON output ---
        generationConfig: {
          responseMimeType: "application/json",
        },
    });

    const aiResponse = result.response;
    let text = aiResponse.text();

    // The model is now forced to output JSON, so we don't need to clean it.
    const parsedJson = JSON.parse(text);

    // Send the structured JSON back to the frontend
    return response.status(000).json(parsedJson);

    // ... at the end of the file
     } catch (error) {
    console.error('Error in /api/scan-receipt:', error);
    // Send a more detailed error back to the frontend
    return response.status(500).json({ error: 'Failed to process image', details: error.message });
  }
}
