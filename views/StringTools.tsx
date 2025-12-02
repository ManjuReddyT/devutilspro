import React, { useState } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { ToolType } from '../types';

interface Props {
  mode: ToolType.BASE64 | ToolType.URL_ENCODER;
}

export const StringTools: React.FC<Props> = ({ mode }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isError, setIsError] = useState(false);

  const process = (action: 'encode' | 'decode') => {
    setIsError(false);
    try {
      if (mode === ToolType.BASE64) {
        if (action === 'encode') {
          // Handle UTF-8
          setOutput(btoa(unescape(encodeURIComponent(input))));
        } else {
          setOutput(decodeURIComponent(escape(window.atob(input))));
        }
      } else {
        if (action === 'encode') {
          setOutput(encodeURIComponent(input));
        } else {
          setOutput(decodeURIComponent(input));
        }
      }
    } catch (e) {
      setOutput('');
      setIsError(true);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col h-full">
        <div className="flex gap-4 mb-4 shrink-0">
           <button onClick={() => process('encode')} className="flex-1 bg-indigo-600 text-white font-medium py-2.5 rounded-lg hover:bg-indigo-700 transition">
             Encode
           </button>
           <button onClick={() => process('decode')} className="flex-1 bg-slate-800 dark:bg-slate-700 text-white font-medium py-2.5 rounded-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition">
             Decode
           </button>
        </div>

        {isError && (
           <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-900 shrink-0">
             Error: Invalid input for decoding.
           </div>
        )}

        <div className="flex-1 flex flex-col gap-4 min-h-0">
          <div className="flex-1 min-h-0">
             <CodeEditor 
               label="Input"
               value={input} 
               onChange={setInput} 
               language="text"
               placeholder={mode === ToolType.BASE64 ? "Text to encode/decode..." : "URL to encode/decode..."}
             />
          </div>

          <div className="flex-1 min-h-0">
             <CodeEditor 
               label="Output"
               value={output} 
               onChange={() => {}} 
               readOnly={true}
               language="text"
               placeholder="Result will appear here..."
             />
          </div>
        </div>
      </div>
    </div>
  );
};