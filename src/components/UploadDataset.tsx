import React, { useState, useCallback } from 'react';
import {
  CloudUpload, FileText, CheckCircle2, Loader2, AlertTriangle,
  UserPlus, FlaskConical, Activity, ChevronDown, ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PatientRecord } from '../types';
import { AHP_CRITERIA_DATA } from '../constants';
import { runTopsis } from '../utils/topsis';

// ─── Types ────────────────────────────────────────────────────────────────────
type RawNumerics = Pick<PatientRecord, 'age' | 'urea' | 'cr' | 'hba1c' | 'chol' | 'tg' | 'hdl' | 'ldl' | 'vldl' | 'bmi'>;
type NumericKey  = keyof RawNumerics;
type FormValues  = { name: string } & Record<NumericKey, string>;

export interface ParsedRow extends Omit<PatientRecord, 'id' | 'riskClass' | 'ccValue' | 'dPlus' | 'dMinus'> {
  _rawClass?: string;
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────
function detectDelimiter(line: string): string {
  return (line.match(/;/g) || []).length >= (line.match(/,/g) || []).length ? ';' : ',';
}

function parseCSV(text: string): (ParsedRow & { _rawClass: string })[] {
  const lines = text.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) throw new Error('File CSV kosong atau tidak valid.');
  const delimiter = detectDelimiter(lines[0]);
  const headers   = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  return lines.slice(1).filter(l => l.trim()).map((line, idx) => {
    const vals = line.split(delimiter).map(v => v.trim());
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    const nameCol  = headers.find(h => h.includes('name') || h.includes('patient') || h.includes('nama'));
    const name     = nameCol && obj[nameCol] ? String(obj[nameCol]) : `Pasien ${idx + 1}`;
    const classCol = headers.find(h => h === 'class' || h === 'kelas' || h === 'label');
    const rawClass = classCol ? obj[classCol] : '';
    const num = (key: string, ...aliases: string[]): number => {
      const val = obj[key] ?? obj[aliases.find(a => obj[a] !== undefined) ?? ''] ?? '0';
      return parseFloat(val.replace(',', '.')) || 0;
    };
    return {
      name, age: num('age','umur'), urea: num('urea'), cr: num('cr'), hba1c: num('hba1c'),
      chol: num('chol','cholesterol'), tg: num('tg','triglycerides'), hdl: num('hdl'),
      ldl: num('ldl'), vldl: num('vldl'), bmi: num('bmi'), _rawClass: rawClass,
    };
  });
}

// ─── AHP-TOPSIS manual engine ─────────────────────────────────────────────────
const TOPSIS_KEYS: NumericKey[] = ['hba1c','bmi','urea','cr','age','chol','tg','hdl','ldl','vldl'];
const THRESHOLD_T1 = 0.3104;
const THRESHOLD_T2 = 0.3550;

function medianOf(arr: number[]): number {
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[m - 1] + s[m]) / 2 : s[m];
}
function iqrBounds(arr: number[]): [number, number] {
  const s = [...arr].sort((a, b) => a - b);
  const q1 = s[Math.floor(s.length * 0.25)];
  const q3 = s[Math.floor(s.length * 0.75)];
  const iqr = q3 - q1;
  return [q1 - 1.5 * iqr, q3 + 1.5 * iqr];
}
function classifyCC(cc: number): PatientRecord['riskClass'] {
  if (cc >= THRESHOLD_T2) return 'Diabetic';
  if (cc >= THRESHOLD_T1) return 'Predicted Diabetic';
  return 'Non-Diabetic';
}

