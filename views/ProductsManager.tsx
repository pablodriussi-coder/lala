
import React, { useState, useRef } from 'react';
import { AppData, Product, ProductMaterialRequirement, MaterialUnit } from '../types';
import { ICONS } from '../constants';
import { generateAIProductDescription } from '../services/geminiService';
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

  // Nueva función de generación mejorada
  const handleGenerateDescription = async () => {
    if (!formData.name) {
      alert("Por favor, ingresa el nombre del producto primero.");
      return;
    }
    
    if (!formData.materials || formData.materials.length === 0) {
      if (!confirm("No has seleccionado materiales. La descripción será general. ¿Continuar?")) return;
    }

    setIsGenerating(true);
    try {
      const description = await generateAIProductDescription(
        formData.name || 'Accesorio',
        formData.materials || [],
        data.materials
      );
      setFormData(prev => ({ ...prev, description }));
    } catch (error) {
      console.error(error);
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
      materials: [
        ...(prev.materials || []), 
        { 
          materialId: firstMaterial.id, 
          quantity: 1,
          widthCm: firstMaterial.unit === MaterialUnit.METERS ? 0 : undefined,
          heightCm: firstMaterial.unit === MaterialUnit.METERS ? 0 : undefined
        }
      ]
    }));
  };

  const updateMaterialRequirement = (index: number, field: keyof ProductMaterialRequirement, value: any) => {
    setFormData(prev => {
      const updatedMaterials = [...(prev.materials || [])];
      const matId = field === 'materialId' ? value : updatedMaterials[index].materialId;
      const material = data.materials.find(m => m.id === matId);

      updatedMaterials[index] = { 
        ...updatedMaterials[index], 
        [field]: value 
      };

      if (field === 'materialId') {
        if (material?.unit === MaterialUnit.METERS) {
            updatedMaterials[index].widthCm = updatedMaterials[index].widthCm || 0;
            updatedMaterials[index].heightCm = updatedMaterials[index].heightCm || 0;
            updatedMaterials[index].quantity = 1;
        } else {
            updatedMaterials[index].widthCm = undefined;
            updatedMaterials[index].heightCm = undefined;
        }
      }

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
        const areaNeeded = req.widthCm * req.heightCm;
        const areaOneMeter = material.widthCm * 100;
        const usagePercentage = areaNeeded / areaOneMeter;
        return material.costPerUnit * usagePercentage;
    }

    return material.costPerUnit * req.quantity;
  };

  const calculateProductCost = (product: Product | Partial<Product>) => {
    const materialsCost = (product.materials || []).reduce((acc, req) => {
      return acc + calculateRequirementCost(req);
    }, 0);
    return materialsCost + (Number(product.baseLaborCost) || 0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert('Ingresa un nombre.');

    const newProduct: Product = {
      id: editingId || crypto.randomUUID(),
      name: formData.name || '',
      description: formData.description || '',
      materials: formData.materials || [],
      baseLaborCost: Number(formData.baseLaborCost) || 0
    };

    updateData(prev => ({
      ...prev,
      products: editingId 
        ? prev.products.map(p => p.id === editingId ? newProduct : p)
        : [...prev.products, newProduct]
    }));

    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
    setIsGenerating(false);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Catálogo</h2>
          <p className="text-brand-greige font-medium">Define tus productos y sus costos base</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-sage/20 transition-all font-bold group"
          >
            <ICONS.Add />
            <span>Crear Producto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.products.length > 0 ? data.products.map(product => {
          const cost = calculateProductCost(product);
          return (
            <div key={product.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-beige hover:border-brand-sage transition-all group relative overflow-hidden flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-white flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                  🧺
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-brand-greige font-black uppercase tracking-[0.2em]">Costo Total</p>
                  <p className="text-2xl font-bold text-brand-dark">${cost.toFixed(2)}</p>
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-brand-dark mb-2">{product.name}</h3>
              <p className="text-brand-greige text-sm line-clamp-3 mb-8 leading-relaxed italic">
                {product.description || 'Sin descripción detallada.'}
              </p>
              
              <div className="border-t border-brand-white pt-6 mt-auto flex justify-between gap-4">
                <button 
                  onClick={() => { setEditingId(product.id); setFormData(product); setIsModalOpen(true); }}
                  className="flex-1 bg-brand-white hover:bg-brand-beige text-brand-dark font-bold py-3 rounded-xl text-xs transition-colors"
                >
                  Configurar
                </button>
                <button 
                  onClick={() => { if(confirm('¿Eliminar producto?')) updateData(prev => ({...prev, products: prev.products.filter(p => p.id !== product.id)})); }}
                  className="px-4 py-3 text-brand-red opacity-40 hover:opacity-100 transition-opacity"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-brand-beige">
            <p className="text-brand-greige font-medium italic">Tu catálogo está esperando nuevas piezas.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto animate-slideUp border border-brand-beige">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-brand-dark">{editingId ? 'Editar' : 'Nuevo'} Producto Lala</h3>
                <p className="text-2xl font-bold text-brand-sage">${calculateProductCost(formData).toFixed(2)}</p>
              </div>
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-5 space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Nombre</label>
                      <input 
                        type="text" required
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage font-bold text-brand-dark"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-brand-greige uppercase tracking-widest">Descripción</label>
                        <button 
                          type="button" 
                          onClick={handleGenerateDescription}
                          disabled={isGenerating}
                          className={`text-[9px] font-black px-4 py-1.5 rounded-full border transition-all flex items-center gap-2 ${
                            isGenerating ? 'bg-brand-white text-brand-greige border-brand-beige' : 'bg-brand-sage/10 text-brand-sage border-brand-sage/30 hover:bg-brand-sage hover:text-white'
                          }`}
                        >
                          {isGenerating ? (
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-brand-sage rounded-full animate-ping"></span>
                              Analizando composición...
                            </span>
                          ) : (
                            <>✨ Generar con IA</>
                          )}
                        </button>
                      </div>
                      <textarea 
                        rows={6}
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage text-brand-dark text-sm leading-relaxed"
                        placeholder="Usa el asistente de IA para resaltar los materiales..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Costo Mano de Obra ($)</label>
                      <input 
                        type="number"
                        value={formData.baseLaborCost}
                        onChange={e => setFormData(prev => ({ ...prev, baseLaborCost: Number(e.target.value) }))}
                        className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage font-bold text-brand-dark"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-7 bg-brand-white p-8 rounded-[2rem] space-y-5 border border-brand-beige flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Insumos Necesarios</label>
                      <button 
                        type="button" 
                        onClick={handleAddMaterial}
                        className="text-[10px] bg-brand-sage text-white font-black px-4 py-2 rounded-full shadow-md hover:bg-brand-dark transition-all"
                      >
                        + AGREGAR MATERIAL
                      </button>
                    </div>
                    
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 flex-1">
                      {(formData.materials || []).map((req, idx) => {
                        const material = data.materials.find(m => m.id === req.materialId);
                        const isFabric = material?.unit === MaterialUnit.METERS;
                        
                        return (
                          <div key={idx} className="bg-white p-5 rounded-3xl border border-brand-beige/50 shadow-sm flex items-center gap-4">
                            <div className="flex-1">
                              <select 
                                value={req.materialId}
                                onChange={e => updateMaterialRequirement(idx, 'materialId', e.target.value)}
                                className="w-full text-xs border-none bg-brand-white px-3 py-2 rounded-xl font-bold text-brand-dark outline-none"
                              >
                                {data.materials.map(m => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            {isFabric ? (
                              <div className="flex gap-2">
                                <input 
                                  type="number" placeholder="Ancho"
                                  value={req.widthCm}
                                  onChange={e => updateMaterialRequirement(idx, 'widthCm', Number(e.target.value))}
                                  className="w-16 text-xs px-2 py-2 bg-brand-white rounded-lg border border-brand-beige/30 text-center font-bold"
                                />
                                <input 
                                  type="number" placeholder="Largo"
                                  value={req.heightCm}
                                  onChange={e => updateMaterialRequirement(idx, 'heightCm', Number(e.target.value))}
                                  className="w-16 text-xs px-2 py-2 bg-brand-white rounded-lg border border-brand-beige/30 text-center font-bold"
                                />
                              </div>
                            ) : (
                              <input 
                                type="number"
                                value={req.quantity}
                                onChange={e => updateMaterialRequirement(idx, 'quantity', Number(e.target.value))}
                                className="w-16 text-xs px-2 py-2 bg-brand-white rounded-lg border border-brand-beige/30 text-center font-bold"
                              />
                            )}
                            
                            <button 
                              type="button" 
                              onClick={() => removeMaterialRequirement(idx)}
                              className="text-brand-red opacity-30 hover:opacity-100"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 border-t border-brand-white pt-8">
                  <button type="button" onClick={closeModal} className="flex-1 py-4 text-brand-greige font-bold">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-brand-sage text-white py-4 rounded-2xl font-bold hover:bg-brand-dark transition-all">
                    Guardar Producto
                  </button>
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
