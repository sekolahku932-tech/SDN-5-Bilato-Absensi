
import React, { useState } from 'react';
import { useApp } from '../store';
import { UserRole } from '../types';
import { DEFAULT_LOGO_URL } from '../constants';
import { 
  LayoutDashboard, Users, UserCheck, Calendar, GraduationCap, 
  Settings, LogOut, Menu, X, FileText, UserCog, Cloud, RefreshCw, Clock, Database, School
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, academicYears, isSyncing, lastSync } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const location = useLocation();

  const activeYear = academicYears.find(y => y.isActive)?.name || "N/A";

  const MenuItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <Link 
      to={to} 
      onClick={() => setIsOpen(false)}
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        location.pathname === to ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-blue-50'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </Link>
  );

  if (!currentUser) return <>{children}</>;

  const isParent = currentUser.role === UserRole.ORANG_TUA;
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isTeacher = currentUser.role === UserRole.WALI_KELAS;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b flex flex-col items-center text-center">
          
          <div className="relative w-24 h-24 mb-3 flex items-center justify-center">
             {!imgError ? (
                <img 
                  src={DEFAULT_LOGO_URL} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  onError={() => setImgError(true)}
                />
             ) : (
                <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border-4 border-white shadow-sm">
                   <School size={48} />
                </div>
             )}
          </div>

          <h1 className="text-xl font-bold text-blue-700 leading-tight">SDN 5 BILATO</h1>
          <p className="text-xs text-gray-500 mt-1">Sistem Absensi Terpadu</p>
          <div className="mt-4 px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full inline-block">
            TP: {activeYear}
          </div>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-220px)]">
          {!isParent && <MenuItem to="/" icon={LayoutDashboard} label="Dashboard" />}
          
          {(isAdmin || isTeacher) && (
            <>
              <MenuItem to="/students" icon={Users} label="Data Siswa" />
              <MenuItem to="/attendance" icon={UserCheck} label="Absensi Harian" />
              <MenuItem to="/report" icon={FileText} label="Laporan Bulanan" />
            </>
          )}

          {isAdmin && (
             <>
               <MenuItem to="/teachers" icon={UserCog} label="Wali Kelas & Guru" />
               <MenuItem to="/academic-years" icon={Clock} label="Tahun Pelajaran" />
               <MenuItem to="/holidays" icon={Calendar} label="Hari Libur" />
               <MenuItem to="/headmaster" icon={Settings} label="Data Kepala Sekolah" />
               <MenuItem to="/users" icon={Users} label="Manajemen User" />
             </>
          )}

          {(isAdmin || isTeacher) && (
            <>
              <MenuItem to="/alumni" icon={GraduationCap} label="Daftar Alumni" />
              <MenuItem to="/settings" icon={Database} label="Database & Sync" />
            </>
          )}

          {isParent && (
            <>
              <MenuItem to="/parent-dashboard" icon={UserCheck} label="Info Siswa" />
            </>
          )}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t bg-white">
          <div className="mb-2 text-sm text-gray-600 font-medium truncate">
            {currentUser.name}
          </div>
          <button 
            onClick={logout}
            className="flex items-center space-x-2 text-red-600 hover:text-red-700 w-full px-2 py-2 hover:bg-red-50 rounded"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white shadow-sm z-10 p-4 flex justify-between items-center">
          <div className="flex items-center">
             <button onClick={() => setIsOpen(!isOpen)} className="text-gray-600 md:hidden mr-4">
               {isOpen ? <X /> : <Menu />}
             </button>
             <span className="font-bold text-gray-700 md:hidden">Menu</span>
          </div>
          <div className="flex items-center gap-4">
            {isSyncing ? (
              <span className="flex items-center space-x-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                <RefreshCw size={12} className="animate-spin" />
                <span>Syncing...</span>
              </span>
            ) : lastSync ? (
              <span className="hidden md:flex items-center space-x-2 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200" title={`Last synced: ${lastSync}`}>
                <Cloud size={12} />
                <span>Synced</span>
              </span>
            ) : null}
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-200">
              ● Sistem Aktif
            </span>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;