import React, { useState } from 'react';
import { useApp } from '../store';
import { GraduationCap } from 'lucide-react';

const Alumni: React.FC = () => {
  const { alumni, academicYears } = useApp();
  // Get unique years from alumni data or academic years list
  const availableYears = Array.from(new Set([
    ...academicYears.map(y => y.name),
    ...alumni.map(a => a.academicYear)
  ])).filter(Boolean).sort().reverse();

  const [filterYear, setFilterYear] = useState<string>(availableYears[0] || '');

  const filteredAlumni = alumni.filter(a => filterYear ? a.academicYear === filterYear : true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
             <GraduationCap size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Daftar Alumni</h1>
            <p className="text-sm text-gray-500">Siswa Pindah, Tamat, Meninggal, atau Drop Out</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Pilih Tahun:</label>
          <select 
            value={filterYear} 
            onChange={e => setFilterYear(e.target.value)}
            className="border p-2 rounded-lg bg-gray-50 min-w-[150px]"
          >
            <option value="">Semua Tahun</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">NISN</th>
              <th className="p-4">Nama Siswa</th>
              <th className="p-4">Kelas Terakhir</th>
              <th className="p-4">Status / Keterangan</th>
              <th className="p-4">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredAlumni.map((s, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-sm text-gray-500">{s.nisn}</td>
                <td className="p-4 font-medium text-gray-800">{s.name}</td>
                <td className="p-4">Kelas {s.lastClassId}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                    ${s.reason === 'Tamat' ? 'bg-green-100 text-green-700' : 
                      s.reason === 'Pindah' ? 'bg-blue-100 text-blue-700' : 
                      s.reason === 'Meninggal' ? 'bg-gray-200 text-gray-700' : 
                      'bg-red-100 text-red-700'}`}>
                    {s.reason}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-600">
                   {new Date(s.dateLeft).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </td>
              </tr>
            ))}
            {filteredAlumni.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-400">
                  Tidak ada data alumni untuk tahun ajaran ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Alumni;
