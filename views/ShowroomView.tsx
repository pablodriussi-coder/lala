
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
    if (!data.showroomEntries) return [];
    if (activeFilter === 'Todas') return data.showroomEntries;
    return data.showroomEntries.filter(e => e.type === activeFilter);
  }, [data.showroomEntries, activeFilter]);

  return (
    <div className="min-h-screen bg-brand-white font-['Quicksand'] pb-32 relative overflow-x-hidden">
      
      {/* Redes Sociales Barra Derecha Fija - Consistencia con la Tienda */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-2">
        {data.settings.instagramUrl && (
           <a href={data.settings.instagramUrl} target="_blank" rel="noreferrer" className="bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] text-white p-4 rounded-l-3xl shadow-2xl hover:-translate-x-3 transition-all flex items-center gap-2 group">
             <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.332 3.608 1.308.975.975 1.245 2.242 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.332 2.633-1.308 3.608-.975.975-2.242 1.245-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.332-3.608-1.308-.975-.975-1.245-2.242-1.308-3.608-.058-1.266-.07-1.646-.07-4.85s.012-3.584.07-4.85c.062-1.366.332-2.633 1.308-3.608.975-.975 2.242-1.245 3.608-1.308 1.266-.058-1.646-.07 4.85-.07zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98.058-1.281.072-1.689.072-4.948s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98-1.281-.058-1.689-.072-4.948-.072zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.162 6.162 6.162 6.162-2.759 6.162-6.162-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.791-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
             <span className="hidden group-hover:block text-[10px] font-black uppercase tracking-widest ml-2">Instagram</span>
           </a>
        )}
        {data.settings.facebookUrl && (
           <a href={data.settings.facebookUrl} target="_blank" rel="noreferrer" className="bg-[#1877F2] text-white p-4 rounded-l-3xl shadow-2xl hover:-translate-x-3 transition-all flex items-center gap-2 group">
             <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
             <span className="hidden group-hover:block text-[10px] font-black uppercase tracking-widest ml-2">Facebook</span>
           </a>
        )}
        <button onClick={() => window.open(`https://wa.me/${data.settings.whatsappNumber}`, '_blank')} className="bg-[#25D366] text-white p-5 rounded-l-3xl shadow-2xl hover:-translate-x-3 transition-all flex items-center gap-2 group">
           <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
           <span className="hidden group-hover:block text-[10px] font-black uppercase tracking-widest ml-2">WhatsApp</span>
        </button>
      </div>

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-brand-beige p-6 flex justify-between items-center sticky top-0 z-50 animate-fadeIn">
        <Link to="/" className="flex items-center gap-2 text-brand-dark font-black text-[11px] uppercase tracking-widest hover:text-brand-sage transition-all group">
          <span className="group-hover:-translate-x-2 transition-transform">←</span> Volver a la Tienda
        </Link>
        {data.settings.shopLogo ? (
            <img src={data.settings.shopLogo} className="h-10 md:h-14 w-auto object-contain" alt="Logo" />
        ) : (
            <h1 className="text-xl font-black text-brand-dark tracking-tighter uppercase">{data.settings.brandName} ★</h1>
        )}
        <div className="w-24 hidden md:block"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-16 animate-fadeIn">
        {/* Intro */}
        <div className="text-center mb-20 max-w-3xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black text-brand-dark mb-8 leading-tight tracking-tighter uppercase">Mucho más que accesorios <span className="text-brand-red">★</span></h2>
          <p className="text-brand-dark/70 text-xl font-medium leading-relaxed italic border-l-4 border-brand-sage pl-8 py-2">
            "Descubre nuestro espacio creativo: clases de costura, talleres de bijouterie y los mejores consejos para el cuidado de tu bebé."
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          {categories.map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className={`px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-sm ${
                activeFilter === cat ? 'bg-brand-dark text-white shadow-xl scale-105' : 'bg-white text-brand-dark/40 border border-brand-beige hover:border-brand-sage hover:text-brand-sage'
              }`}
            >
              {cat === 'Todas' ? 'Todo' : cat + 's'}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredEntries.length > 0 ? [...filteredEntries].reverse().map(entry => (
            <div key={entry.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-brand-beige group hover:shadow-2xl transition-all duration-500 flex flex-col h-full animate-fadeIn">
              <div className="aspect-[16/10] relative overflow-hidden bg-brand-white">
                {entry.image ? (
                  <img src={entry.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={entry.title} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl grayscale opacity-10">🎨</div>
                )}
                <div className="absolute top-6 left-6">
                  <span className="bg-white/95 backdrop-blur-md text-brand-dark px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg border border-brand-beige">
                    {entry.type}
                  </span>
                </div>
              </div>
              <div className="p-10 flex-1 flex flex-col">
                <p className="text-[11px] font-black text-brand-sage uppercase tracking-[0.3em] mb-4">
                  {new Date(entry.date).toLocaleDateString()} — <span className="text-brand-red">★</span>
                </p>
                <h3 className="text-2xl font-black text-brand-dark mb-6 leading-[1.2] group-hover:text-brand-sage transition-colors line-clamp-2 uppercase">
                  {entry.title}
                </h3>
                <p className="text-brand-dark/60 leading-relaxed font-medium mb-10 line-clamp-4 italic text-sm">
                  {entry.content}
                </p>
                <button className="mt-auto text-[11px] font-black text-brand-dark uppercase tracking-[0.3em] flex items-center gap-3 group/btn hover:text-brand-sage transition-all">
                  Leer artículo completo <span className="group-hover/btn:translate-x-3 transition-transform text-lg">→</span>
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-40 text-center bg-white/50 rounded-[4rem] border-2 border-dashed border-brand-beige">
               <div className="text-6xl mb-8 opacity-10">✨</div>
               <p className="font-black uppercase tracking-[0.4em] text-[12px] text-brand-dark/30">No hay novedades en esta sección aún...</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer / Newsletter Simulado */}
      <div className="bg-brand-sage/5 mt-20 py-24 px-6 text-center border-t border-brand-beige">
         <div className="max-w-xl mx-auto">
            <h3 className="text-3xl font-black text-brand-dark mb-6 uppercase tracking-tight">¿Quieres sumarte a nuestras clases?</h3>
            <p className="text-brand-dark/70 font-medium mb-10 italic leading-relaxed">
              "En Lala accesorios nos encanta compartir lo que sabemos. Escríbenos por WhatsApp para consultar fechas y disponibilidad de nuestros próximos talleres."
            </p>
            <button 
              onClick={() => window.open(`https://wa.me/${data.settings.whatsappNumber}?text=Hola! ✨ Me gustaría consultar por las próximas clases y talleres.`, '_blank')} 
              className="bg-[#25D366] text-white px-16 py-6 rounded-full font-black text-[12px] uppercase tracking-[0.3em] shadow-2xl hover:bg-brand-dark transition-all active:scale-95 flex items-center justify-center gap-4 mx-auto group"
            >
              <svg className="w-6 h-6 fill-current group-hover:rotate-12 transition-transform" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Consultar Próximas Clases
            </button>
         </div>
      </div>
    </div>
  );
};

export default ShowroomView;