function computePatientCC(
  patient: RawNumerics,
  existingRows: PatientRecord[]
): { cc: number; dPlus: number; dMinus: number } {
  const allRows: RawNumerics[] = [
    ...existingRows.map(r => ({
      age: r.age, urea: r.urea, cr: r.cr, hba1c: r.hba1c,
      chol: r.chol, tg: r.tg, hdl: r.hdl, ldl: r.ldl, vldl: r.vldl, bmi: r.bmi,
    })),
    patient,
  ];

  const cleaned: RawNumerics[] = allRows.map(r => ({ ...r }));
  for (const key of TOPSIS_KEYS) {
    const vals = cleaned.map(r => r[key]);
    const med  = medianOf(vals);
    const [lo, hi] = iqrBounds(vals);
    for (const r of cleaned) {
      if (r[key] < lo || r[key] > hi) (r as Record<string, number>)[key] = med;
    }
  }

  const colNorms = TOPSIS_KEYS.map(k => {
    const col = cleaned.map(r => r[k]);
    return Math.sqrt(col.reduce((s, v) => s + v * v, 0));
  });

  const weighted = cleaned.map(r =>
    TOPSIS_KEYS.map((k, j) => {
      const norm = colNorms[j] === 0 ? 0 : r[k] / colNorms[j];
      return norm * AHP_CRITERIA_DATA[j].weight;
    })
  );

  const pis = TOPSIS_KEYS.map((_, j) => {
    const col = weighted.map(r => r[j]);
    return AHP_CRITERIA_DATA[j].type === 'Benefit' ? Math.max(...col) : Math.min(...col);
  });
  const nis = TOPSIS_KEYS.map((_, j) => {
    const col = weighted.map(r => r[j]);
    return AHP_CRITERIA_DATA[j].type === 'Benefit' ? Math.min(...col) : Math.max(...col);
  });

  const newRow = weighted[weighted.length - 1];
  const dPlus  = Math.sqrt(newRow.reduce((s, v, j) => s + (v - pis[j]) ** 2, 0));
  const dMinus = Math.sqrt(newRow.reduce((s, v, j) => s + (v - nis[j]) ** 2, 0));
  const cc     = dPlus + dMinus === 0 ? 0 : dMinus / (dPlus + dMinus);
  return { cc, dPlus, dMinus };
}

// ─── Field metadata ───────────────────────────────────────────────────────────
const FIELDS: { key: NumericKey; label: string; unit: string; min: number; max: number; step: number; placeholder: string }[] = [
  { key: 'age',   label: 'AGE',               unit: 'tahun', min: 20,  max: 79,  step: 1,   placeholder: '20 – 79'   },
  { key: 'urea',  label: 'Urea',              unit: 'mg/dL', min: 10,  max: 490, step: 0.1, placeholder: '10 – 490'  },
  { key: 'cr',    label: 'Cr (Creatinine)',   unit: 'mg/dL', min: 0.5, max: 8,   step: 0.1, placeholder: '0.5 – 8'  },
  { key: 'hba1c', label: 'HbA1c',            unit: '%',     min: 2,   max: 16,  step: 0.1, placeholder: '2 – 16'   },
  { key: 'chol',  label: 'Cholesterol',       unit: 'mg/dL', min: 100, max: 400, step: 1,   placeholder: '100 – 400' },
  { key: 'tg',    label: 'Triglycerides (TG)',unit: 'mg/dL', min: 35,  max: 800, step: 1,   placeholder: '35 – 800'  },
  { key: 'hdl',   label: 'HDL',              unit: 'mg/dL', min: 15,  max: 100, step: 1,   placeholder: '15 – 100'  },
  { key: 'ldl',   label: 'LDL',              unit: 'mg/dL', min: 30,  max: 280, step: 1,   placeholder: '30 – 280'  },
  { key: 'vldl',  label: 'VLDL',             unit: 'mg/dL', min: 5,   max: 50,  step: 1,   placeholder: '5 – 50'   },
  { key: 'bmi',   label: 'BMI',              unit: 'kg/m²', min: 19,  max: 47,  step: 0.1, placeholder: '19 – 47'  },
];

const EMPTY_FORM: FormValues = {
  name: '', age: '', urea: '', cr: '', hba1c: '',
  chol: '', tg: '', hdl: '', ldl: '', vldl: '', bmi: '',
};

