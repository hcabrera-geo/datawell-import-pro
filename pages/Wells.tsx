import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Settings, Layers } from 'lucide-react';
import { Well, System } from '../types';
import { getWells, saveWell, deleteWell, getSystems, saveSystem, deleteSystem } from '../services/dataService';

const Wells: React.FC = () => {
  const [wells, setWells] = useState<Well[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  
  // Well Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Well>>({});

  // System Modal State
  const [isSystemsModalOpen, setIsSystemsModalOpen] = useState(false);
  const [newSystemName, setNewSystemName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const w = await getWells();
    const s = await getSystems();
    setWells(w);
    setSystems(s);
  };

  // --- WELL HANDLERS ---
  const handleSaveWell = async () => {
    if (!formData.name || !formData.systemId) return;
    
    try {
        const newWell: Well = {
        id: formData.id || crypto.randomUUID(),
        name: formData.name,
        type: (formData.type as any) || 'production',
        systemId: formData.systemId,
        status: (formData.status as any) || 'open',
        createdAt: formData.createdAt || new Date().toISOString(),
        };

        await saveWell(newWell);
        setIsModalOpen(false);
        setFormData({});
        loadData();
    } catch (e: any) {
        alert("Error al guardar pozo: " + e.message);
    }
  };

  const handleDeleteWell = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este pozo? Se borrarán sus datos asociados.')) {
      try {
          await deleteWell(id);
          loadData();
      } catch (e: any) {
          alert("Error al eliminar pozo: " + e.message);
      }
    }
  };

  const openEditWell = (well: Well) => {
    setFormData(well);
    setIsModalOpen(true);
  };

  // --- SYSTEM HANDLERS ---
  const handleAddSystem = async () => {
    if(!newSystemName.trim()) return;
    try {
        const newSystem: System = {
            id: crypto.randomUUID(),
            name: newSystemName.trim()
        };
        await saveSystem(newSystem);
        setNewSystemName('');
        loadData();
    } catch (e: any) {
        alert("Error al crear sistema: " + e.message);
    }
  };

  const handleDeleteSystem = async (id: string) => {
    const wellsInSystem = wells.filter(w => w.systemId === id);
    if(wellsInSystem.length > 0) {
        alert(`No se puede eliminar el sistema porque tiene ${wellsInSystem.length} pozo(s) asignado(s).`);
        return;
    }

    if (confirm('¿Estás seguro de eliminar este sistema?')) {
      try {
          await deleteSystem(id);
          loadData();
      } catch (e: any) {
          alert("Error al eliminar sistema: " + e.message);
      }
    }
  };


  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1B4079]">Gestión de Pozos</h2>
        <div className="flex space-x-3">
            <button
            onClick={() => setIsSystemsModalOpen(true)}
            className="bg-[#4D7C8A] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#1B4079] transition-colors"
            >
            <Layers size={18} className="mr-2" />
            Sistemas
            </button>
            <button
            onClick={() => { setFormData({}); setIsModalOpen(true); }}
            className="bg-[#1B4079] text-white px-4 py-2 rounded-lg flex items-center hover:bg-[#4D7C8A] transition-colors"
            >
            <Plus size={18} className="mr-2" />
            Nuevo Pozo
            </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#4D7C8A] text-white">
            <tr>
              <th className="p-4 font-semibold">Nombre</th>
              <th className="p-4 font-semibold">Sistema</th>
              <th className="p-4 font-semibold">Tipo</th>
              <th className="p-4 font-semibold">Estado</th>
              <th className="p-4 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {wells.map((well, idx) => {
                const systemName = systems.find(s => s.id === well.systemId)?.name || 'N/A';
                return (
                    <tr key={well.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-4 font-medium text-[#1B4079]">{well.name}</td>
                    <td className="p-4 text-gray-600">{systemName}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${well.type === 'production' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                        {well.type === 'production' ? 'Producción' : 'Reinyección'}
                        </span>
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${well.status === 'open' ? 'bg-[#CBDF90] text-[#1B4079]' : 'bg-gray-200 text-gray-500'}`}>
                        {well.status === 'open' ? 'Abierto' : 'Cerrado'}
                        </span>
                    </td>
                    <td className="p-4 text-right">
                        <button onClick={() => openEditWell(well)} className="text-[#4D7C8A] hover:text-[#1B4079] mr-3">
                        <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteWell(well.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={18} />
                        </button>
                    </td>
                    </tr>
                )
            })}
          </tbody>
        </table>
        {wells.length === 0 && <div className="p-8 text-center text-gray-500">No hay pozos registrados.</div>}
      </div>

      {/* MODAL CREAR/EDITAR POZO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-[#1B4079]">{formData.id ? 'Editar Pozo' : 'Crear Pozo'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre (ej. TR-101)</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#4D7C8A] outline-none"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sistema</label>
                <select
                  className="w-full border border-gray-300 p-2 rounded outline-none"
                  value={formData.systemId || ''}
                  onChange={(e) => setFormData({...formData, systemId: e.target.value})}
                >
                  <option value="">Seleccionar Sistema</option>
                  {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select
                    className="w-full border border-gray-300 p-2 rounded outline-none"
                    value={formData.type || 'production'}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    >
                    <option value="production">Producción</option>
                    <option value="reinjection">Reinyección</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                    className="w-full border border-gray-300 p-2 rounded outline-none"
                    value={formData.status || 'open'}
                    onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                    >
                    <option value="open">Abierto</option>
                    <option value="closed">Cerrado</option>
                    </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveWell}
                className="px-4 py-2 bg-[#1B4079] text-white rounded hover:bg-[#4D7C8A]"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GESTIÓN DE SISTEMAS */}
      {isSystemsModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh]">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[#1B4079]">Gestión de Sistemas</h3>
                <button onClick={() => setIsSystemsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <span className="text-2xl">&times;</span>
                </button>
             </div>

             <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    className="flex-1 border p-2 rounded outline-none focus:ring-1 focus:ring-[#4D7C8A]"
                    placeholder="Nuevo Sistema..."
                    value={newSystemName}
                    onChange={(e) => setNewSystemName(e.target.value)}
                />
                <button 
                    onClick={handleAddSystem}
                    disabled={!newSystemName.trim()}
                    className="bg-[#CBDF90] text-[#1B4079] font-bold px-4 py-2 rounded hover:bg-[#8FAD88] disabled:opacity-50"
                >
                    Agregar
                </button>
             </div>

             <div className="flex-1 overflow-y-auto border-t border-gray-100 pt-2">
                 {systems.length === 0 ? (
                     <p className="text-center text-gray-400 py-4">No hay sistemas creados.</p>
                 ) : (
                     <ul className="space-y-2">
                         {systems.map(s => (
                             <li key={s.id} className="flex justify-between items-center bg-gray-50 p-3 rounded hover:bg-gray-100">
                                 <span className="font-medium text-gray-700">{s.name}</span>
                                 <button 
                                     onClick={() => handleDeleteSystem(s.id)}
                                     className="text-red-400 hover:text-red-600 p-1"
                                     title="Eliminar sistema"
                                 >
                                     <Trash2 size={16} />
                                 </button>
                             </li>
                         ))}
                     </ul>
                 )}
             </div>

             <div className="mt-4 pt-4 border-t border-gray-100 text-right">
                 <button 
                    onClick={() => setIsSystemsModalOpen(false)}
                    className="text-sm text-gray-500 hover:text-[#1B4079] underline"
                 >
                    Cerrar ventana
                 </button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Wells;