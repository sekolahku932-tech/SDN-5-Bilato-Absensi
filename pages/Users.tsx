import React, { useState } from 'react';
import { useApp } from '../store';
import { Teacher } from '../types';
import { Plus, Edit, Key, Trash2, Search, X, Upload, User } from 'lucide-react';
import { CLASS_LIST } from '../constants';

const Users: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [filterClass, setFilterClass] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const initialForm: Teacher = {
    id: '', name: '', nip: '', classId: '', username: '', password: ''
  };
  const [formData, setFormData] = useState<Teacher>(initialForm);

  // Filter logic
  const filteredUsers = teachers.filter(t => {
    // Exclude hardcoded admin if you want, or include. Let's include for now but maybe disable delete.
    if (t.id === 'admin') return false; 
    
    const matchesClass = filterClass === 'ALL' || t.classId === filterClass;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateTeacher(formData);
    } else {
      addTeacher({ ...formData, id: Date.now().toString() });
    }
    setShowModal(false);
    setFormData(initialForm);
  };

  const handleEdit = (t: Teacher) => {
    setFormData(t);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Hapus user ini?')) deleteTeacher(id);
  };

  const handleImport = () => {
    // Format: Name \t Username \t Password \t Class
    const lines = importText.trim().split('\n');
    let count = 0;
    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 3) {
        addTeacher({
          id: Date.now().toString() + Math.random(),
          name: parts[0],
          nip: '-',
          username: parts[1],
          password: parts[2],
          classId: parts[3] || ''
        });
        count++;
      }
    });
    alert(`Imported ${count} users.`);
    setImportText('');
    setShowImport(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Manajemen User</h1>
          <p className="text-sm text-gray-500">Kelola akun login untuk Guru & Wali Kelas</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => { setFormData(initialForm); setIsEditing(false); setShowModal(true); }}
             className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm"
           >
             <Plus size={16} /> Tambah User
           </button>
           <button 
            onClick={() => setShowImport(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm"
          >
            <Upload size={16} /> Import Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari nama atau username..." 
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="border p-2 rounded-lg bg-gray-50 min-w-[150px]"
          value={filterClass}
          onChange={e => setFilterClass(e.target.value)}
        >
          <option value="ALL">Semua Role</option>
          {CLASS_LIST.map(c => <option key={c} value={c}>Wali Kelas {c}</option>)}
          <option value="">Guru Mapel / Staff</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div key={user.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={() => handleEdit(user)} className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100">
                 <Edit size={16} />
               </button>
               <button onClick={() => handleDelete(user.id)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100">
                 <Trash2 size={16} />
               </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${user.classId ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
                {user.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 line-clamp-1" title={user.name}>{user.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${user.classId ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                  {user.classId ? `Wali Kelas ${user.classId}` : 'Guru / Staff'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><User size={14}/> Username</span>
                <span className="font-mono bg-gray-50 px-2 py-0.5 rounded text-gray-700">{user.username || '-'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-2"><Key size={14}/> Password</span>
                <span className="font-mono bg-gray-50 px-2 py-0.5 rounded text-gray-700">{user.password ? '••••••' : '-'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{isEditing ? 'Edit User' : 'Tambah User Baru'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" required 
                  className="w-full border p-2 rounded-lg"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input 
                    type="text" required 
                    className="w-full border p-2 rounded-lg"
                    value={formData.username || ''}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input 
                    type="text" required 
                    className="w-full border p-2 rounded-lg"
                    value={formData.password || ''}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role / Wali Kelas</label>
                <select 
                  className="w-full border p-2 rounded-lg bg-white"
                  value={formData.classId || ''}
                  onChange={e => setFormData({...formData, classId: e.target.value})}
                >
                  <option value="">Guru / Staff (Bukan Wali Kelas)</option>
                  {CLASS_LIST.map(c => <option key={c} value={c}>Wali Kelas {c}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 mt-4">
                Simpan
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Import User dari Excel</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Format: <strong>Nama</strong> [Tab] <strong>Username</strong> [Tab] <strong>Password</strong> [Tab] <strong>Kelas</strong>
            </p>
            <textarea 
              className="w-full h-40 border p-2 rounded text-sm font-mono mb-4" 
              placeholder={"Guru A\tuserA\tpass123\t1\nGuru B\tuserB\tpass456\t"}
              value={importText}
              onChange={e => setImportText(e.target.value)}
            />
            <button onClick={handleImport} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
              Proses Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;