import React, { useState } from 'react';
import { User } from '../types';
import { Droplet, Loader2 } from 'lucide-react';
import { authenticateUser } from '../services/dataService';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await authenticateUser(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Credenciales inválidas o usuario no encontrado.');
      }
    } catch (err) {
      setError('Ocurrió un error al intentar iniciar sesión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B4079]">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-96 border-t-4 border-[#CBDF90]">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-[#4D7C8A] p-3 rounded-full mb-3">
            <Droplet className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#1B4079]">DataWell Login</h1>
          <p className="text-gray-500 text-sm">Acceso al sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#4D7C8A] outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ingrese su usuario"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-[#4D7C8A] outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              disabled={loading}
            />
          </div>
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1B4079] text-white py-2 rounded hover:bg-[#4D7C8A] transition-colors font-bold flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Ingresar'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-xs text-gray-400">
           DataWell PRO Systems v1.0.6
        </div>
      </div>
    </div>
  );
};

export default Login;