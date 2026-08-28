import React from 'react';
import { Download } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/website', '') || 'https://madurai-food-corner.onrender.com/api';

  const downloadCSV = (start: Date, end: Date, label: string) => {
    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    const url = `${API_BASE_URL}/reports/export?type=orders&format=csv&start_date=${startStr}&end_date=${endStr}`;
    
    // Create a temporary link to download
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${label}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadToday = () => {
    const today = new Date();
    downloadCSV(today, today, 'today');
  };

  const downloadThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    downloadCSV(firstDay, today, 'this_month');
  };

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-extrabold font-serif text-brand-maroon dark:text-white mb-8 text-center">
          Admin Operations Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Today's Orders Box */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
              <Download className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Today's Orders</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 flex-grow">
              Download a complete CSV export of all orders placed today.
            </p>
            <button
              onClick={downloadToday}
              className="w-full py-4 rounded-xl bg-brand-maroon text-amber-400 font-bold hover:bg-[#4a150c] transition-colors"
            >
              Download Today's CSV
            </button>
          </div>

          {/* This Month's Orders Box */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-200 dark:border-zinc-800 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
              <Download className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">This Month's Orders</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 flex-grow">
              Download a complete CSV export of all orders placed this month.
            </p>
            <button
              onClick={downloadThisMonth}
              className="w-full py-4 rounded-xl bg-brand-maroon text-amber-400 font-bold hover:bg-[#4a150c] transition-colors"
            >
              Download Month's CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
