
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  AppState, Student, Teacher, AttendanceRecord, AcademicYear, 
  Holiday, Headmaster, UserRole, Alumni, AlumniReason, AttendanceStatus,
  Subject, SubjectAttendanceRecord
} from './types';
import { 
  INITIAL_STUDENTS, INITIAL_TEACHERS, INITIAL_YEARS, 
  INITIAL_HOLIDAYS, INITIAL_HEADMASTER, DEFAULT_SCRIPT_URL, INITIAL_SUBJECTS
} from './constants';

interface AppContextType extends AppState {
  login: (role: UserRole, data?: any) => void;
  logout: () => void;
  addStudent: (s: Student) => void;
  updateStudent: (s: Student) => void;
  deleteStudent: (id: string) => void;
  promoteStudent: (id: string, newClassId: string, newYearId: string) => void;
  moveToAlumni: (studentId: string, reason: AlumniReason, date: string) => void;
  markAttendance: (records: AttendanceRecord[]) => void;
  updateHeadmaster: (h: Headmaster) => void;
  addTeacher: (t: Teacher) => void;
  updateTeacher: (t: Teacher) => void;
  deleteTeacher: (id: string) => void;
  setAcademicYear: (id: string) => void;
  addAcademicYear: (name: string) => void;
  deleteAcademicYear: (id: string) => void;
  toggleHoliday: (h: Holiday) => void;
  deleteHoliday: (id: string) => void;
  
  // Subject Actions
  addSubject: (s: Subject) => void;
  updateSubject: (s: Subject) => void; // Added update capability
  deleteSubject: (id: string) => void;
  markSubjectAttendance: (records: SubjectAttendanceRecord[]) => void;
  
