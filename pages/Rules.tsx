import React, { useState, useEffect } from 'react';
import { getRules, saveRule, deleteRule, getWells } from '../services/dataService';
import { ImportRule, Well } from '../types';
import { Trash2, Plus } from 'lucide-react';

const Rules: React.FC = () => {
  const [rules, setRules] = useState<ImportRule[]>([]);
  const [wells, setWells] = useState<Well[]>([]);
  
  // New Rule State
  const [sourcePattern, setSourcePattern] = useState('');
  const [action, setAction] = useState<'split' | 'assign'>('assign');
  const [targetIds, setTargetIds] = useState<string[]>([]);
  const [percentage, setPercentage] = useState<number>(100);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setRules(await getRules());
    setWells(await getWells());
  };

  const handleAddTarget = (id: string) => {
    if (!targetIds.includes(id)) setTargetIds([...targetIds, id]);
  };

  const handleCreate = async () => {
    if (!sourcePattern || targetIds.length === 0) return;

    try {
        const newRule: ImportRule = {
        id: crypto.randomUUID(),
        sourceWellNamePattern: sourcePattern,
        action,
        targetWellIds: targetIds,
        splitPercentage: action === 'split' ? percentage : undefined
        };

        await saveRule(newRule);
        load();
        setSourcePattern('');
        setTargetIds([]);
        setPercentage(100);
    } catch (e: any) {
        alert("Error al crear regla: " + e.message);
    }
  };

  const removeRule = async (id: string) => {
      try {
          await deleteRule(id);
          load();
      } catch (e: any) {
          alert("Error al eliminar regla: " + e.message);
      }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-[#1B4079] mb-6">Reglas de Importación</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-md h-fit">
          <h3 className="font-bold text-[#4D7C8A] mb-4 text-lg">Nueva Regla</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Nombre Pozo Origen (CSV)</label>
              <input 
                type="text" 
                className="w-full border p-2 rounded" 
                placeholder="Ej. TR-101"
                value={sourcePattern}
                onChange={e => setSourcePattern(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">Acción</label>
              <select 
                className="w-full border p-2 rounded"
                value={action}
                onChange={(e) => setAction(e.target.value as any)}
              >
                <option value="assign">Asignar (Copia Idéntica)</option>
                <option value="split">Repartir (Dividir Valor)</option>
              </select>
            </div>

            {action === 'split' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">Porcentaje del Total (%)</label>
                <input 
                  type="number" 
                  className="w-full border p-2 rounded"
                  value={percentage}
                  onChange={e => setPercentage(Number(e.target.value))}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-600 mb-1">Pozos Destino</label>
              <select 
                className="w-full border p-2 rounded mb-2"
                onChange={(e) => {
                  if(e.target.value) handleAddTarget(e.target.value);
                }}
                value=""
              >
                <option value="">Añadir Pozo...</option>
                {wells.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              
              <div className="flex flex-wrap gap-2">
                {targetIds.map(tid => {
                   const w = wells.find(x => x.id === tid);
                   return (
                     <span key={tid} className="bg-gray-100 px-2 py-1 rounded text-sm flex items-center">
                       {w?.name || tid}
                       <button onClick={() => setTargetIds(targetIds.filter(x => x !== tid))} className="ml-2 text-red-500">
                         <Trash2 size={12}/>
                       </button>
                     </span>
                   )
                })}
              </div>
            </div>

            <button 
              onClick={handleCreate}
              className="w-full bg-[#1B4079] text-white py-2 rounded hover:bg-[#4D7C8A] flex justify-center items-center"
            >
              <Plus size={18} className="mr-2"/> Crear Regla
            </button>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-4">
          {rules.map(rule => (
            <div key={rule.id} className="bg-white p-4 rounded-lg shadow border-l-4 border-[#CBDF90] flex justify-between items-center">
              <div>
                <h4 className="font-bold text-[#1B4079]">{rule.sourceWellNamePattern}</h4>
                <p className="text-sm text-gray-600">
                  <span className="font-bold text-[#4D7C8A] uppercase">{rule.action === 'assign' ? 'Asignar a' : 'Repartir entre'}</span>: {' '}
                  {rule.targetWellIds.map(id => wells.find(w => w.id === id)?.name || id).join(', ')}
                </p>
                {rule.action === 'split' && <p className="text-xs text-gray-400">Factor: {rule.splitPercentage}%</p>}
              </div>
              <button 
                onClick={() => removeRule(rule.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
          {rules.length === 0 && <div className="text-center text-gray-400 mt-10">No hay reglas definidas.</div>}
        </div>
      </div>
    </div>
  );
};

export default Rules;