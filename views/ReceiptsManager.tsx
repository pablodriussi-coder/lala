
import React, { useState } from 'react';
import { AppData, Receipt, ProductMaterialRequirement, MaterialUnit } from '../types';

interface ReceiptsManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const ReceiptsManager: React.FC<ReceiptsManagerProps> = ({ data, updateData }) => {
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);

  const calculateRequirementCost = (req: ProductMaterialRequirement) => {
    const material = data.materials.find(m => m.id === req.materialId);
    if (!material) return 0;
    if (material.unit === MaterialUnit.METERS && req.widthCm && req.heightCm && material.widthCm) {
        return material.costPerUnit * ((req.widthCm * req.heightCm) / (material.widthCm * 100));
    }
    return material.costPerUnit * req.quantity;
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
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Recibos de Venta</h2>
          <p className="text-brand-greige font-medium">Histórico de compras concretadas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:hidden">
        {data.receipts.length > 0 ? [...data.receipts].reverse().map(receipt => {
          const client = data.clients.find(c => c.id === receipt.clientId);
          return (
            <div key={receipt.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-beige hover:shadow-xl transition-all flex flex-col">
              <div className="flex justify-between mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest bg-brand-sage text-white px-3 py-1.5 rounded-full">VENTA FINALIZADA</span>
                <span className="text-brand-red font-bold">★</span>
              </div>
              <h4 className="font-bold text-brand-dark text-xl">{client?.name || 'Cliente'}</h4>
              <p className="text-xs text-brand-greige mb-6 font-bold uppercase tracking-widest">{receipt.receiptNumber}</p>
              
              <div className="bg-brand-white p-5 rounded-2xl flex-1 mb-6">
                <div className="flex justify-between text-[10px] font-black text-brand-greige uppercase tracking-widest mb-4">
                  <span>Pago: {receipt.paymentMethod}</span>
                  <span>{new Date(receipt.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-3xl font-bold text-brand-sage">${receipt.totalPrice.toFixed(2)}</p>
              </div>

              <button 
                onClick={() => setSelectedReceipt(receipt)}
                className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold text-sm hover:bg-brand-sage transition-all"
              >
                Ver Detalle / Imprimir
              </button>
            </div>
          );
        }) : (
          <div className="col-span-full py-24 text-center text-brand-greige italic border-2 border-dashed border-brand-beige rounded-[3rem] bg-white">
            No se han emitido recibos aún.
          </div>
        )}
      </div>

      {selectedReceipt && (
        <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-xl flex items-start justify-center z-[100] p-4 md:p-10 overflow-y-auto print:bg-white print:p-0">
          <div className="bg-white w-full max-w-[800px] shadow-2xl min-h-[1000px] flex flex-col print:shadow-none animate-slideUp">
            <div className="bg-brand-white p-6 flex justify-between items-center border-b border-brand-beige print:hidden sticky top-0">
              <button onClick={() => setSelectedReceipt(null)} className="text-brand-greige font-bold flex items-center gap-2">
                <span>✕</span> Cerrar
              </button>
              <button onClick={() => window.print()} className="bg-brand-dark text-white px-8 py-3 rounded-xl font-bold">Imprimir Recibo (PDF)</button>
            </div>
            
            <div className="p-12 md:p-20 flex-1 flex flex-col">
               <div className="flex justify-between items-start mb-20">
                  <BrandLogo />
                  <div className="text-right pt-4">
                    <h3 className="text-3xl font-black text-brand-dark uppercase tracking-[0.2em] mb-2">RECIBO</h3>
                    <p className="text-brand-greige font-bold text-sm">{selectedReceipt.receiptNumber}</p>
                    <p className="text-brand-greige font-bold text-sm">{new Date(selectedReceipt.createdAt).toLocaleDateString()}</p>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-10 mb-16 pb-10 border-b-2 border-brand-white">
                 <div>
                    <h4 className="text-[10px] font-black text-brand-greige uppercase tracking-widest mb-4">CLIENTE</h4>
                    <p className="text-xl font-bold text-brand-dark">{data.clients.find(c => c.id === selectedReceipt.clientId)?.name}</p>
                    <p className="text-brand-greige text-sm">{data.clients.find(c => c.id === selectedReceipt.clientId)?.phone}</p>
                 </div>
                 <div className="text-right">
                    <h4 className="text-[10px] font-black text-brand-greige uppercase tracking-widest mb-4">PAGO REALIZADO</h4>
                    <p className="text-lg font-bold text-brand-dark">{selectedReceipt.paymentMethod}</p>
                 </div>
               </div>

               <table className="w-full text-left mb-10">
                 <thead className="bg-brand-white/50">
                    <tr className="text-[10px] font-black text-brand-greige uppercase tracking-widest">
                       <th className="px-6 py-4">Descripción</th>
                       <th className="px-6 py-4 text-center">Cant.</th>
                       <th className="px-6 py-4 text-right">Precio</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-brand-white">
                    {selectedReceipt.items.map((item, idx) => {
                      const p = data.products.find(prod => prod.id === item.productId);
                      const quote = data.quotes.find(q => q.id === selectedReceipt.quoteId);
                      if (!p || !quote) return null;
                      const materialCost = p.materials.reduce((mAcc, req) => mAcc + calculateRequirementCost(req), 0);
                      const unitPrice = (materialCost + (Number(p.baseLaborCost) || 0)) * (1 + quote.profitMarginPercent / 100);
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

               <div className="mt-auto pt-10 border-t-2 border-brand-white">
                  <div className="flex justify-between items-end">
                    <div className="max-w-xs">
                      <p className="text-[11px] font-bold text-brand-greige italic leading-relaxed">
                        ¡Muchísimas gracias por confiar en Lala accesorios para tu bebé! Cada pieza está hecha con materiales seleccionados y mucho amor. Esperamos que lo disfruten.
                      </p>
                    </div>
                    <div className="w-full max-w-[300px] space-y-3">
                       {selectedReceipt.discountValue > 0 && (
                          <div className="flex justify-between items-center text-sm font-bold text-brand-red">
                             <span>DESCUENTO</span>
                             <span>-${selectedReceipt.discountValue.toFixed(2)}</span>
                          </div>
                       )}
                       <div className="flex justify-between items-center border-t-4 border-brand-dark pt-4">
                          <span className="text-xl font-black text-brand-dark uppercase tracking-widest">TOTAL</span>
                          <span className="text-4xl font-black text-brand-sage">${selectedReceipt.totalPrice.toFixed(2)}</span>
                       </div>
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

export default ReceiptsManager;
