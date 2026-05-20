import React from 'react';
import { Users, AlertCircle, Activity, CheckCircle2 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { AHP_CRITERIA_DATA } from '../constants';
import { motion } from 'motion/react';
import { PatientRecord } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

interface Props { patients: PatientRecord[]; }

export default function Dashboard({ patients }: Props) {
  const totalPatients = patients.length;
  const diabeticCount = patients.filter(p => p.riskClass === 'Diabetic').length;
  const predictedCount = patients.filter(p => p.riskClass === 'Predicted Diabetic').length;
  const nonDiabeticCount = patients.filter(p => p.riskClass === 'Non-Diabetic').length;

  const stats = [
    { label: 'Total Pasien', value: totalPatients.toLocaleString(), icon: Users, color: 'text-indigo-900', border: 'border-indigo-100' },
    { label: 'Diabetic', value: diabeticCount.toLocaleString(), icon: AlertCircle, color: 'text-red-500', border: 'border-l-4 border-red-500 border-y-indigo-50 border-r-indigo-100' },
    { label: 'Predicted Diabetic', value: predictedCount.toLocaleString(), icon: Activity, color: 'text-amber-500', border: 'border-l-4 border-amber-500 border-y-indigo-50 border-r-indigo-100' },
    { label: 'Non-Diabetic', value: nonDiabeticCount.toLocaleString(), icon: CheckCircle2, color: 'text-violet-500', border: 'border-l-4 border-violet-500 border-y-indigo-50 border-r-indigo-100' },
  ];

  const pieData = {
    labels: ['Diabetic', 'Predicted Diabetic', 'Non-Diabetic'],
    datasets: [{ data: [diabeticCount, predictedCount, nonDiabeticCount], backgroundColor: ['#ef4444', '#f59e0b', '#6366f1'], borderWidth: 0 }]
  };

  const barData = {
    labels: AHP_CRITERIA_DATA.map(c => c.name),
    datasets: [{ label: 'Bobot Kepentingan', data: AHP_CRITERIA_DATA.map(c => c.weight), backgroundColor: '#6366f1', borderRadius: 4 }]
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`bg-white p-5 rounded-xl border ${stat.border} shadow-sm`}>
            <h3 className="text-violet-600 text-[10px] font-black uppercase tracking-widest mb-2 leading-none">{stat.label}</h3>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm lg:col-span-1 border-t-2 border-t-indigo-500">
          <h3 className="text-[0.75rem] font-black text-indigo-900 mb-6 uppercase tracking-widest">DISTRIBUSI KELAS RISK</h3>
          <div className="aspect-square flex items-center justify-center p-4">
            <Pie data={pieData} options={{ plugins: { legend: { position: 'bottom', labels: { boxWidth: 8, padding: 20, font: { family: 'Inter', size: 10, weight: 'bold' } } } } }} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-indigo-100 shadow-sm lg:col-span-2 border-t-2 border-t-indigo-500">
          <h3 className="text-[0.75rem] font-black text-indigo-900 mb-6 uppercase tracking-widest">BOBOT KRITERIA AHP (NORMALIZED)</h3>
          <div className="h-[280px]">
            <Bar data={barData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } },
              scales: { y: { beginAtZero: true, grid: { color: '#ede9fe' }, ticks: { font: { size: 10, weight: 'bold' }, color: '#3730a3' } },
                        x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#3730a3' } } } }} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden border-t-2 border-t-indigo-500">
        <div className="px-5 py-3.5 border-b border-indigo-50 bg-indigo-50/20 flex items-center justify-between">
          <h3 className="text-[0.75rem] font-black text-indigo-900 uppercase tracking-widest">5 DATA TERBARU HASIL KLASIFIKASI</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[0.8rem]">
            <thead>
              <tr className="bg-indigo-50/50 text-indigo-700 font-black uppercase text-[9px] tracking-widest border-b border-indigo-50">
                <th className="px-6 py-3">No</th><th className="px-6 py-3">Nama Pasien</th>
                <th className="px-6 py-3">HbA1c</th><th className="px-6 py-3">BMI</th>
                <th className="px-6 py-3">CC Value</th><th className="px-6 py-3">Hasil Risiko</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50/50">
              {patients.length > 0 ? patients.slice(0, 5).map((patient, i) => (
                <tr key={patient.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="px-6 py-3.5 font-mono text-indigo-500">{String(i+1).padStart(2,'0')}</td>
                  <td className="px-6 py-3.5 font-black text-indigo-900">{patient.name}</td>
                  <td className="px-6 py-3.5 text-indigo-700 font-bold">{patient.hba1c}%</td>
                  <td className="px-6 py-3.5 text-indigo-700 font-bold">{patient.bmi.toFixed(1)}</td>
                  <td className="px-6 py-3.5 font-mono text-indigo-400">{patient.ccValue?.toFixed(3)}</td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-[0.65rem] font-black uppercase tracking-widest shadow-sm
                      ${patient.riskClass === 'Diabetic' ? 'bg-red-50 text-red-600 border border-red-100' : 
                        patient.riskClass === 'Predicted Diabetic' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 
                        'bg-violet-50 text-violet-700 border border-violet-100'}`}>
                      {patient.riskClass === 'Predicted Diabetic' ? 'Predicted' : patient.riskClass}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-indigo-400 font-bold text-xs">
                  Belum ada data tersedia. Silakan upload dataset terlebih dahulu.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}