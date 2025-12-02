import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { ToolType } from '../types';
import { NAV_ITEMS } from './Layout';

interface CommandPaletteProps {
  onSelectTool: (tool: ToolType) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onSelectTool }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredItems = NAV_ITEMS.filter(item => 
    item.label.toLowerCase().includes(search.toLowerCase()) || 
    item.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        onSelectTool(filteredItems[selectedIndex].id);
        setIsOpen(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] px-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Modal */}
      <div className="w-full max-w-xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
          <input 
            ref={inputRef}
            type="text" 
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search tools..." 
            className="flex-1 bg-transparent border-none outline-none px-3 text-slate-800 dark:text-white placeholder-slate-400 text-sm h-6"
          />
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">Esc</span>
        </div>

        <div className="max-h-[300px] overflow-y-auto py-2">
           {filteredItems.length > 0 ? (
             <div className="px-2 space-y-1">
               <div className="text-xs font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">Tools</div>
               {filteredItems.map((item, index) => (
                 <button
                   key={item.id}
                   onClick={() => { onSelectTool(item.id); setIsOpen(false); }}
                   onMouseEnter={() => setSelectedIndex(index)}
                   className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                     index === selectedIndex 
                       ? 'bg-indigo-600 text-white' 
                       : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                   }`}
                 >
                   <div className={`${index === selectedIndex ? 'text-white' : 'text-slate-400'}`}>
                     {item.icon}
                   </div>
                   <div>
                     <p className={`text-sm font-medium ${index === selectedIndex ? 'text-white' : 'text-slate-800 dark:text-slate-200'}`}>
                       {item.label}
                     </p>
                     <p className={`text-xs ${index === selectedIndex ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
                       {item.description}
                     </p>
                   </div>
                 </button>
               ))}
             </div>
           ) : (
             <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
               No tools found matching "{search}"
             </div>
           )}
        </div>
      </div>
    </div>
  );
};