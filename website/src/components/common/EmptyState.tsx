import React from 'react';
import { Utensils } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Items Found',
  description = 'We couldn\'t find any menu items matching your selection.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white/50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-amber-500/20 max-w-md mx-auto my-8">
      <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center text-brand-gold mb-4">
        <Utensils className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-bold text-brand-maroon dark:text-amber-400 mb-2">
        {title}
      </h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-brand-maroon font-bold text-sm hover:shadow-lg hover:shadow-amber-500/20 transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
