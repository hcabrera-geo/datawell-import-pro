import React, { useState, useEffect } from 'react';
import { getWells, getDailyAverages, getReportEntries, getReportEntriesInRange, saveReportEntries, getSystems } from '../services/dataService';
import { Well, ReportEntry, System } from '../types';
import { FileText, RefreshCw, Calculator, Table as TableIcon, Save, AlertCircle, Printer } from 'lucide-react';

interface ReportsProps {
    viewMode: 'daily' | 'weekly' | 'monthly';
}

// Extracted InputCell component
const InputCell = ({ 
  value, 
  onCommit, 
  disabled = false, 
  className = '' 
}: { 
  value: number, 
  onCommit: (val: number) => void, 
  disabled?: boolean,
  className?: string
}) => {
  const [localVal, setLocalVal] = useState(value?.toString() || '0');

  useEffect(() => {
      setLocalVal(value?.toString() || '0');
  }, [value]);

  const handleBlur = () => {
      let val = parseFloat(localVal);
      if (isNaN(val)) val = 0;
      if (val !== value) {
        onCommit(val);
      }
      setLocalVal(val.toString());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') e.currentTarget.blur();
  };

  return (
      <input 
        type="number" 
        step="0.01"
        disabled={disabled}
        className={`w-full text-center bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-[#1B4079] rounded px-1 transition-all ${disabled ? 'text-gray-500' : 'font-medium text-gray-800'} ${className}`}
        value={localVal} 
        onChange={e => setLocalVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
  );
};

const Reports: React.FC<ReportsProps> = ({ viewMode }) => {
  const [wells, setWells] = useState<Well[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  
  // State
  const [dateA, setDateA] = useState(new Date().toISOString().split('T')[0]); // Start Date or Single Date
  const [dateB, setDateB] = useState(new Date().toISOString().split('T')[0]); // End Date
  
  const [entries, setEntries] = useState<ReportEntry[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [isSavedInDB, setIsSavedInDB] = useState(false);

  useEffect(() => {
    Promise.all([getWells(), getSystems()]).then(([w, s]) => {
        setWells(w);
        setSystems(s);
    });
    // Reset Data when switching tabs
    setEntries([]);
    setIsSavedInDB(false);
  }, [viewMode]);

  // --- LOGIC: DATE HANDLING ---
  // If view is Monthly, we pick a month (YYYY-MM) and calculate Start/End
  // If view is Weekly, we pick Start/End
  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value; // YYYY-MM
      setDateA(`${val}-01`);
      // Calculate last day
      const [y, m] = val.split('-');
      const lastDay = new Date(parseInt(y), parseInt(m), 0).getDate();
      setDateB(`${val}-${lastDay}`);
  };

  // --- LOGIC: FETCH DATA ---
  const loadData = async () => {
    setLoading(true);
    setIsSavedInDB(false);

    if (viewMode === 'daily') {
        // --- DAILY LOGIC (Existing) ---
        const existingEntries = await getReportEntries(dateA);
        if (existingEntries.length > 0) {
            const hydrated = existingEntries.map(e => {
                const w = wells.find(x => x.id === e.wellId);
                return { ...e, wellName: w?.name || '?', wellType: w?.type };
            });
            setEntries(hydrated);
            setIsSavedInDB(true);
        } else {
            // Generate Draft
            const allAverages = await getDailyAverages();
            const dayData = allAverages.filter(d => d.date === dateA);
            const newEntries: ReportEntry[] = wells.map(w => {
                const wellData = dayData.filter(d => d.wellId === w.id);
                const getVal = (k: string) => wellData.find(d => d.metricType.toLowerCase().includes(k.toLowerCase()))?.avgValue || 0;
                return {
                    reportDate: dateA,
                    wellId: w.id, wellName: w.name, wellType: w.type, systemId: w.systemId, status: w.status,
                    headPressure: parseFloat(getVal('Cabezal').toFixed(2)),
                    sepPressure: parseFloat(getVal('Separación').toFixed(2)),
                    steamFlow: parseFloat(getVal('Vapor').toFixed(2)),
                    waterFlow: parseFloat(getVal('Agua').toFixed(2)),
                    enthalpy: 0, quality: 0,
                    operationHours: w.status === 'open' ? 24 : 0,
                    stemDistance: parseFloat(getVal('Vástago').toFixed(2)),
                    temperature: parseFloat(getVal('Temperatura').toFixed(2))
                };
            });
            setEntries(newEntries);
        }
    } else {
        // --- AGGREGATION LOGIC (Weekly / Monthly) ---
        // Fetch all report entries in range
        const rangeEntries = await getReportEntriesInRange(dateA, dateB);
        
        // Group by Well
        const aggregatedEntries: ReportEntry[] = wells.map(w => {
            const wellRows = rangeEntries.filter(r => r.wellId === w.id);
            const count = wellRows.length || 1;
            
            // Helper to Average
            const avg = (field: keyof ReportEntry) => {
                const sum = wellRows.reduce((a, b) => a + (Number(b[field]) || 0), 0);
                return wellRows.length > 0 ? sum / wellRows.length : 0;
            };

            // Snapshot config taken from the Well definition (current), or latest entry
            // For reports over time, status might vary, so we show current or 'Mixed'
            return {
                reportDate: `${dateA} al ${dateB}`,
                wellId: w.id, wellName: w.name, wellType: w.type, systemId: w.systemId, status: w.status,
                headPressure: avg('headPressure'),
                sepPressure: avg('sepPressure'),
                steamFlow: avg('steamFlow'),
                waterFlow: avg('waterFlow'),
                enthalpy: avg('enthalpy'),
                quality: avg('quality'),
                operationHours: avg('operationHours'), // Average daily hours
                stemDistance: avg('stemDistance'),
                temperature: avg('temperature')
            };
        });
        
        // Filter out wells with 0 flow to clean up report? Or keep all. Keeping all for consistency.
        setEntries(aggregatedEntries);
    }

    setLoading(false);
  };

  // --- ACTIONS ---
  const calculateThermodynamics = () => {
      // (Same logic as before)
      const getSteamProperties = (P_bar: number) => {
          const steamTable = [[0.1, 191.8, 2584.7], [1, 417.4, 2675.5], [2, 504.7, 2706.7], [4, 604.7, 2738.6], [6, 670.6, 2756.8], [8, 721.1, 2769.1], [10, 762.8, 2778.1], [12, 798.6, 2784.8], [15, 844.9, 2792.2], [20, 908.8, 2799.5], [30, 1008.4, 2804.2], [40, 1087.3, 2801.4]];
          let lower = steamTable[0], upper = steamTable[steamTable.length - 1];
          for (let i = 0; i < steamTable.length - 1; i++) { if (P_bar >= steamTable[i][0] && P_bar <= steamTable[i+1][0]) { lower = steamTable[i]; upper = steamTable[i+1]; break; } }
          const ratio = (P_bar - lower[0]) / (upper[0] - lower[0]);
          return { hf: lower[1] + (upper[1] - lower[1]) * ratio, hg: lower[2] + (upper[2] - lower[2]) * ratio };
      };

      const updated = entries.map(row => {
          if (row.wellType !== 'production') return row;
          const P = row.sepPressure > 0 ? row.sepPressure : row.headPressure;
          const totalFlow = row.steamFlow + row.waterFlow;
          if (P > 0 && totalFlow > 0) {
              const { hf, hg } = getSteamProperties(P);
              const X = row.steamFlow / totalFlow; 
              return { ...row, enthalpy: parseFloat((hf + (X * (hg - hf))).toFixed(2)), quality: parseFloat((X * 100).toFixed(2)) };
          }
          return row;
      });
      setEntries(updated);
      setIsSavedInDB(false); // Only relevant for Daily
  };

  const handleSave = async () => {
      if (viewMode !== 'daily') return; // Cannot save aggregates back to daily table directly
      try {
          await saveReportEntries(entries);
          setIsSavedInDB(true);
          alert("Informe guardado.");
      } catch (e: any) {
          alert("Error: " + e.message);
      }
  };

  const updateEntry = (wellId: string, field: keyof ReportEntry, value: any) => {
      if (viewMode !== 'daily') return;
      setEntries(prev => prev.map(e => e.wellId === wellId ? { ...e, [field]: value } : e));
      setIsSavedInDB(false);
  };

  const handlePrint = () => {
      window.print();
  };

  // --- RENDER HELPERS ---
  const prodEntries = entries.filter(e => e.wellType === 'production');
  const reinjEntries = entries.filter(e => e.wellType === 'reinjection');
  const isEditable = viewMode === 'daily';

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      
      {/* HEADER / CONTROLS (Hidden on Print) */}
      <div className="no-print flex flex-col md:flex-row justify-between items-center mb-6 gap-4 sticky top-0 bg-gray-100 z-10 py-2">
          <div>
            <h2 className="text-3xl font-bold text-[#1B4079]">
                Informe {viewMode === 'daily' ? 'Diario' : viewMode === 'weekly' ? 'Semanal' : 'Mensual'}
            </h2>
            {isEditable && (
                <p className="text-gray-500 text-sm flex items-center">
                    {isSavedInDB ? <span className="text-green-600 font-bold flex items-center mr-2">● Guardado</span> : <span className="text-orange-500 font-bold flex items-center mr-2">● Sin guardar</span>}
                    Edite los valores manualmente.
                </p>
            )}
            {!isEditable && (
                <p className="text-gray-500 text-sm">
                    Promedios calculados de informes guardados.
                </p>
            )}
          </div>

          <div className="bg-white p-2 rounded-lg shadow flex items-center gap-3 flex-wrap justify-end">
              
              {/* Date Pickers */}
              {viewMode === 'daily' && (
                 <input type="date" className="border rounded px-3 py-2 outline-none" value={dateA} onChange={e => setDateA(e.target.value)} />
              )}
              {viewMode === 'weekly' && (
                 <div className="flex items-center gap-2">
                     <input type="date" className="border rounded px-2 py-1" value={dateA} onChange={e => setDateA(e.target.value)} />
                     <span>a</span>
                     <input type="date" className="border rounded px-2 py-1" value={dateB} onChange={e => setDateB(e.target.value)} />
                 </div>
              )}
              {viewMode === 'monthly' && (
                 <input type="month" className="border rounded px-3 py-2 outline-none" onChange={handleMonthChange} />
              )}

              <button onClick={loadData} disabled={loading} className="bg-[#1B4079] text-white px-4 py-2 rounded font-medium hover:bg-[#4D7C8A] flex items-center">
                 {loading ? <RefreshCw className="animate-spin mr-2" size={18}/> : <FileText className="mr-2" size={18}/>}
                 Generar
              </button>
              
              <div className="h-8 w-px bg-gray-300 mx-2"></div>
              
              {isEditable && (
                <>
                    <button onClick={calculateThermodynamics} disabled={entries.length === 0} className="bg-[#CBDF90] text-[#1B4079] px-3 py-2 rounded font-bold hover:bg-[#8FAD88] flex items-center" title="Calcular">
                        <Calculator size={18}/>
                    </button>
                    <button onClick={handleSave} disabled={entries.length === 0} className="bg-green-600 text-white px-3 py-2 rounded font-bold hover:bg-green-700 flex items-center shadow-lg" title="Guardar en BD">
                        <Save size={18}/>
                    </button>
                </>
              )}

              <button onClick={handlePrint} disabled={entries.length === 0} className="bg-gray-800 text-white px-4 py-2 rounded font-bold hover:bg-black flex items-center ml-2">
                  <Printer className="mr-2" size={18}/> Exportar PDF
              </button>
          </div>
      </div>

      {/* PRINT HEADER (Visible only on Print) */}
      <div className="print-only hidden mb-8 border-b-2 border-[#1B4079] pb-4">
            <h1 className="text-2xl font-bold text-[#1B4079] uppercase">Reporte {viewMode === 'daily' ? 'Diario' : viewMode === 'weekly' ? 'Semanal' : 'Mensual'} de Medición</h1>
            <div className="flex justify-between mt-2 text-sm text-gray-600">
                <span><strong>Fecha Reporte:</strong> {viewMode === 'daily' ? dateA : `${dateA} al ${dateB}`}</span>
                <span><strong>Generado:</strong> {new Date().toLocaleString()}</span>
            </div>
      </div>

      {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 bg-white rounded-lg border-2 border-dashed border-gray-300 text-gray-400">
              <TableIcon size={64} className="mb-4 opacity-20"/>
              <p>Seleccione rango y genere el reporte.</p>
          </div>
      ) : (
          <div className="flex flex-col xl:flex-row gap-6 items-start">
            
            {/* PRODUCTION TABLE */}
            <div className="flex-1 bg-white rounded-lg shadow w-full overflow-hidden print:shadow-none print:border">
                <div className="bg-[#4D7C8A] text-white p-2 font-bold text-center text-sm print:bg-gray-200 print:text-black">POZOS PRODUCTORES</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-center border-collapse">
                        <thead>
                            <tr className="bg-[#CBDF90] text-[#1B4079] uppercase font-bold tracking-tight print:bg-gray-100 print:text-black">
                                <th className="p-2 border">Pozo</th>
                                <th className="p-2 border">Sistema Destino</th>
                                <th className="p-2 border w-16">P. Cab<br/>(bar)</th>
                                <th className="p-2 border w-16">P. Sep<br/>(bar)</th>
                                <th className="p-2 border w-16">Vapor<br/>(kg/s)</th>
                                <th className="p-2 border w-16">Agua<br/>(kg/s)</th>
                                <th className="p-2 border bg-blue-100 print:bg-white">Entalpía</th>
                                <th className="p-2 border bg-blue-100 print:bg-white">Calidad</th>
                                <th className="p-2 border">Hrs</th>
                                <th className="p-2 border">Vástago</th>
                            </tr>
                        </thead>
                        <tbody>
                            {prodEntries.map((row) => (
                                <tr key={row.wellId} className={`border-b ${row.status === 'closed' ? 'bg-gray-100 opacity-70' : ''}`}>
                                    <td className="p-2 font-bold text-[#1B4079] text-left flex flex-col">
                                        <span>{row.wellName}</span>
                                        {isEditable && (
                                            <select 
                                                value={row.status} 
                                                onChange={(e) => updateEntry(row.wellId, 'status', e.target.value)}
                                                className={`text-[10px] mt-1 border rounded no-print ${row.status === 'open' ? 'text-green-600' : 'text-red-500'}`}
                                            >
                                                <option value="open">Abierto</option>
                                                <option value="closed">Cerrado</option>
                                            </select>
                                        )}
                                        {!isEditable && <span className="text-[10px] text-gray-500">{row.status === 'open' ? 'Abierto' : 'Cerrado/Mixto'}</span>}
                                    </td>
                                    <td className="p-1">
                                        {isEditable ? (
                                            <select 
                                                value={row.systemId} 
                                                onChange={(e) => updateEntry(row.wellId, 'systemId', e.target.value)}
                                                className="w-full text-xs border-gray-200 rounded no-print"
                                            >
                                                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        ) : (
                                            <span>{systems.find(s=>s.id === row.systemId)?.name || '-'}</span>
                                        )}
                                    </td>
                                    {/* For read-only views, fix decimal display */}
                                    <td className="p-1 border text-center">{isEditable ? <InputCell value={row.headPressure} onCommit={v => updateEntry(row.wellId, 'headPressure', v)} /> : row.headPressure.toFixed(2)}</td>
                                    <td className="p-1 border text-center">{isEditable ? <InputCell value={row.sepPressure} onCommit={v => updateEntry(row.wellId, 'sepPressure', v)} /> : row.sepPressure.toFixed(2)}</td>
                                    <td className="p-1 border bg-red-50 print:bg-white text-center">{isEditable ? <InputCell value={row.steamFlow} onCommit={v => updateEntry(row.wellId, 'steamFlow', v)} /> : row.steamFlow.toFixed(2)}</td>
                                    <td className="p-1 border bg-blue-50 print:bg-white text-center">{isEditable ? <InputCell value={row.waterFlow} onCommit={v => updateEntry(row.wellId, 'waterFlow', v)} /> : row.waterFlow.toFixed(2)}</td>
                                    <td className="p-1 border bg-gray-50 print:bg-white text-center">{row.enthalpy.toFixed(0)}</td>
                                    <td className="p-1 border bg-gray-50 print:bg-white text-center">{row.quality.toFixed(1)}%</td>
                                    <td className="p-1 border text-center">{row.operationHours.toFixed(1)}</td>
                                    <td className="p-1 border text-center">{row.stemDistance.toFixed(1)}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-200 font-bold print:bg-gray-100">
                                <td className="p-2">TOTAL</td>
                                <td colSpan={3}></td>
                                <td className="p-2">{prodEntries.reduce((a,b)=>a+b.steamFlow,0).toFixed(2)}</td>
                                <td className="p-2">{prodEntries.reduce((a,b)=>a+b.waterFlow,0).toFixed(2)}</td>
                                <td colSpan={4}></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex flex-col gap-4 w-full xl:w-1/3 print:w-full print:mt-4">
                {/* REINJECTION TABLE */}
                <div className="bg-white rounded-lg shadow overflow-hidden print:shadow-none print:border">
                    <div className="bg-[#7F9C96] text-white p-2 font-bold text-center text-sm print:bg-gray-200 print:text-black">POZOS REINYECTORES</div>
                    <table className="w-full text-xs text-center border-collapse">
                        <thead>
                            <tr className="bg-[#CBDF90] text-[#1B4079] uppercase font-bold print:bg-gray-100 print:text-black">
                                <th className="p-2 border">Pozo</th>
                                <th className="p-2 border">Sistema</th>
                                <th className="p-2 border">P. Cab</th>
                                <th className="p-2 border">Agua (kg/s)</th>
                                <th className="p-2 border">Temp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reinjEntries.map((row) => (
                                <tr key={row.wellId} className="border-b">
                                    <td className="p-2 font-bold text-[#1B4079] text-left">
                                        {row.wellName}
                                    </td>
                                    <td className="p-1">
                                         {isEditable ? (
                                            <select 
                                                value={row.systemId} 
                                                onChange={(e) => updateEntry(row.wellId, 'systemId', e.target.value)}
                                                className="w-full text-xs border-gray-200 rounded no-print"
                                            >
                                                {systems.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        ) : <span>{systems.find(s=>s.id === row.systemId)?.name || '-'}</span>}
                                    </td>
                                    <td className="p-1 border text-center">{isEditable ? <InputCell value={row.headPressure} onCommit={v => updateEntry(row.wellId, 'headPressure', v)} /> : row.headPressure.toFixed(2)}</td>
                                    <td className="p-1 border bg-blue-50 font-bold print:bg-white text-center">{isEditable ? <InputCell value={row.waterFlow} onCommit={v => updateEntry(row.wellId, 'waterFlow', v)} /> : row.waterFlow.toFixed(2)}</td>
                                    <td className="p-1 border text-center">{isEditable ? <InputCell value={row.temperature} onCommit={v => updateEntry(row.wellId, 'temperature', v)} /> : row.temperature.toFixed(1)}</td>
                                </tr>
                            ))}
                             <tr className="bg-gray-200 font-bold print:bg-gray-100">
                                <td className="p-2">TOTAL</td>
                                <td colSpan={2}></td>
                                <td className="p-2">{reinjEntries.reduce((a,b)=>a+b.waterFlow,0).toFixed(2)}</td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* SYSTEM BALANCE SUMMARY */}
                <div className="bg-white rounded-lg shadow border border-gray-200 print:shadow-none print:border">
                    <div className="bg-[#1B4079] text-white p-2 font-bold text-center text-sm uppercase print:bg-gray-200 print:text-black">Balance de Agua por Sistema</div>
                    <div className="p-4">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-500 border-b">
                                    <th className="text-left pb-2">Sistema</th>
                                    <th className="text-right pb-2 text-blue-600">Entra</th>
                                    <th className="text-right pb-2 text-green-600">Sale</th>
                                    <th className="text-right pb-2">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {systems.map(sys => {
                                    const waterIn = prodEntries.filter(e => e.systemId === sys.id).reduce((sum, e) => sum + e.waterFlow, 0);
                                    const waterOut = reinjEntries.filter(e => e.systemId === sys.id).reduce((sum, e) => sum + e.waterFlow, 0);
                                    const diff = waterIn - waterOut;
                                    if (waterIn === 0 && waterOut === 0) return null;
                                    return (
                                        <tr key={sys.id}>
                                            <td className="py-2 font-medium">{sys.name}</td>
                                            <td className="py-2 text-right">{waterIn.toFixed(1)}</td>
                                            <td className="py-2 text-right">{waterOut.toFixed(1)}</td>
                                            <td className={`py-2 text-right font-bold ${diff > 0 ? 'text-orange-500' : 'text-gray-400'}`}>
                                                {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        <div className="mt-2 text-xs text-gray-400 flex items-center no-print">
                            <AlertCircle size={12} className="mr-1"/>
                            El balance positivo indica agua acumulada en piscinas o evaporada.
                        </div>
                    </div>
                </div>

            </div>

          </div>
      )}
    </div>
  );
};

export default Reports;