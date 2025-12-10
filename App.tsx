import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import UpdateNotification from './components/UpdateNotification';
import LoadingScreen from './components/LoadingScreen';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Wells from './pages/Wells';
import Rules from './pages/Rules';
import Import from './pages/Import';
import Averages from './pages/Averages';
import Reports from './pages/Reports';
import Config from './pages/Config';
import DatabaseManagement from './pages/DatabaseManagement';
import UsersManagement from './pages/UsersManagement';
import { User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time (database initialization, etc.)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 seconds loading screen

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'averages': return <Averages />;
      case 'import': return <Import />;
      case 'rules': return <Rules />;
      case 'wells': return <Wells />;
      // Route all report sub-types to the Reports component with a prop
      case 'reports': 
      case 'reports-daily': return <Reports viewMode="daily" />;
      case 'reports-weekly': return <Reports viewMode="weekly" />;
      case 'reports-monthly': return <Reports viewMode="monthly" />;
      
      case 'database': return <DatabaseManagement />;
      case 'settings': return <Config />;
      case 'users': return <UsersManagement />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 ml-64 overflow-auto">
        {renderContent()}
      </main>
      <UpdateNotification />
    </div>
  );
}

export default App;