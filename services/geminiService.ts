
import { GoogleGenAI } from "@google/genai";
import { Product, Material, Quote, ProductMaterialRequirement } from "../types";

/**
 * Genera un texto de marketing para enviar un presupuesto por WhatsApp o Email.
 */
export const generateMarketingText = async (quote: Quote, products: Product[], materials: Material[]): Promise<string> => {
  try {
    // Creamos la instancia justo antes de usarla para asegurar que use la clave más reciente
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const productNames = quote.items.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      return `${item.quantity}x ${p?.name || 'Producto'}`;
    }).join(', ');

    const prompt = `Actúa como una experta en marketing para un emprendimiento de costura de accesorios para bebés llamado "Lala accesorios". 
    Genera un mensaje corto, cálido y profesional para enviarle a una cliente con su presupuesto. 
    El presupuesto incluye: ${productNames}. 
    Resalta el valor del trabajo artesanal y la calidad de los materiales. 
    Usa un tono dulce y profesional. No uses precios.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return response.text || "Gracias por elegirnos para acompañar los primeros pasos de tu bebé.";
  } catch (error) {
    console.error("Gemini Marketing Error:", error);
    throw error;
  }
};

/**
 * Genera una descripción persuasiva basada en la composición técnica del producto.
 */
export const generateDescriptionFromMaterials = async (
  productName: string,
  requirements: ProductMaterialRequirement[],
  availableMaterials: Material[]
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const materialList = requirements.map(req => {
      const mat = availableMaterials.find(m => m.id === req.materialId);
      return mat ? mat.name : 'materiales seleccionados';
    }).join(', ');

    const prompt = `Escribe una descripción dulce y vendedora para un accesorio de bebé llamado "${productName}".
    Materiales utilizados: ${materialList}.
    
    Instrucciones:
    - Resalta la suavidad y seguridad para el bebé.
    - Menciona que es un trabajo 100% artesanal de "Lala accesorios".
    - Tono: dulce, protector y premium.
    - Máximo 250 caracteres. No menciones precios.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    const text = response.text;
    if (!text) throw new Error("La IA no devolvió texto.");

    return text.trim();
  } catch (error) {
    console.error("Gemini Assistant Error:", error);
    throw error;
  }
};
