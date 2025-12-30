
import { GoogleGenAI } from "@google/genai";
import { QuoteRequest } from "../types";

export const structureQuoteRequest = async (request: QuoteRequest): Promise<string> => {
  // Initialize the Google GenAI client with the required API key from environment variables.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    System Identity: RACHIDI_OS_v2.0 AI Assistant.
    Context: STE RACHIDI JARDINAGE SARL AU (Safi, Morocco).
    Task: Process a client request into a high-tech service summary.
    
    Client: ${request.clientName}
    Contact: ${request.phone}
    Input: "${request.subject}"
    
    Instructions:
    1. Structure the response professionally in French.
    2. Use a "High-Tech Command Center" tone.
    3. Categorize the request into Jardinage, Nettoyage, or Fourniture.
    4. Provide a 2-3 sentence summary only.
  `;

  // Call the Gemini model to generate content based on the prompt.
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
    }
  });

  // Extract the text output using the .text property from the response as per the latest SDK guidelines.
  return response.text || "SYSTEM_ERROR: Transmission failed. Please contact STE RACHIDI JARDINAGE SARL AU directly.";
};
