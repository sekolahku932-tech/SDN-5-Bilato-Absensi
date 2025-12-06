import React, { useState } from 'react';
import { useApp } from '../store';
import { UserRole, AttendanceStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Users, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { students, attendance, academicYears, setAcademicYear, addAcademicYear, deleteHoliday, currentUser } = useApp();
  const [newYearName, setNewYearName] = useState('');

  const today = new Date().toISOString().split('T')[0];
  const activeYear = academicYears.find(y => y.isActive);

  // Filter students based on role
  const relevantStudents = currentUser?.role === UserRole.WALI_KELAS
    ? students.filter(s => s.classId === currentUser.classId && s.isActive)
    : students.filter(s => s.isActive);

  // Gender Stats
  const maleCount = relevantStudents.filter(s => s.gender === 'L').length;
  const femaleCount = relevantStudents.filter(s => s.gender === 'P').length;
  
  // Attendance Today Stats
  const attendanceToday = attendance.filter(a => a.date === today && relevantStudents.some(s => s.id === a.studentId));
  const hadir = attendanceToday.filter(a => a.status === AttendanceStatus.HADIR).length;
  const sakit = attendanceToday.filter(a => a.status === AttendanceStatus.SAKIT).length;
  const izin = attendanceToday.filter(a => a.status === AttendanceStatus.IZIN).length;
  const alpa = attendanceToday.filter(a => a.status === AttendanceStatus.ALPA).length;
  const belumAbsen = relevantStudents.length - (hadir + sakit + izin + alpa);

  const dataGender = [
    { name: 'Laki-Laki', value: maleCount, color: '#3B82F6' },
    { name: 'Perempuan', value: femaleCount, color: '#EC4899' },
  ];

  const dataAttendance = [
    { name: 'Hadir', value: hadir, color: '#22C55E' },
    { name: 'Sakit', value: sakit, color: '#EAB308' },
    { name: 'Izin', value: izin, color: '#3B82F6' },
    { name: 'Alpa', value: alpa, color: '#EF4444' },
    { name: 'Belum Absen', value: belumAbsen, color: '#9CA3AF' },
  ];

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div className={`p-3 rounded-full bg-${color}-100 text-${color}-600`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
           <p className="text-gray-500">Selamat datang, {currentUser?.name}</p>
        </div>
        
        {currentUser?.role === UserRole.ADMIN && (
          <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border">
            <select 
              className="bg-transparent text-sm outline-none border-r pr-2 mr-2"
              value={activeYear?.id}
              onChange={(e) => setAcademicYear(e.target.value)}
            >
              {academicYears.map(y => (
                <option key={y.id} value={y.id}>{y.name} {y.isActive ? '(Aktif)' : ''}</option>
              ))}
            </select>
            <input 
              type="text" 
              placeholder="Tahun Baru (2025/2026)" 
              className="text-sm outline-none w-32"
              value={newYearName}
              onChange={e => setNewYearName(e.target.value)}
            />
            <button 
              onClick={() => { if(newYearName) { addAcademicYear(newYearName); setNewYearName(''); } }}
              className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
            >
              +
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Siswa" value={relevantStudents.length} icon={Users} color="blue" />
        <StatCard title="Hadir Hari Ini" value={hadir} icon={CheckCircle} color="green" />
        <StatCard title="Tidak Hadir" value={sakit + izin + alpa} icon={XCircle} color="red" />
        <StatCard title="Belum Absen" value={belumAbsen} icon={Clock} color="gray" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4">Komposisi Siswa</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataGender} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {dataGender.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-700 mb-4">Kehadiran Hari Ini ({today})</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataAttendance} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                  {dataAttendance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;