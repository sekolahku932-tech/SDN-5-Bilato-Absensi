import { User, Role, Student, Material, Submission } from '../types';

// ================= CONFIGURATION =================
const KEYS = {
  USERS: 'senja_users_reset',
  STUDENTS: 'senja_students_reset',
  MATERIALS: 'senja_materials_reset',
  SETTINGS: 'senja_settings_reset',
};

// CACHE KEY FINAL RESET - MEMAKSA BROWSER LUPA SEMUA DATA LAMA
const SUBMISSION_CACHE_KEY = 'senja_submissions_FINAL_RESET';

// URL API Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwo-gzBtGM6-9cQeXOd4qsxFxAuprgpX0abHRwpGcemXQnAWLIsUax0hLs0ng6Mc6B7Dg/exec";

// ================= HELPERS =================

const getLocal = <T>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

const safeArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    } catch { return []; }
  }
  return [];
};

const apiFetch = async <T>(sheetName: string): Promise<T[]> => {
  const cacheKey = sheetName === 'Submissions' ? SUBMISSION_CACHE_KEY : `senja_${sheetName.toLowerCase()}_reset`;
  
  try {
    const res = await fetch(`${API_URL}?action=getAll&_t=${Date.now()}`);
    if (res.ok) {
      const json = await res.json();
      const data = json[sheetName.toLowerCase()];
      if (Array.isArray(data)) {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
      }
    }
  } catch (error) {
    console.warn(`Offline mode: Loading ${sheetName} from cache.`);
  }
  return getLocal(cacheKey);
};

const apiSave = async <T>(sheetName: string, data: T[]) => {
  const cacheKey = sheetName === 'Submissions' ? SUBMISSION_CACHE_KEY : `senja_${sheetName.toLowerCase()}_reset`;
  localStorage.setItem(cacheKey, JSON.stringify(data));

  try {
    await fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'save', sheet: sheetName, data: data })
    });
  } catch (error) {
    console.error("Sync error:", error);
  }
};

// ================= INITIALIZATION =================

const defaultAdmin: User = {
  id: 'admin-001', username: 'admin', password: 'admin', name: 'Administrator', role: Role.ADMIN, classGrade: ''
};

export const initStorage = async () => {
  const users = getLocal<User>(KEYS.USERS);
  if (users.length === 0) localStorage.setItem(KEYS.USERS, JSON.stringify([defaultAdmin]));
  
  // NUKE ALL OLD KEYS
  Object.keys(localStorage).forEach(key => {
      if (key.startsWith('senja_submissions') && key !== SUBMISSION_CACHE_KEY) {
          localStorage.removeItem(key);
      }
  });
};

initStorage();

// ================= DATA SERVICES =================

// Users, Students, Materials (Standard Logic)
export const getUsers = async (): Promise<User[]> => {
  const users = await apiFetch<User>('Users');
  return users.some(u => u.username === 'admin') ? users : [defaultAdmin, ...users];
};
export const saveUser = async (user: User) => {
  const list = getLocal<User>(KEYS.USERS);
  if (!list.find(u => u.username === 'admin')) list.unshift(defaultAdmin);
  const idx = list.findIndex(u => u.id === user.id);
  if (idx >= 0) list[idx] = user; else list.push(user);
  await apiSave('Users', list.map(u => ({ ...u, classGrade: u.classGrade || '' })));
};
export const deleteUser = async (id: string) => {
  if (id === 'admin-001') return;
  await apiSave('Users', getLocal<User>(KEYS.USERS).filter(u => u.id !== id).map(u => ({ ...u, classGrade: u.classGrade || '' })));
};

export const getStudents = async (): Promise<Student[]> => {
  const data = await apiFetch<Student>('Students');
  return data.map(s => ({ ...s, nisn: String(s.nisn), classGrade: String(s.classGrade) }));
};
export const saveStudent = async (student: Student) => {
  await saveStudentsBulk([student]);
};
export const saveStudentsBulk = async (newStudents: Student[]) => {
  const list = getLocal<Student>(KEYS.STUDENTS);
  const map = new Map(list.map(s => [s.nisn, s]));
  newStudents.forEach(s => map.set(s.nisn, s));
  await apiSave('Students', Array.from(map.values()).map(s => ({ ...s, nisn: String(s.nisn), classGrade: String(s.classGrade) })));
};
export const deleteStudent = async (nisn: string) => {
  await apiSave('Students', getLocal<Student>(KEYS.STUDENTS).filter(s => String(s.nisn) !== String(nisn)));
};

export const getMaterials = async (): Promise<Material[]> => {
  const data = await apiFetch<Material>('Materials');
  return data.map(m => ({
    ...m, id: String(m.id), classGrade: String(m.classGrade),
    questions: safeArray(m.questions), tasks: safeArray(m.tasks)
  }));
};
export const saveMaterial = async (material: Material) => {
  const list = getLocal<Material>(KEYS.MATERIALS);
  const idx = list.findIndex(m => String(m.id) === String(material.id));
  if (idx >= 0) list[idx] = material; else list.push(material);
  await apiSave('Materials', list.map(m => ({ ...m, id: String(m.id), classGrade: String(m.classGrade) })));
};
export const deleteMaterial = async (id: string) => {
  await apiSave('Materials', getLocal<Material>(KEYS.MATERIALS).filter(m => String(m.id) !== String(id)));
};

