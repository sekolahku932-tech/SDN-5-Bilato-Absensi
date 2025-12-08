import React, { useMemo, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { getStudents, getMaterials, getSubmissions } from '../services/storageService';
import { Users, BookOpen, CheckCircle, Award, Loader } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
    <div className={`p-4 rounded-full ${color}`}>
      <Icon className="w-8 h-8 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({ students: [], materials: [], submissions: [] });

  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        const [students, materials, submissions] = await Promise.all([
            getStudents(),
            getMaterials(),
            getSubmissions()
        ]);
        setData({ students, materials, submissions });
        setLoading(false);
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const { students, materials, submissions } = data;
    let filteredStudents = students;
    let filteredMaterials = materials;
    let filteredSubmissions = submissions;

    if (user.role === Role.TEACHER && user.classGrade) {
      filteredStudents = students.filter((s: any) => s.classGrade === user.classGrade);
      filteredMaterials = materials.filter((m: any) => m.classGrade === user.classGrade);
      filteredSubmissions = submissions.filter((s: any) => s.classGrade === user.classGrade);
    }

    if (user.role === Role.STUDENT) {
        // Specific student stats
        filteredSubmissions = submissions.filter((s: any) => s.studentNisn === user.username);
        return {
            studentCount: 0, // Not relevant
            materialCount: materials.filter((m: any) => m.classGrade === user.classGrade).length,
            submissionCount: filteredSubmissions.length,
            approvedCount: filteredSubmissions.filter((s: any) => s.isApproved).length
        }
    }

    return {
      studentCount: filteredStudents.length,
      materialCount: filteredMaterials.length,
      submissionCount: filteredSubmissions.length,
      approvedCount: filteredSubmissions.filter((s: any) => s.isApproved).length
    };
  }, [data, user]);

  const chartData = useMemo(() => {
    // Simple distribution of students by class
    const counts: {[key: string]: number} = {};
    ['1', '2', '3', '4', '5', '6'].forEach(c => counts[c] = 0);
    data.students.forEach((s: any) => {
        if(counts[s.classGrade] !== undefined) counts[s.classGrade]++;
    });
    return Object.entries(counts).map(([grade, count]) => ({ name: `Kelas ${grade}`, siswa: count }));
  }, [data.students]);

  if (loading) return <div className="flex h-64 items-center justify-center text-senja-500"><Loader className="animate-spin mr-2"/> Memuat Data...</div>;

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Selamat Datang, {user.name} 👋</h2>
        <p className="text-gray-500 mt-2">Pantau perkembangan literasi digital sekolah hari ini.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {user.role !== Role.STUDENT && (
             <StatCard title="Total Siswa" value={stats.studentCount} icon={Users} color="bg-blue-500" />
        )}
        <StatCard title="Bahan Bacaan" value={stats.materialCount} icon={BookOpen} color="bg-senja-500" />
        <StatCard title="Refleksi Masuk" value={stats.submissionCount} icon={CheckCircle} color="bg-green-500" />
        <StatCard title="Sertifikat Terbit" value={stats.approvedCount} icon={Award} color="bg-purple-500" />
      </div>

      {user.role === Role.ADMIN && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-8">
            <h3 className="text-lg font-bold mb-4">Distribusi Siswa Per Kelas</h3>
            {/* Explicit sizing for Recharts container */}
            <div className="w-full h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="siswa" fill="#f97316" radius={[4, 4, 0, 0]} name="Jumlah Siswa" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;