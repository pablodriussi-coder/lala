
import React, { useState, useRef } from 'react';
import { AppData, Product, ProductMaterialRequirement, MaterialUnit, Material } from '../types';
import { ICONS } from '../constants';
import { calculateFinalPrice, calculateProductCost } from '../services/calculationService';
import * as XLSX from 'xlsx';

interface ProductsManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const ProductsManager: React.FC<ProductsManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialFormState: Product = {
    id: '',
    name: '',
    description: '',
    categoryId: '',
    materials: [],
    baseLaborCost: 0,
    images: [],
    designOptions: []
  };

  const [formData, setFormData] = useState<Product>(initialFormState);

  const compressImage = (file: File, quality = 0.4): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400; 
          let width = img.width, height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
      };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("El nombre es obligatorio.");

    const productToSave: Product = {
      ...formData,
      id: editingId || crypto.randomUUID(),
      baseLaborCost: Number(formData.baseLaborCost) || 0,
      materials: formData.materials || [],
      designOptions: Array.isArray(formData.designOptions) ? formData.designOptions : [],
      images: Array.isArray(formData.images) ? formData.images : []
    };
    
    updateData(prev => ({ 
      ...prev, 
      products: editingId 
        ? prev.products.map(p => p.id === editingId ? productToSave : p) 
        : [...prev.products, productToSave] 
    }));
    closeModal();
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        ...initialFormState,
        ...product,
        materials: Array.isArray(product.materials) ? [...product.materials] : [],
        designOptions: Array.isArray(product.designOptions) ? [...product.designOptions] : [],
        images: Array.isArray(product.images) ? [...product.images] : []
      });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData(initialFormState);
  };

  const addMaterialRequirement = () => {
    if (data.materials.length === 0) return alert("Primero debes crear materiales en la sección de Materiales.");
    const newReq: ProductMaterialRequirement = {
      materialId: data.materials[0].id,
      quantity: 1
    };
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, newReq]
    }));
  };

  const removeMaterialRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateMaterialRequirement = (index: number, updates: Partial<ProductMaterialRequirement>) => {
    setFormData(prev => {
      const newMaterials = [...prev.materials];
      newMaterials[index] = { ...newMaterials[index], ...updates };
      
      // Si cambia el materialId, reseteamos campos específicos si es necesario
      if (updates.materialId) {
        const mat = data.materials.find(m => m.id === updates.materialId);
        if (mat?.unit !== MaterialUnit.METERS) {
          delete newMaterials[index].widthCm;
          delete newMaterials[index].heightCm;
        } else if (!newMaterials[index].widthCm) {
          newMaterials[index].widthCm = 10;
          newMaterials[index].heightCm = 10;
        }
      }
      
      return { ...prev, materials: newMaterials };
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Catálogo</h2>
          <p className="text-brand-dark/60 font-medium">Gestión de productos por categoría</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => openModal()} className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg transition-all font-bold group">
            <ICONS.Add />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.products.map(product => {
          const cat = data.categories.find(c => c.id === product.categoryId);
          const price = calculateFinalPrice(product, data.materials, data.settings.defaultMargin);
          return (
            <div key={product.id} className="bg-white rounded-[2rem] shadow-sm border border-brand-beige overflow-hidden flex flex-col group hover:shadow-xl transition-all">
              <div className="h-48 bg-brand-white relative overflow-hidden flex items-center justify-center">
                {product.images?.[0] ? (
                  <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={product.name} />
                ) : <span className="text-5xl opacity-10">🧺</span>}
                <div className="absolute top-4 left-4 bg-brand-sage text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
                  ${price.toFixed(0)}
                </div>
                {cat && <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm text-brand-dark px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{cat.name}</div>}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-brand-dark mb-1">{product.name}</h3>
                <p className="text-brand-dark/70 text-[11px] line-clamp-2 mb-4 italic flex-1">
                  {product.description || 'Sin descripción detallada.'}
                </p>
                <div className="flex justify-between items-center mt-auto gap-4">
                    <span className="text-[9px] font-black uppercase text-brand-sage">{product.materials?.length || 0} materiales</span>
                    <button onClick={() => openModal(product)} className="flex-1 bg-brand-white border border-brand-beige hover:bg-brand-beige text-brand-dark font-bold py-2 rounded-xl text-xs transition-colors">Configurar</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-brand-beige animate-slideUp">
            <div className="p-6 flex justify-between items-center border-b border-brand-white">
               <h3 className="text-xl font-bold text-brand-dark">{editingId ? 'Editar' : 'Nuevo'} Producto</h3>
               <button onClick={closeModal} className="text-brand-dark font-bold hover:text-brand-red transition-colors p-2">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Lado Izquierdo: Datos Básicos */}
                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-brand-sage uppercase tracking-[0.3em] border-b border-brand-white pb-2">Información Principal</h4>
                  
                  <div>
                    <label className="block text-[10px] font-black text-brand-dark/60 uppercase tracking-widest mb-2">Categoría</label>
                    <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-bold text-brand-dark">
                        <option value="">Sin Categoría</option>
                        {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-brand-dark/60 uppercase tracking-widest mb-2">Nombre del Producto</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-bold text-brand-dark" placeholder="Ej: Babero Bandana Muselina" />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-brand-dark/60 uppercase tracking-widest mb-2">Descripción (Opcional)</label>
                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-medium text-sm h-24" placeholder="Detalles sobre el producto..." />
                  </div>

                  <div className="bg-brand-white/50 p-6 rounded-3xl border border-brand-white">
                    <label className="block text-[10px] font-black text-brand-sage uppercase tracking-widest mb-2">Costo de Mano de Obra ($)</label>
                    <input type="number" value={formData.baseLaborCost} onChange={e => setFormData({ ...formData, baseLaborCost: Number(e.target.value) })} className="w-full px-5 py-3 rounded-xl bg-white border border-brand-beige outline-none font-bold text-brand-dark text-xl" />
                    <p className="text-[9px] text-brand-greige mt-2 italic">* Este valor se suma al costo de los materiales.</p>
                  </div>
                </div>

                {/* Lado Derecho: Materiales */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-brand-white pb-2">
                    <h4 className="text-[10px] font-black text-brand-sage uppercase tracking-[0.3em]">Materiales e Insumos</h4>
                    <button type="button" onClick={addMaterialRequirement} className="bg-brand-dark text-white px-4 py-1.5 rounded-full text-[9px] font-black hover:bg-brand-sage transition-colors uppercase tracking-widest">
                      + Añadir Insumo
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {formData.materials.length > 0 ? formData.materials.map((req, idx) => {
                      const material = data.materials.find(m => m.id === req.materialId);
                      const isMeters = material?.unit === MaterialUnit.METERS;

                      return (
                        <div key={idx} className="bg-brand-white/50 p-5 rounded-[2rem] border border-brand-beige relative group animate-fadeIn">
                          <button type="button" onClick={() => removeMaterialRequirement(idx)} className="absolute -top-2 -right-2 bg-white text-brand-red w-7 h-7 rounded-full shadow-md border border-brand-beige flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                              <label className="block text-[9px] font-black text-brand-greige uppercase mb-1">Insumo</label>
                              <select 
                                value={req.materialId} 
                                onChange={e => updateMaterialRequirement(idx, { materialId: e.target.value })} 
                                className="w-full px-4 py-2.5 rounded-xl bg-white border border-brand-beige outline-none text-xs font-bold"
                              >
                                {data.materials.map(m => (
                                  <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                ))}
                              </select>
                            </div>

                            {isMeters ? (
                              <>
                                <div>
                                  <label className="block text-[9px] font-black text-brand-greige uppercase mb-1">Ancho de corte (cm)</label>
                                  <input 
                                    type="number" 
                                    value={req.widthCm || ''} 
                                    onChange={e => updateMaterialRequirement(idx, { widthCm: Number(e.target.value) })} 
                                    className="w-full px-4 py-2 rounded-xl bg-white border border-brand-beige outline-none text-xs font-bold"
                                    placeholder="Ancho"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-black text-brand-greige uppercase mb-1">Largo de corte (cm)</label>
                                  <input 
                                    type="number" 
                                    value={req.heightCm || ''} 
                                    onChange={e => updateMaterialRequirement(idx, { heightCm: Number(e.target.value) })} 
                                    className="w-full px-4 py-2 rounded-xl bg-white border border-brand-beige outline-none text-xs font-bold"
                                    placeholder="Largo"
                                  />
                                </div>
                              </>
                            ) : (
                              <div className="md:col-span-2">
                                <label className="block text-[9px] font-black text-brand-greige uppercase mb-1">Cantidad de unidades</label>
                                <input 
                                  type="number" 
                                  step="0.01"
                                  value={req.quantity} 
                                  onChange={e => updateMaterialRequirement(idx, { quantity: Number(e.target.value) })} 
                                  className="w-full px-4 py-2 rounded-xl bg-white border border-brand-beige outline-none text-xs font-bold"
                                  placeholder="Cantidad"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }) : (
                      <div className="text-center py-10 border-2 border-dashed border-brand-beige rounded-[2rem] bg-brand-white/30">
                        <p className="text-brand-greige italic text-xs">No hay materiales añadidos.</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-brand-dark p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Precio Sugerido (Con margen actual)</p>
                      <p className="text-3xl font-bold">${calculateFinalPrice(formData, data.materials, data.settings.defaultMargin).toFixed(0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Costo total</p>
                      <p className="text-xl font-bold text-brand-sage">${calculateProductCost(formData, data.materials).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-brand-white">
                <button type="button" onClick={closeModal} className="flex-1 py-4 text-brand-dark/50 font-bold hover:text-brand-dark transition-colors">Cancelar</button>
                <button type="submit" className="flex-[2] bg-brand-sage text-white py-4 rounded-2xl font-bold hover:bg-brand-dark transition-all shadow-lg shadow-brand-sage/20">
                  {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;
