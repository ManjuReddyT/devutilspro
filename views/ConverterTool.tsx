import React, { useState } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { ArrowsRightLeftIcon } from '@heroicons/react/24/outline';
import { jsonToXml, xmlToJson } from '../utils/xmlHelpers';

export const ConverterTool: React.FC = () => {
  const [left, setLeft] = useState(''); // JSON
  const [right, setRight] = useState(''); // XML
  const [error, setError] = useState('');

  const convertToXml = () => {
    setError('');
    try {
      const obj = JSON.parse(left);
      let xml = '';
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj) && Object.keys(obj).length === 1) {
        const rootKey = Object.keys(obj)[0];
        xml = jsonToXml(obj[rootKey], rootKey);
      } else {
        xml = jsonToXml(obj, 'root');
      }
      setRight(xml);
    } catch (e) {
      setError("Invalid JSON Input");
    }
  };

  const convertToJson = () => {
    setError('');
    try {
      const obj = xmlToJson(right);
      setLeft(JSON.stringify(obj, null, 2));
    } catch (e: any) {
      setError(e.message || "Invalid XML or Parse Error");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm rounded-lg border border-red-100 dark:border-red-900 flex items-center justify-between">
           <span>{error}</span>
           <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}
      
      <div className="flex-1 flex items-center justify-center">
        <div className="flex w-full h-full gap-4">
          <div className="flex-1 flex flex-col">
            <CodeEditor value={left} onChange={setLeft} language="json" label="JSON Source" placeholder='{ "root": { "@id": "1", "item": "value" } }' />
          </div>
          
          <div className="flex flex-col items-center justify-center gap-4 px-2">
            <button onClick={convertToXml} className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg transition transform hover:scale-105" title="JSON to XML">
               <ArrowsRightLeftIcon className="w-6 h-6" />
            </button>
            <button onClick={convertToJson} className="p-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 shadow-lg transition transform hover:scale-105" title="XML to JSON">
               <ArrowsRightLeftIcon className="w-6 h-6 rotate-180" />
            </button>
          </div>

          <div className="flex-1 flex flex-col">
            <CodeEditor value={right} onChange={setRight} language="xml" label="XML Output" placeholder='<root id="1"><item>value</item></root>' />
          </div>
        </div>
      </div>
    </div>
  );
};