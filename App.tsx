
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { fetchAllData, syncMaterialsBatch, syncClientsBatch, syncTransactionsBatch, syncQuote, syncProduct, deleteFromSupabase, syncSettings, syncCategory } from './store';
import { AppData, Material, Product, Client, Quote, Transaction, Category } from './types';
import { ICONS } from './constants';
import Dashboard from './views/Dashboard';
import MaterialsManager from './views/MaterialsManager';
import ProductsManager from './views/ProductsManager';
import QuotesManager from './views/QuotesManager';
import ClientsManager from './views/ClientsManager';
import AccountingManager from './views/AccountingManager';
import QuickCalculator from './views/QuickCalculator';
import CustomerShop from './views/CustomerShop';
import CategoriesManager from './views/CategoriesManager';

const Layout: React.FC<{ children: React.ReactNode, isLoading: boolean, settings: AppData['settings'] }> = ({ children, isLoading, settings }) => {
  const location = useLocation();
  const isShopView = location.pathname === '/shop';

  const navItems = [
    { path: '/', label: 'Inicio', icon: ICONS.Dashboard },
    { path: '/accounting', label: 'Contabilidad', icon: ICONS.Accounting },
    { path: '/calculator', label: 'Calculadora', icon: ICONS.Calculator },
    { path: '/quotes', label: 'Presupuestos', icon: ICONS.Quotes },
    { path: '/categories', label: 'Categorías', icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg> },
    { path: '/products', label: 'Catálogo', icon: ICONS.Products },
    { path: '/materials', label: 'Materiales', icon: ICONS.Materials },
    { path: '/clients', label: 'Clientes', icon: ICONS.Clients },
  ];

  if (isShopView) return <div className="bg-brand-white min-h-screen relative">{children}</div>;

  return (
    <div className="flex h-screen bg-brand-white overflow-hidden">
      <aside className="w-64 bg-white shadow-xl z-10 border-r border-brand-beige hidden md:flex flex-col">
        {/* Logo area with reduced padding */}
        <div className="p-4 border-b border-brand-white">
          {settings.shopLogo ? (
            <div className="flex flex-col items-center">
              <img src={settings.shopLogo} className="h-12 w-auto mb-1 object-contain" alt="Logo" />
              <p className="text-[8px] text-brand-greige font-black uppercase tracking-[0.2em]">{settings.brandName}</p>
            </div>
          ) : (
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-brand-dark leading-none tracking-tight flex items-baseline">
                Lala<span className="text-brand-red ml-0.5 text-xl">★</span>
              </h1>
              <p className="text-[9px] text-brand-greige font-semibold tracking-[0.2em] uppercase mt-0.5">accesorios</p>
            </div>
          )}
        </div>

        {/* Navigation with reduced vertical spacing */}
        <nav className="mt-2 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path} 
              className={`flex items-center gap-3 px-6 py-3 transition-all duration-300 ${
                location.pathname === item.path 
                ? 'sidebar-item-active' 
                : 'text-gray-400 hover:bg-brand-white hover:text-brand-sage'
              }`}
            >
              <item.icon />
              <span className="font-bold text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Shop Access Button - Compact version */}
        <div className="p-4 bg-brand-white/30 border-t border-brand-beige">
          <Link 
            to="/shop" 
            className="flex items-center justify-center gap-2 w-full bg-brand-sage text-white p-3 rounded-xl font-bold text-xs shadow-md hover:bg-brand-dark transition-all group"
          >
            <span>✨ Ver Tienda</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-brand-beige border-t-brand-sage rounded-full animate-spin"></div>
             <p className="text-brand-greige font-bold animate-pulse">Sincronizando con la nube...</p>
          </div>
        ) : (
          <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24 md:pb-10">{children}</div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData().then(res => {
      if (res.categories.length === 0) {
        const defaults = ["Baberos", "Bandanas", "Babitas", "Bodies", "Cartucheras", "Neceser", "Mochilas", "Canastos", "Para la cuna", "Apego", "Mordedores", "Mantas"];
        res.categories = defaults.map(name => ({ id: crypto.randomUUID(), name }));
        res.categories.forEach(c => syncCategory(c));
      }
      setData(res);
      setLoading(false);
    });
  }, []);

  const handleUpdateCategories = async (newCategories: Category[]) => {
    if (!data) return;
    setData({...data, categories: newCategories});
    for (const c of newCategories) await syncCategory(c);
  };

  const handleUpdateProducts = async (newProducts: Product[]) => {
    if (!data) return;
    setData({...data, products: newProducts});
    for (const p of newProducts) await syncProduct(p);
  };

  const safeData = data || { materials: [], products: [], categories: [], clients: [], quotes: [], transactions: [], settings: { brandName: 'Lala', defaultMargin: 400, whatsappNumber: '5491100000000' } };

  if (!data && loading) return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-brand-white">
        <div className="w-16 h-16 border-8 border-brand-beige border-t-brand-sage rounded-full animate-spin"></div>
        <h1 className="mt-6 text-2xl font-black text-brand-dark">Lala accesorios</h1>
      </div>
  );

  return (
    <HashRouter>
      <Layout isLoading={loading} settings={safeData.settings}>
        <Routes>
          <Route path="/" element={<Dashboard data={safeData} onUpdateSettings={async s => { setData({...safeData, settings: s}); await syncSettings(s); }} />} />
          <Route path="/categories" element={<CategoriesManager data={safeData} updateData={up => handleUpdateCategories(up(safeData).categories)} />} />
          <Route path="/products" element={<ProductsManager data={safeData} updateData={up => handleUpdateProducts(up(safeData).products)} />} />
          <Route path="/materials" element={<MaterialsManager data={safeData} updateData={up => { const next = up(safeData); setData(next); syncMaterialsBatch(next.materials); }} />} />
          <Route path="/quotes" element={<QuotesManager data={safeData} updateData={up => { const next = up(safeData); setData(next); next.quotes.forEach(q => syncQuote(q)); }} />} />
          <Route path="/clients" element={<ClientsManager data={safeData} updateData={up => { const next = up(safeData); setData(next); syncClientsBatch(next.clients); }} />} />
          <Route path="/accounting" element={<AccountingManager data={safeData} updateData={up => { const next = up(safeData); setData(next); syncTransactionsBatch(next.transactions); }} />} />
          <Route path="/calculator" element={<QuickCalculator />} />
          <Route path="/shop" element={<CustomerShop data={safeData} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
