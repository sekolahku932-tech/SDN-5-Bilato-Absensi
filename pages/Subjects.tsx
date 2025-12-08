
import React, { useState } from 'react';
import { useApp } from '../store';
import { BookOpen, Plus, Trash2, AlertTriangle, Calendar, Check, X } from 'lucide-react';
import { DAYS_OF_WEEK, CLASS_LIST } from '../constants';
import { Subject, SubjectSchedule } from '../types';

const Subjects: React.FC = () => {
  const { subjects, addSubject, updateSubject, deleteSubject, triggerSave } = useApp();
  const [newSubject, setNewSubject] = useState('');
  
  // State untuk Modal Konfirmasi Hapus
  const [subjectToDelete, setSubjectToDelete] = useState<string | null>(null);
  
  // State untuk Modal Jadwal
  const [scheduleModalSubject, setScheduleModalSubject] = useState<Subject | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.trim()) {
      addSubject({
        id: Date.now().toString(),
        name: newSubject.trim(),
        schedule: []
      });
      triggerSave();
      setNewSubject('');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    setSubjectToDelete(id); 
  };

  const confirmDelete = () => {
    if (subjectToDelete) {
      deleteSubject(subjectToDelete);
      triggerSave();
      setSubjectToDelete(null); 
    }
  };

  const handleOpenSchedule = (s: Subject) => {
    setScheduleModalSubject(JSON.parse(JSON.stringify(s))); // Deep copy
  };

  const handleToggleSchedule = (day: string, classId: string) => {
    if (!scheduleModalSubject) return;
    
    const prevSchedule = scheduleModalSubject.schedule || [];
    // Cek apakah hari ini sudah ada di jadwal
    const dayEntryIndex = prevSchedule.findIndex(sch => sch.day === day);
    
    let newSchedule = [...prevSchedule];

    if (dayEntryIndex === -1) {
      // Jika hari belum ada, tambahkan baru dengan kelas ini
      newSchedule.push({ day, classIds: [classId] });
    } else {
      // Jika hari sudah ada, cek kelasnya
      const existingClasses = newSchedule[dayEntryIndex].classIds;
      if (existingClasses.includes(classId)) {
        // Hapus kelas
        newSchedule[dayEntryIndex].classIds = existingClasses.filter(c => c !== classId);
        // Jika kelas kosong, hapus hari itu dari jadwal
        if (newSchedule[dayEntryIndex].classIds.length === 0) {
           newSchedule = newSchedule.filter(sch => sch.day !== day);
        }
      } else {
        // Tambah kelas
        newSchedule[dayEntryIndex].classIds = [...existingClasses, classId];
      }
    }
    
    setScheduleModalSubject({ ...scheduleModalSubject, schedule: newSchedule });
  };

  const saveSchedule = () => {
    if (scheduleModalSubject) {
      updateSubject(scheduleModalSubject);
      triggerSave();
      setScheduleModalSubject(null);
    }
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'Mapel ini';

  const isClassScheduled = (subject: Subject | null, day: string, classId: string) => {
     if (!subject || !subject.schedule) return false;
     const daySch = subject.schedule.find(s => s.day === day);
     return daySch ? daySch.classIds.includes(classId) : false;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm">
        <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
           <BookOpen size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-800">Data Mata Pelajaran</h1>
          <p className="text-sm text-gray-500">Kelola daftar mata pelajaran dan jadwal per kelas</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* ADD FORM */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-4">
            <h3 className="font-bold text-gray-700 mb-4">Tambah Mapel Baru</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Mata Pelajaran</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Contoh: Matematika"
                  className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2 font-medium"
              >
                <Plus size={18} /> Tambah
              </button>
            </form>
          </div>
        </div>

        {/* LIST */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 w-12 text-center">No</th>
                  <th className="p-4">Nama Mata Pelajaran</th>
                  <th className="p-4">Jadwal Aktif</th>
                  <th className="p-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {subjects.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-center text-gray-500">{idx + 1}</td>
                    <td className="p-4 font-bold text-gray-700">{s.name}</td>
                    <td className="p-4 text-xs text-gray-500">
                      {s.schedule && s.schedule.length > 0 ? (
                        s.schedule.map(sch => (
                           <div key={sch.day}>
                             <span className="font-semibold text-gray-700">{sch.day}:</span> Kelas {sch.classIds.sort().join(', ')}
                           </div>
                        ))
                      ) : (
                        <span className="italic text-gray-400">Belum diatur</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                         <button 
                           type="button"
                           onClick={() => handleOpenSchedule(s)}
                           className="p-2 rounded-full text-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                           title="Atur Jadwal"
                         >
                           <Calendar size={18} />
                         </button>
                         <button 
                           type="button"
                           onClick={(e) => handleDeleteClick(e, s.id)}
                           className="p-2 rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer"
                           title="Hapus Mapel"
                         >
                           <Trash2 size={18} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {subjects.length === 0 && (
                   <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada mata pelajaran.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SCHEDULE MODAL */}
      {scheduleModalSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 flex flex-col max-h-[90vh]">
             <div className="flex justify-between items-center mb-4 border-b pb-2">
               <div>
                  <h3 className="text-xl font-bold text-gray-800">Atur Jadwal Mapel</h3>
                  <p className="text-sm text-blue-600 font-medium">{scheduleModalSubject.name}</p>
               </div>
               <button onClick={() => setScheduleModalSubject(null)}><X size={24} className="text-gray-400"/></button>
             </div>
             
             <div className="overflow-y-auto flex-1 p-2">
                <table className="w-full border-collapse">
                   <thead>
                      <tr>
                         <th className="p-2 border-b text-left text-gray-500 text-sm">Hari</th>
                         <th className="p-2 border-b text-left text-gray-500 text-sm">Pilih Kelas yang Diajar</th>
                      </tr>
                   </thead>
                   <tbody>
                      {DAYS_OF_WEEK.map(day => (
                         <tr key={day} className="hover:bg-gray-50">
                            <td className="p-3 font-medium text-gray-700 border-b w-32">{day}</td>
                            <td className="p-3 border-b">
                               <div className="flex flex-wrap gap-2">
                                  {CLASS_LIST.map(cls => {
                                     const isActive = isClassScheduled(scheduleModalSubject, day, cls);
                                     return (
                                        <button
                                          key={cls}
                                          onClick={() => handleToggleSchedule(day, cls)}
                                          className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                                             isActive 
                                               ? 'bg-blue-600 text-white border-blue-600' 
                                               : 'bg-white text-gray-400 border-gray-200 hover:border-blue-300'
                                          }`}
                                        >
                                           Kelas {cls}
                                        </button>
                                     )
                                  })}
                               </div>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>

             <div className="mt-4 pt-4 border-t flex justify-end gap-3">
                <button onClick={() => setScheduleModalSubject(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
                <button onClick={saveSchedule} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg font-bold flex items-center gap-2">
                   <Check size={18} /> Simpan Jadwal
                </button>
             </div>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRMATION MODAL */}
      {subjectToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="bg-red-100 p-3 rounded-full text-red-600 mb-4 ring-4 ring-red-50">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Hapus Mata Pelajaran?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Apakah Anda yakin ingin menghapus <strong>"{getSubjectName(subjectToDelete)}"</strong>? 
                <br/><span className="text-xs text-red-500 mt-1 block">Data absensi terkait mapel ini akan ikut terhapus permanen.</span>
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => setSubjectToDelete(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium shadow-lg shadow-red-500/30 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