// ─── Shared UI helpers ────────────────────────────────────────────────────────
function RiskBadge({ cls }: { cls: PatientRecord['riskClass'] }) {
  const map: Record<PatientRecord['riskClass'], string> = {
    'Diabetic':           'bg-red-50 text-red-600 border-red-200',
    'Predicted Diabetic': 'bg-amber-50 text-amber-600 border-amber-200',
    'Non-Diabetic':       'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${map[cls]}`}>
      {cls}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onDataLoaded: (rows: Omit<PatientRecord, 'id' | 'riskClass' | 'ccValue' | 'dPlus' | 'dMinus'>[]) => void;
  existingPatients: PatientRecord[];
  onPatientAdded:   (patient: PatientRecord) => void;
  manualHistory:    PatientRecord[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════════
export default function UploadDataset({
  onDataLoaded,
  existingPatients,
  onPatientAdded,
  manualHistory,
}: Props) {
  const [activeTab, setActiveTab] = useState<'csv' | 'manual'>('csv');

  // ── CSV state ──────────────────────────────────────────────────────────────
  const [file, setFile]             = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress]     = useState(0);
  const [preview, setPreview]       = useState<ReturnType<typeof parseCSV>>([]);
  const [totalRows, setTotalRows]   = useState(0);
  const [csvError, setCsvError]     = useState('');
  const [done, setDone]             = useState(false);

  const handleFile = (f: File) => { setFile(f); setCsvError(''); setDone(false); setPreview([]); setTotalRows(0); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.name.endsWith('.csv')) handleFile(f);
    else setCsvError('Hanya file .csv yang diterima.');
  };
  const handleProcess = () => {
    if (!file) return;
    setIsProcessing(true); setProgress(0); setCsvError('');
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
        setCsvError(err instanceof Error ? err.message : 'Gagal memproses file.');
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
  };

  // ── Manual state ───────────────────────────────────────────────────────────
  const [form, setForm]               = useState<FormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState<Partial<Record<keyof FormValues, string>>>({});
  const [manualResult, setManualResult] = useState<PatientRecord | null>(null);
  const [isCalc, setIsCalc]           = useState(false);
  const [showHistory, setShowHistory] = useState(true);

  function validate(): boolean {
    const errs: Partial<Record<keyof FormValues, string>> = {};
    if (!form.name.trim()) errs.name = 'Nama pasien wajib diisi.';
    for (const f of FIELDS) {
      const val = parseFloat(form[f.key].replace(',', '.'));
      if (form[f.key] === '' || isNaN(val)) errs[f.key] = 'Wajib diisi.';
      else if (val < f.min || val > f.max) errs[f.key] = `Rentang: ${f.min}–${f.max}`;
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    setIsCalc(true); setManualResult(null);
    setTimeout(() => {
      const numerics: RawNumerics = {
        age: parseFloat(form.age), urea: parseFloat(form.urea), cr: parseFloat(form.cr),
        hba1c: parseFloat(form.hba1c), chol: parseFloat(form.chol), tg: parseFloat(form.tg),
        hdl: parseFloat(form.hdl), ldl: parseFloat(form.ldl), vldl: parseFloat(form.vldl),
        bmi: parseFloat(form.bmi),
      };
      const allExisting = [...existingPatients, ...manualHistory];
      const { cc, dPlus, dMinus } = computePatientCC(numerics, allExisting);
      const patient: PatientRecord = {
        id: allExisting.length + 1,
        name: form.name.trim(),
        ...numerics,
        riskClass: classifyCC(cc),
        ccValue: cc, dPlus, dMinus,
      };
      setManualResult(patient);
      onPatientAdded(patient);
      setForm(EMPTY_FORM); setFormErrors({});
      setIsCalc(false);
    }, 600);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Tab switcher ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-indigo-100">
          {([
            { id: 'csv',    label: 'Upload CSV Dataset', icon: <CloudUpload size={15} /> },
            { id: 'manual', label: 'Input Pasien Manual', icon: <UserPlus size={15} />   },
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] font-black uppercase tracking-widest transition-all
                ${activeTab === tab.id
                  ? 'bg-indigo-900 text-white'
                  : 'bg-white text-indigo-400 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CSV Panel ─────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeTab === 'csv' && (
            <motion.div
              key="csv"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-6 space-y-5"
            >
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="bg-indigo-50/50 p-10 rounded-2xl border-2 border-dashed border-indigo-200
                  flex flex-col items-center text-center hover:border-indigo-400 transition-colors"
              >
                <div className="bg-indigo-100 p-4 rounded-full mb-4 text-indigo-400">
                  <CloudUpload size={40} />
                </div>
                <h3 className="text-base font-bold text-indigo-900 mb-1">Upload File CSV Dataset</h3>
                <p className="text-xs text-violet-600/70 max-w-sm mb-2">Drag & drop file CSV ke sini, atau klik tombol di bawah.</p>
                <p className="text-[10px] text-indigo-500 font-bold mb-5">
                  Kolom: <span className="font-mono">AGE, Urea, Cr, HbA1c, Chol, TG, HDL, LDL, VLDL, BMI, CLASS</span><br />
                  <span className="text-indigo-400 font-normal">Mendukung delimiter koma (,) maupun titik koma (;)</span>
                </p>
                <input type="file" accept=".csv"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden" id="csv-upload"
                />
                <label htmlFor="csv-upload"
                  className="bg-indigo-700 text-white px-7 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest cursor-pointer hover:bg-indigo-800 transition-all">
                  Pilih File CSV
                </label>
                {file && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="mt-5 flex items-center gap-3 bg-white p-3 rounded-xl w-full max-w-sm border border-indigo-100">
                    <FileText size={18} className="text-indigo-600 shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="text-xs font-bold text-indigo-900 truncate">{file.name}</p>
                      <p className="text-[10px] text-violet-600 uppercase tracking-wider">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => { setFile(null); setPreview([]); setDone(false); setTotalRows(0); }}
                      className="text-[10px] font-black text-red-500 uppercase hover:underline">Hapus</button>
                  </motion.div>
                )}
              </div>

              {csvError && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-xl">
                  <AlertTriangle size={16} className="text-red-500 shrink-0" />
                  <p className="text-sm font-bold text-red-700">{csvError}</p>
                </div>
              )}

              {file && !done && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                  <button onClick={handleProcess} disabled={isProcessing}
                    className="w-full bg-indigo-900 text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest
                      flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-black transition-colors">
                    {isProcessing && <Loader2 size={15} className="animate-spin" />}
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
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-200 p-4 rounded-xl">
                      <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />
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
                            <tr>{['No','Nama','AGE','Urea','Cr','HbA1c','Chol','TG','HDL','LDL','VLDL','BMI','CLASS'].map(h => (
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
            </motion.div>
          )}

          {/* ── Manual Panel ──────────────────────────────────────────────── */}
          {activeTab === 'manual' && (
            <motion.div
              key="manual"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-6 space-y-5"
            >
              {/* Info banner */}
              <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                <AlertTriangle size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-500 font-medium leading-relaxed">
                  Input pasien manual akan digabungkan dengan data CSV yang sudah ada.
                  Nilai CC dihitung menggunakan seluruh populasi gabungan sebagai referensi PIS &amp; NIS.
                  {existingPatients.length > 0 && (
                    <span className="ml-1 font-black text-indigo-600">
                      ({existingPatients.length.toLocaleString()} data CSV aktif sebagai referensi)
                    </span>
                  )}
                </p>
              </div>

              {/* Nama */}
              <div>
                <label className="block text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1.5">
                  Nama Pasien <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" value={form.name}
                  onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setFormErrors(er => ({ ...er, name: undefined })); }}
                  placeholder="Masukkan nama lengkap pasien"
                  className={`w-full rounded-xl border px-4 py-2.5 text-sm font-medium text-indigo-900
                    placeholder:text-indigo-300 outline-none transition-all
                    ${formErrors.name ? 'border-red-300 bg-red-50' : 'border-indigo-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                />
                {formErrors.name && <p className="mt-1 text-[10px] text-red-500 font-bold">{formErrors.name}</p>}
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <FlaskConical size={14} className="text-indigo-400 shrink-0" />
                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Hasil Uji Laboratorium & Data Klinis</p>
                <div className="flex-1 h-px bg-indigo-100" />
              </div>

              {/* Grid 10 kriteria */}
              <div className="grid grid-cols-2 gap-4">
                {FIELDS.map(f => (
                  <div key={f.key}>
                    <label className="block text-[10px] font-black text-indigo-800 uppercase tracking-widest mb-1.5">
                      {f.label}
                      <span className="ml-1.5 font-normal text-indigo-400 normal-case">({f.unit})</span>
                      {AHP_CRITERIA_DATA.find(c => c.name.toLowerCase() === f.key)?.type === 'Cost' && (
                        <span className="ml-1.5 text-violet-400 font-black">· Cost</span>
                      )}
                      <span className="text-red-400 ml-0.5">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number" min={f.min} max={f.max} step={f.step}
                        value={form[f.key]}
                        onChange={e => { setForm(prev => ({ ...prev, [f.key]: e.target.value })); setFormErrors(er => ({ ...er, [f.key]: undefined })); }}
                        placeholder={f.placeholder}
                        className={`w-full rounded-xl border px-4 py-2.5 pr-16 text-sm font-medium text-indigo-900
                          placeholder:text-indigo-300 outline-none transition-all
                          ${formErrors[f.key] ? 'border-red-300 bg-red-50' : 'border-indigo-200 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'}`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-indigo-300 uppercase tracking-wider pointer-events-none">
                        w={AHP_CRITERIA_DATA.find(c => c.name.toLowerCase() === f.key || c.name === f.label)?.weight.toFixed(2) ?? '–'}
                      </span>
                    </div>
                    {formErrors[f.key] && <p className="mt-1 text-[10px] text-red-500 font-bold">{formErrors[f.key]}</p>}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button onClick={handleSubmit} disabled={isCalc}
                  className="flex-1 bg-indigo-900 text-white py-3 rounded-xl font-black text-[11px] uppercase tracking-widest
                    flex items-center justify-center gap-2 disabled:opacity-60 hover:bg-black transition-colors">
                  {isCalc
                    ? <><span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Menghitung AHP-TOPSIS...</>
                    : <><Activity size={14} /> Proses & Klasifikasikan</>}
                </button>
                <button onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setManualResult(null); }}
                  className="px-5 py-3 rounded-xl border border-indigo-200 font-black text-[10px] uppercase tracking-widest text-indigo-500 hover:bg-indigo-50 transition-colors">
                  Reset
                </button>
              </div>

              {/* Result */}
              <AnimatePresence>
                {manualResult && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                    <div className="bg-indigo-50 px-6 py-3 border-b border-indigo-100 flex items-center gap-2">
                      <CheckCircle2 size={15} className="text-indigo-600" />
                      <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                        Hasil Klasifikasi — {manualResult.name}
                      </p>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black mb-1">Tingkat Risiko</p>
                          <RiskBadge cls={manualResult.riskClass} />
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-black mb-1">Closeness Coefficient (CC)</p>
                          <p className="text-2xl font-black text-indigo-900">{manualResult.ccValue.toFixed(4)}</p>
                        </div>
                      </div>
                      {/* CC bar */}
                      <div className="relative h-3 bg-indigo-50 rounded-full overflow-hidden mb-1.5">
                        <div className="absolute top-0 bottom-0 bg-indigo-200" style={{ left: `${THRESHOLD_T1*100}%`, width: 1 }} />
                        <div className="absolute top-0 bottom-0 bg-indigo-300" style={{ left: `${THRESHOLD_T2*100}%`, width: 1 }} />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${manualResult.ccValue * 100}%` }}
                          transition={{ duration: 0.6, ease: 'easeOut' }}
                          className={`h-full rounded-full ${manualResult.riskClass==='Diabetic'?'bg-red-400':manualResult.riskClass==='Predicted Diabetic'?'bg-amber-400':'bg-emerald-400'}`}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-indigo-300 font-black uppercase tracking-wider mb-4">
                        <span>0.00</span>
                        <span className="text-indigo-400">t1={THRESHOLD_T1}</span>
                        <span className="text-indigo-400">t2={THRESHOLD_T2}</span>
                        <span>1.00</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-indigo-50 rounded-xl px-4 py-3">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">D⁺ (Jarak ke PIS)</p>
                          <p className="text-sm font-black text-indigo-800 mt-0.5">{manualResult.dPlus.toFixed(6)}</p>
                        </div>
                        <div className="bg-indigo-50 rounded-xl px-4 py-3">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">D⁻ (Jarak ke NIS)</p>
                          <p className="text-sm font-black text-indigo-800 mt-0.5">{manualResult.dMinus.toFixed(6)}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* History */}
              {manualHistory.length > 0 && (
                <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm overflow-hidden">
                  <button onClick={() => setShowHistory(h => !h)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-indigo-50 border-b border-indigo-100 hover:bg-indigo-100/60 transition-colors">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Riwayat Input Manual</p>
                      <span className="bg-indigo-200 text-indigo-800 text-[9px] font-black px-2 py-0.5 rounded-full">
                        {manualHistory.length} pasien
                      </span>
                    </div>
                    {showHistory ? <ChevronUp size={14} className="text-indigo-400" /> : <ChevronDown size={14} className="text-indigo-400" />}
                  </button>
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-[10px]">
                            <thead className="bg-indigo-50/50 border-b border-indigo-100">
                              <tr>
                                {['No','Nama','AGE','Urea','Cr','HbA1c','Chol','TG','HDL','LDL','VLDL','BMI','CC','Risiko'].map(h => (
                                  <th key={h} className="px-4 py-3 text-left font-black text-indigo-700 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-indigo-50">
                              {manualHistory.map((p, i) => (
                                <tr key={p.id} className="hover:bg-indigo-50/30">
                                  <td className="px-4 py-2.5 font-mono text-indigo-400">{i+1}</td>
                                  <td className="px-4 py-2.5 font-bold text-indigo-900 whitespace-nowrap">{p.name}</td>
                                  <td className="px-4 py-2.5">{p.age}</td>
                                  <td className="px-4 py-2.5">{p.urea}</td>
                                  <td className="px-4 py-2.5">{p.cr}</td>
                                  <td className="px-4 py-2.5 font-bold">{p.hba1c}</td>
                                  <td className="px-4 py-2.5">{p.chol}</td>
                                  <td className="px-4 py-2.5">{p.tg}</td>
                                  <td className="px-4 py-2.5">{p.hdl}</td>
                                  <td className="px-4 py-2.5">{p.ldl}</td>
                                  <td className="px-4 py-2.5">{p.vldl}</td>
                                  <td className="px-4 py-2.5">{p.bmi}</td>
                                  <td className="px-4 py-2.5 font-mono font-bold text-indigo-700">{p.ccValue.toFixed(4)}</td>
                                  <td className="px-4 py-2.5"><RiskBadge cls={p.riskClass} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}