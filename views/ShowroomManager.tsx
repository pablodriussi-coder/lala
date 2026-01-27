
import React, { useState, useRef } from 'react';
import { AppData, ShowroomEntry, ShowroomEntryType } from '../types';
import { syncShowroomEntry, deleteShowroomEntry } from '../store';
import { ICONS } from '../constants';

interface ShowroomManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const ShowroomManager: React.FC<ShowroomManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<ShowroomEntry>>({
    title: '',
    content: '',
    type: 'tip',
    image: '',
    date: Date.now()
  });

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          let width = img.width, height = img.height;
          if (width > height) { if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } }
          else { if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; } }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) return;

    const newEntry: ShowroomEntry = {
      id: editingId || crypto.randomUUID(),
      title: formData.title,
      content: formData.content,
      type: formData.type as ShowroomEntryType,
      image: formData.image,
      date: formData.date || Date.now()
    };

    updateData(prev => ({
      ...prev,
      showroomEntries: editingId 
        ? prev.showroomEntries.map(e => e.id === editingId ? newEntry : e)
        : [...prev.showroomEntries, newEntry]
    }));

    await syncShowroomEntry(newEntry);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', content: '', type: 'tip', image: '', date: Date.now() });
  };

  const removeEntry = async (id: string) => {
    if (confirm('¿Eliminar esta entrada permanentemente?')) {
      updateData(prev => ({
        ...prev,
        showroomEntries: prev.showroomEntries.filter(e => e.id !== id)
      }));
      await deleteShowroomEntry(id);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Showroom & Blog</h2>
          <p className="text-brand-dark/60 font-medium">Gestión de actividades, clases y artículos del blog</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg transition-all font-bold">
          <ICONS.Add />
          <span>Nueva Entrada</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.showroomEntries.map(entry => (
          <div key={entry.id} className="bg-white rounded-[2rem] shadow-sm border border-brand-beige overflow-hidden flex flex-col group hover:shadow-xl transition-all">
            <div className="h-40 bg-brand-white relative overflow-hidden flex items-center justify-center">
              {entry.image ? (
                <img src={entry.image} className="w-full h-full object-cover" alt={entry.title} />
              ) : <span className="text-4xl grayscale opacity-10">📖</span>}
              <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm text-brand-dark px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{entry.type}</div>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-brand-dark mb-1 line-clamp-1">{entry.title}</h3>
              <p className="text-brand-dark/70 text-[11px] line-clamp-2 mb-4 italic flex-1">{entry.content}</p>
              <div className="flex justify-between items-center mt-auto">
                <span className="text-[9px] font-black uppercase text-brand-greige">{new Date(entry.date).toLocaleDateString()}</span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(entry.id); setFormData(entry); setIsModalOpen(true); }} className="text-brand-sage font-black text-[10px] uppercase hover:underline">Editar</button>
                  <button onClick={() => removeEntry(entry.id)} className="text-brand-red font-black text-[10px] uppercase hover:underline">Borrar</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col border border-brand-beige animate-slideUp">
            <div className="p-6 flex justify-between items-center border-b border-brand-white">
               <h3 className="text-xl font-bold text-brand-dark">{editingId ? 'Editar' : 'Nueva'} Entrada de Showroom</h3>
               <button onClick={closeModal} className="text-brand-dark font-bold hover:text-brand-red transition-colors">✕</button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-brand-dark/60 uppercase tracking-widest mb-2">Tipo de Entrada</label>
                  <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value as ShowroomEntryType })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-bold">
                      <option value="clase">Clase / Taller</option>
                      <option value="exposicion">Exposición de Productos</option>
                      <option value="tip">Consejo / Blog</option>
                      <option value="evento">Evento Especial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand-dark/60 uppercase tracking-widest mb-2">Fecha</label>
                  <input type="date" value={new Date(formData.date || Date.now()).toISOString().split('T')[0]} onChange={e => setFormData({ ...formData, date: new Date(e.target.value).getTime() })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-bold" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-dark/60 uppercase tracking-widest mb-2">Título de la Actividad o Artículo</label>
                <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-bold" placeholder="Ej: Taller de Costura Inicial" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-dark/60 uppercase tracking-widest mb-2">Contenido / Descripción</label>
                <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none font-medium h-32" placeholder="Describe la actividad o escribe los consejos aquí..." />
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-dark/60 uppercase tracking-widest mb-2">Imagen Representativa</label>
                <div onClick={() => fileInputRef.current?.click()} className="aspect-video bg-brand-white rounded-2xl border-2 border-dashed border-brand-beige flex items-center justify-center cursor-pointer overflow-hidden group">
                  {formData.image ? <img src={formData.image} className="w-full h-full object-cover" alt="preview" /> : <span className="text-2xl text-brand-greige">+ Subir Foto</span>}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 text-brand-dark/50 font-bold">Cancelar</button>
                <button type="submit" className="flex-[2] bg-brand-sage text-white py-4 rounded-2xl font-bold shadow-lg">Confirmar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowroomManager;
