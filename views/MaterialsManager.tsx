
import React, { useState, useRef } from 'react';
import { AppData, Material, MaterialUnit } from '../types';
import { ICONS } from '../constants';
import { syncMaterialsBatch } from '../store';
import * as XLSX from 'xlsx';

interface MaterialsManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const MaterialsManager: React.FC<MaterialsManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Material>>({
    name: '',
    unit: MaterialUnit.METERS,
    costPerUnit: 0,
    widthCm: 150
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newMaterial: Material = {
      id: editingId || crypto.randomUUID(),
      name: formData.name || 'Sin nombre',
      unit: formData.unit as MaterialUnit || MaterialUnit.METERS,
      costPerUnit: Number(formData.costPerUnit) || 0,
      widthCm: formData.unit === MaterialUnit.METERS ? (Number(formData.widthCm) || 150) : undefined
    };

    // Actualizar localmente
    updateData(prev => {
      const updatedMaterials = editingId 
        ? prev.materials.map(m => m.id === editingId ? newMaterial : m)
        : [...prev.materials, newMaterial];
      
      // Sincronizar con Supabase (usamos el lote completo para materiales ya que es pequeño)
      syncMaterialsBatch(updatedMaterials);
      
      return {
        ...prev,
        materials: updatedMaterials
      };
    });

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

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkPercentage === 0) {
      setIsBulkUpdateModalOpen(false);
      return;
    }

    if (confirm(`¿Estás segura de aplicar un ajuste de ${bulkPercentage > 0 ? '+' : ''}${bulkPercentage}% a todos los materiales?`)) {
      updateData(prev => {
        const updatedMaterials = prev.materials.map(m => ({
          ...m,
          costPerUnit: Number((m.costPerUnit * (1 + bulkPercentage / 100)).toFixed(2))
        }));
        
        syncMaterialsBatch(updatedMaterials);
        
        return {
          ...prev,
          materials: updatedMaterials
        };
      });
      setIsBulkUpdateModalOpen(false);
      setBulkPercentage(0);
    }
  };

  const deleteMaterial = async (id: string) => {
    if (confirm('¿Estás segura de eliminar este material?')) {
        updateData(prev => {
            const updatedMaterials = prev.materials.filter(m => m.id !== id);
            syncMaterialsBatch(updatedMaterials);
            return {
                ...prev,
                materials: updatedMaterials
            };
        });
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.materials.map(m => ({
      ID: m.id,
      Nombre: m.name,
      Unidad: m.unit,
      CostoUnitario: m.costPerUnit,
      AnchoComercialCm: m.widthCm || ''
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Materiales");
    XLSX.writeFile(wb, "Lala_Insumos.xlsx");
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const importedData = XLSX.utils.sheet_to_json(ws) as any[];

        const updatedMaterials: Material[] = importedData.map(row => {
          // Validar que el ID sea un UUID, si no, crear uno nuevo
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          const id = (row.ID && uuidRegex.test(row.ID)) ? row.ID : crypto.randomUUID();
          
          return {
            id,
            name: row.Nombre || 'Sin nombre',
            unit: (row.Unidad || 'm') as MaterialUnit,
            costPerUnit: Number(row.CostoUnitario) || 0,
            widthCm: row.AnchoComercialCm ? Number(row.AnchoComercialCm) : undefined
          };
        });

        if (confirm(`Se han detectado ${updatedMaterials.length} materiales. ¿Deseas sobreescribir la base de datos actual?`)) {
          updateData(prev => ({ ...prev, materials: updatedMaterials }));
          syncMaterialsBatch(updatedMaterials);
        }
      } catch (err) {
        alert("Error procesando el archivo Excel. Verifica el formato.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <div className="space-y-8 animate-fadeIn">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Insumos</h2>
          <p className="text-brand-greige font-medium">Telas, hilos, broches y rellenos</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={importFromExcel} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-brand-white hover:bg-brand-beige text-brand-dark px-6 py-4 rounded-2xl border border-brand-beige transition-all font-bold text-sm">📥 Importar Excel</button>
          <button onClick={exportToExcel} className="bg-brand-white hover:bg-brand-beige text-brand-dark px-6 py-4 rounded-2xl border border-brand-beige transition-all font-bold text-sm">📤 Exportar Excel</button>
          <button onClick={() => setIsBulkUpdateModalOpen(true)} className="bg-brand-white hover:bg-brand-beige text-brand-dark px-6 py-4 rounded-2xl border border-brand-beige transition-all font-bold text-sm">📈 Ajuste Masivo %</button>
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-sage/20 transition-all font-bold group">
            <ICONS.Add />
            <span className="group-hover:translate-x-1 transition-transform">Nuevo Material</span>
          </button>
        </div>
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
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-brand-beige animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="p-10 space-y-8">
              <h3 className="text-2xl font-bold text-brand-dark">{editingId ? 'Actualizar' : 'Registrar'} Material</h3>
              <form onSubmit={handleSave} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Nombre del Insumo</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none" placeholder="Ej: Tela Muselina Sage" />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Unidad</label>
                    <select value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value as MaterialUnit })} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none">
                      <option value={MaterialUnit.METERS}>Metros (m)</option>
                      <option value={MaterialUnit.UNITS}>Unidades (u)</option>
                      <option value={MaterialUnit.KILOGRAMS}>Kilos (kg)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Costo</label>
                    <input type="number" step="0.01" required value={formData.costPerUnit} onChange={e => setFormData({ ...formData, costPerUnit: Number(e.target.value) })} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-4 text-brand-greige font-bold">Cerrar</button>
                  <button type="submit" className="flex-[2] bg-brand-sage text-white py-4 rounded-2xl font-bold hover:bg-brand-dark transition-all">Confirmar Guardado</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {isBulkUpdateModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-brand-beige animate-slideUp max-h-[90vh] overflow-y-auto">
            <div className="p-10 space-y-8">
              <h3 className="text-2xl font-bold text-brand-dark">Ajuste Masivo de Precios</h3>
              <p className="text-sm text-brand-greige">Aumenta o disminuye el costo de <strong>todos</strong> los materiales por un porcentaje.</p>
              <form onSubmit={handleBulkUpdate} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Porcentaje (%)</label>
                  <div className="relative">
                    <input type="number" step="0.1" required value={bulkPercentage || ''} onChange={e => setBulkPercentage(Number(e.target.value))} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold text-brand-dark" placeholder="Ej: 15 o -10" />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-greige font-bold">%</span>
                  </div>
                  <p className="text-[10px] text-brand-greige mt-2 italic">Usa valores positivos para aumentar (ej: 15) o negativos para disminuir (ej: -10).</p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => { setIsBulkUpdateModalOpen(false); setBulkPercentage(0); }} className="flex-1 py-4 text-brand-greige font-bold">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-brand-sage text-white py-4 rounded-2xl font-bold hover:bg-brand-dark transition-all">Aplicar Ajuste</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MaterialsManager;
