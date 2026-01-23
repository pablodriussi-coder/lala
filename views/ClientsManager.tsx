
import React, { useState } from 'react';
import { AppData, Client } from '../types';
import { ICONS } from '../constants';

interface ClientsManagerProps {
  data: AppData;
  updateData: (updater: (prev: AppData) => AppData) => void;
}

const ClientsManager: React.FC<ClientsManagerProps> = ({ data, updateData }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: Client = {
      id: editingId || crypto.randomUUID(),
      name: formData.name || 'Sin nombre',
      phone: formData.phone || '',
      email: formData.email || '',
      address: formData.address || ''
    };

    updateData(prev => ({
      ...prev,
      clients: editingId 
        ? prev.clients.map(c => c.id === editingId ? newClient : c)
        : [...prev.clients, newClient]
    }));

    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', email: '', address: '' });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-brand-beige shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-brand-dark tracking-tight">Directorio</h2>
          <p className="text-brand-greige font-medium">Gestión de datos de contacto de clientes</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-sage hover:bg-brand-dark text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-lg shadow-brand-sage/20 transition-all font-bold group"
        >
          <ICONS.Add />
          <span>Nuevo Registro</span>
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-brand-beige overflow-hidden">
        <div className="p-6 bg-brand-white/50 border-b border-brand-beige flex gap-4">
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..." 
            className="flex-1 px-6 py-3 rounded-2xl border border-brand-beige outline-none focus:border-brand-sage bg-white text-sm"
          />
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-brand-white/20">
              <th className="px-8 py-6 text-[10px] font-black text-brand-greige uppercase tracking-widest">Identidad</th>
              <th className="px-8 py-6 text-[10px] font-black text-brand-greige uppercase tracking-widest">Contacto</th>
              <th className="px-8 py-6 text-[10px] font-black text-brand-greige uppercase tracking-widest">Ubicación</th>
              <th className="px-8 py-6 text-[10px] font-black text-brand-greige uppercase tracking-widest text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-beige">
            {data.clients.length > 0 ? data.clients.map(client => (
              <tr key={client.id} className="hover:bg-brand-white transition-colors group">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-beige flex items-center justify-center text-brand-dark font-bold uppercase border-2 border-white shadow-sm">
                      {client.name[0]}
                    </div>
                    <span className="font-bold text-brand-dark">{client.name}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <div className="text-xs font-bold">
                    <p className="text-brand-dark">{client.phone}</p>
                    <p className="text-brand-greige mt-0.5">{client.email}</p>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className="text-xs font-medium text-brand-greige">{client.address || 'Pendiente'}</span>
                </td>
                <td className="px-8 py-5 text-right space-x-2">
                    <button 
                        onClick={() => { setEditingId(client.id); setFormData(client); setIsModalOpen(true); }}
                        className="text-brand-sage hover:text-brand-dark font-bold text-sm"
                    >
                        Editar
                    </button>
                    <span className="text-brand-beige">|</span>
                    <button 
                        onClick={() => { if(confirm('¿Segura?')) updateData(prev => ({...prev, clients: prev.clients.filter(c => c.id !== client.id)})); }}
                        className="text-brand-red opacity-50 hover:opacity-100 font-bold text-sm"
                    >
                        Borrar
                    </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-8 py-24 text-center text-brand-greige italic">No hay clientes registrados en el directorio.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/30 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md animate-slideUp border border-brand-beige">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-brand-dark">Ficha de Cliente</h3>
                <span className="text-brand-red text-xl">★</span>
              </div>
              <form onSubmit={handleSave} className="space-y-5">
                <div>
                  <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Nombre y Apellido</label>
                  <input 
                    type="text" required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-brand-beige bg-brand-white outline-none focus:bg-white focus:border-brand-sage font-bold"
                    placeholder="Ej: Sofía Martínez"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Teléfono de Contacto</label>
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-brand-beige bg-brand-white outline-none focus:bg-white focus:border-brand-sage font-bold"
                    placeholder="+54 9..."
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Correo Electrónico</label>
                  <input 
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-brand-beige bg-brand-white outline-none focus:bg-white focus:border-brand-sage font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-brand-greige uppercase tracking-widest mb-2">Dirección de Entrega</label>
                  <input 
                    type="text"
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-5 py-4 rounded-2xl border border-brand-beige bg-brand-white outline-none focus:bg-white focus:border-brand-sage font-bold"
                  />
                </div>
                <div className="flex gap-6 pt-6">
                  <button type="button" onClick={closeModal} className="flex-1 py-4 text-brand-greige font-bold">Cerrar</button>
                  <button type="submit" className="flex-[2] bg-brand-sage text-white py-4 rounded-[1.2rem] font-bold shadow-xl shadow-brand-sage/10 hover:bg-brand-dark transition-all">Confirmar Datos</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsManager;
