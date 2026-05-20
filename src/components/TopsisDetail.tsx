/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Table, 
  FunctionSquare, 
  Weight, 
  Target, 
  Ruler, 
  Star,
  ChevronRight,
  Download,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { AHP_CRITERIA_DATA } from '../constants';
import { PatientRecord } from '../types'; // ← TAMBAH INI

// ← TAMBAH INI
interface Props {
  patients: PatientRecord[];
}

export default function TopsisDetail({ patients }: Props) {
  const [activeStep, setActiveStep] = useState(1);

  // ← UBAH INI: semua PATIENT_DUMMY_DATA → patients
  const totalPatientsCount = patients.length;
  const diabeticCount = patients.filter(p => p.riskClass === 'Diabetic').length;
  const predictedCount = patients.filter(p => p.riskClass === 'Predicted Diabetic').length;
  const nonDiabeticCount = patients.filter(p => p.riskClass === 'Non-Diabetic').length;

  const diabeticPerc = totalPatientsCount > 0 ? (diabeticCount / totalPatientsCount * 100).toFixed(0) : '0';
  const predictedPerc = totalPatientsCount > 0 ? (predictedCount / totalPatientsCount * 100).toFixed(0) : '0';
  const nonDiabeticPerc = totalPatientsCount > 0 ? (nonDiabeticCount / totalPatientsCount * 100).toFixed(0) : '0';

  const steps = [
    { id: 1, label: 'Matriks Keputusan', icon: Table },
    { id: 2, label: 'Normalisasi Matriks', icon: FunctionSquare },
    { id: 3, label: 'Matriks Terbobot', icon: Weight },
    { id: 4, label: 'Solusi Ideal', icon: Target },
    { id: 5, label: 'Jarak Euclidean', icon: Ruler },
    { id: 6, label: 'Closeness Coefficient', icon: Star },
  ];

  const scrollToSection = (id: number) => {
    setActiveStep(id);
    const element = document.getElementById(`step-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ← UBAH INI: PATIENT_DUMMY_DATA.slice(0,5) → patients.slice(0,5)
  const dummyPatients = patients.slice(0, 5);

  // ← SEMUA BAWAH INI TETAP SAMA PERSIS ===
  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-black text-emerald-900 tracking-tight">Detail Perhitungan TOPSIS</h2>
            <span className="bg-emerald-900 text-white px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest leading-none">
              {totalPatientsCount.toLocaleString()} Data Pasien
            </span>
          </div>
          <p className="text-emerald-600/70 text-sm font-medium">Technique for Order of Preference by Similarity to Ideal Solution</p>
        </div>
      </header>

      {/* Jika belum ada data */}
      {patients.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <p className="text-sm font-black text-amber-800 uppercase tracking-widest mb-1">Belum Ada Data</p>
          <p className="text-xs text-amber-600 font-medium">Silakan upload dataset CSV terlebih dahulu untuk melihat detail perhitungan TOPSIS.</p>
        </div>
      )}

      {/* Summary Cards Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <button
              key={step.id}
              onClick={() => scrollToSection(step.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                activeStep === step.id 
                  ? 'bg-white border-emerald-900 ring-2 ring-emerald-900 shadow-lg' 
                  : 'bg-white border-emerald-100 hover:border-emerald-300'
              }`}
            >
              <div className={`p-2 rounded-lg mb-2 ${activeStep === step.id ? 'bg-emerald-900 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                <Icon size={18} />
              </div>
              <p className={`text-[9px] font-black uppercase text-center leading-tight tracking-widest ${activeStep === step.id ? 'text-emerald-900' : 'text-emerald-400'}`}>
                {step.label}
              </p>
            </button>
          );
        })}
      </div>

      {/* STEP 1: Matriks Keputusan */}
      <section id="step-1" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center font-black text-sm shadow-lg">1</div>
          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Langkah 1: Pembentukan Matriks Keputusan</h3>
        </div>
        <p className="text-xs text-emerald-600/70 font-medium italic">Matriks keputusan (X) dibentuk dari nilai kriteria setiap alternatif pasien.</p>
        
        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden border-t-2 border-t-emerald-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-emerald-50/50 text-emerald-900 font-black uppercase tracking-widest border-b border-emerald-50">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">AGE<br/><span className="text-[8px] font-normal">(Tahun)</span></th>
                  <th className="px-6 py-4">Urea<br/><span className="text-[8px] font-normal">(mg/dL)</span></th>
                  <th className="px-6 py-4">Cr<br/><span className="text-[8px] font-normal">(mg/dL)</span></th>
                  <th className="px-6 py-4">HbA1c<br/><span className="text-[8px] font-normal">(%)</span></th>
                  <th className="px-6 py-4">Chol<br/><span className="text-[8px] font-normal">(mg/dL)</span></th>
                  <th className="px-6 py-4">TG<br/><span className="text-[8px] font-normal">(mg/dL)</span></th>
                  <th className="px-6 py-4">HDL<br/><span className="text-[8px] font-normal">(mg/dL)</span></th>
                  <th className="px-6 py-4">LDL<br/><span className="text-[8px] font-normal">(mg/dL)</span></th>
                  <th className="px-6 py-4">VLDL<br/><span className="text-[8px] font-normal">(mg/dL)</span></th>
                  <th className="px-6 py-4">BMI<br/><span className="text-[8px] font-normal">(kg/m²)</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/50 text-emerald-900">
                {dummyPatients.length > 0 ? (
                  dummyPatients.map((p, i) => (
                    <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-emerald-500">{i + 1}</td>
                      <td className="px-6 py-3.5 font-bold">{p.age}</td>
                      <td className="px-6 py-3.5 font-bold">{p.urea}</td>
                      <td className="px-6 py-3.5 font-bold">{p.cr}</td>
                      <td className="px-6 py-3.5 font-bold">{p.hba1c}</td>
                      <td className="px-6 py-3.5 font-bold">{p.chol}</td>
                      <td className="px-6 py-3.5 font-bold">{p.tg}</td>
                      <td className="px-6 py-3.5 font-bold">{p.hdl}</td>
                      <td className="px-6 py-3.5 font-bold">{p.ldl}</td>
                      <td className="px-6 py-3.5 font-bold">{p.vldl}</td>
                      <td className="px-6 py-3.5 text-center font-bold">{p.bmi}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-10 text-center text-emerald-400 font-bold uppercase tracking-widest">Belum ada data tersedia</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-emerald-50/20 border-t border-emerald-50 flex items-center justify-between">
            <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">
              Menampilkan {dummyPatients.length} dari {totalPatientsCount.toLocaleString()} data pasien
            </span>
            <button className="flex items-center gap-1.5 text-[9px] font-black text-emerald-700 uppercase tracking-widest hover:underline">
              Lihat Semua Data <ChevronRight size={10} />
            </button>
          </div>
        </div>
      </section>

      {/* STEP 2: Normalisasi Matriks */}
      <section id="step-2" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center font-black text-sm shadow-lg">2</div>
          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Langkah 2: Normalisasi Matriks</h3>
        </div>
        
        <div className="bg-[#f5f5f5] p-6 rounded border-l-4 border-emerald-900 mb-6 flex items-center justify-between">
          <code className="text-sm font-mono font-black text-emerald-900">rij = xij / √(Σ x²ij)</code>
          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">(Vector Normalization)</p>
        </div>

        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden border-t-2 border-t-emerald-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-emerald-50/50 text-emerald-900 font-black uppercase tracking-widest border-b border-emerald-50">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">AGE</th>
                  <th className="px-6 py-4">Urea</th>
                  <th className="px-6 py-4 bg-emerald-100">Cr <span className="text-[8px]">(Cost)</span></th>
                  <th className="px-6 py-4">HbA1c</th>
                  <th className="px-6 py-4">Chol</th>
                  <th className="px-6 py-4">TG</th>
                  <th className="px-6 py-4 bg-emerald-100">HDL <span className="text-[8px]">(Cost)</span></th>
                  <th className="px-6 py-4">LDL</th>
                  <th className="px-6 py-4 bg-emerald-100">VLDL <span className="text-[8px]">(Cost)</span></th>
                  <th className="px-6 py-4 text-center">BMI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/50 text-emerald-900">
                {dummyPatients.length > 0 ? (
                  dummyPatients.map((p, i) => {
                    // Hitung normalisasi vektor dari seluruh patients
                    const norm = (key: keyof PatientRecord) => {
                      const colSum = Math.sqrt(patients.reduce((s, r) => s + Number(r[key]) ** 2, 0));
                      return colSum === 0 ? 0 : Number(p[key]) / colSum;
                    };
                    return (
                      <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-emerald-500">{i + 1}</td>
                        <td className="px-6 py-3.5 font-mono">{norm('age').toFixed(4)}</td>
                        <td className="px-6 py-3.5 font-mono">{norm('urea').toFixed(4)}</td>
                        <td className="px-6 py-3.5 font-mono bg-emerald-50/50">{norm('cr').toFixed(4)}</td>
                        <td className="px-6 py-3.5 font-mono">{norm('hba1c').toFixed(4)}</td>
                        <td className="px-6 py-3.5 font-mono">{norm('chol').toFixed(4)}</td>
                        <td className="px-6 py-3.5 font-mono">{norm('tg').toFixed(4)}</td>
                        <td className="px-6 py-3.5 font-mono bg-emerald-50/50">{norm('hdl').toFixed(4)}</td>
                        <td className="px-6 py-3.5 font-mono">{norm('ldl').toFixed(4)}</td>
                        <td className="px-6 py-3.5 font-mono bg-emerald-50/50">{norm('vldl').toFixed(4)}</td>
                        <td className="px-6 py-3.5 text-center font-mono">{norm('bmi').toFixed(4)}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-10 text-center text-emerald-400 font-bold uppercase tracking-widest">Belum ada data tersedia</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* STEP 3: Matriks Terbobot */}
      <section id="step-3" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center font-black text-sm shadow-lg">3</div>
          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Langkah 3: Matriks Keputusan Terbobot</h3>
        </div>

        <div className="bg-[#f5f5f5] p-6 rounded border-l-4 border-emerald-900 mb-4">
          <code className="text-sm font-mono font-black text-emerald-900">vij = wj × rij</code>
        </div>
        
        <div className="bg-emerald-900 text-white p-4 rounded-xl flex flex-wrap gap-4 mb-4 shadow-lg">
          {AHP_CRITERIA_DATA.map(c => (
            <div key={c.name} className="flex flex-col">
              <span className="text-[8px] font-black text-emerald-300 tracking-widest">{c.name.toUpperCase()}</span>
              <span className="text-[11px] font-bold font-mono">{c.weight.toFixed(3)}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden border-t-2 border-t-emerald-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[9px]">
              <thead className="bg-emerald-50/50 text-emerald-900 font-black uppercase tracking-widest border-b border-emerald-50">
                <tr>
                  <th className="px-6 py-4">No</th>
                  {AHP_CRITERIA_DATA.map(c => (
                    <th key={c.name} className="px-6 py-4">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/50 text-emerald-900">
                {dummyPatients.length > 0 ? (
                  dummyPatients.map((p, i) => {
                    const norm = (key: keyof PatientRecord) => {
                      const colSum = Math.sqrt(patients.reduce((s, r) => s + Number(r[key]) ** 2, 0));
                      return colSum === 0 ? 0 : Number(p[key]) / colSum;
                    };
                    const keys: (keyof PatientRecord)[] = ['hba1c','bmi','urea','cr','age','chol','tg','hdl','ldl','vldl'];
                    return (
                      <tr key={p.id} className="hover:bg-emerald-50/20 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-emerald-500">{i + 1}</td>
                        {keys.map((key, j) => (
                          <td key={key} className="px-6 py-3.5 font-mono">
                            {(norm(key) * AHP_CRITERIA_DATA[j].weight).toFixed(6)}
                          </td>
                        ))}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-10 text-center text-emerald-400 font-bold uppercase tracking-widest">Belum ada data tersedia</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* STEP 4: Ideal Solutions */}
      <section id="step-4" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center font-black text-sm shadow-lg">4</div>
          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Langkah 4: Penentuan Solusi Ideal (PIS & NIS)</h3>
        </div>

        <div className="flex gap-4">
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Benefit = MAX</span>
          <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100">Cost = MIN</span>
        </div>

        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden border-t-2 border-t-emerald-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px]">
              <thead className="bg-emerald-50/50 text-emerald-900 font-black uppercase tracking-widest border-b border-emerald-50">
                <tr>
                  <th className="px-6 py-4">Solusi</th>
                  {AHP_CRITERIA_DATA.map(c => (
                    <th key={c.name} className="px-6 py-4">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/50 text-emerald-900">
                <tr className="bg-emerald-50">
                  <td className="px-6 py-4 font-black">A+ (PIS)</td>
                  {AHP_CRITERIA_DATA.map((c, j) => {
                    const keys: (keyof PatientRecord)[] = ['hba1c','bmi','urea','cr','age','chol','tg','hdl','ldl','vldl'];
                    const colVals = patients.map(p => {
                      const colSum = Math.sqrt(patients.reduce((s, r) => s + Number(r[keys[j]]) ** 2, 0));
                      return colSum === 0 ? 0 : Number(p[keys[j]]) / colSum * c.weight;
                    });
                    const val = c.type === 'Benefit' ? Math.max(...colVals) : Math.min(...colVals);
                    return <td key={c.name} className="px-6 py-4 font-mono font-black text-emerald-700">{patients.length > 0 ? val.toFixed(4) : '-'}</td>;
                  })}
                </tr>
                <tr className="bg-rose-50/30">
                  <td className="px-6 py-4 font-black">A- (NIS)</td>
                  {AHP_CRITERIA_DATA.map((c, j) => {
                    const keys: (keyof PatientRecord)[] = ['hba1c','bmi','urea','cr','age','chol','tg','hdl','ldl','vldl'];
                    const colVals = patients.map(p => {
                      const colSum = Math.sqrt(patients.reduce((s, r) => s + Number(r[keys[j]]) ** 2, 0));
                      return colSum === 0 ? 0 : Number(p[keys[j]]) / colSum * c.weight;
                    });
                    const val = c.type === 'Benefit' ? Math.min(...colVals) : Math.max(...colVals);
                    return <td key={c.name} className="px-6 py-4 font-mono font-black text-rose-700">{patients.length > 0 ? val.toFixed(4) : '-'}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
            <div className="bg-emerald-500 text-white p-2 rounded-lg"><Target size={16} /></div>
            <div>
              <p className="text-[10px] font-black text-emerald-900 uppercase tracking-widest">Kriteria Benefit (Max)</p>
              <p className="text-[9px] text-emerald-600 font-bold uppercase mt-0.5">HbA1c, BMI, AGE, Urea, Chol, TG, LDL</p>
            </div>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center gap-3">
            <div className="bg-rose-500 text-white p-2 rounded-lg"><Target size={16} /></div>
            <div>
              <p className="text-[10px] font-black text-rose-900 uppercase tracking-widest">Kriteria Cost (Min)</p>
              <p className="text-[9px] text-rose-600 font-bold uppercase mt-0.5">Cr, HDL, VLDL</p>
            </div>
          </div>
        </div>
      </section>

      {/* STEP 5: Euclidean Distance */}
      <section id="step-5" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center font-black text-sm shadow-lg">5</div>
          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Langkah 5: Perhitungan Jarak Euclidean</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-[#f5f5f5] p-6 rounded border-l-4 border-emerald-900">
            <code className="text-sm font-mono font-black text-emerald-900 tracking-tighter">D+i = √Σ(vij - v+j)²</code>
          </div>
          <div className="bg-[#f5f5f5] p-6 rounded border-l-4 border-rose-400">
            <code className="text-sm font-mono font-black text-rose-800 tracking-tighter">D-i = √Σ(vij - v-j)²</code>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden border-t-2 border-t-emerald-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-emerald-50/50 text-emerald-900 font-black uppercase tracking-widest border-b border-emerald-50">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Nama Pasien</th>
                  <th className="px-6 py-4">D+ (Jarak ke PIS)</th>
                  <th className="px-6 py-4">D- (Jarak ke NIS)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/50 text-emerald-900">
                {dummyPatients.length > 0 ? (
                  dummyPatients.map((p, i) => (
                    <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-emerald-500">{String(i+1).padStart(2,'0')}</td>
                      <td className="px-6 py-4 font-black">{p.name}</td>
                      <td className="px-6 py-4 font-mono font-black text-emerald-900">{p.dPlus.toFixed(6)}</td>
                      <td className="px-6 py-4 font-mono font-black text-rose-900">{p.dMinus.toFixed(6)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-emerald-400 font-bold uppercase tracking-widest">Belum ada data tersedia</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* STEP 6: Closeness Coefficient & Ranking */}
      <section id="step-6" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center font-black text-sm shadow-lg">6</div>
          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-[0.2em]">Langkah 6: Closeness Coefficient & Ranking</h3>
        </div>

        <div className="bg-[#f5f5f5] p-6 rounded border-l-4 border-emerald-900 mb-6 flex items-center justify-between">
          <code className="text-sm font-mono font-black text-emerald-900">CCi = D-i / (D+i + D-i)</code>
        </div>

        <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden border-t-2 border-t-emerald-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-emerald-50/50 text-emerald-900 font-black uppercase tracking-widest border-b border-emerald-50">
                <tr>
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Nama Pasien</th>
                  <th className="px-6 py-4 font-mono">D+</th>
                  <th className="px-6 py-4 font-mono">D-</th>
                  <th className="px-6 py-4">CC Value</th>
                  <th className="px-6 py-4">Ranking</th>
                  <th className="px-6 py-4 text-right">Hasil Risiko</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-50/50 text-emerald-900">
                {dummyPatients.length > 0 ? (
                  [...dummyPatients].sort((a,b) => (b.ccValue||0) - (a.ccValue||0)).map((p, i) => (
                    <tr key={p.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-emerald-500">{String(i+1).padStart(2,'0')}</td>
                      <td className="px-6 py-4 font-black">{p.name}</td>
                      <td className="px-6 py-4 font-mono text-emerald-400">{p.dPlus.toFixed(4)}</td>
                      <td className="px-6 py-4 font-mono text-emerald-400">{p.dMinus.toFixed(4)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <span className="font-mono font-black text-emerald-900">{p.ccValue?.toFixed(4)}</span>
                          <div className="w-full bg-emerald-50 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${p.ccValue >= 0.71 ? 'bg-red-500' : p.ccValue >= 0.41 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${(p.ccValue || 0) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="bg-emerald-900 text-white w-6 h-6 rounded flex items-center justify-center font-black text-[10px] shadow-md">
                          {i + 1}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`
                          inline-flex items-center gap-1.5 px-3 py-1 rounded text-[0.65rem] font-black uppercase tracking-widest shadow-sm
                          ${p.riskClass === 'Diabetic' ? 'bg-red-50 text-red-600 border border-red-100' : 
                            p.riskClass === 'Predicted Diabetic' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}
                        `}>
                          {p.riskClass === 'Predicted Diabetic' ? 'Predicted' : p.riskClass}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-emerald-400 font-bold uppercase tracking-widest">Belum ada data tersedia</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FINAL SUMMARY */}
      <section className="bg-[#0a2e16] p-8 rounded-2xl shadow-2xl space-y-8">
        <h3 className="text-xs font-black text-emerald-300 uppercase tracking-[0.3em] text-center">Ringkasan Distribusi Hasil</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1 leading-none">Diabetic</p>
            <p className="text-3xl font-black text-red-500">{diabeticPerc}%</p>
            <p className="text-[9px] font-bold text-emerald-100/40 uppercase mt-2">{diabeticCount} Pasien</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1 leading-none">Predicted</p>
            <p className="text-3xl font-black text-amber-500">{predictedPerc}%</p>
            <p className="text-[9px] font-bold text-emerald-100/40 uppercase mt-2">{predictedCount} Pasien</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-1 leading-none">Non-Diabetic</p>
            <p className="text-3xl font-black text-emerald-500">{nonDiabeticPerc}%</p>
            <p className="text-[9px] font-bold text-emerald-100/40 uppercase mt-2">{nonDiabeticCount} Pasien</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="w-full h-8 flex rounded-lg overflow-hidden border border-white/10 shadow-inner bg-white/5">
            <div className="h-full bg-red-500" style={{ width: `${diabeticPerc}%` }} />
            <div className="h-full bg-amber-500" style={{ width: `${predictedPerc}%` }} />
            <div className="h-full bg-emerald-500" style={{ width: `${nonDiabeticPerc}%` }} />
          </div>
          <div className="flex justify-between px-1">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-tighter">Diabetic ({diabeticCount})</span>
            <span className="text-[8px] font-black text-white/40 uppercase tracking-tighter text-right">Non-Diabetic ({nonDiabeticCount})</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 pt-4">
          <button className="flex-1 bg-white text-emerald-900 py-3 rounded-xl font-black text-[0.7rem] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-50 transition-all shadow-xl">
            Lihat Hasil Lengkap <ExternalLink size={14} />
          </button>
          <button className="flex-1 bg-emerald-700/50 text-white py-3 rounded-xl font-black text-[0.7rem] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all border border-emerald-600/30">
            Export Detail TOPSIS ke CSV <Download size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}