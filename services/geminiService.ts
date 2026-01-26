
import { GoogleGenAI } from "@google/genai";
import { Product, Material, Quote, ProductMaterialRequirement } from "../types";

// Inicialización centralizada siguiendo las reglas del SDK
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMarketingText = async (quote: Quote, products: Product[], materials: Material[]): Promise<string> => {
  const ai = getAIClient();
  
  const productNames = quote.items.map(item => {
    const p = products.find(prod => prod.id === item.productId);
    return `${item.quantity}x ${p?.name || 'Producto'}`;
  }).join(', ');

  const prompt = `Actúa como una experta en marketing para un emprendimiento de costura de accesorios para bebés llamado "Lala accesorios". 
  Genera un mensaje corto, cálido y profesional para enviarle a una cliente con su presupuesto. 
  El presupuesto incluye: ${productNames}. 
  Resalta el valor del trabajo artesanal y el amor puesto en cada puntada. 
  Usa un tono dulce pero ejecutivo. No uses precios.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Gracias por elegirnos para acompañar los primeros pasos de tu bebé.";
  } catch (error) {
    console.error("Error generating marketing text", error);
    return "Gracias por elegirnos para acompañar los primeros pasos de tu bebé.";
  }
};

/**
 * Genera una descripción de producto basada en su nombre y composición de materiales.
 */
export const generateAIProductDescription = async (
  name: string, 
  requirements: ProductMaterialRequirement[], 
  availableMaterials: Material[]
): Promise<string> => {
  const ai = getAIClient();

  // Construimos la lista de nombres de materiales para el prompt
  const materialDetails = requirements.map(req => {
    const mat = availableMaterials.find(m => m.id === req.materialId);
    return mat ? mat.name : 'Material de calidad';
  }).join(', ');

  const prompt = `Como experta en puericultura y marketing textil para bebés, escribe una descripción encantadora para un producto llamado "${name}".
  El producto está confeccionado con: ${materialDetails}.
  
  Instrucciones:
  1. Explica los beneficios de estos materiales para la piel del bebé (suavidad, transpirabilidad, etc.).
  2. Resalta que es una pieza artesanal hecha a mano con dedicación.
  3. Usa un tono que conecte emocionalmente con madres y padres (dulce, protector, premium).
  4. Mantén la descripción bajo los 300 caracteres para que sea legible en redes sociales.
  5. No menciones precios.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || `Un hermoso ${name} confeccionado artesanalmente con ${materialDetails}, pensado para la delicadeza de tu bebé.`;
  } catch (error) {
    console.error("Error en Gemini al generar descripción:", error);
    return `Un hermoso ${name} confeccionado artesanalmente con materiales seleccionados de alta calidad.`;
  }
};
