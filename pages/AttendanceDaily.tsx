
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { UserRole, AttendanceStatus, AttendanceRecord, Student } from '../types';
import { Save, MessageCircle, Share2, Send, X, CheckCircle, Smartphone, CalendarOff, Upload, RotateCcw } from 'lucide-react';
import { CLASS_LIST } from '../constants';

const AttendanceDaily: React.FC = () => {
  const { students, attendance, holidays, markAttendance, currentUser, academicYears, triggerSave } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState(currentUser?.classId || '1');
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});
  
  // Bulk Send Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [sentStatus, setSentStatus] = useState<Record<string, boolean>>({});

  // Import Excel State
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const activeYear = academicYears.find(y => y.isActive);

  // --- LOGIKA TANGGAL & LIBUR ---
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.trim().split('T')[0];
  };

  const isWeekend = (dateStr: string) => {
    if (!dateStr) return false;
    const cleanDate = normalizeDate(dateStr);
    const parts = cleanDate.split('-').map(Number); 
    // Fix: Use Noon to prevent timezone shift bugs
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const day = dateObj.getDay();
    return day === 0 || day === 6; 
  };

  const getHoliday = (dateStr: string) => {
    if (!dateStr) return undefined;
    const targetDate = normalizeDate(dateStr);
    return holidays.find(h => {
        const holidayDate = normalizeDate(h.date);
        return holidayDate === targetDate;
    });
  };

  const currentHoliday = getHoliday(selectedDate);
  const isWeekendDay = isWeekend(selectedDate);
  const isDayOff = isWeekendDay || !!currentHoliday;

  // --- FILTER & SORT ---
  const filteredStudents = students
    .filter(s => (selectedClass === 'ALL' ? true : s.classId === selectedClass) && s.isActive)
    .sort((a, b) => {
      if (selectedClass === 'ALL') {
         const classCompare = a.classId.localeCompare(b.classId, undefined, { numeric: true });
         if (classCompare !== 0) return classCompare;
      }
      return a.name.localeCompare(b.name);
    });

  // --- LOAD DATA AWAL ---
  // Gunakan useEffect ini HANYA jika tanggal atau kelas berubah
  // Jangan masukkan localAttendance ke dependency agar tidak infinite loop
  useEffect(() => {
    const existing: Record<string, AttendanceStatus> = {};
    
    filteredStudents.forEach(s => {
      const record = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
      // Jika ada record di database, pakai itu. Jika tidak, biarkan undefined/kosong.
      // Kita set ke NONE hanya jika record eksplisit NONE (biasanya tidak disimpan)
      if (record) {
         existing[s.id] = record.status;
      } else {
         existing[s.id] = AttendanceStatus.NONE;
      }
    });

    setLocalAttendance(existing);
    setSentStatus({}); 
  }, [selectedDate, selectedClass, attendance, students]); 

  // --- HANDLERS ---

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    // Allow setting to NONE (Reset) even on holidays to fix mistakes
    if (isDayOff && status !== AttendanceStatus.NONE) {
      const reason = currentHoliday ? `Libur Nasional (${currentHoliday.description})` : "Akhir Pekan";
      alert(`⛔ AKSES DITOLAK\n\nTanggal ${selectedDate} adalah ${reason}.`);
      return; 
    }
    setLocalAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = () => {
    if (!activeYear) return alert("Pilih tahun pelajaran aktif di dashboard");
    
    const hasActiveAttendance = filteredStudents.some(s => {
        const st = localAttendance[s.id];
        return st && st !== AttendanceStatus.NONE;
    });

    if (isDayOff && hasActiveAttendance) {
      const msg = currentHoliday ? `Hari Libur Nasional: ${currentHoliday.description}` : "Akhir Pekan";
      return alert(`⛔ TIDAK BISA MENYIMPAN\n\nTanggal: ${selectedDate} adalah ${msg}.\nAnda hanya diperbolehkan melakukan RESET (Kosongkan) data.`);
    }
    
    const records: AttendanceRecord[] = [];
    filteredStudents.forEach(s => {
       const status = localAttendance[s.id] || AttendanceStatus.NONE;
       records.push({
          id: `${s.id}-${selectedDate}`,
          studentId: s.id,
          date: selectedDate,
          status: status as AttendanceStatus,
          academicYear: activeYear.name
       });
    });

    markAttendance(records);
    triggerSave(); 
    alert('✅ Data Tersimpan! Sinkronisasi berjalan di latar belakang.');
  };

  // --- UTILS LAINNYA ---
  const formatPhone = (phone: string | undefined) => {
    if (!phone) return '';
    let p = phone.replace(/\D/g, ''); 
    if (p.startsWith('0')) p = '62' + p.slice(1);
    else if (p.startsWith('8')) p = '62' + p;
    return p;
  };

  const sendWhatsApp = (student: Student) => {
    const status = localAttendance[student.id];
    if (!status || status === AttendanceStatus.NONE) return alert("Pilih status kehadiran dulu");
    
    const phone = formatPhone(student.parentPhone);
    if (!phone) return alert(`Nomor WA Orang Tua untuk ${student.name} belum diisi.`);

    let statusText = '';
    let emoji = '';
    
    switch (status) {
      case AttendanceStatus.HADIR: statusText = 'HADIR'; emoji = '✅'; break;
      case AttendanceStatus.SAKIT: statusText = 'SAKIT'; emoji = '😷'; break;
      case AttendanceStatus.IZIN: statusText = 'IZIN'; emoji = '📩'; break;
      case AttendanceStatus.ALPA: statusText = 'ALPA (Tanpa Keterangan)'; emoji = '❌'; break;
    }

    let message = `Yth. Wali Murid ananda *${student.name}*,\n\n`;
    message += `Diberitahukan bahwa pada hari ini ${new Date(selectedDate).toLocaleDateString('id-ID', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})}, siswa tersebut tercatat: *${statusText} ${emoji}*.\n\n`;
    message += `Terima kasih.\n_Absensi SD Negeri 5 Bilato_`;

    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    setSentStatus(prev => ({...prev, [student.id]: true}));
  };

  const handleRecapWhatsApp = () => {
    const sList = filteredStudents.filter(st => localAttendance[st.id] === AttendanceStatus.SAKIT);
    const iList = filteredStudents.filter(st => localAttendance[st.id] === AttendanceStatus.IZIN);
    const aList = filteredStudents.filter(st => localAttendance[st.id] === AttendanceStatus.ALPA);
    const hCount = filteredStudents.filter(st => localAttendance[st.id] === AttendanceStatus.HADIR).length;
    
    const dateFormatted = new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const titleClass = selectedClass === 'ALL' ? 'SEMUA KELAS' : `KELAS ${selectedClass}`;

    let text = `*LAPORAN ABSENSI ${titleClass}*\n`;
    text += `${dateFormatted}\n`;
    text += `--------------------------------\n`;

    if (sList.length > 0) {
      text += `*😷 SAKIT:*\n`;
      sList.forEach((st, idx) => text += `${idx + 1}. ${st.name} (${st.classId})\n`);
      text += `\n`;
    }
    if (iList.length > 0) {
      text += `*📩 IZIN:*\n`;
      iList.forEach((st, idx) => text += `${idx + 1}. ${st.name} (${st.classId})\n`);
      text += `\n`;
    }
    if (aList.length > 0) {
      text += `*❌ ALPA:*\n`;
      aList.forEach((st, idx) => text += `${idx + 1}. ${st.name} (${st.classId})\n`);
      text += `\n`;
    }
    text += `✅ Hadir: ${hCount} Siswa\n`;
    text += `--------------------------------\n`;
    text += `_SD Negeri 5 Bilato_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Import Handler
  const handleImport = () => {
    if (currentUser?.role !== UserRole.ADMIN) return alert("Hanya Admin.");
    if (isDayOff) return alert("Hari Libur.");

    const lines = importText.trim().split(/\r?\n/);
    let successCount = 0;
    
    setLocalAttendance(prev => {
        const updates = { ...prev };
        lines.forEach(line => {
          const parts = line.split('\t');
          if (parts.length >= 2) {
            const key = parts[0].trim();
            const statusRaw = parts[1].trim().toUpperCase();
            const student = filteredStudents.find(s => s.nisn === key || s.name.toLowerCase() === key.toLowerCase());

            if (student) {
              let status: AttendanceStatus = AttendanceStatus.NONE;
              if (['H', 'HADIR'].includes(statusRaw)) status = AttendanceStatus.HADIR;
              else if (['S', 'SAKIT'].includes(statusRaw)) status = AttendanceStatus.SAKIT;
              else if (['I', 'IZIN'].includes(statusRaw)) status = AttendanceStatus.IZIN;
              else if (['A', 'ALPA'].includes(statusRaw)) status = AttendanceStatus.ALPA;

              if (status !== AttendanceStatus.NONE) {
                updates[student.id] = status;
                successCount++;
              }
            }
          }
        });
        return updates;
    });

    if (successCount > 0) {
      alert(`Berhasil import ${successCount} data.`);
      setImportText('');
      setShowImport(false);
    } else {
      alert("Format salah atau data tidak cocok.");
    }
  };

  const absentStudents = filteredStudents.filter(s => {
    const status = localAttendance[s.id];
    return status === AttendanceStatus.SAKIT || status === AttendanceStatus.IZIN || status === AttendanceStatus.ALPA;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Absensi Harian</h1>
          <p className="text-sm text-gray-500">Input kehadiran siswa</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className={`border p-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none ${isDayOff ? 'bg-red-50 border-red-300 text-red-700 font-bold' : ''}`}
          />
          {currentUser?.role === UserRole.ADMIN ? (
             <div className="flex gap-2">
                <select 
                  value={selectedClass} 
                  onChange={e => setSelectedClass(e.target.value)}
                  className="border p-2 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="ALL">Semua Kelas</option>
                  {CLASS_LIST.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                </select>
                <button 
                  onClick={() => setShowImport(true)}
                  disabled={isDayOff}
                  className={`flex items-center space-x-2 text-white px-3 py-2 rounded-lg shadow-sm ${isDayOff ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  title="Import Excel"
                >
                  <Upload size={18} />
                </button>
             </div>
          ) : (
             <div className="px-3 py-2 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-100">
                Kelas {selectedClass}
             </div>
          )}
        </div>
      </div>

      {/* ALERT HARI LIBUR */}
      {isDayOff ? (
        <div className="bg-red-50 border-2 border-red-200 p-8 rounded-xl flex flex-col items-center justify-center text-center">
          <CalendarOff size={48} className="text-red-500 mb-2" />
          <h3 className="text-xl font-bold text-red-700">HARI LIBUR / AKHIR PEKAN</h3>
          <p className="text-red-600">
            {currentHoliday ? currentHoliday.description : "Tidak ada jadwal sekolah hari ini."}
          </p>
          <div className="mt-4 px-4 py-2 bg-white border border-red-100 rounded text-red-500 text-sm font-bold">
             ABSENSI DIKUNCI
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 border-b text-sm uppercase">
                <tr>
                  <th className="p-4 w-10">No</th>
                  <th className="p-4">Nama Siswa</th>
                  {selectedClass === 'ALL' && <th className="p-4 text-center">Kelas</th>}
                  <th className="p-4 text-center">Status Kehadiran</th>
                  <th className="p-4 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-500">{idx + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{s.name}</div>
                      <div className="text-xs text-gray-500 font-mono">{s.nisn}</div>
                    </td>
                    {selectedClass === 'ALL' && (
                       <td className="p-4 text-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold">
                             {s.classId}
                          </span>
                       </td>
                    )}
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        {/* BUTTONS */}
                        {[
                          { type: AttendanceStatus.HADIR, label: 'H', color: 'green' },
                          { type: AttendanceStatus.SAKIT, label: 'S', color: 'yellow' },
                          { type: AttendanceStatus.IZIN, label: 'I', color: 'blue' },
                          { type: AttendanceStatus.ALPA, label: 'A', color: 'red' },
                        ].map(btn => (
                           <button
                             key={btn.type}
                             onClick={() => handleStatusChange(s.id, btn.type as AttendanceStatus)}
                             disabled={isDayOff} 
                             className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-md transition-all ${
                               localAttendance[s.id] === btn.type 
                                 ? `bg-${btn.color}-600 text-white shadow-md scale-110 ring-2 ring-${btn.color}-200` 
                                 : `bg-gray-100 text-gray-400 hover:bg-${btn.color}-50 hover:text-${btn.color}-600`
                             } ${isDayOff ? 'opacity-30 cursor-not-allowed' : ''}`}
                           >
                             {btn.label}
                           </button>
                        ))}

                        <div className="w-px h-6 bg-gray-300 mx-2"></div>

                        {/* TOMBOL RESET PER SISWA */}
                        <button
                          onClick={() => handleStatusChange(s.id, AttendanceStatus.NONE)}
                          title="Batalkan / Hapus Absensi"
                          className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                             localAttendance[s.id] === AttendanceStatus.NONE || !localAttendance[s.id]
                               ? 'text-gray-300 cursor-default'
                               : 'bg-red-50 text-red-500 hover:bg-red-100 cursor-pointer shadow-sm'
                          }`}
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {localAttendance[s.id] && localAttendance[s.id] !== AttendanceStatus.NONE && (
                        <button 
                          onClick={() => sendWhatsApp(s)}
                          className={`p-2 rounded-full transition-colors ${
                            sentStatus[s.id] 
                              ? 'bg-gray-100 text-gray-400' 
                              : s.parentPhone 
                                ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                          }`}
                          disabled={!s.parentPhone}
                          title={s.parentPhone ? "Kirim WA" : "No WA Kosong"}
                        >
                          {sentStatus[s.id] ? <CheckCircle size={18} /> : <MessageCircle size={18} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* TOOLBAR BAWAH */}
          <div className="p-4 border-t bg-gray-50 sticky bottom-0 z-10 flex flex-col xl:flex-row justify-between items-center gap-4 shadow-inner">
             
            <div className="flex flex-wrap gap-2 w-full justify-end">
               
               {/* GROUP: ACTIONS */}
               <div className="flex gap-2">
                 <button 
                    onClick={() => setShowBulkModal(true)}
                    className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 shadow-md flex items-center gap-2"
                    disabled={absentStudents.length === 0}
                  >
                    <Send size={18} /> <span className="hidden sm:inline">Notifikasi ({absentStudents.length})</span>
                  </button>
                 <button 
                    onClick={handleRecapWhatsApp}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-md flex items-center gap-2"
                  >
                    <Share2 size={18} /> <span className="hidden sm:inline">Rekap</span>
                  </button>
                  <button 
                    onClick={handleSave}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center gap-2 font-bold animate-pulse-once"
                  >
                    <Save size={18} /> SIMPAN
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL & IMPORT */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Smartphone className="text-orange-500" /> Asisten Notifikasi
              </h3>
              <button onClick={() => setShowBulkModal(false)}><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {absentStudents.map((s, idx) => (
                  <div key={s.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div>
                         <p className="font-bold text-gray-800">{s.name}</p>
                         <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                           {localAttendance[s.id] === 'S' ? 'Sakit' : localAttendance[s.id] === 'I' ? 'Izin' : 'Alpa'}
                         </span>
                    </div>
                    <button onClick={() => sendWhatsApp(s)} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Kirim WA</button>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImport && currentUser?.role === UserRole.ADMIN && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
             <h3 className="font-bold text-lg mb-2">Import Absensi</h3>
             <textarea value={importText} onChange={e => setImportText(e.target.value)} className="w-full h-32 border p-2" placeholder="Paste data excel..." />
             <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => setShowImport(false)} className="px-4 py-2 text-gray-600">Batal</button>
                <button onClick={handleImport} className="px-4 py-2 bg-green-600 text-white rounded">Proses</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDaily;
