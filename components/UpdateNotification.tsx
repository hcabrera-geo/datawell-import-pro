import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, AlertCircle, RefreshCw, X } from 'lucide-react';

interface UpdateNotification {
  show: boolean;
  status: 'checking' | 'available' | 'downloading' | 'downloaded' | 'not-available' | 'error' | null;
  message: string;
  version?: string;
  progress?: number;
  error?: string;
}

const UpdateNotification: React.FC = () => {
  const [notification, setNotification] = useState<UpdateNotification>({
    show: false,
    status: null,
    message: ''
  });

  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Check for updates on mount
    checkForUpdates();

    // Listen for update status changes
    if (window.electronAPI?.onUpdateStatus) {
      window.electronAPI.onUpdateStatus((data: any) => {
        setNotification({
          show: true,
          status: data.status,
          message: data.message,
          version: data.version,
          progress: data.progress
        });
        setIsMinimized(false);

        // Auto-hide success messages after 5 seconds
        if (data.status === 'not-available') {
          setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
          }, 5000);
        }
      });
    }

    // Listen for progress updates
    if (window.electronAPI?.onUpdateProgress) {
      window.electronAPI.onUpdateProgress((data: any) => {
        setNotification(prev => ({
          ...prev,
          progress: data.percent,
          message: `Descargando: ${data.percent}%`
        }));
      });
    }
  }, []);

  const checkForUpdates = async () => {
    try {
      if (window.electronAPI?.checkForUpdates) {
        const result = await window.electronAPI.checkForUpdates();
        if (result.updateAvailable) {
          setNotification({
            show: true,
            status: 'available',
            message: `Actualización disponible: v${result.version}`,
            version: result.version
          });
        }
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const handleDownload = async () => {
    try {
      if (window.electronAPI?.downloadUpdate) {
        await window.electronAPI.downloadUpdate();
        setNotification(prev => ({
          ...prev,
          status: 'downloading',
          message: 'Descargando actualización...'
        }));
      }
    } catch (error) {
      setNotification({
        show: true,
        status: 'error',
        message: `Error: ${error}`,
        error: error as string
      });
    }
  };

  const handleInstall = async () => {
    try {
      if (window.electronAPI?.installUpdate) {
        await window.electronAPI.installUpdate();
      }
    } catch (error) {
      console.error('Error installing update:', error);
    }
  };

  const handleClose = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!notification.show || isMinimized) {
    if (isMinimized && notification.show && notification.status === 'downloaded') {
      return (
        <button
          onClick={handleMinimize}
          className="fixed bottom-4 right-4 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50 animate-pulse"
          title="Click para ver detalles"
        >
          <CheckCircle size={18} />
          <span className="text-sm font-medium">Actualización lista</span>
        </button>
      );
    }
    return null;
  }

  const statusConfig = {
    checking: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: RefreshCw,
      iconColor: 'text-blue-600',
      title: 'Buscando actualizaciones...'
    },
    available: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: Download,
      iconColor: 'text-orange-600',
      title: 'Actualización disponible'
    },
    downloading: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: Download,
      iconColor: 'text-blue-600',
      title: 'Descargando'
    },
    downloaded: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: CheckCircle,
      iconColor: 'text-green-600',
      title: 'Actualización descargada'
    },
    'not-available': {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      icon: CheckCircle,
      iconColor: 'text-gray-600',
      title: 'Sistema actualizado'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: AlertCircle,
      iconColor: 'text-red-600',
      title: 'Error en actualización'
    }
  };

  const config = statusConfig[notification.status] || statusConfig.checking;
  const IconComponent = config.icon;

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-sm ${config.bg} border ${config.border} rounded-lg shadow-xl p-4 z-50 animate-slide-in`}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={`${config.iconColor} flex-shrink-0 mt-1 ${notification.status === 'checking' ? 'animate-spin' : ''}`} size={20} />
        
        <div className="flex-1">
          <h3 className={`font-bold ${config.iconColor}`}>{config.title}</h3>
          <p className="text-sm text-gray-700 mt-1">{notification.message}</p>

          {/* Progress Bar */}
          {notification.progress !== undefined && (
            <div className="mt-3 bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${notification.progress}%` }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-3 flex gap-2">
            {notification.status === 'available' && (
              <>
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium text-sm py-2 rounded transition-colors"
                >
                  Descargar
                </button>
                <button
                  onClick={handleClose}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
                >
                  Más tarde
                </button>
              </>
            )}

            {notification.status === 'downloaded' && (
              <>
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium text-sm py-2 rounded transition-colors"
                >
                  Instalar ahora
                </button>
                <button
                  onClick={handleMinimize}
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 font-medium text-sm"
                >
                  Minimizar
                </button>
              </>
            )}

            {notification.status === 'error' && (
              <button
                onClick={handleClose}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium text-sm py-2 rounded transition-colors"
              >
                Cerrar
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          <X size={18} />
        </button>
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default UpdateNotification;
