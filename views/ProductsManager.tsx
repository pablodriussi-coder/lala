
import React, { useState, useRef, useMemo } from 'react';
import { AppData, Product, ProductMaterialRequirement, DesignOption } from '../types';
import { ICONS } from '../constants';
import { calculateFinalPrice } from '../services/calculationService';

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
          // Reducimos tamaño máximo para mayor eficiencia
          const MAX_SIZE = 400; 
          let width = img.width;
          let height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
      };
    });
  };

  // Fixed type error: Argument of type 'unknown' is not assignable to parameter of type 'File'
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const compressed = await Promise.all(Array.from(files).map((f: File) => compressImage(f)));
    setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...compressed] }));
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleDesignUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const base64 = await compressImage(file, 0.4);
    
    const currentCount = (formData.designOptions?.length || 0) + 1;
    const defaultName = `Opción ${currentCount}`;
    const name = prompt("Nombre del diseño (ej: Tusor Celeste):", defaultName);
    
    const newDesign: DesignOption = { 
      id: crypto.randomUUID(), 
      name: name || defaultName, 
      image: base64 
    };

    setFormData(prev => ({
      ...prev,
      designOptions: [...(prev.designOptions || []), newDesign]
    }));
    
    if (designInputRef.current) designInputRef.current.value = '';
  };

  const handleRenameDesign = (id: string, currentName: string) => {
    const newName = prompt("Nuevo nombre para la tela:", currentName);
    if (newName && newName !== currentName) {
      setFormData(prev => ({
        ...prev,
        designOptions: (prev.designOptions || []).map(d => 
          d.id === id ? { ...d, name: newName } : d
        )
      }));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
        alert("El nombre del producto es obligatorio.");
        return;
    }

    const productToSave: Product = {
      ...formData,
      id: editingId || crypto.randomUUID(),
      baseLaborCost: Number(formData.baseLaborCost) || 0,
      materials: formData.materials || [],
      designOptions: Array.isArray(formData.designOptions) ? formData.designOptions : [],
      images: Array.isArray(formData.images) ? formData.images : []
    };
    
    console.log("Guardando producto localmente...");
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
        materials: Array.isArray(product.materials) ? product.materials : [],
        designOptions: Array.isArray(product.designOptions) ? product.designOptions : [],
        images: Array.isArray(product.images) ? product.images : []
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

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Catálogo</h2>
          <p className="text-brand-greige font-medium">Gestión de productos y telas</p>
        </div>
        <button onClick={() => openModal()} className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg transition-all font-bold group">
          <ICONS.Add />
          <span>Nuevo Producto</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.products.map(product => {
          const calculatedPrice = calculateFinalPrice(product, data.materials, data.settings.defaultMargin);
          return (
            <div key={product.id} className="bg-white rounded-[2rem] shadow-sm border border-brand-beige overflow-hidden flex flex-col group hover:shadow-xl transition-all">
              <div className="h-48 bg-brand-white relative overflow-hidden flex items-center justify-center">
                {product.images?.[0] ? (
                  <img src={product.images[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : <span className="text-5xl opacity-10">🧺</span>}
                <div className="absolute top-4 left-4 bg-brand-sage text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
                  ${calculatedPrice.toFixed(0)}
                </div>
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-brand-dark mb-1">{product.name}</h3>
                <p className="text-brand-greige text-[11px] line-clamp-2 mb-4 italic flex-1">{product.description || 'Sin descripción.'}</p>
                <div className="flex justify-between items-center mt-auto gap-4">
                    <span className="text-[9px] font-black uppercase text-brand-sage">{product.designOptions?.length || 0} telas</span>
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
               <button onClick={closeModal} className="text-brand-greige font-bold">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Nombre Comercial</label>
                    <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-bold" placeholder="Ej: Babero Bandana" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Precio de Mano de Obra ($)</label>
                    <input type="number" value={formData.baseLaborCost} onChange={e => setFormData({ ...formData, baseLaborCost: Number(e.target.value) })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Fotos Generales</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {formData.images?.map((img, i) => (
                            <div key={i} className="w-14 h-14 rounded-lg overflow-hidden relative group">
                                <img src={img} className="w-full h-full object-cover" />
                                <button onClick={() => setFormData({...formData, images: formData.images?.filter((_, idx) => idx !== i)})} className="absolute inset-0 bg-brand-red/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] font-bold">QUITAR</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="w-14 h-14 rounded-lg border-2 border-dashed border-brand-beige flex items-center justify-center text-xl text-brand-greige hover:bg-brand-white transition-colors">+</button>
                    </div>
                    <input type="file" multiple accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                  </div>
                </div>

                <div className="bg-brand-white/50 p-6 rounded-[2rem] border border-brand-beige">
                  <div className="flex justify-between items-center mb-6">
                    <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Muestrario de Telas</label>
                    <button type="button" onClick={() => designInputRef.current?.click()} className="text-[9px] font-black bg-brand-sage text-white px-3 py-1.5 rounded-full hover:bg-brand-dark transition-all">AÑADIR TELA</button>
                  </div>
                  <input type="file" accept="image/*" ref={designInputRef} onChange={handleDesignUpload} className="hidden" />
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-2">
                    {formData.designOptions?.map((design, i) => (
                      <div key={design.id} className="bg-white p-2 rounded-xl border border-brand-beige relative group flex flex-col items-center">
                        <div className="w-full aspect-square rounded-lg overflow-hidden mb-1">
                          <img src={design.image} className="w-full h-full object-cover" />
                        </div>
                        <button 
                            type="button"
                            onClick={() => handleRenameDesign(design.id, design.name)}
                            className="text-[9px] font-bold text-brand-dark truncate w-full text-center hover:text-brand-sage transition-colors cursor-pointer"
                            title="Haz clic para renombrar"
                        >
                            {design.name} ✏️
                        </button>
                        <button type="button" onClick={() => setFormData({...formData, designOptions: formData.designOptions?.filter((_, idx) => idx !== i)})} className="absolute -top-1 -right-1 bg-brand-red text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm transition-opacity">✕</button>
                      </div>
                    ))}
                    {(!formData.designOptions || formData.designOptions.length === 0) && (
                        <div className="col-span-full py-8 text-center text-brand-greige italic text-xs opacity-50">Carga aquí los diseños disponibles.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-brand-white flex gap-4 bg-brand-white/50">
                <button type="button" onClick={closeModal} className="flex-1 py-4 text-brand-greige font-bold">Cancelar</button>
                <button onClick={handleSave} className="flex-[2] bg-brand-sage text-white py-4 rounded-2xl font-bold shadow-xl">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsManager;
