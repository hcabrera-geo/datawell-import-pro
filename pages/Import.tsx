import React, { useState, useRef } from 'react';
import { Upload, FileText, Settings, ArrowRight, AlertTriangle, X } from 'lucide-react';
import { getRules, getWells, saveImportBatch } from '../services/dataService';
import { RawMeasurement, DailyAverage } from '../types';

interface ChannelConfig {
  name: string;
  index: number;
  enabled: boolean;
  metricType: string;
  unit: string;
}

const Import: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [detectedChannels, setDetectedChannels] = useState<ChannelConfig[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  // Return separate date and time strings
  const parseDateTime = (dateStr: string, timeStr?: string): { date: string, time: string } | null => {
    try {
        const cleanDate = dateStr?.replace(/["']/g, '').trim();
        const cleanTime = timeStr?.replace(/["']/g, '').trim();

        if (!cleanDate) return null;

        const dateParts = cleanDate.split(/[-/]/);
        if (dateParts.length !== 3) return null;

        const day = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        let year = parseInt(dateParts[2], 10);
        if (year < 100) year += 2000;

        // Pad with leading zeros
        const yStr = year.toString();
        const mStr = month.toString().padStart(2, '0');
        const dStr = day.toString().padStart(2, '0');

        let hour = '00', min = '00', sec = '00';
        if (cleanTime && cleanTime.includes(':')) {
            const timeParts = cleanTime.split(':');
            hour = (timeParts[0] || '0').padStart(2, '0');
            min = (timeParts[1] || '0').padStart(2, '0');
            sec = (timeParts[2] || '0').padStart(2, '0');
        }

        return {
            date: `${yStr}-${mStr}-${dStr}`,
            time: `${hour}:${min}:${sec}`
        };

    } catch (e) {
        return null;
    }
  };

  // Analyze First File
  const analyzeFiles = (fileList: File[]) => {
    if (fileList.length === 0) return;
    const firstFile = fileList[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return;
        const lines = text.split('\n');
        if (lines.length < 18) {
            addLog(`⚠️ Archivo ${firstFile.name} demasiado corto (se esperan > 17 líneas).`);
            return;
        }
        const headerLine = lines[16].trim();
        const headers = headerLine.replace(/["']/g, '').split(/,|;/).map(h => h.trim().replace(/:$/, ''));
        
        const foundChannels: ChannelConfig[] = [];
        headers.forEach((header, idx) => {
            const hLower = header.toLowerCase();
            if (hLower.startsWith('ch') || hLower.includes('canal')) {
                foundChannels.push({ name: header, index: idx, enabled: true, metricType: 'Flujo de Agua', unit: 'kg/s' });
            }
        });

        if (foundChannels.length === 0 && headers.length > 2) {
             foundChannels.push({ name: 'Valor (Col 3)', index: 2, enabled: true, metricType: 'Flujo de Agua', unit: 'kg/s' });
        }
        setDetectedChannels(foundChannels);
        setAnalyzed(true);
    };
    reader.readAsText(firstFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files) as File[];
      setFiles(selectedFiles);
      setLogs([]);
      setAnalyzed(false);
      analyzeFiles(selectedFiles);
    }
  };

  const updateChannelConfig = (index: number, field: keyof ChannelConfig, value: any) => {
      const updated = [...detectedChannels];
      updated[index] = { ...updated[index], [field]: value };
      setDetectedChannels(updated);
  };

  const processFile = async (file: File) => {
    return new Promise<void>(async (resolve) => {
      addLog(`📄 Procesando: ${file.name}...`);
      
      const fileNameRegex = /(TR-\d+)/i;
      const match = file.name.match(fileNameRegex);
      if (!match) {
        addLog(`❌ Nombre inválido. Falta "TR-XXX".`);
        resolve();
        return;
      }
      const wellName = match[1].toUpperCase();
      const wells = await getWells();
      const rules = await getRules();
      
      let targetWellIds: string[] = [];
      const exactWell = wells.find(w => w.name === wellName);
      const activeRule = rules.find(r => r.sourceWellNamePattern === wellName);
      
      if (activeRule) targetWellIds = activeRule.targetWellIds;
      else if (exactWell) targetWellIds = [exactWell.id];
      else {
        addLog(`⚠️ Pozo ${wellName} no encontrado.`);
        resolve();
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        if (!text) { resolve(); return; }
        const lines = text.split('\n');
        
        const rawBatch: RawMeasurement[] = [];
        
        // Structures for aggregation: { wellId_Date_Metric: { sum, count, unit } }
        const aggregationMap: Record<string, { sum: number, count: number, unit: string, wellId: string, date: string, metricType: string }> = {};

        let rowsProcessed = 0;

        for (let i = 17; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.replace(/"/g, '').split(/,|;/); 
          if (cols.length < 2) continue;

          const dt = parseDateTime(cols[0], cols[1]);

          if (dt) {
            detectedChannels.forEach(ch => {
                if (!ch.enabled) return;
                if (cols.length > ch.index) {
                    const rawValue = parseFloat(cols[ch.index]);
                    if (!isNaN(rawValue)) {
                         
                         const valueToSave = activeRule?.action === 'split' && activeRule.splitPercentage 
                            ? (rawValue * (activeRule.splitPercentage / 100)) / Math.max(1, targetWellIds.length)
                            : rawValue;

                         targetWellIds.forEach(targetId => {
                            // 1. Prepare Raw
                            rawBatch.push({
                                id: crypto.randomUUID(),
                                wellId: targetId,
                                measurementDate: dt.date,
                                measurementTime: dt.time,
                                value: valueToSave,
                                channelName: ch.name,
                                originalFileName: file.name,
                                importedAt: new Date().toISOString()
                            });

                            // 2. Aggregate for Daily Average (Ignore <= 0)
                            if (valueToSave > 0) {
                                const key = `${targetId}_${dt.date}_${ch.metricType}`;
                                if (!aggregationMap[key]) {
                                    aggregationMap[key] = { 
                                        sum: 0, count: 0, unit: ch.unit, 
                                        wellId: targetId, date: dt.date, metricType: ch.metricType 
                                    };
                                }
                                aggregationMap[key].sum += valueToSave;
                                aggregationMap[key].count++;
                            }
                         });
                    }
                }
            });
            rowsProcessed++;
          }
        }

        // Convert Aggregation Map to Array
        const averagesBatch: DailyAverage[] = Object.values(aggregationMap).map(agg => ({
            wellId: agg.wellId,
            date: agg.date,
            avgValue: agg.sum / agg.count,
            sampleCount: agg.count,
            metricType: agg.metricType,
            unit: agg.unit
        }));

        if (rawBatch.length > 0) {
          await saveImportBatch(rawBatch, averagesBatch);
          addLog(`✅ ${file.name}: ${rowsProcessed} líneas -> ${rawBatch.length} mediciones y ${averagesBatch.length} promedios actualizados.`);
        } else {
          addLog(`⚠️ ${file.name}: Sin datos válidos.`);
        }
        resolve();
      };
      reader.readAsText(file);
    });
  };

  const handleImport = async () => {
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      await processFile(file);
    }
    setUploading(false);
    setFiles([]);
    setDetectedChannels([]);
    setAnalyzed(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    addLog('🏁 Proceso finalizado.');
  };

  const removeFile = (idx: number) => {
      const newFiles = [...files];
      newFiles.splice(idx, 1);
      setFiles(newFiles);
      if (newFiles.length === 0) {
          setAnalyzed(false);
          setDetectedChannels([]);
          setLogs([]);
      }
  };

  return (
    <div className="p-8 h-full flex flex-col">
      <h2 className="text-3xl font-bold text-[#1B4079] mb-6">Importación Masiva de Datos</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
        <div className="flex flex-col gap-6">
          <div className="bg-white p-8 rounded-lg shadow-md border-2 border-dashed border-[#4D7C8A] flex flex-col items-center justify-center min-h-[150px]">
             <Upload size={48} className="text-[#4D7C8A] mb-4" />
             <p className="text-gray-600 mb-4 text-center">Arrastra archivos .CSV (con encabezado en Fila 17)</p>
             <input type="file" multiple accept=".csv" ref={fileInputRef} onChange={handleFileChange} className="hidden" id="file-upload" />
             <label htmlFor="file-upload" className="bg-[#1B4079] text-white px-6 py-2 rounded cursor-pointer hover:bg-[#4D7C8A] transition-colors font-medium">
               Seleccionar Archivos
             </label>
          </div>

          {analyzed && detectedChannels.length > 0 && (
             <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#CBDF90] animate-fade-in">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#1B4079] flex items-center"><Settings className="mr-2" size={20}/> Canales Detectados</h3>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {detectedChannels.map((ch, idx) => (
                        <div key={idx} className={`border rounded p-3 ${ch.enabled ? 'bg-gray-50' : 'opacity-60'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <label className="flex items-center cursor-pointer font-bold text-[#1B4079]">
                                    <input type="checkbox" checked={ch.enabled} onChange={(e) => updateChannelConfig(idx, 'enabled', e.target.checked)} className="mr-2 accent-[#4D7C8A]"/>
                                    {ch.name} <span className="text-xs font-normal text-gray-500 ml-2">(Col {ch.index + 1})</span>
                                </label>
                            </div>
                            {ch.enabled && (
                                <div className="grid grid-cols-2 gap-2 pl-6">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Magnitud</label>
                                        <select className="w-full text-sm border rounded p-1" value={ch.metricType} onChange={(e) => updateChannelConfig(idx, 'metricType', e.target.value)}>
                                            <option value="Flujo de Agua">Flujo de Agua</option>
                                            <option value="Flujo de Vapor">Flujo de Vapor</option>
                                            <option value="Presión de Cabezal">Presión de Cabezal</option>
                                            <option value="Temperatura">Temperatura</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Unidad</label>
                                        <select className="w-full text-sm border rounded p-1" value={ch.unit} onChange={(e) => updateChannelConfig(idx, 'unit', e.target.value)}>
                                            <option value="kg/s">kg/s</option>
                                            <option value="Bar">Bar</option>
                                            <option value="PSI">PSI</option>
                                            <option value="°C">°C</option>
                                            <option value="t/h">t/h</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
             </div>
          )}

          {files.length > 0 && (
            <div className="bg-white p-4 rounded shadow flex-1 flex flex-col">
              <h3 className="font-bold text-[#1B4079] mb-2">Archivos Pendientes ({files.length})</h3>
              <ul className="flex-1 overflow-y-auto space-y-1 text-sm text-gray-600 mb-4 max-h-40">
                {files.map((f, i) => (
                    <li key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                        <span className="flex items-center"><FileText size={14} className="mr-2"/> {f.name}</span>
                        <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-600"><X size={14}/></button>
                    </li>
                ))}
              </ul>
              <div className="flex space-x-3 mt-auto">
                <button onClick={() => { setFiles([]); setLogs([]); setAnalyzed(false); }} className="flex-1 py-2 border border-red-300 text-red-500 rounded hover:bg-red-50" disabled={uploading}>Cancelar</button>
                <button onClick={handleImport} className="flex-1 py-2 bg-[#CBDF90] text-[#1B4079] font-bold rounded hover:bg-[#8FAD88] flex justify-center items-center disabled:opacity-50" disabled={uploading || !analyzed}>
                  {uploading ? 'Procesando...' : <>Importar Datos <ArrowRight size={16} className="ml-1"/></>}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-[#1e293b] rounded-lg p-6 text-gray-300 font-mono text-sm overflow-y-auto shadow-inner flex flex-col h-full min-h-[400px]">
          <h3 className="text-white font-bold mb-4 border-b border-gray-600 pb-2">Registro de Eventos</h3>
          <div className="flex-1 space-y-2">
            {logs.map((log, i) => (
              <div key={i} className="break-words border-b border-gray-700/50 pb-1 mb-1 last:border-0">
                {log.startsWith('❌') ? <span className="text-red-400 font-bold">{log}</span> : 
                 log.startsWith('✅') ? <span className="text-[#CBDF90] font-bold">{log}</span> :
                 log.startsWith('⚠️') ? <span className="text-yellow-400">{log}</span> : log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Import;
