import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { User, Role } from '../types';
import { 
  Users, BookOpen, UserCheck, FileText, Settings, 
  LogOut, Home, GraduationCap, ClipboardList, Menu, X
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Tutup sidebar otomatis saat pindah halaman (UX Mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const isActive = (path: string) => location.pathname === path;

  const getMenuItems = () => {
    const items = [];
    
    // Dashboard common for all logged in
    items.push({ icon: Home, label: 'Dashboard', path: '/app/dashboard' });

    if (user.role === Role.ADMIN) {
      items.push({ icon: Users, label: 'Daftar Siswa', path: '/app/students' });
      items.push({ icon: BookOpen, label: 'Bahan Bacaan', path: '/app/materials' });
      items.push({ icon: ClipboardList, label: 'Periksa Hasil', path: '/app/grading' });
      items.push({ icon: UserCheck, label: 'Manajemen User', path: '/app/users' });
      items.push({ icon: Settings, label: 'Pengaturan', path: '/app/settings' });
    } else if (user.role === Role.TEACHER) {
      items.push({ icon: Users, label: `Siswa Kelas ${user.classGrade}`, path: '/app/students' });
      items.push({ icon: BookOpen, label: 'Input Bacaan', path: '/app/materials' });
      items.push({ icon: ClipboardList, label: 'Periksa Refleksi', path: '/app/grading' });
    } else if (user.role === Role.STUDENT) {
      items.push({ icon: BookOpen, label: 'Bacaan Saya', path: '/app/read' });
    }

    return items;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* MOBILE OVERLAY (Backdrop) */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-midnight-900 text-white flex flex-col shadow-xl 
            transform transition-transform duration-300 ease-in-out
            md:relative md:translate-x-0 
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="p-6 border-b border-gray-700 bg-midnight-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-senja-400">SENJA DIGITAL</h1>
            <p className="text-xs text-gray-400 mt-1">SD NEGERI 5 BILATO</p>
          </div>
          {/* Close Button Mobile Only */}
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-senja-500 flex items-center justify-center text-white font-bold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize truncate">{user.role === Role.TEACHER ? 'Wali Kelas' : user.role.toLowerCase()}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {getMenuItems().map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-senja-600 text-white shadow-md'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <item.icon size={20} className="shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-colors"
          >
            <LogOut size={20} className="shrink-0" />
            <span className="text-sm font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full">
        
        {/* MOBILE HEADER */}
        <header className="md:hidden bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="text-gray-600 hover:text-senja-600 p-1"
                >
                    <Menu size={28} />
                </button>
                <span className="font-bold text-gray-800">SENJA DIGITAL</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-senja-500 flex items-center justify-center text-white text-xs font-bold">
              {user.name.charAt(0)}
            </div>
        </header>

        {/* SCROLLABLE CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-gray-50 relative w-full">
          <div className="p-4 md:p-8 pb-20 md:pb-8 w-full max-w-full overflow-x-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;