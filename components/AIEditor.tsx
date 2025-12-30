
import React, { useState } from 'react';
import { AISuggestionRequest } from '../types';

interface AIEditorProps {
  onGenerate: (request: AISuggestionRequest) => void;
  isLoading: boolean;
}

const AIEditor: React.FC<AIEditorProps> = ({ onGenerate, isLoading }) => {
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [tone, setTone] = useState<'professional' | 'creative' | 'minimalist'>('professional');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !profession) return;
    onGenerate({ userName: name, profession, tone });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold">AI Site Configurator</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Your Name</label>
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Adam S."
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Profession</label>
          <input 
            type="text" 
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder="e.g. Senior Web Developer"
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Tone</label>
          <select 
            value={tone}
            onChange={(e) => setTone(e.target.value as any)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-white"
          >
            <option value="professional">Professional</option>
            <option value="creative">Creative</option>
            <option value="minimalist">Minimalist</option>
          </select>
        </div>

        <button 
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
            isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Build Portfolio</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AIEditor;