  // Sync
  setGoogleScriptUrl: (url: string) => void;
  syncToCloud: (silent?: boolean) => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
  triggerSave: () => void; // New safe save method
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [teachers, setTeachers] = useState<Teacher[]>(INITIAL_TEACHERS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>(INITIAL_YEARS);
  const [holidays, setHolidays] = useState<Holiday[]>(INITIAL_HOLIDAYS);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [headmaster, setHeadmaster] = useState<Headmaster>(INITIAL_HEADMASTER);
  
  // New States for Subjects
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [subjectAttendance, setSubjectAttendance] = useState<SubjectAttendanceRecord[]>([]);

  const [currentUser, setCurrentUser] = useState<AppState['currentUser']>(null);
  
  const [googleScriptUrl, setGoogleScriptUrl] = useState<string>(DEFAULT_SCRIPT_URL);
  const [lastSync, setLastSync] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Flag to trigger sync after state update
  const [pendingSave, setPendingSave] = useState(false);

  // Refs for Sync to access latest state inside async functions
  const stateRef = useRef({
    students, teachers, attendance, alumni, academicYears, holidays, headmaster, 
    subjects, subjectAttendance, googleScriptUrl
  });

  // --- SYNC LOGIC DEFINITION (Moved up to be used in effect) ---
  const syncToCloud = async (silent = false) => {
    const url = stateRef.current.googleScriptUrl;
    if (!url) return false;
    
    setIsSyncing(true);
    try {
      // PREPARE DATA FOR SHEET (Flatten Arrays/Objects)
      const teachersForSheet = stateRef.current.teachers.map(t => ({
        ...t,
        // Convert Array to String "1,2,3" for Spreadsheet storage
        accessibleClassIds: t.accessibleClassIds ? t.accessibleClassIds.join(',') : '',
        subjectIds: t.subjectIds ? t.subjectIds.join(',') : ''
      }));

      const payload = {
        action: 'write',
        data: {
          Students: stateRef.current.students,
          Teachers: teachersForSheet,
          Attendance: stateRef.current.attendance,
          Alumni: stateRef.current.alumni,
          Holidays: stateRef.current.holidays,
          AcademicYears: stateRef.current.academicYears,
          Headmaster: [stateRef.current.headmaster],
          Subjects: stateRef.current.subjects,
          SubjectAttendance: stateRef.current.subjectAttendance
        }
      };

      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      });
      
      const now = new Date().toLocaleString();
      setLastSync(now);
      if(!silent) console.log("Data sent to spreadsheet successfully");
      return true;
    } catch (e) {
      if (!silent) console.error("Sync Error", e);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Safe Trigger Function
  const triggerSave = () => {
    setPendingSave(true);
  };

  // Update Ref and Trigger Sync if Pending
  useEffect(() => {
    stateRef.current = { 
      students, teachers, attendance, alumni, academicYears, holidays, headmaster, 
      subjects, subjectAttendance, googleScriptUrl 
    };
    
    if (pendingSave) {
      syncToCloud(true);
      setPendingSave(false);
    }
  }, [students, teachers, attendance, alumni, academicYears, holidays, headmaster, subjects, subjectAttendance, googleScriptUrl, pendingSave]);

  // --- INITIALIZATION LOGIC ---
  useEffect(() => {
    const initializeApp = async () => {
      const saved = localStorage.getItem('absensi_app_data');
      
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.students) setStudents(parsed.students);
          if (parsed.teachers) setTeachers(parsed.teachers);
          if (parsed.attendance) setAttendance(parsed.attendance);
          if (parsed.alumni) setAlumni(parsed.alumni);
          if (parsed.academicYears) setAcademicYears(parsed.academicYears);
          if (parsed.holidays) setHolidays(parsed.holidays);
          if (parsed.headmaster) setHeadmaster(parsed.headmaster);
          if (parsed.subjects) setSubjects(parsed.subjects);
          if (parsed.subjectAttendance) setSubjectAttendance(parsed.subjectAttendance);
          if (parsed.googleScriptUrl) setGoogleScriptUrl(parsed.googleScriptUrl);
          if (parsed.lastSync) setLastSync(parsed.lastSync);
        } catch (e) { console.error("Failed to load local data", e); }
      }

      // Sync from cloud on init
      const scriptUrl = saved ? JSON.parse(saved).googleScriptUrl || DEFAULT_SCRIPT_URL : DEFAULT_SCRIPT_URL;
      if (scriptUrl) {
        setIsSyncing(true);
        try {
          await performSyncFromCloud(scriptUrl);
        } catch (e) {
          console.error("Auto-sync failed on startup:", e);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    initializeApp();
  }, []);

  // Save to Local Storage on every change
  useEffect(() => {
    localStorage.setItem('absensi_app_data', JSON.stringify({ 
      students, teachers, attendance, alumni, academicYears, holidays, headmaster, 
      subjects, subjectAttendance, googleScriptUrl, lastSync
    }));
  }, [students, teachers, attendance, alumni, academicYears, holidays, headmaster, subjects, subjectAttendance, googleScriptUrl, lastSync]);

  const login = (role: UserRole, data?: any) => {
    if (role === UserRole.ADMIN) {
      setCurrentUser({ role, name: 'Administrator' });
    } else if (role === UserRole.WALI_KELAS) {
      setCurrentUser({ 
        role, 
        id: data.id, 
        name: data.name, 
        classId: data.classId,
        accessibleClassIds: data.accessibleClassIds,
        subjectIds: data.subjectIds 
      });
    } else if (role === UserRole.ORANG_TUA) {
      setCurrentUser({ role, name: 'Orang Tua Siswa', id: data.nisn }); 
    }
  };

  const logout = () => setCurrentUser(null);

  // CRITICAL FIX: Use functional updates (prev => ...) to allow bulk operations in loops
  const addStudent = (s: Student) => setStudents(prev => [...prev, s]);
  const updateStudent = (s: Student) => setStudents(prev => prev.map(st => st.id === s.id ? s : st));
  const deleteStudent = (id: string) => setStudents(prev => prev.filter(s => s.id !== id));

  const moveToAlumni = (studentId: string, reason: AlumniReason, date: string) => {
    setStudents(prevStudents => {
      const student = prevStudents.find(s => s.id === studentId);
      if (!student) return prevStudents;
      
      const activeYear = academicYears.find(y => y.isActive)?.name || 'Unknown';
      const newAlumni: Alumni = {
        ...student,
        reason,
        dateLeft: date,
        lastClassId: student.classId,
        academicYear: activeYear
      };
      
      setAlumni(prevAlumni => [...prevAlumni, newAlumni]);
      return prevStudents.filter(s => s.id !== studentId);
    });
  };

  const promoteStudent = (id: string, newClassId: string, newYearId: string) => {
     setStudents(prev => prev.map(s => s.id === id ? { ...s, classId: newClassId } : s));
  };

  const markAttendance = (records: AttendanceRecord[]) => {
    setAttendance(prev => {
      // 1. Remove ANY existing record matching student+date (Effective Delete)
      const filtered = prev.filter(p => !records.some(r => r.studentId === p.studentId && r.date === p.date));
      // 2. Add new records ONLY if status is NOT NONE (Effective Insert)
      const validRecords = records.filter(r => r.status !== AttendanceStatus.NONE);
      return [...filtered, ...validRecords];
    });
  };

  // SUBJECT ACTIONS
  const addSubject = (s: Subject) => setSubjects(prev => [...prev, s]);
  const updateSubject = (s: Subject) => setSubjects(prev => prev.map(sub => sub.id === s.id ? s : sub));
  const deleteSubject = (id: string) => setSubjects(prev => prev.filter(s => s.id !== id));
  
  const markSubjectAttendance = (records: SubjectAttendanceRecord[]) => {
    setSubjectAttendance(prev => {
        const filtered = prev.filter(p => !records.some(r => 
            r.studentId === p.studentId && 
            r.date === p.date && 
            r.subjectId === p.subjectId
        ));
        const validRecords = records.filter(r => r.status !== AttendanceStatus.NONE);
        return [...filtered, ...validRecords];
    });
  };

  const updateHeadmaster = (h: Headmaster) => setHeadmaster(h);
  
  const addTeacher = (t: Teacher) => setTeachers(prev => [...prev, t]);
  const updateTeacher = (t: Teacher) => setTeachers(prev => prev.map(x => x.id === t.id ? t : x));
  const deleteTeacher = (id: string) => setTeachers(prev => prev.filter(x => x.id !== id));

  const setAcademicYear = (id: string) => {
    setAcademicYears(prev => prev.map(y => ({ ...y, isActive: y.id === id })));
  };

  const addAcademicYear = (name: string) => {
    setAcademicYears(prev => [...prev, { id: Date.now().toString(), name, isActive: false }]);
  };

  const deleteAcademicYear = (id: string) => {
    setAcademicYears(prev => prev.filter(y => y.id !== id));
  };

  const toggleHoliday = (h: Holiday) => setHolidays(prev => [...prev, h]);
  const deleteHoliday = (id: string) => setHolidays(prev => prev.filter(h => h.id !== id));

  const performSyncFromCloud = async (url: string) => {
    const response = await fetch(url, {
      method: 'POST', 
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'read' })
    });
    
