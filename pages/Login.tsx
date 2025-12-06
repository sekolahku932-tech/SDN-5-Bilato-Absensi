
import React, { useState } from 'react';
import { useApp } from '../store';
import { UserRole } from '../types';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Users, GraduationCap, School } from 'lucide-react';
import { DEFAULT_LOGO_URL } from '../constants';

const Login: React.FC = () => {
  const { login, students, teachers } = useApp();
  const navigate = useNavigate();
  const [roleMode, setRoleMode] = useState<'ADMIN' | 'TEACHER' | 'PARENT' | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (roleMode === 'ADMIN') {
      if (username === 'admin' && password === 'admin') {
        login(UserRole.ADMIN);
        navigate('/');
      } else {
        setError('Username atau password salah');
      }
    } else if (roleMode === 'TEACHER') {
      const teacher = teachers.find(t => t.username === username && t.password === password);
      if (teacher) {
        login(UserRole.WALI_KELAS, teacher);
        navigate('/');
      } else {
        setError('Data guru tidak ditemukan');
      }
    } else if (roleMode === 'PARENT') {
      const student = students.find(s => s.nisn === username);
      if (student) {
        login(UserRole.ORANG_TUA, student);
        navigate('/parent-dashboard');
      } else {
        setError('NISN tidak ditemukan');
      }
    }
  };

  const CardBtn = ({ icon: Icon, title, onClick, color }: any) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-${color}-500 group w-full h-32`}
    >
      <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600 mb-3 group-hover:scale-110 transition-transform`}>
        <Icon size={24} />
      </div>
      <span className="font-semibold text-gray-700">{title}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden">
        
        {/* Left Side: Brand */}
        <div className="md:w-1/2 bg-blue-50 p-8 flex flex-col justify-center items-center text-center border-r border-blue-100">
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-6 shadow-lg p-2 overflow-hidden">
             {!imgError ? (
                <img 
                  src={DEFAULT_LOGO_URL} 
                  alt="Logo SDN 5 Bilato" 
                  className="w-full h-full object-contain"
                  onError={() => setImgError(true)}
                />
             ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-600">
                    <School size={80} />
                </div>
             )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">SD NEGERI 5 BILATO</h1>
          <p className="text-gray-500 mb-8">Sistem Absensi Digital Terpadu</p>
          <div className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} SDN 5 Bilato
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="md:w-1/2 p-8 flex flex-col justify-center">
          {!roleMode ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-700 text-center mb-6">Pilih Masuk Sebagai</h2>
              <div className="grid grid-cols-2 gap-4">
                <CardBtn icon={User} title="Admin" color="blue" onClick={() => setRoleMode('ADMIN')} />
                <CardBtn icon={Users} title="Wali Kelas" color="green" onClick={() => setRoleMode('TEACHER')} />
                <div className="col-span-2">
                  <CardBtn icon={User} title="Orang Tua (NISN)" color="orange" onClick={() => setRoleMode('PARENT')} />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-700">
                  Login {roleMode === 'PARENT' ? 'Orang Tua' : roleMode === 'TEACHER' ? 'Guru' : 'Admin'}
                </h2>
                <button type="button" onClick={() => setRoleMode(null)} className="text-sm text-blue-600 hover:underline">
                  Kembali
                </button>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {roleMode === 'PARENT' ? 'NISN Siswa' : 'Username'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                    placeholder={roleMode === 'PARENT' ? 'Contoh: 00123...' : 'Masukkan username'}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {roleMode !== 'PARENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock size={18} className="text-gray-400" />
                    </div>
                    <input
                      type="password"
                      required
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-shadow"
                      placeholder="Masukkan password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
              >
                Masuk Aplikasi
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;