
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
  classId?: string; // If assigned as Homeroom
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
  academicYears: AcademicYear[];
  holidays: Holiday[];
  headmaster: Headmaster;
  currentUser: { role: UserRole; id?: string; name?: string; classId?: string } | null;
  
  // Sync State
  googleScriptUrl?: string;
  lastSync?: string;
  isSyncing?: boolean;
}
