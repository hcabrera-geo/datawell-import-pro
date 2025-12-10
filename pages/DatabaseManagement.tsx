import React, { useEffect, useState } from 'react';
import { getImportedFiles, deleteImportedFile } from '../services/dataService';
import { ImportedFileSummary } from '../types';
import { Trash2, FileText, Database, RefreshCw, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DatabaseManagement: React.FC = () => {
  const [files, setFiles] = useState<ImportedFileSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setLoading(true);
    const data = await getImportedFiles();
    // Sort by date desc
    data.sort((a, b) => new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime());
    setFiles(data);
    setLoading(false);
  };

  const handleDelete = async (fileName: string) => {
      if (confirm(`¿Estás seguro de eliminar TODOS los datos importados del archivo: "${fileName}"? Esta acción no se puede deshacer.`)) {
          setLoading(true);
          setError(null);
          try {
              await deleteImportedFile(fileName);
              await loadFiles();
          } catch (e: any) {
              console.error(e);
              setError("No se pudo eliminar el archivo. Verifica permisos o conexión: " + (e.message || "Error desconocido"));
          } finally {
              setLoading(false);
          }
      }
  };

  return (
    <div className="p-8">
       <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#1B4079]">Gestión de Base de Datos</h2>
        <button 
            onClick={loadFiles} 
            className="text-[#4D7C8A] hover:bg-gray-100 p-2 rounded transition-colors"
            title="Recargar lista"
        >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 text-red-700 flex items-center">
            <AlertTriangle className="mr-2" size={20}/>
            {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
         <div className="p-6 border-b bg-gray-50 flex items-center">
             <Database className="text-[#4D7C8A] mr-3" size={24} />
             <div>
                 <h3 className="font-bold text-[#1B4079] text-lg">Archivos Importados</h3>
                 <p className="text-sm text-gray-500">Gestione los lotes de datos cargados al sistema.</p>
             </div>
         </div>

         {loading && files.length === 0 ? (
             <div className="p-12 text-center text-gray-400">Cargando información...</div>
         ) : (
            <table className="w-full text-left border-collapse">
            <thead className="bg-[#4D7C8A] text-white">
                <tr>
                <th className="p-4 font-semibold">Archivo Original</th>
                <th className="p-4 font-semibold">Fecha de Carga</th>
                <th className="p-4 font-semibold text-center">Registros</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {files.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-400">No hay archivos cargados en la base de datos.</td></tr>
                ) : (
                    files.map((file, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 flex items-center text-[#1B4079] font-medium">
                                <FileText size={16} className="mr-2 text-gray-400"/>
                                {file.fileName}
                            </td>
                            <td className="p-4 text-gray-600">
                                {file.importedAt ? format(new Date(file.importedAt), 'dd MMM yyyy, HH:mm', { locale: es }) : 'N/A'}
                            </td>
                            <td className="p-4 text-center">
                                <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-xs font-bold">
                                    {file.count}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <button 
                                    onClick={() => handleDelete(file.fileName)}
                                    className="text-red-400 hover:text-white hover:bg-red-500 p-2 rounded transition-all flex items-center ml-auto"
                                    title="Eliminar todos los datos de este archivo"
                                >
                                    <Trash2 size={16} className="mr-2" /> Eliminar Datos
                                </button>
                            </td>
                        </tr>
                    ))
                )}
            </tbody>
            </table>
         )}
      </div>
    </div>
  );
};

export default DatabaseManagement;