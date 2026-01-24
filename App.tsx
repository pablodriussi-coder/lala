
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { loadData, saveData } from './store';
import { AppData, Material, Product, Client, Quote, MaterialUnit } from './types';
import { ICONS } from './constants';
import Dashboard from './views/Dashboard';
import MaterialsManager from './views/MaterialsManager';
import ProductsManager from './views/ProductsManager';
import QuotesManager from './views/QuotesManager';
import ClientsManager from './views/ClientsManager';
import AccountingManager from './views/AccountingManager';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Inicio', icon: ICONS.Dashboard },
    { path: '/accounting', label: 'Contabilidad', icon: ICONS.Accounting },
    { path: '/quotes', label: 'Presupuestos', icon: ICONS.Quotes },
    { path: '/materials', label: 'Materiales', icon: ICONS.Materials },
    { path: '/products', label: 'Catálogo', icon: ICONS.Products },
    { path: '/clients', label: 'Clientes', icon: ICONS.Clients },
  ];

  return (
    <div className="flex h-screen bg-brand-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-xl z-10 border-r border-brand-beige hidden md:block">
        <div className="p-8">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-brand-dark leading-none tracking-tight flex items-baseline">
              Lala<span className="text-brand-red ml-1 text-2xl">★</span>
            </h1>
            <p className="text-[11px] text-brand-greige font-semibold tracking-[0.2em] uppercase mt-1">accesorios</p>
          </div>
        </div>
        <nav className="mt-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-8 py-5 transition-all duration-300 ${
                  isActive ? 'sidebar-item-active' : 'text-gray-400 hover:bg-brand-white hover:text-brand-sage'
                }`}
              >
                <Icon />
                <span className="font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24 md:pb-10">
          {children}
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-beige flex justify-around p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50">
            {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                    <Link key={item.path} to={item.path} className={`${isActive ? 'text-brand-sage scale-110' : 'text-brand-greige'} transition-transform`}>
                        <Icon />
                    </Link>
                );
            })}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<AppData>(loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const updateData = (updater: (prev: AppData) => AppData) => {
    setData(prev => {
        const next = updater(prev);
        return next;
    });
  };

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard data={data} />} />
          <Route path="/materials" element={<MaterialsManager data={data} updateData={updateData} />} />
          <Route path="/products" element={<ProductsManager data={data} updateData={updateData} />} />
          <Route path="/quotes" element={<QuotesManager data={data} updateData={updateData} />} />
          <Route path="/clients" element={<ClientsManager data={data} updateData={updateData} />} />
          <Route path="/accounting" element={<AccountingManager data={data} updateData={updateData} />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}
