
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#0d7a6b] rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-8 9z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-none">STE DE JARDINAGE</h1>
              <span className="text-emerald-600 font-bold tracking-widest text-lg">RACHIDI</span>
            </div>
          </div>
          <nav className="hidden md:flex space-x-8 items-center">
            <a href="#expertises" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Expertises</a>
            <a href="#engagement" className="text-slate-600 hover:text-emerald-600 font-medium transition-colors">Qualité</a>
            <a href="#contact" className="px-6 py-2.5 bg-[#0d7a6b] text-white rounded-full font-bold hover:bg-[#0a5e52] transition-all shadow-md">
              Devis Gratuit
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
