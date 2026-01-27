
import { GoogleGenAI } from "@google/genai";
import { Product, Material, Quote, ProductMaterialRequirement } from "../types";

/**
 * Genera un texto de marketing para enviar un presupuesto por WhatsApp o Email.
 */
export const generateMarketingText = async (quote: Quote, products: Product[], materials: Material[]): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const productNames = quote.items.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      return `${item.quantity}x ${p?.name || 'Producto'}`;
    }).join(', ');

    const prompt = `Actúa como una experta en marketing para un emprendimiento de costura de accesorios para bebés llamado "Lala accesorios". 
    Genera un mensaje corto, cálido y profesional para enviarle a una cliente con su presupuesto. 
    El presupuesto incluye: ${productNames}. 
    Resalta el valor del trabajo artesanal, la calidad de los materiales y el amor puesto en cada puntada. 
    Usa un tono dulce pero ejecutivo. No uses precios, solo describe la experiencia de compra.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    return response.text?.trim() || "Gracias por elegirnos para acompañar los primeros pasos de tu bebé.";
  } catch (error) {
    console.error("Gemini Marketing Error:", error);
    return "Gracias por elegirnos para acompañar los primeros pasos de tu bebé. Cada pieza es confeccionada con dedicación y los mejores materiales.";
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
      return mat ? mat.name : 'materiales de calidad';
    }).join(', ');

    const prompt = `Como experta en costura creativa y puericultura para el emprendimiento "Lala accesorios", escribe una descripción dulce y vendedora para un producto llamado: "${productName}".
    Este producto está compuesto por: ${materialList}.
    
    Instrucciones:
    1. Explica por qué estos materiales son ideales para bebés (suavidad, seguridad, durabilidad).
    2. Resalta el detalle artesanal y el cuidado en la confección.
    3. Usa un tono que emocione a una mamá o papá (protector, dulce, premium).
    4. Máximo 280 caracteres. No menciones precios.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    if (!response.text) {
      throw new Error("La IA no devolvió contenido.");
    }

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Description Error:", error);
    // Lanzamos el error para que el componente UI lo capture y muestre la alerta
    throw error;
  }
};