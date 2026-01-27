
import React, { useState, useMemo } from 'react';
import { AppData, Product, DesignOption } from '../types';
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
    const [activeImage, setActiveImage] = useState(0);
    const hasImages = product.images && product.images.length > 0;

    return (
        <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-brand-beige hover:shadow-xl transition-all duration-300 group flex flex-col">
            <div className="aspect-[4/5] bg-brand-white relative overflow-hidden flex items-center justify-center">
                {hasImages ? (
                    <>
                        <img 
                            src={product.images![activeImage]} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                        />
                        {product.images!.length > 1 && (
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                                {product.images!.map((_, idx) => (
                                    <button 
                                        key={idx}
                                        onMouseEnter={() => setActiveImage(idx)}
                                        className={`w-1.5 h-1.5 rounded-full transition-all ${activeImage === idx ? 'bg-white scale-110' : 'bg-white/30'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : <div className="text-5xl grayscale opacity-10 select-none">🍼</div>}
                <div className="absolute top-3 left-3 bg-brand-dark/80 backdrop-blur-sm text-white px-3 py-1 rounded-full font-black text-[10px] shadow-lg">
                    ${product.price.toFixed(0)}
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col text-center">
                <h3 className="text-lg font-bold text-brand-dark mb-1 tracking-tight truncate">{product.name}</h3>
                <p className="text-brand-greige text-[11px] mb-4 italic flex-1 line-clamp-2 leading-tight">
                    {product.description || 'Hecho con amor.'}
                </p>
                <button 
                    onClick={() => onOpenSelector(product)}
                    className="w-full bg-brand-sage text-white py-3 rounded-xl font-black text-xs hover:bg-brand-dark transition-all shadow-sm active:scale-95"
                >
                    Elegir y comprar
                </button>
            </div>
        </div>
    );
};

const CustomerShop: React.FC<CustomerShopProps> = ({ data }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectingProduct, setSelectingProduct] = useState<(Product & { price: number }) | null>(null);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  const productsWithPrices = useMemo(() => {
    return data.products.map(p => ({
      ...p,
      price: calculateFinalPrice(p, data.materials, data.settings.defaultMargin)
    }));
  }, [data.products, data.materials, data.settings.defaultMargin]);

  const addToCart = () => {
    if (!selectingProduct) return;
    
    const design = selectingProduct.designOptions?.find(d => d.id === selectedDesignId);
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === selectingProduct.id && item.selectedDesign?.id === design?.id);
      if (existing) {
        return prev.map(item => (item.productId === selectingProduct.id && item.selectedDesign?.id === design?.id) ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: selectingProduct.id, quantity: 1, selectedDesign: design }];
    });
    
    setSelectingProduct(null);
    setSelectedDesignId(null);
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
        if (i === index) {
            return { ...item, quantity: Math.max(1, item.quantity + delta) };
        }
        return item;
    }));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const p = productsWithPrices.find(prod => prod.id === item.productId);
      return acc + (p?.price || 0) * item.quantity;
    }, 0);
  }, [cart, productsWithPrices]);

  const sendWhatsAppOrder = () => {
    const itemsText = cart.map(item => {
      const p = productsWithPrices.find(prod => prod.id === item.productId);
      const designTxt = item.selectedDesign ? ` (Tela: ${item.selectedDesign.name})` : '';
      return `- ${item.quantity}x ${p?.name}${designTxt} [$${((p?.price || 0) * item.quantity).toFixed(0)}]`;
    }).join('%0A');

    const message = `¡Hola ${data.settings.brandName}! ✨ Me gustaría pedir:%0A%0A${itemsText}%0A%0A*Total: $${cartTotal.toFixed(0)}*%0A%0A¿Me confirmás disponibilidad de las telas? 😊`;
    const phone = data.settings.whatsappNumber || '5491100000000';
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-brand-white pb-32 animate-fadeIn font-['Quicksand'] relative">
      {/* Botón Carrito */}
      <button onClick={() => setIsCartOpen(true)} className="fixed bottom-6 right-6 z-40 bg-brand-dark p-4 rounded-full shadow-2xl group active:scale-95 transition-all md:top-6 md:bottom-auto">
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {cart.length > 0 && <span className="absolute -top-3 -right-3 bg-brand-red text-white text-[9px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-brand-dark shadow-sm animate-bounce">{cart.reduce((a,b)=>a+b.quantity,0)}</span>}
        </div>
      </button>

      <header className="bg-white pt-16 pb-12 px-6 text-center border-b border-brand-beige mb-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-sage"></div>
        <h1 className="text-4xl md:text-5xl font-black text-brand-dark mb-2 tracking-tighter">{data.settings.brandName} <span className="text-brand-red">★</span></h1>
        <p className="text-brand-sage font-black uppercase tracking-[0.2em] text-[9px]">Accesorios artesanales para bebés</p>
      </header>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {productsWithPrices.map(product => <ProductCard key={product.id} product={product} onOpenSelector={setSelectingProduct} />)}
      </div>

      {/* SELECTOR DE TELA (MODAL) */}
      {selectingProduct && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-slideUp border border-brand-beige overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-2xl font-black text-brand-dark leading-none">{selectingProduct.name}</h3>
                        <p className="text-brand-greige text-xs font-bold mt-1 uppercase tracking-widest">Elige el diseño de tu tela</p>
                    </div>
                    <button onClick={() => {setSelectingProduct(null); setSelectedDesignId(null);}} className="text-brand-greige font-bold">✕</button>
                </div>
                
                <div className="flex-1 overflow-y-auto pr-2 mb-8">
                    {selectingProduct.designOptions && selectingProduct.designOptions.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {selectingProduct.designOptions.map(design => (
                                <button 
                                    key={design.id} 
                                    onClick={() => setSelectedDesignId(design.id)}
                                    className={`relative p-2 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group ${selectedDesignId === design.id ? 'border-brand-sage bg-brand-sage/5 scale-95 shadow-inner' : 'border-brand-beige hover:border-brand-sage/50 bg-white'}`}
                                >
                                    <div className="w-full aspect-square rounded-xl overflow-hidden shadow-sm">
                                        <img src={design.image} className="w-full h-full object-cover" />
                                    </div>
                                    <span className={`text-[10px] font-black uppercase tracking-tight truncate w-full ${selectedDesignId === design.id ? 'text-brand-sage' : 'text-brand-dark'}`}>
                                        {design.name}
                                    </span>
                                    {selectedDesignId === design.id && (
                                        <div className="absolute -top-2 -right-2 bg-brand-sage text-white rounded-full w-6 h-6 flex items-center justify-center text-[10px] shadow-lg animate-fadeIn">✓</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-brand-greige font-bold italic text-sm">Este producto no tiene opciones de tela disponibles, se confeccionará según stock.</p>
                        </div>
                    )}
                </div>

                <div className="flex gap-4">
                    <button onClick={() => {setSelectingProduct(null); setSelectedDesignId(null);}} className="flex-1 py-4 text-brand-greige font-bold">Cancelar</button>
                    <button 
                        onClick={addToCart} 
                        className={`flex-[2] py-4 rounded-2xl font-black text-white transition-all shadow-xl ${(!selectingProduct.designOptions?.length || selectedDesignId) ? 'bg-brand-sage hover:bg-brand-dark' : 'bg-brand-greige cursor-not-allowed'}`}
                    >
                        {(!selectingProduct.designOptions?.length || selectedDesignId) ? 'Confirmar y Añadir' : 'Elige una tela'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Carrito Lateral */}
      <div className={`fixed inset-0 bg-brand-dark/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)}>
        <div className={`absolute top-0 right-0 h-full w-full sm:w-[350px] bg-white shadow-2xl transition-transform duration-500 transform flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
          <div className="p-6 border-b border-brand-beige flex justify-between items-center bg-brand-white">
            <h2 className="text-lg font-black text-brand-dark">Tu pedido</h2>
            <button onClick={() => setIsCartOpen(false)} className="text-brand-greige p-2 font-bold">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center opacity-30 font-bold"><span className="text-5xl mb-4">🧺</span>Carrito vacío</div> : (
              <div className="flex flex-col gap-6">
                <div className="space-y-4">
                  {cart.map((item, idx) => {
                    const p = productsWithPrices.find(prod => prod.id === item.productId);
                    return (
                      <div key={idx} className="flex gap-4 group">
                        <div className="w-14 h-14 rounded-xl overflow-hidden border border-brand-beige flex-shrink-0">
                          <img src={item.selectedDesign?.image || p?.images?.[0]} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-brand-dark text-[13px] truncate">{p?.name}</p>
                          {item.selectedDesign && <p className="text-[10px] text-brand-red font-black uppercase tracking-tighter">Tela: {item.selectedDesign.name}</p>}
                          <p className="text-xs font-black text-brand-sage mt-1">${((p?.price || 0) * item.quantity).toFixed(0)}</p>
                          <div className="flex items-center bg-white border border-brand-beige w-max mt-2 rounded-lg">
                              <button onClick={() => updateQuantity(idx, -1)} className="px-2 font-bold">-</button>
                              <span className="px-2 text-[10px] font-black">{item.quantity}</span>
                              <button onClick={() => updateQuantity(idx, 1)} className="px-2 font-bold">+</button>
                          </div>
                        </div>
                        <button onClick={() => removeFromCart(idx)} className="text-brand-red/30 self-start p-1">✕</button>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-6 border-t border-brand-beige">
                  <div className="flex justify-between items-end mb-6">
                    <div><span className="text-[10px] font-black text-brand-greige uppercase tracking-widest block mb-1">Total a confirmar</span><span className="text-3xl font-black text-brand-dark tracking-tighter">${cartTotal.toFixed(0)}</span></div>
                  </div>
                  <button onClick={sendWhatsAppOrder} className="w-full bg-[#25D366] text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]">Confirmar pedido</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerShop;
