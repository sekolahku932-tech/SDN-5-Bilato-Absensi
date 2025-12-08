
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { UserRole, AttendanceStatus, SubjectAttendanceRecord } from '../types';
import { Save, ClipboardList, CalendarOff, RotateCcw, AlertCircle } from 'lucide-react';
import { CLASS_LIST, DAYS_OF_WEEK } from '../constants';

const AttendanceSubject: React.FC = () => {
  const { students, subjects, subjectAttendance, holidays, markSubjectAttendance, currentUser, academicYears, triggerSave } = useApp();
  
  // LOGIC FOR INITIAL CLASS SELECTION
  // If admin, default '1'. If Wali Kelas, default to their class. 
  // If Subject Teacher with access list, default to first accessible class.
  const initialClass = () => {
    if (currentUser?.classId) return currentUser.classId;
    if (currentUser?.accessibleClassIds && currentUser.accessibleClassIds.length > 0) {
        return currentUser.accessibleClassIds[0];
    }
    return '1';
  };

  // FILTER AVAILABLE SUBJECTS BASED ON TEACHER ASSIGNMENT
  const getAvailableSubjects = () => {
      // If admin, show all
      if (currentUser?.role === UserRole.ADMIN) return subjects;
      // If subject teacher has specific assignments, filter
      if (currentUser?.subjectIds && currentUser.subjectIds.length > 0) {
          return subjects.filter(s => currentUser.subjectIds?.includes(s.id));
      }
      // Fallback (or if Wali Kelas accessing this menu unexpectedly) -> show all
      return subjects;
  };

  const availableSubjects = getAvailableSubjects();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState(initialClass());
  const [selectedSubject, setSelectedSubject] = useState(availableSubjects[0]?.id || '');
  
  // Update selected subject if available subjects change
  useEffect(() => {
     if (availableSubjects.length > 0 && !availableSubjects.find(s => s.id === selectedSubject)) {
         setSelectedSubject(availableSubjects[0].id);
     }
  }, [availableSubjects, selectedSubject]);
  
  const [localAttendance, setLocalAttendance] = useState<Record<string, AttendanceStatus>>({});

  const activeYear = academicYears.find(y => y.isActive);

  // --- LOGIKA TANGGAL & LIBUR ---
  const normalizeDate = (dateStr: string) => {
    if (!dateStr) return '';
    return dateStr.trim().split('T')[0];
  };

  const getDateObj = (dateStr: string) => {
     const parts = normalizeDate(dateStr).split('-').map(Number);
     return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  }

  const isWeekend = (dateStr: string) => {
    if (!dateStr) return false;
    const dateObj = getDateObj(dateStr);
    const day = dateObj.getDay();
    return day === 0 || day === 6; 
  };

  const getDayName = (dateStr: string) => {
     const dateObj = getDateObj(dateStr);
     const dayIndex = dateObj.getDay(); // 0=Sun, 1=Mon
     if (dayIndex === 0) return 'Minggu';
     // Array DAYS_OF_WEEK starts at Senin (Index 0). So Mon(1) -> 0.
     return DAYS_OF_WEEK[dayIndex - 1] || 'Sabtu'; // Fallback logic
  }

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

  // --- LOGIKA JADWAL MAPEL ---
  const currentSubject = subjects.find(s => s.id === selectedSubject);
  const currentDayName = getDayName(selectedDate);
  
  const isScheduled = () => {
     if (!currentSubject) return false;
     // Jika jadwal belum diatur sama sekali (legacy data), bebaskan akses
     if (!currentSubject.schedule || currentSubject.schedule.length === 0) return true;

     const daySchedule = currentSubject.schedule.find(s => s.day === currentDayName);
     if (!daySchedule) return false;

     if (selectedClass === 'ALL') {
        return daySchedule.classIds.length > 0;
     }
     return daySchedule.classIds.includes(selectedClass);
  };

  const isScheduleValid = isScheduled();

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
  useEffect(() => {
    const existing: Record<string, AttendanceStatus> = {};
    
    filteredStudents.forEach(s => {
      const record = subjectAttendance.find(a => 
        a.studentId === s.id && 
        a.date === selectedDate &&
        a.subjectId === selectedSubject
      );
      if (record) {
         existing[s.id] = record.status;
      } else {
         existing[s.id] = AttendanceStatus.NONE;
      }
    });

    setLocalAttendance(existing);
  }, [selectedDate, selectedClass, selectedSubject, subjectAttendance, students]); 

  // --- HANDLERS ---
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    if (isDayOff && status !== AttendanceStatus.NONE) {
      alert(`⛔ AKSES DITOLAK\nHari Libur.`);
      return; 
    }
    setLocalAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSave = () => {
    if (!activeYear) return alert("Pilih tahun pelajaran aktif di dashboard");
    if (!selectedSubject) return alert("Pilih Mata Pelajaran!");
    if (!isScheduleValid) return alert("Tidak ada jadwal mata pelajaran ini di hari/kelas tersebut.");

    const records: SubjectAttendanceRecord[] = [];
    filteredStudents.forEach(s => {
       const status = localAttendance[s.id] || AttendanceStatus.NONE;
       records.push({
          id: `${s.id}-${selectedSubject}-${selectedDate}`,
          studentId: s.id,
          subjectId: selectedSubject,
          date: selectedDate,
          status: status as AttendanceStatus,
          academicYear: activeYear.name
       });
    });

    markSubjectAttendance(records);
    triggerSave(); 
    alert('✅ Absensi Mapel Tersimpan!');
  };

  // --- DETERMINE AVAILABLE CLASSES FOR DROPDOWN ---
  const getAvailableClasses = () => {
     if (currentUser?.role === UserRole.ADMIN) {
         return CLASS_LIST;
     }
     // If Wali Kelas, only their class
     if (currentUser?.classId) {
         return [currentUser.classId];
     }
     // If Guru Mapel with specific access
     if (currentUser?.accessibleClassIds && currentUser.accessibleClassIds.length > 0) {
         return CLASS_LIST.filter(c => currentUser.accessibleClassIds?.includes(c));
     }
     // Fallback (e.g. Guru Mapel without setup)
     return CLASS_LIST;
  };

  const availableClasses = getAvailableClasses();
  const isSingleClass = availableClasses.length === 1;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Absensi Mata Pelajaran</h1>
          <p className="text-sm text-gray-500">Input kehadiran siswa per jam pelajaran</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="date" 
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className={`border p-2 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none ${isDayOff ? 'bg-red-50 border-red-300 text-red-700 font-bold' : ''}`}
          />
          <select 
             value={selectedClass} 
             onChange={e => setSelectedClass(e.target.value)}
             className={`border p-2 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none ${isSingleClass ? 'bg-gray-100' : ''}`}
             disabled={isSingleClass}
          >
             {currentUser?.role === UserRole.ADMIN && <option value="ALL">Semua Kelas</option>}
             {availableClasses.map(c => <option key={c} value={c}>Kelas {c}</option>)}
          </select>
          <select 
             value={selectedSubject} 
             onChange={e => setSelectedSubject(e.target.value)}
             className="border p-2 rounded-lg text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 outline-none min-w-[150px]"
          >
             {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
             {availableSubjects.length === 0 && <option disabled>Tidak ada mapel</option>}
          </select>
        </div>
      </div>

      {isDayOff ? (
        <div className="bg-red-50 border-2 border-red-200 p-8 rounded-xl flex flex-col items-center justify-center text-center">
          <CalendarOff size={48} className="text-red-500 mb-2" />
          <h3 className="text-xl font-bold text-red-700">TIDAK ADA JADWAL SEKOLAH</h3>
          <p className="text-red-600">Hari Libur / Akhir Pekan</p>
        </div>
      ) : !isScheduleValid ? (
         <div className="bg-orange-50 border-2 border-orange-200 p-8 rounded-xl flex flex-col items-center justify-center text-center">
            <AlertCircle size={48} className="text-orange-500 mb-2" />
            <h3 className="text-xl font-bold text-orange-700">TIDAK ADA JADWAL MAPEL</h3>
            <p className="text-orange-700 mt-1">
               <strong>{currentSubject?.name}</strong> tidak dijadwalkan untuk <strong>Kelas {selectedClass === 'ALL' ? 'Apapun' : selectedClass}</strong> pada hari <strong>{currentDayName}</strong>.
            </p>
            <p className="text-sm text-orange-600 mt-4">Silakan atur jadwal di menu Data Mata Pelajaran.</p>
         </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="p-3 bg-blue-50 border-b border-blue-100 flex justify-between items-center text-sm text-blue-800">
             <span className="font-bold flex items-center gap-2"><ClipboardList size={16}/> {currentSubject?.name}</span>
             <span>Hari: <strong>{currentDayName}</strong></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-gray-600 border-b text-sm uppercase">
                <tr>
                  <th className="p-4 w-10">No</th>
                  <th className="p-4">Nama Siswa</th>
                  <th className="p-4 text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="p-4 text-gray-500">{idx + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.nisn} - Kelas {s.classId}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        {[
                          { type: AttendanceStatus.HADIR, label: 'H', color: 'green' },
                          { type: AttendanceStatus.SAKIT, label: 'S', color: 'yellow' },
                          { type: AttendanceStatus.IZIN, label: 'I', color: 'blue' },
                          { type: AttendanceStatus.ALPA, label: 'A', color: 'red' },
                        ].map(btn => (
                           <button
                             key={btn.type}
                             onClick={() => handleStatusChange(s.id, btn.type as AttendanceStatus)}
                             className={`w-8 h-8 flex items-center justify-center text-sm font-bold rounded-md transition-all ${
                               localAttendance[s.id] === btn.type 
                                 ? `bg-${btn.color}-600 text-white shadow-md scale-110 ring-2 ring-${btn.color}-200` 
                                 : `bg-gray-100 text-gray-400 hover:bg-${btn.color}-50 hover:text-${btn.color}-600`
                             }`}
                           >
                             {btn.label}
                           </button>
                        ))}
                        <div className="w-px h-6 bg-gray-300 mx-2"></div>
                        <button
                          onClick={() => handleStatusChange(s.id, AttendanceStatus.NONE)}
                          title="Reset"
                          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100"
                        >
                          <RotateCcw size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t bg-gray-50 sticky bottom-0 z-10 flex justify-end">
             <button 
                onClick={handleSave}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 shadow-lg flex items-center gap-2 font-bold"
             >
                <Save size={18} /> SIMPAN ABSENSI MAPEL
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSubject;
