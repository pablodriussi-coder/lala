
import React, { useState, useMemo } from 'react';
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
    onOpenSelector: (product: Product & { price: number }) => void 
}> = ({ product, onOpenSelector }) => {
    const hasImages = product.images && product.images.length > 0;
    return (
        <div className="bg-white rounded-[1.5rem] overflow-hidden shadow-sm border border-brand-beige hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
            <div className="aspect-[4/5] bg-brand-white relative overflow-hidden flex items-center justify-center">
                {hasImages ? (
                    <img src={product.images![0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={product.name} />
                ) : <div className="text-5xl grayscale opacity-10 select-none">🍼</div>}
                <div className="absolute top-3 left-3 bg-brand-dark/80 backdrop-blur-sm text-white px-3 py-1 rounded-full font-black text-[10px] shadow-lg">${product.price.toFixed(0)}</div>
            </div>
            <div className="p-4 flex-1 flex flex-col text-center">
                <h3 className="text-xs font-bold text-brand-dark mb-1 truncate uppercase tracking-tight">{product.name}</h3>
                <button onClick={() => onOpenSelector(product)} className="w-full mt-auto bg-brand-sage text-white py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-brand-dark transition-all active:scale-95 shadow-sm">Ver Detalles</button>
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
    if (!data.products) return [];
    return data.products.map(p => ({
      ...p,
      price: calculateFinalPrice(p, data.materials || [], data.settings?.defaultMargin || 0)
    }));
  }, [data.products, data.materials, data.settings?.defaultMargin]);

  const filteredProducts = useMemo(() => {
    if (!selectedCategoryId) return [];
    return productsWithPrices.filter(p => p.categoryId === selectedCategoryId);
  }, [selectedCategoryId, productsWithPrices]);

  const latestShowroomEntries = useMemo(() => {
    return [...(data.showroomEntries || [])].reverse().slice(0, 3);
  }, [data.showroomEntries]);

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

  if (!data || !data.categories) return <div className="min-h-screen bg-brand-white flex items-center justify-center">Cargando tienda...</div>;

  return (
    <div className="min-h-screen bg-brand-white pb-32 animate-fadeIn font-['Quicksand'] relative overflow-x-hidden">
      
      {/* Redes Sociales Barra Derecha Fija */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-2">
        {data.settings.instagramUrl && data.settings.instagramUrl.trim() !== '' && (
           <a href={data.settings.instagramUrl} target="_blank" rel="noreferrer" className="bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white p-4 rounded-l-3xl shadow-2xl hover:-translate-x-3 transition-all flex items-center gap-2 group">
             <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058-1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
             <span className="hidden group-hover:block text-[10px] font-black uppercase tracking-widest ml-2">Instagram</span>
           </a>
        )}
        {data.settings.facebookUrl && data.settings.facebookUrl.trim() !== '' && (
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
      <button onClick={() => setIsCartOpen(true)} className="fixed bottom-6 left-6 z-40 bg-brand-dark p-5 rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90 ring-4 ring-white">
        <div className="relative text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          {cart.length > 0 && <span className="absolute -top-3 -right-3 bg-brand-red text-white text-[10px] font-black w-7 h-7 flex items-center justify-center rounded-full border-2 border-brand-dark animate-bounce">{cart.length}</span>}
        </div>
      </button>

      {/* Hero Banner Section */}
      <div className="relative w-full h-[500px] md:h-[750px] overflow-hidden bg-white flex items-center justify-center">
        {data.settings.shopBannerImage ? (
          <img src={data.settings.shopBannerImage} className="absolute inset-0 w-full h-full object-cover opacity-25" alt="Banner" />
        ) : (
          <div className="absolute inset-0 bg-brand-beige opacity-10"></div>
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-brand-white"></div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl animate-fadeIn">
          {data.settings.shopLogo ? (
            <div className="flex flex-col items-center mb-8">
              <img 
                src={data.settings.shopLogo} 
                className="max-h-[250px] md:max-h-[350px] w-auto animate-fadeIn drop-shadow-xl" 
                alt={data.settings.brandName} 
              />
            </div>
          ) : (
            <h1 className="text-5xl md:text-8xl font-black text-brand-dark mb-4 tracking-tighter">
              {data.settings.brandName} <span className="text-brand-red">★</span>
            </h1>
          )}
          
          <p className="text-brand-dark text-lg md:text-3xl font-bold opacity-90 leading-relaxed italic max-w-2xl mx-auto drop-shadow-sm">
            "{data.settings.shopBannerText || 'Confecciones artesanales hechas con amor.'}"
          </p>

          <div className="mt-14 flex flex-wrap justify-center gap-8">
             <Link to="/showroom" className="bg-brand-sage text-white px-14 py-6 rounded-full font-black text-[12px] uppercase tracking-[0.25em] shadow-2xl hover:bg-brand-dark hover:scale-110 transition-all active:scale-95">
                ✨ Showroom & Comunidad
             </Link>
             <button onClick={() => {
                const el = document.getElementById('catalogo');
                el?.scrollIntoView({ behavior: 'smooth' });
             }} className="bg-white text-brand-dark border-2 border-brand-beige px-14 py-6 rounded-full font-black text-[12px] uppercase tracking-[0.25em] hover:bg-brand-beige transition-all active:scale-95">
                📦 Ver Productos
             </button>
          </div>
        </div>
      </div>

      <div id="catalogo" className="max-w-7xl mx-auto px-6 -mt-20 relative z-20">
        {!selectedCategoryId ? (
          <div className="space-y-24">
            {/* Categorías */}
            <div className="bg-white/95 backdrop-blur-xl p-10 md:p-16 rounded-[4rem] shadow-2xl border border-brand-beige">
                <div className="text-center mb-14">
                    <h2 className="text-[12px] font-black text-brand-sage uppercase tracking-[0.6em] mb-4">Explora nuestras categorías</h2>
                    <h3 className="text-4xl font-black text-brand-dark uppercase tracking-tight">Catálogo de Ternura</h3>
                    <div className="w-20 h-1.5 bg-brand-red/20 mx-auto mt-6 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
                    {data.categories.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategoryId(cat.id)} className="bg-white p-5 rounded-[3rem] border border-brand-beige shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col items-center group active:scale-95">
                        <div className="aspect-square w-full rounded-[2rem] overflow-hidden mb-5 bg-brand-white border border-brand-white/50">
                        {cat.image ? <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.name} /> : <div className="w-full h-full flex items-center justify-center text-4xl grayscale opacity-10">🎀</div>}
                        </div>
                        <span className="text-[11px] font-black text-brand-dark uppercase tracking-widest group-hover:text-brand-sage transition-colors text-center px-1">{cat.name}</span>
                    </button>
                    ))}
                </div>
            </div>

            {/* Vista Previa del Blog/Showroom */}
            {latestShowroomEntries.length > 0 && (
              <div className="space-y-14">
                <div className="text-center">
                   <h2 className="text-[12px] font-black text-brand-red uppercase tracking-[0.6em] mb-4">Desde el Showroom</h2>
                   <h3 className="text-4xl font-black text-brand-dark uppercase tracking-tight">Novedades & Comunidad</h3>
                   <div className="w-20 h-1.5 bg-brand-sage/20 mx-auto mt-6 rounded-full"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                   {latestShowroomEntries.map(entry => (
                     <Link to="/showroom" key={entry.id} className="bg-white rounded-[3rem] p-6 border border-brand-beige shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col h-full">
                        <div className="aspect-video bg-brand-white rounded-[2rem] overflow-hidden mb-6 relative">
                           {entry.image ? (
                             <img src={entry.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={entry.title} />
                           ) : <div className="w-full h-full flex items-center justify-center text-3xl grayscale opacity-10">✨</div>}
                           <div className="absolute top-4 left-4">
                              <span className="bg-white/90 backdrop-blur-sm text-[9px] font-black text-brand-dark px-4 py-1.5 rounded-full border border-brand-beige uppercase tracking-widest">{entry.type}</span>
                           </div>
                        </div>
                        <div className="px-2 flex-1 flex flex-col">
                           <h4 className="text-xl font-black text-brand-dark mb-4 leading-tight group-hover:text-brand-sage transition-colors line-clamp-2">{entry.title}</h4>
                           <p className="text-brand-dark/60 text-sm italic line-clamp-3 mb-6 leading-relaxed flex-1">{entry.content}</p>
                           <div className="pt-4 border-t border-brand-white flex justify-between items-center">
                              <span className="text-[10px] font-black text-brand-greige uppercase tracking-widest">{new Date(entry.date).toLocaleDateString()}</span>
                              <span className="text-brand-sage font-black text-[10px] uppercase tracking-widest group-hover:translate-x-2 transition-transform">Leer más →</span>
                           </div>
                        </div>
                     </Link>
                   ))}
                </div>
                <div className="text-center">
                   <Link to="/showroom" className="inline-block px-10 py-4 bg-brand-white border-2 border-brand-beige rounded-full text-[11px] font-black text-brand-dark hover:bg-brand-dark hover:text-white uppercase tracking-[0.2em] transition-all shadow-md">Ver todo el blog →</Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-10 animate-fadeIn">
            <div className="bg-white p-10 md:p-16 rounded-[4rem] shadow-2xl border border-brand-beige">
                <button onClick={() => setSelectedCategoryId(null)} className="flex items-center gap-3 text-brand-dark hover:text-brand-sage font-black text-[12px] uppercase tracking-widest mb-12 transition-all group">
                  <span className="group-hover:-translate-x-2 transition-transform text-xl">←</span> Volver al inicio
                </button>
                <div className="flex items-center gap-8 mb-16">
                  <h2 className="text-4xl md:text-6xl font-black text-brand-dark uppercase tracking-tighter">
                      {data.categories.find(c => c.id === selectedCategoryId)?.name}
                  </h2>
                  <div className="h-1 flex-1 bg-brand-beige opacity-30 rounded-full"></div>
                </div>
                {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
                    {filteredProducts.map(product => <ProductCard key={product.id} product={product} onOpenSelector={setSelectingProduct} />)}
                </div>
                ) : (
                  <div className="text-center py-40 bg-brand-white/50 rounded-[3rem] border border-dashed border-brand-beige">
                    <p className="text-brand-dark italic text-xl opacity-40">Estamos preparando nuevos productos para esta sección...</p>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>

      {/* Selector de Tela */}
      {selectingProduct && (
          <div className="fixed inset-0 bg-brand-dark/70 backdrop-blur-md z-[200] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 md:p-14 shadow-2xl border border-brand-beige overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="text-3xl font-black text-brand-dark uppercase tracking-tight">{selectingProduct.name}</h3>
                      <p className="text-xl font-bold text-brand-sage mt-2">${selectingProduct.price.toFixed(0)}</p>
                    </div>
                    <button onClick={() => setSelectingProduct(null)} className="text-brand-dark hover:text-brand-red text-3xl transition-colors p-2">✕</button>
                  </div>
                  <div className="bg-brand-white/50 p-6 rounded-[2rem] border-l-4 border-brand-sage mb-10">
                    <p className="text-sm text-brand-dark/80 italic leading-relaxed">
                      {selectingProduct.description || 'Artesanía pura diseñada con amor para acompañar el crecimiento de tu bebé.'}
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto mb-10 pr-2 custom-scrollbar">
                      <label className="block text-[11px] font-black text-brand-dark uppercase tracking-[0.3em] mb-6 text-center">Selecciona un estampado:</label>
                      {selectingProduct.designOptions?.length ? (
                          <div className="grid grid-cols-3 gap-5">
                              {selectingProduct.designOptions.map(design => (
                                  <button key={design.id} onClick={() => setSelectedDesignId(design.id)} className={`p-2 rounded-3xl border-2 transition-all group ${selectedDesignId === design.id ? 'border-brand-sage bg-brand-white shadow-xl scale-105' : 'border-brand-beige hover:border-brand-greige hover:scale-105'}`}>
                                      <div className="aspect-square rounded-2xl overflow-hidden mb-3">
                                        <img src={design.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={design.name} />
                                      </div>
                                      <span className="text-[10px] font-black block truncate text-center uppercase text-brand-dark">{design.name}</span>
                                  </button>
                              ))}
                          </div>
                      ) : (
                        <div className="text-center py-16 bg-brand-white/50 rounded-[2rem] border border-dashed border-brand-beige">
                          <p className="text-brand-dark/60 italic text-xs px-10">Estampados exclusivos según stock disponible.</p>
                        </div>
                      )}
                  </div>
                  <div className="flex gap-6">
                      <button onClick={() => setSelectingProduct(null)} className="flex-1 font-black text-brand-dark/40 uppercase text-[10px] tracking-widest hover:text-brand-dark transition-colors">Cancelar</button>
                      <button onClick={addToCart} className="flex-[3] bg-brand-sage text-white py-5 rounded-[2rem] font-black text-[13px] uppercase tracking-[0.25em] shadow-2xl hover:bg-brand-dark hover:scale-105 transition-all active:scale-95">Añadir al Carrito</button>
                  </div>
              </div>
          </div>
      )}

      {/* Carrito Lateral */}
      <div className={`fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-[210] transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsCartOpen(false)}>
        <div className={`absolute right-0 h-full w-full max-w-[450px] bg-white p-10 md:p-14 shadow-2xl transition-transform duration-700 flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
           <div className="flex justify-between items-center mb-12 border-b border-brand-white pb-8">
              <h2 className="text-3xl font-black text-brand-dark uppercase tracking-tight">Tu pedido <span className="text-brand-red">★</span></h2>
              <button onClick={() => setIsCartOpen(false)} className="text-brand-dark hover:text-brand-red text-2xl transition-colors p-2">✕</button>
           </div>
           
           <div className="flex-1 overflow-y-auto space-y-8 pr-4 custom-scrollbar">
             {cart.length > 0 ? (
               <>
                 <div className="space-y-8">
                   {cart.map((item, idx) => {
                     const p = productsWithPrices.find(prod => prod.id === item.productId);
                     return (
                       <div key={idx} className="flex gap-6 items-center animate-fadeIn bg-brand-white/30 p-4 rounded-3xl border border-brand-white hover:border-brand-beige transition-all group">
                         <div className="w-20 h-20 bg-brand-white rounded-2xl overflow-hidden flex-shrink-0 border border-brand-beige shadow-sm">
                           <img src={item.selectedDesign?.image || p?.images?.[0]} className="w-full h-full object-cover" alt="item" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-brand-dark truncate uppercase tracking-tight">{p?.name}</p>
                            {item.selectedDesign && <p className="text-[10px] font-bold text-brand-sage uppercase tracking-widest mt-1 opacity-90">Tela: {item.selectedDesign.name}</p>}
                            <div className="flex justify-between items-end mt-4">
                              <span className="text-[10px] font-black text-brand-dark/60 bg-brand-white px-3 py-1 rounded-xl border border-brand-beige">{item.quantity} un.</span>
                              <span className="text-sm font-black text-brand-dark">${((p?.price || 0) * item.quantity).toFixed(0)}</span>
                            </div>
                         </div>
                         <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-brand-red opacity-40 hover:opacity-100 p-3 transition-opacity group-hover:scale-110">✕</button>
                       </div>
                     );
                   })}
                 </div>
                 
                 {/* BOTÓN HACER PEDIDO Y TOTAL ESTIMADO (POSICIÓN SOLICITADA) */}
                 <div className="pt-10 space-y-8">
                    {/* Botón Estilo WhatsApp */}
                    <button 
                      onClick={sendWhatsAppOrder} 
                      disabled={cart.length === 0} 
                      className="w-full bg-[#25D366] text-white py-5 rounded-[2.5rem] font-black text-[16px] uppercase tracking-[0.3em] shadow-xl hover:bg-brand-dark transition-all active:scale-95 flex items-center justify-center gap-3 group"
                    >
                      <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      HACER PEDIDO
                    </button>

                    {/* Total Estimado Inmediatamente Debajo */}
                    <div className="border-t-2 border-brand-white pt-6 flex justify-between items-end">
                      <span className="text-[12px] font-black text-brand-dark/50 uppercase tracking-[0.4em]">Total estimado</span>
                      <span className="text-4xl font-black text-brand-sage">${cartTotal.toFixed(0)}</span>
                    </div>
                 </div>
               </>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
                 <div className="text-8xl mb-8 animate-bounce">🧺</div>
                 <p className="font-black uppercase tracking-[0.4em] text-[12px] text-brand-dark">Tu carrito está vacío</p>
               </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerShop;
