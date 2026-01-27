
import React, { useState, useRef } from 'react';
import { AppData, Category } from '../types';
import { ICONS } from '../constants';

interface CategoriesManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const CategoriesManager: React.FC<CategoriesManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Category>>({ name: '', image: '' });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 500;
          let width = img.width, height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await compressImage(file);
    setFormData({ ...formData, image: base64 });
  };

  const handleSave = () => {
    if (!formData.name) return;
    const newCategory: Category = {
      id: editingId || crypto.randomUUID(),
      name: formData.name,
      image: formData.image
    };
    updateData(prev => ({
      ...prev,
      categories: editingId 
        ? prev.categories.map(c => c.id === editingId ? newCategory : c)
        : [...prev.categories, newCategory]
    }));
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', image: '' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark">Categorías</h2>
          <p className="text-brand-greige font-medium">Organiza tu catálogo para los clientes</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand-sage text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2">
          <ICONS.Add /> Nueva Categoría
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {data.categories.map(cat => (
          <div key={cat.id} className="bg-white p-4 rounded-[2rem] border border-brand-beige shadow-sm hover:shadow-lg transition-all group relative">
            <div className="aspect-square bg-brand-white rounded-2xl overflow-hidden mb-3">
              {cat.image ? (
                <img src={cat.image} className="w-full h-full object-cover" />
              ) : <div className="w-full h-full flex items-center justify-center text-4xl grayscale opacity-10">📂</div>}
            </div>
            <h3 className="text-xs font-black text-center text-brand-dark uppercase tracking-widest truncate">{cat.name}</h3>
            <button onClick={() => { setEditingId(cat.id); setFormData(cat); setIsModalOpen(true); }} className="absolute inset-0 bg-brand-sage/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] flex items-center justify-center text-white font-bold text-xs uppercase">Editar</button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-brand-beige animate-slideUp">
            <h3 className="text-xl font-bold text-brand-dark mb-6">{editingId ? 'Editar' : 'Nueva'} Categoría</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Nombre</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-bold" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Imagen Portada</label>
                <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-brand-white rounded-2xl border-2 border-dashed border-brand-beige flex items-center justify-center cursor-pointer overflow-hidden">
                  {formData.image ? <img src={formData.image} className="w-full h-full object-cover" /> : <span className="text-3xl text-brand-greige">+</span>}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={closeModal} className="flex-1 font-bold text-brand-greige">Cancelar</button>
                <button onClick={handleSave} className="flex-[2] bg-brand-sage text-white py-3 rounded-xl font-bold">Guardar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;
