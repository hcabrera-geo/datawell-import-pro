import React from 'react';
import { Droplet } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1B4079] to-[#4D7C8A]">
      <div className="text-center">
        {/* Logo animado */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-4 border-[#CBDF90] border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="relative bg-white p-6 rounded-full shadow-2xl">
            <Droplet className="text-[#1B4079]" size={48} />
          </div>
        </div>

        {/* Texto */}
        <h1 className="text-4xl font-bold text-white mb-2">DataWell PRO</h1>
        <p className="text-[#CBDF90] text-lg">Gestión de Pozos</p>
        
        {/* Barra de progreso animada */}
        <div className="mt-8 w-64 mx-auto">
          <div className="h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#CBDF90] rounded-full transition-all duration-2000 ease-linear"
              style={{ 
                animation: 'progressBar 2s ease-in-out infinite'
              }}
            ></div>
          </div>
          <p className="text-white/70 text-sm mt-2">Cargando...</p>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 text-white/50 text-xs">
        © 2025 DataWell PRO Systems
      </div>

      {/* CSS personalizado para la animación */}
      <style>{`
        @keyframes progressBar {
          0% {
            width: 0%;
            opacity: 0.8;
          }
          50% {
            width: 100%;
            opacity: 1;
          }
          100% {
            width: 100%;
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
