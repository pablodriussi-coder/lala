
import React, { useState, useMemo } from 'react';
import { AppData, Product, DesignOption, Category } from '../types';
import { calculateFinalPrice } from '../services/calculationService';

interface CustomerShopProps {
  data: AppData;
}

interface CartItem {
  productId: string;
  quantity: number;
  selectedDesign?: DesignOption;
}

const ProductCard: React.FC<{ 
    product: Product & { price: number }, 
    onOpenSelector: (product: Product & { price: number }) => void 
}> = ({ product, onOpenSelector }) => {
    const hasImages = product.images && product.images.length > 0;
    return (
        <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-brand-beige hover:shadow-xl transition-all duration-300 group flex flex-col">
            <div className="aspect-[4/5] bg-brand-white relative overflow-hidden flex items-center justify-center">
                {hasImages ? (
                    <img src={product.images![0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : <div className="text-5xl grayscale opacity-10 select-none">🍼</div>}
                <div className="absolute top-3 left-3 bg-brand-dark/80 backdrop-blur-sm text-white px-3 py-1 rounded-full font-black text-[10px] shadow-lg">${product.price.toFixed(0)}</div>
            </div>
            <div className="p-4 flex-1 flex flex-col text-center">
                <h3 className="text-sm font-bold text-brand-dark mb-1 truncate uppercase tracking-tight">{product.name}</h3>
                <button onClick={() => onOpenSelector(product)} className="w-full mt-3 bg-brand-sage text-white py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-dark transition-all active:scale-95">Ver Detalles</button>
            </div>
        </div>
    );
};

const CustomerShop: React.FC<CustomerShopProps> = ({ data }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectingProduct, setSelectingProduct] = useState<(Product & { price: number }) | null>(null);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  const productsWithPrices = useMemo(() => {
    return data.products.map(p => ({
      ...p,
      price: calculateFinalPrice(p, data.materials, data.settings.defaultMargin)
    }));
  }, [data.products, data.materials, data.settings.defaultMargin]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return productsWithPrices.filter(p => p.categoryId === selectedCategoryId);
  }, [selectedCategoryId, productsWithPrices]);

  const addToCart = () => {
    if (!selectingProduct) return;
    const design = selectingProduct.designOptions?.find(d => d.id === selectedDesignId);
    setCart(prev => {
      const existing = prev.find(item => item.productId === selectingProduct.id && item.selectedDesign?.id === design?.id);
      if (existing) return prev.map(item => (item.productId === selectingProduct.id && item.selectedDesign?.id === design?.id) ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { productId: selectingProduct.id, quantity: 1, selectedDesign: design }];
    });
    setSelectingProduct(null);
    setSelectedDesignId(null);
    setIsCartOpen(true);
  };

  const cartTotal = cart.reduce((acc, item) => {
    const p = productsWithPrices.find(prod => prod.id === item.productId);
    return acc + (p?.price || 0) * item.quantity;
  }, 0);

  const sendWhatsAppOrder = () => {
    const itemsText = cart.map(item => {
      const p = productsWithPrices.find(prod => prod.id === item.productId);
      const designTxt = item.selectedDesign ? ` (Tela: ${item.selectedDesign.name})` : '';
      return `- ${item.quantity}x ${p?.name}${designTxt} [$${((p?.price || 0) * item.quantity).toFixed(0)}]`;
    }).join('%0A');
    const message = `¡Hola! ✨ Me gustaría pedir:%0A%0A${itemsText}%0A%0A*Total: $${cartTotal.toFixed(0)}*%0A%0A¿Me confirmás disponibilidad? 😊`;
    window.open(`https://wa.me/${data.settings.whatsappNumber}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-brand-white pb-32 animate-fadeIn font-['Quicksand'] relative">
      {/* Botón Carrito */}
      <button onClick={() => setIsCartOpen(true)} className="fixed bottom-6 right-6 z-40 bg-brand-dark p-4 rounded-full shadow-2xl transition-all">
        <div className="relative text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          {cart.length > 0 && <span className="absolute -top-3 -right-3 bg-brand-red text-white text-[9px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-brand-dark">{cart.length}</span>}
        </div>
      </button>

      <header className="bg-white pt-16 pb-12 px-6 text-center border-b border-brand-beige relative">
        <h1 className="text-4xl font-black text-brand-dark mb-1">{data.settings.brandName} <span className="text-brand-red">★</span></h1>
        <p className="text-brand-sage font-black uppercase tracking-[0.2em] text-[9px]">Accesorios artesanales para bebés</p>
      </header>

      <div className="max-w-7xl mx-auto px-6 mt-10">
        {!selectedCategoryId ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {data.categories.map(cat => (
              <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className="bg-white p-4 rounded-[2rem] border border-brand-beige shadow-sm hover:shadow-xl transition-all flex flex-col items-center group">
                <div className="aspect-square w-full rounded-2xl overflow-hidden mb-4 bg-brand-white">
                  {cat.image ? <img src={cat.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full flex items-center justify-center text-4xl grayscale opacity-10">🎀</div>}
                </div>
                <span className="text-xs font-black text-brand-dark uppercase tracking-widest">{cat.name}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <button onClick={() => setSelectedCategoryId(null)} className="flex items-center gap-2 text-brand-greige hover:text-brand-dark font-bold text-sm">
              ← Volver a categorías
            </button>
            <div className="flex items-center gap-4 mb-8">
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tighter">{data.categories.find(c => c.id === selectedCategoryId)?.name}</h2>
              <div className="h-0.5 flex-1 bg-brand-beige"></div>
            </div>
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {filteredProducts.map(product => <ProductCard key={product.id} product={product} onOpenSelector={setSelectingProduct} />)}
              </div>
            ) : <p className="text-center py-20 text-brand-greige italic">Próximamente productos en esta categoría.</p>}
          </div>
        )}
      </div>

      {/* SELECTOR DE TELA Y CARRITO (Igual que antes, pero con IDs actualizados) */}
      {selectingProduct && (
          <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border border-brand-beige overflow-hidden flex flex-col max-h-[90vh]">
                  <h3 className="text-2xl font-black text-brand-dark mb-6">{selectingProduct.name}</h3>
                  <div className="flex-1 overflow-y-auto mb-8">
                      {selectingProduct.designOptions?.length ? (
                          <div className="grid grid-cols-3 gap-3">
                              {selectingProduct.designOptions.map(design => (
                                  <button key={design.id} onClick={() => setSelectedDesignId(design.id)} className={`p-2 rounded-xl border-2 transition-all ${selectedDesignId === design.id ? 'border-brand-sage' : 'border-brand-beige'}`}>
                                      <img src={design.image} className="w-full aspect-square object-cover rounded-lg mb-1" />
                                      <span className="text-[9px] font-bold block truncate">{design.name}</span>
                                  </button>
                              ))}
                          </div>
                      ) : <p className="text-brand-greige italic text-sm text-center">Sin opciones de tela disponibles.</p>}
                  </div>
                  <div className="flex gap-4">
                      <button onClick={() => setSelectingProduct(null)} className="flex-1 font-bold text-brand-greige">Cancelar</button>
                      <button onClick={addToCart} className="flex-[2] bg-brand-sage text-white py-3 rounded-xl font-bold">Añadir al Carrito</button>
                  </div>
              </div>
          </div>
      )}

      {/* Carrito Lateral Simplificado */}
      <div className={`fixed inset-0 bg-brand-dark/20 backdrop-blur-sm z-50 transition-opacity ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)}>
        <div className={`absolute right-0 h-full w-[320px] bg-white p-6 shadow-2xl transition-transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
           <h2 className="text-xl font-black text-brand-dark mb-6 border-b pb-4">Tu pedido</h2>
           <div className="space-y-4 mb-8">
             {cart.map((item, idx) => (
               <div key={idx} className="flex gap-3 items-center">
                 <div className="w-10 h-10 bg-brand-white rounded-lg overflow-hidden flex-shrink-0">
                   <img src={item.selectedDesign?.image || productsWithPrices.find(p => p.id === item.productId)?.images?.[0]} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{productsWithPrices.find(p => p.id === item.productId)?.name}</p>
                    <p className="text-[10px] text-brand-greige">{item.quantity} un.</p>
                 </div>
                 <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-brand-red text-xs">✕</button>
               </div>
             ))}
           </div>
           <div className="border-t pt-4">
              <div className="flex justify-between mb-6">
                <span className="font-bold">Total</span>
                <span className="font-black text-brand-sage">${cartTotal.toFixed(0)}</span>
              </div>
              <button onClick={sendWhatsAppOrder} className="w-full bg-[#25D366] text-white py-4 rounded-xl font-black text-sm shadow-lg">Confirmar WhatsApp</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerShop;
