
import React, { useState } from 'react';
import { AppData, Material, MaterialUnit } from '../types';
import { ICONS } from '../constants';

interface MaterialsManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const MaterialsManager: React.FC<MaterialsManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Material>>({
    name: '',
    unit: MaterialUnit.METERS,
    costPerUnit: 0,
    widthCm: 150
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newMaterial: Material = {
      id: editingId || crypto.randomUUID(),
      name: formData.name || 'Sin nombre',
      unit: formData.unit as MaterialUnit || MaterialUnit.METERS,
      costPerUnit: Number(formData.costPerUnit) || 0,
      widthCm: formData.unit === MaterialUnit.METERS ? (Number(formData.widthCm) || 150) : undefined
    };

    updateData(prev => ({
      ...prev,
      materials: editingId 
        ? prev.materials.map(m => m.id === editingId ? newMaterial : m)
        : [...prev.materials, newMaterial]
    }));

    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', unit: MaterialUnit.METERS, costPerUnit: 0, widthCm: 150 });
  };

  const openEdit = (material: Material) => {
    setEditingId(material.id);
    setFormData(material);
    setIsModalOpen(true);
  };

  const deleteMaterial = (id: string) => {
    if (confirm('¿Estás segura de eliminar este material?')) {
        updateData(prev => ({
            ...prev,
            materials: prev.materials.filter(m => m.id !== id)
        }));
    }
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Insumos</h2>
          <p className="text-brand-greige font-medium">Telas, hilos, broches y rellenos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-sage/20 transition-all font-bold group"
        >
          <ICONS.Add />
          <span className="group-hover:translate-x-1 transition-transform">Nuevo Material</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-brand-beige overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-white">
              <th className="px-8 py-6 font-black text-brand-greige uppercase tracking-widest text-[10px]">Descripción</th>
              <th className="px-8 py-6 font-black text-brand-greige uppercase tracking-widest text-[10px]">Unidad / Ancho</th>
              <th className="px-8 py-6 font-black text-brand-greige uppercase tracking-widest text-[10px]">Costo Unitario</th>
              <th className="px-8 py-6 font-black text-brand-greige uppercase tracking-widest text-[10px] text-right">Gestión</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-beige">
            {data.materials.length > 0 ? data.materials.map((m) => (
              <tr key={m.id} className="hover:bg-brand-white/50 transition-colors group">
                <td className="px-8 py-5 font-bold text-brand-dark">{m.name}</td>
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-brand-dark">{m.unit === 'm' ? 'Metro lineal' : m.unit === 'u' ? 'Unidad' : 'Kilogramo'}</span>
                    {m.unit === 'm' && <span className="text-[10px] text-brand-greige font-bold">Ancho: {m.widthCm} cm</span>}
                  </div>
                </td>
                <td className="px-8 py-5 font-bold text-brand-sage">${m.costPerUnit.toFixed(2)}</td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button onClick={() => openEdit(m)} className="text-brand-greige hover:text-brand-dark font-bold text-sm">Editar</button>
                  <span className="text-brand-beige">|</span>
                  <button onClick={() => deleteMaterial(m.id)} className="text-brand-red opacity-60 hover:opacity-100 font-bold text-sm">Borrar</button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center text-brand-greige italic">No hay insumos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-brand-beige animate-slideUp">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-brand-dark">{editingId ? 'Actualizar' : 'Registrar'} Material</h3>
                <span className="text-brand-red">★</span>
              </div>
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Nombre del Insumo</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige focus:border-brand-sage focus:ring-0 outline-none transition-all placeholder:text-brand-greige/50"
                    placeholder="Ej: Tela Muselina Sage"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Unidad de Medida</label>
                    <select 
                      value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value as MaterialUnit })}
                      className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige focus:border-brand-sage outline-none"
                    >
                      <option value={MaterialUnit.METERS}>Metros (m)</option>
                      <option value={MaterialUnit.UNITS}>Unidades (u)</option>
                      <option value={MaterialUnit.KILOGRAMS}>Kilos (kg)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Precio de Costo</label>
                    <input 
                      type="number" step="0.01" required
                      value={formData.costPerUnit}
                      onChange={e => setFormData({ ...formData, costPerUnit: Number(e.target.value) })}
                      className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige focus:border-brand-sage outline-none"
                    />
                  </div>
                </div>

                {formData.unit === MaterialUnit.METERS && (
                   <div className="animate-fadeIn">
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Ancho Comercial (cm)</label>
                    <input 
                      type="number" required
                      value={formData.widthCm}
                      onChange={e => setFormData({ ...formData, widthCm: Number(e.target.value) })}
                      className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige focus:border-brand-sage outline-none font-bold"
                    />
                    <p className="text-[10px] text-brand-greige mt-2 italic">Esto servirá para calcular el costo por retazos en los productos.</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-4 text-brand-greige font-bold hover:text-brand-dark transition-colors">Cerrar</button>
                  <button type="submit" className="flex-[2] bg-brand-sage text-white py-4 rounded-2xl font-bold shadow-xl shadow-brand-sage/10 hover:bg-brand-dark transition-all">
                    Confirmar Guardado
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

export default MaterialsManager;
