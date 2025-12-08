import React, { useState, useEffect } from 'react';
import { User, Role, Material, Question, Task } from '../types';
import { getMaterials, saveMaterial, deleteMaterial } from '../services/storageService';
import { generateReflectionQuestions } from '../services/geminiService';
import { Trash2, Edit, Plus, Sparkles, Video, FileText, Save, Loader, AlertCircle } from 'lucide-react';

interface Props { user: User; }

const MaterialManagement: React.FC<Props> = ({ user }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  
  // Modal & Notification State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Initial Empty State
  const emptyMaterial: Material = {
    id: '', title: '', classGrade: user.classGrade || '1', content: '', 
    mediaType: 'none', mediaUrl: '', questions: [], tasks: [], createdAt: ''
  };
  const [form, setForm] = useState<Material>(emptyMaterial);

  useEffect(() => { loadMaterials(); }, []);

  const loadMaterials = async () => {
    setLoading(true);
    const data = await getMaterials();
    setMaterials(data);
    setLoading(false);
  };

  const filteredMaterials = materials.filter(m => 
    (user.role === Role.TEACHER && m.classGrade === user.classGrade) || 
    (user.role === Role.ADMIN)
  );

  const handleEdit = (m: Material) => {
    // Defensive coding: ensure questions/tasks are valid arrays
    setForm({
      ...m,
      questions: Array.isArray(m.questions) ? m.questions : [],
      tasks: Array.isArray(m.tasks) ? m.tasks : []
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setProcessing(true);
    const toSave = { ...form, id: form.id || Date.now().toString(), createdAt: form.createdAt || new Date().toISOString() };
    await saveMaterial(toSave);
    
    // Optimistic Update
    setMaterials(prev => {
        const idx = prev.findIndex(m => m.id === toSave.id);
        if(idx >= 0) { const c = [...prev]; c[idx] = toSave; return c; }
        return [...prev, toSave];
    });

    setIsEditing(false);
    setForm(emptyMaterial);
    setProcessing(false);
  };

  const confirmDelete = async () => {
    if(deleteId) {
        setProcessing(true);
        await deleteMaterial(deleteId);
        
        // Optimistic
        setMaterials(prev => prev.filter(m => m.id !== deleteId));
        
        setDeleteId(null);
        setProcessing(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!form.content) {
        setErrorMsg("Isi konten bacaan terlebih dahulu agar AI bisa bekerja.");
        setTimeout(() => setErrorMsg(''), 4000);
        return;
    }
    setIsLoadingAI(true);
    const questionsText = await generateReflectionQuestions(form.content, form.classGrade);
    const newQuestions: Question[] = questionsText.map(q => ({ id: Math.random().toString(36).substr(2, 9), text: q }));
    setForm(prev => ({ ...prev, questions: [...(prev.questions || []), ...newQuestions] }));
    setIsLoadingAI(false);
  };

  const addQuestion = () => {
      setForm(prev => ({...prev, questions: [...(prev.questions || []), { id: Date.now().toString(), text: '' }]}));
  };

  const addTask = () => {
      setForm(prev => ({...prev, tasks: [...(prev.tasks || []), { id: Date.now().toString(), description: '' }]}));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Limit 2MB for Spreadsheet safety
      if (file.size > 2 * 1024 * 1024) {
          setErrorMsg("Ukuran file terlalu besar. Maksimal 2MB agar bisa disimpan di Spreadsheet.");
          setTimeout(() => setErrorMsg(''), 4000);
          return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, mediaUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Render List View
  if (!isEditing) {
    return (
        <div className="space-y-6 relative">
            {/* Delete Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-white p-6 rounded-lg w-full max-w-sm text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="font-bold text-lg mb-2">Hapus Bacaan?</h3>
                        <p className="text-gray-500 mb-6">Tindakan ini tidak bisa dibatalkan.</p>
                        <div className="flex gap-2">
                            <button onClick={() => setDeleteId(null)} className="flex-1 py-2 bg-gray-100 rounded hover:bg-gray-200">Batal</button>
                            <button onClick={confirmDelete} disabled={processing} className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700">Hapus</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Bahan Bacaan</h2>
                <button onClick={() => { setForm(emptyMaterial); setIsEditing(true); }} className="bg-senja-600 text-white px-4 py-2 rounded hover:bg-senja-700 flex items-center gap-2">
                    <Plus size={18} /> Tambah Bacaan
                </button>
            </div>
            
            {loading ? (
                <div className="p-10 text-center text-gray-500"><Loader className="animate-spin inline mr-2"/> Memuat bahan bacaan...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMaterials.map(m => (
                        <div key={m.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div className="h-32 bg-gray-200 flex items-center justify-center relative">
                                {m.mediaType === 'image' && m.mediaUrl ? (
                                    <img src={m.mediaUrl} className="w-full h-full object-cover" alt="cover" />
                                ) : (
                                    <FileText size={48} className="text-gray-400" />
                                )}
                                {m.mediaType === 'video' && <div className="absolute inset-0 bg-black/20 flex items-center justify-center"><Video className="text-white" size={32}/></div>}
                            </div>
                            <div className="p-4 flex-1">
                                <span className="text-xs font-bold text-senja-600 bg-senja-50 px-2 py-1 rounded">Kelas {m.classGrade}</span>
                                <h3 className="font-bold text-lg mt-2">{m.title}</h3>
                                <p className="text-gray-500 text-sm mt-1 line-clamp-3">{m.content}</p>
                            </div>
                            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                                <button onClick={() => handleEdit(m)} disabled={processing} className="text-blue-600 hover:text-blue-800"><Edit size={18} /></button>
                                <button onClick={() => setDeleteId(m.id)} disabled={processing} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                    {filteredMaterials.length === 0 && <p className="col-span-3 text-center text-gray-400 py-10">Belum ada bahan bacaan.</p>}
                </div>
            )}
        </div>
    );
  }

  // Render Edit Form
  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Editor Bahan Bacaan</h2>
            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-800">Batal</button>
        </div>

        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">Judul Bacaan</label>
                    <input className="w-full border p-2 rounded" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Contoh: Kisah Malin Kundang" />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Kelas</label>
                    <select className="w-full border p-2 rounded" value={form.classGrade} onChange={e => setForm({...form, classGrade: e.target.value})}>
                        {[1,2,3,4,5,6].map(c => <option key={c} value={String(c)}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Konten Bacaan (Teks)</label>
                <textarea rows={6} className="w-full border p-2 rounded" value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Tuliskan cerita atau materi di sini..." />
            </div>

            <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="font-bold mb-3 flex items-center gap-2"><Video size={18}/> Media Pendukung</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm block mb-1">Tipe Media</label>
                        <select className="w-full border p-2 rounded" value={form.mediaType} onChange={e => setForm({...form, mediaType: e.target.value as any, mediaUrl: ''})}>
                            <option value="none">Tidak Ada</option>
                            <option value="image">Gambar (Upload/URL)</option>
                            <option value="video">Video (Youtube URL)</option>
                            <option value="pdf">Dokumen PDF (Upload/URL)</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm block mb-1">
                            {form.mediaType === 'video' ? 'Link Youtube' : 'Upload File / Link URL'}
                        </label>
                        
                        {(form.mediaType === 'image' || form.mediaType === 'pdf') && (
                            <input 
                                type="file" 
                                accept={form.mediaType === 'image' ? "image/*" : "application/pdf"}
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-senja-50 file:text-senja-700 hover:file:bg-senja-100 mb-2"
                            />
                        )}

                        <input 
                            className="w-full border p-2 rounded" 
                            value={form.mediaUrl} 
                            onChange={e => setForm({...form, mediaUrl: e.target.value})} 
                            placeholder={form.mediaType === 'none' ? '-' : (form.mediaType === 'video' ? "https://youtube.com/..." : "URL atau Upload...")} 
                            disabled={form.mediaType === 'none'}
                        />
                        {form.mediaUrl && form.mediaUrl.startsWith('data:') && (
                            <p className="text-xs text-green-600 mt-1 truncate">File berhasil dimuat siap disimpan.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold">Soal Refleksi</h3>
                        <div className="flex gap-2">
                            <button onClick={addQuestion} className="bg-gray-200 p-1 rounded hover:bg-gray-300 flex items-center gap-1 text-xs"><Plus size={14}/> Tambah</button>
                            <button onClick={handleGenerateAI} disabled={isLoadingAI} className="bg-purple-100 text-purple-700 p-1 px-2 rounded hover:bg-purple-200 text-xs flex items-center gap-1">
                                {isLoadingAI ? '...' : <><Sparkles size={14}/> Bantu Buat Soal (AI)</>}
                            </button>
                        </div>
                    </div>
                    {errorMsg && <div className="text-red-500 text-xs mb-2 flex items-center gap-1"><AlertCircle size={12}/> {errorMsg}</div>}
                    <ul className="space-y-2 text-sm">
                        {(form.questions || []).map((q, idx) => (
                            <li key={q.id} className="flex gap-2 items-start bg-gray-50 p-2 rounded">
                                <span className="font-bold pt-1">{idx+1}.</span>
                                <input 
                                    className="flex-1 bg-transparent border-b border-dashed border-gray-300 outline-none focus:border-senja-500 py-1" 
                                    value={q.text} 
                                    placeholder="Tulis pertanyaan..."
                                    onChange={e => {
                                        const newQ = [...(form.questions || [])]; newQ[idx].text = e.target.value; setForm({...form, questions: newQ});
                                    }} 
                                    autoFocus={!q.text} // Autofocus on new empty question
                                />
                                <button onClick={() => setForm(p => ({...p, questions: p.questions.filter(x => x.id !== q.id)}))} className="text-red-400 hover:text-red-600 pt-1"><Trash2 size={14}/></button>
                            </li>
                        ))}
                        {(form.questions || []).length === 0 && <p className="text-gray-400 italic">Belum ada pertanyaan.</p>}
                    </ul>
                </div>

                <div className="border p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold">Tugas Siswa</h3>
                        <button onClick={addTask} className="bg-gray-200 p-1 rounded hover:bg-gray-300 flex items-center gap-1 text-xs"><Plus size={14}/> Tambah</button>
                    </div>
                    <ul className="space-y-2 text-sm">
                        {(form.tasks || []).map((t, idx) => (
                            <li key={t.id} className="flex gap-2 items-start bg-gray-50 p-2 rounded">
                                <span className="font-bold pt-1">{idx+1}.</span>
                                <input 
                                    className="flex-1 bg-transparent border-b border-dashed border-gray-300 outline-none focus:border-senja-500 py-1" 
                                    value={t.description} 
                                    placeholder="Deskripsi tugas..."
                                    onChange={e => {
                                        const newT = [...(form.tasks || [])]; newT[idx].description = e.target.value; setForm({...form, tasks: newT});
                                    }}
                                    autoFocus={!t.description}
                                />
                                <button onClick={() => setForm(p => ({...p, tasks: p.tasks.filter(x => x.id !== t.id)}))} className="text-red-400 hover:text-red-600 pt-1"><Trash2 size={14}/></button>
                            </li>
                        ))}
                         {(form.tasks || []).length === 0 && <p className="text-gray-400 italic">Belum ada tugas.</p>}
                    </ul>
                </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
                <button onClick={handleSave} disabled={processing} className="bg-senja-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-senja-700 flex items-center gap-2">
                    {processing ? <Loader className="animate-spin" size={20}/> : <Save size={20} />} Simpan Materi
                </button>
            </div>
        </div>
    </div>
  );
};

export default MaterialManagement;