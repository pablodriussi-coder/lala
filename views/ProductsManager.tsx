
import React, { useState, useEffect } from 'react';
import { AppData, Product, ProductMaterialRequirement, MaterialUnit } from '../types';
import { ICONS } from '../constants';

interface ProductsManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const ProductsManager: React.FC<ProductsManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialFormState: Partial<Product> = {
    name: '',
    description: '',
    materials: [],
    baseLaborCost: 0
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);

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

      // Si cambiamos el material, reseteamos las dimensiones si es tela o no
      if (field === 'materialId') {
        if (material?.unit === MaterialUnit.METERS) {
            updatedMaterials[index].widthCm = updatedMaterials[index].widthCm || 0;
            updatedMaterials[index].heightCm = updatedMaterials[index].heightCm || 0;
            updatedMaterials[index].quantity = 1; // Default
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
        const areaOneMeter = material.widthCm * 100; // Ancho comercial x 1 metro (100cm)
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
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Catálogo</h2>
          <p className="text-brand-greige font-medium">Define tus productos y sus costos base</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-sage/20 transition-all font-bold group"
        >
          <ICONS.Add />
          <span>Crear Producto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.products.length > 0 ? data.products.map(product => {
          const cost = calculateProductCost(product);
          return (
            <div key={product.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-beige hover:border-brand-sage transition-all group relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-7xl">★</span>
              </div>
              
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
              <p className="text-brand-greige text-sm line-clamp-2 mb-8 leading-relaxed italic">
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
            <div className="text-brand-greige mb-4 opacity-30">
              <span className="text-6xl">🧸</span>
            </div>
            <p className="text-brand-greige font-medium italic">Tu catálogo está esperando nuevas piezas.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp border border-brand-beige">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-brand-dark">{editingId ? 'Editar' : 'Nuevo'} Producto Lala</h3>
                <div className="flex flex-col items-end">
                    <p className="text-[10px] text-brand-greige font-black uppercase">Costo Base Calculado</p>
                    <p className="text-2xl font-bold text-brand-sage">${calculateProductCost(formData).toFixed(2)}</p>
                </div>
              </div>
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-4 space-y-5">
                    <div>
                      <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Denominación</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage font-bold text-brand-dark"
                        placeholder="Ej: Portachupetes Estrella"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Detalles</label>
                      <textarea 
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage text-brand-dark"
                        placeholder="Características del producto..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Mano de Obra ($)</label>
                      <input 
                        type="number"
                        value={formData.baseLaborCost}
                        onChange={e => setFormData(prev => ({ ...prev, baseLaborCost: Number(e.target.value) }))}
                        className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage font-bold text-brand-dark"
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-8 bg-brand-white p-8 rounded-[2rem] space-y-5 border border-brand-beige flex flex-col min-h-[400px]">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Recetario de Insumos</label>
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
                        const reqCost = calculateRequirementCost(req);
                        
                        return (
                          <div key={idx} className="bg-white p-5 rounded-3xl border border-brand-beige/50 shadow-sm animate-fadeIn group">
                            <div className="flex flex-wrap items-center gap-4">
                              <div className="flex-1 min-w-[200px]">
                                <label className="text-[9px] font-black text-brand-greige uppercase block mb-1">Insumo</label>
                                <select 
                                  value={req.materialId}
                                  onChange={e => updateMaterialRequirement(idx, 'materialId', e.target.value)}
                                  className="w-full text-xs border-none bg-brand-white px-4 py-2 rounded-xl font-bold text-brand-dark outline-none cursor-pointer"
                                >
                                  {data.materials.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                                  ))}
                                </select>
                              </div>
                              
                              {isFabric ? (
                                <>
                                  <div className="w-24">
                                    <label className="text-[9px] font-black text-brand-greige uppercase block mb-1">Ancho (cm)</label>
                                    <input 
                                      type="number"
                                      value={req.widthCm}
                                      onChange={e => updateMaterialRequirement(idx, 'widthCm', Number(e.target.value))}
                                      className="w-full text-xs px-3 py-2 bg-brand-white rounded-xl border border-brand-beige/30 text-center font-bold text-brand-dark"
                                    />
                                  </div>
                                  <div className="w-24">
                                    <label className="text-[9px] font-black text-brand-greige uppercase block mb-1">Largo (cm)</label>
                                    <input 
                                      type="number"
                                      value={req.heightCm}
                                      onChange={e => updateMaterialRequirement(idx, 'heightCm', Number(e.target.value))}
                                      className="w-full text-xs px-3 py-2 bg-brand-white rounded-xl border border-brand-beige/30 text-center font-bold text-brand-dark"
                                    />
                                  </div>
                                  <div className="pt-4 px-2">
                                      <div className="text-[10px] font-bold text-brand-sage bg-brand-sage/10 px-3 py-1 rounded-full">
                                          {material.widthCm ? `${((req.widthCm || 0) * (req.heightCm || 0) / (material.widthCm * 100) * 100).toFixed(1)}%` : '-%'}
                                      </div>
                                  </div>
                                </>
                              ) : (
                                <div className="w-24">
                                  <label className="text-[9px] font-black text-brand-greige uppercase block mb-1">Cant. ({material?.unit})</label>
                                  <input 
                                    type="number"
                                    step="0.01"
                                    value={req.quantity}
                                    onChange={e => updateMaterialRequirement(idx, 'quantity', Number(e.target.value))}
                                    className="w-full text-xs px-3 py-2 bg-brand-white rounded-xl border border-brand-beige/30 text-center font-bold text-brand-dark"
                                  />
                                </div>
                              )}
                              
                              <div className="flex-1 text-right min-w-[80px]">
                                <p className="text-[9px] font-black text-brand-greige uppercase">Subtotal</p>
                                <p className="text-sm font-bold text-brand-dark">${reqCost.toFixed(2)}</p>
                              </div>
                              
                              <button 
                                type="button" 
                                onClick={() => removeMaterialRequirement(idx)}
                                className="text-brand-red opacity-30 hover:opacity-100 p-2 transition-opacity"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      
                      {(formData.materials || []).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 opacity-30">
                          <span className="text-4xl mb-2">🧵</span>
                          <p className="text-sm italic font-medium">Asigna materiales para calcular costos</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 border-t border-brand-white pt-8">
                  <button type="button" onClick={closeModal} className="flex-1 py-4 text-brand-greige font-bold hover:text-brand-dark transition-colors">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-brand-sage text-white px-10 py-4 rounded-[1.5rem] font-bold hover:bg-brand-dark transition-all shadow-xl shadow-brand-sage/10">
                    Guardar Cambios
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
