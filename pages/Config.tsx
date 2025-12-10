import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, Database, Info, CheckCircle, AlertCircle } from 'lucide-react';

const Config: React.FC = () => {
  const [dbPath, setDbPath] = useState('');
  const [appVersion, setAppVersion] = useState('');
  const [updateStatus, setUpdateStatus] = useState<{
    status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error';
    message?: string;
    version?: string;
    progress?: number;
  }>({ status: 'idle' });

  useEffect(() => {
    // Get database path and app version
    const loadInfo = async () => {
      try {
        if (window.electronAPI) {
          console.log('electronAPI disponible, cargando info...');
          
          try {
            const path = await window.electronAPI.getDatabasePath();
            console.log('Database path:', path);
            setDbPath(path || 'No disponible');
          } catch (err) {
            console.error('Error getting db path:', err);
            setDbPath('Error al cargar');
          }
          
          try {
            const version = await window.electronAPI.getAppVersion();
            console.log('App version:', version);
            setAppVersion(version || 'No disponible');
          } catch (err) {
            console.error('Error getting app version:', err);
            setAppVersion('Error al cargar');
          }
          
          // Listen for update status
          window.electronAPI.onUpdateStatus((status: any) => {
            console.log('Update status received:', status);
            setUpdateStatus(status);
          });
        } else {
          console.error('electronAPI NO está disponible');
          setDbPath('electronAPI no disponible');
          setAppVersion('electronAPI no disponible');
        }
      } catch (err) {
        console.error('Error en loadInfo:', err);
      }
    };
    
    loadInfo();
  }, []);

  const handleCheckUpdates = async () => {
    try {
      console.log('handleCheckUpdates iniciado');
      if (window.electronAPI) {
        console.log('electronAPI disponible, iniciando check...');
        setUpdateStatus({ status: 'checking', message: 'Buscando actualizaciones...' });
        try {
          const result = await window.electronAPI.checkForUpdates();
          console.log('Check result:', result);
          if (result.updateAvailable) {
            setUpdateStatus({
              status: 'available',
              message: `Nueva versión disponible: v${result.version}`,
              version: result.version
            });
          } else {
            setUpdateStatus({
              status: 'not-available',
              message: 'Ya estás usando la versión más reciente'
            });
            setTimeout(() => setUpdateStatus({ status: 'idle' }), 3000);
          }
        } catch (error: any) {
          console.error('Error en checkForUpdates:', error);
          setUpdateStatus({
            status: 'error',
            message: `Error al buscar actualizaciones: ${error.message || 'Desconocido'}`
          });
        }
      } else {
        console.error('electronAPI NO disponible');
        setUpdateStatus({ status: 'error', message: 'electronAPI no está disponible' });
      }
    } catch (err) {
      console.error('Error en handleCheckUpdates:', err);
      setUpdateStatus({ 
        status: 'error', 
        message: 'Error: ' + (err instanceof Error ? err.message : 'Desconocido')
      });
    }
  };

  const handleDownloadUpdate = async () => {
    if (window.electronAPI) {
      try {
        setUpdateStatus({ status: 'downloading', message: 'Preparando descarga...', progress: 0 });
        const resp = await window.electronAPI.downloadUpdate();
        if (resp?.success) {
          setUpdateStatus({ status: 'downloading', message: resp.message || 'Descargando actualización...', progress: 0 });
        } else {
          setUpdateStatus({
            status: 'error',
            message: resp?.message || resp?.error || 'Descarga automática no disponible'
          });
        }
      } catch (error: any) {
        setUpdateStatus({
          status: 'error',
          message: `Error al descargar: ${error.message}`
        });
      }
    }
  };

  const handleInstallUpdate = async () => {
    if (window.electronAPI && window.confirm('La aplicación se cerrará para instalar la actualización. ¿Continuar?')) {
      const resp = await window.electronAPI.installUpdate();
      if (!resp?.success) {
        setUpdateStatus({ status: 'error', message: resp?.message || 'Instalación automática no disponible' });
      }
    }
  };

  const getStatusColor = () => {
    switch (updateStatus.status) {
      case 'available': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'downloading': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'downloaded': return 'bg-green-100 text-green-800 border-green-300';
      case 'error': return 'bg-red-100 text-red-800 border-red-300';
      case 'not-available': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = () => {
    switch (updateStatus.status) {
      case 'checking': return <RefreshCw className="animate-spin" size={20} />;
      case 'available': return <Download size={20} />;
      case 'downloaded': return <CheckCircle size={20} />;
      case 'error': return <AlertCircle size={20} />;
      case 'not-available': return <CheckCircle size={20} />;
      default: return <Info size={20} />;
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-[#1B4079] mb-6">Configuración del Sistema</h2>
      
      {/* Sección de información de la aplicación */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6 border-l-4 border-[#4D7C8A]">
        <h3 className="text-xl font-bold text-[#4D7C8A] mb-4 flex items-center">
          <Info size={24} className="mr-2" />
          Información de la Aplicación
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700 font-semibold">Versión actual:</span>
            <span className="text-gray-900 font-mono">{appVersion || 'Cargando...'}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b">
            <span className="text-gray-700 font-semibold">Base de datos:</span>
            <span className="text-gray-600 text-sm font-mono truncate max-w-md" title={dbPath}>
              {dbPath || 'Cargando...'}
            </span>
          </div>
        </div>
      </div>

      {/* Sección de actualizaciones */}
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-[#1B4079]">
        <h3 className="text-xl font-bold text-[#1B4079] mb-4 flex items-center">
          <Download size={24} className="mr-2" />
          Actualizaciones
        </h3>
        
        <p className="text-sm text-gray-600 mb-6">
          Verifica si hay nuevas versiones disponibles de DataWell Pro. Las actualizaciones incluyen 
          mejoras de rendimiento, nuevas funciones y correcciones de errores.
        </p>

        {/* Estado de actualización */}
        {updateStatus.status !== 'idle' && (
          <div className={`p-4 rounded-lg border mb-4 flex items-start ${getStatusColor()}`}>
            <div className="mr-3 mt-0.5">{getStatusIcon()}</div>
            <div className="flex-1">
              <p className="font-semibold">{updateStatus.message}</p>
              {updateStatus.progress !== undefined && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${updateStatus.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs mt-1">{Math.round(updateStatus.progress)}% completado</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex gap-3">
          {updateStatus.status === 'idle' || updateStatus.status === 'not-available' || updateStatus.status === 'error' ? (
            <button
              onClick={handleCheckUpdates}
              className="bg-[#1B4079] text-white px-6 py-3 rounded-lg hover:bg-[#4D7C8A] transition-colors flex items-center font-semibold"
            >
              <RefreshCw size={18} className="mr-2" />
              Buscar Actualizaciones
            </button>
          ) : updateStatus.status === 'available' ? (
            <button
              onClick={handleDownloadUpdate}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center font-semibold"
            >
              <Download size={18} className="mr-2" />
              Descargar v{updateStatus.version}
            </button>
          ) : updateStatus.status === 'downloaded' ? (
            <button
              onClick={handleInstallUpdate}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center font-semibold"
            >
              <CheckCircle size={18} className="mr-2" />
              Instalar y Reiniciar
            </button>
          ) : null}
        </div>
      </div>

      {/* Sección de base de datos local */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-6 border-l-4 border-[#4D7C8A]">
        <h3 className="text-xl font-bold text-[#4D7C8A] mb-4 flex items-center">
          <Database size={24} className="mr-2" />
          Base de Datos Local
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          La aplicación utiliza una base de datos SQLite local para almacenar toda la información de pozos, 
          mediciones, promedios y reportes. Los datos se guardan de forma segura en tu computadora.
        </p>
        <div className="bg-gray-50 p-4 rounded border">
          <p className="text-xs text-gray-500 mb-1">Ubicación del archivo:</p>
          <p className="text-sm font-mono text-gray-800 break-all">{dbPath}</p>
        </div>
      </div>
    </div>
  );
};

export default Config;