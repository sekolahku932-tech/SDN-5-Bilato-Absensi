import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { saveCertBackground, getCertBackground, resetAllSubmissions } from '../services/storageService'; // Added resetAllSubmissions
import { Save, Check, Loader, AlertTriangle, Image as ImageIcon, Info, Trash2 } from 'lucide-react'; // Added Trash2

interface Props { user: User; }

const CertificateSettings: React.FC<Props> = ({ user }) => {
  const [bg, setBg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingImg, setProcessingImg] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getCertBackground();
      setBg(data);
      setLoading(false);
    };
    load();
  }, []);

  // Fungsi Kompresi Pintar (Rekursif)
  const smartCompress = (img: HTMLImageElement, quality: number, width: number): string => {
      const canvas = document.createElement('canvas');
      const scale = width / img.width;
      canvas.width = width;
      canvas.height = img.height * scale;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', quality);
  };

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let currentWidth = 800; 
                let currentQuality = 0.85; 
                let result = smartCompress(img, currentQuality, currentWidth);
                
                const MAX_CHARS = 250000; 

                let attempts = 0;
                while (result.length > MAX_CHARS && attempts < 10) {
                    currentWidth *= 0.9;
                    currentQuality -= 0.05;
                    if (currentQuality < 0.1) currentQuality = 0.1;
                    
                    result = smartCompress(img, currentQuality, currentWidth);
                    attempts++;
                }

                resolve(result);
            };
            img.onerror = (e) => reject(e);
        };
        reader.onerror = (e) => reject(e);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
          setError("Harap upload file gambar (JPG/PNG).");
          return;
      }
      
      try {
          setError(null);
          setProcessingImg(true);
          const finalBase64 = await processFile(file);
          setBg(finalBase64);
          setSaved(false);
          setProcessingImg(false);
      } catch (err: any) {
          console.error(err);
          setError("Gagal memproses gambar.");
          setProcessingImg(false);
      }
    }
  };

  const handleSaveCert = async () => {
    if (bg) {
        setSaving(true);
        try {
            await saveCertBackground(bg);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError("Gagal menyimpan ke database. Cek koneksi internet.");
        } finally {
            setSaving(false);
        }
    }
  };

  // --- Reset Data Handler ---
  const handleResetData = async () => {
      if (confirm("PERINGATAN KERAS:\n\nSemua data jawaban siswa (Refleksi & Tugas) akan DIHAPUS PERMANEN dari database.\nData yang sudah dihapus tidak bisa dikembalikan.\n\nApakah Anda yakin ingin mereset data?")) {
          setSaving(true);
          try {
              if (typeof resetAllSubmissions === 'function') {
                  await resetAllSubmissions();
                  alert("Data berhasil direset. Sistem sekarang bersih.");
                  window.location.reload(); 
              } else {
                  alert("Fungsi reset belum tersedia di sistem. Mohon update storageService.");
              }
          } catch (e) {
              alert("Gagal mereset data.");
          } finally {
              setSaving(false);
          }
      }
  };

  if (user.role !== Role.ADMIN) return <div>Akses Ditolak</div>;

  return (
    <div className="space-y-8 pb-20">
        <div>
            <h2 className="text-2xl font-bold mb-4">Pengaturan Sertifikat</h2>
            
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
                    <AlertTriangle size={20}/> {error}
                </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow max-w-2xl">
                <div className="mb-6">
                    <label className="block font-medium mb-2">Upload Background Sertifikat</label>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 flex items-center gap-2 font-medium transition">
                            <ImageIcon size={18}/> Pilih Gambar
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleFileChange} 
                                className="hidden"
                            />
                        </label>
                        <span className="text-xs text-gray-400">Gambar akan otomatis dioptimalkan.</span>
                    </div>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 min-h-[300px] relative">
                    {loading || processingImg ? (
                        <div className="flex flex-col items-center text-gray-500 gap-2">
                            <Loader className="animate-spin text-senja-500" size={32}/> 
                            <span>{processingImg ? "Mengoptimalkan Gambar..." : "Memuat..."}</span>
                        </div>
                    ) : bg ? (
                        <div className="w-full flex flex-col items-center">
                             <img src={bg} alt="Preview" className="max-w-full h-auto shadow-lg border mb-2" />
                             
                             <div className="bg-white px-3 py-1 rounded-full border text-xs font-mono flex items-center gap-2 shadow-sm">
                                <Info size={14} className="text-gray-400"/>
                                <span>Ukuran Data: </span>
                                <span className={bg.length > 250000 ? "text-yellow-600 font-bold" : "text-green-600 font-bold"}>
                                    {bg.length.toLocaleString()}
                                </span>
                                <span className="text-gray-400">chars (Sistem Chunking Aktif)</span>
                             </div>
                        </div>
                    ) : (
                        <div className="text-center text-gray-400">
                            <ImageIcon size={48} className="mx-auto mb-2 opacity-20"/>
                            <p>Belum ada background custom.</p>
                            <p className="text-xs">Menggunakan background default.</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 flex items-center gap-3 border-t pt-4">
                    <button 
                        onClick={handleSaveCert} 
                        disabled={saving || processingImg || !bg} 
                        className="bg-senja-600 text-white px-6 py-3 rounded-lg hover:bg-senja-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-sm transition transform active:scale-95"
                    >
                        {saving ? <Loader className="animate-spin" size={20}/> : <Save size={20}/>} 
                        {saving ? 'Menyimpan (Mungkin agak lama)...' : 'Simpan Background'}
                    </button>
                    {saved && (
                        <span className="text-green-600 font-bold flex items-center gap-1 animate-pulse bg-green-50 px-3 py-1 rounded-full border border-green-200">
                            <Check size={16}/> Tersimpan
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* --- DANGER ZONE SECTION (Reset Data) --- */}
        <div className="pt-8 border-t-2 border-gray-200 mt-12 mb-12">
            <h2 className="text-2xl font-bold mb-4 text-red-600 flex items-center gap-2">
                <AlertTriangle /> Zona Bahaya (Reset Data)
            </h2>
            <div className="bg-red-50 border border-red-200 p-6 rounded-xl shadow-sm max-w-2xl">
                <h3 className="font-bold text-red-800 mb-2">Hapus Semua Data Jawaban Siswa</h3>
                <p className="text-sm text-red-700 mb-4 leading-relaxed">
                    Tindakan ini akan <strong>MENGHAPUS SELURUH</strong> data pengumpulan tugas, jawaban refleksi, dan status kelulusan siswa dari Database. 
                    Gunakan fitur ini jika terjadi error pada status (misal: otomatis lulus) atau jika ingin memulai semester baru.
                    Data Siswa dan Bahan Bacaan <strong>TIDAK</strong> akan terhapus.
                </p>
                <button 
                    onClick={handleResetData}
                    disabled={saving}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 flex items-center gap-2 font-bold shadow transition transform hover:scale-105"
                >
                    {saving ? <Loader className="animate-spin" size={20}/> : <Trash2 size={20}/>}
                    {saving ? 'Sedang Menghapus...' : 'HAPUS SEMUA DATA JAWABAN'}
                </button>
            </div>
        </div>
    </div>
  );
};

export default CertificateSettings;