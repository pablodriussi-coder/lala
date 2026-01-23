
import React, { useState, useRef } from 'react';
import { AppData, Quote, QuoteItem, Product, Client, Material, MaterialUnit, ProductMaterialRequirement } from '../types';
import { ICONS } from '../constants';
import { generateMarketingText } from '../services/geminiService';
import * as XLSX from 'xlsx';

interface QuotesManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const QuotesManager: React.FC<QuotesManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [quoteForPreview, setQuoteForPreview] = useState<Quote | null>(null);
  const [marketingText, setMarketingText] = useState<string | null>(null);
  const [isGeneratingMarketing, setIsGeneratingMarketing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Quote>>({
    clientId: '',
    profitMarginPercent: data.settings.defaultMargin,
    items: [],
    status: 'pending'
  });

  const calculateRequirementCost = (req: ProductMaterialRequirement) => {
    const material = data.materials.find(m => m.id === req.materialId);
    if (!material) return 0;

    if (material.unit === MaterialUnit.METERS && req.widthCm && req.heightCm && material.widthCm) {
        const areaNeeded = req.widthCm * req.heightCm;
        const areaOneMeter = material.widthCm * 100;
        const usagePercentage = areaNeeded / areaOneMeter;
        return material.costPerUnit * usagePercentage;
    }

    return material.costPerUnit * req.quantity;
  };

  const calculateCosts = (items: QuoteItem[]) => {
    return items.reduce((acc, item) => {
      const product = data.products.find(p => p.id === item.productId);
      if (!product) return acc;
      
      const materialCost = product.materials.reduce((mAcc, req) => {
        return mAcc + calculateRequirementCost(req);
      }, 0);

      const unitCost = materialCost + (Number(product.baseLaborCost) || 0);
      return acc + (unitCost * item.quantity);
    }, 0);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || (formData.items || []).length === 0) return alert('Selecciona cliente y productos.');

    const totalCost = calculateCosts(formData.items || []);
    const marginMultiplier = 1 + (Number(formData.profitMarginPercent) / 100);
    const totalPrice = totalCost * marginMultiplier;

    const quoteData: Quote = {
      id: editingId || crypto.randomUUID(),
      clientId: formData.clientId || '',
      profitMarginPercent: Number(formData.profitMarginPercent) || 0,
      items: formData.items || [],
      createdAt: editingId ? (data.quotes.find(q => q.id === editingId)?.createdAt || Date.now()) : Date.now(),
      totalCost,
      totalPrice,
      status: formData.status as 'pending' | 'accepted' | 'rejected' || 'pending'
    };

    updateData(prev => ({
      ...prev,
      quotes: editingId 
        ? prev.quotes.map(q => q.id === editingId ? quoteData : q)
        : [...prev.quotes, quoteData]
    }));

    closeModal();
  };

  const openEdit = (quote: Quote) => {
    setEditingId(quote.id);
    setFormData(quote);
    setIsModalOpen(true);
  };

  const openPreview = (quote: Quote) => {
    setQuoteForPreview(quote);
    setIsPreviewOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ clientId: '', profitMarginPercent: data.settings.defaultMargin, items: [], status: 'pending' });
    setMarketingText(null);
    setSelectedQuoteId(null);
  };

  const handleGenerateMarketing = async (quote: Quote) => {
    setSelectedQuoteId(quote.id);
    setIsGeneratingMarketing(true);
    const text = await generateMarketingText(quote, data.products, data.materials);
    setMarketingText(text);
    setIsGeneratingMarketing(false);
  };

  const addItem = () => {
    if (data.products.length === 0) return alert('Crea productos primero.');
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { productId: data.products[0].id, quantity: 1 }]
    }));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    setFormData(prev => {
      const updated = [...(prev.items || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, items: updated };
    });
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({ ...prev, items: (prev.items || []).filter((_, i) => i !== index) }));
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToExcel = () => {
    const mainData = data.quotes.map(q => {
      const client = data.clients.find(c => c.id === q.clientId);
      return {
        ID: q.id,
        ClienteID: q.clientId,
        ClienteNombre: client?.name || 'Desconocido',
        MargenGanancia: q.profitMarginPercent,
        FechaCreacion: new Date(q.createdAt).toISOString(),
        CostoTotal: q.totalCost,
        PrecioTotal: q.totalPrice,
        Estado: q.status
      };
    });

    const itemsData: any[] = [];
    data.quotes.forEach(q => {
      q.items.forEach(item => {
        const product = data.products.find(p => p.id === item.productId);
        itemsData.push({
          PresupuestoID: q.id,
          ProductoID: item.productId,
          ProductoNombre: product?.name || 'Desconocido',
          Cantidad: item.quantity,
          PrecioPersonalizado: item.customPrice || ''
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(mainData);
    const ws2 = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, ws1, "Presupuestos");
    XLSX.utils.book_append_sheet(wb, ws2, "ItemsPresupuesto");
    XLSX.writeFile(wb, "Lala_Presupuestos.xlsx");
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      
      const wsQuotes = wb.Sheets[wb.SheetNames[0]];
      const wsItems = wb.Sheets[wb.SheetNames[1]];
      
      const importedQuotes = XLSX.utils.sheet_to_json(wsQuotes) as any[];
      const importedItems = XLSX.utils.sheet_to_json(wsItems) as any[];

      const finalQuotes: Quote[] = importedQuotes.map(qRow => {
        const quoteID = qRow.ID || crypto.randomUUID();
        const quoteItems = importedItems.filter(i => i.PresupuestoID === quoteID || i.PresupuestoID === qRow.ID);
        
        return {
          id: quoteID,
          clientId: qRow.ClienteID || '',
          profitMarginPercent: Number(qRow.MargenGanancia) || 0,
          createdAt: qRow.FechaCreacion ? new Date(qRow.FechaCreacion).getTime() : Date.now(),
          totalCost: Number(qRow.CostoTotal) || 0,
          totalPrice: Number(qRow.PrecioTotal) || 0,
          status: (qRow.Estado || 'pending') as 'pending' | 'accepted' | 'rejected',
          items: quoteItems.map(item => ({
            productId: item.ProductoID || '',
            quantity: Number(item.Cantidad) || 1,
            customPrice: item.PrecioPersonalizado ? Number(item.PrecioPersonalizado) : undefined
          }))
        };
      });

      if (confirm(`Se han detectado ${finalQuotes.length} presupuestos. ¿Deseas sobreescribir el historial actual?`)) {
        updateData(prev => ({ ...prev, quotes: finalQuotes }));
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Recreación FIEL del Logo (Estrella redondeada tipo "Bubble Star")
  const BrandLogo = () => (
    <div className="flex flex-col select-none">
      <div className="flex items-start gap-1">
        <div className="flex flex-col">
          <h1 className="text-[85px] font-black text-brand-dark leading-[0.7] tracking-[-0.04em]" style={{ fontFamily: '"Quicksand", sans-serif' }}>
            Lala
          </h1>
          <span className="text-2xl text-brand-dark font-medium tracking-[0.28em] mt-5 ml-1 opacity-90 uppercase">
            accesorios
          </span>
        </div>
        <div className="pt-2 ml-1">
          <svg 
            width="50" 
            height="50" 
            viewBox="0 0 24 24" 
            className="text-brand-red fill-current"
          >
            {/* Estrella con puntas súper redondeadas exacta a la imagen */}
            <path d="M12 2c.6 0 1.2.3 1.5.8l2.2 4.1c.2.4.6.7 1.1.7l4.6.6c1 .1 1.4 1.3.7 2l-3.3 3.1c-.3.3-.5.8-.4 1.2l.8 4.4c.2 1-.9 1.7-1.7 1.2L13.4 18c-.4-.2-.9-.2-1.3 0l-4.1 2.1c-.8.5-1.9-.2-1.7-1.2l.8-4.4c.1-.4-.1-.9-.4-1.2l-3.3-3.1c-.7-.7-.3-1.9.7-2l4.6-.6c.5 0 .9-.3 1.1-.7l2.2-4.1c.3-.5.9-.8 1.5-.8z" />
          </svg>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Presupuestos</h2>
          <p className="text-brand-greige font-medium">Cotizaciones personalizadas para clientes</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            ref={fileInputRef} 
            onChange={importFromExcel} 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-brand-white hover:bg-brand-beige text-brand-dark px-6 py-4 rounded-2xl flex items-center gap-2 border border-brand-beige transition-all font-bold text-sm"
          >
            📥 Importar Historial
          </button>
          <button 
            onClick={exportToExcel}
            className="bg-brand-white hover:bg-brand-beige text-brand-dark px-6 py-4 rounded-2xl flex items-center gap-2 border border-brand-beige transition-all font-bold text-sm"
          >
            📤 Exportar Historial
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-sage/20 transition-all font-bold group"
          >
            <ICONS.Add />
            <span>Nueva Cotización</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:hidden">
        {data.quotes.length > 0 ? [...data.quotes].reverse().map(quote => {
          const client = data.clients.find(c => c.id === quote.clientId);
          return (
            <div key={quote.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-beige hover:shadow-xl transition-all relative group flex flex-col">
              <div className="flex justify-between items-start mb-6">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                  quote.status === 'accepted' ? 'bg-brand-sage text-white' : 'bg-brand-beige text-brand-greige'
                }`}>
                  {quote.status}
                </span>
                <span className="text-brand-red text-sm font-bold">★</span>
              </div>
              
              <h4 className="font-bold text-brand-dark text-xl mb-1">{client?.name || 'Cliente sin nombre'}</h4>
              <p className="text-xs text-brand-greige font-medium mb-6 uppercase tracking-wider">{new Date(quote.createdAt).toLocaleDateString()}</p>
              
              <div className="space-y-3 mb-8 bg-brand-white p-5 rounded-[1.5rem] flex-1">
                {quote.items.map((item, idx) => {
                  const p = data.products.find(prod => prod.id === item.productId);
                  return (
                    <div key={idx} className="flex justify-between text-xs font-bold text-brand-dark">
                      <span className="opacity-60">{item.quantity}x</span>
                      <span className="flex-1 ml-2 line-clamp-1">{p?.name}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-brand-white pt-6 flex flex-col gap-4">
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[9px] text-brand-greige font-black uppercase tracking-[0.2em]">Importe Final</p>
                        <p className="text-3xl font-bold text-brand-sage">${quote.totalPrice.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => openPreview(quote)}
                            className="p-3 bg-brand-beige text-brand-dark rounded-xl hover:bg-brand-sage hover:text-white transition-all"
                            title="Previsualizar / PDF"
                        >
                            📄
                        </button>
                        <button 
                            onClick={() => openEdit(quote)}
                            className="p-3 bg-brand-white border border-brand-beige text-brand-dark rounded-xl hover:bg-brand-beige transition-all"
                            title="Editar"
                        >
                            ✏️
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                   <button 
                    onClick={() => handleGenerateMarketing(quote)}
                    className={`text-[10px] font-bold px-4 py-2 rounded-lg transition-all ${selectedQuoteId === quote.id && isGeneratingMarketing ? 'animate-pulse bg-brand-greige text-white' : 'text-brand-sage bg-brand-sage/10 hover:bg-brand-sage hover:text-white'}`}
                    disabled={isGeneratingMarketing}
                   >
                     {isGeneratingMarketing && selectedQuoteId === quote.id ? 'Generando...' : '✨ Sugerencia AI'}
                   </button>
                   <button 
                     onClick={() => { if(confirm('¿Eliminar presupuesto?')) updateData(prev => ({...prev, quotes: prev.quotes.filter(q => q.id !== quote.id)})); }}
                     className="text-brand-red opacity-30 hover:opacity-100 transition-opacity p-2"
                   >
                     🗑️
                   </button>
                </div>
              </div>
              
              {marketingText && selectedQuoteId === quote.id && (
                  <div className="mt-6 p-6 bg-brand-beige/20 rounded-[1.5rem] text-[11px] text-brand-dark border border-brand-beige relative animate-fadeIn">
                      <p className="italic leading-relaxed">"{marketingText}"</p>
                      <button onClick={() => setMarketingText(null)} className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-brand-beige rounded-full flex items-center justify-center text-[10px] text-brand-greige hover:text-brand-red shadow-sm">✕</button>
                  </div>
              )}
            </div>
          );
        }) : (
          <div className="col-span-full py-24 text-center text-brand-greige italic border-2 border-dashed border-brand-beige rounded-[3rem] bg-white">
            Sin presupuestos activos por el momento.
          </div>
        )}
      </div>

      {/* Modal Principal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slideUp border border-brand-beige">
            <div className="p-10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-bold text-brand-dark">{editingId ? 'Editar Cotización' : 'Nueva Cotización Personalizada'}</h3>
                <span className="text-brand-red text-2xl">★</span>
              </div>
              <form onSubmit={handleSave} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-3">Cliente Destino</label>
                      <select 
                        required
                        value={formData.clientId}
                        onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                        className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage font-bold text-brand-dark"
                      >
                        <option value="">Seleccionar del directorio...</option>
                        {data.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-3">Margen de Ganancia (%)</label>
                      <input 
                        type="number" required
                        value={formData.profitMarginPercent}
                        onChange={e => setFormData(prev => ({ ...prev, profitMarginPercent: Number(e.target.value) }))}
                        className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage font-bold text-brand-dark"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-3">Estado</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage font-bold text-brand-dark"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="accepted">Aceptado</option>
                        <option value="rejected">Rechazado</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-brand-greige uppercase tracking-widest">Productos Seleccionados</label>
                      <button type="button" onClick={addItem} className="text-[10px] bg-brand-dark text-white font-black px-4 py-2 rounded-full hover:bg-brand-sage transition-all shadow-md">
                        + AGREGAR
                      </button>
                    </div>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                      {(formData.items || []).map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-center bg-brand-white p-4 rounded-2xl border border-brand-beige/50 group">
                          <select 
                            value={item.productId}
                            onChange={e => updateItem(idx, 'productId', e.target.value)}
                            className="flex-1 text-xs font-bold border-none bg-transparent text-brand-dark outline-none"
                          >
                            {data.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input 
                            type="number" min="1"
                            value={item.quantity}
                            onChange={e => updateItem(idx, 'quantity', Number(e.target.value))}
                            className="w-16 text-xs text-center font-bold border-none bg-white rounded-lg py-2 shadow-sm"
                          />
                          <button type="button" onClick={() => removeItem(idx)} className="text-brand-red opacity-30 hover:opacity-100 transition-opacity">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-brand-white p-10 rounded-[2.5rem] border border-brand-beige flex flex-col md:flex-row justify-between items-center gap-8">
                  <div>
                    <p className="text-[10px] text-brand-greige font-black uppercase tracking-[0.2em] mb-1">Precio Final Lala</p>
                    <p className="text-5xl font-bold text-brand-sage">
                      ${((calculateCosts(formData.items || [])) * (1 + (Number(formData.profitMarginPercent) || 0) / 100)).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-6 w-full md:w-auto">
                    <button type="button" onClick={closeModal} className="flex-1 px-8 py-5 text-brand-greige font-bold hover:text-brand-dark transition-colors">Cerrar</button>
                    <button type="submit" className="flex-[2] bg-brand-sage text-white px-12 py-5 rounded-[1.5rem] font-bold shadow-2xl shadow-brand-sage/20 hover:bg-brand-dark transition-all">
                      {editingId ? 'Actualizar Cotización' : 'Confirmar Cotización'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Vista Previa Impresión */}
      {isPreviewOpen && quoteForPreview && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-xl flex items-start justify-center z-[100] p-4 md:p-10 overflow-y-auto print:bg-white print:p-0 print:block">
          <div className="bg-white w-full max-w-[800px] shadow-2xl min-h-[1000px] flex flex-col print:shadow-none print:max-w-none print:w-full">
            <div className="bg-brand-white p-6 flex justify-between items-center border-b border-brand-beige print:hidden sticky top-0 z-10">
              <div className="flex items-center gap-4">
                 <button onClick={() => setIsPreviewOpen(false)} className="text-brand-greige hover:text-brand-dark">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                   </svg>
                 </button>
                 <h2 className="font-bold text-brand-dark">Vista Previa del Presupuesto</h2>
              </div>
              <button 
                onClick={handlePrint}
                className="bg-brand-dark text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-sage transition-all"
              >
                Imprimir / Guardar PDF
              </button>
            </div>

            <div className="p-12 md:p-20 flex-1 flex flex-col print:p-8">
               <div className="flex justify-between items-start mb-20">
                  <BrandLogo />
                  <div className="text-right pt-4">
                    <h3 className="text-3xl font-black text-brand-dark uppercase tracking-[0.2em] mb-2">PRESUPUESTO</h3>
                    <p className="text-brand-greige font-bold text-sm">#PRE-{quoteForPreview.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-brand-greige font-bold text-sm">{new Date(quoteForPreview.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-10 mb-16 pb-10 border-b-2 border-brand-white">
                 <div>
                    <h4 className="text-[10px] font-black text-brand-greige uppercase tracking-widest mb-4">CLIENTE</h4>
                    <p className="text-xl font-bold text-brand-dark mb-1">
                      {data.clients.find(c => c.id === quoteForPreview.clientId)?.name}
                    </p>
                    <p className="text-brand-greige text-sm font-medium">
                      {data.clients.find(c => c.id === quoteForPreview.clientId)?.email}
                    </p>
                    <p className="text-brand-greige text-sm font-medium">
                      {data.clients.find(c => c.id === quoteForPreview.clientId)?.phone}
                    </p>
                    <p className="text-brand-greige text-sm font-medium mt-2">
                      {data.clients.find(c => c.id === quoteForPreview.clientId)?.address}
                    </p>
                 </div>
                 <div className="text-right">
                    <h4 className="text-[10px] font-black text-brand-greige uppercase tracking-widest mb-4">DE PARTE DE</h4>
                    <p className="text-xl font-bold text-brand-dark mb-1">{data.settings.brandName}</p>
                    <p className="text-brand-greige text-sm font-medium italic">Accesorios para bebés confeccionados con amor.</p>
                 </div>
               </div>

               <table className="w-full text-left mb-20">
                 <thead>
                    <tr className="bg-brand-white/50">
                       <th className="px-6 py-4 text-[10px] font-black text-brand-greige uppercase tracking-widest">Descripción del Producto</th>
                       <th className="px-6 py-4 text-[10px] font-black text-brand-greige uppercase tracking-widest text-center">Cant.</th>
                       <th className="px-6 py-4 text-[10px] font-black text-brand-greige uppercase tracking-widest text-right">Unitario</th>
                       <th className="px-6 py-4 text-[10px] font-black text-brand-greige uppercase tracking-widest text-right">Subtotal</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-white">
                    {quoteForPreview.items.map((item, idx) => {
                      const p = data.products.find(prod => prod.id === item.productId);
                      if (!p) return null;

                      const materialCost = p.materials.reduce((mAcc, req) => {
                        return mAcc + calculateRequirementCost(req);
                      }, 0);
                      const baseUnitCost = materialCost + (Number(p.baseLaborCost) || 0);
                      const unitPrice = baseUnitCost * (1 + quoteForPreview.profitMarginPercent / 100);

                      return (
                        <tr key={idx}>
                          <td className="px-6 py-6">
                            <p className="font-bold text-brand-dark">{p.name}</p>
                            <p className="text-xs text-brand-greige mt-1 leading-relaxed">{p.description}</p>
                          </td>
                          <td className="px-6 py-6 text-center font-bold text-brand-dark">{item.quantity}</td>
                          <td className="px-6 py-6 text-right font-bold text-brand-dark">${unitPrice.toFixed(2)}</td>
                          <td className="px-6 py-6 text-right font-bold text-brand-dark">${(unitPrice * item.quantity).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                 </tbody>
               </table>

               <div className="mt-auto border-t-4 border-brand-dark pt-10 flex justify-end">
                  <div className="w-full max-w-[300px] space-y-4">
                     <div className="flex justify-between items-center border-t border-brand-beige pt-4">
                        <span className="text-lg font-black text-brand-dark uppercase tracking-widest">TOTAL FINAL</span>
                        <span className="text-3xl font-black text-brand-sage">${quoteForPreview.totalPrice.toFixed(2)}</span>
                     </div>
                  </div>
               </div>

               <div className="mt-20 pt-10 border-t border-brand-white text-center">
                  <p className="text-sm text-brand-greige italic leading-relaxed">
                    Este presupuesto tiene una validez de 15 días. <br />
                    Gracias por elegir Lala accesorios para acompañar a tu bebé.
                  </p>
                  <div className="mt-8 flex justify-center gap-2 text-brand-sage">
                    <span className="text-xl">★</span>
                    <span className="text-xl">★</span>
                    <span className="text-xl">★</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotesManager;
