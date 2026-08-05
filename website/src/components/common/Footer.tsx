import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-maroon-dark text-white border-t border-amber-500/20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-12 border-b border-zinc-800">
          {/* Brand Info & Logo */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Madurai Food Corner Logo"
                className="w-14 h-14 rounded-full border-2 border-amber-400 object-cover shadow-lg"
              />
              <div>
                <h3 className="font-serif text-xl font-bold text-amber-400">Madurai Food Corner</h3>
                <p className="text-xs text-amber-200 uppercase tracking-widest font-semibold">Taste the Pride of Madurai</p>
              </div>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Authentic South Indian culinary heritage, Kari Dosa, Biryani, and traditional delicacies prepared with fresh ingredients.
            </p>
          </div>

          {/* Quick Navigation Links */}
          <div>
            <h4 className="font-serif text-lg font-bold text-amber-400 mb-4 border-b border-amber-500/20 pb-2">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-xs text-zinc-300">
              <li>
                <Link to="/" className="hover:text-amber-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/menu" className="hover:text-amber-400 transition-colors">Today's Scheduled Menu</Link>
              </li>
              <li>
                <Link to="/combos" className="hover:text-amber-400 transition-colors">Combo Package Meals</Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-amber-400 transition-colors">Active Special Offers</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-amber-400 transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400 transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-serif text-lg font-bold text-amber-400 mb-4 border-b border-amber-500/20 pb-2">
              Contact Support
            </h4>
            <ul className="space-y-3 text-xs text-zinc-300">
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>9952250435 / 7708382018</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-zinc-400 space-y-4 md:space-y-0">
          <p>© {new Date().getFullYear()} Madurai Food Corner. All Rights Reserved.</p>
          <div className="flex items-center space-x-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />
            <span>for Food Lovers</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
