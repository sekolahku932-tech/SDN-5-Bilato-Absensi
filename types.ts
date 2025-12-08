
export enum UserRole {
  ADMIN = 'ADMIN',
  WALI_KELAS = 'WALI_KELAS',
  ORANG_TUA = 'ORANG_TUA'
}

export enum AttendanceStatus {
  HADIR = 'H',
  SAKIT = 'S',
  IZIN = 'I',
  ALPA = 'A',
  LIBUR = 'L',
  NONE = '-'
}

export enum AlumniReason {
  PINDAH = 'Pindah',
  TAMAT = 'Tamat',
  MENINGGAL = 'Meninggal',
  DROPOUT = 'Drop Out'
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  classId: string; // '1', '2', ..., '6'
  parentPhone?: string;
  isActive: boolean;
}

export interface Alumni extends Omit<Student, 'isActive'> {
  reason: AlumniReason;
  dateLeft: string;
  lastClassId: string;
  academicYear: string;
}

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  classId?: string; // If assigned as Homeroom (Wali Kelas)
  accessibleClassIds?: string[]; // NEW: For Subject Teachers accessing multiple classes
  subjectIds?: string[]; // NEW: Assigned subjects for Subject Teachers
  username?: string;
  password?: string;
}

export interface Headmaster {
  name: string;
  nip: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  academicYear: string;
}

// --- NEW SUBJECT TYPES ---
export interface SubjectSchedule {
  day: string; // "Senin", "Selasa", etc.
  classIds: string[]; // ["1", "2"] classes that have this subject on this day
}

export interface Subject {
  id: string;
  name: string;
  schedule?: SubjectSchedule[]; // Array of schedules
}

export interface SubjectAttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  date: string;
  status: AttendanceStatus;
  academicYear: string;
}
// -------------------------

export interface AcademicYear {
  id: string;
  name: string; // e.g., "2023/2024"
  isActive: boolean;
}

export interface Holiday {
  id: string;
  date: string;
  description: string;
}

export interface AppState {
  students: Student[];
  alumni: Alumni[];
  teachers: Teacher[];
  attendance: AttendanceRecord[];
  
  // New States
  subjects: Subject[];
  subjectAttendance: SubjectAttendanceRecord[];

  academicYears: AcademicYear[];
  holidays: Holiday[];
  headmaster: Headmaster;
  currentUser: { 
    role: UserRole; 
    id?: string; 
    name?: string; 
    classId?: string;
    accessibleClassIds?: string[]; // Added here too for context
    subjectIds?: string[]; // Added for context
  } | null;
  
  // Sync State
  googleScriptUrl?: string;
  lastSync?: string;
  isSyncing?: boolean;
}
