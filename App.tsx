
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { fetchAllData, syncMaterialsBatch, syncClientsBatch, syncTransactionsBatch, syncQuote, syncProduct, syncReceipt, saveFullBackup } from './store';
import { AppData, Material, Product, Client, Quote, Transaction } from './types';
import { ICONS } from './constants';
// Add missing import for supabase client
import { supabase } from './supabaseClient';
import Dashboard from './views/Dashboard';
import MaterialsManager from './views/MaterialsManager';
import ProductsManager from './views/ProductsManager';
import QuotesManager from './views/QuotesManager';
import ReceiptsManager from './views/ReceiptsManager';
import ClientsManager from './views/ClientsManager';
import AccountingManager from './views/AccountingManager';
import QuickCalculator from './views/QuickCalculator';

const Layout: React.FC<{ children: React.ReactNode, isLoading: boolean, isOffline?: boolean }> = ({ children, isLoading, isOffline }) => {
  const location = useLocation();
  const navItems = [
    { path: '/', label: 'Inicio', icon: ICONS.Dashboard },
    { path: '/accounting', label: 'Finanzas', icon: ICONS.Accounting },
    { path: '/calculator', label: 'Express', icon: ICONS.Calculator },
    { path: '/quotes', label: 'Presupuestos', icon: ICONS.Quotes },
    { path: '/receipts', label: 'Recibos', icon: () => <span>🎫</span> },
    { path: '/materials', label: 'Insumos', icon: ICONS.Materials },
    { path: '/products', label: 'Catálogo', icon: ICONS.Products },
    { path: '/clients', label: 'Clientes', icon: ICONS.Clients },
  ];

  return (
    <div className="flex h-screen bg-brand-white overflow-hidden">
      <aside className="w-64 bg-white shadow-xl z-10 border-r border-brand-beige hidden md:block">
        <div className="p-8">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-brand-dark leading-none tracking-tight flex items-baseline">
              Lala<span className="text-brand-red ml-1 text-2xl">★</span>
            </h1>
            <p className="text-[11px] text-brand-greige font-semibold tracking-[0.2em] uppercase mt-1">accesorios</p>
          </div>
          
          <div className="mt-4 flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${isOffline ? 'bg-red-500 animate-pulse' : isLoading ? 'bg-yellow-400 animate-bounce' : 'bg-green-500'}`}></div>
             <span className="text-[9px] font-bold text-brand-greige uppercase tracking-widest">
                {isOffline ? 'Modo Local (Sin Red)' : isLoading ? 'Sincronizando...' : 'Conectado a la Nube'}
             </span>
          </div>
        </div>
        <nav className="mt-8 overflow-y-auto h-[calc(100vh-180px)]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-8 py-5 transition-all duration-300 ${
                location.pathname === item.path ? 'sidebar-item-active' : 'text-gray-400 hover:bg-brand-white hover:text-brand-sage'
              }`}
            >
              <item.icon />
              <span className="font-semibold">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        {isOffline && (
            <div className="bg-red-50 text-red-600 px-6 py-2 text-xs font-bold border-b border-red-100 flex justify-between items-center animate-fadeIn">
                <span>⚠️ No se pudo conectar con Supabase. Los cambios se guardarán en este navegador.</span>
                <button onClick={() => window.location.reload()} className="underline">Reintentar Conexión</button>
            </div>
        )}
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-brand-beige border-t-brand-sage rounded-full animate-spin"></div>
             <p className="text-brand-greige font-bold animate-pulse">Cargando aplicación...</p>
          </div>
        ) : (
          <div className="p-6 md:p-10 max-w-7xl mx-auto pb-24 md:pb-10">
            {children}
          </div>
        )}
        
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-brand-beige flex justify-around p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] z-50 overflow-x-auto">
            {navItems.map((item) => (
                <Link key={item.path} to={item.path} className={`${location.pathname === item.path ? 'text-brand-sage scale-110' : 'text-brand-greige'} transition-transform px-3`}>
                    <item.icon />
                </Link>
            ))}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Intentamos cargar de Supabase
      const result = await fetchAllData();
      
      // Si el resultado es igual al inicial (o vacío) y fetchAllData falló, 
      // fetchAllData ya nos devuelve el backup local.
      setData(result);
      
      // Verificamos conexión simple
      try {
         const { error } = await supabase.from('materials').select('id').limit(1);
         if (error) throw error;
         setIsOffline(false);
      } catch (e) {
         setIsOffline(true);
      }
      
      setLoading(false);
    };
    init();
  }, []);

  const updateAndSync = async (nextData: AppData) => {
    setData(nextData);
    saveFullBackup(nextData);
  };

  const handleUpdateMaterials = async (newMaterials: Material[]) => {
    if (!data) return;
    const next = {...data, materials: newMaterials};
    updateAndSync(next);
    await syncMaterialsBatch(newMaterials);
  };

  const handleUpdateProducts = async (newProducts: Product[]) => {
    if (!data) return;
    const next = {...data, products: newProducts};
    updateAndSync(next);
    for (const p of newProducts) await syncProduct(p);
  };

  const handleUpdateClients = async (newClients: Client[]) => {
    if (!data) return;
    const next = {...data, clients: newClients};
    updateAndSync(next);
    await syncClientsBatch(newClients);
  };

  const handleUpdateQuotes = async (nextData: AppData) => {
    updateAndSync(nextData);
    for (const q of nextData.quotes) await syncQuote(q);
    for (const r of nextData.receipts) await syncReceipt(r);
    await syncTransactionsBatch(nextData.transactions);
  };

  const handleUpdateTransactions = async (newTransactions: Transaction[]) => {
    if (!data) return;
    const next = {...data, transactions: newTransactions};
    updateAndSync(next);
    await syncTransactionsBatch(newTransactions);
  };

  if (!data && loading) return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-brand-white">
        <div className="w-16 h-16 border-8 border-brand-beige border-t-brand-sage rounded-full animate-spin"></div>
        <h1 className="mt-6 text-2xl font-black text-brand-dark">Lala accesorios</h1>
      </div>
  );

  const safeData = data || INITIAL_APP_DATA;

  return (
    <HashRouter>
      <Layout isLoading={loading} isOffline={isOffline}>
        <Routes>
          <Route path="/" element={<Dashboard data={safeData} />} />
          <Route path="/materials" element={<MaterialsManager data={safeData} updateData={(up) => {
              const next = up(safeData);
              handleUpdateMaterials(next.materials);
          }} />} />
          <Route path="/products" element={<ProductsManager data={safeData} updateData={(up) => {
              const next = up(safeData);
              handleUpdateProducts(next.products);
          }} />} />
          <Route path="/quotes" element={<QuotesManager data={safeData} updateData={(up) => {
              const next = up(safeData);
              handleUpdateQuotes(next);
          }} />} />
          <Route path="/receipts" element={<ReceiptsManager data={safeData} updateData={(up) => {
              const next = up(safeData);
              handleUpdateQuotes(next);
          }} />} />
          <Route path="/clients" element={<ClientsManager data={safeData} updateData={(up) => {
              const next = up(safeData);
              handleUpdateClients(next.clients);
          }} />} />
          <Route path="/accounting" element={<AccountingManager data={safeData} updateData={(up) => {
              const next = up(safeData);
              handleUpdateTransactions(next.transactions);
          }} />} />
          <Route path="/calculator" element={<QuickCalculator />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

const INITIAL_APP_DATA: AppData = {
  materials: [],
  products: [],
  clients: [],
  quotes: [],
  receipts: [],
  transactions: [],
  settings: { brandName: 'Lala', defaultMargin: 50, whatsappNumber: '5491122334455' }
};
