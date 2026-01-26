
import { GoogleGenAI } from "@google/genai";
import { Product, Material, Quote } from "../types";

export const generateMarketingText = async (quote: Quote, products: Product[], materials: Material[]): Promise<string> => {
  // Correctly initialize GoogleGenAI with process.env.API_KEY as a required parameter
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const productNames = quote.items.map(item => {
    const p = products.find(prod => prod.id === item.productId);
    return `${item.quantity}x ${p?.name || 'Producto'}`;
  }).join(', ');

  const prompt = `Actúa como una experta en marketing para un emprendimiento de costura de accesorios para bebés. 
  Genera un mensaje corto, cálido y profesional para enviarle a una cliente con su presupuesto. 
  El presupuesto incluye: ${productNames}. 
  Resalta el valor del trabajo artesanal, la calidad de los materiales y el amor puesto en cada puntada. 
  Usa un tono dulce pero ejecutivo. No uses precios, solo describe la experiencia de compra.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Correctly extract text output using the .text property from the GenerateContentResponse object
    return response.text || "Gracias por elegirnos para acompañar los primeros pasos de tu bebé.";
  } catch (error) {
    console.error("Error generating marketing text", error);
    return "Gracias por elegirnos para acompañar los primeros pasos de tu bebé. Cada pieza es confeccionada con dedicación y los mejores materiales.";
  }
};
