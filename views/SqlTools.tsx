import React, { useState } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { formatSql, generateSql, explainSql } from '../services/geminiService';
import { SparklesIcon, TableCellsIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

export const SqlTools: React.FC = () => {
  const [sql, setSql] = useState('');
  const [prompt, setPrompt] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleFormat = () => {
    if (!sql.trim()) return;
    const formatted = formatSql(sql);
    setSql(formatted);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    const result = await generateSql(prompt);
    setSql(result);
    setGenerating(false);
  };

  const handleExplain = async () => {
    if (!sql.trim()) return;
    setLoading(true);
    const result = await explainSql(sql);
    setExplanation(result);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
      {/* Top Bar: Generator */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-end md:items-center">
         <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
               Natural Language to SQL
            </label>
            <div className="flex gap-2">
               <input 
                 type="text" 
                 value={prompt}
                 onChange={(e) => setPrompt(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                 placeholder="e.g. Find all users who signed up last week and have active orders..."
                 className="flex-1 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
               />
               <button 
                 onClick={handleGenerate}
                 disabled={generating}
                 className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 whitespace-nowrap"
               >
                 {generating ? <ArrowPathIcon className="w-4 h-4 animate-spin" /> : <SparklesIcon className="w-4 h-4" />}
                 Generate
               </button>
            </div>
         </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* SQL Editor */}
        <div className="flex-[2] flex flex-col gap-4">
           <div className="flex items-center gap-2">
             <button onClick={handleFormat} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm flex items-center gap-2">
               <TableCellsIcon className="w-4 h-4" /> Format SQL
             </button>
           </div>
           
           <CodeEditor 
             value={sql} 
             onChange={setSql} 
             language="sql" 
             placeholder="SELECT * FROM users..." 
           />
        </div>

        {/* Explanation Sidebar */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Explanation</h3>
             <button 
               onClick={handleExplain}
               disabled={loading || !sql.trim()}
               className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition disabled:opacity-50"
             >
               {loading ? 'Thinking...' : 'Explain Query'}
             </button>
          </div>
          <div className="flex-1 overflow-y-auto text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap custom-scrollbar">
             {explanation || (
               <span className="text-slate-400 dark:text-slate-500 italic">
                 Enter a SQL query and click "Explain" to understand how it works.
               </span>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};