
import React, { useState } from 'react';
import { useApp } from '../store';
import { Teacher } from '../types';
import { Plus, Edit, Key, Trash2, Search, X, Upload, User, BookOpen, CheckSquare } from 'lucide-react';
import { CLASS_LIST } from '../constants';

const Users: React.FC = () => {
  const { teachers, subjects, addTeacher, updateTeacher, deleteTeacher, triggerSave } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [filterClass, setFilterClass] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // UI State for Form Toggle
  const [roleType, setRoleType] = useState<'WALI' | 'MAPEL'>('WALI');

  const initialForm: Teacher = {
    id: '', name: '', nip: '', classId: '', accessibleClassIds: [], subjectIds: [], username: '', password: ''
  };
  const [formData, setFormData] = useState<Teacher>(initialForm);

  // Filter logic
  const filteredUsers = teachers.filter(t => {
    if (t.id === 'admin') return false; 
    
    const matchesClass = filterClass === 'ALL' || t.classId === filterClass;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesClass && matchesSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean data based on role type
    const finalData = { ...formData };
    if (roleType === 'WALI') {
        finalData.accessibleClassIds = []; // Wali kelas usually focuses on their class
        finalData.subjectIds = [];
    } else {
        finalData.classId = ''; // Guru Mapel doesn't have one specific homeroom
    }

    if (isEditing) {
      updateTeacher(finalData);
    } else {
      addTeacher({ ...finalData, id: Date.now().toString() });
    }
    triggerSave(); 
    setShowModal(false);
    setFormData(initialForm);
  };

  const handleEdit = (t: Teacher) => {
    setFormData(t);
    // Determine Role Type based on data
    if (t.classId) {
        setRoleType('WALI');
    } else {
        setRoleType('MAPEL');
    }
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Hapus user ini?')) {
        deleteTeacher(id);
        triggerSave();
    }
  };

  const handleToggleClass = (classId: string) => {
    const current = formData.accessibleClassIds || [];
    if (current.includes(classId)) {
        setFormData({ ...formData, accessibleClassIds: current.filter(c => c !== classId) });
    } else {
        setFormData({ ...formData, accessibleClassIds: [...current, classId] });
    }
  };

  const handleToggleSubject = (subjectId: string) => {
    const current = formData.subjectIds || [];
    if (current.includes(subjectId)) {
        setFormData({ ...formData, subjectIds: current.filter(s => s !== subjectId) });
    } else {
        setFormData({ ...formData, subjectIds: [...current, subjectId] });
    }
  };

  const handleImport = () => {
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
          classId: parts[3] || '',
          accessibleClassIds: [],
          subjectIds: []
        });
        count++;
      }
    });
    
    if (count > 0) {
        triggerSave();
        alert(`Berhasil import ${count} user.`);
        setImportText('');
        setShowImport(false);
    } else {
        alert("Gagal import. Pastikan format sesuai.");
    }
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Manajemen User</h1>
          <p className="text-sm text-gray-500">Kelola akun login untuk Guru & Wali Kelas</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => { setFormData(initialForm); setIsEditing(false); setRoleType('WALI'); setShowModal(true); }}
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
          <option value="">Guru Mapel</option>
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
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${user.classId ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                {user.classId ? user.name.charAt(0) : <BookOpen size={20}/>}
              </div>
              <div>
                <h3 className="font-bold text-gray-800 line-clamp-1" title={user.name}>{user.name}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${user.classId ? 'bg-indigo-50 text-indigo-700' : 'bg-orange-50 text-orange-700'}`}>
                  {user.classId ? `Wali Kelas ${user.classId}` : 'Guru Mapel'}
                </span>
                {!user.classId && user.accessibleClassIds && user.accessibleClassIds.length > 0 && (
                   <p className="text-[10px] text-gray-500 mt-1">
                      Akses: Kls {user.accessibleClassIds.sort().join(', ')}
                   </p>
                )}
                {!user.classId && user.subjectIds && user.subjectIds.length > 0 && (
                   <p className="text-[10px] text-gray-500 mt-0.5">
                      Mapel: {user.subjectIds.map(sid => getSubjectName(sid)).join(', ')}
                   </p>
                )}
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
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

              {/* TIPE AKUN TOGGLE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Akun</label>
                <div className="flex gap-2">
                   <button 
                     type="button" 
                     onClick={() => setRoleType('WALI')}
                     className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${roleType === 'WALI' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}
                   >
                     Wali Kelas
                   </button>
                   <button 
                     type="button" 
                     onClick={() => setRoleType('MAPEL')}
                     className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${roleType === 'MAPEL' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-gray-200 text-gray-600'}`}
                   >
                     Guru Mata Pelajaran
                   </button>
                </div>
              </div>

              {/* CONDITIONAL INPUTS */}
              {roleType === 'WALI' ? (
                 <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <label className="block text-sm font-bold text-indigo-800 mb-1">Pilih Kelas</label>
                    <select 
                      className="w-full border p-2 rounded bg-white"
                      value={formData.classId || ''}
                      onChange={e => setFormData({...formData, classId: e.target.value})}
                      required={roleType === 'WALI'}
                    >
                      <option value="">-- Pilih Satu Kelas --</option>
                      {CLASS_LIST.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                    </select>
                    <p className="text-xs text-indigo-600 mt-2">
                       Guru ini hanya akan bisa mengakses Absensi Harian untuk kelas yang dipilih.
                    </p>
                 </div>
              ) : (
                 <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 space-y-4">
                    
                    {/* CLASS ACCESS */}
                    <div>
                        <label className="block text-sm font-bold text-orange-800 mb-2">Akses Kelas</label>
                        <div className="grid grid-cols-3 gap-2">
                           {CLASS_LIST.map(c => (
                              <label key={c} className="flex items-center space-x-2 bg-white p-2 rounded border border-orange-200 cursor-pointer hover:bg-orange-100">
                                 <input 
                                   type="checkbox" 
                                   checked={(formData.accessibleClassIds || []).includes(c)}
                                   onChange={() => handleToggleClass(c)}
                                   className="rounded text-orange-600 focus:ring-orange-500"
                                 />
                                 <span className="text-sm font-medium text-gray-700">Kelas {c}</span>
                              </label>
                           ))}
                        </div>
                    </div>

                    {/* SUBJECT ASSIGNMENT */}
                    <div>
                        <label className="block text-sm font-bold text-orange-800 mb-2">Pilih Mata Pelajaran</label>
                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                           {subjects.map(s => (
                              <label key={s.id} className="flex items-center space-x-2 bg-white p-2 rounded border border-orange-200 cursor-pointer hover:bg-orange-100">
                                 <input 
                                   type="checkbox" 
                                   checked={(formData.subjectIds || []).includes(s.id)}
                                   onChange={() => handleToggleSubject(s.id)}
                                   className="rounded text-orange-600 focus:ring-orange-500"
                                 />
                                 <span className="text-sm font-medium text-gray-700 truncate" title={s.name}>{s.name}</span>
                              </label>
                           ))}
                        </div>
                        {subjects.length === 0 && <p className="text-xs text-gray-400 italic">Belum ada data mapel.</p>}
                    </div>

                    <p className="text-xs text-orange-600 mt-2">
                       Guru ini bisa melakukan <strong>Absensi Mapel</strong> di kelas dan mata pelajaran yang dicentang.
                    </p>
                 </div>
              )}

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
