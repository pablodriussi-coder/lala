
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

// Vista de la Tienda
import CustomerShop from './views/CustomerShop';

const AppContent: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Cargamos los datos de Supabase al iniciar
  useEffect(() => {
    fetchAllData().then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error("Error cargando datos:", err);
      setLoading(false);
    });
  }, []);

  if (loading || !data) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-brand-white">
        <div className="w-12 h-12 border-4 border-brand-beige border-t-brand-sage rounded-full animate-spin mb-4"></div>
        <h1 className="text-xl font-bold text-brand-dark italic">Lala accesorios</h1>
      </div>
    );
  }

  const isAdminPath = location.pathname.startsWith('/admin');

  // Funciones de actualización
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
    { path: '/admin/categories', label: 'Categorías', icon: () => <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg> },
    { path: '/admin/products', label: 'Catálogo', icon: ICONS.Products },
    { path: '/admin/materials', label: 'Materiales', icon: ICONS.Materials },
    { path: '/admin/clients', label: 'Clientes', icon: ICONS.Clients },
  ];

  return (
    <div className={`flex h-screen bg-brand-white overflow-hidden ${!isAdminPath ? 'flex-col' : ''}`}>
      {/* Sidebar: Solo visible en rutas /admin */}
      {isAdminPath && (
        <aside className="w-64 bg-white shadow-xl z-10 border-r border-brand-beige hidden md:flex flex-col">
          <div className="p-6 border-b border-brand-white">
            <h1 className="text-xl font-black text-brand-dark tracking-tighter">Lala Manager</h1>
          </div>
          <nav className="mt-2 flex-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-6 py-4 transition-all ${
                  location.pathname === item.path ? 'sidebar-item-active' : 'text-gray-400 hover:bg-brand-white hover:text-brand-sage'
                }`}
              >
                <item.icon />
                <span className="font-bold text-sm">{item.label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-brand-beige">
            <Link to="/" className="block text-center bg-brand-sage text-white p-3 rounded-xl font-bold text-xs">✨ Ver Tienda</Link>
          </div>
        </aside>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto">
        <div className={isAdminPath ? "p-6 md:p-10 max-w-7xl mx-auto" : ""}>
          <Routes>
            {/* TIENDA (Página de Inicio) */}
            <Route path="/" element={<CustomerShop data={data} />} />

            {/* RUTAS DEL MANAGER */}
            <Route path="/admin" element={<Dashboard data={data} onUpdateSettings={updateSettings} />} />
            <Route path="/admin/categories" element={<CategoriesManager data={data} updateData={handleUpdate} />} />
            <Route path="/admin/products" element={<ProductsManager data={data} updateData={handleUpdate} />} />
            <Route path="/admin/materials" element={<MaterialsManager data={data} updateData={(up) => { const n = up(data); handleUpdate(up); syncMaterialsBatch(n.materials); }} />} />
            <Route path="/admin/quotes" element={<QuotesManager data={data} updateData={(up) => { const n = up(data); handleUpdate(up); n.quotes.forEach(q => syncQuote(q)); }} />} />
            <Route path="/admin/clients" element={<ClientsManager data={data} updateData={(up) => { const n = up(data); handleUpdate(up); syncClientsBatch(n.clients); }} />} />
            <Route path="/admin/accounting" element={<AccountingManager data={data} updateData={(up) => { const n = up(data); handleUpdate(up); syncTransactionsBatch(n.transactions); }} />} />
            <Route path="/admin/calculator" element={<QuickCalculator />} />

            {/* Redirecciones de seguridad */}
            <Route path="/shop" element={<Navigate to="/" replace />} />
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
