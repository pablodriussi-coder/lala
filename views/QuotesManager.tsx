
import React, { useState, useRef } from 'react';
import { AppData, Quote, QuoteItem, ProductMaterialRequirement, MaterialUnit, Receipt } from '../types';
import { ICONS } from '../constants';
import { syncReceipt, syncQuote } from '../store';
import * as XLSX from 'xlsx';

interface QuotesManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const QuotesManager: React.FC<QuotesManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quoteForPreview, setQuoteForPreview] = useState<Quote | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Quote>>({
    clientId: '',
    profitMarginPercent: data.settings.defaultMargin,
    items: [],
    status: 'pending',
    discountValue: 0,
    discountReason: ''
  });

  const calculateRequirementCost = (req: ProductMaterialRequirement) => {
    const material = data.materials.find(m => m.id === req.materialId);
    if (!material) return 0;
    if (material.unit === MaterialUnit.METERS && req.widthCm && req.heightCm && material.widthCm) {
        return material.costPerUnit * ((req.widthCm * req.heightCm) / (material.widthCm * 100));
    }
    return material.costPerUnit * req.quantity;
  };

  const calculateCosts = (items: QuoteItem[]) => {
    return items.reduce((acc, item) => {
      const product = data.products.find(p => p.id === item.productId);
      if (!product) return acc;
      const materialCost = product.materials.reduce((mAcc, req) => mAcc + calculateRequirementCost(req), 0);
      const unitCost = materialCost + (Number(product.baseLaborCost) || 0);
      return acc + (unitCost * item.quantity);
    }, 0);
  };

  const emitReceipt = async (quote: Quote) => {
    const method = prompt("Ingrese el método de pago (Efectivo, Transferencia, Tarjeta, Otro):", "Efectivo");
    if (!method) return;

    const receipt: Receipt = {
      id: crypto.randomUUID(),
      quoteId: quote.id,
      clientId: quote.clientId,
      items: quote.items,
      totalPrice: quote.totalPrice,
      discountValue: quote.discountValue || 0,
      paymentMethod: method,
      receiptNumber: `REC-${Date.now().toString().slice(-6)}`,
      createdAt: Date.now()
    };

    updateData(prev => ({
      ...prev,
      receipts: [...prev.receipts, receipt],
      transactions: [...prev.transactions, {
        id: crypto.randomUUID(),
        date: Date.now(),
        type: 'income',
        category: 'venta',
        amount: quote.totalPrice,
        description: `Venta concretada - Recibo ${receipt.receiptNumber}`
      }]
    }));

    await syncReceipt(receipt);
    return receipt;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || (formData.items || []).length === 0) return alert('Selecciona cliente y productos.');

    const totalCost = calculateCosts(formData.items || []);
    const marginMultiplier = 1 + (Number(formData.profitMarginPercent) / 100);
    const subtotal = totalCost * marginMultiplier;
    const totalPrice = subtotal - (Number(formData.discountValue) || 0);

    const quoteData: Quote = {
      id: editingId || crypto.randomUUID(),
      clientId: formData.clientId || '',
      profitMarginPercent: Number(formData.profitMarginPercent) || 0,
      items: formData.items || [],
      createdAt: editingId ? (data.quotes.find(q => q.id === editingId)?.createdAt || Date.now()) : Date.now(),
      totalCost,
      totalPrice,
      status: formData.status as 'pending' | 'accepted' | 'rejected' || 'pending',
      discountValue: Number(formData.discountValue) || 0,
      discountReason: formData.discountReason || ''
    };

    // Verificamos si acaba de pasar a aceptado para ofrecer el recibo
    const oldQuote = editingId ? data.quotes.find(q => q.id === editingId) : null;
    const oldStatus = oldQuote ? oldQuote.status : null;
    
    // Es aceptado si:
    // 1. Es nuevo y estado es accepted
    // 2. Es viejo y su estado anterior NO era accepted, pero el nuevo SI lo es
    const isNowAccepted = quoteData.status === 'accepted' && oldStatus !== 'accepted';

    updateData(prev => ({
      ...prev,
      quotes: editingId 
        ? prev.quotes.map(q => q.id === editingId ? quoteData : q)
        : [...prev.quotes, quoteData]
    }));

    closeModal();

    if (isNowAccepted) {
      setTimeout(() => {
        if (confirm("¿Deseas emitir el recibo de venta y registrar el ingreso ahora?")) {
            emitReceipt(quoteData).then(() => {
                alert("¡Venta concretada y recibo generado!");
            });
        }
      }, 100);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ clientId: '', profitMarginPercent: data.settings.defaultMargin, items: [], status: 'pending', discountValue: 0, discountReason: '' });
  };

  const openPreview = (quote: Quote) => {
    setQuoteForPreview(quote);
    setIsPreviewOpen(true);
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

  const exportToExcel = () => {
    const mainQuotes = data.quotes.map(q => ({
      ID: q.id,
      Cliente: data.clients.find(c => c.id === q.clientId)?.name || 'Desconocido',
      ClienteID: q.clientId,
      Fecha: new Date(q.createdAt).toLocaleDateString(),
      Estado: q.status,
      MargenPercent: q.profitMarginPercent,
      CostoTotal: q.totalCost,
      PrecioFinal: q.totalPrice,
      Descuento: q.discountValue || 0,
      MotivoDescuento: q.discountReason || ''
    }));

    const quoteItems: any[] = [];
    data.quotes.forEach(q => {
      q.items.forEach(item => {
        const p = data.products.find(prod => prod.id === item.productId);
        quoteItems.push({
          PresupuestoID: q.id,
          Producto: p?.name || 'Desconocido',
          ProductoID: item.productId,
          Cantidad: item.quantity
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(mainQuotes);
    const ws2 = XLSX.utils.json_to_sheet(quoteItems);
    XLSX.utils.book_append_sheet(wb, ws1, "Presupuestos");
    XLSX.utils.book_append_sheet(wb, ws2, "Items");
    XLSX.writeFile(wb, "Lala_Presupuestos.xlsx");
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsMain = wb.Sheets["Presupuestos"];
        const wsItems = wb.Sheets["Items"];
        
        const importedMain = XLSX.utils.sheet_to_json(wsMain) as any[];
        const importedItems = XLSX.utils.sheet_to_json(wsItems) as any[];

        const finalQuotes: Quote[] = importedMain.map(row => {
          const items = importedItems
            .filter(item => item.PresupuestoID === row.ID)
            .map(item => ({
              productId: item.ProductoID,
              quantity: Number(item.Cantidad) || 1
            }));

          return {
            id: row.ID || crypto.randomUUID(),
            clientId: row.ClienteID,
            items,
            profitMarginPercent: Number(row.MargenPercent) || data.settings.defaultMargin,
            createdAt: row.Fecha ? new Date(row.Fecha).getTime() : Date.now(),
            totalCost: Number(row.CostoTotal) || 0,
            totalPrice: Number(row.PrecioFinal) || 0,
            status: row.Estado as any,
            discountValue: Number(row.Descuento) || 0,
            discountReason: row.MotivoDescuento || ''
          };
        });

        if (confirm(`¿Importar ${finalQuotes.length} presupuestos? Esto actualizará la base de datos.`)) {
          updateData(prev => ({ ...prev, quotes: finalQuotes }));
        }
      } catch (err) {
        alert("Error procesando Excel de presupuestos. Asegúrate de que las pestañas se llamen 'Presupuestos' e 'Items'.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const BrandLogo = () => (
    <div className="flex flex-col select-none">
      <div className="flex items-start gap-1">
        <div className="flex flex-col">
          <h1 className="text-[85px] font-black text-brand-dark leading-[0.7] tracking-[-0.04em]">Lala</h1>
          <span className="text-2xl text-brand-dark font-medium tracking-[0.28em] mt-5 ml-1 opacity-90 uppercase">accesorios</span>
        </div>
        <div className="pt-2 ml-1">
          <svg width="50" height="50" viewBox="0 0 24 24" className="text-brand-red fill-current">
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
          <input type="file" className="hidden" ref={fileInputRef} onChange={importFromExcel} accept=".xlsx,.xls" />
          <button onClick={() => fileInputRef.current?.click()} className="bg-brand-white text-brand-dark px-6 py-4 rounded-2xl border border-brand-beige font-bold text-sm">📥 Importar Excel</button>
          <button onClick={exportToExcel} className="bg-brand-white text-brand-dark px-6 py-4 rounded-2xl border border-brand-beige font-bold text-sm">📤 Exportar Excel</button>
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-sage text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-sage/20 font-bold group transition-all hover:bg-brand-dark">
            <ICONS.Add />
            <span>Nueva Cotización</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:hidden">
        {data.quotes.length > 0 ? [...data.quotes].reverse().map(quote => {
          const client = data.clients.find(c => c.id === quote.clientId);
          const hasReceipt = data.receipts.some(r => r.quoteId === quote.id);
          return (
            <div key={quote.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-beige hover:shadow-xl transition-all relative flex flex-col">
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
                        <p className="text-[9px] text-brand-greige font-black uppercase tracking-[0.2em]">Total Final</p>
                        <p className="text-3xl font-bold text-brand-sage">${quote.totalPrice.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-2">
                        {quote.status === 'accepted' && !hasReceipt && (
                          <button 
                            onClick={() => emitReceipt(quote)}
                            title="Emitir Recibo"
                            className="p-3 bg-brand-sage text-white rounded-xl hover:bg-brand-dark transition-all"
                          >
                            🎫
                          </button>
                        )}
                        <button onClick={() => openPreview(quote)} className="p-3 bg-brand-beige text-brand-dark rounded-xl hover:bg-brand-sage hover:text-white transition-all">📄</button>
                        <button onClick={() => { setEditingId(quote.id); setFormData(quote); setIsModalOpen(true); }} className="p-3 bg-brand-white border border-brand-beige text-brand-dark rounded-xl hover:bg-brand-beige transition-all">✏️</button>
                    </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-24 text-center text-brand-greige italic border-2 border-dashed border-brand-beige rounded-[3rem] bg-white">
            Sin presupuestos activos.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-brand-beige p-10 animate-slideUp">
              <h3 className="text-2xl font-bold text-brand-dark mb-10">Configurar Cotización</h3>
              <form onSubmit={handleSave} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-3">Cliente</label>
                      <select required value={formData.clientId} onChange={e => setFormData(prev => ({ ...prev, clientId: e.target.value }))} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage font-bold text-brand-dark">
                        <option value="">Seleccionar cliente...</option>
                        {data.clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-3">Margen (%)</label>
                        <input type="number" value={formData.profitMarginPercent} onChange={e => setFormData(prev => ({ ...prev, profitMarginPercent: Number(e.target.value) }))} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage font-bold" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-3">Estado</label>
                        <select value={formData.status} onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold">
                          <option value="pending">Pendiente</option>
                          <option value="accepted">Aceptado</option>
                          <option value="rejected">Rechazado</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="bg-brand-white/50 p-6 rounded-[2rem] border border-dashed border-brand-beige space-y-4">
                      <p className="text-[10px] font-black text-brand-dark uppercase tracking-widest text-center">Descuentos</p>
                      <div className="flex gap-4">
                         <div className="w-1/3">
                            <label className="block text-[9px] font-bold text-brand-greige mb-1">Monto ($)</label>
                            <input type="number" value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})} className="w-full px-4 py-3 rounded-xl bg-white border border-brand-beige font-bold" />
                         </div>
                         <div className="flex-1">
                            <label className="block text-[9px] font-bold text-brand-greige mb-1">Motivo</label>
                            <input type="text" value={formData.discountReason} onChange={e => setFormData({...formData, discountReason: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-white border border-brand-beige" />
                         </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-brand-greige uppercase tracking-widest">Items</label>
                      <button type="button" onClick={addItem} className="text-[10px] bg-brand-dark text-white font-black px-4 py-2 rounded-full">+ AGREGAR</button>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {(formData.items || []).map((item, idx) => (
                        <div key={idx} className="flex gap-3 items-center bg-brand-white p-4 rounded-2xl border border-brand-beige/50">
                          <select value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} className="flex-1 text-xs font-bold border-none bg-transparent">
                            {data.products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} className="w-16 text-xs text-center font-bold bg-white rounded-lg py-2" />
                          <button type="button" onClick={() => removeItem(idx)} className="text-brand-red opacity-30 hover:opacity-100">✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-brand-white p-8 rounded-[2.5rem] flex flex-col md:flex-row justify-between items-center gap-8">
                  <div>
                    <p className="text-[10px] text-brand-greige font-black uppercase tracking-[0.2em]">Precio Final Estimado</p>
                    <p className="text-4xl font-bold text-brand-sage">${(calculateCosts(formData.items || []) * (1 + (formData.profitMarginPercent || 0)/100) - (formData.discountValue || 0)).toFixed(2)}</p>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={closeModal} className="px-8 py-4 font-bold text-brand-greige">Cancelar</button>
                    <button type="submit" className="bg-brand-sage text-white px-10 py-4 rounded-2xl font-bold">Guardar Cambios</button>
                  </div>
                </div>
              </form>
          </div>
        </div>
      )}

      {isPreviewOpen && quoteForPreview && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-xl flex items-start justify-center z-[100] p-4 md:p-10 overflow-y-auto print:bg-white print:p-0">
          <div className="bg-white w-full max-w-[800px] shadow-2xl min-h-[1000px] flex flex-col print:shadow-none">
            <div className="bg-brand-white p-6 flex justify-between items-center border-b border-brand-beige print:hidden sticky top-0">
              <button onClick={() => setIsPreviewOpen(false)} className="text-brand-greige hover:text-brand-dark">✕ Cerrar</button>
              <button onClick={() => window.print()} className="bg-brand-dark text-white px-6 py-2 rounded-xl font-bold">Imprimir / PDF</button>
            </div>
            <div className="p-12 md:p-20 flex-1 flex flex-col">
               <div className="flex justify-between items-start mb-20">
                  <BrandLogo />
                  <div className="text-right pt-4">
                    <h3 className="text-3xl font-black text-brand-dark uppercase tracking-[0.2em] mb-2">COTIZACIÓN</h3>
                    <p className="text-brand-greige font-bold text-sm">#PRE-{quoteForPreview.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-brand-greige font-bold text-sm">{new Date(quoteForPreview.createdAt).toLocaleDateString()}</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-10 mb-16 pb-10 border-b-2 border-brand-white">
                 <div>
                    <h4 className="text-[10px] font-black text-brand-greige uppercase tracking-widest mb-4">CLIENTE</h4>
                    <p className="text-xl font-bold text-brand-dark mb-1">{data.clients.find(c => c.id === quoteForPreview.clientId)?.name}</p>
                 </div>
                 <div className="text-right">
                    <h4 className="text-[10px] font-black text-brand-greige uppercase tracking-widest mb-4">DE</h4>
                    <p className="text-xl font-bold text-brand-dark mb-1">{data.settings.brandName}</p>
                 </div>
               </div>
               <table className="w-full text-left mb-10">
                 <thead className="bg-brand-white/50">
                    <tr className="text-[10px] font-black text-brand-greige uppercase tracking-widest">
                       <th className="px-6 py-4">Descripción</th>
                       <th className="px-6 py-4 text-center">Cant.</th>
                       <th className="px-6 py-4 text-right">Subtotal</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-white">
                    {quoteForPreview.items.map((item, idx) => {
                      const p = data.products.find(prod => prod.id === item.productId);
                      if (!p) return null;
                      const materialCost = p.materials.reduce((mAcc, req) => mAcc + calculateRequirementCost(req), 0);
                      const unitPrice = (materialCost + (Number(p.baseLaborCost) || 0)) * (1 + quoteForPreview.profitMarginPercent / 100);
                      return (
                        <tr key={idx} className="text-sm font-bold text-brand-dark">
                          <td className="px-6 py-6">{p.name}</td>
                          <td className="px-6 py-6 text-center">{item.quantity}</td>
                          <td className="px-6 py-6 text-right">${(unitPrice * item.quantity).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                 </tbody>
               </table>
               <div className="mt-auto pt-10 flex justify-end">
                  <div className="w-full max-w-[350px] space-y-3">
                     <div className="flex justify-between items-center text-sm font-bold text-brand-greige">
                        <span>SUBTOTAL</span>
                        <span>${(quoteForPreview.totalPrice + (quoteForPreview.discountValue || 0)).toFixed(2)}</span>
                     </div>
                     {quoteForPreview.discountValue && quoteForPreview.discountValue > 0 && (
                        <div className="flex justify-between items-center text-sm font-bold text-brand-red">
                           <span>DESCUENTO</span>
                           <span>-${quoteForPreview.discountValue.toFixed(2)}</span>
                        </div>
                     )}
                     <div className="flex justify-between items-center border-t-4 border-brand-dark pt-4">
                        <span className="text-xl font-black text-brand-dark uppercase tracking-widest">TOTAL</span>
                        <span className="text-4xl font-black text-brand-sage">${quoteForPreview.totalPrice.toFixed(2)}</span>
                     </div>
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
