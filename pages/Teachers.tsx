
import React, { useState } from 'react';
import { useApp } from '../store';
import { Teacher } from '../types';
import { Plus, Trash2, Edit2, Upload, Save, X } from 'lucide-react';
import { CLASS_LIST } from '../constants';

const Teachers: React.FC = () => {
  const { teachers, addTeacher, updateTeacher, deleteTeacher, triggerSave } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const initialForm: Teacher = {
    id: '', name: '', nip: '', classId: '', username: '', password: ''
  };
  const [formData, setFormData] = useState<Teacher>(initialForm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateTeacher(formData);
    } else {
      addTeacher({ ...formData, id: Date.now().toString() });
    }
    triggerSave();
    setShowModal(false);
    setFormData(initialForm);
  };

  const handleEdit = (t: Teacher) => {
    setFormData(t);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Yakin ingin menghapus data guru ini?')) {
      deleteTeacher(id);
      triggerSave();
    }
  };

  const handleImport = () => {
    // Format: Name \t NIP \t ClassId
    const lines = importText.trim().split('\n');
    let count = 0;
    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        addTeacher({
          id: Date.now().toString() + Math.random(),
          name: parts[0],
          nip: parts[1],
          classId: parts[2] || '',
          username: '',
          password: ''
        });
        count++;
      }
    });
    alert(`Berhasil mengimport ${count} data guru.`);
    triggerSave();
    setImportText('');
    setShowImport(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Data Guru & Wali Kelas</h1>
          <p className="text-sm text-gray-500">Kelola data pengajar dan wali kelas</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setFormData(initialForm); setIsEditing(false); setShowModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
          >
            <Plus size={16} /> Tambah Guru
          </button>
          <button 
            onClick={() => setShowImport(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700"
          >
            <Upload size={16} /> Import Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Nama Guru</th>
              <th className="p-4">NIP</th>
              <th className="p-4">Wali Kelas</th>
              <th className="p-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {teachers.filter(t => t.id !== 'admin').map((t, idx) => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{t.name}</td>
                <td className="p-4 text-gray-600">{t.nip}</td>
                <td className="p-4">
                  {t.classId ? (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                      Kelas {t.classId}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-4">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleEdit(t)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-full">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-full">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {teachers.filter(t => t.id !== 'admin').length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">Belum ada data guru.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{isEditing ? 'Edit Guru' : 'Tambah Guru'}</h3>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
                <input 
                  type="text" required 
                  className="w-full border p-2 rounded-lg"
                  value={formData.nip}
                  onChange={e => setFormData({...formData, nip: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wali Kelas (Opsional)</label>
                <select 
                  className="w-full border p-2 rounded-lg bg-white"
                  value={formData.classId || ''}
                  onChange={e => setFormData({...formData, classId: e.target.value})}
                >
                  <option value="">-- Bukan Wali Kelas --</option>
                  {CLASS_LIST.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 mt-4">
                Simpan Data
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
              <h3 className="text-lg font-bold">Import dari Excel</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Copy kolom: <strong>Nama</strong>, <strong>NIP</strong>, dan <strong>Kelas (Angka/Kosong)</strong> dari Excel.
            </p>
            <textarea 
              className="w-full h-40 border p-2 rounded text-sm font-mono mb-4" 
              placeholder={"Budi Santoso\t19800101...\t1\nSiti Aminah\t19850202...\t"}
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

export default Teachers;
