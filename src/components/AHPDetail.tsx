/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { AHP_CRITERIA_DATA, AHP_MATRIX, AHP_CONSISTENCY } from '../constants';
import { motion } from 'motion/react';

export default function AHPDetail() {
  return (
    <div className="space-y-8 pb-12">
      <header>
        <h2 className="text-2xl font-black text-emerald-900 tracking-tight">Detail Perhitungan AHP</h2>
        <p className="text-emerald-600/70 text-sm font-medium mt-1">Matriks perbandingan berpasangan dan pembobotan kriteria</p>
      </header>

      <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden border-t-2 border-t-emerald-500">
        <div className="px-5 py-3.5 border-b border-emerald-50 bg-emerald-50/30 flex items-center justify-between">
          <h3 className="text-[0.75rem] font-black text-emerald-900 uppercase tracking-widest">Matriks Perbandingan Berpasangan</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[10px] border-collapse">
            <thead>
              <tr className="bg-emerald-50/50 text-emerald-800 font-black uppercase tracking-wider">
                <th className="px-4 py-4 border-b border-r border-emerald-100">Kriteria</th>
                {AHP_CRITERIA_DATA.map(c => (
                  <th key={c.name} className="px-4 py-4 border-b border-emerald-100 text-center min-w-[60px]">{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50/50">
              {AHP_MATRIX.map((row, i) => (
                <tr key={i} className="hover:bg-emerald-50/30 transition-colors">
                  <td className="px-4 py-3 border-r border-emerald-100 font-black bg-emerald-50/20 text-emerald-900">{AHP_CRITERIA_DATA[i].name}</td>
                  {row.map((val, j) => (
                    <td key={j} className="px-4 py-3 text-center font-mono text-emerald-600/70">
                      {val < 1 ? `1/${Math.round(1/val)}` : val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-emerald-100 shadow-sm overflow-hidden border-t-2 border-t-emerald-500">
            <div className="px-5 py-3.5 border-b border-emerald-50 flex items-center justify-between bg-emerald-50/10">
              <h3 className="text-[0.75rem] font-black text-emerald-900 uppercase tracking-widest">Normalisasi & Bobot Akhir</h3>
              <div className="bg-emerald-900 text-white px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest leading-none">Sum: 1.0</div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-emerald-50/50 text-emerald-700 font-black uppercase text-[9px] tracking-widest">
                    <th className="px-6 py-4">No</th>
                    <th className="px-6 py-4">Kriteria</th>
                    <th className="px-6 py-4">Jenis</th>
                    <th className="px-6 py-4 text-center">Bobot</th>
                    <th className="px-6 py-4 w-1/3">Visualisasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50/50">
                  {AHP_CRITERIA_DATA.map((criteria, i) => (
                    <tr key={criteria.name} className="hover:bg-emerald-50/20 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-emerald-500">{String(i+1).padStart(2, '0')}</td>
                      <td className="px-6 py-3.5 font-bold text-emerald-900">{criteria.name}</td>
                      <td className="px-6 py-3.5">
                        <span className={`text-[9px] font-black uppercase tracking-widest ${criteria.type === 'Benefit' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {criteria.type}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-center font-mono text-emerald-900 font-bold">{criteria.weight.toFixed(3)}</td>
                      <td className="px-6 py-3.5">
                        <div className="w-full bg-emerald-50 h-1.5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${criteria.weight * 100 * 2.5}%` }}
                            className="h-full bg-emerald-500"
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-xl border border-emerald-100 shadow-sm border-t-2 border-t-emerald-500 flex flex-col h-full">
            <div className="space-y-6 flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-[0.75rem] font-black text-emerald-900 uppercase tracking-widest">Uji Konsistensi</h3>
                {AHP_CONSISTENCY.isConsistent ? (
                  <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-sm border border-emerald-100">
                    <CheckCircle2 size={10} /> Valid
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest">
                    <AlertCircle size={10} /> Inconsistent
                  </span>
                )}
              </div>
              
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-lg border border-emerald-50">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Lambda Max</span>
                  <span className="text-lg font-mono font-black text-emerald-900">{AHP_CONSISTENCY.lambdaMax}</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-lg border border-emerald-50">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Consistency Index (CI)</span>
                  <span className="text-lg font-mono font-black text-emerald-900">{AHP_CONSISTENCY.ci}</span>
                </div>
                <div className="bg-emerald-50/30 p-5 rounded-xl border border-emerald-100/50 shadow-inner flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-2">Consistency Ratio (CR)</span>
                  <span className="text-4xl font-mono font-black text-emerald-900 leading-none">{AHP_CONSISTENCY.cr}</span>
                  <div className="w-full max-w-[120px] h-1 bg-emerald-100 rounded-full mt-4 overflow-hidden">
                    <div 
                      className={`h-full ${AHP_CONSISTENCY.isConsistent ? 'bg-emerald-500' : 'bg-red-500'}`} 
                      style={{ width: `${Math.min(Number(AHP_CONSISTENCY.cr) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-emerald-900 p-5 rounded-xl mt-8">
              <p className="text-[11px] text-emerald-100 font-medium italic opacity-80 leading-relaxed">
                Matriks perbandingan dianggap konsisten jika nilai CR &le; 0.10.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
