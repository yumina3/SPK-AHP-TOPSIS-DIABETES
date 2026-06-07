import React, { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UploadDataset from './components/UploadDataset';
import AHPDetail from './components/AHPDetail';
import TopsisDetail from './components/TopsisDetail';
import ClassificationResult from './components/ClassificationResult';
import { motion, AnimatePresence } from 'motion/react';
import { PatientRecord } from './types';
import { AHP_CRITERIA_DATA } from './constants';
import { runTopsis } from './utils/topsis';

export default function App() {
  const [currentPage, setCurrentPage]     = useState('dashboard');
  const [patients, setPatients]           = useState<PatientRecord[]>([]);
  const [manualHistory, setManualHistory] = useState<PatientRecord[]>([]);

  // Dipanggil saat CSV selesai diproses
  const handleDataLoaded = useCallback((
    rows: Omit<PatientRecord, 'id' | 'riskClass' | 'ccValue' | 'dPlus' | 'dMinus'>[]
  ) => {
    const result = runTopsis(rows, AHP_CRITERIA_DATA);
    setPatients(result);
    setCurrentPage('dashboard');
  }, []);

  // Dipanggil saat satu pasien manual selesai diproses
  const handlePatientAdded = useCallback((patient: PatientRecord) => {
    setManualHistory(prev => [...prev, patient]);
    setPatients(prev => [...prev, patient]);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard patients={patients} />;
      case 'upload':
        return (
          <UploadDataset
            onDataLoaded={handleDataLoaded}
            existingPatients={patients}
            onPatientAdded={handlePatientAdded}
            manualHistory={manualHistory}
          />
        );
      case 'ahp':     return <AHPDetail />;
      case 'topsis':  return <TopsisDetail patients={patients} />;
      case 'results': return <ClassificationResult patients={patients} />;
      default:        return <Dashboard patients={patients} />;
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'DASHBOARD RINGKASAN',
      upload:    'UNGGAH DATASET & INPUT PASIEN',
      ahp:       'DETAIL PERHITUNGAN AHP',
      topsis:    'DETAIL PERHITUNGAN TOPSIS',
      results:   'HASIL KLASIFIKASI LENGKAP',
    };
    return titles[currentPage] ?? 'DSS MEDIS';
  };

  return (
    <div className="min-h-screen bg-[#f8f7ff] flex font-sans">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="flex-1 ml-[240px] flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-indigo-100 flex items-center justify-between px-8 shrink-0">
          <div className="text-[0.8rem] font-black text-indigo-900 tracking-widest uppercase">
            {getPageTitle()}
          </div>
          <div className="flex items-center gap-4">
            {patients.length > 0 && (
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full uppercase tracking-widest">
                {patients.length.toLocaleString()} Data Aktif
              </span>
            )}
            {manualHistory.length > 0 && (
              <span className="text-[10px] font-black text-violet-600 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full uppercase tracking-widest">
                {manualHistory.length} Input Manual
              </span>
            )}
            <div className="text-indigo-400 font-bold text-[0.7rem] tracking-wider uppercase">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long', day: 'numeric',
                month: 'long', year: 'numeric',
              })}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}