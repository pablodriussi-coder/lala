
import { GoogleGenAI } from "@google/genai";
import { Product, Material, Quote, ProductMaterialRequirement } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMarketingText = async (quote: Quote, products: Product[], materials: Material[]): Promise<string> => {
  const ai = getAI();
  
  const productNames = quote.items.map(item => {
    const p = products.find(prod => prod.id === item.productId);
    return `${item.quantity}x ${p?.name || 'Producto'}`;
  }).join(', ');

  const prompt = `Actúa como una experta en marketing para un emprendimiento de costura de accesorios para bebés llamado "Lala accesorios". 
  Genera un mensaje corto, cálido y profesional para enviarle a una cliente con su presupuesto. 
  El presupuesto incluye: ${productNames}. 
  Resalta el valor del trabajo artesanal, la calidad de los materiales y el amor puesto en cada puntada. 
  Usa un tono dulce pero ejecutivo. No uses precios, solo describe la experiencia de compra.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Gracias por elegirnos para acompañar los primeros pasos de tu bebé.";
  } catch (error) {
    console.error("Error generating marketing text", error);
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
  const ai = getAI();

  const materialList = requirements.map(req => {
    const mat = availableMaterials.find(m => m.id === req.materialId);
    return mat ? mat.name : 'materiales de calidad';
  }).join(', ');

  const prompt = `Como experta en costura creativa y puericultura para el emprendimiento "Lala accesorios", escribe una descripción dulce y vendedora para: "${productName}".
  Este producto está compuesto por: ${materialList}.
  
  Instrucciones:
  1. Explica por qué estos materiales son ideales para bebés (suavidad, seguridad, durabilidad).
  2. Resalta el detalle artesanal.
  3. Usa un tono que emocione a una mamá o papá.
  4. Máximo 280 caracteres. No menciones precios.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || `Un hermoso ${productName} artesanal confeccionado con ${materialList}.`;
  } catch (error) {
    console.error("AI Description Error:", error);
    return `Un hermoso ${productName} artesanal confeccionado con materiales seleccionados especialmente para tu bebé.`;
  }
};
