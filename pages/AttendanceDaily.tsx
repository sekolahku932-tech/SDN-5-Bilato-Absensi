
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { UserRole, AttendanceStatus, AttendanceRecord, Student } from '../types';
import { Save, MessageCircle, AlertCircle, Share2, Send, X, CheckCircle, Smartphone, CalendarOff, Upload } from 'lucide-react';

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

  // --- LOGIKA PENGECEKAN TANGGAL YANG SUPER KETAT ---
  
  // 1. Normalisasi Tanggal ke YYYY-MM-DD untuk memastikan perbandingan string 100% akurat
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.trim().split('T')[0]; // Ambil YYYY-MM-DD saja, buang jam jika ada
  };

  // 2. Cek Weekend dengan konstruksi tanggal manual (Hindari Bug Timezone)
  const isWeekend = (dateStr: string) => {
    if (!dateStr) return false;
    const cleanDate = normalizeDate(dateStr);
    const parts = cleanDate.split('-').map(Number); // [2024, 5, 20]
    // FIX: Tambahkan jam 12:00:00 (Noon) untuk mencegah pergeseran tanggal akibat timezone
    // new Date(Year, MonthIndex, Day, Hour, Minute, Second)
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    const day = dateObj.getDay();
    return day === 0 || day === 6; // 0=Minggu, 6=Sabtu
  };

  // 3. Cek Hari Libur dengan pencocokan String Exact
  const getHoliday = (dateStr: string) => {
    if (!dateStr) return undefined;
    const targetDate = normalizeDate(dateStr);
    
    return holidays.find(h => {
        const holidayDate = normalizeDate(h.date);
        return holidayDate === targetDate;
    });
  };

  // Status Hari Ini (Evaluasi setiap render)
  const currentHoliday = getHoliday(selectedDate);
  const isWeekendDay = isWeekend(selectedDate);
  const isDayOff = isWeekendDay || !!currentHoliday;

  // Debugging Logika (Hanya muncul di console jika ada masalah)
  // console.log(`Date: ${selectedDate}, IsWeekend: ${isWeekendDay}, Holiday:`, currentHoliday);

  // SORTING: Sort by Name Alphabetically
  const filteredStudents = students
    .filter(s => s.classId === selectedClass && s.isActive)
    .sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    const existing: Record<string, AttendanceStatus> = {};
    
    filteredStudents.forEach(s => {
      const record = attendance.find(a => a.studentId === s.id && a.date === selectedDate);
      existing[s.id] = record ? record.status : AttendanceStatus.NONE;
    });
    setLocalAttendance(existing);
    setSentStatus({}); 
  }, [selectedDate, selectedClass, attendance, students]); 

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    // PROTEKSI LAPIS 1: Mencegah perubahan state jika hari libur
    if (isDayOff) {
      const reason = currentHoliday ? `Libur Nasional (${currentHoliday.description})` : "Akhir Pekan";
      alert(`⛔ AKSES DITOLAK\n\nTanggal ${selectedDate} adalah ${reason}.\nSistem mengunci pengisian absensi pada hari libur.`);
      return; 
    }
    setLocalAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = () => {
    if (!activeYear) return alert("Pilih tahun pelajaran aktif di dashboard");
    
    // PROTEKSI LAPIS 2: Mencegah penyimpanan
    if (isDayOff) {
      const msg = currentHoliday ? `Hari Libur Nasional: ${currentHoliday.description}` : "Akhir Pekan (Sabtu/Minggu)";
      return alert(`⛔ TIDAK BISA MENYIMPAN\n\nTanggal: ${selectedDate}\nAlasan: ${msg}\n\nAnda tidak dapat menyimpan absensi pada hari libur.`);
    }
    
    const records: AttendanceRecord[] = Object.entries(localAttendance)
      .filter(([_, status]) => status !== AttendanceStatus.NONE)
      .map(([studentId, status]) => ({
        id: `${studentId}-${selectedDate}`,
        studentId,
        date: selectedDate,
        status: status as AttendanceStatus,
        academicYear: activeYear.name
      }));
    
    markAttendance(records);
    triggerSave(); 
    alert('Data absensi berhasil disimpan dan sedang dikirim ke Spreadsheet...');
  };

  // --- LOGIKA IMPORT EXCEL ---
  const handleImport = () => {
    if (currentUser?.role !== UserRole.ADMIN) {
      return alert("Akses Ditolak. Fitur ini hanya untuk Admin.");
    }

    if (isDayOff) {
        return alert("⛔ IMPORT DITOLAK: Hari ini adalah hari libur.");
    }

    const lines = importText.trim().split(/\r?\n/);
    let successCount = 0;
    const newLocalAttendance = { ...localAttendance };

    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const key = parts[0].trim(); // Bisa NISN atau Nama
        const statusRaw = parts[1].trim().toUpperCase();

        const student = filteredStudents.find(s => 
          s.nisn === key || s.name.toLowerCase() === key.toLowerCase()
        );

        if (student) {
          let status: AttendanceStatus = AttendanceStatus.NONE;
          if (['H', 'HADIR', 'PRESENT'].includes(statusRaw)) status = AttendanceStatus.HADIR;
          else if (['S', 'SAKIT', 'SICK'].includes(statusRaw)) status = AttendanceStatus.SAKIT;
          else if (['I', 'IZIN', 'PERMIT'].includes(statusRaw)) status = AttendanceStatus.IZIN;
          else if (['A', 'ALPA', 'ABSENT'].includes(statusRaw)) status = AttendanceStatus.ALPA;

          if (status !== AttendanceStatus.NONE) {
            newLocalAttendance[student.id] = status;
            successCount++;
          }
        }
      }
    });

    if (successCount > 0) {
      setLocalAttendance(newLocalAttendance);
      alert(`Berhasil membaca ${successCount} data absensi. Jangan lupa tekan tombol SIMPAN.`);
      setImportText('');
      setShowImport(false);
    } else {
      alert("Tidak ada data yang cocok. Pastikan format: [NISN/Nama] [Tab] [Status]");
    }
  };

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

    let text = `*LAPORAN ABSENSI KELAS ${selectedClass}*\n`;
    text += `${dateFormatted}\n`;
    text += `--------------------------------\n`;

    if (sList.length > 0) {
      text += `*😷 SAKIT:*\n`;
      sList.forEach((st, idx) => text += `${idx + 1}. ${st.name}\n`);
      text += `\n`;
    }
    if (iList.length > 0) {
      text += `*📩 IZIN:*\n`;
      iList.forEach((st, idx) => text += `${idx + 1}. ${st.name}\n`);
      text += `\n`;
    }
    if (aList.length > 0) {
      text += `*❌ ALPA:*\n`;
      aList.forEach((st, idx) => text += `${idx + 1}. ${st.name}\n`);
      text += `\n`;
    }
    text += `✅ Hadir: ${hCount} Siswa\n`;
    text += `--------------------------------\n`;
    text += `_SD Negeri 5 Bilato_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const StatusButton = ({ sId, type, label, color }: any) => (
    <button
      onClick={() => handleStatusChange(sId, type)}
      disabled={isDayOff} 
      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
        localAttendance[sId] === type 
          ? `bg-${color}-600 text-white shadow-md` 
          : `bg-gray-100 text-gray-500 hover:bg-${color}-50 hover:text-${color}-600`
      } ${isDayOff ? 'opacity-20 cursor-not-allowed' : ''}`}
    >
      {label}
    </button>
  );

  const absentStudents = filteredStudents.filter(s => {
    const status = localAttendance[s.id];
    return status === AttendanceStatus.SAKIT || status === AttendanceStatus.IZIN || status === AttendanceStatus.ALPA;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Absensi Harian</h1>
          <p className="text-sm text-gray-500">Isi kehadiran siswa & kirim notifikasi</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className={`border p-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none ${isDayOff ? 'bg-red-50 border-red-300 text-red-700 font-bold' : ''}`}
          />
          {currentUser?.role === UserRole.ADMIN && (
             <div className="flex gap-2">
                <select 
                  value={selectedClass} 
                  onChange={e => setSelectedClass(e.target.value)}
                  className="border p-2 rounded-lg text-gray-700 bg-white"
                >
                  {['1','2','3','4','5','6'].map(c => <option key={c} value={c}>Kelas {c}</option>)}
                </select>
                <button 
                  onClick={() => setShowImport(true)}
                  disabled={isDayOff}
                  className={`flex items-center space-x-2 text-white px-3 py-2 rounded-lg shadow-sm ${isDayOff ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  title={isDayOff ? "Tidak tersedia di hari libur" : "Import Excel"}
                >
                  <Upload size={18} />
                  <span className="hidden md:inline">Import</span>
                </button>
             </div>
          )}
        </div>
      </div>

      {isDayOff ? (
        <div className="bg-red-50 border-2 border-red-200 p-10 rounded-xl flex flex-col items-center justify-center space-y-4 text-center animate-pulse">
          <CalendarOff size={64} className="text-red-500" />
          <div>
            <h3 className="text-2xl font-bold text-red-700">TIDAK ADA ABSENSI</h3>
            <p className="text-red-600 font-medium text-lg mt-2">
              {currentHoliday ? `Libur Nasional: ${currentHoliday.description}` : "Hari Libur Akhir Pekan (Sabtu / Minggu)"}
            </p>
          </div>
          <div className="bg-white px-6 py-3 rounded-lg border border-red-100 text-red-600 font-bold shadow-sm">
             SISTEM DIKUNCI: Absensi tidak dapat diisi atau disimpan.
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 border-b">
                <tr>
                  <th className="p-4 w-10">No</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4 text-center">Kehadiran</th>
                  <th className="p-4 text-center">Notifikasi WA</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-500">{idx + 1}</td>
                    <td className="p-4">
                      <div className="font-medium text-gray-800">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.nisn}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center space-x-2">
                        <StatusButton sId={s.id} type={AttendanceStatus.HADIR} label="H" color="green" />
                        <StatusButton sId={s.id} type={AttendanceStatus.SAKIT} label="S" color="yellow" />
                        <StatusButton sId={s.id} type={AttendanceStatus.IZIN} label="I" color="blue" />
                        <StatusButton sId={s.id} type={AttendanceStatus.ALPA} label="A" color="red" />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {localAttendance[s.id] && localAttendance[s.id] !== AttendanceStatus.NONE && (
                        <button 
                          onClick={() => sendWhatsApp(s)}
                          className={`p-2 rounded-full transition-colors flex items-center justify-center mx-auto ${
                            sentStatus[s.id] 
                              ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              : !s.parentPhone 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-green-600 hover:bg-green-100 bg-green-50'
                          }`}
                          title={s.parentPhone ? "Kirim WA ke Orang Tua" : "No. WA Tidak Tersedia"}
                          disabled={!s.parentPhone}
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
          
          <div className="p-4 border-t bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex gap-2 w-full justify-end">
               <button 
                  onClick={() => setShowBulkModal(true)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 shadow-md flex items-center gap-2"
                  disabled={absentStudents.length === 0}
                >
                  <Send size={18} /> Notifikasi ({absentStudents.length})
                </button>
               <button 
                  onClick={handleRecapWhatsApp}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 shadow-md flex items-center gap-2"
                >
                  <Share2 size={18} /> Rekap Grup
                </button>
                <button 
                  onClick={handleSave}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2"
                >
                  <Save size={18} /> Simpan Absensi
                </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Send Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Smartphone className="text-orange-500" />
                Asisten Notifikasi WA
              </h3>
              <button onClick={() => setShowBulkModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {absentStudents.map((s, idx) => (
                  <div key={s.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                       <span className="text-sm font-mono text-gray-400 w-6">{idx+1}.</span>
                       <div>
                         <p className="font-bold text-gray-800">{s.name}</p>
                         <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                           {localAttendance[s.id] === 'S' ? 'Sakit' : localAttendance[s.id] === 'I' ? 'Izin' : 'Alpa'}
                         </span>
                       </div>
                    </div>
                    <button 
                      onClick={() => sendWhatsApp(s)}
                      disabled={!s.parentPhone}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium ${sentStatus[s.id] ? 'bg-gray-100 text-gray-500' : 'bg-green-600 text-white'}`}
                    >
                      {sentStatus[s.id] ? 'Terkirim' : 'Kirim WA'}
                    </button>
                  </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* IMPORT EXCEL MODAL */}
      {showImport && currentUser?.role === UserRole.ADMIN && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Upload className="text-green-600" /> Import Absensi (Copy-Paste)
            </h3>
            <textarea 
              className="w-full h-40 border p-3 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500 outline-none resize-none" 
              placeholder={"0012345678\tS\nBudi Santoso\tI\n..."}
              value={importText}
              onChange={e => setImportText(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-4">
               <button onClick={() => setShowImport(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Batal</button>
               <button onClick={handleImport} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Proses Input</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceDaily;
