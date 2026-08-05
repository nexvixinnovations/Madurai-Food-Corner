import React from 'react';

export const FoodCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-amber-500/10 shadow-sm animate-pulse">
      <div className="w-full h-48 bg-zinc-200 dark:bg-zinc-800" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-2/3" />
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-12" />
        </div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
        <div className="flex justify-between items-center pt-2">
          <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-20" />
          <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-28" />
        </div>
      </div>
    </div>
  );
};

export const ComboCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden border border-amber-500/10 shadow-sm animate-pulse">
      <div className="w-full h-56 bg-zinc-200 dark:bg-zinc-800" />
      <div className="p-6 space-y-4">
        <div className="h-6 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
        <div className="space-y-2 pt-2">
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-full" />
          <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6" />
        </div>
        <div className="flex justify-between items-center pt-4">
          <div className="h-7 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
          <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-32" />
        </div>
      </div>
    </div>
  );
};
