import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { CartDrawer } from '../components/common/CartDrawer';
import { MobileBottomNav } from '../components/common/MobileBottomNav';
import { FloatingCartBar } from '../components/common/FloatingCartBar';
import { Toaster } from 'react-hot-toast';

export const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-brand-cream dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors pb-20 md:pb-0">
      <Navbar />

      <main className="flex-grow">
        <Outlet />
      </main>

      <Footer />
      <CartDrawer />
      <FloatingCartBar />
      <MobileBottomNav />

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#3B1B10',
            color: '#D4AF37',
            borderRadius: '16px',
            fontSize: '13px',
            fontWeight: 'bold',
            border: '1px solid rgba(212, 175, 55, 0.3)',
          },
        }}
      />
    </div>
  );
};