// --- SUBMISSIONS (CLEAN & STRICT LOGIC) ---
export const getSubmissions = async (): Promise<Submission[]> => {
  const data = await apiFetch<Submission>('Submissions');
  return data.map(s => {
    let status: 'APPROVED' | 'PENDING' = 'PENDING';
    
    // HANYA PERCAYA TEKS 'APPROVED' (Case Insensitive)
    if (s.approvalStatus && String(s.approvalStatus).trim().toUpperCase() === 'APPROVED') {
      status = 'APPROVED';
    }

    return {
      ...s,
      id: String(s.id),
      materialId: String(s.materialId),
      studentNisn: String(s.studentNisn),
      answers: safeArray(s.answers),
      taskText: s.taskText || '',
      taskFileUrl: s.taskFileUrl || '',
      teacherNotes: s.teacherNotes || '',
      approvalStatus: status
    };
  });
};

export const saveSubmission = async (sub: Submission) => {
  const list = getLocal<Submission>(SUBMISSION_CACHE_KEY);
  const idx = list.findIndex(s => String(s.id) === String(sub.id));
  
  // PENTING: Jangan merge object lama. Gunakan data baru yang bersih.
  const cleanSub: Submission = {
    id: String(sub.id),
    materialId: String(sub.materialId),
    studentNisn: String(sub.studentNisn),
    studentName: sub.studentName,
    classGrade: String(sub.classGrade),
    answers: sub.answers,
    taskText: sub.taskText || '',
    taskFileUrl: sub.taskFileUrl || '',
    teacherNotes: sub.teacherNotes || '',
    
    // Status dikunci sesuai input function
    approvalStatus: sub.approvalStatus === 'APPROVED' ? 'APPROVED' : 'PENDING',
    
    submittedAt: sub.submittedAt
  };

  if (idx >= 0) list[idx] = cleanSub; else list.push(cleanSub);

  // Normalisasi sebelum kirim ke API (Hanya kirim field yang diperlukan)
  const normalized = list.map(s => ({
    id: s.id,
    materialId: s.materialId,
    studentNisn: s.studentNisn,
    studentName: s.studentName,
    classGrade: s.classGrade,
    answers: JSON.stringify(s.answers), // Stringify for sheet
    taskText: s.taskText,
    taskFileUrl: s.taskFileUrl,
    teacherNotes: s.teacherNotes,
    approvalStatus: s.approvalStatus, // Kirim String Tegas
    submittedAt: s.submittedAt
  }));

  await apiSave('Submissions', normalized);
};

export const deleteSubmission = async (id: string) => {
  const list = getLocal<Submission>(SUBMISSION_CACHE_KEY).filter(s => String(s.id) !== String(id));
  
  const normalized = list.map(s => ({
    id: s.id,
    materialId: s.materialId,
    studentNisn: s.studentNisn,
    studentName: s.studentName,
    classGrade: s.classGrade,
    answers: JSON.stringify(s.answers),
    taskText: s.taskText,
    taskFileUrl: s.taskFileUrl,
    teacherNotes: s.teacherNotes,
    approvalStatus: s.approvalStatus,
    submittedAt: s.submittedAt
  }));

  await apiSave('Submissions', normalized);
};

// --- RESET DATA ---
export const resetAllSubmissions = async () => {
  localStorage.removeItem(SUBMISSION_CACHE_KEY);
  await apiSave('Submissions', []);
};

// --- SETTINGS ---
export const getSettings = async (): Promise<SettingItem[]> => apiFetch<SettingItem>('Settings');

export const getCertBackground = async (): Promise<string | null> => {
  const settings = await getSettings();
  const chunks = settings.filter(s => s.key.startsWith('certBg_chunk')).sort((a,b) => {
    return parseInt(a.key.replace('certBg_chunk','')) - parseInt(b.key.replace('certBg_chunk',''));
  });
  if (chunks.length > 0) return chunks.map(c => c.value).join('');
  return settings.find(s => s.key === 'certBg')?.value || null;
};

export const saveCertBackground = async (dataUrl: string) => {
  let settings = await apiFetch<SettingItem>('Settings');
  settings = settings.filter(s => !s.key.startsWith('certBg'));
  const CHUNK_SIZE = 45000;
  const chunks = Math.ceil(dataUrl.length / CHUNK_SIZE);
  for(let i=0; i<chunks; i++) {
    settings.push({ key: `certBg_chunk${i}`, value: dataUrl.substr(i*CHUNK_SIZE, CHUNK_SIZE) });
  }
  await apiSave('Settings', settings);
};