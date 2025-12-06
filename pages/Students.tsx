
import React, { useState } from 'react';
import { useApp } from '../store';
import { Student, UserRole, AlumniReason } from '../types';
import { Plus, Trash2, Edit2, Upload, ExternalLink, ArrowRight, TrendingUp, UserMinus, X, Check } from 'lucide-react';
import { CLASS_LIST } from '../constants';

const Students: React.FC = () => {
  const { students, addStudent, updateStudent, deleteStudent, moveToAlumni, promoteStudent, currentUser, triggerSave } = useApp();
  
  // UI States
  const [showFormModal, setShowFormModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [showAlumniModal, setShowAlumniModal] = useState(false);
  
  // Data States
  const [importText, setImportText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form Data for Add/Edit
  const initialFormState: Student = {
    id: '', nisn: '', name: '', gender: 'L', classId: '1', isActive: true, parentPhone: ''
  };
  const [formData, setFormData] = useState<Student>(initialFormState);

  // Form Data for Status Changes
  const [alumniData, setAlumniData] = useState({ reason: AlumniReason.PINDAH, date: new Date().toISOString().split('T')[0] });
  const [promoteTargetClass, setPromoteTargetClass] = useState('');

  // Filters
  const [filterClass, setFilterClass] = useState(currentUser?.classId || '1');

  // SORTING LOGIC: Class (Numeric) -> Name (Alphabetical)
  const filteredStudents = students
    .filter(s => s.isActive && (currentUser?.role === UserRole.WALI_KELAS ? s.classId === currentUser.classId : s.classId === filterClass))
    .sort((a, b) => {
      // Sort by Class first (Numeric safe)
      const classCompare = a.classId.localeCompare(b.classId, undefined, { numeric: true });
      if (classCompare !== 0) return classCompare;
      // Then by Name
      return a.name.localeCompare(b.name);
    });

  // --- CRUD HANDLERS ---

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateStudent(formData);
    } else {
      addStudent({ ...formData, id: Date.now().toString() });
    }
    triggerSave();
    setShowFormModal(false);
  };

  const handleImport = () => {
    // Robust split handling for Windows (\r\n) and Unix (\n)
    const lines = importText.trim().split(/\r?\n/);
    let count = 0;
    
    lines.forEach((line, index) => {
      // Split by tab
      const parts = line.split('\t');
      // Must have at least Name and NISN
      if (parts.length >= 2 && parts[0].trim()) {
        const name = parts[0].trim();
        const nisn = parts[1].trim();
        const gender = (parts[2]?.trim().toUpperCase() === 'P') ? 'P' : 'L';
        const phone = parts[3]?.trim() || '';

        addStudent({
          // Create unique ID for each iteration
          id: `${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
          name: name,
          nisn: nisn,
          gender: gender,
          classId: filterClass,
          parentPhone: phone,
          isActive: true
        });
        count++;
      }
    });

    if (count > 0) {
      setImportText('');
      setShowImport(false);
      // Only trigger save once after loop finishes
      // Because we fixed store.tsx to use functional updates, 
      // all students will be in the state when this triggers.
      triggerSave();
      alert(`Berhasil import ${count} data siswa.`);
    } else {
      alert("Tidak ada data valid yang ditemukan. Pastikan format: Nama [Tab] NISN [Tab] L/P [Tab] No.WA");
    }
  };

  const handleDelete = (id: string) => {
    if(window.confirm('Hapus data siswa ini secara permanen?')) {
        deleteStudent(id);
        triggerSave();
    }
  };

  // --- PROMOTE / NAIK KELAS HANDLERS ---

  const openPromoteModal = (s: Student) => {
    setSelectedStudent(s);
    // Auto suggest next class
    const currentClassNum = parseInt(s.classId);
    if (currentClassNum < 6) {
      setPromoteTargetClass((currentClassNum + 1).toString());
    } else {
      setPromoteTargetClass('LULUS');
    }
    setShowPromoteModal(true);
  };

  const handlePromoteProcess = () => {
    if (!selectedStudent) return;
    
    if (promoteTargetClass === 'LULUS') {
      // If choosing Lulus, redirect logic to Alumni move
      moveToAlumni(selectedStudent.id, AlumniReason.TAMAT, new Date().toISOString().split('T')[0]);
    } else {
      // Regular promotion
      promoteStudent(selectedStudent.id, promoteTargetClass, ''); 
    }
    
    triggerSave();
    setShowPromoteModal(false);
    setSelectedStudent(null);
  };

  // --- ALUMNI / STATUS KELUAR HANDLERS ---

  const openAlumniModal = (s: Student) => {
    setSelectedStudent(s);
    setAlumniData({ reason: AlumniReason.PINDAH, date: new Date().toISOString().split('T')[0] });
    setShowAlumniModal(true);
  };

  const handleAlumniProcess = () => {
    if (!selectedStudent) return;
    moveToAlumni(selectedStudent.id, alumniData.reason as AlumniReason, alumniData.date);
    triggerSave();
    setShowAlumniModal(false);
    setSelectedStudent(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Data Siswa</h1>
          <p className="text-sm text-gray-500">Manajemen Siswa, Kenaikan Kelas, dan Mutasi</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
           {currentUser?.role === UserRole.ADMIN && (
             <select 
               value={filterClass} 
               onChange={e => setFilterClass(e.target.value)}
               className="border p-2 rounded-lg bg-white shadow-sm"
             >
               {CLASS_LIST.map(c => <option key={c} value={c}>Kelas {c}</option>)}
             </select>
           )}
           <button 
             onClick={() => { setFormData(initialFormState); setIsEditing(false); setShowFormModal(true); }}
             className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-blue-700 shadow-sm"
           >
             <Plus size={16} /> Tambah
           </button>
           <button 
             onClick={() => setShowImport(true)}
             className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-green-700 shadow-sm"
           >
             <Upload size={16} /> Import Excel
           </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b text-gray-600 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4">NISN</th>
                <th className="p-4">Nama Siswa</th>
                <th className="p-4">L/P</th>
                <th className="p-4">Kelas</th>
                <th className="p-4">No. WA Ortu</th>
                <th className="p-4 text-center">Aksi / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {filteredStudents.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono text-gray-500">{s.nisn}</td>
                  <td className="p-4 font-medium text-gray-800">{s.name}</td>
                  <td className="p-4">{s.gender}</td>
                  <td className="p-4"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-bold">{s.classId}</span></td>
                  <td className="p-4 text-gray-500">{s.parentPhone || '-'}</td>
                  <td className="p-4">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={() => { setFormData(s); setIsEditing(true); setShowFormModal(true); }} 
                        className="bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-600 p-2 rounded-lg transition-colors"
                        title="Edit Data"
                      >
                        <Edit2 size={16} />
                      </button>
                      
                      <button 
                        onClick={() => openPromoteModal(s)} 
                        className="bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 p-2 rounded-lg transition-colors"
                        title="Naik Kelas / Lulus"
                      >
                        <TrendingUp size={16} />
                      </button>

                      <button 
                        onClick={() => openAlumniModal(s)} 
                        className="bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600 p-2 rounded-lg transition-colors"
                        title="Pindah / Drop Out / Meninggal"
                      >
                        <UserMinus size={16} />
                      </button>

                      <button 
                        onClick={() => handleDelete(s.id)} 
                        className="bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 p-2 rounded-lg transition-colors"
                        title="Hapus Permanen"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    Tidak ada data siswa aktif di kelas ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL ADD/EDIT SISWA --- */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">{isEditing ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
              <button onClick={() => setShowFormModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
                <input type="text" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required value={formData.nisn} onChange={e => setFormData({...formData, nisn: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                <input type="text" className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kelamin</label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 border px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="gender" checked={formData.gender === 'L'} onChange={() => setFormData({...formData, gender: 'L'})} /> 
                    <span>Laki-laki</span>
                  </label>
                  <label className="flex items-center gap-2 border px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="gender" checked={formData.gender === 'P'} onChange={() => setFormData({...formData, gender: 'P'})} /> 
                    <span>Perempuan</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. WA Orang Tua</label>
                <input type="text" placeholder="628..." className="w-full border p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} />
                <p className="text-xs text-gray-400 mt-1">Gunakan format 628xxx agar fitur notifikasi berfungsi.</p>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowFormModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL NAIK KELAS --- */}
      {showPromoteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="text-green-600" size={20}/> Kenaikan Kelas
              </h3>
              <button onClick={() => setShowPromoteModal(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            
            <p className="text-gray-600 mb-4 text-sm">
              Proses kenaikan kelas untuk siswa: <br/>
              <strong className="text-gray-900 text-lg">{selectedStudent.name}</strong> <br/>
              Saat ini: <span className="bg-gray-100 px-2 py-0.5 rounded text-xs">Kelas {selectedStudent.classId}</span>
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Tujuan:</label>
              <select 
                value={promoteTargetClass}
                onChange={e => setPromoteTargetClass(e.target.value)}
                className="w-full border p-3 rounded-lg bg-blue-50 border-blue-200 text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CLASS_LIST.map(c => (
                  <option key={c} value={c}>Naik ke Kelas {c}</option>
                ))}
                <option value="LULUS">🎓 Lulus / Tamat Sekolah</option>
              </select>
            </div>

            <button 
              onClick={handlePromoteProcess}
              className="w-full bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 shadow-lg shadow-green-500/30 flex justify-center items-center gap-2 font-medium"
            >
              <Check size={18} /> Proses Kenaikan
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL STATUS KELUAR / ALUMNI --- */}
      {showAlumniModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <UserMinus className="text-orange-600" size={20}/> Update Status Siswa
              </h3>
              <button onClick={() => setShowAlumniModal(false)}><X size={20} className="text-gray-400"/></button>
            </div>
            
            <p className="text-gray-600 mb-4 text-sm">
              Ubah status siswa menjadi tidak aktif: <br/>
              <strong className="text-gray-900 text-lg">{selectedStudent.name}</strong>
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Keluar</label>
                <select 
                  value={alumniData.reason}
                  onChange={e => setAlumniData({...alumniData, reason: e.target.value as AlumniReason})}
                  className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value={AlumniReason.PINDAH}>Pindah Sekolah</option>
                  <option value={AlumniReason.DROPOUT}>Drop Out (DO)</option>
                  <option value={AlumniReason.MENINGGAL}>Meninggal Dunia</option>
                  <option value={AlumniReason.TAMAT}>Tamat / Lulus</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Kejadian</label>
                <input 
                  type="date" 
                  value={alumniData.date}
                  onChange={e => setAlumniData({...alumniData, date: e.target.value})}
                  className="w-full border p-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <button 
              onClick={handleAlumniProcess}
              className="w-full bg-orange-600 text-white py-2.5 rounded-lg hover:bg-orange-700 shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2 font-medium"
            >
              <Check size={18} /> Simpan Status
            </button>
          </div>
        </div>
      )}

      {/* --- IMPORT MODAL --- */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold mb-2">Copy dari Excel</h3>
            <p className="text-sm text-gray-500 mb-4">
              Copy kolom: <strong>Nama</strong>, <strong>NISN</strong>, <strong>L/P</strong>, <strong>No WA</strong> dari Excel dan paste di bawah ini.
            </p>
            <textarea 
              className="w-full h-40 border p-2 rounded text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder={"Andi\t001\tL\t62812...\nBudi\t002\tP\t62813..."}
              value={importText}
              onChange={e => setImportText(e.target.value)}
            />
            <div className="flex justify-end gap-2 mt-4">
               <button onClick={() => setShowImport(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
               <button onClick={handleImport} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Proses Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
