
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { fetchAllData, syncMaterialsBatch, syncClientsBatch, syncTransactionsBatch, syncQuote, syncProduct, syncSettings, syncCategory } from './store';
import { AppData, Category, Product } from './types';
import { ICONS } from './constants';

// Vistas del Manager
import Dashboard from './views/Dashboard';
import MaterialsManager from './views/MaterialsManager';
import ProductsManager from './views/ProductsManager';
import QuotesManager from './views/QuotesManager';
import ClientsManager from './views/ClientsManager';
import AccountingManager from './views/AccountingManager';
import QuickCalculator from './views/QuickCalculator';
import CategoriesManager from './views/CategoriesManager';
import ShowroomManager from './views/ShowroomManager';

// Vistas Públicas
import CustomerShop from './views/CustomerShop';
import ShowroomView from './views/ShowroomView';

const AppContent: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchAllData().then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error("Error cargando datos:", err);
      setLoading(false);
    });
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading || !data) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-brand-white">
        <div className="w-12 h-12 border-4 border-brand-beige border-t-brand-sage rounded-full animate-spin mb-4"></div>
        <h1 className="text-xl font-bold text-brand-dark italic">Lala accesorios</h1>
      </div>
    );
  }

  const isAdminPath = location.pathname.startsWith('/admin');

  const handleUpdate = (updater: (prev: AppData) => AppData) => {
    setData(prev => {
      if (!prev) return null;
      return updater(prev);
    });
  };

  const updateSettings = async (s: any) => {
    if (!data) return;
    setData({ ...data, settings: s });
    await syncSettings(s);
  };

  const navItems = [
    { path: '/admin', label: 'Inicio', icon: ICONS.Dashboard },
    { path: '/admin/accounting', label: 'Contabilidad', icon: ICONS.Accounting },
    { path: '/admin/calculator', label: 'Calculadora', icon: ICONS.Calculator },
    { path: '/admin/quotes', label: 'Presupuestos', icon: ICONS.Quotes },
    { path: '/admin/showroom', label: 'Showroom & Blog', icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20l-7-7 7-7M5 20l7-7-7-7" /></svg> },
    { path: '/admin/categories', label: 'Categorías', icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg> },
    { path: '/admin/products', label: 'Catálogo', icon: ICONS.Products },
    { path: '/admin/materials', label: 'Materiales', icon: ICONS.Materials },
    { path: '/admin/clients', label: 'Clientes', icon: ICONS.Clients },
  ];

  return (
    <div className={`flex h-screen bg-brand-white overflow-hidden ${!isAdminPath ? 'flex-col' : 'flex-col md:flex-row'}`}>
      
      {/* Botón flotante para el Admin (Solo aparece en la tienda pública) */}
      {!isAdminPath && (
        <Link 
          to="/entrar" 
          className="fixed top-4 left-4 z-[1000] bg-white/80 backdrop-blur-md p-3 rounded-full shadow-lg border border-brand-beige hover:bg-brand-sage hover:text-white transition-all group"
          title="Ir al Panel de Administración"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </Link>
      )}

      {/* Header Mobile para el Admin */}
      {isAdminPath && (
        <header className="md:hidden bg-white border-b border-brand-beige p-4 flex justify-between items-center z-50">
          <h1 className="text-lg font-black text-brand-dark tracking-tighter">Lala Manager</h1>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-brand-dark hover:text-brand-sage transition-colors"
          >
            {isMobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
            )}
          </button>
        </header>
      )}

      {/* Menú Lateral (Aside) */}
      {isAdminPath && (
        <aside className={`
          fixed md:relative inset-0 md:inset-auto z-40
          w-64 bg-white shadow-xl border-r border-brand-beige flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="p-6 border-b border-brand-white hidden md:block">
            <h1 className="text-xl font-black text-brand-dark tracking-tighter">Lala Manager</h1>
          </div>
          
          <nav className="mt-2 flex-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-6 py-4 transition-all ${
                  location.pathname === item.path 
                  ? 'sidebar-item-active text-brand-dark' 
                  : 'text-brand-dark/50 hover:bg-brand-white hover:text-brand-sage'
                }`}
              >
                <item.icon />
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-brand-beige">
            <Link to="/" className="block text-center bg-brand-sage text-white p-3 rounded-xl font-bold text-xs shadow-md hover:bg-brand-dark transition-all">✨ Ver Tienda</Link>
          </div>
        </aside>
      )}

      {/* Fondo oscuro cuando el menú móvil está abierto */}
      {isAdminPath && isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-brand-dark/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto">
        <div className={isAdminPath ? "p-6 md:p-10 max-w-7xl mx-auto" : ""}>
          <Routes>
            <Route path="/" element={<CustomerShop data={data} />} />
            <Route path="/showroom" element={<ShowroomView data={data} />} />

            <Route path="/admin" element={<Dashboard data={data} onUpdateSettings={updateSettings} />} />
            <Route path="/admin/categories" element={<CategoriesManager data={data} updateData={handleUpdate} />} />
            <Route path="/admin/products" element={<ProductsManager data={data} updateData={(up) => { 
              const n = up(data); 
              handleUpdate(up); 
              n.products.forEach(p => syncProduct(p)); 
            }} />} />
            <Route path="/admin/showroom" element={<ShowroomManager data={data} updateData={handleUpdate} />} />
            <Route path="/admin/materials" element={<MaterialsManager data={data} updateData={(up) => { const n = up(data); handleUpdate(up); syncMaterialsBatch(n.materials); }} />} />
            <Route path="/admin/quotes" element={<QuotesManager data={data} updateData={(up) => { const n = up(data); handleUpdate(up); n.quotes.forEach(q => syncQuote(q)); }} />} />
            <Route path="/admin/clients" element={<ClientsManager data={data} updateData={(up) => { const n = up(data); handleUpdate(up); syncClientsBatch(n.clients); }} />} />
            <Route path="/admin/accounting" element={<AccountingManager data={data} updateData={(up) => { const n = up(data); handleUpdate(up); syncTransactionsBatch(n.transactions); }} />} />
            <Route path="/admin/calculator" element={<QuickCalculator />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
}
