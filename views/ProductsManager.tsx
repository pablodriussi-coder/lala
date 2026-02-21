
import React, { useState, useRef } from 'react';
import { AppData, Product, ProductMaterialRequirement, MaterialUnit, Material, DesignOption } from '../types';
import { ICONS } from '../constants';
import { calculateFinalPrice, calculateProductCost } from '../services/calculationService';
import { syncProduct, deleteFromSupabase } from '../store';

interface ProductsManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const ProductsManager: React.FC<ProductsManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const designInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás segura de eliminar este producto permanentemente?')) {
      updateData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id)
      }));
      await deleteFromSupabase('products', id);
    }
  };

  const compressImage = (file: File, quality = 0.5): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 600; 
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

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newImages = [...(formData.images || [])];
    for (let i = 0; i < files.length; i++) {
        const base64 = await compressImage(files[i]);
        newImages.push(base64);
    }
    setFormData({ ...formData, images: newImages });
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleDesignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImage(file, 0.4);
    const newDesign: DesignOption = {
        id: crypto.randomUUID(),
        name: file.name.split('.')[0],
        image: base64
    };
    setFormData({ ...formData, designOptions: [...(formData.designOptions || []), newDesign] });
    if (designInputRef.current) designInputRef.current.value = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return alert("El nombre es obligatorio.");

    const productToSave: Product = {
      ...formData,
      id: editingId || crypto.randomUUID(),
      baseLaborCost: Number(formData.baseLaborCost) || 0,
      customPrice: formData.customPrice ? Number(formData.customPrice) : undefined,
      materials: formData.materials || [],
      designOptions: Array.isArray(formData.designOptions) ? formData.designOptions : [],
      images: Array.isArray(formData.images) ? formData.images : []
    };
    
    // Actualizar localmente
    updateData(prev => ({ 
      ...prev, 
      products: editingId 
        ? prev.products.map(p => p.id === editingId ? productToSave : p) 
        : [...prev.products, productToSave] 
    }));

    // Sincronizar con Supabase
    await syncProduct(productToSave);
    
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

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Catálogo</h2>
          <p className="text-brand-dark/60 font-medium">Gestión de productos por categoría</p>
        </div>
        <button onClick={() => openModal()} className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg transition-all font-bold group">
          <ICONS.Add />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.products.map(product => {
          const suggestedPrice = calculateFinalPrice(product, data.materials, data.settings.defaultMargin);
          const finalPrice = product.customPrice || suggestedPrice;
          return (
            <div key={product.id} className="bg-white rounded-[2rem] shadow-sm border border-brand-beige overflow-hidden flex flex-col group hover:shadow-xl transition-all">
              <div className="h-48 bg-brand-white relative overflow-hidden flex items-center justify-center">
                {product.images?.[0] ? (
                  <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt={product.name} />
                ) : <span className="text-5xl opacity-10">🧺</span>}
                <div className="absolute top-4 left-4 bg-brand-sage text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
                  ${finalPrice.toFixed(0)}
                  {product.customPrice && <span className="ml-1 opacity-70"> (Manual)</span>}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                  className="absolute top-4 right-4 bg-brand-red/80 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-brand-dark mb-1">{product.name}</h3>
                <p className="text-brand-dark/70 text-[11px] line-clamp-2 mb-4 italic flex-1">{product.description || 'Sin descripción.'}</p>
                <button onClick={() => openModal(product)} className="w-full bg-brand-white border border-brand-beige hover:bg-brand-beige text-brand-dark font-bold py-2 rounded-xl text-xs transition-colors">Configurar</button>
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-brand-beige animate-slideUp">
            <div className="p-6 flex justify-between items-center border-b border-brand-white">
               <h3 className="text-xl font-bold text-brand-dark">{editingId ? 'Editar' : 'Nuevo'} Producto</h3>
               <button onClick={closeModal} className="text-brand-dark font-bold hover:text-brand-red transition-colors p-2">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Lado Izquierdo: Datos Básicos e Imágenes */}
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-brand-sage uppercase tracking-[0.3em] border-b border-brand-white pb-2">Datos Básicos</h4>
                    <div>
                        <label className="block text-[10px] font-black text-brand-dark/60 uppercase tracking-widest mb-2">Categoría</label>
                        <select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-bold text-brand-dark">
                            <option value="">Sin Categoría</option>
                            {data.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-brand-dark/60 uppercase tracking-widest mb-2">Nombre</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-bold text-brand-dark" placeholder="Ej: Babero Bandana" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-brand-dark/60 uppercase tracking-widest mb-2">Precio Final Manual (Opcional)</label>
                        <input 
                          type="number" 
                          value={formData.customPrice || ''} 
                          onChange={e => setFormData({ ...formData, customPrice: e.target.value ? Number(e.target.value) : undefined })} 
                          className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-bold text-brand-sage" 
                          placeholder="Si queda vacío, usa el sugerido" 
                        />
                        <p className="text-[9px] text-brand-greige mt-1 italic">Si ingresas un valor aquí, se ignorará el cálculo automático de materiales + margen.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-brand-sage uppercase tracking-[0.3em] border-b border-brand-white pb-2">Galería (Fotos Producto)</h4>
                    <div className="grid grid-cols-3 gap-3">
                        {formData.images?.map((img, idx) => (
                            <div key={idx} className="aspect-square rounded-xl overflow-hidden relative group border border-brand-beige shadow-sm">
                                <img src={img} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => setFormData({...formData, images: formData.images?.filter((_, i) => i !== idx)})} className="absolute top-1 right-1 bg-brand-red text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-[8px]">✕</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-brand-beige flex items-center justify-center text-brand-greige hover:bg-brand-white transition-colors">
                            <span className="text-xl">+</span>
                        </button>
                    </div>
                    <input type="file" ref={imageInputRef} onChange={handleProductImageUpload} className="hidden" accept="image/*" multiple />
                  </div>
                </div>

                {/* Centro: Materiales */}
                <div className="space-y-8 lg:border-x lg:px-10 border-brand-white">
                  <div className="flex justify-between items-center border-b border-brand-white pb-2">
                    <h4 className="text-[10px] font-black text-brand-sage uppercase tracking-[0.3em]">Materiales</h4>
                    <button type="button" onClick={addMaterialRequirement} className="bg-brand-dark text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">+ Añadir</button>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {formData.materials.map((req, idx) => {
                        const material = data.materials.find(m => m.id === req.materialId);
                        const isMeters = material?.unit === MaterialUnit.METERS;
                        return (
                            <div key={idx} className="bg-brand-white/50 p-4 rounded-2xl border border-brand-beige relative group">
                                <button type="button" onClick={() => setFormData({ ...formData, materials: formData.materials.filter((_, i) => i !== idx) })} className="absolute -top-2 -right-2 bg-white text-brand-red w-6 h-6 rounded-full shadow-md border border-brand-beige text-[10px]">✕</button>
                                <select value={req.materialId} onChange={e => {
                                    const newMats = [...formData.materials];
                                    newMats[idx].materialId = e.target.value;
                                    setFormData({ ...formData, materials: newMats });
                                }} className="w-full mb-3 text-xs font-bold bg-white border border-brand-beige rounded-lg p-2 outline-none">
                                    {data.materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                {isMeters ? (
                                    <div className="flex gap-2">
                                        <input type="number" placeholder="Ancho cm" value={req.widthCm || ''} onChange={e => {
                                            const newMats = [...formData.materials];
                                            newMats[idx].widthCm = Number(e.target.value);
                                            setFormData({ ...formData, materials: newMats });
                                        }} className="w-1/2 text-[10px] p-2 rounded-lg border border-brand-beige" />
                                        <input type="number" placeholder="Largo cm" value={req.heightCm || ''} onChange={e => {
                                            const newMats = [...formData.materials];
                                            newMats[idx].heightCm = Number(e.target.value);
                                            setFormData({ ...formData, materials: newMats });
                                        }} className="w-1/2 text-[10px] p-2 rounded-lg border border-brand-beige" />
                                    </div>
                                ) : (
                                    <input type="number" placeholder="Cantidad" value={req.quantity} onChange={e => {
                                        const newMats = [...formData.materials];
                                        newMats[idx].quantity = Number(e.target.value);
                                        setFormData({ ...formData, materials: newMats });
                                    }} className="w-full text-[10px] p-2 rounded-lg border border-brand-beige" />
                                )}
                            </div>
                        );
                    })}
                  </div>
                  <div className="bg-brand-dark p-6 rounded-[2rem] text-white flex justify-between items-center shadow-lg">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Precio Sugerido</p>
                      <p className="text-2xl font-bold">${calculateFinalPrice(formData, data.materials, data.settings.defaultMargin).toFixed(0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-60">Costo</p>
                      <p className="text-lg font-bold text-brand-sage">${calculateProductCost(formData, data.materials).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Derecha: Telas / Diseños */}
                <div className="space-y-8">
                  <h4 className="text-[10px] font-black text-brand-sage uppercase tracking-[0.3em] border-b border-brand-white pb-2">Opciones de Tela / Estampados</h4>
                  <div className="grid grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {formData.designOptions?.map((design, idx) => (
                        <div key={design.id} className="bg-brand-white p-2 rounded-2xl border border-brand-beige relative group">
                             <div className="aspect-square rounded-xl overflow-hidden mb-2">
                                <img src={design.image} className="w-full h-full object-cover" />
                             </div>
                             <input type="text" value={design.name} onChange={e => {
                                 const newD = [...formData.designOptions!];
                                 newD[idx].name = e.target.value;
                                 setFormData({ ...formData, designOptions: newD });
                             }} className="w-full text-[9px] font-bold text-center border-none bg-transparent outline-none uppercase tracking-widest" />
                             <button type="button" onClick={() => setFormData({...formData, designOptions: formData.designOptions?.filter(d => d.id !== design.id)})} className="absolute -top-1 -right-1 bg-brand-red text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => designInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-brand-beige flex flex-col items-center justify-center text-brand-greige hover:bg-brand-white transition-colors gap-2">
                        <span className="text-2xl">+</span>
                        <span className="text-[8px] font-black uppercase tracking-widest">Añadir Tela</span>
                    </button>
                    <input type="file" ref={designInputRef} onChange={handleDesignUpload} className="hidden" accept="image/*" />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-brand-white">
                <button type="button" onClick={closeModal} className="flex-1 py-4 text-brand-dark/50 font-bold">Cancelar</button>
                <button type="submit" className="flex-[2] bg-brand-sage text-white py-4 rounded-2xl font-bold shadow-xl hover:bg-brand-dark transition-all">
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
