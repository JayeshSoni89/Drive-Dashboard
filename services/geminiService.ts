
import { GoogleGenAI } from "@google/genai";

// Assume API_KEY is set in the environment.
// Do not add any UI for managing the API key.
if (!process.env.API_KEY) {
  // In a real app, you might want to handle this more gracefully.
  // For this example, we'll log an error to the console.
  console.error("API_KEY environment variable not set. Gemini features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const suggestCategory = async (fileName: string, existingCategories: string[]): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  
  const prompt = `
    Given the file name "${fileName}", suggest the most fitting category from the following list: [${existingCategories.join(", ")}].
    Your response must be ONLY one of the category names from the list. Do not add any extra text, explanation, or punctuation.
    For example, if the best category is "Work", your entire response should be just "Work".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text.trim();

    // Clean up the response to ensure it's just the category name
    const cleanedText = text.replace(/["'.]/g, '');

    // Check if the suggested category is in the provided list
    const foundCategory = existingCategories.find(c => c.toLowerCase() === cleanedText.toLowerCase());

    if (foundCategory) {
      return foundCategory;
    } else {
      // Fallback if the model hallucinates a category not in the list
      console.warn(`Gemini suggested a new category: "${cleanedText}". Falling back.`);
      return existingCategories[0] || "General";
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get suggestion from Gemini API.");
  }
};
