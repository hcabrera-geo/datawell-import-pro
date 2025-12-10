import React, { useState, useEffect } from 'react';
import { getUsers, saveUser, deleteUser } from '../services/dataService';
import { User } from '../types';
import { Trash2, UserPlus, Shield, User as UserIcon } from 'lucide-react';

const UsersManagement: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'technician'>('technician');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
        const data = await getUsers();
        setUsers(data);
    } catch (e) {
        console.error(e);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (!username || !password) {
          setError('Todos los campos son obligatorios');
          return;
      }

      try {
          await saveUser({ username, password, role });
          setUsername('');
          setPassword('');
          loadUsers();
      } catch (err: any) {
          setError(err.message || 'Error al crear usuario');
      }
  };

  const handleDelete = async (id: string, username: string) => {
      if (username === 'admin') {
          alert("No se puede eliminar el usuario principal 'admin'.");
          return;
      }
      if (confirm(`¿Eliminar usuario ${username}?`)) {
          try {
              await deleteUser(id);
              loadUsers();
          } catch (e: any) {
              alert("Error al borrar usuario: " + e.message);
          }
      }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-[#1B4079] mb-6">Gestión de Usuarios</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Create User Form */}
          <div className="bg-white p-6 rounded-lg shadow-md h-fit">
              <h3 className="text-lg font-bold text-[#4D7C8A] mb-4 flex items-center">
                  <UserPlus size={20} className="mr-2"/> Nuevo Usuario
              </h3>
              <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                      <label className="block text-sm text-gray-600 mb-1">Nombre de Usuario</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-[#4D7C8A]"
                        placeholder="ej. operador1"
                      />
                  </div>
                  <div>
                      <label className="block text-sm text-gray-600 mb-1">Contraseña</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full border p-2 rounded outline-none focus:ring-2 focus:ring-[#4D7C8A]"
                        placeholder="****"
                      />
                  </div>
                  <div>
                      <label className="block text-sm text-gray-600 mb-1">Rol</label>
                      <select 
                        value={role}
                        onChange={e => setRole(e.target.value as any)}
                        className="w-full border p-2 rounded outline-none"
                      >
                          <option value="technician">Técnico (Solo Carga)</option>
                          <option value="admin">Administrador (Total)</option>
                      </select>
                  </div>
                  
                  {error && <p className="text-red-500 text-sm">{error}</p>}

                  <button 
                    type="submit"
                    className="w-full bg-[#1B4079] text-white py-2 rounded font-bold hover:bg-[#4D7C8A] transition-colors"
                  >
                      Crear Usuario
                  </button>
              </form>
          </div>

          {/* User List */}
          <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <table className="w-full text-left">
                      <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
                          <tr>
                              <th className="p-4">Usuario</th>
                              <th className="p-4">Rol</th>
                              <th className="p-4 text-right">Acciones</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                          {users.map(u => (
                              <tr key={u.id} className="hover:bg-gray-50">
                                  <td className="p-4 font-medium text-gray-800 flex items-center">
                                      <div className={`p-2 rounded-full mr-3 ${u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                          {u.role === 'admin' ? <Shield size={16}/> : <UserIcon size={16}/>}
                                      </div>
                                      {u.username}
                                  </td>
                                  <td className="p-4">
                                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                          {u.role === 'admin' ? 'Administrador' : 'Técnico'}
                                      </span>
                                  </td>
                                  <td className="p-4 text-right">
                                      <button 
                                        onClick={() => handleDelete(u.id, u.username)}
                                        className="text-gray-400 hover:text-red-500 p-2"
                                        title="Eliminar usuario"
                                      >
                                          <Trash2 size={18}/>
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {users.length === 0 && !loading && (
                              <tr><td colSpan={3} className="p-8 text-center text-gray-400">No hay usuarios extra creados.</td></tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

      </div>
    </div>
  );
};

export default UsersManagement;