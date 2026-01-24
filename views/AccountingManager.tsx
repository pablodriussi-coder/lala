
import React, { useState, useMemo, useRef } from 'react';
import { AppData, Transaction, TransactionType, TransactionCategory } from '../types';
import { ICONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';

interface AccountingManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  venta: 'Venta de Productos',
  materia_prima: 'Insumos / Telas',
  mantenimiento: 'Mant. Local',
  servicios: 'Servicios (Luz/Gas)',
  alquiler: 'Alquiler',
  otros: 'Otros Gastos',
  capital_inicial: 'Fondos Disponibles (Capital)'
};

const AccountingManager: React.FC<AccountingManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'income',
    category: 'venta',
    amount: 0,
    description: '',
    date: Date.now()
  });

  const totals = useMemo(() => {
    const totalIncome = data.transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);
    const totalExpense = data.transactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0);
    
    // Filtrados por mes actual del filtro
    const monthlyTransactions = data.transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    });
    
    const monthlyIncome = monthlyTransactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);
    const monthlyExpense = monthlyTransactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0);

    return {
      balance: totalIncome - totalExpense,
      monthlyIncome,
      monthlyExpense,
      monthlyProfit: monthlyIncome - monthlyExpense
    };
  }, [data.transactions, filterMonth, filterYear]);

  const chartData = useMemo(() => {
    return [
      { name: 'Ingresos', value: totals.monthlyIncome, color: '#b2c0a3' },
      { name: 'Gastos', value: totals.monthlyExpense, color: '#d1202f' },
      { name: 'Ganancia', value: totals.monthlyProfit, color: '#404040' }
    ];
  }, [totals]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const transaction: Transaction = {
      id: editingId || crypto.randomUUID(),
      date: formData.date || Date.now(),
      type: formData.type as TransactionType,
      category: formData.category as TransactionCategory,
      amount: Number(formData.amount) || 0,
      description: formData.description || ''
    };

    updateData(prev => ({
      ...prev,
      transactions: editingId 
        ? prev.transactions.map(t => t.id === editingId ? transaction : t)
        : [...prev.transactions, transaction]
    }));

    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ type: 'income', category: 'venta', amount: 0, description: '', date: Date.now() });
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.transactions.map(t => ({
      ID: t.id,
      Fecha: new Date(t.date).toLocaleDateString(),
      Tipo: t.type === 'income' ? 'Ingreso' : 'Egreso',
      Categoria: CATEGORY_LABELS[t.category],
      Monto: t.amount,
      Descripcion: t.description
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contabilidad");
    XLSX.writeFile(wb, "Lala_Contabilidad.xlsx");
  };

  const importFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const bstr = event.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const imported = XLSX.utils.sheet_to_json(ws) as any[];

      const transactions: Transaction[] = imported.map(row => ({
        id: row.ID || crypto.randomUUID(),
        date: row.Fecha ? new Date(row.Fecha).getTime() : Date.now(),
        type: row.Tipo === 'Ingreso' ? 'income' : 'expense',
        category: (Object.keys(CATEGORY_LABELS).find(key => CATEGORY_LABELS[key as TransactionCategory] === row.Categoria) || 'otros') as TransactionCategory,
        amount: Number(row.Monto) || 0,
        description: row.Descripcion || ''
      }));

      if (confirm(`Se han detectado ${transactions.length} registros. ¿Deseas sobreescribir el historial actual?`)) {
        updateData(prev => ({ ...prev, transactions }));
      }
    };
    reader.readAsBinaryString(file);
  };

  const filteredTransactions = data.transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === filterMonth && d.getFullYear() === filterYear;
    })
    .sort((a, b) => b.date - a.date);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Finanzas */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm gap-4">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Finanzas</h2>
          <p className="text-brand-greige font-medium">Contabilidad y Balance General</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input type="file" className="hidden" ref={fileInputRef} onChange={importFromExcel} />
          <button onClick={() => fileInputRef.current?.click()} className="bg-brand-white text-brand-dark px-6 py-4 rounded-2xl border border-brand-beige font-bold text-sm">📥 Importar</button>
          <button onClick={exportToExcel} className="bg-brand-white text-brand-dark px-6 py-4 rounded-2xl border border-brand-beige font-bold text-sm">📤 Exportar</button>
          <button onClick={() => setIsModalOpen(true)} className="bg-brand-sage text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-sage/20 font-bold group">
            <ICONS.Add />
            <span>Nueva Transacción</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-brand-beige">
          <p className="text-[10px] font-black text-brand-greige uppercase tracking-widest mb-1">Fondos Disponibles</p>
          <p className="text-3xl font-bold text-brand-dark">${totals.balance.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-brand-beige">
          <p className="text-[10px] font-black text-brand-greige uppercase tracking-widest mb-1">Ingresos (Mes)</p>
          <p className="text-3xl font-bold text-brand-sage">${totals.monthlyIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-brand-beige">
          <p className="text-[10px] font-black text-brand-greige uppercase tracking-widest mb-1">Gastos (Mes)</p>
          <p className="text-3xl font-bold text-brand-red">${totals.monthlyExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-brand-beige">
          <p className="text-[10px] font-black text-brand-greige uppercase tracking-widest mb-1">Balance Ganancia</p>
          <p className={`text-3xl font-bold ${totals.monthlyProfit >= 0 ? 'text-brand-dark' : 'text-brand-red'}`}>
            ${totals.monthlyProfit.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Gráfico */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[2.5rem] shadow-sm border border-brand-beige">
          <h3 className="text-xl font-bold text-brand-dark mb-6">Rendimiento Mensual</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8f7f2'}} contentStyle={{ borderRadius: '15px', border: 'none' }} />
                <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={50}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Listado Transacciones */}
        <div className="lg:col-span-7 bg-white rounded-[2.5rem] shadow-sm border border-brand-beige overflow-hidden">
          <div className="p-6 bg-brand-white flex justify-between items-center border-b border-brand-beige">
            <h3 className="font-bold text-brand-dark uppercase tracking-widest text-xs">Historial de Movimientos</h3>
            <div className="flex gap-2">
              <select 
                value={filterMonth} 
                onChange={e => setFilterMonth(Number(e.target.value))}
                className="text-xs font-bold bg-white border border-brand-beige px-3 py-1 rounded-lg"
              >
                {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select 
                value={filterYear} 
                onChange={e => setFilterYear(Number(e.target.value))}
                className="text-xs font-bold bg-white border border-brand-beige px-3 py-1 rounded-lg"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white border-b border-brand-beige">
                <tr className="text-[10px] text-brand-greige font-black uppercase tracking-widest">
                  <th className="px-8 py-4">Fecha</th>
                  <th className="px-8 py-4">Concepto</th>
                  <th className="px-8 py-4 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-white">
                {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-brand-white/50 transition-colors group">
                    <td className="px-8 py-4 text-xs font-medium text-brand-greige">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-8 py-4">
                      <p className="font-bold text-brand-dark text-sm">{CATEGORY_LABELS[t.category]}</p>
                      <p className="text-[10px] text-brand-greige italic">{t.description || 'Sin descripción'}</p>
                    </td>
                    <td className={`px-8 py-4 text-right font-black ${t.type === 'income' ? 'text-brand-sage' : 'text-brand-red'}`}>
                      {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-8 py-20 text-center text-brand-greige italic">No hay movimientos este mes.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Transacción */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-10 space-y-8 animate-slideUp border border-brand-beige">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-brand-dark">Registrar Movimiento</h3>
              <span className="text-brand-red text-xl">★</span>
            </div>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex bg-brand-white p-1 rounded-2xl border border-brand-beige">
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, type: 'income', category: 'venta'})}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.type === 'income' ? 'bg-white shadow-sm text-brand-sage' : 'text-brand-greige'}`}
                >
                  Ingreso (+)
                </button>
                <button 
                  type="button" 
                  onClick={() => setFormData({...formData, type: 'expense', category: 'materia_prima'})}
                  className={`flex-1 py-3 rounded-xl font-bold transition-all ${formData.type === 'expense' ? 'bg-white shadow-sm text-brand-red' : 'text-brand-greige'}`}
                >
                  Egreso (-)
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Categoría</label>
                <select 
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as any})}
                  className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage font-bold"
                >
                  {Object.entries(CATEGORY_LABELS)
                    .filter(([key]) => {
                      if (formData.type === 'income') return key === 'venta' || key === 'capital_inicial';
                      return key !== 'venta' && key !== 'capital_inicial';
                    })
                    .map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Monto ($)</label>
                <input 
                  type="number" required
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: Number(e.target.value)})}
                  className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage font-bold text-2xl"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Descripción / Nota</label>
                <input 
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none focus:border-brand-sage"
                  placeholder="Ej: Pago de luz local, Venta mantita..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-4 text-brand-greige font-bold">Cerrar</button>
                <button type="submit" className="flex-[2] bg-brand-dark text-white py-4 rounded-2xl font-bold hover:bg-brand-sage transition-all">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountingManager;
