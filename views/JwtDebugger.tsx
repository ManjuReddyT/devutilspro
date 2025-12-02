import React, { useState, useEffect } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { explainJwt } from '../services/geminiService';
import { SparklesIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export const JwtDebugger: React.FC = () => {
  const [token, setToken] = useState('');
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [signature, setSignature] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token.trim()) {
      setHeader('');
      setPayload('');
      setSignature('');
      setError('');
      return;
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error("Invalid JWT format (must have 3 parts separated by dots).");
      }

      const decode = (str: string) => {
        try {
          // Replace URL-safe chars
          const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
          // Pad if needed
          const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
          return JSON.stringify(JSON.parse(window.atob(padded)), null, 2);
        } catch (e) {
          throw new Error("Failed to decode Base64 string.");
        }
      };

      setHeader(decode(parts[0]));
      setPayload(decode(parts[1]));
      setSignature(parts[2]); // Signature is raw hex/base64 usually not decoded to text
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  }, [token]);

  const handleExplain = async () => {
    if (!payload) return;
    setLoading(true);
    try {
      const text = await explainJwt(JSON.parse(header), JSON.parse(payload));
      setExplanation(text);
    } catch (e) {
      setExplanation("Could not explain token.");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 max-w-6xl mx-auto">
      {/* Input Area */}
      <div className="flex-1 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
         <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">Encoded Token</h3>
         <textarea 
           value={token}
           onChange={(e) => setToken(e.target.value)}
           className="w-full h-32 p-4 font-mono text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg resize-none focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 break-all"
           placeholder="Paste JWT here (ey...)"
         />
         {error && (
           <div className="mt-2 text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
             <ExclamationTriangleIcon className="w-4 h-4" />
             {error}
           </div>
         )}
      </div>

      {/* Decoded Sections */}
      <div className="flex-[2] grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Header */}
        <div className="flex flex-col h-full">
           <CodeEditor 
             value={header} 
             onChange={() => {}} 
             language="json" 
             readOnly 
             label="Header (Algorithm & Type)"
             className="border-t-4 border-t-red-500 rounded-lg"
           />
        </div>

        {/* Payload */}
        <div className="flex flex-col h-full">
           <CodeEditor 
             value={payload} 
             onChange={() => {}} 
             language="json" 
             readOnly 
             label="Payload (Data)"
             className="border-t-4 border-t-purple-500 rounded-lg"
           />
        </div>

        {/* AI Analysis / Signature */}
        <div className="flex flex-col h-full gap-4">
           <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col h-1/3 p-4 border-t-4 border-t-blue-500">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Signature</label>
              <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded p-2 text-xs font-mono break-all overflow-y-auto text-slate-500 dark:text-slate-400">
                {signature || "Waiting for input..."}
              </div>
           </div>

           <div className="flex-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 p-4 flex flex-col relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4 text-indigo-500" /> AI Inspector
                </h3>
                <button 
                  onClick={handleExplain} 
                  disabled={loading || !payload}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition disabled:opacity-50"
                >
                  {loading ? 'Analyzing...' : 'Analyze Claims'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto text-sm text-indigo-900 dark:text-indigo-100 leading-relaxed custom-scrollbar">
                {explanation || "Click Analyze to get a plain-English explanation of who issued this token, when it expires, and what permissions it grants."}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};