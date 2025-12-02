import React, { useState } from 'react';
import { explainHttpError } from '../services/geminiService';
import { SignalIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/solid';

const HTTP_CODES = [
  { code: '200', text: 'OK', desc: 'The request succeeded.' },
  { code: '201', text: 'Created', desc: 'New resource created.' },
  { code: '204', text: 'No Content', desc: 'Success but no content to return.' },
  { code: '301', text: 'Moved Permanently', desc: 'URL has changed permanently.' },
  { code: '302', text: 'Found', desc: 'URL has changed temporarily.' },
  { code: '304', text: 'Not Modified', desc: 'Resource cached, no body sent.' },
  { code: '400', text: 'Bad Request', desc: 'Invalid syntax or validation error.' },
  { code: '401', text: 'Unauthorized', desc: 'Authentication required.' },
  { code: '403', text: 'Forbidden', desc: 'Authenticated but permission denied.' },
  { code: '404', text: 'Not Found', desc: 'Resource does not exist.' },
  { code: '405', text: 'Method Not Allowed', desc: 'HTTP method not supported.' },
  { code: '408', text: 'Request Timeout', desc: 'Server timed out waiting.' },
  { code: '422', text: 'Unprocessable Entity', desc: 'Validation errors (Semantic).' },
  { code: '429', text: 'Too Many Requests', desc: 'Rate limiting exceeded.' },
  { code: '500', text: 'Internal Server Error', desc: 'Generic server failure.' },
  { code: '502', text: 'Bad Gateway', desc: 'Upstream server response invalid.' },
  { code: '503', text: 'Service Unavailable', desc: 'Server overloaded or maintenance.' },
  { code: '504', text: 'Gateway Timeout', desc: 'Upstream server timed out.' },
];

export const HttpStatus: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCode, setSelectedCode] = useState(HTTP_CODES[0]);
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const filtered = HTTP_CODES.filter(c => 
    c.code.includes(search) || 
    c.text.toLowerCase().includes(search.toLowerCase())
  );

  const handleExplain = async () => {
    setLoading(true);
    const text = await explainHttpError(selectedCode.code, selectedCode.text);
    setExplanation(text);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 max-w-5xl mx-auto">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {/* Sidebar List */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
             <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <div className="relative">
                   <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                   <input 
                     type="text" 
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="w-full pl-9 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none"
                     placeholder="Search code..."
                   />
                </div>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                {filtered.map(c => (
                  <button
                    key={c.code}
                    onClick={() => { setSelectedCode(c); setExplanation(''); }}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition ${
                      selectedCode.code === c.code 
                        ? 'bg-indigo-600 text-white' 
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                     <span className="font-mono font-bold">{c.code}</span>
                     <span className={`text-sm ${selectedCode.code === c.code ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>{c.text}</span>
                  </button>
                ))}
             </div>
          </div>

          {/* Detail View */}
          <div className="md:col-span-2 flex flex-col gap-6">
             <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <div className={`text-6xl font-bold font-mono mb-4 ${
                   selectedCode.code.startsWith('2') ? 'text-green-500' :
                   selectedCode.code.startsWith('3') ? 'text-blue-500' :
                   selectedCode.code.startsWith('4') ? 'text-amber-500' :
                   'text-red-500'
                }`}>
                   {selectedCode.code}
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{selectedCode.text}</h2>
                <p className="text-slate-500 dark:text-slate-400">{selectedCode.desc}</p>
             </div>

             {/* AI Explanation */}
             <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-between">
                   <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                     <SparklesIcon className="w-5 h-5 text-indigo-500" /> AI Debugger
                   </h3>
                   <button 
                     onClick={handleExplain}
                     disabled={loading}
                     className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                   >
                     {loading ? 'Analyzing...' : 'Why does this happen?'}
                   </button>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                   {explanation ? (
                     <div className="prose prose-sm prose-slate dark:prose-invert max-w-none whitespace-pre-wrap">
                        {explanation}
                     </div>
                   ) : (
                     <div className="text-center text-slate-400 italic mt-10">
                        Click the button above to get a detailed explanation and common fixes for this error.
                     </div>
                   )}
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};