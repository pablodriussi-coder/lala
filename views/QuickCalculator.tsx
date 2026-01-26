
import React, { useState, useMemo } from 'react';

const QuickCalculator: React.FC = () => {
  const [amount, setAmount] = useState<number>(0);
  
  const presets = [
    { label: '+50%', value: 1.5, color: 'bg-brand-sage text-white' },
    { label: '+30%', value: 1.3, color: 'bg-brand-sage text-white' },
    { label: '+20%', value: 1.2, color: 'bg-brand-sage text-white' },
    { label: '+10%', value: 1.1, color: 'bg-brand-sage text-white' },
    { label: '-5%', value: 0.95, color: 'bg-brand-beige text-brand-dark' },
    { label: '-10%', value: 0.90, color: 'bg-brand-beige text-brand-dark' },
    { label: '-15%', value: 0.85, color: 'bg-brand-beige text-brand-dark' },
    { label: '-20%', value: 0.80, color: 'bg-brand-beige text-brand-dark' },
  ];

  const results = useMemo(() => {
    return presets.map(p => ({
      ...p,
      result: amount * p.value
    }));
  }, [amount]);

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="bg-white p-10 rounded-[3rem] border border-brand-beige shadow-sm max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-brand-dark">Calculadora Express</h2>
          <p className="text-brand-greige font-medium">Precios rápidos para clientes de paso</p>
        </div>

        <div className="space-y-10">
          <div className="relative group">
            <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-3 text-center">Monto Base de Referencia ($)</label>
            <input 
              type="number"
              value={amount || ''}
              onChange={e => setAmount(Number(e.target.value))}
              placeholder="0.00"
              className="w-full text-center text-6xl font-bold bg-brand-white border-2 border-transparent focus:border-brand-sage rounded-[2.5rem] py-10 px-6 outline-none transition-all placeholder:text-brand-greige/30 text-brand-dark shadow-inner"
            />
            {amount > 0 && (
                <button 
                    onClick={() => setAmount(0)}
                    className="absolute right-8 top-1/2 -translate-y-1/2 text-brand-greige hover:text-brand-red text-2xl"
                >
                    ✕
                </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {results.map((p, i) => (
              <button 
                key={i}
                onClick={() => setAmount(Number(p.result.toFixed(2)))}
                className={`p-6 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 active:scale-95 shadow-sm ${p.color}`}
              >
                <span className="text-xs font-black uppercase tracking-tighter opacity-70">{p.label}</span>
                <span className="text-xl font-bold">${p.result.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              </button>
            ))}
          </div>

          <div className="bg-brand-white p-8 rounded-[2rem] border border-brand-beige text-center">
            <p className="text-sm font-medium text-brand-greige italic">
              * Usa esta herramienta para calcular descuentos por efectivo o aumentos por tarjetas de forma instantánea.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickCalculator;
