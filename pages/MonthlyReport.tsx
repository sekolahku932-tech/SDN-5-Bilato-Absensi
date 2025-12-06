
import React, { useState } from 'react';
import { useApp } from '../store';
import { UserRole, AttendanceStatus } from '../types';
import { Printer, Search, FileSpreadsheet } from 'lucide-react';
import { CLASS_LIST } from '../constants';

const MonthlyReport: React.FC = () => {
  const { students, attendance, holidays, headmaster, teachers, currentUser, academicYears } = useApp();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedClass, setSelectedClass] = useState(currentUser?.classId || '1');

  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const activeYearName = academicYears.find(y => y.isActive)?.name || "-";
  
  const filteredStudents = students.filter(s => 
    (selectedClass === 'ALL' ? true : s.classId === selectedClass) && s.isActive
  ).sort((a, b) => {
    const classCompare = a.classId.localeCompare(b.classId, undefined, { numeric: true });
    if (classCompare !== 0) return classCompare;
    return a.name.localeCompare(b.name);
  });

  // --- LOGIKA DATE CHECKING YANG KONSISTEN ---
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.trim().split('T')[0];
  };

  const checkDayType = (day: number) => {
    // Parse manual: YYYY, MM (0-indexed), DD
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // FIX: Gunakan jam 12:00:00 (Noon) untuk mencegah bug timezone saat menentukan hari dalam minggu (Weekend)
    const dateObj = new Date(selectedYear, selectedMonth - 1, day, 12, 0, 0);
    
    const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
    
    // Exact string match for holidays
    const isHoliday = holidays.some(h => normalizeDate(h.date) === dateStr);

    return { dateStr, isWeekend, isHoliday };
  };

  const getDayStatus = (studentId: string, day: number) => {
    const { dateStr, isWeekend, isHoliday } = checkDayType(day);
    
    // PRIORITAS: Libur > Weekend > Data Absensi
    if (isHoliday) return { code: 'L', color: 'bg-red-400 text-white' }; 
    if (isWeekend) return { code: '', color: 'bg-gray-200' };

    const record = attendance.find(a => a.studentId === studentId && a.date === dateStr);
    
    if (record) {
      return { 
        code: record.status, 
        color: record.status === 'A' ? 'text-red-600 font-bold' : record.status === 'S' ? 'text-yellow-600' : record.status === 'I' ? 'text-blue-600' : 'text-green-600'
      };
    }
    return { code: '-', color: 'text-gray-300' };
  };

  const calculateStats = (studentId: string) => {
    const studentRecords = attendance.filter(a => {
      // Manual parse untuk validasi
      const [y, m, d] = a.date.split('-').map(Number);
      // Gunakan juga jam 12:00 saat rekonstruksi date untuk filter
      const recDate = new Date(y, m-1, d, 12, 0, 0);
      const isWk = recDate.getDay() === 0 || recDate.getDay() === 6;
      const isHol = holidays.some(h => normalizeDate(h.date) === a.date);
      
      return a.studentId === studentId && 
             (m) === selectedMonth && 
             y === selectedYear &&
             !isWk && !isHol; // Jangan hitung jika hari libur
    });

    return {
      H: studentRecords.filter(r => r.status === AttendanceStatus.HADIR).length,
      S: studentRecords.filter(r => r.status === AttendanceStatus.SAKIT).length,
      I: studentRecords.filter(r => r.status === AttendanceStatus.IZIN).length,
      A: studentRecords.filter(r => r.status === AttendanceStatus.ALPA).length,
    };
  };

  // --- RECAP CALCULATIONS ---
  let totalH = 0, totalS = 0, totalI = 0, totalA = 0;
  
  filteredStudents.forEach(s => {
    const stats = calculateStats(s.id);
    totalH += stats.H;
    totalS += stats.S;
    totalI += stats.I;
    totalA += stats.A;
  });

  let effectiveDaysCount = 0;
  daysArray.forEach(d => {
    const { isWeekend, isHoliday } = checkDayType(d);
    if (!isWeekend && !isHoliday) effectiveDaysCount++;
  });

  const totalPossibleAttendance = filteredStudents.length * effectiveDaysCount;
  const attendancePercentage = totalPossibleAttendance > 0 
    ? ((totalH / totalPossibleAttendance) * 100).toFixed(2) 
    : "0.00";

  // --- PRINT HANDLER ---
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const teacher = teachers.find(t => t.classId === selectedClass);
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const monthName = months[selectedMonth - 1];

    const htmlContent = `
      <html>
      <head>
        <title>Laporan Absensi ${monthName} ${selectedYear}</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid black; padding: 4px; text-align: center; }
          .header { text-align: center; margin-bottom: 20px; }
          .bg-gray { background-color: #ddd !important; -webkit-print-color-adjust: exact; }
          .bg-red { background-color: #ef4444 !important; color: white !important; -webkit-print-color-adjust: exact; }
          .recap-section { margin-top: 20px; font-size: 11px; width: 40%; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; }
          .signature { text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>REKAPITULASI ABSENSI SISWA</h2>
          <h3>SD NEGERI 5 BILATO</h3>
          <p>Kelas: ${selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass} | Bulan: ${monthName} ${selectedYear}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th rowspan="2">No</th>
              <th rowspan="2">NISN</th>
              <th rowspan="2" style="width: 150px;">Nama Siswa</th>
              <th rowspan="2">Kelas</th>
              <th colspan="${daysInMonth}">Tanggal</th>
              <th colspan="4">Jumlah</th>
            </tr>
            <tr>
              ${daysArray.map(d => {
                const { isWeekend, isHoliday } = checkDayType(d);
                let thClass = "";
                if(isHoliday) thClass = "bg-red";
                else if(isWeekend) thClass = "bg-gray";
                return `<th class="${thClass}">${d}</th>`;
              }).join('')}
              <th>H</th><th>S</th><th>I</th><th>A</th>
            </tr>
          </thead>
          <tbody>
            ${filteredStudents.map((s, i) => {
              const stats = calculateStats(s.id);
              let cells = '';
              for (let d = 1; d <= daysInMonth; d++) {
                const st = getDayStatus(s.id, d);
                let cls = '';
                if (st.color.includes('gray')) cls = 'bg-gray';
                if (st.color.includes('red') && st.code === 'L') cls = 'bg-red';
                cells += `<td class="${cls}">${st.code === 'L' || st.code === '' ? '' : st.code}</td>`;
              }
              return `
                <tr>
                  <td>${i + 1}</td>
                  <td>${s.nisn}</td>
                  <td style="text-align: left;">${s.name}</td>
                  <td>${s.classId}</td>
                  ${cells}
                  <td>${stats.H}</td><td>${stats.S}</td><td>${stats.I}</td><td>${stats.A}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>

        <div class="recap-section">
           <table>
             <tr><th colspan="2">REKAPITULASI KEHADIRAN</th></tr>
             <tr><td style="text-align:left">Sakit</td><td>${totalS}</td></tr>
             <tr><td style="text-align:left">Izin</td><td>${totalI}</td></tr>
             <tr><td style="text-align:left">Alpa</td><td>${totalA}</td></tr>
             <tr><td style="text-align:left">Hadir</td><td>${totalH}</td></tr>
             <tr><td style="text-align:left; font-weight:bold;">Persentase</td><td style="font-weight:bold;">${attendancePercentage}%</td></tr>
           </table>
        </div>

        <div class="footer">
           <div class="signature">
             <br>Mengetahui,<br>Kepala Sekolah<br><br><br><br>
             <strong>${headmaster.name}</strong><br>
             NIP. ${headmaster.nip}
           </div>
           <div class="signature">
             Bilato, ${new Date().getDate()} ${monthName} ${new Date().getFullYear()}<br>
             ${selectedClass !== 'ALL' ? 'Wali Kelas' : 'Administrator'}<br><br><br><br>
             <strong>${selectedClass !== 'ALL' && teacher ? teacher.name : '.........................'}</strong><br>
             NIP. ${selectedClass !== 'ALL' && teacher ? teacher.nip : '.........................'}
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
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const monthName = months[selectedMonth - 1];
    
    let csvContent = `Laporan Absensi Bulan ${monthName} ${selectedYear}\n`;
    csvContent += `Kelas: ${selectedClass}\n\n`;
    
    let header = "No,NISN,Nama Siswa,Kelas";
    daysArray.forEach(d => header += `,${d}`);
    header += ",H,S,I,A\n";
    csvContent += header;

    filteredStudents.forEach((s, i) => {
      let row = `${i + 1},"${s.nisn}","${s.name}",${s.classId}`;
      daysArray.forEach(d => {
        const st = getDayStatus(s.id, d);
        row += `,${st.code === 'L' ? '' : st.code === '-' ? '' : st.code}`;
      });
      const stats = calculateStats(s.id);
      row += `,${stats.H},${stats.S},${stats.I},${stats.A}`;
      csvContent += row + "\n";
    });

    csvContent += `\n\nREKAPITULASI\n`;
    csvContent += `Sakit,${totalS}\nIzin,${totalI}\nAlpa,${totalA}\nHadir,${totalH}\nPersentase,${attendancePercentage}%\n`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Absensi_${selectedClass}_${monthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Laporan Bulanan</h1>
          <p className="text-sm text-gray-500">Rekapitulasi kehadiran siswa</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="border p-2 rounded-lg text-sm"
          >
            {Array.from({length: 12}, (_, i) => (
              <option key={i} value={i+1}>{new Date(0, i).toLocaleString('id-ID', {month: 'long'})}</option>
            ))}
          </select>
          <input 
            type="number" 
            value={selectedYear} 
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="border p-2 rounded-lg text-sm w-24"
          />
          {currentUser?.role === UserRole.ADMIN && (
             <select 
               value={selectedClass} 
               onChange={e => setSelectedClass(e.target.value)}
               className="border p-2 rounded-lg text-sm"
             >
               <option value="ALL">Semua Kelas</option>
               {CLASS_LIST.map(c => <option key={c} value={c}>Kelas {c}</option>)}
             </select>
          )}
          <button 
            onClick={handleDownloadExcel}
            className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
          >
            <FileSpreadsheet size={16} /> <span className="hidden md:inline">Excel</span>
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-900"
          >
            <Printer size={16} /> <span className="hidden md:inline">Cetak</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm border-collapse">
            <thead>
              <tr className="bg-blue-50 text-blue-900">
                <th rowSpan={2} className="p-2 border border-blue-100">No</th>
                <th rowSpan={2} className="p-2 border border-blue-100">NISN</th>
                <th rowSpan={2} className="p-2 border border-blue-100 min-w-[150px] sticky left-0 bg-blue-50 z-10">Nama Siswa</th>
                <th rowSpan={2} className="p-2 border border-blue-100">Kelas</th>
                <th colSpan={daysInMonth} className="p-2 border border-blue-100 text-center">Tanggal</th>
                <th colSpan={4} className="p-2 border border-blue-100 text-center">Total</th>
              </tr>
              <tr className="bg-blue-50 text-blue-900">
                {daysArray.map(d => {
                   const { isWeekend, isHoliday } = checkDayType(d);
                   let bgClass = "";
                   if (isHoliday) bgClass = "bg-red-400 text-white";
                   else if (isWeekend) bgClass = "bg-gray-200";

                   return (
                     <th key={d} className={`p-1 border border-blue-100 w-8 text-center ${bgClass}`}>
                       {d}
                     </th>
                   )
                })}
                <th className="p-1 border bg-green-100">H</th>
                <th className="p-1 border bg-yellow-100">S</th>
                <th className="p-1 border bg-blue-100">I</th>
                <th className="p-1 border bg-red-100">A</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((s, idx) => {
                const stats = calculateStats(s.id);
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-2 border text-center">{idx + 1}</td>
                    <td className="p-2 border text-center text-xs font-mono">{s.nisn}</td>
                    <td className="p-2 border font-medium sticky left-0 bg-white z-10">{s.name}</td>
                    <td className="p-2 border text-center font-bold">{s.classId}</td>
                    {daysArray.map(d => {
                      const { code, color } = getDayStatus(s.id, d);
                      const displayCode = code === 'L' ? '' : code;
                      return (
                        <td key={d} className={`p-1 border text-center ${color}`}>
                          {displayCode}
                        </td>
                      );
                    })}
                    <td className="p-2 border text-center font-bold bg-green-50">{stats.H}</td>
                    <td className="p-2 border text-center font-bold bg-yellow-50">{stats.S}</td>
                    <td className="p-2 border text-center font-bold bg-blue-50">{stats.I}</td>
                    <td className="p-2 border text-center font-bold bg-red-50">{stats.A}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* REKAP CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-3 border-b pb-2">Rekapitulasi (Semua Siswa Ditampilkan)</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
             <div className="p-2 bg-green-50 rounded flex justify-between"><span className="text-green-800">Hadir</span><span className="font-bold">{totalH}</span></div>
             <div className="p-2 bg-yellow-50 rounded flex justify-between"><span className="text-yellow-800">Sakit</span><span className="font-bold">{totalS}</span></div>
             <div className="p-2 bg-blue-50 rounded flex justify-between"><span className="text-blue-800">Izin</span><span className="font-bold">{totalI}</span></div>
             <div className="p-2 bg-red-50 rounded flex justify-between"><span className="text-red-800">Alpa</span><span className="font-bold">{totalA}</span></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
           <h3 className="font-bold text-gray-700">Persentase Kehadiran</h3>
           <div className="text-4xl font-extrabold text-blue-600 my-2">{attendancePercentage}%</div>
           <p className="text-xs text-gray-400">Hari Efektif: {effectiveDaysCount}</p>
        </div>
      </div>
    </div>
  );
};

export default MonthlyReport;
