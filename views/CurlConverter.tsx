import React, { useState } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { convertCurlToCode } from '../services/geminiService';
import { CommandLineIcon, ArrowRightIcon } from '@heroicons/react/24/solid';

const TARGET_LANGUAGES = [
  { id: 'javascript', label: 'JavaScript (Fetch)' },
  { id: 'python', label: 'Python (Requests)' },
  { id: 'go', label: 'Go' },
  { id: 'java', label: 'Java (HttpClient)' },
  { id: 'bash', label: 'Bash (Raw Curl)' },
  { id: 'php', label: 'PHP (cURL)' },
];

export const CurlConverter: React.FC = () => {
  const [curl, setCurl] = useState('curl -X POST https://api.example.com/data \\\n  -H "Content-Type: application/json" \\\n  -d \'{"key":"value"}\'');
  const [targetLang, setTargetLang] = useState('javascript');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (!curl.trim()) return;
    setLoading(true);
    const result = await convertCurlToCode(curl, targetLang);
    setOutput(result);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Input Column */}
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col h-full">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
                 <CommandLineIcon className="w-4 h-4" /> cURL Command
              </label>
              <div className="flex-1 relative">
                 <CodeEditor 
                   value={curl} 
                   onChange={setCurl} 
                   language="bash" 
                   placeholder="Paste curl command here..." 
                 />
              </div>
           </div>
        </div>

        {/* Action & Output */}
        <div className="flex flex-col gap-4 h-full">
           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4 shrink-0">
              <div className="flex-1">
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Target Language</label>
                 <select 
                   value={targetLang}
                   onChange={(e) => setTargetLang(e.target.value)}
                   className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                 >
                    {TARGET_LANGUAGES.map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
                 </select>
              </div>
              <button 
                onClick={handleConvert}
                disabled={loading || !curl.trim()}
                className="mt-5 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-500/20"
              >
                {loading ? 'Converting...' : 'Convert'} 
                <ArrowRightIcon className="w-4 h-4" />
              </button>
           </div>

           <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col flex-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Generated Code</label>
              <div className="flex-1 relative">
                 <CodeEditor 
                   value={output} 
                   onChange={setOutput} 
                   language={targetLang === 'javascript' ? 'javascript' : 'text'} 
                   readOnly={false}
                   placeholder="// Result will appear here..." 
                 />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};