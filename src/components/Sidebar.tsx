/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Upload, 
  Settings2, 
  Calculator,
  FileCheck,
  Stethoscope
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export default function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'upload', label: 'Upload Data', icon: Upload },
    { id: 'ahp', label: 'Detail AHP', icon: Settings2 },
    { id: 'topsis', label: 'Detail TOPSIS', icon: Calculator },
    { id: 'results', label: 'Hasil Klasifikasi', icon: FileCheck },
  ];

  return (
    <aside className="w-[240px] bg-white border-r border-indigo-100 flex flex-col h-screen fixed left-0 top-0 z-50">
      <div className="p-6 flex items-center gap-3 border-b border-indigo-50">
        <div className="text-indigo-500">
          <Stethoscope size={28} strokeWidth={2.5} />
        </div>
        <h1 className="font-extrabold text-indigo-900 text-lg tracking-tight">DIACARE</h1>
      </div>

      <nav className="flex-1 py-6 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-6 py-3.5 text-[0.85rem] font-bold transition-all duration-200 relative",
                isActive 
                  ? "bg-indigo-50 text-indigo-700 border-r-4 border-indigo-500" 
                  : "text-indigo-700/50 hover:bg-indigo-50/50 hover:text-indigo-700"
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className={cn(
                "transition-colors",
                isActive ? "text-indigo-600" : "text-indigo-300"
              )} />
              {item.label.toUpperCase()}
            </button>
          );
        })}
      </nav>

      
    </aside>
  );
}