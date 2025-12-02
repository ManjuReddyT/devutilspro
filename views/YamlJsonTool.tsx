import React, { useState } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { ArrowsRightLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import yaml from 'js-yaml';
import { validateK8sManifest } from '../services/geminiService';

export const YamlJsonTool: React.FC = () => {
  const [left, setLeft] = useState(''); // YAML
  const [right, setRight] = useState(''); // JSON
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState('');
  const [validating, setValidating] = useState(false);

  const convertToYaml = () => {
    setError('');
    try {
      const obj = JSON.parse(right);
      const y = yaml.dump(obj);
      setLeft(y);
    } catch (e: any) {
      setError(`JSON Parse Error: ${e.message}`);
    }
  };

  const convertToJson = () => {
    setError('');
    try {
      const obj = yaml.load(left);
      setRight(JSON.stringify(obj, null, 2));
    } catch (e: any) {
      setError(`YAML Parse Error: ${e.message}`);
    }
  };

  const handleValidateK8s = async () => {
    if (!left.trim()) return;
    setValidating(true);
    const result = await validateK8sManifest(left);
    setValidationResult(result);
    setValidating(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-900 flex items-center justify-between">
           <span>{error}</span>
           <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}
      
      <div className="flex-1 flex gap-4 min-h-0">
        {/* YAML Side */}
        <div className="flex-1 flex flex-col gap-4">
           <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">YAML</label>
              <button 
                onClick={handleValidateK8s}
                disabled={validating || !left}
                className="flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 transition disabled:opacity-50"
              >
                <ShieldCheckIcon className="w-3.5 h-3.5" />
                {validating ? 'Scanning...' : 'Validate K8s'}
              </button>
           </div>
           <CodeEditor value={left} onChange={setLeft} language="yaml" placeholder="apiVersion: v1..." />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center gap-4 px-2">
          <button onClick={convertToJson} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg transition transform hover:scale-105" title="YAML to JSON">
              <ArrowsRightLeftIcon className="w-6 h-6" />
          </button>
          <button onClick={convertToYaml} className="p-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 shadow-lg transition transform hover:scale-105" title="JSON to YAML">
              <ArrowsRightLeftIcon className="w-6 h-6 rotate-180" />
          </button>
        </div>

        {/* JSON Side */}
        <div className="flex-1 flex flex-col gap-4">
           <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">JSON</label>
           <CodeEditor value={right} onChange={setRight} language="json" placeholder="{...}" />
        </div>
      </div>

      {/* Validation Result Pane */}
      {validationResult && (
        <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-2">
           <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Kubernetes Manifest Analysis</h3>
              <button onClick={() => setValidationResult('')} className="text-slate-400 hover:text-slate-600 text-xs">Close</button>
           </div>
           <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
             {validationResult}
           </div>
        </div>
      )}
    </div>
  );
};