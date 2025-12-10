import React, { useState, useEffect } from 'react';
import { getWells, getDailyAverages } from '../services/dataService';
import { Well, DailyAverage } from '../types';
import { ChevronRight, Droplet, Calendar, Calculator } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const Averages: React.FC = () => {
  const [wells, setWells] = useState<Well[]>([]);
  const [selectedWell, setSelectedWell] = useState<Well | null>(null);
  const [averages, setAverages] = useState<DailyAverage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      setWells(await getWells());
    };
    init();
  }, []);

  const handleSelectWell = async (well: Well) => {
    setSelectedWell(well);
    setLoading(true);
    setAverages([]); 

    // Now fetches pre-calculated averages from DB
    const data = await getDailyAverages(well.id);
    
    setAverages(data);
    setLoading(false);
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <h2 className="text-3xl font-bold text-[#1B4079] mb-6">Promedios Diarios</h2>
      
      <div className="flex flex-1 gap-8 overflow-hidden">
        <div className="w-1/3 bg-white rounded-lg shadow overflow-y-auto">
          <div className="p-4 bg-[#4D7C8A] text-white font-bold sticky top-0">Seleccionar Pozo</div>
          <div className="divide-y divide-gray-100">
            {wells.map(well => (
              <button
                key={well.id}
                onClick={() => handleSelectWell(well)}
                className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${selectedWell?.id === well.id ? 'bg-blue-50 border-l-4 border-[#1B4079]' : ''}`}
              >
                <div className="flex items-center">
                   <div className={`p-2 rounded-full mr-3 ${well.type === 'production' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                     <Droplet size={16} />
                   </div>
                   <div className="text-left">
                     <p className="font-bold text-[#1B4079]">{well.name}</p>
                     <p className="text-xs text-gray-500">{well.type === 'production' ? 'Producción' : 'Reinyección'}</p>
                   </div>
                </div>
                <ChevronRight size={16} className="text-gray-400" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow flex flex-col overflow-hidden">
          {selectedWell ? (
            <>
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                    <h3 className="text-2xl font-bold text-[#1B4079]">{selectedWell.name}</h3>
                    <p className="text-gray-500 text-sm">Datos desde 'daily_averages'</p>
                </div>
                <div className="bg-blue-50 p-2 rounded text-[#1B4079] text-sm">
                    <strong>{averages.length}</strong> Días registrados
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-0 relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                        <span className="text-[#4D7C8A] font-bold">Cargando promedios...</span>
                    </div>
                )}

                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100 text-gray-600 text-xs uppercase sticky top-0 z-0">
                    <tr>
                      <th className="p-4"><div className="flex items-center"><Calendar size={14} className="mr-2"/> Fecha</div></th>
                      <th className="p-4"><div className="flex items-center"><Calculator size={14} className="mr-2"/> Promedio</div></th>
                      <th className="p-4">Variable</th>
                      <th className="p-4 text-right">Muestras</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {averages.length === 0 && !loading ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400">No hay datos de promedios para este pozo.</td></tr>
                    ) : (
                      averages.map((avg, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="p-4 text-gray-700 font-medium">
                            {format(parseISO(avg.date), 'dd MMMM yyyy', { locale: es })}
                          </td>
                          <td className="p-4">
                              <span className="font-mono font-bold text-[#1B4079] text-xl">
                                {avg.avgValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-gray-400 text-sm ml-2">{avg.unit}</span>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                             {avg.metricType}
                          </td>
                          <td className="p-4 text-right text-xs text-gray-400">
                             {avg.sampleCount}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
               <Droplet size={64} className="mb-4 opacity-20" />
               <p>Seleccione un pozo para ver sus promedios.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Averages;
