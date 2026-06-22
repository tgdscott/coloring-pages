import React from 'react';
import { Palette, Sparkles } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="w-full py-6 px-4 bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-200">
            <Palette size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Sketch to Color</h1>
            <p className="text-xs text-slate-500 font-medium">AI-Powered Coloring Book Creator</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full text-sm font-semibold">
          <Sparkles size={16} />
          <span>Gemini</span>
        </div>
      </div>
    </header>
  );
};