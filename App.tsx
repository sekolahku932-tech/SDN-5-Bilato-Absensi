import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User, Role, Student } from './types';
import { getUsers, getStudents, initStorage } from './services/storageService';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';

// Pages
import StudentManagement from './pages/StudentManagement';
import MaterialManagement from './pages/MaterialManagement';
import StudentReading from './pages/StudentReading';
import Grading from './pages/Grading';
import UserManagement from './pages/UserManagement';
import CertificateSettings from './pages/CertificateSettings';

// Login Components
const LoginSelection = () => {
    const navigate = useNavigate();
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-senja-500 to-midnight-900 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-4xl w-full text-center">
                <div className="mb-8">
                    <h1 className="text-4xl font-extrabold text-senja-600 tracking-tight">SENJA DIGITAL</h1>
                    <h2 className="text-xl text-gray-600 mt-2 font-semibold">SD NEGERI 5 BILATO</h2>
                    <p className="text-gray-400 mt-4">Silakan pilih akses masuk Anda</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button 
                        onClick={() => navigate('/login/admin')}
                        className="group relative p-6 border-2 border-gray-100 rounded-xl hover:border-senja-400 hover:shadow-lg transition-all"
                    >
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Admin</h3>
                        <p className="text-sm text-gray-500 mt-1">Pengelola Sistem</p>
                    </button>

                    <button 
                        onClick={() => navigate('/login/teacher')}
                        className="group relative p-6 border-2 border-gray-100 rounded-xl hover:border-senja-400 hover:shadow-lg transition-all"
                    >
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Wali Kelas</h3>
                        <p className="text-sm text-gray-500 mt-1">Guru Kelas 1-6</p>
                    </button>

                    <button 
                         onClick={() => navigate('/login/student')}
                         className="group relative p-6 border-2 border-gray-100 rounded-xl hover:border-senja-400 hover:shadow-lg transition-all"
                    >
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">Siswa</h3>
                        <p className="text-sm text-gray-500 mt-1">Masuk dengan NISN</p>
                    </button>
                </div>
            </div>
        </div>
    );
};

const LoginForm = ({ role, onLogin }: { role: Role, onLogin: (u: User) => void }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (role === Role.STUDENT) {
                // Student Login Logic (NISN Only)
                const students = await getStudents();
                const student = students.find(s => s.nisn === username);
                if (student) {
                    onLogin({
                        id: student.nisn,
                        username: student.nisn,
                        name: student.name,
                        role: Role.STUDENT,
                        classGrade: student.classGrade
                    });
                } else {
                    setError('NISN tidak ditemukan.');
                }
            } else {
                // Admin/Teacher Login
                const users = await getUsers();
                const user = users.find(u => u.username === username && u.password === password && u.role === role);
                if (user) {
                    onLogin(user);
                } else {
                    setError('Username atau password salah.');
                }
            }
        } catch (err) {
            setError('Gagal terhubung ke database.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const roleLabel = role === Role.ADMIN ? 'Admin' : role === Role.TEACHER ? 'Wali Kelas' : 'Siswa';

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
                <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-senja-500 mb-4 flex items-center">
                    &larr; Kembali
                </button>
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login {roleLabel}</h2>
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {role === Role.STUDENT ? 'NISN' : 'Username'}
                        </label>
                        <input 
                            type="text" 
                            required 
                            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-senja-500 outline-none"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    {role !== Role.STUDENT && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="password" 
                                required 
                                className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-senja-500 outline-none"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    )}
                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className={`w-full bg-senja-600 text-white py-2 rounded hover:bg-senja-700 transition font-bold ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {isLoading ? 'Memuat...' : 'Masuk'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  // Check session on load
  useEffect(() => {
      initStorage(); // Ensure defaults
      const savedUser = localStorage.getItem('senja_session');
      if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (u: User) => {
      setUser(u);
      localStorage.setItem('senja_session', JSON.stringify(u));
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('senja_session');
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={!user ? <LoginSelection /> : <Navigate to="/app/dashboard" />} />
        
        <Route path="/login/admin" element={!user ? <LoginForm role={Role.ADMIN} onLogin={handleLogin} /> : <Navigate to="/app/dashboard" />} />
        <Route path="/login/teacher" element={!user ? <LoginForm role={Role.TEACHER} onLogin={handleLogin} /> : <Navigate to="/app/dashboard" />} />
        <Route path="/login/student" element={!user ? <LoginForm role={Role.STUDENT} onLogin={handleLogin} /> : <Navigate to="/app/dashboard" />} />

        <Route path="/app/*" element={
            user ? (
                <Layout user={user} onLogout={handleLogout}>
                    <Routes>
                        <Route path="dashboard" element={<Dashboard user={user} />} />
                        <Route path="students" element={<StudentManagement user={user} />} />
                        <Route path="materials" element={<MaterialManagement user={user} />} />
                        <Route path="read" element={<StudentReading user={user} />} />
                        <Route path="grading" element={<Grading user={user} />} />
                        <Route path="users" element={<UserManagement user={user} />} />
                        <Route path="settings" element={<CertificateSettings user={user} />} />
                        <Route path="*" element={<Navigate to="dashboard" />} />
                    </Routes>
                </Layout>
            ) : (
                <Navigate to="/" />
            )
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;