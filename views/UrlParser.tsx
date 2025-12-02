import React, { useState, useEffect } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { GlobeAltIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface QueryParam {
  key: string;
  value: string;
}

export const UrlParser: React.FC = () => {
  const [url, setUrl] = useState('https://example.com/search?q=react&sort=desc');
  const [protocol, setProtocol] = useState('https:');
  const [host, setHost] = useState('example.com');
  const [path, setPath] = useState('/search');
  const [params, setParams] = useState<QueryParam[]>([]);
  const [error, setError] = useState('');

  // Parse URL when string input changes
  useEffect(() => {
    try {
      if (!url) return;
      const u = new URL(url);
      setProtocol(u.protocol);
      setHost(u.hostname); // Hostname excludes port usually, host includes it. using hostname for simplicity or host if port needed
      setPath(u.pathname);
      
      const p: QueryParam[] = [];
      u.searchParams.forEach((value, key) => {
        p.push({ key, value });
      });
      setParams(p);
      setError('');
    } catch (e) {
      // Don't error while typing incomplete URL
    }
  }, [url]);

  // Rebuild URL when components change
  const rebuildUrl = (newParams: QueryParam[], newProto?: string, newHost?: string, newPath?: string) => {
    try {
      const u = new URL('https://placeholder.com'); // Base
      u.protocol = newProto || protocol;
      u.hostname = newHost || host;
      u.pathname = newPath || path;
      
      // Clear existing
      u.search = '';
      (newParams || params).forEach(p => {
        if (p.key) u.searchParams.append(p.key, p.value);
      });

      setUrl(u.href);
      setError('');
    } catch (e) {
      setError("Invalid URL components");
    }
  };

  const updateParam = (index: number, field: 'key' | 'value', val: string) => {
    const newParams = [...params];
    newParams[index] = { ...newParams[index], [field]: val };
    setParams(newParams);
    rebuildUrl(newParams);
  };

  const addParam = () => {
    const newParams = [...params, { key: '', value: '' }];
    setParams(newParams);
    // Don't rebuild yet, let them type
  };

  const removeParam = (index: number) => {
    const newParams = params.filter((_, i) => i !== index);
    setParams(newParams);
    rebuildUrl(newParams);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 max-w-5xl mx-auto">
      {/* Full URL Input */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
         <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-2">
            <GlobeAltIcon className="w-4 h-4" /> Full URL
         </label>
         <input 
           type="text" 
           value={url}
           onChange={(e) => setUrl(e.target.value)}
           className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-lg font-mono text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none"
         />
         {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
         {/* Path Components */}
         <div className="lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4 h-fit">
            <h3 className="font-bold text-slate-800 dark:text-white mb-2">Components</h3>
            
            <div>
               <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Protocol</label>
               <select 
                 value={protocol}
                 onChange={(e) => { setProtocol(e.target.value); rebuildUrl(params, e.target.value); }}
                 className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm outline-none"
               >
                 <option value="https:">https://</option>
                 <option value="http:">http://</option>
                 <option value="ftp:">ftp://</option>
                 <option value="ws:">ws://</option>
                 <option value="wss:">wss://</option>
               </select>
            </div>

            <div>
               <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Host</label>
               <input 
                 type="text" 
                 value={host}
                 onChange={(e) => { setHost(e.target.value); rebuildUrl(params, undefined, e.target.value); }}
                 className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm outline-none font-mono"
               />
            </div>

            <div>
               <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Path</label>
               <input 
                 type="text" 
                 value={path}
                 onChange={(e) => { setPath(e.target.value); rebuildUrl(params, undefined, undefined, e.target.value); }}
                 className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm outline-none font-mono"
               />
            </div>
         </div>

         {/* Query Params */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold text-slate-800 dark:text-white">Query Parameters</h3>
               <button 
                 onClick={addParam}
                 className="flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition"
               >
                 <PlusIcon className="w-3 h-3" /> Add Param
               </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
               {params.length === 0 && (
                 <div className="text-center text-slate-400 text-sm italic py-8">No query parameters</div>
               )}
               {params.map((p, i) => (
                 <div key={i} className="flex gap-2 items-center">
                    <input 
                      type="text" 
                      placeholder="Key"
                      value={p.key}
                      onChange={(e) => updateParam(i, 'key', e.target.value)}
                      className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-sm outline-none font-mono text-indigo-600 dark:text-indigo-400"
                    />
                    <span className="text-slate-400">=</span>
                    <input 
                      type="text" 
                      placeholder="Value"
                      value={p.value}
                      onChange={(e) => updateParam(i, 'value', e.target.value)}
                      className="flex-[2] p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-sm outline-none font-mono text-slate-700 dark:text-slate-300"
                    />
                    <button 
                      onClick={() => removeParam(i)}
                      className="p-2 text-slate-400 hover:text-red-500 transition"
                    >
                       <TrashIcon className="w-4 h-4" />
                    </button>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};