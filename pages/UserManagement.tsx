import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { getUsers, saveUser, deleteUser } from '../services/storageService';
import { Trash2, Edit, Plus, Loader, AlertTriangle } from 'lucide-react';

interface Props { user: User; }

const UserManagement: React.FC<Props> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Dialog State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Default form state
  const defaultForm: User = { 
      id: '', 
      username: '', 
      password: '', 
      name: '', 
      role: Role.TEACHER, 
      classGrade: '1' 
  };
  
  const [form, setForm] = useState<User>(defaultForm);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setProcessing(true);
      
      const userToSave: User = {
          ...form,
          id: form.id || Date.now().toString(),
          classGrade: form.role === Role.TEACHER ? (form.classGrade || '1') : undefined
      };

      await saveUser(userToSave);
      
      // Update UI Local (Optimistic)
      setUsers(prev => {
          const idx = prev.findIndex(u => u.id === userToSave.id);
          if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = userToSave;
              return copy;
          }
          return [...prev, userToSave];
      });

      setIsModalOpen(false);
      setProcessing(false);
  };

  const handleDeleteClick = (id: string) => {
    if(id === user.id) {
        setNotification("Tidak bisa menghapus akun sendiri yang sedang login.");
        setTimeout(() => setNotification(null), 3000);
        return;
    }
    setDeleteId(id);
  };

  const confirmDelete = async () => {
      if(deleteId) {
          setProcessing(true);
          await deleteUser(deleteId);
          setUsers(prev => prev.filter(u => u.id !== deleteId));
          setDeleteId(null);
          setProcessing(false);
      }
  };

  const handleEdit = (u: User) => {
      setForm({
          ...u,
          classGrade: u.classGrade || '1'
      });
      setIsModalOpen(true);
  };

  if (user.role !== Role.ADMIN) return <div>Access Denied</div>;

  return (
    <div className="space-y-6 relative">
        {notification && (
            <div className="fixed top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded shadow-lg z-[100] flex items-center gap-2 animate-bounce">
                <AlertTriangle size={16} /> {notification}
            </div>
        )}

        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Manajemen User (Guru/Admin)</h2>
            <button onClick={() => { setForm(defaultForm); setIsModalOpen(true); }} className="bg-senja-600 text-white px-4 py-2 rounded hover:bg-senja-700 flex items-center gap-2">
                <Plus size={18} /> Tambah User
            </button>
        </div>

        {loading ? (
             <div className="p-10 text-center text-gray-500"><Loader className="animate-spin inline mr-2"/> Memuat data user...</div>
        ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="p-4">Username</th>
                            <th className="p-4">Nama</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Kelas Ampu</th>
                            <th className="p-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.map(u => (
                            <tr key={u.id}>
                                <td className="p-4">{u.username}</td>
                                <td className="p-4">{u.name}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === Role.ADMIN ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {u.role === Role.ADMIN ? 'ADMIN' : 'WALI KELAS'}
                                    </span>
                                </td>
                                <td className="p-4">{u.role === Role.TEACHER ? `Kelas ${u.classGrade}` : '-'}</td>
                                <td className="p-4 text-right">
                                    <button onClick={() => handleEdit(u)} disabled={processing} className="text-blue-600 mr-2 hover:text-blue-800"><Edit size={18}/></button>
                                    <button onClick={() => handleDeleteClick(u.id)} disabled={processing} className="text-red-600 hover:text-red-800"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                <div className="bg-white p-6 rounded-lg w-full max-w-sm text-center">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Hapus User?</h3>
                    <p className="text-gray-500 mb-6">User yang dihapus tidak bisa dikembalikan.</p>
                    <div className="flex gap-2">
                        <button onClick={() => setDeleteId(null)} className="flex-1 py-2 bg-gray-100 rounded hover:bg-gray-200">Batal</button>
                        <button onClick={confirmDelete} disabled={processing} className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700">Hapus</button>
                    </div>
                </div>
            </div>
        )}

        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                    <h3 className="text-xl font-bold mb-4">{form.id ? 'Edit User' : 'Tambah User'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium">Username</label>
                            <input required value={form.username} onChange={e => setForm({...form, username: e.target.value})} className="w-full border p-2 rounded" placeholder="Contoh: guru1" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Password</label>
                            <input required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border p-2 rounded" type="text" placeholder="Password login" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Nama Lengkap</label>
                            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" placeholder="Nama Guru/Admin" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium">Role</label>
                            <select 
                                value={form.role} 
                                onChange={e => {
                                    const newRole = e.target.value as Role;
                                    setForm(prev => ({
                                        ...prev, 
                                        role: newRole,
                                        classGrade: newRole === Role.TEACHER ? (prev.classGrade || '1') : undefined
                                    }));
                                }} 
                                className="w-full border p-2 rounded"
                            >
                                <option value={Role.TEACHER}>Wali Kelas</option>
                                <option value={Role.ADMIN}>Admin</option>
                            </select>
                        </div>
                        
                        {form.role === Role.TEACHER && (
                            <div>
                                <label className="block text-sm font-medium">Wali Kelas Untuk:</label>
                                <select 
                                    value={form.classGrade || '1'} 
                                    onChange={e => setForm({...form, classGrade: e.target.value})} 
                                    className="w-full border p-2 rounded bg-blue-50"
                                >
                                    {[1,2,3,4,5,6].map(c => <option key={c} value={String(c)}>Kelas {c}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-end gap-2 mt-6">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Batal</button>
                            <button type="submit" disabled={processing} className="px-4 py-2 bg-senja-600 text-white rounded hover:bg-senja-700 flex items-center gap-2">
                                {processing && <Loader className="animate-spin" size={16} />} Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default UserManagement;