
import React, { useState, useEffect } from 'react';
import { AppData, Product, ProductMaterialRequirement } from '../types';
import { ICONS } from '../constants';

interface ProductsManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const ProductsManager: React.FC<ProductsManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Estado inicial limpio
  const initialFormState: Partial<Product> = {
    name: '',
    description: '',
    materials: [],
    baseLaborCost: 0
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);

  const handleAddMaterial = () => {
    if (!data.materials || data.materials.length === 0) {
      alert('⚠️ Primero debes registrar materiales en la sección de "Insumos" para poder agregarlos a un producto.');
      return;
    }
    
    // Usamos actualización funcional para evitar estados obsoletos
    setFormData(prev => ({
      ...prev,
      materials: [
        ...(prev.materials || []), 
        { materialId: data.materials[0].id, quantity: 1 }
      ]
    }));
  };

  const updateMaterialRequirement = (index: number, field: keyof ProductMaterialRequirement, value: string | number) => {
    setFormData(prev => {
      const updatedMaterials = [...(prev.materials || [])];
      updatedMaterials[index] = { 
        ...updatedMaterials[index], 
        [field]: field === 'quantity' ? Number(value) : value 
      };
      return { ...prev, materials: updatedMaterials };
    });
  };

  const removeMaterialRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: (prev.materials || []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      alert('Por favor, ingresa un nombre para el producto.');
      return;
    }

    const newProduct: Product = {
      id: editingId || crypto.randomUUID(),
      name: formData.name || 'Producto sin nombre',
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

  const calculateProductCost = (product: Product) => {
    const materialsCost = (product.materials || []).reduce((acc, req) => {
      const mat = data.materials.find(m => m.id === req.materialId);
      return acc + (mat ? mat.costPerUnit * req.quantity : 0);
    }, 0);
    return materialsCost + (Number(product.baseLaborCost) || 0);
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
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slideUp border border-brand-beige">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-brand-dark">{editingId ? 'Editar' : 'Nuevo'} Producto Lala</h3>
                <span className="text-brand-red font-bold text-xl">★</span>
              </div>
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-5">
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

                  <div className="bg-brand-white p-8 rounded-[2rem] space-y-5 border border-brand-beige flex flex-col h-full">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Recetario de Insumos</label>
                      <button 
                        type="button" 
                        onClick={handleAddMaterial}
                        className="text-[10px] bg-brand-sage text-white font-black px-4 py-2 rounded-full shadow-md hover:bg-brand-dark transition-all"
                      >
                        + AGREGAR
                      </button>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2 flex-1">
                      {(formData.materials || []).map((req, idx) => (
                        <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-brand-beige/50 shadow-sm animate-fadeIn">
                          <select 
                            value={req.materialId}
                            onChange={e => updateMaterialRequirement(idx, 'materialId', e.target.value)}
                            className="flex-1 text-[11px] border-none bg-transparent font-bold text-brand-dark outline-none cursor-pointer"
                          >
                            {data.materials.map(m => (
                              <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                            ))}
                          </select>
                          <div className="flex items-center gap-1">
                            <input 
                              type="number" 
                              step="0.01"
                              value={req.quantity}
                              onChange={e => updateMaterialRequirement(idx, 'quantity', e.target.value)}
                              className="w-14 text-[11px] px-1 py-1 bg-brand-white rounded-lg border border-brand-beige/30 text-center font-bold text-brand-dark"
                              placeholder="Cant"
                            />
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeMaterialRequirement(idx)}
                            className="text-brand-red opacity-30 hover:opacity-100 p-1 transition-opacity"
                            title="Eliminar insumo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {(formData.materials || []).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-10 opacity-40">
                          <span className="text-2xl mb-2">🧵</span>
                          <p className="text-[10px] text-brand-greige italic text-center font-bold">Sin insumos asignados</p>
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
