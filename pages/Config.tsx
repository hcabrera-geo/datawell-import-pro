import React, { useState, useEffect } from 'react';
import { updateSupabaseConfig, getSupabaseConfig } from '../services/dataService';
import { Trash2, Save } from 'lucide-react';

const Config: React.FC = () => {
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = getSupabaseConfig();
    if (current.url) setUrl(current.url);
    if (current.key) setKey(current.key);
  }, []);

  const handleSave = () => {
    updateSupabaseConfig(url, key);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
      if (confirm("¿Estás seguro de desconectar la base de datos? Esto borrará las credenciales de este navegador.")) {
          updateSupabaseConfig('', '');
          setUrl('');
          setKey('');
          alert("Desconectado correctamente.");
      }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-[#1B4079] mb-6">Configuración del Sistema</h2>
      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl border-l-4 border-[#4D7C8A]">
        <h3 className="text-xl font-bold text-[#4D7C8A] mb-4">Base de Datos (Supabase)</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Ingrese las credenciales de su proyecto Supabase. Estos datos se guardan localmente en su navegador para permitir la conexión. 
          Si desea volver al modo "Demo" local, borre las credenciales.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-bold mb-2">Supabase Project URL</label>
            <input 
              type="text" 
              className="w-full border p-3 rounded bg-gray-50 focus:ring-2 focus:ring-[#4D7C8A] outline-none"
              placeholder="https://xyz.supabase.co"
              value={url}
              onChange={e => setUrl(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 font-bold mb-2">Supabase API Key (Public/Anon)</label>
            <input 
              type="password" 
              className="w-full border p-3 rounded bg-gray-50 focus:ring-2 focus:ring-[#4D7C8A] outline-none"
              placeholder="eyJh..."
              value={key}
              onChange={e => setKey(e.target.value)}
            />
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button 
                onClick={handleSave}
                className="bg-[#1B4079] text-white px-6 py-2 rounded hover:bg-[#4D7C8A] transition-colors flex items-center"
            >
                <Save size={18} className="mr-2"/>
                Guardar Configuración
            </button>

            {(url || key) && (
                <button 
                    onClick={handleClear}
                    className="text-red-500 hover:text-red-700 px-4 py-2 rounded border border-red-200 hover:bg-red-50 transition-colors flex items-center"
                >
                    <Trash2 size={18} className="mr-2"/>
                    Borrar Credenciales
                </button>
            )}
          </div>
          
          {saved && (
              <div className="bg-green-100 text-green-800 p-3 rounded mt-2 text-center font-bold animate-fade-in">
                  ¡Configuración guardada correctamente!
              </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default Config;