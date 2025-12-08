export enum Role {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER', // Wali Kelas
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  username: string; // NISN for students, username for others
  name: string;
  role: Role;
  classGrade?: string; // For Teachers (assigned class) or Students (current class)
  password?: string; // Only for Admin/Teacher
}

export interface Student {
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  classGrade: string;
  parentName?: string;
  parentPhone?: string;
}

export interface Question {
  id: string;
  text: string;
}

export interface Task {
  id: string;
  description: string;
}

export interface Material {
  id: string;
  title: string;
  classGrade: string; // 1-6
  content: string; // Text content
  mediaType: 'image' | 'video' | 'pdf' | 'none';
  mediaUrl: string; // URL or Base64
  questions: Question[];
  tasks: Task[];
  createdAt: string;
}

export interface Submission {
  id: string;
  materialId: string;
  studentNisn: string;
  studentName: string;
  classGrade: string;
  answers: { questionId: string; answer: string }[];
  taskText?: string; // Jawaban tugas berupa teks
  taskFileUrl?: string; // Uploaded task evidence
  teacherNotes?: string;
  isApproved: boolean; // For certificate
  // Added approvalStatus to match usage in storageService
  approvalStatus?: string;
  submittedAt: string;
}

export interface AppState {
  currentUser: User | null;
}