import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-white p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border border-brand-beige">
        <h2 className="text-2xl font-black text-brand-dark mb-6 text-center">
          Acceso Manager
        </h2>
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-brand-beige rounded-xl focus:ring-2 focus:ring-brand-sage focus:border-brand-sage outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-brand-dark mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-brand-beige rounded-xl focus:ring-2 focus:ring-brand-sage focus:border-brand-sage outline-none"
              required
            />
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                if (!email || !password) {
                  setError('Por favor, ingresa email y contraseña para ingresar.');
                  return;
                }
                setLoading(true);
                setError(null);
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) setError(error.message);
                setLoading(false);
              }}
              disabled={loading}
              className="w-full bg-[#a3b18a] text-white font-bold py-3 rounded-xl hover:bg-[#8e9c76] transition-colors disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Ingresar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
