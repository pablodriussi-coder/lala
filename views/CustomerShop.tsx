
import React, { useState, useMemo } from 'react';
import { AppData, Product } from '../types';
import { calculateFinalPrice } from '../services/calculationService';

interface CustomerShopProps {
  data: AppData;
}

interface CartItem {
  productId: string;
  quantity: number;
}

const ProductCard: React.FC<{ 
    product: Product & { price: number }, 
    addToCart: (id: string) => void 
}> = ({ product, addToCart }) => {
    const [activeImage, setActiveImage] = useState(0);
    const hasImages = product.images && product.images.length > 0;

    return (
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-brand-beige hover:shadow-2xl transition-all duration-500 group flex flex-col">
            <div className="aspect-[4/5] bg-brand-white relative overflow-hidden flex items-center justify-center">
                {hasImages ? (
                    <>
                        <img 
                            src={product.images![activeImage]} 
                            alt={product.name} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                        />
                        {product.images!.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                {product.images!.map((_, idx) => (
                                    <button 
                                        key={idx}
                                        onMouseEnter={() => setActiveImage(idx)}
                                        className={`w-2 h-2 rounded-full transition-all ${activeImage === idx ? 'bg-white scale-125' : 'bg-white/40'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-7xl grayscale opacity-10 select-none">🍼</div>
                )}
                <div className="absolute top-6 left-6 bg-brand-dark text-white px-5 py-2 rounded-full font-black text-sm shadow-xl">
                    ${product.price.toFixed(0)}
                </div>
            </div>
            <div className="p-8 flex-1 flex flex-col text-center">
                <h3 className="text-2xl font-bold text-brand-dark mb-3 tracking-tight">{product.name}</h3>
                <p className="text-brand-greige text-sm mb-8 leading-relaxed italic flex-1">
                    {product.description || 'Diseño exclusivo confeccionado artesanalmente para brindar la mayor suavidad.'}
                </p>
                <button 
                    onClick={() => addToCart(product.id)}
                    className="w-full bg-brand-sage text-white py-5 rounded-2xl font-black hover:bg-brand-dark transition-all shadow-lg active:scale-95"
                >
                    Añadir al pedido
                </button>
            </div>
        </div>
    );
};

const CustomerShop: React.FC<CustomerShopProps> = ({ data }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const productsWithPrices = useMemo(() => {
    return data.products.map(p => ({
      ...p,
      price: calculateFinalPrice(p, data.materials, data.settings.defaultMargin)
    }));
  }, [data.products, data.materials, data.settings.defaultMargin]);

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const totalItems = cart.reduce((a,b) => a+b.quantity, 0);

  const cartTotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const p = productsWithPrices.find(prod => prod.id === item.productId);
      return acc + (p?.price || 0) * item.quantity;
    }, 0);
  }, [cart, productsWithPrices]);

  const sendWhatsAppOrder = () => {
    const itemsText = cart.map(item => {
      const p = productsWithPrices.find(prod => prod.id === item.productId);
      return `- ${item.quantity}x ${p?.name} ($${((p?.price || 0) * item.quantity).toFixed(2)})`;
    }).join('%0A');

    const message = `¡Hola ${data.settings.brandName}! ✨ Me encantaría pedir lo siguiente:%0A%0A${itemsText}%0A%0A*Total Estimado: $${cartTotal.toFixed(2)}*%0A%0A¿Me confirmás para avanzar? 😊`;
    const phone = data.settings.whatsappNumber || '5491100000000';
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-brand-white pb-32 animate-fadeIn font-['Quicksand'] relative">
      {/* Botón Carrito Superior Derecha */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="fixed top-8 right-8 z-40 bg-white p-4 rounded-full shadow-2xl border border-brand-beige group active:scale-95 transition-all"
      >
        <div className="relative">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-brand-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
              {totalItems}
            </span>
          )}
        </div>
      </button>

      <header className="bg-white pt-24 pb-20 px-6 text-center border-b border-brand-beige mb-16 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-brand-sage"></div>
        <div className="max-w-4xl mx-auto relative">
          <h1 className="text-6xl font-black text-brand-dark mb-6 tracking-tighter">{data.settings.brandName} <span className="text-brand-red">★</span></h1>
          <p className="text-brand-sage font-black uppercase tracking-[0.4em] text-xs mb-8">Artesanías que abrazan a tu bebé</p>
          <div className="w-20 h-1 bg-brand-beige mx-auto rounded-full"></div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {productsWithPrices.length > 0 ? productsWithPrices.map(product => (
          <ProductCard key={product.id} product={product} addToCart={addToCart} />
        )) : (
          <div className="col-span-full py-32 text-center text-brand-greige font-bold italic text-xl">
            Preparando nuevas sorpresas para tu bebé...
          </div>
        )}
      </div>

      {/* Carrito Flotante Lateral */}
      <div className={`fixed inset-0 bg-brand-dark/20 backdrop-blur-sm z-50 transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)}>
        <div 
          className={`absolute top-0 right-0 h-full w-full md:w-[450px] bg-white shadow-2xl transition-transform duration-500 transform ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            <div className="p-8 bg-brand-sage text-white flex justify-between items-center">
              <h2 className="text-2xl font-black flex items-center gap-3">🛒 Mi Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-3xl font-light hover:rotate-90 transition-transform">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <span className="text-6xl block mb-4 opacity-20">🧺</span>
                  <p className="text-brand-greige font-bold">Tu carrito está vacío</p>
                </div>
              ) : cart.map(item => {
                const p = productsWithPrices.find(prod => prod.id === item.productId);
                return (
                  <div key={item.productId} className="flex justify-between items-center border-b border-brand-white pb-6 last:border-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-brand-white flex items-center justify-center overflow-hidden border border-brand-beige">
                            {p?.images && p.images.length > 0 ? (
                                <img src={p.images[0]} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-xl">🧺</span>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-brand-dark">{p?.name}</p>
                            <p className="text-xs text-brand-greige font-bold">{item.quantity} x ${p?.price.toFixed(0)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-black text-brand-sage text-lg">${((p?.price || 0) * item.quantity).toFixed(0)}</span>
                      <button onClick={() => removeFromCart(item.productId)} className="text-brand-red opacity-30 hover:opacity-100 font-bold">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {cart.length > 0 && (
              <div className="p-10 bg-brand-white border-t border-brand-beige">
                <div className="flex justify-between text-3xl font-black text-brand-dark mb-8">
                  <span>TOTAL</span>
                  <span>${cartTotal.toFixed(0)}</span>
                </div>
                <button 
                  onClick={sendWhatsAppOrder}
                  className="w-full bg-green-500 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-4 hover:bg-green-600 transition-all shadow-xl shadow-green-500/20 active:scale-95"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Hacer mi pedido por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-40 py-16 text-center border-t border-brand-beige bg-white text-brand-greige text-[10px] font-black uppercase tracking-[0.3em]">
        &copy; {new Date().getFullYear()} {data.settings.brandName} ★ Amor en cada puntada
      </footer>
    </div>
  );
};

export default CustomerShop;
