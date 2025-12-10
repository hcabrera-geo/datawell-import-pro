import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Upload, 
  Settings2, 
  Droplet, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Database,
  ChevronDown,
  ChevronRight,
  Calendar,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout }) => {
  const [expandedReports, setExpandedReports] = useState(true);

  const isAdmin = user?.role === 'admin';

  return (
    <div id="sidebar" className="h-screen w-64 bg-[#1B4079] text-white flex flex-col shadow-xl fixed left-0 top-0 z-50">
      <div className="p-6 border-b border-[#4D7C8A]">
        <h1 className="text-2xl font-bold tracking-wider">DataWell</h1>
        <p className="text-xs text-[#CBDF90] mt-1">Gestión de Pozos</p>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <SidebarItem 
            id="dashboard" icon={LayoutDashboard} label="Dashboard" 
            activeTab={activeTab} setActiveTab={setActiveTab} 
        />
        <SidebarItem 
            id="averages" icon={Activity} label="Promedios" 
            activeTab={activeTab} setActiveTab={setActiveTab} 
        />
        <SidebarItem 
            id="import" icon={Upload} label="Importar Datos" 
            activeTab={activeTab} setActiveTab={setActiveTab} 
        />
        <SidebarItem 
            id="rules" icon={Settings2} label="Reglas Import." 
            activeTab={activeTab} setActiveTab={setActiveTab} 
        />
        <SidebarItem 
            id="wells" icon={Droplet} label="Pozos" 
            activeTab={activeTab} setActiveTab={setActiveTab} 
        />

        {/* Reports Dropdown */}
        <div>
            <button
              onClick={() => setExpandedReports(!expandedReports)}
              className={`w-full flex items-center justify-between px-6 py-3 transition-colors duration-200 text-gray-300 hover:bg-[#4D7C8A]/50 hover:text-white`}
            >
              <div className="flex items-center">
                  <FileText size={20} className="mr-3" />
                  <span className="font-medium text-sm">Informes</span>
              </div>
              {expandedReports ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
            </button>
            
            {expandedReports && (
                <div className="bg-[#163565]">
                    <SidebarSubItem 
                        id="reports-daily" icon={Calendar} label="Diario" 
                        activeTab={activeTab} setActiveTab={setActiveTab} 
                    />
                    <SidebarSubItem 
                        id="reports-weekly" icon={CalendarRange} label="Semanal" 
                        activeTab={activeTab} setActiveTab={setActiveTab} 
                    />
                    <SidebarSubItem 
                        id="reports-monthly" icon={CalendarDays} label="Mensual" 
                        activeTab={activeTab} setActiveTab={setActiveTab} 
                    />
                </div>
            )}
        </div>

        {isAdmin && (
            <>
                <div className="my-2 border-t border-[#4D7C8A] opacity-50 mx-4"></div>
                <SidebarItem id="database" icon={Database} label="Base de Datos" activeTab={activeTab} setActiveTab={setActiveTab} />
                <SidebarItem id="users" icon={Users} label="Usuarios" activeTab={activeTab} setActiveTab={setActiveTab} />
                <SidebarItem id="settings" icon={Settings} label="Configuración" activeTab={activeTab} setActiveTab={setActiveTab} />
            </>
        )}
      </div>

      <div className="p-4 border-t border-[#4D7C8A]">
        <div className="mb-4 px-2">
          <p className="text-sm font-semibold">{user?.username}</p>
          <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center bg-[#ef4444] hover:bg-red-600 text-white py-2 rounded-md transition-colors text-sm"
        >
          <LogOut size={16} className="mr-2" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

const SidebarItem = ({ id, icon: Icon, label, activeTab, setActiveTab }: any) => {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center px-6 py-3 transition-colors duration-200 ${
            isActive 
                ? 'bg-[#4D7C8A] border-r-4 border-[#CBDF90] text-white' 
                : 'text-gray-300 hover:bg-[#4D7C8A]/50 hover:text-white'
            }`}
        >
            <Icon size={20} className="mr-3" />
            <span className="font-medium text-sm">{label}</span>
        </button>
    )
}

const SidebarSubItem = ({ id, icon: Icon, label, activeTab, setActiveTab }: any) => {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center pl-12 pr-6 py-2 transition-colors duration-200 text-xs ${
            isActive 
                ? 'text-[#CBDF90] font-bold' 
                : 'text-gray-400 hover:text-white'
            }`}
        >
            <Icon size={14} className="mr-3" />
            <span>{label}</span>
        </button>
    )
}

export default Sidebar;