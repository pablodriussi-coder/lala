
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    isInCart: boolean,
    onOpenSelector: (product: Product & { price: number }) => void
}> = ({ product, isInCart, onOpenSelector }) => {
    const hasImages = product.images && product.images.length > 0;

    return (
        <div 
          onClick={() => onOpenSelector(product)}
          className={`bg-white rounded-[1rem] md:rounded-[1.25rem] overflow-hidden shadow-sm border transition-all duration-300 group flex flex-col h-full cursor-pointer relative ${isInCart ? 'border-brand-sage ring-2 ring-brand-sage/20 shadow-lg scale-[1.02]' : 'border-brand-beige hover:border-brand-greige hover:shadow-xl'}`}
        >
            {isInCart && (
              <div className="absolute top-2 right-2 z-20 bg-brand-sage text-white w-6 h-6 rounded-full flex items-center justify-center shadow-lg animate-bounce-subtle">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
            )}
            <div className="aspect-[4/5] bg-brand-white relative overflow-hidden flex items-center justify-center">
                {hasImages ? (
                    <img src={product.images![0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={product.name} referrerPolicy="no-referrer" />
                ) : <div className="text-4xl md:text-5xl grayscale opacity-10 select-none">🍼</div>}
                <div className="absolute top-2 left-2 md:top-3 md:left-3 bg-brand-dark/80 backdrop-blur-sm text-white px-2 py-0.5 md:px-3 md:py-1 rounded-full font-black text-[9px] md:text-[10px] shadow-lg">${product.price.toFixed(0)}</div>
            </div>
            <div className="p-3 md:p-4 flex-1 flex flex-col text-center">
                <h3 className="text-[10px] md:text-xs font-bold text-brand-dark mb-2 uppercase tracking-tight leading-tight line-clamp-2 min-h-[2.5em] flex items-center justify-center">{product.name}</h3>
                <div className="w-full mt-auto bg-brand-sage text-white py-2 md:py-2.5 rounded-lg md:rounded-xl font-black text-[8px] md:text-[9px] uppercase tracking-widest hover:bg-brand-dark transition-all active:scale-95 shadow-sm flex items-center justify-center gap-2">
                  Ver Detalles
                </div>
            </div>
        </div>
    );
};

const CustomerShop: React.FC<CustomerShopProps> = ({ data }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectingProduct, setSelectingProduct] = useState<(Product & { price: number }) | null>(null);
  const [selectedDesignIds, setSelectedDesignIds] = useState<string[]>([]);

  useEffect(() => {
    if (selectingProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectingProduct]);

  const productsWithPrices = useMemo(() => {
    if (!data.products) return [];
    return data.products.map(p => ({
      ...p,
      price: p.customPrice || calculateFinalPrice(p, data.materials || [], data.settings?.defaultMargin || 0)
    }));
  }, [data.products, data.materials, data.settings?.defaultMargin]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    if (selectedCategoryId === 'all') return productsWithPrices;
    return productsWithPrices.filter(p => p.categoryId === selectedCategoryId);
  }, [selectedCategoryId, productsWithPrices]);

  const latestShowroomEntries = useMemo(() => {
    return [...(data.showroomEntries || [])].slice(0, 3);
  }, [data.showroomEntries]);

  const addToCart = () => {
    if (!selectingProduct) return;
    
    const designs = selectingProduct.designOptions?.filter(d => selectedDesignIds.includes(d.id)) || [];
    const hasOptions = selectingProduct.designOptions && selectingProduct.designOptions.length > 0;
    
    setCart(prev => {
      const otherItems = prev.filter(item => item.productId !== selectingProduct.id);
      
      // If product has no options and is already in cart, and we are in the modal, 
      // we might want to toggle it off if they click "Quitar" or just keep it.
      // But the user said "añadir al carrito" from the detail.
      
      const newItems: CartItem[] = [];
      if (designs.length > 0) {
        designs.forEach(design => {
          newItems.push({ productId: selectingProduct.id, quantity: 1, selectedDesign: design });
        });
      } else if (!hasOptions) {
        // If it's already in cart, we keep it (or we could toggle, but user said "añadir")
        newItems.push({ productId: selectingProduct.id, quantity: 1 });
      }
      
      return [...otherItems, ...newItems];
    });
    
    setSelectingProduct(null);
    setSelectedDesignIds([]);
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
    setSelectingProduct(null);
    setSelectedDesignIds([]);
  };

  const toggleQuickProduct = (product: Product & { price: number }) => {
    setCart(prev => {
      const isInCart = prev.some(item => item.productId === product.id);
      if (isInCart) {
        return prev.filter(item => item.productId !== product.id);
      } else {
        return [...prev, { productId: product.id, quantity: 1 }];
      }
    });
  };

  const toggleDesignSelection = (designId: string) => {
    setSelectedDesignIds(prev => {
      if (prev.includes(designId)) {
        return prev.filter(id => id !== designId);
      } else {
        return [...prev, designId];
      }
    });
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

  if (!data || !data.categories) return <div className="min-h-screen bg-brand-white flex items-center justify-center">Cargando tienda...</div>;

  return (
    <div className="min-h-screen bg-brand-white pb-32 animate-fadeIn font-['Quicksand'] relative overflow-x-hidden">
      <style>{`
        @keyframes bounce-subtle {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 0.5s ease-in-out;
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
      
      {/* Redes Sociales Barra Derecha Fija - Consistencia con el Blog */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[90] flex flex-col gap-2">
        {data.settings.instagramUrl && (
           <a href={data.settings.instagramUrl} target="_blank" rel="noreferrer" className="bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white p-4 rounded-l-3xl shadow-2xl hover:-translate-x-3 transition-all flex items-center gap-2 group">
             <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058-1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
             <span className="hidden group-hover:block text-[10px] font-black uppercase tracking-widest ml-2">Instagram</span>
           </a>
        )}
        {data.settings.facebookUrl && (
           <a href={data.settings.facebookUrl} target="_blank" rel="noreferrer" className="bg-[#1877F2] text-white p-4 rounded-l-3xl shadow-2xl hover:-translate-x-3 transition-all flex items-center gap-2 group">
             <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
             <span className="hidden group-hover:block text-[10px] font-black uppercase tracking-widest ml-2">Facebook</span>
           </a>
        )}
        <button onClick={() => window.open(`https://wa.me/${data.settings.whatsappNumber}`, '_blank')} className="bg-[#25D366] text-white p-5 rounded-l-3xl shadow-2xl hover:-translate-x-3 transition-all flex items-center gap-2 group">
           <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
           <span className="hidden group-hover:block text-[10px] font-black uppercase tracking-widest ml-2">WhatsApp</span>
        </button>
      </div>

      {/* Botón Carrito */}
      <button onClick={() => setIsCartOpen(true)} className="fixed bottom-8 right-4 md:right-6 z-[90] bg-[#2c2c2c] p-4 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90">
        <div className="relative text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-brand-red text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-[#2c2c2c]">{cart.length}</span>}
        </div>
      </button>

      {/* Hero Banner Section */}
      <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden flex items-center justify-center">
        {data.settings.shopBannerImage ? (
          <img src={data.settings.shopBannerImage} className="absolute inset-0 w-full h-full object-cover object-left lg:object-center" alt="Banner" referrerPolicy="no-referrer" />
        ) : (
          <div className="absolute inset-0 bg-brand-beige" />
        )}
        
        {/* Overlay Logo/Brand Name */}
        <div className="relative z-10 flex flex-col items-center justify-center p-6">
          {data.settings.shopLogo ? (
            <img src={data.settings.shopLogo} alt={data.settings.brandName} className="max-h-24 md:max-h-36 w-auto object-contain drop-shadow-md" referrerPolicy="no-referrer" />
          ) : (
            <h1 className="text-5xl md:text-8xl font-black text-brand-dark tracking-tighter text-center drop-shadow-md">
              {data.settings.brandName}
            </h1>
          )}
          {data.settings.shopBannerText && (
            <div className="mt-8 border-l-2 border-brand-dark/60 pl-4 max-w-sm self-center md:self-auto">
              <p className="text-brand-dark/80 text-sm md:text-base font-medium italic text-left leading-relaxed">
                "{data.settings.shopBannerText}"
              </p>
            </div>
          )}
        </div>
      </div>

      <div id="catalogo" className="w-full relative z-20">
        {!selectedCategoryId ? (
          <div className="flex flex-col">
            {/* Categorías */}
            <div className="bg-[#8eb3a2] py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Catálogo de Ternura</h3>
                        <h2 className="text-sm font-bold text-white/80 uppercase tracking-[0.2em] mt-2">Explora nuestras categorías</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        <button onClick={() => setSelectedCategoryId('all')} className="flex flex-col items-center group active:scale-95 transition-transform">
                            <div className="aspect-square w-full rounded-3xl overflow-hidden mb-4 bg-brand-dark flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-700">
                                <span className="text-4xl">✨</span>
                            </div>
                            <span className="text-sm font-bold text-white uppercase tracking-wider text-center px-1">Ver Todo</span>
                        </button>
                        {data.categories.map(cat => (
                        <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className="flex flex-col items-center group active:scale-95 transition-transform">
                            <div className="aspect-square w-full rounded-3xl overflow-hidden mb-4 bg-white shadow-lg">
                            {cat.image ? <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.name} referrerPolicy="no-referrer" /> : <div className="w-full h-full flex items-center justify-center text-4xl grayscale opacity-10">🎀</div>}
                            </div>
                            <span className="text-sm font-bold text-white uppercase tracking-wider text-center px-1">{cat.name}</span>
                        </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Vista Previa del Blog/Showroom */}
            {latestShowroomEntries.length > 0 && (
              <div className="bg-[#d1c7b7] py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                       <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Novedades</h3>
                       <h2 className="text-sm font-bold text-white/80 uppercase tracking-[0.2em] mt-2">Novedades desde el showroom</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       {latestShowroomEntries.map(entry => (
                         <Link to="/showroom" key={entry.id} className="bg-white rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all group overflow-hidden flex flex-col h-full">
                            <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden mb-6 relative">
                               {entry.image ? (
                                 <img src={entry.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={entry.title} referrerPolicy="no-referrer" />
                               ) : <div className="w-full h-full flex items-center justify-center text-3xl grayscale opacity-10">✨</div>}
                            </div>
                            <div className="flex-1 flex flex-col">
                               <h4 className="text-lg font-black text-gray-800 mb-2 leading-tight group-hover:text-[#8eb3a2] transition-colors line-clamp-2">{entry.title}</h4>
                               <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-1">{entry.content}</p>
                               <span className="text-[#8eb3a2] font-bold text-sm uppercase tracking-wider group-hover:translate-x-1 transition-transform">Leer más →</span>
                            </div>
                         </Link>
                       ))}
                    </div>
                </div>
              </div>
            )}

            {/* Contactanos */}
            <div className="bg-[#b59a7f] py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                       <h3 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">Contactanos</h3>
                       <h2 className="text-sm font-bold text-white/80 uppercase tracking-[0.2em] mt-2">Comunicate con nosotros</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="text-white space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">Ubicación</h4>
                                    <p className="text-white/80">{data.settings.shopAddress || 'Showroom en Buenos Aires'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">Email</h4>
                                    <p className="text-white/80">contacto@lalaaccesorios.com</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg">Teléfono</h4>
                                    <p className="text-white/80">{data.settings.whatsappNumber}</p>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px] bg-white/20 rounded-3xl overflow-hidden backdrop-blur-sm flex items-center justify-center relative">
                            {data.settings.googleMapsUrl ? (
                              <iframe 
                                src={data.settings.googleMapsUrl} 
                                className="absolute inset-0 w-full h-full border-0" 
                                allowFullScreen={false} 
                                loading="lazy" 
                                referrerPolicy="no-referrer-when-downgrade"
                              ></iframe>
                            ) : (
                              <div className="text-white/60 text-center p-6">
                                <span className="text-4xl block mb-2">📍</span>
                                <p className="font-bold text-sm">Ubicación no configurada</p>
                              </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16 animate-fadeIn">
            <div className="bg-white p-6 md:p-16 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-brand-beige">
                <button onClick={() => setSelectedCategoryId(null)} className="flex items-center gap-2 md:gap-3 text-brand-dark hover:text-brand-sage font-black text-[10px] md:text-[12px] uppercase tracking-widest mb-8 md:mb-12 transition-all group">
                  <span className="group-hover:-translate-x-2 transition-transform text-lg md:text-xl">←</span> Volver al inicio
                </button>
                <div className="flex items-center gap-4 md:gap-8 mb-8 md:mb-16">
                  <h2 className="text-2xl md:text-6xl font-black text-brand-dark uppercase tracking-tighter leading-none">
                      {selectedCategoryId === 'all' ? 'Nuestro Catálogo' : data.categories.find(c => c.id === selectedCategoryId)?.name}
                  </h2>
                  <div className="h-0.5 md:h-1 flex-1 bg-brand-beige opacity-30 rounded-full"></div>
                </div>
                {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-10">
                    {filteredProducts.map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        isInCart={cart.some(item => item.productId === product.id)}
                        onOpenSelector={(p) => {
                          setSelectingProduct(p);
                          // Pre-select designs already in cart for this product
                          const currentDesigns = cart
                            .filter(item => item.productId === p.id && item.selectedDesign)
                            .map(item => item.selectedDesign!.id);
                          setSelectedDesignIds(currentDesigns);
                        }} 
                      />
                    ))}
                </div>
                ) : (
                  <div className="text-center py-40 bg-brand-white/50 rounded-[2rem] border border-dashed border-brand-beige">
                    <p className="text-brand-dark italic text-xl opacity-40">Estamos preparando nuevos productos para esta sección...</p>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Selector de Tela / Detalles de Producto (Modal Optimizado) */}
      {selectingProduct && (
          <div className="fixed inset-0 bg-brand-dark/70 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-6 overflow-hidden" onClick={() => setSelectingProduct(null)}>
              <div className="bg-white w-full max-w-xl rounded-[1.75rem] p-6 md:p-10 shadow-2xl border border-brand-beige flex flex-col max-h-[90vh] animate-slideUp relative" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black text-brand-dark uppercase tracking-tight leading-tight">{selectingProduct.name}</h3>
                      <p className="text-xl font-bold text-brand-sage mt-1">${selectingProduct.price.toFixed(0)}</p>
                    </div>
                    <button onClick={() => setSelectingProduct(null)} className="text-brand-dark hover:text-brand-red text-3xl transition-colors p-2 -mt-2 -mr-2">✕</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar min-h-0">
                      {selectingProduct.images && selectingProduct.images.length > 0 && (
                        <div className="w-full rounded-[1.5rem] overflow-hidden mb-6 border border-brand-beige shadow-sm bg-brand-white flex-shrink-0 flex items-center justify-center bg-gray-50/30">
                          <img src={selectingProduct.images[0]} className="max-w-full max-h-[40vh] md:max-h-[50vh] object-contain" alt={selectingProduct.name} referrerPolicy="no-referrer" />
                        </div>
                      )}
                      
                      <div className="bg-brand-white/50 p-4 md:p-6 rounded-[1rem] border-l-4 border-brand-sage mb-6 flex-shrink-0">
                        <p className="text-xs md:text-sm text-brand-dark/80 italic leading-relaxed">
                          {selectingProduct.description || 'Artesanía pura diseñada con amor para acompañar el crecimiento de tu bebé.'}
                        </p>
                      </div>

                      <label className="block text-[10px] md:text-[11px] font-black text-brand-dark uppercase tracking-[0.3em] mb-4 text-center">Selecciona uno o varios estampados:</label>
                      {selectingProduct.designOptions && selectingProduct.designOptions.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-5">
                              {selectingProduct.designOptions.map(design => {
                                  const isSelected = selectedDesignIds.includes(design.id);
                                  return (
                                    <button 
                                      key={design.id} 
                                      onClick={() => toggleDesignSelection(design.id)} 
                                      className={`p-2 rounded-[1.25rem] border-2 transition-all group relative ${isSelected ? 'border-brand-sage bg-brand-white shadow-lg scale-105' : 'border-brand-beige hover:border-brand-greige'}`}
                                    >
                                        {isSelected && (
                                          <div className="absolute top-1 right-1 z-10 bg-brand-sage text-white w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                          </div>
                                        )}
                                        <div className="aspect-square rounded-[1rem] overflow-hidden mb-2">
                                          <img src={design.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={design.name} referrerPolicy="no-referrer" />
                                        </div>
                                        <span className="text-[9px] md:text-[10px] font-black block truncate text-center uppercase text-brand-dark">{design.name}</span>
                                    </button>
                                  );
                              })}
                          </div>
                      ) : (
                        <div className="text-center py-12 bg-brand-white/50 rounded-[1.5rem] border border-dashed border-brand-beige">
                          <p className="text-brand-dark/60 italic text-[10px] px-6">Estampados exclusivos según stock disponible.</p>
                        </div>
                      )}
                  </div>
                  
                  <div className="flex flex-col md:flex-row gap-4 mt-auto">
                      <button onClick={() => { setSelectingProduct(null); setSelectedDesignIds([]); }} className="md:flex-1 py-3 font-black text-brand-dark/40 uppercase text-[9px] tracking-widest hover:text-brand-dark transition-colors order-2 md:order-1">Cancelar</button>
                      
                      {cart.some(item => item.productId === selectingProduct.id) ? (
                        <div className="md:flex-[3] flex flex-col sm:flex-row gap-3 order-1 md:order-2">
                           <button 
                            onClick={() => removeFromCart(selectingProduct.id)}
                            className="flex-1 py-4 md:py-5 rounded-[1.5rem] font-black text-[11px] md:text-[13px] uppercase tracking-[0.2em] bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all active:scale-95"
                          >
                            Quitar
                          </button>
                          <button 
                            onClick={addToCart} 
                            disabled={selectingProduct.designOptions && selectingProduct.designOptions.length > 0 && selectedDesignIds.length === 0}
                            className={`flex-[2] py-4 md:py-5 rounded-[1.5rem] font-black text-[11px] md:text-[13px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${selectingProduct.designOptions && selectingProduct.designOptions.length > 0 && selectedDesignIds.length === 0 ? 'bg-brand-beige text-brand-dark/30 cursor-not-allowed' : 'bg-brand-sage text-white hover:bg-brand-dark hover:scale-[1.02]'}`}
                          >
                            {selectingProduct.designOptions && selectingProduct.designOptions.length > 0 ? 'Actualizar' : 'Añadido'}
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={addToCart} 
                          disabled={selectingProduct.designOptions && selectingProduct.designOptions.length > 0 && selectedDesignIds.length === 0}
                          className={`md:flex-[3] py-4 md:py-5 rounded-[1.5rem] font-black text-[11px] md:text-[13px] uppercase tracking-[0.25em] shadow-xl transition-all active:scale-95 order-1 md:order-2 ${selectingProduct.designOptions && selectingProduct.designOptions.length > 0 && selectedDesignIds.length === 0 ? 'bg-brand-beige text-brand-dark/30 cursor-not-allowed' : 'bg-brand-sage text-white hover:bg-brand-dark hover:scale-[1.02]'}`}
                        >
                          {selectedDesignIds.length > 1 ? `Añadir ${selectedDesignIds.length} Variantes` : 'Añadir al Carrito'}
                        </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Carrito Lateral (Actualizado con nuevo redondeo) */}
      <div className={`fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-[210] transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)}>
        <div className={`absolute right-0 h-full w-full max-w-[450px] bg-white p-6 md:p-10 shadow-2xl transition-transform duration-700 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-10 border-b border-brand-white pb-6">
              <h2 className="text-2xl md:text-3xl font-black text-brand-dark uppercase tracking-tight">Tu pedido <span className="text-brand-red">★</span></h2>
              <button onClick={() => setIsCartOpen(false)} className="text-brand-dark hover:text-brand-red text-2xl transition-colors p-2">✕</button>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
             {cart.length > 0 ? (
               <>
                 <div className="space-y-6">
                   {cart.map((item, idx) => {
                     const p = productsWithPrices.find(prod => prod.id === item.productId);
                     return (
                       <div key={idx} className="flex gap-4 md:gap-6 items-center animate-fadeIn bg-brand-white/30 p-3 md:p-4 rounded-[1.25rem] border border-brand-white hover:border-brand-beige transition-all group">
                         <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-white rounded-[1rem] overflow-hidden flex-shrink-0 border border-brand-beige shadow-sm">
                           <img src={item.selectedDesign?.image || (p?.images && p.images[0])} className="w-full h-full object-cover" alt="item" referrerPolicy="no-referrer" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-black text-brand-dark truncate uppercase tracking-tight">{p?.name}</p>
                            {item.selectedDesign && <p className="text-[9px] md:text-[10px] font-bold text-brand-sage uppercase tracking-widest mt-0.5 opacity-90">Tela: {item.selectedDesign.name}</p>}
                            <div className="flex justify-between items-end mt-2">
                              <span className="text-[9px] font-black text-brand-dark/60 bg-brand-white px-2 py-0.5 rounded-lg border border-brand-beige">{item.quantity} un.</span>
                              <span className="text-xs md:text-sm font-black text-brand-dark">${((p?.price || 0) * item.quantity).toFixed(0)}</span>
                            </div>
                         </div>
                         <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-brand-red opacity-40 hover:opacity-100 p-2 transition-opacity">✕</button>
                       </div>
                     );
                   })}
                 </div>
                 
                 <div className="pt-8 space-y-6">
                    <button 
                      onClick={sendWhatsAppOrder} 
                      disabled={cart.length === 0} 
                      className="w-full bg-[#25D366] text-white py-4 md:py-5 rounded-[1.5rem] font-black text-[14px] md:text-[16px] uppercase tracking-[0.3em] shadow-xl hover:bg-brand-dark transition-all active:scale-95 flex items-center justify-center gap-3 group"
                    >
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      HACER PEDIDO
                    </button>

                    <div className="border-t-2 border-brand-white pt-6 flex justify-between items-end">
                      <span className="text-[11px] font-black text-brand-dark/50 uppercase tracking-[0.4em]">Total</span>
                      <span className="text-3xl font-black text-brand-sage">${cartTotal.toFixed(0)}</span>
                    </div>
                 </div>
               </>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                 <div className="text-6xl mb-6 animate-bounce">🧺</div>
                 <p className="font-black uppercase tracking-[0.4em] text-[11px] text-brand-dark">Tu carrito está vacío</p>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-brand-dark text-white pt-16 pb-8 px-6 mt-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">{data.settings.brandName}</h3>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">{data.settings.shopBannerText}</p>
          </div>
          
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sage mb-6">Contacto</h4>
            <ul className="space-y-4 text-sm text-white/80">
              {data.settings.shopEmail && (
                <li className="flex items-center gap-3">
                  <span className="text-brand-sage">✉</span>
                  <a href={`mailto:${data.settings.shopEmail}`} className="hover:text-white transition-colors">{data.settings.shopEmail}</a>
                </li>
              )}
              {data.settings.whatsappNumber && (
                <li className="flex items-center gap-3">
                  <span className="text-brand-sage">✆</span>
                  <a href={`https://wa.me/${data.settings.whatsappNumber}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">+{data.settings.whatsappNumber}</a>
                </li>
              )}
              {data.settings.shopAddress && (
                <li className="flex items-start gap-3">
                  <span className="text-brand-sage mt-1">📍</span>
                  <span className="leading-relaxed">{data.settings.shopAddress}</span>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-sage mb-6">Redes Sociales</h4>
            <div className="flex gap-4">
              {data.settings.instagramUrl && (
                <a href={data.settings.instagramUrl} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-sage hover:text-brand-dark transition-all">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058-1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
              )}
              {data.settings.facebookUrl && (
                <a href={data.settings.facebookUrl} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-brand-sage hover:text-brand-dark transition-all">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto border-t border-white/10 pt-8 text-center text-white/40 text-xs font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} {data.settings.brandName}. Todos los derechos reservados.
          <div className="mt-4">
            <Link to="/admin" className="text-white/10 hover:text-brand-sage transition-colors text-[8px]">Acceso Staff</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerShop;
