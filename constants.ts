

import { AcademicYear, Headmaster, Student, Teacher, Holiday, Subject } from './types';

// URL Script yang sudah di-hardcode agar langsung terhubung
export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyQqeFCj9CRsKL7bK9JmPkQxy9CUxPks11pRGzTb0CRglXyUIMWJQrnn4lXjTCz3dUBbw/exec';

// Menggunakan versi PNG yang lebih stabil daripada SVG
export const DEFAULT_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Logo_Tut_Wuri_Handayani.svg/512px-Logo_Tut_Wuri_Handayani.svg.png";

export const INITIAL_HEADMASTER: Headmaster = {
  name: "Drs. H. Ahmad Fauzi, M.Pd",
  nip: "19700101 199503 1 002"
};

export const INITIAL_YEARS: AcademicYear[] = [
  { id: '1', name: '2023/2024', isActive: true },
  { id: '2', name: '2024/2025', isActive: false },
];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: 't1', name: 'Budi Santoso, S.Pd', nip: '19850101 201001 1 001', classId: '1', username: 'guru1', password: '123' },
  { id: 't2', name: 'Siti Aminah, S.Pd', nip: '19880202 201101 2 002', classId: '2', username: 'guru2', password: '123' },
  { id: 'admin', name: 'Administrator', nip: '-', username: 'admin', password: 'admin' },
];

export const INITIAL_STUDENTS: Student[] = [
  { id: 's1', nisn: '0012345678', name: 'Ahmad Dani', gender: 'L', classId: '1', isActive: true, parentPhone: '628123456789' },
  { id: 's2', nisn: '0012345679', name: 'Bunga Citra', gender: 'P', classId: '1', isActive: true, parentPhone: '628123456780' },
  { id: 's3', nisn: '0012345680', name: 'Candra Wijaya', gender: 'L', classId: '2', isActive: true },
  { id: 's4', nisn: '0012345681', name: 'Dewi Persik', gender: 'P', classId: '6', isActive: true },
];

export const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'h1', date: '2024-05-01', description: 'Hari Buruh' },
  { id: 'h2', date: '2024-08-17', description: 'Kemerdekaan RI' },
];

export const INITIAL_SUBJECTS: Subject[] = [];

export const CLASS_LIST = ['1', '2', '3', '4', '5', '6'];
export const DAYS_OF_WEEK = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];