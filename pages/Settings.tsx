
import React, { useState } from 'react';
import { useApp } from '../store';
import { Cloud, RefreshCw, CheckCircle, AlertTriangle, Download, Upload, Database, Info } from 'lucide-react';

const Settings: React.FC = () => {
  const { syncToCloud, syncFromCloud, isSyncing, lastSync } = useApp();
  const [statusMsg, setStatusMsg] = useState('');

  const handleManualSync = async () => {
    const success = await syncToCloud();
    if (success) {
      setStatusMsg('Backup Sukses! Data aman di Spreadsheet.');
    } else {
      setStatusMsg('Gagal terhubung. Cek koneksi internet.');
    }
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleRestore = async () => {
    if(window.confirm("PERHATIAN: Data di aplikasi ini akan ditimpa dengan data dari Spreadsheet. Lanjutkan?")) {
        const success = await syncFromCloud();
        if (success) {
            setStatusMsg('Restore Sukses! Data telah diperbarui.');
        } else {
            setStatusMsg('Gagal mengambil data.');
        }
        setTimeout(() => setStatusMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600">
           <Database size={28} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Database & Sinkronisasi</h1>
          <p className="text-sm text-gray-500">Pusat kontrol penyimpanan data sekolah</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Status Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Cloud size={20} className="text-blue-500" />
              Status Koneksi
            </h2>
            
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                <CheckCircle className="text-green-600 mt-1 shrink-0" size={20} />
                <div>
                    <p className="font-bold text-green-800">Terhubung ke Google Spreadsheet</p>
                    <p className="text-sm text-green-700 mt-1">
                        Sistem otomatis melakukan backup saat ada perubahan data.
                    </p>
                </div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                 <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Terakhir Disinkronkan</p>
                 <p className="text-lg font-mono text-gray-800 font-bold">{lastSync || "Belum pernah"}</p>
            </div>
        </div>

        {/* Action Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div>
                <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <RefreshCw size={20} className="text-orange-500" />
                Kontrol Manual
                </h2>
                <p className="text-sm text-gray-500 mb-6">
                    Gunakan tombol di bawah ini jika Anda ingin memaksa backup atau memulihkan data saat berganti perangkat.
                </p>
            </div>

            <div className="space-y-3">
                <button 
                    onClick={handleManualSync}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                    {isSyncing ? <RefreshCw className="animate-spin" size={20} /> : <Upload size={20} />}
                    <div className="text-left">
                        <span className="block font-bold text-sm">BACKUP DATA</span>
                        <span className="block text-[10px] opacity-80">Kirim data aplikasi ke Spreadsheet</span>
                    </div>
                </button>

                <button 
                    onClick={handleRestore}
                    disabled={isSyncing}
                    className="w-full flex items-center justify-center gap-3 bg-white text-gray-700 border border-gray-200 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    {isSyncing ? <RefreshCw className="animate-spin" size={20} /> : <Download size={20} />}
                    <div className="text-left">
                        <span className="block font-bold text-sm">PULIHKAN (RESTORE)</span>
                        <span className="block text-[10px] text-gray-500">Ambil data dari Spreadsheet ke sini</span>
                    </div>
                </button>
            </div>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl text-center font-medium animate-bounce shadow-sm ${statusMsg.includes('Gagal') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {statusMsg}
        </div>
      )}

      <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-sm text-blue-800">
         <Info className="shrink-0" size={20} />
         <p>
            <strong>Tips:</strong> Jika Anda membuka aplikasi ini di HP atau Laptop baru, data mungkin terlihat kosong. 
            Cukup tekan tombol <strong>"PULIHKAN (RESTORE)"</strong> di atas untuk menarik seluruh data sekolah dari Cloud.
         </p>
      </div>
    </div>
  );
};

export default Settings;
