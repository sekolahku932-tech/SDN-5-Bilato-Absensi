
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { UserRole, AttendanceStatus } from '../types';
import { Printer, FileSpreadsheet, BookOpen, AlertCircle, Filter } from 'lucide-react';
import { CLASS_LIST, DAYS_OF_WEEK } from '../constants';

const MonthlyReportSubject: React.FC = () => {
  const { students, subjects, subjectAttendance, holidays, headmaster, teachers, currentUser, academicYears } = useApp();
  
  // --- LOGIC: AVAILABLE CLASSES ---
  const getAvailableClasses = () => {
     if (currentUser?.role === UserRole.ADMIN) {
         return CLASS_LIST;
     }
     // Wali Kelas: Hanya 1 kelas
     if (currentUser?.classId) {
         return [currentUser.classId];
     }
     // Guru Mapel: Kelas yang dicentang di Manajemen User
     if (currentUser?.accessibleClassIds && currentUser.accessibleClassIds.length > 0) {
         // Filter CLASS_LIST agar urutannya tetap 1, 2, 3...
         return CLASS_LIST.filter(c => currentUser.accessibleClassIds!.includes(c));
     }
     // Fallback
     return [];
  };

  // --- LOGIC: AVAILABLE SUBJECTS ---
  const getAvailableSubjects = () => {
      // If admin, show all
      if (currentUser?.role === UserRole.ADMIN) return subjects;
      // If subject teacher has specific assignments, filter
      if (currentUser?.subjectIds && currentUser.subjectIds.length > 0) {
          return subjects.filter(s => currentUser.subjectIds?.includes(s.id));
      }
      return subjects;
  };

  const availableClasses = getAvailableClasses();
  const availableSubjects = getAvailableSubjects();

  const initialClass = () => {
      if (currentUser?.role === UserRole.ADMIN) return 'ALL';
      return availableClasses.length > 0 ? availableClasses[0] : '1';
  };

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClass, setSelectedClass] = useState(initialClass());
  const [selectedSubjectId, setSelectedSubjectId] = useState(availableSubjects[0]?.id || '');

  // Reset selected class if user role changes or access changes
  useEffect(() => {
     if (selectedClass !== 'ALL' && !availableClasses.includes(selectedClass) && availableClasses.length > 0) {
         setSelectedClass(availableClasses[0]);
     }
  }, [currentUser, availableClasses, selectedClass]);

  // Reset selected subject if available subjects change
  useEffect(() => {
     if (availableSubjects.length > 0 && !availableSubjects.find(s => s.id === selectedSubjectId)) {
         setSelectedSubjectId(availableSubjects[0].id);
     }
  }, [availableSubjects, selectedSubjectId]);

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const currentSubject = subjects.find(s => s.id === selectedSubjectId);

  // --- FILTER STUDENTS ---
  const filteredStudents = students.filter(s => 
    (selectedClass === 'ALL' ? true : s.classId === selectedClass) && s.isActive
  ).sort((a, b) => {
    const classCompare = a.classId.localeCompare(b.classId, undefined, { numeric: true });
    if (classCompare !== 0) return classCompare;
    return a.name.localeCompare(b.name);
  });

  // --- UTILS ---
  const normalizeDate = (dateStr: string) => dateStr ? dateStr.trim().split('T')[0] : '';

  const getDayInfo = (day: number) => {
    // Construct Date object at Noon to avoid timezone issues
    const dateObj = new Date(selectedYear, selectedMonth - 1, day, 12, 0, 0);
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Determine Day Name (Senin, Selasa...)
    const dayIndex = dateObj.getDay(); // 0 = Sun
    const dayName = dayIndex === 0 ? 'Minggu' : DAYS_OF_WEEK[dayIndex - 1] || 'Sabtu';
    
    const isWeekend = dayIndex === 0 || dayIndex === 6;
    const isHoliday = holidays.some(h => normalizeDate(h.date) === dateStr);

    return { dateStr, dayName, isWeekend, isHoliday };
  };

  const isSubjectScheduled = (dayName: string, classId: string) => {
     if (!currentSubject || !currentSubject.schedule || currentSubject.schedule.length === 0) return true; // If no schedule, assume open
     const sch = currentSubject.schedule.find(s => s.day === dayName);
     return sch ? sch.classIds.includes(classId) : false;
  };

  const getDayStatus = (studentId: string, classId: string, day: number) => {
    const { dateStr, dayName, isWeekend, isHoliday } = getDayInfo(day);
    
    if (isHoliday) return { code: 'L', color: 'bg-red-400 text-white' }; 
    if (isWeekend) return { code: '', color: 'bg-gray-200' };

    // Check Schedule
    if (!isSubjectScheduled(dayName, classId)) {
        return { code: '-', color: 'bg-gray-100 text-gray-300' }; // Not Scheduled
    }

    const record = subjectAttendance.find(a => 
        a.studentId === studentId && 
        a.date === dateStr && 
        a.subjectId === selectedSubjectId
    );
    
    if (record) {
      return { 
        code: record.status, 
        color: record.status === 'A' ? 'text-red-600 font-bold' : record.status === 'S' ? 'text-yellow-600' : record.status === 'I' ? 'text-blue-600' : 'text-green-600'
      };
    }
    return { code: '', color: 'text-gray-300' };
  };

  const calculateStats = (studentId: string, classId: string) => {
    let stats = { H: 0, S: 0, I: 0, A: 0 };
    
    daysArray.forEach(d => {
        const { dateStr, dayName, isWeekend, isHoliday } = getDayInfo(d);
        if (!isWeekend && !isHoliday && isSubjectScheduled(dayName, classId)) {
            const record = subjectAttendance.find(a => 
                a.studentId === studentId && 
                a.date === dateStr && 
                a.subjectId === selectedSubjectId
            );
            if (record) {
                if (record.status === AttendanceStatus.HADIR) stats.H++;
                if (record.status === AttendanceStatus.SAKIT) stats.S++;
                if (record.status === AttendanceStatus.IZIN) stats.I++;
                if (record.status === AttendanceStatus.ALPA) stats.A++;
            }
        }
    });
    return stats;
  };

  // --- RECAP ---
  let totalH = 0, totalS = 0, totalI = 0, totalA = 0;
  let totalScheduledDays = 0; // Approximation for percentage

  filteredStudents.forEach(s => {
    const stats = calculateStats(s.id, s.classId);
    totalH += stats.H;
    totalS += stats.S;
    totalI += stats.I;
    totalA += stats.A;
  });

  // Calculate percentage based on total possible attendance slots (student * scheduled days)
  let totalSlots = 0;
  daysArray.forEach(d => {
     const { dayName, isWeekend, isHoliday } = getDayInfo(d);
     if (!isWeekend && !isHoliday) {
         filteredStudents.forEach(s => {
             if (isSubjectScheduled(dayName, s.classId)) totalSlots++;
         });
     }
  });

  const attendancePercentage = totalSlots > 0 
    ? ((totalH / totalSlots) * 100).toFixed(2) 
    : "0.00";

  // --- EXPORT ---
  const handlePrint = () => {
    if (!currentSubject) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // LOGIC: Tentukan Nama Guru
    // Jika user adalah guru (Wali Kelas / Mapel), tampilkan namanya.
    // Jika user adalah Admin, kosongkan karena Admin bukan pengajar langsung.
    const loggedInTeacher = teachers.find(t => t.id === currentUser?.id);
    const isTeacher = currentUser?.role === UserRole.WALI_KELAS;

    const teacherName = isTeacher && loggedInTeacher ? loggedInTeacher.name : '( ..................................... )';
    const teacherNip = isTeacher && loggedInTeacher ? loggedInTeacher.nip : '.....................................';

    const monthName = new Date(0, selectedMonth - 1).toLocaleString('id-ID', {month: 'long'});

    const htmlContent = `
      <html>
      <head>
        <title>Laporan Absensi Mapel ${currentSubject.name}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid black; padding: 4px; text-align: center; }
          .header { text-align: center; margin-bottom: 20px; }
          .bg-gray { background-color: #eee !important; -webkit-print-color-adjust: exact; }
          .bg-red { background-color: #ef4444 !important; color: white !important; -webkit-print-color-adjust: exact; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature { text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>LAPORAN ABSENSI MATA PELAJARAN</h2>
          <h3>SD NEGERI 5 BILATO</h3>
          <p>Mapel: <strong>${currentSubject.name}</strong> | Kelas: ${selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass} | Bulan: ${monthName} ${selectedYear}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2">No</th>
              <th rowspan="2">Nama Siswa</th>
              <th rowspan="2">Kelas</th>
              <th colspan="${daysInMonth}">Tanggal</th>
              <th colspan="4">Jumlah</th>
            </tr>
            <tr>
              ${daysArray.map(d => `<th class="p-1">${d}</th>`).join('')}
              <th>H</th><th>S</th><th>I</th><th>A</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((s, i) => {
              const stats = calculateStats(s.id, s.classId);
              let cells = '';
              for (let d = 1; d <= daysInMonth; d++) {
                const st = getDayStatus(s.id, s.classId, d);
                let cls = '';
                if (st.color.includes('bg-gray-200')) cls = 'bg-gray'; // Weekend
                if (st.color.includes('bg-gray-100')) cls = 'bg-gray'; // Not Scheduled
                if (st.color.includes('bg-red')) cls = 'bg-red'; // Holiday
                cells += `<td class="${cls}">${st.code === 'L' ? '' : st.code}</td>`;
              }
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td style="text-align: left;">${s.name}</td>
                  <td>${s.classId}</td>
                  ${cells}
                  <td>${stats.H}</td><td>${stats.S}</td><td>${stats.I}</td><td>${stats.A}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <div style="margin-top: 20px; font-size: 11px;">
           <strong>Persentase Kehadiran Mapel: ${attendancePercentage}%</strong>
        </div>

        <div class="footer">
           <div class="signature">
             <br>Mengetahui,<br>Kepala Sekolah<br><br><br><br>
             <strong>${headmaster.name}</strong><br>
             NIP. ${headmaster.nip}
           </div>
           <div class="signature">
             Bilato, ${new Date().getDate()} ${monthName} ${new Date().getFullYear()}<br>
             Guru Mata Pelajaran<br><br><br><br>
             <strong>${teacherName}</strong><br>
             NIP. ${teacherNip}
           </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadExcel = () => {
    if (!currentSubject) return;
    const monthName = new Date(0, selectedMonth - 1).toLocaleString('id-ID', {month: 'long'});
    
    let csvContent = `Laporan Absensi Mapel ${currentSubject.name}\n`;
    csvContent += `Bulan: ${monthName} ${selectedYear}\nKelas: ${selectedClass}\n\n`;
    
    let header = "No,NISN,Nama Siswa,Kelas";
    daysArray.forEach(d => header += `,${d}`);
    header += ",H,S,I,A\n";
    csvContent += header;

    filteredStudents.forEach((s, i) => {
      let row = `${i + 1},"${s.nisn}","${s.name}",${s.classId}`;
      daysArray.forEach(d => {
        const st = getDayStatus(s.id, s.classId, d);
        row += `,${st.code === 'L' ? '' : st.code}`;
      });
      const stats = calculateStats(s.id, s.classId);
      row += `,${stats.H},${stats.S},${stats.I},${stats.A}`;
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Absensi_${currentSubject.name}_${monthName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
             <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600">
                <BookOpen size={28} />
             </div>
             <div>
                <h1 className="text-2xl font-bold text-gray-800">Laporan Bulanan Mapel</h1>
                <p className="text-sm text-gray-500">Rekapitulasi kehadiran berdasarkan Mata Pelajaran</p>
             </div>
        </div>

        {/* --- FILTER SECTION: DILEBARKAN & DIPERJELAS --- */}
        <div className="flex flex-col xl:flex-row gap-4">
            
            {/* 1. Pilih Mapel (Utama & Lebar) */}
            <div className="flex-1 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                <label className="block text-xs font-bold text-indigo-800 uppercase mb-1">Pilih Mata Pelajaran</label>
                <select 
                    value={selectedSubjectId} 
                    onChange={e => setSelectedSubjectId(e.target.value)}
                    className="w-full border p-2.5 rounded-lg text-base font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500 outline-none bg-white shadow-sm"
                >
                    {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    {availableSubjects.length === 0 && <option disabled>Tidak ada mapel</option>}
                </select>
            </div>

            <div className="flex flex-wrap gap-4 items-end">
                {/* 2. Pilih Kelas (Dinamis Sesuai Hak Akses) */}
                <div className="w-full md:w-auto min-w-[150px]">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kelas</label>
                    {availableClasses.length > 1 || currentUser?.role === UserRole.ADMIN ? (
                         <select 
                            value={selectedClass} 
                            onChange={e => setSelectedClass(e.target.value)}
                            className="w-full border p-2.5 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        >
                            {currentUser?.role === UserRole.ADMIN && <option value="ALL">Semua Kelas</option>}
                            {availableClasses.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                        </select>
                    ) : (
                        <div className="w-full border p-2.5 rounded-lg text-sm bg-gray-100 font-bold text-gray-600 shadow-sm">
                            Kelas {selectedClass}
                        </div>
                    )}
                </div>

                {/* 3. Bulan & Tahun */}
                <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Periode</label>
                     <div className="flex gap-2">
                        <select 
                            value={selectedMonth} 
                            onChange={e => setSelectedMonth(Number(e.target.value))}
                            className="border p-2.5 rounded-lg text-sm bg-white shadow-sm"
                        >
                            {Array.from({length: 12}, (_, i) => (
                            <option key={i} value={i+1}>{new Date(0, i).toLocaleString('id-ID', {month: 'long'})}</option>
                            ))}
                        </select>
                        <input 
                            type="number" 
                            value={selectedYear} 
                            onChange={e => setSelectedYear(Number(e.target.value))}
                            className="border p-2.5 rounded-lg text-sm w-24 bg-white shadow-sm text-center"
                        />
                     </div>
                </div>

                {/* 4. Actions */}
                <div className="flex gap-2 ml-auto">
                    <button 
                        onClick={handleDownloadExcel}
                        className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 shadow-sm transition-colors text-sm font-medium"
                    >
                        <FileSpreadsheet size={18} /> Excel
                    </button>
                    <button 
                        onClick={handlePrint}
                        className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2.5 rounded-lg hover:bg-gray-900 shadow-sm transition-colors text-sm font-medium"
                    >
                        <Printer size={18} /> Cetak
                    </button>
                </div>
            </div>
        </div>
      </div>

      {!currentSubject ? (
         <div className="p-12 text-center text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-300">
            <BookOpen className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-lg font-bold text-gray-600">Belum Memilih Mata Pelajaran</h3>
            <p className="text-sm">Silakan pilih mata pelajaran di atas untuk melihat laporan.</p>
         </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
                <thead>
                <tr className="bg-indigo-50 text-indigo-900">
                    <th rowSpan={2} className="p-2 border border-indigo-100 w-8">No</th>
                    <th rowSpan={2} className="p-2 border border-indigo-100 min-w-[200px] sticky left-0 bg-indigo-50 z-10 text-left">Nama Siswa</th>
                    <th rowSpan={2} className="p-2 border border-indigo-100 w-10">Kls</th>
                    <th colSpan={daysInMonth} className="p-2 border border-indigo-100 text-center">
                        Tanggal (Area Abu-abu = Tidak Ada Jadwal)
                    </th>
                    <th colSpan={4} className="p-2 border border-indigo-100 text-center">Total</th>
                </tr>
                <tr className="bg-indigo-50 text-indigo-900">
                    {daysArray.map(d => {
                        const { isWeekend, isHoliday } = getDayInfo(d);
                        let bgClass = "";
                        if (isHoliday) bgClass = "bg-red-400 text-white";
                        else if (isWeekend) bgClass = "bg-gray-200";
                        return <th key={d} className={`p-1 border border-indigo-100 w-6 text-center ${bgClass}`}>{d}</th>
                    })}
                    <th className="p-1 border bg-green-100 w-6">H</th>
                    <th className="p-1 border bg-yellow-100 w-6">S</th>
                    <th className="p-1 border bg-blue-100 w-6">I</th>
                    <th className="p-1 border bg-red-100 w-6">A</th>
                </tr>
                </thead>
                <tbody>
                {filteredStudents.map((s, idx) => {
                    const stats = calculateStats(s.id, s.classId);
                    return (
                    <tr key={s.id} className="hover:bg-gray-50">
                        <td className="p-2 border text-center text-gray-500">{idx + 1}</td>
                        <td className="p-2 border font-medium sticky left-0 bg-white z-10 text-gray-800">{s.name}</td>
                        <td className="p-2 border text-center font-bold text-gray-600">{s.classId}</td>
                        {daysArray.map(d => {
                            const { code, color } = getDayStatus(s.id, s.classId, d);
                            return (
                                <td key={d} className={`p-1 border text-center text-[10px] font-bold ${color}`}>
                                {code === 'L' || code === '-' ? '' : code}
                                </td>
                            );
                        })}
                        <td className="p-2 border text-center font-bold bg-green-50 text-green-700">{stats.H}</td>
                        <td className="p-2 border text-center font-bold bg-yellow-50 text-yellow-700">{stats.S}</td>
                        <td className="p-2 border text-center font-bold bg-blue-50 text-blue-700">{stats.I}</td>
                        <td className="p-2 border text-center font-bold bg-red-50 text-red-700">{stats.A}</td>
                    </tr>
                    );
                })}
                {filteredStudents.length === 0 && (
                    <tr>
                        <td colSpan={daysInMonth + 7} className="p-8 text-center text-gray-400 italic">
                            Tidak ada siswa di kelas ini atau tidak ada siswa yang aktif.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
            
            <div className="p-4 bg-gray-50 border-t flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Filter size={14} />
                    <span>Kolom abu-abu menandakan hari libur atau mapel tidak dijadwalkan di kelas tersebut.</span>
                </div>
                <div className="bg-white px-4 py-2 rounded-lg border shadow-sm">
                    <span className="text-sm font-bold text-gray-600">Persentase Kehadiran: </span>
                    <span className="text-lg font-bold text-indigo-600">{attendancePercentage}%</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyReportSubject;
