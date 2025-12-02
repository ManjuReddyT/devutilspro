import React, { useState, useRef, useMemo } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { generateSampleData, fixAndFormatXml } from '../services/geminiService';
import { formatXml, minifyXml, xmlToJson } from '../utils/xmlHelpers';
import { JsonTree } from '../components/JsonTree';
import { XmlAnalyzerPane } from './XmlSizeAnalyzer';
import { DiffViewer } from '../components/DiffViewer';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  CloudArrowDownIcon,
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ArrowsRightLeftIcon,
  PencilSquareIcon
} from '@heroicons/react/24/solid';

enum Tab {
  FORMAT_VALIDATE = 'Format & Validate',
  VISUALIZER = 'Visualizer',
  ANALYZER = 'Size Analysis',
  COMPARE = 'Compare',
  CONVERT = 'Convert to JSON'
}

export const XmlTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.FORMAT_VALIDATE);

  // Format & Validate State
  const [input, setInput] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compare State
  const [leftXml, setLeftXml] = useState('');
  const [rightXml, setRightXml] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [diffError, setDiffError] = useState('');

  // Convert State
  const [jsonOutput, setJsonOutput] = useState('');

  const handleFormat = () => {
    try {
      if (!input.trim()) return;
      const parser = new DOMParser();
      const doc = parser.parseFromString(input, "application/xml");
      const errorNode = doc.querySelector('parsererror');
      if (errorNode) {
        throw new Error("Invalid XML: " + errorNode.textContent);
      }
      const formatted = formatXml(input);
      setInput(formatted);
      setIsValid(true);
      setErrorMsg('');
    } catch (e: any) {
      setIsValid(false);
      setErrorMsg(e.message);
    }
  };

  const handleMinify = () => {
    setInput(minifyXml(input));
    setIsValid(null); // Minifying doesn't strictly validate, but resets state
  };

  const handleAiFix = async () => {
    setIsFixing(true);
    const result = await fixAndFormatXml(input);
    setInput(result.fixed);
    setIsFixing(false);
    handleFormat(); // Re-validate after fixing
  };

  const handleGenerate = async () => {
    setLoading(true);
    const data = await generateSampleData('xml', 'user profile with address and orders');
    setInput(data);
    setLoading(false);
    setIsValid(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(content);
      setIsValid(null);
      setErrorMsg('');
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleSaveFile = () => {
    const blob = new Blob([input], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.xml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCompare = () => {
    try {
      setDiffError('');
      if (!leftXml.trim() || !rightXml.trim()) {
        setDiffError("Please enter XML in both fields to compare.");
        return;
      }

      // Format both for better diffing
      const normLeft = formatXml(leftXml);
      const normRight = formatXml(rightXml);
      
      setLeftXml(normLeft);
      setRightXml(normRight);

      setShowDiff(true);
    } catch (e) {
      setDiffError("Invalid XML in one or both editors.");
    }
  };
  
  const handleConvertToJson = () => {
    try {
      if (!input.trim()) return;
      const obj = xmlToJson(input);
      setJsonOutput(JSON.stringify(obj, null, 2));
    } catch (e: any) {
      setJsonOutput(`Error converting to JSON: ${e.message}`);
    }
  };

  // Visualizer Data
  const parsedVizData = useMemo(() => {
    try {
      if (!input.trim()) return null;
      return xmlToJson(input);
    } catch (e) {
      return null;
    }
  }, [input]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Tab Nav */}
      <div className="flex gap-4 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 shrink-0 overflow-x-auto custom-scrollbar">
        {Object.values(Tab).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); if (tab === Tab.CONVERT) handleConvertToJson(); }}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-colors whitespace-nowrap ${
              activeTab === tab 
                ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === Tab.FORMAT_VALIDATE && (
        <div className="flex flex-col flex-1 gap-4 min-h-0">
           <input 
             type="file" 
             ref={fileInputRef} 
             onChange={handleFileUpload} 
             accept=".xml" 
             className="hidden" 
           />

           <div className="flex items-center gap-2 flex-wrap shrink-0">
             <button onClick={handleFormat} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition shadow-sm">Format & Validate</button>
             <button onClick={handleMinify} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">Minify</button>
             
             <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2"></div>
             
             <button 
               onClick={() => fileInputRef.current?.click()} 
               className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
               title="Load XML from File"
             >
               <ArrowUpTrayIcon className="w-5 h-5" />
             </button>
             
             <button 
               onClick={handleSaveFile} 
               className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
               title="Save XML to File"
             >
               <ArrowDownTrayIcon className="w-5 h-5" />
             </button>

             <button 
               onClick={handleGenerate} 
               disabled={loading}
               className="ml-auto flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-medium"
             >
               {loading ? 'Generating...' : 'Generate Sample XML'}
               <CloudArrowDownIcon className="w-4 h-4" />
             </button>

             <button 
                onClick={handleAiFix} 
                disabled={isFixing}
                className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-md text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition disabled:opacity-50"
              >
                <SparklesIcon className="w-4 h-4" />
                {isFixing ? 'Fixing...' : 'AI Auto-Fix'}
              </button>
           </div>

           <div className="flex-1 min-h-0">
             <CodeEditor 
               value={input} 
               onChange={setInput} 
               language="xml" 
               placeholder="Paste XML here..." 
             />
           </div>

           <div className={`p-4 rounded-lg flex items-start gap-3 shrink-0 ${isValid === false ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900' : isValid === true ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
             {isValid === true && <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />}
             {isValid === false && <XCircleIcon className="w-5 h-5 text-red-500 mt-0.5" />}
             <div className="flex-1">
               <p className={`font-medium text-sm ${isValid === false ? 'text-red-700 dark:text-red-300' : isValid === true ? 'text-green-700 dark:text-green-300' : 'text-slate-500 dark:text-slate-400'}`}>
                 {isValid === true ? 'Valid XML' : isValid === false ? 'Invalid XML' : 'Waiting for input...'}
               </p>
               {errorMsg && <p className="text-red-600 dark:text-red-400 text-xs mt-1 font-mono">{errorMsg}</p>}
             </div>
           </div>
        </div>
      )}

      {activeTab === Tab.VISUALIZER && (
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {parsedVizData ? (
             <>
               <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                  <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">
                    DOM Tree Visualizer (JSON Representation)
                  </div>
               </div>
               
               <div className="flex-1 overflow-auto custom-scrollbar p-4 relative">
                  <JsonTree data={parsedVizData} />
               </div>
             </>
          ) : (
             <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-2">
                <ExclamationTriangleIcon className="w-8 h-8 opacity-50" />
                <p>Please enter valid XML in the "Format & Validate" tab first.</p>
             </div>
          )}
        </div>
      )}

      {activeTab === Tab.ANALYZER && (
        <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-6">
           <XmlAnalyzerPane input={input} />
        </div>
      )}

      {activeTab === Tab.COMPARE && (
        <div className="flex flex-col flex-1 gap-4 min-h-0">
           <div className="flex items-center gap-2 shrink-0">
              {!showDiff ? (
                <button onClick={handleCompare} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition flex items-center gap-2">
                  <ArrowsRightLeftIcon className="w-4 h-4" /> Run Comparison
                </button>
              ) : (
                <button onClick={() => setShowDiff(false)} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-2">
                  <PencilSquareIcon className="w-4 h-4" /> Back to Edit
                </button>
              )}
           </div>
           
           {diffError && (
             <div className="p-4 rounded-md border flex items-start gap-3 shrink-0 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
               <XCircleIcon className="w-5 h-5 shrink-0" />
               <span className="text-sm font-medium">{diffError}</span>
               <button onClick={() => setDiffError('')} className="ml-auto hover:opacity-75">&times;</button>
             </div>
           )}

           {showDiff ? (
             <div className="flex flex-1 min-h-0">
                <DiffViewer original={leftXml} modified={rightXml} />
             </div>
           ) : (
             <div className="flex flex-1 gap-4 min-h-0 min-w-0 overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                  <CodeEditor value={leftXml} onChange={setLeftXml} language="xml" label="Original XML" placeholder="<root>...</root>" />
                </div>
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                  <CodeEditor value={rightXml} onChange={setRightXml} language="xml" label="Modified XML" placeholder="<root>...</root>" />
                </div>
             </div>
           )}
        </div>
      )}
      
      {activeTab === Tab.CONVERT && (
        <div className="flex flex-col flex-1 gap-6 min-h-0">
           <div className="flex items-center gap-4 shrink-0 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex-1">
                 <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Convert XML to JSON</h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Uses the valid XML from the main tab as input.</p>
              </div>
              <button onClick={handleConvertToJson} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium">
                 <ArrowsRightLeftIcon className="w-4 h-4" /> Convert
              </button>
           </div>
           
           <div className="flex flex-1 gap-4 min-h-0">
             <div className="flex-1 flex flex-col min-h-0">
                <CodeEditor value={input} onChange={setInput} language="xml" label="XML Source (Editable)" placeholder="<root>...</root>" />
             </div>
             <div className="flex items-center justify-center text-slate-400">
                <ArrowsRightLeftIcon className="w-6 h-6" />
             </div>
             <div className="flex-1 flex flex-col min-h-0">
                <CodeEditor value={jsonOutput} onChange={setJsonOutput} language="json" label="JSON Output" placeholder="{...}" />
             </div>
           </div>
        </div>
      )}
    </div>
  );
};