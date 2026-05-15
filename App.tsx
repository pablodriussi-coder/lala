
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { fetchAllData, syncMaterialsBatch, syncClientsBatch, syncTransactionsBatch, syncQuote, syncProduct, syncSettings, syncCategory } from './store';
import { AppData, Category, Product } from './types';
import { ICONS } from './constants';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';

// Vistas del Manager (Lazy Loaded)
const Dashboard = lazy(() => import('./views/Dashboard'));
const MaterialsManager = lazy(() => import('./views/MaterialsManager'));
const ProductsManager = lazy(() => import('./views/ProductsManager'));
const QuotesManager = lazy(() => import('./views/QuotesManager'));
const ClientsManager = lazy(() => import('./views/ClientsManager'));
const AccountingManager = lazy(() => import('./views/AccountingManager'));
const QuickCalculator = lazy(() => import('./views/QuickCalculator'));
const CategoriesManager = lazy(() => import('./views/CategoriesManager'));
const ShowroomManager = lazy(() => import('./views/ShowroomManager'));
const Login = lazy(() => import('./views/Login'));

// Vistas Públicas (Lazy Loaded)
const CustomerShop = lazy(() => import('./views/CustomerShop'));
const ShowroomView = lazy(() => import('./views/ShowroomView'));

const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Lala accesorios" }) => (
  <div className="h-screen w-screen flex flex-col items-center justify-center bg-brand-white">
    <div className="w-12 h-12 border-4 border-brand-beige border-t-brand-sage rounded-full animate-spin mb-4"></div>
    <h1 className="text-xl font-bold text-brand-dark italic">{message}</h1>
  </div>
);

const AppContent: React.FC = () => {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const location = useLocation();

  // Migración de URLs viejas (#/) a URLs limpias
  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      const cleanPath = window.location.hash.slice(2);
      window.location.replace(`/${cleanPath}`);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchAllData().then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error("Error cargando datos:", err);
      setLoading(false);
    });
  }, []);

  // Cerrar menú móvil y actualizar canonical al cambiar de ruta
  useEffect(() => {
    setIsMobileMenuOpen(false);
    
    // Actualizar tag canonical dinámicamente
    const canonical = document.querySelector('link[rel="canonical"]');
    const path = location.pathname === '/' ? '' : location.pathname;
    const href = `https://www.lalawi.com${path}`;
    
    if (canonical) {
      canonical.setAttribute('href', href);
    } else {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', href);
      document.head.appendChild(link);
    }
  }, [location.pathname]);

  if (loading || !data) {
    return <LoadingScreen />;
  }

  const isAdminPath = location.pathname.startsWith('/admin');

  if (isAdminPath && !session) {
    return (
      <Suspense fallback={<LoadingScreen message="Cargando acceso..." />}>
        <Login />
      </Suspense>
    );
  }

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
    <div className={`flex h-screen bg-brand-white overflow-hidden print:h-auto print:overflow-visible ${!isAdminPath ? 'flex-col' : 'flex-col md:flex-row'}`}>
      
      {/* Header Mobile para el Admin */}
      {isAdminPath && (
        <header className="md:hidden bg-white border-b border-brand-beige p-4 flex justify-between items-center z-50 print:hidden">
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
          transition-transform duration-300 ease-in-out print:hidden
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

          <div className="p-4 border-t border-brand-beige space-y-2">
            <Link to="/" className="block text-center bg-brand-sage text-white p-3 rounded-xl font-bold text-xs shadow-md hover:bg-brand-dark transition-all">✨ Ver Tienda</Link>
            <button 
              onClick={() => supabase.auth.signOut()}
              className="w-full text-center bg-red-100 text-red-600 p-3 rounded-xl font-bold text-xs shadow-md hover:bg-red-200 transition-all"
            >
              Cerrar Sesión
            </button>
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

      <main className="flex-1 overflow-y-auto print:overflow-visible print:h-auto">
        <div className={isAdminPath ? "p-6 md:p-10 max-w-7xl mx-auto print:p-0 print:max-w-none" : ""}>
          <Suspense fallback={<LoadingScreen message="Cargando sección..." />}>
            <Routes>
              <Route path="/" element={<CustomerShop data={data} />} />
              <Route path="/showroom" element={<ShowroomView data={data} />} />

              <Route path="/admin" element={<Dashboard data={data} onUpdateSettings={updateSettings} />} />
              <Route path="/admin/categories" element={<CategoriesManager data={data} updateData={handleUpdate} />} />
              <Route path="/admin/products" element={<ProductsManager data={data} updateData={handleUpdate} />} />
              <Route path="/admin/showroom" element={<ShowroomManager data={data} updateData={handleUpdate} />} />
              <Route path="/admin/materials" element={<MaterialsManager data={data} updateData={handleUpdate} />} />
              <Route path="/admin/quotes" element={<QuotesManager data={data} updateData={handleUpdate} />} />
              <Route path="/admin/clients" element={<ClientsManager data={data} updateData={handleUpdate} />} />
              <Route path="/admin/accounting" element={<AccountingManager data={data} updateData={handleUpdate} />} />
              <Route path="/admin/calculator" element={<QuickCalculator />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
