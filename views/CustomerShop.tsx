
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
      <button onClick={() => setIsCartOpen(true)} className="fixed bottom-6 right-6 z-40 bg-brand-dark p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90">
        <div className="relative text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          {cart.length > 0 && <span className="absolute -top-3 -right-3 bg-brand-red text-white text-[9px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-brand-dark">{cart.length}</span>}
        </div>
      </button>

      {/* Hero Banner Section - Aclarado para logos oscuros */}
      <div className="relative w-full h-[400px] md:h-[600px] overflow-hidden bg-white flex items-center justify-center">
        {data.settings.shopBannerImage ? (
          <img src={data.settings.shopBannerImage} className="absolute inset-0 w-full h-full object-cover opacity-25" />
        ) : (
          <div className="absolute inset-0 bg-brand-beige opacity-10"></div>
        )}
        
        {/* Overlay degradado claro (blanco) */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/80"></div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl animate-fadeIn">
          {data.settings.shopLogo ? (
            <div className="flex flex-col items-center mb-6">
              <img 
                src={data.settings.shopLogo} 
                className="max-h-[220px] md:max-h-[320px] w-auto animate-fadeIn drop-shadow-sm" 
                alt={data.settings.brandName} 
              />
            </div>
          ) : (
            <h1 className="text-4xl md:text-7xl font-black text-brand-dark mb-4 tracking-tighter">
              {data.settings.brandName} <span className="text-brand-red">★</span>
            </h1>
          )}
          
          <p className="text-brand-dark text-lg md:text-2xl font-bold opacity-80 leading-relaxed italic max-w-2xl mx-auto">
            "{data.settings.shopBannerText || 'Confecciones artesanales hechas con amor para tu bebé'}"
          </p>
          
          <div className="mt-10 flex justify-center gap-3">
             <div className="w-3 h-3 rounded-full bg-brand-beige"></div>
             <div className="w-3 h-3 rounded-full bg-brand-red shadow-lg shadow-brand-red/30"></div>
             <div className="w-3 h-3 rounded-full bg-brand-beige"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        {!selectedCategoryId ? (
          <div className="space-y-10">
            <div className="bg-white/95 backdrop-blur-xl p-8 md:p-14 rounded-[4rem] shadow-2xl border border-brand-beige">
                <div className="text-center mb-12">
                    <h2 className="text-xs font-black text-brand-sage uppercase tracking-[0.5em] mb-3">Descubre nuestro universo</h2>
                    <h3 className="text-4xl font-black text-brand-dark uppercase tracking-tight">Catálogo de Ternura</h3>
                    <div className="w-20 h-1 bg-brand-red/20 mx-auto mt-4 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {data.categories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className="bg-white p-5 rounded-[2.5rem] border border-brand-beige shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col items-center group active:scale-95">
                        <div className="aspect-square w-full rounded-3xl overflow-hidden mb-5 bg-brand-white border border-brand-white/50">
                        {cat.image ? <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full flex items-center justify-center text-4xl grayscale opacity-10">🎀</div>}
                        </div>
                        <span className="text-sm font-black text-brand-dark uppercase tracking-widest group-hover:text-brand-sage transition-colors">{cat.name}</span>
                    </button>
                    ))}
                </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-xl border border-brand-beige">
                <button onClick={() => setSelectedCategoryId(null)} className="flex items-center gap-3 text-brand-greige hover:text-brand-dark font-black text-[10px] uppercase tracking-widest mb-8 transition-all group">
                  <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver al inicio
                </button>
                <div className="flex items-center gap-6 mb-12">
                <h2 className="text-3xl md:text-5xl font-black text-brand-dark uppercase tracking-tighter">
                    {data.categories.find(c => c.id === selectedCategoryId)?.name}
                </h2>
                <div className="h-0.5 flex-1 bg-brand-beige opacity-40"></div>
                </div>
                {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {filteredProducts.map(product => <ProductCard key={product.id} product={product} onOpenSelector={setSelectingProduct} />)}
                </div>
                ) : <p className="text-center py-28 text-brand-greige italic text-lg opacity-60">Estamos preparando nuevos productos para esta sección...</p>}
            </div>
          </div>
        )}
      </div>

      {/* Selector de Tela */}
      {selectingProduct && (
          <div className="fixed inset-0 bg-brand-dark/70 backdrop-blur-md z-[60] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl border border-brand-beige overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-3xl font-black text-brand-dark uppercase tracking-tight">{selectingProduct.name}</h3>
                      <p className="text-sm font-bold text-brand-sage mt-1">${selectingProduct.price.toFixed(0)}</p>
                    </div>
                    <button onClick={() => setSelectingProduct(null)} className="text-brand-greige hover:text-brand-red text-3xl transition-colors">✕</button>
                  </div>
                  <p className="text-sm text-brand-greige mb-8 italic leading-relaxed border-l-4 border-brand-beige pl-4">{selectingProduct.description || 'Artesanía pura diseñada con amor para acompañar los mejores momentos.'}</p>
                  
                  <div className="flex-1 overflow-y-auto mb-10 pr-2">
                      <label className="block text-[11px] font-black text-brand-dark uppercase tracking-[0.2em] mb-5">Elige tu estampado favorito:</label>
                      {selectingProduct.designOptions?.length ? (
                          <div className="grid grid-cols-3 gap-4">
                              {selectingProduct.designOptions.map(design => (
                                  <button key={design.id} onClick={() => setSelectedDesignId(design.id)} className={`p-2 rounded-2xl border-2 transition-all group ${selectedDesignId === design.id ? 'border-brand-sage bg-brand-white shadow-lg' : 'border-brand-beige hover:border-brand-greige'}`}>
                                      <div className="aspect-square rounded-xl overflow-hidden mb-3">
                                        <img src={design.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                      </div>
                                      <span className="text-[10px] font-black block truncate text-center uppercase">{design.name}</span>
                                  </button>
                              ))}
                          </div>
                      ) : <p className="text-brand-greige italic text-sm text-center py-12 bg-brand-white/50 rounded-3xl border border-dashed border-brand-beige">Este producto se confecciona con estampados exclusivos según stock disponible.</p>}
                  </div>
                  <div className="flex gap-5">
                      <button onClick={() => setSelectingProduct(null)} className="flex-1 font-black text-brand-greige uppercase text-[10px] tracking-widest">Cancelar</button>
                      <button onClick={addToCart} className="flex-[3] bg-brand-sage text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-brand-dark transition-all active:scale-95">Añadir al Carrito</button>
                  </div>
              </div>
          </div>
      )}

      {/* Carrito Lateral */}
      <div className={`fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-50 transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)}>
        <div className={`absolute right-0 h-full w-full max-w-[420px] bg-white p-10 shadow-2xl transition-transform duration-700 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-12 border-b border-brand-white pb-8">
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tight">Tu pedido <span className="text-brand-red">★</span></h2>
              <button onClick={() => setIsCartOpen(false)} className="text-brand-greige hover:text-brand-dark text-2xl">✕</button>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-8 pr-2">
             {cart.length > 0 ? cart.map((item, idx) => {
               const p = productsWithPrices.find(prod => prod.id === item.productId);
               return (
                 <div key={idx} className="flex gap-5 items-center animate-fadeIn" style={{ animationDelay: `${idx * 0.1}s` }}>
                   <div className="w-20 h-20 bg-brand-white rounded-3xl overflow-hidden flex-shrink-0 border border-brand-beige shadow-sm">
                     <img src={item.selectedDesign?.image || p?.images?.[0]} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-brand-dark truncate uppercase tracking-tight">{p?.name}</p>
                      {item.selectedDesign && <p className="text-[10px] font-bold text-brand-sage uppercase tracking-widest mt-1 bg-brand-white/50 py-1 inline-block">Tela: {item.selectedDesign.name}</p>}
                      <div className="flex justify-between items-end mt-3">
                        <span className="text-[10px] font-black text-brand-greige bg-brand-white px-2 py-1 rounded-lg border border-brand-beige">{item.quantity} un.</span>
                        <span className="text-sm font-black text-brand-dark">${((p?.price || 0) * item.quantity).toFixed(0)}</span>
                      </div>
                   </div>
                   <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-brand-red opacity-20 hover:opacity-100 p-3 transition-opacity">✕</button>
                 </div>
               );
             }) : (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-30 animate-pulse">
                 <div className="text-8xl mb-6">🧺</div>
                 <p className="font-black uppercase tracking-widest text-xs">El carrito está vacío</p>
               </div>
             )}
           </div>

           <div className="border-t border-brand-white pt-10 mt-8">
              <div className="flex justify-between items-end mb-10">
                <span className="text-[11px] font-black text-brand-greige uppercase tracking-[0.3em]">Total estimado</span>
                <span className="text-4xl font-black text-brand-sage">${cartTotal.toFixed(0)}</span>
              </div>
              <button onClick={sendWhatsAppOrder} disabled={cart.length === 0} className="w-full bg-[#25D366] text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-green-200/50 hover:bg-brand-dark transition-all disabled:opacity-20 flex items-center justify-center gap-4 active:scale-95">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Confirmar WhatsApp
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerShop;