    const data = await response.json();
    
    // --- DATE SANITIZER FUNCTION ---
    const sanitizeDate = (dateVal: any) => {
      if (!dateVal) return '';
      const s = String(dateVal);
      if (s.includes('T') && s.includes('Z')) {
         const d = new Date(s);
         d.setTime(d.getTime() + (12 * 60 * 60 * 1000));
         return d.toISOString().split('T')[0];
      }
      return s.split('T')[0];
    };
    
    if (data) {
      if (data.Students && Array.isArray(data.Students)) {
        setStudents(data.Students.map((s: any) => ({...s, classId: String(s.classId), nisn: String(s.nisn)})));
      }
      if (data.Teachers && Array.isArray(data.Teachers)) {
        setTeachers(data.Teachers.map((t: any) => ({
           ...t, 
           classId: t.classId ? String(t.classId) : '',
           // Deserialize string "1,2,3" back to array ['1','2','3']
           accessibleClassIds: t.accessibleClassIds ? String(t.accessibleClassIds).split(',') : [],
           subjectIds: t.subjectIds ? String(t.subjectIds).split(',') : []
        })));
      }
      
      // Apply Date Sanitizer to date-sensitive fields
      if (data.Attendance && Array.isArray(data.Attendance)) {
        setAttendance(data.Attendance.map((a: any) => ({ ...a, date: sanitizeDate(a.date) })));
      }
      if (data.Holidays && Array.isArray(data.Holidays)) {
         setHolidays(data.Holidays.map((h: any) => ({ ...h, date: sanitizeDate(h.date) })));
      }
      if (data.Alumni && Array.isArray(data.Alumni)) {
         setAlumni(data.Alumni.map((a: any) => ({ ...a, dateLeft: sanitizeDate(a.dateLeft) })));
      }

      if (data.AcademicYears && Array.isArray(data.AcademicYears)) setAcademicYears(data.AcademicYears);
      if (data.Headmaster && Array.isArray(data.Headmaster) && data.Headmaster[0]) setHeadmaster(data.Headmaster[0]);

      // --- SAFETY CHECK FOR SUBJECTS ---
      // Only overwrite local subjects if cloud has data, or if local is empty.
      // This prevents empty cloud data from wiping local work on refresh.
      if (data.Subjects && Array.isArray(data.Subjects)) {
          const localCount = stateRef.current.subjects.length;
          const cloudCount = data.Subjects.length;
          if (cloudCount > 0 || localCount === 0) {
              setSubjects(data.Subjects);
          }
      }

      // --- SAFETY CHECK FOR SUBJECT ATTENDANCE ---
      if (data.SubjectAttendance && Array.isArray(data.SubjectAttendance)) {
          const localCount = stateRef.current.subjectAttendance.length;
          const cloudCount = data.SubjectAttendance.length;
          if (cloudCount > 0 || localCount === 0) {
              setSubjectAttendance(data.SubjectAttendance.map((a: any) => ({ ...a, date: sanitizeDate(a.date) })));
          }
      }

      const now = new Date().toLocaleString();
      setLastSync(now);
      return true;
    }
    return false;
  };

  const syncFromCloud = async () => {
    const url = stateRef.current.googleScriptUrl;
    if (!url) return false;
    setIsSyncing(true);
    try {
      return await performSyncFromCloud(url);
    } catch (e) {
      console.error("Sync Error", e);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AppContext.Provider value={{
      students, teachers, attendance, academicYears, holidays, headmaster, currentUser, alumni,
      subjects, subjectAttendance,
      googleScriptUrl, lastSync, isSyncing,
      login, logout, addStudent, updateStudent, deleteStudent, promoteStudent, moveToAlumni,
      markAttendance, updateHeadmaster, addTeacher, updateTeacher, deleteTeacher,
      setAcademicYear, addAcademicYear, deleteAcademicYear, toggleHoliday, deleteHoliday,
      addSubject, updateSubject, deleteSubject, markSubjectAttendance,
      setGoogleScriptUrl, syncToCloud, syncFromCloud, triggerSave
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};
