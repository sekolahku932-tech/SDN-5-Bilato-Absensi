
import React, { useState, useEffect } from 'react';
import { useApp } from '../store';
import { User, Save } from 'lucide-react';

const Headmaster: React.FC = () => {
  const { headmaster, updateHeadmaster, triggerSave } = useApp();
  const [name, setName] = useState(headmaster.name);
  const [nip, setNip] = useState(headmaster.nip);

  useEffect(() => {
    setName(headmaster.name);
    setNip(headmaster.nip);
  }, [headmaster]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateHeadmaster({ name, nip });
    triggerSave();
    alert("Data Kepala Sekolah berhasil diperbarui.");
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">Data Kepala Sekolah</h1>
        <p className="text-gray-500">Atur informasi kepala sekolah untuk tanda tangan laporan</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full opacity-50"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-20 h-20 bg-blue-50 rounded-full opacity-50"></div>

        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 border-4 border-white shadow-lg">
            <User size={48} />
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap & Gelar</label>
            <input 
              type="text" required 
              className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Contoh: Drs. H. Ahmad Fauzi, M.Pd"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NIP</label>
            <input 
              type="text" required 
              className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={nip}
              onChange={e => setNip(e.target.value)}
              placeholder="19xxxxxxxx xxx x xxx"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
          >
            <Save size={20} /> Simpan Perubahan
          </button>
        </form>
      </div>
    </div>
  );
};

export default Headmaster;
