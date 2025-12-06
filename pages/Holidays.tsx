
import React, { useState } from 'react';
import { useApp } from '../store';
import { Holiday } from '../types';
import { Plus, Trash2, Calendar, Upload, X } from 'lucide-react';

const Holidays: React.FC = () => {
  const { holidays, toggleHoliday, deleteHoliday, triggerSave } = useApp();
  const [date, setDate] = useState('');
  const [desc, setDesc] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && desc) {
      toggleHoliday({
        id: Date.now().toString(),
        date,
        description: desc
      });
      triggerSave();
      setDate('');
      setDesc('');
    }
  };

  const handleImport = () => {
    // Format: YYYY-MM-DD \t Description
    const lines = importText.trim().split('\n');
    let count = 0;
    lines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        // Simple validation for date format
        if (parts[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
            toggleHoliday({
                id: Date.now().toString() + Math.random(),
                date: parts[0],
                description: parts[1]
            });
            count++;
        }
      }
    });
    alert(`Berhasil mengimport ${count} hari libur.`);
    triggerSave();
    setImportText('');
    setShowImport(false);
  };

  // Sort holidays by date
  const sortedHolidays = [...holidays].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Hari Libur</h1>
          <p className="text-sm text-gray-500">Daftar hari libur nasional dan cuti bersama</p>
        </div>
        <button 
            onClick={() => setShowImport(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 text-sm"
          >
            <Upload size={16} /> Import Excel
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-4">
            <h3 className="font-bold text-gray-700 mb-4">Tambah Hari Libur</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
                <input 
                  type="date" required 
                  className="w-full border p-2 rounded-lg"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <input 
                  type="text" required placeholder="Contoh: Idul Fitri"
                  className="w-full border p-2 rounded-lg"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2">
                <Plus size={18} /> Simpan
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Keterangan</th>
                  <th className="p-4 text-center w-20">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedHolidays.map(h => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="p-4 whitespace-nowrap flex items-center gap-2">
                      <Calendar size={16} className="text-red-500" />
                      <span className="font-mono text-gray-700">
                        {new Date(h.date).toLocaleDateString('id-ID', { 
                          day: 'numeric', month: 'long', year: 'numeric' 
                        })}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{h.description}</td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => { deleteHoliday(h.id); triggerSave(); }}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedHolidays.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-gray-500">Belum ada data hari libur.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

       {/* Import Modal */}
       {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Import Hari Libur</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            <p className="text-sm text-gray-500 mb-2">
              Format: <strong>YYYY-MM-DD</strong> [Tab] <strong>Keterangan</strong>
            </p>
            <textarea 
              className="w-full h-40 border p-2 rounded text-sm font-mono mb-4" 
              placeholder={"2024-01-01\tTahun Baru Masehi\n2024-08-17\tHUT RI"}
              value={importText}
              onChange={e => setImportText(e.target.value)}
            />
            <button onClick={handleImport} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
              Proses Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Holidays;
