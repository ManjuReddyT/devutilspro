import React, { useState } from 'react';
import { DiffViewer } from '../components/DiffViewer';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

export const TextDiffTool: React.FC = () => {
  const [original, setOriginal] = useState('Paste your original text here...\n\nLine 1\nLine 2\nLine 3');
  const [modified, setModified] = useState('Paste your modified text here...\n\nLine 1\nLine 2 changed\nLine 3\nLine 4 added');

  const swapTexts = () => {
    setOriginal(modified);
    setModified(original);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[250px]">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
             <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Original Text</h3>
          </div>
          <textarea 
             value={original}
             onChange={(e) => setOriginal(e.target.value)}
             className="w-full flex-1 bg-transparent p-4 outline-none font-mono text-sm resize-none custom-scrollbar text-slate-800 dark:text-slate-100"
             placeholder="Enter original text..."
          />
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[250px] relative">
          <button 
            onClick={swapTexts}
            className="absolute top-[13.5px] left-[-20px] md:left-[-16px] z-10 p-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full shadow-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors border border-indigo-200 dark:border-indigo-700 hidden md:block"
            title="Swap Texts"
          >
            <ArrowsRightLeftIcon className="w-4 h-4" />
          </button>
          
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
             <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Modified Text</h3>
             <button 
               onClick={swapTexts}
               className="md:hidden flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400"
             >
               <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
               Swap
             </button>
          </div>
          <textarea 
             value={modified}
             onChange={(e) => setModified(e.target.value)}
             className="w-full flex-1 bg-transparent p-4 outline-none font-mono text-sm resize-none custom-scrollbar text-slate-800 dark:text-slate-100"
             placeholder="Enter modified text..."
          />
        </div>
      </div>
      
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[400px]">
        <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
           <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Diff Breakdown</h3>
           <div className="flex gap-4">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded bg-red-100 border border-red-200 dark:bg-red-900/40 dark:border-red-800"></span>
                Removed
              </div>
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="w-3 h-3 rounded bg-green-100 border border-green-200 dark:bg-green-900/40 dark:border-green-800"></span>
                Added
              </div>
           </div>
        </div>
        <div className="flex-1 overflow-hidden p-0 flex flex-col">
           <DiffViewer original={original} modified={modified} />
        </div>
      </div>
    </div>
  );
};
