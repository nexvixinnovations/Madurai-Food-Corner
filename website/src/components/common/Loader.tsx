import React from 'react';

interface LoaderProps {
  fullScreen?: boolean;
  message?: string;
}

export const Loader: React.FC<LoaderProps> = ({ fullScreen = false, message = 'Preparing delicious food...' }) => {
  const content = (
    <div className="flex flex-col items-center justify-center space-y-4 p-8">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping"></div>
        <div className="relative w-16 h-16 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
        <img
          src="/logo.png"
          alt="Madurai Food Corner Logo"
          className="absolute inset-0 m-auto w-8 h-8 rounded-full object-cover"
        />
      </div>
      <p className="text-sm font-semibold text-brand-maroon dark:text-brand-gold animate-pulse tracking-wide">
        {message}
      </p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-cream/90 dark:bg-brand-maroon-dark/95 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
};
