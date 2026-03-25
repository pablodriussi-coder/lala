
import React, { useState, useRef } from 'react';
import { AppData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { supabase } from '../supabaseClient';

import { uploadImageToCloudinary } from '../services/cloudinaryService';

interface DashboardProps {
  data: AppData;
  onUpdateSettings?: (settings: AppData['settings']) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onUpdateSettings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempSettings, setTempSettings] = useState(data.settings);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dbColumns, setDbColumns] = useState<string>('');
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const checkColumns = async () => {
      const { data, error } = await supabase.from('settings').select('*').limit(1);
      if (data && data.length > 0) {
        setDbColumns(Object.keys(data[0]).join(', '));
      }
    };
    checkColumns();
  }, []);

  const totalQuotes = data.quotes.length;
  
  const financialTotals = React.useMemo(() => {
    const income = data.transactions.reduce((acc, t) => t.type === 'income' ? acc + t.amount : acc, 0);
    const expense = data.transactions.reduce((acc, t) => t.type === 'expense' ? acc + t.amount : acc, 0);
    return { balance: income - expense, income, expense };
  }, [data.transactions]);

  const chartData = [
    { name: 'Saldo', value: financialTotals.balance, color: '#b2c0a3' },
    { name: 'Gastos', value: financialTotals.expense, color: '#d1202f' },
    { name: 'Ventas', value: totalQuotes, color: '#404040' },
  ];

  const recentQuotes = [...data.quotes]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  const handleSaveSettings = async () => {
    try {
      setSaveError(null);
      if (onUpdateSettings) {
        await onUpdateSettings(tempSettings);
      }
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      setSaveError(`Error de Supabase: ${err.message || 'Error desconocido al guardar'}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'shopBannerImage' | 'shopLogo', maxWidth = 1200) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Clear the input value so the same file can be selected again if needed
    e.target.value = '';
    
    if (tempSettings.cloudinaryCloudName && tempSettings.cloudinaryUploadPreset) {
      try {
        const url = await uploadImageToCloudinary(file, tempSettings.cloudinaryCloudName, tempSettings.cloudinaryUploadPreset);
        setTempSettings(prev => ({ ...prev, [field]: url }));
        return;
      } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        alert('Error al subir la imagen a Cloudinary. Revisa la configuración.');
      }
    }

    // Fallback to base64 if Cloudinary is not configured
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const format = field === 'shopLogo' ? 'image/png' : 'image/jpeg';
        const quality = field === 'shopLogo' ? undefined : 0.6;
        setTempSettings(prev => ({ ...prev, [field]: canvas.toDataURL(format, quality) }));
      };
    };
  };

  return (
    <>
      <div className="space-y-10 animate-fadeIn pb-20">
        <header className="flex justify-between items-end">
          <div className="flex items-center gap-4">
            {data.settings.shopLogo ? (
              <img src={data.settings.shopLogo} className="h-16 w-auto object-contain" alt="Logo" />
            ) : (
              <div>
                <h2 className="text-sm font-bold text-brand-sage uppercase tracking-[0.3em] mb-1">Bienvenida</h2>
                <h1 className="text-4xl font-bold text-brand-dark">{data.settings.brandName}</h1>
              </div>
            )}
          </div>
          <button 
            onClick={() => { setTempSettings(data.settings); setIsEditing(true); }}
            className="bg-brand-white border border-brand-beige px-6 py-2 rounded-xl text-xs font-black text-brand-dark hover:bg-brand-beige transition-colors"
          >
            ⚙️ AJUSTES
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Capital Disponible', value: `$${financialTotals.balance.toLocaleString()}`, icon: '💰', color: 'text-brand-dark' },
            { label: 'Presupuestos', value: totalQuotes, icon: '📋', color: 'text-brand-sage' },
            { label: 'Showroom Entries', value: data.showroomEntries.length, icon: '✨', color: 'text-brand-greige' },
            { label: 'Clientes', value: data.clients.length, icon: '🤝', color: 'text-brand-red' },
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
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-brand-beige">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold text-brand-dark">Estado del Negocio</h3>
              <span className="text-brand-red text-xl">★</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#d1cdc1', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#d1cdc1', fontSize: 12}} />
                  <Tooltip cursor={{fill: '#f8f7f2'}} contentStyle={{ borderRadius: '20px', border: 'none', backgroundColor: 'white' }} />
                  <Bar dataKey="value" radius={[15, 15, 15, 15]} barSize={40}>
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

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
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-brand-beige text-brand-dark/60">{quote.status}</span>
                    </div>
                  </div>
                );
              }) : <p className="text-center text-brand-greige italic py-10">Sin actividad.</p>}
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-brand-beige animate-slideUp overflow-y-auto max-h-[90vh]">
            <div className="p-10">
              <h3 className="text-2xl font-bold text-brand-dark mb-8">Configuración</h3>
              <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Nombre del Emprendimiento</label>
                <input type="text" value={tempSettings.brandName} onChange={e => setTempSettings({...tempSettings, brandName: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">WhatsApp</label>
                    <input type="text" value={tempSettings.whatsappNumber} onChange={e => setTempSettings({...tempSettings, whatsappNumber: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Instagram (URL)</label>
                    <input type="text" value={tempSettings.instagramUrl} onChange={e => setTempSettings({...tempSettings, instagramUrl: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold text-xs" />
                  </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Facebook (URL)</label>
                <input type="text" value={tempSettings.facebookUrl} onChange={e => setTempSettings({...tempSettings, facebookUrl: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold text-xs" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Correo Electrónico</label>
                <input type="email" value={tempSettings.shopEmail || ''} onChange={e => setTempSettings({...tempSettings, shopEmail: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold text-xs" placeholder="contacto@ejemplo.com" />
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Google Maps Embed URL (Iframe src)</label>
                <input type="text" value={tempSettings.googleMapsUrl || ''} onChange={e => setTempSettings({...tempSettings, googleMapsUrl: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold text-xs" placeholder="https://www.google.com/maps/embed?pb=..." />
                <p className="text-[9px] text-brand-greige mt-1">Pega aquí el enlace "src" que te da Google Maps al compartir "Insertar un mapa".</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Dirección del Showroom / Tienda</label>
                <input type="text" value={tempSettings.shopAddress || ''} onChange={e => setTempSettings({...tempSettings, shopAddress: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold text-xs" placeholder="Ej: Showroom en Buenos Aires" />
              </div>

              <div className="pt-4 border-t border-brand-white">
                <label className="block text-[10px] font-black text-brand-sage uppercase tracking-widest mb-4">Configuración de Cloudinary (Imágenes)</label>
                <p className="text-[9px] text-brand-greige mb-4">Configura Cloudinary para almacenar las imágenes en alta calidad. Necesitas crear una cuenta gratuita en cloudinary.com y configurar un "Upload Preset" sin firma (unsigned).</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Cloud Name</label>
                    <input type="text" value={tempSettings.cloudinaryCloudName || ''} onChange={e => setTempSettings({...tempSettings, cloudinaryCloudName: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold text-xs" placeholder="Ej: dxxabc123" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Upload Preset</label>
                    <input type="text" value={tempSettings.cloudinaryUploadPreset || ''} onChange={e => setTempSettings({...tempSettings, cloudinaryUploadPreset: e.target.value})} className="w-full px-5 py-4 rounded-2xl bg-brand-white border border-brand-beige outline-none font-bold text-xs" placeholder="Ej: mi_preset_sin_firma" />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-brand-white">
                <label className="block text-[10px] font-black text-brand-sage uppercase tracking-widest mb-4">Personalización Visual</label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[9px] font-bold text-brand-greige mb-2">Logo de la Marca (PNG sin fondo)</label>
                    <div onClick={() => logoInputRef.current?.click()} className="h-32 bg-brand-white rounded-xl border-2 border-dashed border-brand-beige flex items-center justify-center cursor-pointer overflow-hidden relative group">
                      {tempSettings.shopLogo ? (
                        <>
                          <img src={tempSettings.shopLogo} className="h-full w-auto object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">Cambiar Logo</div>
                        </>
                      ) : <span className="text-2xl text-brand-greige">+ Logo PNG</span>}
                    </div>
                    <input type="file" ref={logoInputRef} onChange={e => handleFileUpload(e, 'shopLogo', 600)} className="hidden" accept="image/png" />
                  </div>
                  
                  <div>
                    <label className="block text-[9px] font-bold text-brand-greige mb-2">Imagen de Portada (Banner)</label>
                    <div onClick={() => bannerInputRef.current?.click()} className="aspect-video bg-brand-white rounded-xl border-2 border-dashed border-brand-beige flex items-center justify-center cursor-pointer overflow-hidden relative group">
                      {tempSettings.shopBannerImage ? (
                        <>
                          <img src={tempSettings.shopBannerImage} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">Cambiar Banner</div>
                        </>
                      ) : <span className="text-2xl text-brand-greige">+ Banner</span>}
                    </div>
                    <input type="file" ref={bannerInputRef} onChange={e => handleFileUpload(e, 'shopBannerImage')} className="hidden" accept="image/*" />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-brand-greige mb-2">Mensaje en Portada</label>
                    <textarea value={tempSettings.shopBannerText} onChange={e => setTempSettings({...tempSettings, shopBannerText: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-brand-white border border-brand-beige outline-none text-sm font-medium h-20" placeholder="Escribe algo dulce para tus clientes..." />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setIsEditing(false)} className="flex-1 py-4 text-brand-greige font-bold">Cancelar</button>
                <button onClick={handleSaveSettings} className="flex-[2] bg-brand-sage text-white py-4 rounded-2xl font-bold">Guardar Cambios</button>
              </div>
              {saveError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl font-bold text-center">
                  {saveError}
                  {dbColumns && <div className="mt-2 font-mono text-[10px] text-red-400">Columnas en DB: {dbColumns}</div>}
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
