
import React, { useState, useRef } from 'react';
import { AppData, Product, ProductMaterialRequirement, MaterialUnit } from '../types';
import { ICONS } from '../constants';
import { GoogleGenAI } from "@google/genai";
import * as XLSX from 'xlsx';

interface ProductsManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const ProductsManager: React.FC<ProductsManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialFormState: Partial<Product> = {
    name: '',
    description: '',
    materials: [],
    baseLaborCost: 0
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);

  const generateDescription = async () => {
    if (!formData.name) return alert("Primero ingresa el nombre del producto.");
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Eres una experta en marketing para un emprendimiento de costura de accesorios para bebés llamado "Lala accesorios". 
      Escribe una descripción corta, tierna y vendedora para un producto llamado: "${formData.name}". 
      Resalta la delicadeza, el amor en cada puntada y lo práctico que es para las mamás. Máximo 250 caracteres. No uses emojis exagerados.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      
      if (response.text) {
        setFormData(prev => ({ ...prev, description: response.text.trim() }));
      }
    } catch (error) {
      console.error("IA Error:", error);
      alert("Hubo un problema contactando a la IA. Prueba de nuevo en un momento.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddMaterial = () => {
    if (!data.materials || data.materials.length === 0) {
      alert('⚠️ Primero debes registrar materiales en la sección de "Insumos".');
      return;
    }
    const firstMaterial = data.materials[0];
    setFormData(prev => ({
      ...prev,
      materials: [...(prev.materials || []), { materialId: firstMaterial.id, quantity: 1 }]
    }));
  };

  const updateMaterialRequirement = (index: number, field: keyof ProductMaterialRequirement, value: any) => {
    setFormData(prev => {
      const updatedMaterials = [...(prev.materials || [])];
      updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
      return { ...prev, materials: updatedMaterials };
    });
  };

  const removeMaterialRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: (prev.materials || []).filter((_, i) => i !== index)
    }));
  };

  const calculateRequirementCost = (req: ProductMaterialRequirement) => {
    const material = data.materials.find(m => m.id === req.materialId);
    if (!material) return 0;
    if (material.unit === MaterialUnit.METERS && req.widthCm && req.heightCm && material.widthCm) {
        return material.costPerUnit * ((req.widthCm * req.heightCm) / (material.widthCm * 100));
    }
    return material.costPerUnit * req.quantity;
  };

  const calculateProductCost = (product: Product | Partial<Product>) => {
    const materialsCost = (product.materials || []).reduce((acc, req) => acc + calculateRequirementCost(req), 0);
    return materialsCost + (Number(product.baseLaborCost) || 0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: editingId || crypto.randomUUID(),
      name: formData.name || '',
      description: formData.description || '',
      materials: formData.materials || [],
      baseLaborCost: Number(formData.baseLaborCost) || 0
    };
    updateData(prev => ({
      ...prev,
      products: editingId ? prev.products.map(p => p.id === editingId ? newProduct : p) : [...prev.products, newProduct]
    }));
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Catálogo</h2>
          <p className="text-brand-greige font-medium">Define tus productos y sus costos base</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-sage/20 transition-all font-bold group">
            <ICONS.Add />
            <span>Crear Producto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.products.length > 0 ? data.products.map(product => (
          <div key={product.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-beige hover:border-brand-sage transition-all group flex flex-col min-h-[300px]">
            <div className="flex justify-between items-start mb-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-white flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">🧺</div>
              <div className="text-right">
                <p className="text-[9px] text-brand-greige font-black uppercase tracking-[0.2em]">Costo Total</p>
                <p className="text-2xl font-bold text-brand-dark">${calculateProductCost(product).toFixed(2)}</p>
              </div>
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-2">{product.name}</h3>
            <p className="text-brand-greige text-sm line-clamp-3 mb-8 italic leading-relaxed">{product.description || 'Sin descripción.'}</p>
            <div className="mt-auto flex justify-between gap-4 border-t border-brand-white pt-6">
              <button onClick={() => { setEditingId(product.id); setFormData(product); setIsModalOpen(true); }} className="flex-1 bg-brand-white hover:bg-brand-beige text-brand-dark font-bold py-3 rounded-xl text-xs transition-colors">Configurar</button>
              <button onClick={() => { if(confirm('¿Eliminar?')) updateData(prev => ({...prev, products: prev.products.filter(p => p.id !== product.id)})); }} className="px-4 py-3 text-brand-red opacity-40 hover:opacity-100">🗑️</button>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-brand-beige">
            <p className="text-brand-greige font-medium italic">Tu catálogo está esperando nuevas piezas.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-brand-beige animate-slideUp">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-brand-dark">{editingId ? 'Editar' : 'Nuevo'} Producto</h3>
                <p className="text-xl font-bold text-brand-sage">${calculateProductCost(formData).toFixed(2)}</p>
              </div>
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Nombre del Producto</label>
                      <input type="text" required value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold" />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-brand-greige uppercase tracking-widest">Descripción / Marketing</label>
                        <button type="button" onClick={generateDescription} disabled={isGenerating} className={`text-[9px] font-bold px-3 py-1 rounded-full border transition-all ${isGenerating ? 'bg-gray-100 text-gray-400' : 'bg-brand-sage/10 border-brand-sage text-brand-sage hover:bg-brand-sage hover:text-white'}`}>
                          {isGenerating ? 'Escribiendo...' : '✨ Generar con IA'}
                        </button>
                      </div>
                      <textarea rows={4} value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none text-sm leading-relaxed" placeholder="Describe tu creación..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Costo Mano de Obra ($)</label>
                      <input type="number" value={formData.baseLaborCost} onChange={e => setFormData(p => ({ ...p, baseLaborCost: Number(e.target.value) }))} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold" />
                    </div>
                  </div>
                  <div className="bg-brand-white p-8 rounded-[2rem] border border-brand-beige space-y-4">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Insumos Necesarios</label>
                      <button type="button" onClick={handleAddMaterial} className="text-[10px] bg-brand-sage text-white px-4 py-2 rounded-full">+ AGREGAR</button>
                    </div>
                    <div className="space-y-3 overflow-y-auto max-h-[400px]">
                      {(formData.materials || []).map((req, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl flex items-center gap-3 border border-brand-beige/50">
                          <select value={req.materialId} onChange={e => updateMaterialRequirement(idx, 'materialId', e.target.value)} className="flex-1 text-xs border-none bg-brand-white px-2 py-2 rounded-lg font-bold">
                            {data.materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                          <input type="number" value={req.quantity} onChange={e => updateMaterialRequirement(idx, 'quantity', Number(e.target.value))} className="w-16 text-xs text-center font-bold bg-brand-white py-2 rounded-lg" />
                          <button type="button" onClick={() => removeMaterialRequirement(idx)} className="text-brand-red opacity-30">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-4 text-brand-greige font-bold">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-brand-sage text-white py-4 rounded-2xl font-bold hover:bg-brand-dark transition-all">Guardar Producto</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;
