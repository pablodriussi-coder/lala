
import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AppData, ShowroomEntry } from '../types';

interface ShowroomViewProps {
  data: AppData;
}

const ShowroomView: React.FC<ShowroomViewProps> = ({ data }) => {
  const categories = ['Todas', 'clase', 'exposicion', 'tip', 'evento'];
  const [activeFilter, setActiveFilter] = React.useState('Todas');

  const filteredEntries = useMemo(() => {
    if (activeFilter === 'Todas') return data.showroomEntries;
    return data.showroomEntries.filter(e => e.type === activeFilter);
  }, [data.showroomEntries, activeFilter]);

  return (
    <div className="min-h-screen bg-brand-white font-['Quicksand'] pb-20">
      {/* Header */}
      <div className="bg-white border-b border-brand-beige p-6 flex justify-between items-center sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 text-brand-dark font-black text-sm hover:text-brand-sage transition-all">
          ← Volver a la Tienda
        </Link>
        <h1 className="text-xl font-black text-brand-dark tracking-tighter uppercase">Showroom & Comunidad ★</h1>
        <div className="w-20 hidden md:block"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Intro */}
        <div className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black text-brand-dark mb-6 leading-tight">Mucho más que accesorios.</h2>
          <p className="text-brand-dark/70 text-lg font-medium leading-relaxed italic">
            Descubre nuestro espacio creativo: clases de costura, talleres de bijouterie y los mejores consejos para el cuidado de tu bebé.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${
                activeFilter === cat ? 'bg-brand-sage text-white shadow-lg' : 'bg-white text-brand-dark/50 border border-brand-beige hover:border-brand-sage'
              }`}
            >
              {cat === 'Todas' ? 'Todo' : cat + 's'}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEntries.length > 0 ? [...filteredEntries].reverse().map(entry => (
            <div key={entry.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-brand-beige group hover:shadow-xl transition-all flex flex-col">
              <div className="aspect-video relative overflow-hidden">
                {entry.image ? (
                  <img src={entry.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={entry.title} />
                ) : (
                  <div className="w-full h-full bg-brand-white flex items-center justify-center text-4xl grayscale opacity-10">🎨</div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="bg-white/90 backdrop-blur-sm text-brand-dark px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                    {entry.type}
                  </span>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <p className="text-[10px] font-black text-brand-sage uppercase tracking-[0.2em] mb-2">
                  {new Date(entry.date).toLocaleDateString()}
                </p>
                <h3 className="text-xl font-black text-brand-dark mb-4 leading-snug group-hover:text-brand-sage transition-colors">
                  {entry.title}
                </h3>
                <p className="text-sm text-brand-dark/70 leading-relaxed font-medium mb-6 line-clamp-3">
                  {entry.content}
                </p>
                <button className="mt-auto text-[10px] font-black text-brand-dark uppercase tracking-widest flex items-center gap-2 group/btn">
                  Leer artículo completo <span className="group-hover/btn:translate-x-2 transition-transform">→</span>
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center opacity-30 italic">
               No hay novedades en esta sección aún...
            </div>
          )}
        </div>
      </div>

      {/* Footer / Newsletter Simulado */}
      <div className="bg-brand-sage/10 mt-20 py-20 px-6 text-center">
         <h3 className="text-2xl font-black text-brand-dark mb-4 uppercase tracking-tight">¿Quieres sumarte a nuestras clases?</h3>
         <p className="text-brand-dark/70 font-medium mb-8 italic">Escríbenos por WhatsApp para consultar fechas y disponibilidad.</p>
         <button onClick={() => window.open(`https://wa.me/${data.settings.whatsappNumber}`, '_blank')} className="bg-brand-sage text-white px-12 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl">Consultar Próximas Clases</button>
      </div>
    </div>
  );
};

export default ShowroomView;
