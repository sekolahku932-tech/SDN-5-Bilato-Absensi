import React, { useState, useEffect } from 'react';
import { User, Role, Student } from '../types';
import { getStudents, saveStudent, saveStudentsBulk, deleteStudent } from '../services/storageService';
import { Trash2, Edit, Plus, Upload, Loader, X, Check } from 'lucide-react';

interface Props { user: User; }

const StudentManagement: React.FC<Props> = ({ user }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Modals & Notifications
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success'|'error'} | null>(null);

  // Form State
  const [form, setForm] = useState<Student>({ nisn: '', name: '', gender: 'L', classGrade: '1', parentName: '', parentPhone: '' });
  const [bulkText, setBulkText] = useState('');

  // Filtering
  const [filterClass, setFilterClass] = useState(user.role === Role.TEACHER ? user.classGrade : 'all');

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadStudents = async () => {
    setLoading(true);
    const data = await getStudents();
    setStudents(data);
    setLoading(false);
  };

  // Filter and Sort Students (Class Ascending -> Name Alphabetical)
  const filteredStudents = students
    .filter(s => 
      (user.role === Role.TEACHER && s.classGrade === user.classGrade) || 
      (filterClass === 'all' || s.classGrade === filterClass)
    )
    .sort((a, b) => {
      // 1. Sort by Class (Numeric aware: "10" comes after "2")
      const classCompare = a.classGrade.localeCompare(b.classGrade, undefined, { numeric: true });
      if (classCompare !== 0) return classCompare;
      
      // 2. Sort by Name (A-Z)
      return a.name.localeCompare(b.name);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    await saveStudent(form);
    
    // Optimistic Update
    setStudents(prev => {
        const idx = prev.findIndex(s => s.nisn === form.nisn);
        if (idx >= 0) {
            const copy = [...prev]; copy[idx] = form; return copy;
        }
        return [...prev, form];
    });

    setIsModalOpen(false);
    setForm({ nisn: '', name: '', gender: 'L', classGrade: '1' });
    setProcessing(false);
    setNotification({ message: 'Data siswa berhasil disimpan', type: 'success' });
  };

  const confirmDelete = async () => {
    if(deleteId) {
        setProcessing(true);
        await deleteStudent(deleteId);
        
        // Optimistic Update
        setStudents(prev => prev.filter(s => s.nisn !== deleteId));
        
        setDeleteId(null);
        setProcessing(false);
        setNotification({ message: 'Siswa berhasil dihapus', type: 'success' });
    }
  };

  const handleBulkImport = async () => {
    // Expected Format: NISN [tab] Name [tab] Gender [tab] Class
    const lines = bulkText.trim().split('\n');
    const newStudents: Student[] = [];
    
    lines.forEach(line => {
        const parts = line.split('\t');
        if (parts.length >= 2) {
            newStudents.push({
                nisn: parts[0].trim(),
                name: parts[1].trim(),
                gender: (parts[2]?.trim().toUpperCase() === 'P' ? 'P' : 'L'),
                classGrade: parts[3]?.trim() || '1',
                parentName: parts[4]?.trim() || '',
                parentPhone: parts[5]?.trim() || ''
            });
        }
    });

    if (newStudents.length > 0) {
        setProcessing(true);
        await saveStudentsBulk(newStudents);
        setBulkText('');
        setIsBulkOpen(false);
        
        // Reload mostly for bulk consistency
        const updated = await getStudents();
        setStudents(updated);
        
        setProcessing(false);
        setNotification({ message: `Berhasil impor ${newStudents.length} siswa.`, type: 'success' });
    }
  };

  // Only Admin or Teacher can access
  if (user.role === Role.STUDENT) return <div>Akses Ditolak</div>;

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded shadow-lg z-[100] text-white flex items-center gap-2 animate-bounce ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {notification.type === 'success' ? <Check size={18}/> : <X size={18}/>}
            {notification.message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Daftar Siswa</h2>
        <div className="flex gap-2">
            <button onClick={() => setIsBulkOpen(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                <Upload size={18} /> Import Excel
            </button>
            <button onClick={() => { setForm({ nisn: '', name: '', gender: 'L', classGrade: user.classGrade || '1' }); setIsModalOpen(true); }} className="flex items-center gap-2 bg-senja-600 text-white px-4 py-2 rounded hover:bg-senja-700">
                <Plus size={18} /> Tambah Siswa
            </button>
        </div>
      </div>

      {user.role === Role.ADMIN && (
          <div className="flex items-center gap-2">
              <label>Filter Kelas:</label>
              <select className="border p-2 rounded" value={filterClass} onChange={e => setFilterClass(e.target.value)}>
                  <option value="all">Semua</option>
                  {[1,2,3,4,5,6].map(c => <option key={c} value={String(c)}>Kelas {c}</option>)}
              </select>
          </div>
      )}

      {loading ? (
          <div className="p-10 text-center text-gray-500"><Loader className="animate-spin inline mr-2"/> Memuat data siswa...</div>
      ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-gray-100 border-b">
                    <tr>
                        <th className="p-4">NISN</th>
                        <th className="p-4">Nama Siswa</th>
                        <th className="p-4">L/P</th>
                        <th className="p-4">Kelas</th>
                        <th className="p-4">Orang Tua</th>
                        <th className="p-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {filteredStudents.map(student => (
                        <tr key={student.nisn} className="hover:bg-gray-50">
                            <td className="p-4 font-mono text-sm">{student.nisn}</td>
                            <td className="p-4 font-medium">{student.name}</td>
                            <td className="p-4">{student.gender}</td>
                            <td className="p-4">{student.classGrade}</td>
                            <td className="p-4 text-sm text-gray-600">
                                {student.parentName} <br/> <span className="text-xs">{student.parentPhone}</span>
                            </td>
                            <td className="p-4 text-right space-x-2">
                                <button onClick={() => { setForm(student); setIsModalOpen(true); }} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                <button onClick={() => setDeleteId(student.nisn)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                            </td>
                        </tr>
                    ))}
                    {filteredStudents.length === 0 && (
                        <tr><td colSpan={6} className="p-8 text-center text-gray-400">Belum ada data siswa.</td></tr>
                    )}
                </tbody>
            </table>
          </div>
      )}

      {/* Modal Add/Edit */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-lg">
                  <h3 className="text-xl font-bold mb-4">Data Siswa</h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium">NISN</label>
                              <input required value={form.nisn} onChange={e => setForm({...form, nisn: e.target.value})} className="w-full border p-2 rounded" />
                          </div>
                          <div>
                              <label className="block text-sm font-medium">Kelas</label>
                              <select value={form.classGrade} onChange={e => setForm({...form, classGrade: e.target.value})} className="w-full border p-2 rounded">
                                  {[1,2,3,4,5,6].map(c => <option key={c} value={String(c)}>{c}</option>)}
                              </select>
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-medium">Nama Lengkap</label>
                          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" />
                      </div>
                      <div>
                          <label className="block text-sm font-medium">Jenis Kelamin</label>
                          <select value={form.gender} onChange={e => setForm({...form, gender: e.target.value as 'L'|'P'})} className="w-full border p-2 rounded">
                              <option value="L">Laki-laki</option>
                              <option value="P">Perempuan</option>
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium">Nama Orang Tua</label>
                             <input value={form.parentName} onChange={e => setForm({...form, parentName: e.target.value})} className="w-full border p-2 rounded" />
                        </div>
                        <div>
                             <label className="block text-sm font-medium">No. HP Ortu</label>
                             <input value={form.parentPhone} onChange={e => setForm({...form, parentPhone: e.target.value})} className="w-full border p-2 rounded" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                          <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Batal</button>
                          <button type="submit" disabled={processing} className="px-4 py-2 bg-senja-600 text-white rounded hover:bg-senja-700 flex items-center gap-2">
                             {processing && <Loader className="animate-spin" size={16}/>} Simpan
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Modal Bulk Import */}
      {isBulkOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-2xl">
                  <h3 className="text-xl font-bold mb-2">Import Data Siswa dari Excel</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Copy data dari Excel dan paste di bawah ini. Pastikan urutan kolom: <br/>
                    <strong>NISN | Nama | Gender (L/P) | Kelas | Nama Ortu | HP Ortu</strong>
                  </p>
                  <textarea 
                    rows={10} 
                    className="w-full border p-2 rounded font-mono text-xs" 
                    placeholder={`12345\tBudi Santoso\tL\t1\tPak Santoso\t0812...\n67890\tSiti Aminah\tP\t1\tBu Aminah\t0813...`}
                    value={bulkText}
                    onChange={e => setBulkText(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 mt-4">
                      <button onClick={() => setIsBulkOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Batal</button>
                      <button onClick={handleBulkImport} disabled={processing} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2">
                        {processing && <Loader className="animate-spin" size={16}/>} Proses Import
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Modal Delete Confirmation */}
      {deleteId && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
              <div className="bg-white p-6 rounded-lg w-full max-w-sm">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                          <Trash2 size={24} />
                      </div>
                      <h3 className="text-lg font-bold mb-2">Hapus Siswa?</h3>
                      <p className="text-gray-500 text-sm mb-6">
                          Apakah Anda yakin ingin menghapus data siswa ini? Tindakan ini tidak dapat dibatalkan.
                      </p>
                      <div className="flex w-full gap-2">
                          <button 
                            onClick={() => setDeleteId(null)} 
                            className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded"
                          >
                              Batal
                          </button>
                          <button 
                            onClick={confirmDelete} 
                            disabled={processing} 
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex justify-center items-center gap-2"
                          >
                              {processing && <Loader className="animate-spin" size={16}/>} Hapus
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default StudentManagement;