
import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const initGemini = (apiKey: string) => {
  if (!apiKey) {
    console.error("API key is missing. Gemini features will not work.");
    return;
  }
  ai = new GoogleGenAI({ apiKey });
};

export const suggestCategory = async (fileName: string, existingCategories: string[]): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API is not initialized. Please call initGemini first.");
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
      // Return the first category as a safe default
      return existingCategories[0] || "General";
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get suggestion from Gemini API.");
  }
};
