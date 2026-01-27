
import React, { useState, useRef } from 'react';
import { AppData, Product, ProductMaterialRequirement, MaterialUnit } from '../types';
import { ICONS } from '../constants';
import { generateDescriptionFromMaterials } from '../services/geminiService';
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
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const initialFormState: Partial<Product> = {
    name: '',
    description: '',
    materials: [],
    baseLaborCost: 0,
    images: []
  };

  const [formData, setFormData] = useState<Partial<Product>>(initialFormState);

  // Función para comprimir imágenes antes de subir
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          // Exportar como JPEG comprimido
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
      };
    });
  };

  const handleGenerateAI = async () => {
    if (!formData.name) return alert("Por favor, ingresa el nombre del producto.");
    
    setIsGenerating(true);
    try {
      const desc = await generateDescriptionFromMaterials(
        formData.name,
        formData.materials || [],
        data.materials
      );
      setFormData(prev => ({ ...prev, description: desc }));
    } catch (e: any) {
      console.error(e);
      if (confirm("Hubo un problema de conexión con la IA. ¿Deseas configurar tu clave de API para solucionar el acceso?")) {
        try {
          await (window as any).aistudio.openSelectKey();
          alert("Clave configurada. Por favor, intenta generar la descripción nuevamente.");
        } catch (keyError) {
          alert("No se pudo abrir el configurador de claves.");
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const compressedImages = await Promise.all(
      Array.from(files).map(file => compressImage(file))
    );

    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...compressedImages]
    }));

    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== index)
    }));
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.products.map(p => ({
      ID: p.id,
      Nombre: p.name,
      Descripcion: p.description,
      CostoManoObra: p.baseLaborCost,
      MaterialesJSON: JSON.stringify(p.materials)
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Catalogo_Productos");
    XLSX.writeFile(wb, "Lala_Catalogo.xlsx");
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

        const updatedProducts: Product[] = importedData.map(row => ({
          id: row.ID || crypto.randomUUID(),
          name: row.Nombre || 'Sin nombre',
          description: row.Descripcion || '',
          baseLaborCost: Number(row.CostoManoObra) || 0,
          materials: row.MaterialesJSON ? JSON.parse(row.MaterialesJSON) : [],
          images: []
        }));

        if (confirm(`Se han detectado ${updatedProducts.length} productos. ¿Deseas sobreescribir el catálogo actual?`)) {
          updateData(prev => ({ ...prev, products: updatedProducts }));
        }
      } catch (err) {
        alert("Error procesando el archivo Excel.");
      }
    };
    reader.readAsBinaryString(file as Blob);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      updatedMaterials[index] = { ...updatedMaterials[index], [field]: value };
      return { ...prev, materials: updatedMaterials };
    });
  };

  const calculateRequirementCost = (req: ProductMaterialRequirement) => {
    const material = data.materials.find(m => m.id === req.materialId);
    if (!material) return 0;
    if (material.unit === MaterialUnit.METERS && req.widthCm && req.heightCm && material.widthCm) {
        const areaNeeded = req.widthCm * req.heightCm;
        const areaOneMeter = material.widthCm * 100;
        return material.costPerUnit * (areaNeeded / areaOneMeter);
    }
    return material.costPerUnit * req.quantity;
  };

  const calculateProductCost = (product: Product | Partial<Product>) => {
    const materialsCost = (product.materials || []).reduce((acc, req) => acc + calculateRequirementCost(req), 0);
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
      baseLaborCost: Number(formData.baseLaborCost) || 0,
      images: formData.images || []
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
          <p className="text-brand-greige font-medium">Gestiona tus productos y sus fotos</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" accept=".xlsx, .xls" ref={fileInputRef} onChange={importFromExcel} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-brand-white hover:bg-brand-beige text-brand-dark px-6 py-4 rounded-2xl border border-brand-beige transition-all font-bold text-sm">📥 Importar</button>
          <button onClick={exportToExcel} className="bg-brand-white hover:bg-brand-beige text-brand-dark px-6 py-4 rounded-2xl border border-brand-beige transition-all font-bold text-sm">📤 Exportar</button>
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg transition-all font-bold group">
            <ICONS.Add />
            <span>Crear Producto</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.products.length > 0 ? data.products.map(product => {
          const cost = calculateProductCost(product);
          return (
            <div key={product.id} className="bg-white rounded-[2.5rem] shadow-sm border border-brand-beige overflow-hidden flex flex-col group hover:shadow-xl transition-all">
              <div className="h-56 bg-brand-white relative overflow-hidden flex items-center justify-center">
                {product.images && product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <span className="text-6xl grayscale opacity-20">🧺</span>
                )}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full text-[10px] font-black uppercase text-brand-sage border border-brand-sage/20">
                    Costo: ${cost.toFixed(2)}
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-brand-dark mb-2">{product.name}</h3>
                <p className="text-brand-greige text-xs line-clamp-2 mb-6 italic leading-relaxed flex-1">
                  {product.description || 'Sin descripción.'}
                </p>
                <div className="flex gap-4">
                  <button onClick={() => { setEditingId(product.id); setFormData(product); setIsModalOpen(true); }} className="flex-1 bg-brand-white hover:bg-brand-beige text-brand-dark font-bold py-3 rounded-xl text-xs transition-colors">Editar</button>
                  <button onClick={() => { if(confirm('¿Eliminar?')) updateData(prev => ({...prev, products: prev.products.filter(p => p.id !== product.id)})); }} className="px-4 text-brand-red opacity-30 hover:opacity-100">🗑️</button>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-brand-beige">
            <p className="text-brand-greige italic">Tu catálogo está vacío.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-brand-beige animate-slideUp">
            <div className="p-8 flex justify-between items-center border-b border-brand-white bg-brand-white/20">
               <h3 className="text-2xl font-bold text-brand-dark">{editingId ? 'Editar' : 'Nuevo'} Producto</h3>
               <button onClick={closeModal} className="text-brand-greige hover:text-brand-dark font-bold">Cerrar</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 md:p-12">
              <form onSubmit={handleSave} className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    {/* Información Básica */}
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Nombre</label>
                        <input type="text" required value={formData.name} onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-6 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:bg-white transition-all font-bold text-brand-dark" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-black text-brand-greige uppercase tracking-widest">Descripción</label>
                          <button type="button" onClick={handleGenerateAI} disabled={isGenerating} className={`text-[9px] font-black px-3 py-1 rounded-full border ${isGenerating ? 'bg-brand-white text-brand-greige' : 'bg-brand-sage/10 text-brand-sage border-brand-sage/50 hover:bg-brand-sage hover:text-white transition-all'}`}>
                            {isGenerating ? 'Escribiendo...' : '✨ Autocompletar'}
                          </button>
                        </div>
                        <textarea rows={4} value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full px-6 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:bg-white text-sm" />
                      </div>
                    </div>

                    {/* Galería de Imágenes */}
                    <div className="bg-brand-white/50 p-8 rounded-[2rem] border border-brand-beige space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Galería de Fotos</label>
                        <button type="button" onClick={() => imageInputRef.current?.click()} className="text-[9px] font-black bg-brand-dark text-white px-3 py-1.5 rounded-full hover:bg-brand-sage transition-all">
                          SUBIR FOTOS
                        </button>
                      </div>
                      <input type="file" multiple accept="image/*" ref={imageInputRef} onChange={handleImageUpload} className="hidden" />
                      <div className="grid grid-cols-4 gap-3">
                        {(formData.images || []).map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-xl overflow-hidden relative group border border-brand-beige">
                            <img src={img} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 bg-brand-red/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">ELIMINAR</button>
                          </div>
                        ))}
                        <div onClick={() => imageInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-brand-beige flex items-center justify-center text-2xl text-brand-greige cursor-pointer hover:bg-white transition-colors">
                          +
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Costos y Materiales */}
                    <div className="bg-brand-white p-8 rounded-[2rem] border border-brand-beige space-y-6">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-brand-dark uppercase tracking-widest">Composición Técnica</label>
                        <button type="button" onClick={handleAddMaterial} className="text-[10px] bg-brand-sage text-white font-black px-4 py-2 rounded-full hover:bg-brand-dark transition-all">+ MATERIAL</button>
                      </div>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {(formData.materials || []).map((req, idx) => {
                          const material = data.materials.find(m => m.id === req.materialId);
                          return (
                            <div key={idx} className="bg-white p-4 rounded-2xl flex items-center gap-3 border border-brand-beige/30">
                              <select value={req.materialId} onChange={e => updateMaterialRequirement(idx, 'materialId', e.target.value)} className="flex-1 text-[11px] font-bold border-none outline-none bg-brand-white rounded-lg px-2 py-1">
                                {data.materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                              </select>
                              {material?.unit === MaterialUnit.METERS ? (
                                <div className="flex gap-1">
                                  <input type="number" placeholder="W" value={req.widthCm} onChange={e => updateMaterialRequirement(idx, 'widthCm', Number(e.target.value))} className="w-12 text-[11px] text-center border-b border-brand-beige" />
                                  <input type="number" placeholder="H" value={req.heightCm} onChange={e => updateMaterialRequirement(idx, 'heightCm', Number(e.target.value))} className="w-12 text-[11px] text-center border-b border-brand-beige" />
                                </div>
                              ) : (
                                <input type="number" value={req.quantity} onChange={e => updateMaterialRequirement(idx, 'quantity', Number(e.target.value))} className="w-12 text-[11px] text-center border-b border-brand-beige" />
                              )}
                              <button type="button" onClick={() => setFormData(prev => ({...prev, materials: (prev.materials || []).filter((_, i) => i !== idx)}))} className="text-brand-red opacity-30 hover:opacity-100">✕</button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-4 border-t border-brand-beige/50">
                        <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Costo Mano de Obra ($)</label>
                        <input type="number" value={formData.baseLaborCost} onChange={e => setFormData(prev => ({ ...prev, baseLaborCost: Number(e.target.value) }))} className="w-full px-4 py-3 rounded-xl border border-brand-beige outline-none font-bold" />
                      </div>
                    </div>
                    
                    <div className="text-right p-6 bg-brand-dark rounded-[2rem] text-white">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Inversión Estimada (Costo)</p>
                      <p className="text-4xl font-bold">${calculateProductCost(formData).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-6 pt-8 pb-4">
                  <button type="button" onClick={closeModal} className="flex-1 py-5 text-brand-greige font-bold">Cancelar</button>
                  <button type="submit" className="flex-[2] bg-brand-sage text-white py-5 rounded-3xl font-bold shadow-xl hover:bg-brand-dark transition-all">Guardar en el Catálogo</button>
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
