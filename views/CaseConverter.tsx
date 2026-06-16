import React, { useState } from 'react';
import { DocumentDuplicateIcon, CheckIcon } from '@heroicons/react/24/outline';
import _ from 'lodash';

export const CaseConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const cases = [
    { id: 'camelCase', label: 'camelCase', value: _.camelCase(input) },
    { id: 'startCase', label: 'Start Case', value: _.startCase(input) },
    { id: 'snakeCase', label: 'snake_case', value: _.snakeCase(input) },
    { id: 'kebabCase', label: 'kebab-case', value: _.kebabCase(input) },
    { id: 'lowerCase', label: 'lower case', value: _.lowerCase(input) },
    { id: 'upperCase', label: 'UPPER CASE', value: _.upperCase(input) },
    { id: 'capitalize', label: 'Capitalize', value: _.capitalize(input) },
    { id: 'pascalCase', label: 'PascalCase', value: _.startCase(_.camelCase(input)).replace(/ /g, '') },
  ];

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-w-6xl mx-auto">
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1 min-h-[300px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
             <h3 className="font-semibold text-slate-800 dark:text-slate-200">Input Text</h3>
          </div>
          <div className="p-4 flex-1 flex flex-col">
             <textarea 
               value={input}
               onChange={(e) => setInput(e.target.value)}
               className="w-full flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 custom-scrollbar"
               placeholder="Enter text to convert (e.g. string case formatter)..."
             />
          </div>
        </div>
      </div>
      
      <div className="w-full lg:w-[500px] flex flex-col gap-4 overflow-y-auto custom-scrollbar lg:pr-2">
        {cases.map((c) => (
          <div key={c.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col shrink-0">
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{c.label}</h3>
              <button
                onClick={() => c.value && copyToClipboard(c.id, c.value)}
                disabled={!c.value}
                className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copiedId === c.id ? (
                  <>
                    <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 relative">
              <div className="font-mono text-sm text-slate-600 dark:text-slate-300 break-all select-all min-h-[1.25rem]">
                {c.value || <span className="text-slate-400 dark:text-slate-500 italic">Awaiting input...</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
