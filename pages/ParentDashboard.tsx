
import React, { useState } from 'react';
import { useApp } from '../store';
import { UserRole, AttendanceStatus } from '../types';
import { Navigate } from 'react-router-dom';
import { User, Calendar, CheckCircle, XCircle, Clock, AlertCircle, Search } from 'lucide-react';

const ParentDashboard: React.FC = () => {
  const { currentUser, attendance, students, academicYears, holidays } = useApp();
  
  // State untuk Filter Bulan & Tahun
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  if (currentUser?.role !== UserRole.ORANG_TUA) return <Navigate to="/login" />;
  
  // Cari data detail siswa berdasarkan NISN (yang tersimpan di currentUser.id)
  const student = students.find(s => s.nisn === currentUser.id);
  const activeYear = academicYears.find(y => y.isActive)?.name || '-';

  if (!student) {
    return (
      <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl m-4 border border-red-200">
        <AlertCircle className="mx-auto mb-2" size={32} />
        <h2 className="font-bold">Data Siswa Tidak Ditemukan</h2>
        <p>Mohon hubungi admin sekolah untuk memverifikasi NISN Anda.</p>
      </div>
    );
  }

  // Filter Absensi berdasarkan Siswa, Bulan, dan Tahun
  const monthlyRecords = attendance.filter(a => {
    const d = new Date(a.date);
    return a.studentId === student.id && 
           d.getMonth() + 1 === selectedMonth && 
           d.getFullYear() === selectedYear;
  });

  // Urutkan dari tanggal terbaru
  monthlyRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Hitung Statistik
  const h = monthlyRecords.filter(a => a.status === AttendanceStatus.HADIR).length;
  const s = monthlyRecords.filter(a => a.status === AttendanceStatus.SAKIT).length;
  const i = monthlyRecords.filter(a => a.status === AttendanceStatus.IZIN).length;
  const a = monthlyRecords.filter(a => a.status === AttendanceStatus.ALPA).length;

  const monthName = new Date(0, selectedMonth - 1).toLocaleString('id-ID', { month: 'long' });

  // Komponen Helper untuk Status Badge
  const StatusBadge = ({ status }: { status: string }) => {
    let color = 'bg-gray-100 text-gray-600';
    let label = '-';
    if (status === AttendanceStatus.HADIR) { color = 'bg-green-100 text-green-700'; label = 'Hadir'; }
    if (status === AttendanceStatus.SAKIT) { color = 'bg-yellow-100 text-yellow-700'; label = 'Sakit'; }
    if (status === AttendanceStatus.IZIN) { color = 'bg-blue-100 text-blue-700'; label = 'Izin'; }
    if (status === AttendanceStatus.ALPA) { color = 'bg-red-100 text-red-700'; label = 'Alpa'; }
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${color}`}>
        {label}
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      
      {/* 1. KARTU IDENTITAS SISWA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-white opacity-10 rounded-full"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center border-2 border-white/50 text-white shadow-inner">
             <User size={40} />
          </div>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-2xl font-bold">{student.name}</h1>
            <div className="flex flex-col md:flex-row md:gap-6 text-blue-100 text-sm mt-1">
              <span className="font-mono bg-blue-900/30 px-2 py-0.5 rounded">NISN: {student.nisn}</span>
              <span className="font-semibold">Kelas: {student.classId}</span>
              <span>TP: {activeYear}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER BULAN & TAHUN */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-700 font-medium">
          <Calendar className="text-blue-600" size={20} />
          <span>Periode Laporan</span>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="flex-1 border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {Array.from({length: 12}, (_, i) => (
              <option key={i} value={i+1}>{new Date(0, i).toLocaleString('id-ID', {month: 'long'})}</option>
            ))}
          </select>
          <input 
            type="number" 
            value={selectedYear} 
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="w-24 border p-2 rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none text-center"
          />
        </div>
      </div>

      {/* 3. RINGKASAN STATISTIK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-green-600 mb-1">{h}</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Hadir</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-yellow-100 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-yellow-600 mb-1">{s}</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sakit</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-blue-100 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-blue-600 mb-1">{i}</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Izin</span>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-red-600 mb-1">{a}</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Alpa</span>
        </div>
      </div>

      {/* 4. DAFTAR RIWAYAT HARIAN */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-700">Riwayat {monthName} {selectedYear}</h3>
          <span className="text-xs bg-white border px-2 py-1 rounded text-gray-500">
            Total: {monthlyRecords.length} Hari
          </span>
        </div>
        
        <div className="divide-y">
          {monthlyRecords.length > 0 ? (
            monthlyRecords.map((rec) => (
              <div key={rec.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-lg text-gray-500">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(rec.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                    {/* Cek apakah hari libur (opsional, jika ingin menampilkan info libur di list) */}
                    {holidays.find(h => h.date === rec.date) && (
                       <span className="text-[10px] text-red-500 block">Hari Libur Nasional</span>
                    )}
                  </div>
                </div>
                <StatusBadge status={rec.status} />
              </div>
            ))
          ) : (
            <div className="p-10 text-center flex flex-col items-center text-gray-400">
              <Search size={48} className="mb-2 opacity-20" />
              <p>Belum ada data absensi untuk periode ini.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ParentDashboard;
