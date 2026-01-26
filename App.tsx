
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { fetchAllData, syncMaterialsBatch, syncClientsBatch, syncTransactionsBatch, syncQuote, syncProduct, syncReceipt, deleteFromSupabase } from './store';
import { AppData, Material, Product, Client, Quote, Transaction, Receipt } from './types';
import { ICONS } from './constants';
import Dashboard from './views/Dashboard';
import MaterialsManager from './views/MaterialsManager';
import ProductsManager from './views/ProductsManager';
import QuotesManager from './views/QuotesManager';
import ReceiptsManager from './views/ReceiptsManager';
import ClientsManager from './views/ClientsManager';
import AccountingManager from './views/AccountingManager';
import QuickCalculator from './views/QuickCalculator';

const Layout: React.FC<{ children: React.ReactNode, isLoading: boolean }> = ({ children, isLoading }) => {
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
        </div>
        <nav className="mt-8 overflow-y-auto h-[calc(100vh-140px)]">
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
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-brand-beige border-t-brand-sage rounded-full animate-spin"></div>
             <p className="text-brand-greige font-bold animate-pulse">Sincronizando con la nube...</p>
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

  useEffect(() => {
    const init = async () => {
      const result = await fetchAllData();
      setData(result);
      setLoading(false);
    };
    init();
  }, []);

  const handleUpdateMaterials = async (newMaterials: Material[]) => {
    if (!data) return;
    setData({...data, materials: newMaterials});
    await syncMaterialsBatch(newMaterials);
  };

  const handleUpdateProducts = async (newProducts: Product[]) => {
    if (!data) return;
    setData({...data, products: newProducts});
    for (const p of newProducts) await syncProduct(p);
  };

  const handleUpdateClients = async (newClients: Client[]) => {
    if (!data) return;
    setData({...data, clients: newClients});
    await syncClientsBatch(newClients);
  };

  const handleUpdateQuotes = async (nextData: AppData) => {
    if (!data) return;
    setData(nextData);
    // Sincronizamos presupuestos
    for (const q of nextData.quotes) await syncQuote(q);
    // También sincronizamos recibos y transacciones si se generaron nuevos
    for (const r of nextData.receipts) await syncReceipt(r);
    await syncTransactionsBatch(nextData.transactions);
  };

  const handleUpdateTransactions = async (newTransactions: Transaction[]) => {
    if (!data) return;
    setData({...data, transactions: newTransactions});
    await syncTransactionsBatch(newTransactions);
  };

  const handleUpdateReceipts = async (nextData: AppData) => {
    if (!data) return;
    setData(nextData);
    for (const r of nextData.receipts) await syncReceipt(r);
    await syncTransactionsBatch(nextData.transactions);
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
      <Layout isLoading={loading}>
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
              handleUpdateReceipts(next);
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
