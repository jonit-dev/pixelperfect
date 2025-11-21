import React from 'react';
import { Zap, Menu } from 'lucide-react';
import Button from './Button';

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Zap size={20} fill="currentColor" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">PixelPerfect</span>
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</a>
          <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-slate-900">How it Works</a>
          <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1 rounded-full">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            <span className="text-xs font-medium text-slate-700">10 Free Credits</span>
          </div>
          <Button variant="ghost" size="sm" className="hidden sm:flex">Log in</Button>
          <Button size="sm">Sign up</Button>
          <button className="md:hidden p-2 text-slate-600">
            <Menu size={24} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;