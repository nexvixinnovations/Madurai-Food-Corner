import React from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-cream dark:bg-zinc-950 py-20 flex items-center justify-center">
      <div className="text-center max-w-md p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-amber-500/20 shadow-2xl space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <Utensils className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-extrabold font-serif text-brand-maroon dark:text-amber-400">404</span>
          <h2 className="text-2xl font-bold font-serif text-brand-maroon dark:text-white">Page Not Found</h2>
          <p className="text-xs text-zinc-500">
            Oops! The food page or dish route you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-2xl bg-amber-500 text-brand-maroon font-bold text-xs hover:bg-amber-400 transition-colors shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </div>
  );
};
