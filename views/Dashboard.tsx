
import React from 'react';
import { AppData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  data: AppData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const totalQuotes = data.quotes.length;
  const totalRevenue = data.quotes.reduce((acc, q) => acc + q.totalPrice, 0);
  const totalMaterials = data.materials.length;
  const totalClients = data.clients.length;

  const chartData = [
    { name: 'Insumos', value: totalMaterials, color: '#d1cdc1' },
    { name: 'Catálogo', value: data.products.length, color: '#e8e4d3' },
    { name: 'Pedidos', value: totalQuotes, color: '#b2c0a3' },
    { name: 'Clientes', value: totalClients, color: '#404040' },
  ];

  const recentQuotes = [...data.quotes]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <div className="space-y-10 animate-fadeIn">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-sm font-bold text-brand-sage uppercase tracking-[0.3em] mb-1">Bienvenida</h2>
          <h1 className="text-4xl font-bold text-brand-dark">{data.settings.brandName}</h1>
        </div>
        <div className="hidden md:block">
          <p className="text-sm text-brand-greige font-medium">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingresos Totales', value: `$${totalRevenue.toLocaleString()}`, icon: '🏷️', color: 'text-brand-dark' },
          { label: 'Presupuestos', value: totalQuotes, icon: '📋', color: 'text-brand-sage' },
          { label: 'Materiales', value: totalMaterials, icon: '🧵', color: 'text-brand-greige' },
          { label: 'Clientes', value: totalClients, icon: '🤝', color: 'text-brand-red' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] shadow-sm border border-brand-beige flex items-center gap-5 hover:shadow-lg transition-all">
            <div className="text-3xl">{stat.icon}</div>
            <div>
              <p className="text-[10px] font-black text-brand-greige uppercase tracking-widest">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-brand-beige">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-brand-dark">Resumen de Negocio</h3>
            <span className="text-brand-red text-xl">★</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#d1cdc1', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#d1cdc1', fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#f8f7f2'}}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', backgroundColor: 'white' }}
                />
                <Bar dataKey="value" radius={[15, 15, 15, 15]} barSize={40}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-brand-beige">
          <h3 className="text-xl font-bold text-brand-dark mb-8">Actividad Reciente</h3>
          <div className="space-y-5">
            {recentQuotes.length > 0 ? recentQuotes.map((quote) => {
              const client = data.clients.find(c => c.id === quote.clientId);
              return (
                <div key={quote.id} className="flex items-center justify-between p-5 rounded-2xl bg-brand-white border border-transparent hover:border-brand-beige transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-beige flex items-center justify-center text-brand-dark font-bold border-2 border-white">
                        {client?.name[0] || '?'}
                    </div>
                    <div>
                      <p className="font-bold text-brand-dark group-hover:text-brand-sage transition-colors">{client?.name || 'Cliente sin registro'}</p>
                      <p className="text-xs text-brand-greige">{new Date(quote.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-dark">${quote.totalPrice.toLocaleString()}</p>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
                        quote.status === 'accepted' ? 'bg-brand-sage/20 text-brand-sage' : 
                        quote.status === 'pending' ? 'bg-brand-beige text-brand-dark/60' : 'bg-brand-red/10 text-brand-red'
                    }`}>
                        {quote.status}
                    </span>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-40">
                <span className="text-4xl mb-2">📄</span>
                <p className="text-sm italic">Sin presupuestos registrados.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
