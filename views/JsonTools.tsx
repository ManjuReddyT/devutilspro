import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { JsonTree } from '../components/JsonTree';
import { JsonAnalyzerPane } from './JsonSizeAnalyzer';
import { DiffViewer } from '../components/DiffViewer';
import { fixAndFormatJson } from '../services/geminiService';
import { jsonToXml } from '../utils/xmlHelpers';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  SparklesIcon, 
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  TableCellsIcon,
  ListBulletIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChartBarIcon,
  ArrowsRightLeftIcon,
  PencilSquareIcon
} from '@heroicons/react/24/solid';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area
} from 'recharts';
import { JsonStats } from '../types';
import { JSONPath } from 'jsonpath-plus';

enum Tab {
  FORMAT_VALIDATE = 'Format & Validate',
  VISUALIZER = 'Visualizer',
  ANALYZER = 'Size Analysis',
  COMPARE = 'Compare',
  QUERY = 'Query / Filter',
  CONVERT = 'Convert to XML'
}

export const JsonTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.FORMAT_VALIDATE);
  
  // Format/Validate State
  const [input, setInput] = useState('');
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isFixing, setIsFixing] = useState(false);
  const [stats, setStats] = useState<JsonStats | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compare State
  const [leftJson, setLeftJson] = useState('');
  const [rightJson, setRightJson] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [diffError, setDiffError] = useState('');

  // Query State
  const [queryPath, setQueryPath] = useState('$.store.book[*].author');
  const [queryResult, setQueryResult] = useState('');
  
  // Convert State
  const [xmlOutput, setXmlOutput] = useState('');

  // Visualizer State
  const [vizMode, setVizMode] = useState<'tree' | 'table' | 'chart'>('tree');
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'} | null>(null);
  const [chartConfig, setChartConfig] = useState<{type: 'bar' | 'line' | 'area', xKey: string, yKey: string}>({
    type: 'bar',
    xKey: '',
    yKey: ''
  });

  const handleFormat = () => {
    try {
      if (!input.trim()) return;
      const parsed = JSON.parse(input);
      const formatted = JSON.stringify(parsed, null, 2);
      setInput(formatted);
      setIsValid(true);
      setErrorMsg('');
      analyzeStats(parsed);
    } catch (e: any) {
      setIsValid(false);
      setErrorMsg(e.message);
      setStats(null);
    }
  };

  const analyzeStats = (obj: any) => {
    const s: JsonStats = { strings: 0, numbers: 0, booleans: 0, objects: 0, arrays: 0, nulls: 0 };
    
    const traverse = (item: any) => {
      if (item === null) s.nulls++;
      else if (Array.isArray(item)) {
        s.arrays++;
        item.forEach(traverse);
      } else if (typeof item === 'object') {
        s.objects++;
        Object.values(item).forEach(traverse);
      } else if (typeof item === 'string') s.strings++;
      else if (typeof item === 'number') s.numbers++;
      else if (typeof item === 'boolean') s.booleans++;
    };
    
    traverse(obj);
    setStats(s);
  };

  const handleAiFix = async () => {
    setIsFixing(true);
    const result = await fixAndFormatJson(input);
    setInput(result.fixed);
    setIsFixing(false);
    handleFormat(); // Re-validate
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(input);
      setInput(JSON.stringify(parsed));
      setIsValid(true);
    } catch (e: any) {
      setIsValid(false);
      setErrorMsg(e.message);
    }
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
      setStats(null);
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleSaveFile = () => {
    const blob = new Blob([input], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCompare = () => {
    try {
      setDiffError('');
      if (!leftJson.trim() || !rightJson.trim()) {
        setDiffError("Please enter JSON in both fields to compare.");
        return;
      }

      // Format both for better diffing
      const obj1 = JSON.parse(leftJson);
      const obj2 = JSON.parse(rightJson);
      
      setLeftJson(JSON.stringify(obj1, null, 2));
      setRightJson(JSON.stringify(obj2, null, 2));
      
      setShowDiff(true);
    } catch (e) {
      setDiffError("Invalid JSON in one or both editors. Please fix before comparing.");
    }
  };

  const handleRunQuery = () => {
    try {
      const jsonData = JSON.parse(input || '{}');
      const result = JSONPath({ path: queryPath, json: jsonData });
      setQueryResult(JSON.stringify(result, null, 2));
    } catch (e: any) {
      setQueryResult(`Error: ${e.message}`);
    }
  };
  
  const handleConvertToXml = () => {
    try {
      if (!input.trim()) return;
      const obj = JSON.parse(input);
      let xml = '';
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj) && Object.keys(obj).length === 1) {
        const rootKey = Object.keys(obj)[0];
        xml = jsonToXml(obj[rootKey], rootKey);
      } else {
        xml = jsonToXml(obj, 'root');
      }
      setXmlOutput(xml);
    } catch (e: any) {
      setXmlOutput(`Error converting to XML: ${e.message}`);
    }
  };

  // --- Visualizer Logic ---
  const parsedVizData = useMemo(() => {
    try {
      if (!input.trim()) return null;
      return JSON.parse(input);
    } catch (e) {
      return null;
    }
  }, [input]);

  const isArrayOfObjects = useMemo(() => {
    return Array.isArray(parsedVizData) && parsedVizData.length > 0 && typeof parsedVizData[0] === 'object';
  }, [parsedVizData]);

  const gridColumns = useMemo(() => {
    if (!isArrayOfObjects) return [];
    // Extract all unique keys from first 50 objects to build columns
    const keys = new Set<string>();
    parsedVizData.slice(0, 50).forEach((obj: any) => {
      if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach(k => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [parsedVizData, isArrayOfObjects]);

  const chartKeys = useMemo(() => {
    if (!isArrayOfObjects) return { x: [], y: [] };
    const x = new Set<string>();
    const y = new Set<string>();
    
    // Scan first 100 items for candidates
    parsedVizData.slice(0, 100).forEach((item: any) => {
       if (!item || typeof item !== 'object') return;
       Object.keys(item).forEach(k => {
          const val = item[k];
          if (typeof val === 'string' || typeof val === 'number') x.add(k);
          if (typeof val === 'number') y.add(k);
       });
    });
    
    return { x: Array.from(x), y: Array.from(y) };
  }, [parsedVizData, isArrayOfObjects]);

  const sortedGridData = useMemo(() => {
    if (!isArrayOfObjects || !sortConfig) return parsedVizData;
    const sorted = [...parsedVizData];
    sorted.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [parsedVizData, sortConfig, isArrayOfObjects]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Auto-select defaults when switching to chart mode
  useEffect(() => {
    if (vizMode === 'chart' && isArrayOfObjects) {
       if (!chartConfig.xKey && chartKeys.x.length > 0) {
          setChartConfig(prev => ({ ...prev, xKey: chartKeys.x[0] }));
       }
       if (!chartConfig.yKey && chartKeys.y.length > 0) {
          setChartConfig(prev => ({ ...prev, yKey: chartKeys.y[0] }));
       }
    }
  }, [vizMode, isArrayOfObjects, chartKeys]);

  const statsData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Strings', value: stats.strings, color: '#8884d8' },
      { name: 'Numbers', value: stats.numbers, color: '#82ca9d' },
      { name: 'Booleans', value: stats.booleans, color: '#ffc658' },
      { name: 'Objects', value: stats.objects, color: '#ff8042' },
      { name: 'Arrays', value: stats.arrays, color: '#8dd1e1' },
      { name: 'Nulls', value: stats.nulls, color: '#a4de6c' },
    ].filter(d => d.value > 0);
  }, [stats]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Tab Nav */}
      <div className="flex gap-4 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2 shrink-0 overflow-x-auto custom-scrollbar">
        {Object.values(Tab).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); if (tab === Tab.CONVERT) handleConvertToXml(); }}
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
        <div className="flex flex-1 gap-6 min-h-0">
          <div className="flex-[2] flex flex-col gap-4 min-h-0">
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".json" 
                className="hidden" 
              />
              
              <button onClick={handleFormat} className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition shadow-sm">Format & Validate</button>
              <button onClick={handleMinify} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-md text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm">Minify</button>
              
              <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2"></div>

              <button 
                onClick={() => fileInputRef.current?.click()} 
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
                title="Load JSON from File"
              >
                <ArrowUpTrayIcon className="w-5 h-5" />
              </button>
              
              <button 
                onClick={handleSaveFile} 
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm"
                title="Save JSON to File"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
              </button>

              <button 
                onClick={handleAiFix} 
                disabled={isFixing}
                className="ml-auto flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-4 py-2 rounded-md text-sm hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition disabled:opacity-50"
              >
                <SparklesIcon className="w-4 h-4" />
                {isFixing ? 'Fixing...' : 'AI Auto-Fix'}
              </button>
            </div>
            
            <div className="flex-1 min-h-0">
               <CodeEditor 
                 value={input} 
                 onChange={setInput} 
                 language="json" 
                 placeholder="Paste JSON here..." 
               />
            </div>
            
            {/* Status Bar */}
            <div className={`p-4 rounded-lg flex items-start gap-3 shrink-0 ${isValid === false ? 'bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900' : isValid === true ? 'bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
              {isValid === true && <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5" />}
              {isValid === false && <XCircleIcon className="w-5 h-5 text-red-500 mt-0.5" />}
              <div className="flex-1">
                <p className={`font-medium text-sm ${isValid === false ? 'text-red-700 dark:text-red-300' : isValid === true ? 'text-green-700 dark:text-green-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  {isValid === true ? 'Valid JSON' : isValid === false ? 'Invalid JSON' : 'Waiting for input...'}
                </p>
                {errorMsg && <p className="text-red-600 dark:text-red-400 text-xs mt-1 font-mono">{errorMsg}</p>}
              </div>
            </div>
          </div>

          {/* Stats Sidebar */}
          {stats && (
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-col overflow-y-auto">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider shrink-0">Structure Analysis</h3>
              <div className="h-64 w-full shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px', color: '#94a3b8'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 shrink-0">
                {statsData.map(s => (
                  <div key={s.name} className="flex justify-between text-xs border-b border-slate-50 dark:border-slate-700 py-1">
                    <span className="text-slate-500 dark:text-slate-400">{s.name}</span>
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-200">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === Tab.VISUALIZER && (
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {parsedVizData ? (
             <>
               <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                     <button 
                       onClick={() => setVizMode('tree')} 
                       className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${vizMode === 'tree' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                     >
                       <ListBulletIcon className="w-3.5 h-3.5" /> Tree View
                     </button>
                     {isArrayOfObjects && (
                       <>
                         <button 
                           onClick={() => setVizMode('table')} 
                           className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${vizMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                         >
                           <TableCellsIcon className="w-3.5 h-3.5" /> Table View
                         </button>
                         <button 
                           onClick={() => setVizMode('chart')} 
                           className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${vizMode === 'chart' ? 'bg-indigo-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                         >
                           <ChartBarIcon className="w-3.5 h-3.5" /> Chart View
                         </button>
                       </>
                     )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {Array.isArray(parsedVizData) ? `${parsedVizData.length} items` : 'Root Object'}
                  </div>
               </div>
               
               <div className="flex-1 overflow-auto custom-scrollbar p-4 relative">
                  {vizMode === 'tree' ? (
                     <JsonTree data={parsedVizData} />
                  ) : vizMode === 'table' ? (
                    <div className="w-full">
                       <table className="w-full text-left border-collapse text-sm">
                          <thead>
                             <tr className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                                <th className="p-3 border-b border-slate-200 dark:border-slate-700 text-slate-400 font-mono text-xs w-12 text-center">#</th>
                                {gridColumns.map(col => (
                                  <th 
                                    key={col} 
                                    onClick={() => handleSort(col)}
                                    className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition select-none group"
                                  >
                                    <div className="flex items-center gap-1">
                                      {col}
                                      {sortConfig?.key === col && (
                                        sortConfig.direction === 'asc' 
                                          ? <ChevronUpIcon className="w-3 h-3 text-indigo-500" /> 
                                          : <ChevronDownIcon className="w-3 h-3 text-indigo-500" />
                                      )}
                                    </div>
                                  </th>
                                ))}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                             {sortedGridData.map((row: any, i: number) => (
                                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                   <td className="p-3 text-slate-400 font-mono text-xs text-center border-r border-slate-100 dark:border-slate-800/50">{i + 1}</td>
                                   {gridColumns.map(col => (
                                     <td key={col} className="p-3 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={String(row[col])}>
                                        {typeof row[col] === 'object' 
                                          ? <span className="text-xs text-slate-400 italic">{Array.isArray(row[col]) ? '[Array]' : '{Object}'}</span> 
                                          : String(row[col] ?? '')
                                        }
                                     </td>
                                   ))}
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                       {/* Chart Controls */}
                       <div className="flex flex-wrap gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                          <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Chart Type</label>
                             <select 
                               value={chartConfig.type} 
                               onChange={(e) => setChartConfig(c => ({...c, type: e.target.value as any}))}
                               className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-sm outline-none dark:text-white cursor-pointer"
                             >
                               <option value="bar">Bar Chart</option>
                               <option value="line">Line Chart</option>
                               <option value="area">Area Chart</option>
                             </select>
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">X Axis (Label)</label>
                             <select 
                               value={chartConfig.xKey} 
                               onChange={(e) => setChartConfig(c => ({...c, xKey: e.target.value}))}
                               className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-sm outline-none dark:text-white min-w-[150px] cursor-pointer"
                             >
                               {chartKeys.x.map(k => <option key={k} value={k}>{k}</option>)}
                             </select>
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Y Axis (Value)</label>
                             <select 
                               value={chartConfig.yKey} 
                               onChange={(e) => setChartConfig(c => ({...c, yKey: e.target.value}))}
                               className="p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-sm outline-none dark:text-white min-w-[150px] cursor-pointer"
                             >
                               {chartKeys.y.map(k => <option key={k} value={k}>{k}</option>)}
                             </select>
                          </div>
                       </div>
                       
                       <div className="flex-1 min-h-0">
                          {chartConfig.yKey ? (
                            <ResponsiveContainer width="100%" height="100%">
                               {chartConfig.type === 'bar' ? (
                                 <BarChart data={parsedVizData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey={chartConfig.xKey} stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                      itemStyle={{ color: '#818cf8' }}
                                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey={chartConfig.yKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
                                 </BarChart>
                               ) : chartConfig.type === 'line' ? (
                                 <LineChart data={parsedVizData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey={chartConfig.xKey} stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                      itemStyle={{ color: '#818cf8' }}
                                    />
                                    <Line type="monotone" dataKey={chartConfig.yKey} stroke="#6366f1" strokeWidth={2} dot={{fill: '#6366f1'}} activeDot={{ r: 6 }} />
                                 </LineChart>
                               ) : (
                                 <AreaChart data={parsedVizData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey={chartConfig.xKey} stroke="#94a3b8" fontSize={12} tickMargin={10} />
                                    <YAxis stroke="#94a3b8" fontSize={12} />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                      itemStyle={{ color: '#818cf8' }}
                                    />
                                    <Area type="monotone" dataKey={chartConfig.yKey} stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                                 </AreaChart>
                               )}
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 italic flex-col gap-2">
                               <ChartBarIcon className="w-10 h-10 opacity-20" />
                               <p>No numeric fields found to chart.</p>
                               <p className="text-xs opacity-60">Charts require numeric values (e.g. price, count, id) in your objects.</p>
                            </div>
                          )}
                       </div>
                    </div>
                  )}
               </div>
             </>
          ) : (
             <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-2">
                <ExclamationTriangleIcon className="w-8 h-8 opacity-50" />
                <p>Please enter valid JSON in the "Format & Validate" tab first.</p>
             </div>
          )}
        </div>
      )}

      {activeTab === Tab.ANALYZER && (
        <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-6">
           <JsonAnalyzerPane input={input} />
        </div>
      )}

      {activeTab === Tab.QUERY && (
        <div className="flex flex-col flex-1 gap-6 min-h-0">
          <div className="flex gap-6 h-full min-h-0">
            {/* Input Side */}
            <div className="flex-1 flex flex-col gap-2 min-h-0">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">Source JSON</label>
              <CodeEditor value={input} onChange={setInput} language="json" placeholder="Paste source JSON here..." />
            </div>
            
            {/* Query & Output Side */}
            <div className="flex-1 flex flex-col gap-4 min-h-0">
               <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">JSONPath Query</label>
                  <div className="flex gap-2">
                     <input 
                       type="text" 
                       value={queryPath}
                       onChange={(e) => setQueryPath(e.target.value)}
                       onKeyDown={(e) => e.key === 'Enter' && handleRunQuery()}
                       className="flex-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-md text-sm font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                       placeholder="$.store.book[*].author"
                     />
                     <button onClick={handleRunQuery} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2 text-sm font-medium">
                        <FunnelIcon className="w-4 h-4" /> Filter
                     </button>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Example: <code>$.store.book[*].author</code> or <code>$..author</code>
                  </p>
               </div>

               <div className="flex-1 flex flex-col gap-2 min-h-0">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">Filtered Result</label>
                  <CodeEditor value={queryResult} onChange={() => {}} language="json" readOnly={true} placeholder="Results will appear here..." />
               </div>
            </div>
          </div>
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
                <DiffViewer original={leftJson} modified={rightJson} />
             </div>
           ) : (
             <div className="flex flex-1 gap-4 min-h-0 min-w-0 overflow-hidden">
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                  <CodeEditor value={leftJson} onChange={setLeftJson} language="json" label="Original JSON" placeholder="{...}" />
                </div>
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                  <CodeEditor value={rightJson} onChange={setRightJson} language="json" label="Modified JSON" placeholder="{...}" />
                </div>
             </div>
           )}
        </div>
      )}
      
      {activeTab === Tab.CONVERT && (
        <div className="flex flex-col flex-1 gap-6 min-h-0">
           <div className="flex items-center gap-4 shrink-0 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex-1">
                 <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">Convert JSON to XML</h3>
                 <p className="text-xs text-slate-500 dark:text-slate-400">Uses the valid JSON from the main tab as input.</p>
              </div>
              <button onClick={handleConvertToXml} className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 font-medium">
                 <ArrowsRightLeftIcon className="w-4 h-4" /> Convert
              </button>
           </div>
           
           <div className="flex flex-1 gap-4 min-h-0">
             <div className="flex-1 flex flex-col min-h-0">
                <CodeEditor value={input} onChange={setInput} language="json" label="JSON Source (Editable)" placeholder="{...}" />
             </div>
             <div className="flex items-center justify-center text-slate-400">
                <ArrowsRightLeftIcon className="w-6 h-6" />
             </div>
             <div className="flex-1 flex flex-col min-h-0">
                <CodeEditor value={xmlOutput} onChange={setXmlOutput} language="xml" label="XML Output" placeholder="<root>...</root>" />
             </div>
           </div>
        </div>
      )}
    </div>
  );
};