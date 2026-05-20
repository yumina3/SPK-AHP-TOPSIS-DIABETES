import React, { useState } from 'react';
import { CloudUpload, FileText, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PatientRecord } from '../types';

interface Props {
  onDataLoaded: (rows: Omit<PatientRecord, 'id' | 'riskClass' | 'ccValue' | 'dPlus' | 'dMinus'>[]) => void;
}

function detectDelimiter(line: string): string {
  const semicolonCount = (line.match(/;/g) || []).length;
  const commaCount = (line.match(/,/g) || []).length;
  return semicolonCount >= commaCount ? ';' : ',';
}

export interface ParsedRow extends Omit<PatientRecord, 'id' | 'riskClass' | 'ccValue' | 'dPlus' | 'dMinus'> {
  _rawClass?: string;
}

function parseCSV(text: string): (ParsedRow & { _rawClass: string })[] {
  const lines = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) throw new Error('File CSV kosong atau tidak valid.');
  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  return lines.slice(1).filter(l => l.trim()).map((line, idx) => {
    const vals = line.split(delimiter).map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    const nameCol = headers.find(h => h.includes('name') || h.includes('patient') || h.includes('nama'));
    const name = nameCol && obj[nameCol] ? String(obj[nameCol]) : `Pasien ${idx + 1}`;
    const classCol = headers.find(h => h === 'class' || h === 'kelas' || h === 'label');
    const rawClass = classCol ? obj[classCol] : '';
    const num = (key: string, ...aliases: string[]): number => {
      const val = obj[key] ?? obj[aliases.find(a => obj[a] !== undefined) ?? ''] ?? '0';
      return parseFloat(val.replace(',', '.')) || 0;
    };
    return { name, age: num('age','umur'), urea: num('urea'), cr: num('cr'), hba1c: num('hba1c'),
      chol: num('chol','cholesterol'), tg: num('tg','triglycerides'), hdl: num('hdl'),
      ldl: num('ldl'), vldl: num('vldl'), bmi: num('bmi'), _rawClass: rawClass };
  });
}

export default function UploadDataset({ onDataLoaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<ReturnType<typeof parseCSV>>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleFile = (f: File) => { setFile(f); setError(''); setDone(false); setPreview([]); setTotalRows(0); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) handleFile(f);
    else setError('Hanya file .csv yang diterima.');
  };

  const handleProcess = () => {
    if (!file) return;
    setIsProcessing(true); setProgress(0); setError('');
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length === 0) throw new Error('Data tidak ditemukan dalam file CSV.');
        setTotalRows(rows.length);
        let p = 0;
        const interval = setInterval(() => {
          p += 20; setProgress(p);
          if (p >= 100) {
            clearInterval(interval);
            setPreview(rows.slice(0, 5));
            setDone(true); setIsProcessing(false);
            onDataLoaded(rows.map(({ _rawClass, ...rest }) => rest));
          }
        }, 200);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Gagal memproses file.');
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
        className="bg-white p-12 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-col items-center text-center hover:border-indigo-400 transition-colors">
        <div className="bg-indigo-50 p-4 rounded-full mb-4 text-indigo-400">
          <CloudUpload size={48} />
        </div>
        <h3 className="text-lg font-bold text-indigo-900 mb-2">Upload File CSV Dataset</h3>
        <p className="text-sm text-violet-600/70 max-w-sm mb-2">Drag & drop file CSV ke sini, atau klik tombol di bawah.</p>
        <p className="text-xs text-indigo-500 font-bold mb-6">
          Kolom: <span className="font-mono">AGE, Urea, Cr, HbA1c, Chol, TG, HDL, LDL, VLDL, BMI, CLASS</span><br/>
          <span className="text-indigo-400 font-normal">Mendukung delimiter koma (,) maupun titik koma (;)</span>
        </p>
        <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" id="csv-upload" />
        <label htmlFor="csv-upload"
          className="bg-indigo-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-indigo-800 transition-all">
          Pilih File CSV
        </label>
        {file && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="mt-6 flex items-center gap-3 bg-indigo-50 p-3 rounded-xl w-full max-w-sm border border-indigo-100">
            <FileText size={20} className="text-indigo-600 shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-xs font-bold text-indigo-900 truncate">{file.name}</p>
              <p className="text-[10px] text-violet-600 uppercase tracking-wider">{(file.size/1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => { setFile(null); setPreview([]); setDone(false); setTotalRows(0); }}
              className="text-[10px] font-black text-red-500 uppercase hover:underline">Hapus</button>
          </motion.div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm font-bold text-red-700">{error}</p>
        </div>
      )}

      {file && !done && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <button onClick={handleProcess} disabled={isProcessing}
            className="w-full bg-indigo-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-black transition-colors">
            {isProcessing && <Loader2 size={16} className="animate-spin" />}
            {isProcessing ? 'Memproses & Menghitung AHP-TOPSIS...' : 'Proses Data & Jalankan AHP-TOPSIS'}
          </button>
          {isProcessing && (
            <div className="w-full bg-indigo-100 h-2 rounded-full overflow-hidden">
              <motion.div animate={{ width: `${progress}%` }} className="h-full bg-indigo-500 rounded-full" />
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
              <CheckCircle2 size={20} className="text-indigo-600 shrink-0" />
              <div>
                <p className="text-sm font-black text-indigo-900">Dataset berhasil diproses! ({totalRows.toLocaleString()} baris data)</p>
                <p className="text-xs text-violet-600">Perhitungan AHP-TOPSIS selesai. Anda diarahkan ke Dashboard.</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-indigo-100 overflow-hidden">
              <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Preview Data (5 Baris Pertama)</p>
                <p className="text-[10px] text-indigo-500 font-bold">Total: {totalRows.toLocaleString()} baris</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead className="bg-indigo-50/50">
                    <tr>{['No','Nama','AGE','Urea','Cr','HbA1c','Chol','TG','HDL','LDL','VLDL','BMI','CLASS'].map(h=>(
                      <th key={h} className="px-4 py-3 text-left font-black text-indigo-800 uppercase tracking-wider">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50">
                    {preview.map((p, i) => (
                      <tr key={i} className="hover:bg-indigo-50/30">
                        <td className="px-4 py-2.5 font-mono text-indigo-500">{i+1}</td>
                        <td className="px-4 py-2.5 font-bold text-indigo-900">{p.name}</td>
                        <td className="px-4 py-2.5">{p.age}</td><td className="px-4 py-2.5">{p.urea}</td>
                        <td className="px-4 py-2.5">{p.cr}</td><td className="px-4 py-2.5 font-bold">{p.hba1c}</td>
                        <td className="px-4 py-2.5">{p.chol}</td><td className="px-4 py-2.5">{p.tg}</td>
                        <td className="px-4 py-2.5">{p.hdl}</td><td className="px-4 py-2.5">{p.ldl}</td>
                        <td className="px-4 py-2.5">{p.vldl}</td><td className="px-4 py-2.5">{p.bmi}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider
                            ${p._rawClass?.toUpperCase()==='Y'?'bg-red-50 text-red-600':p._rawClass?.toUpperCase()==='P'?'bg-amber-50 text-amber-600':'bg-violet-50 text-violet-600'}`}>
                            {p._rawClass||'N'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}