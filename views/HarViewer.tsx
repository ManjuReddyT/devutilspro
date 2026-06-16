import React, { useState, useRef, useMemo } from 'react';
import { DocumentArrowUpIcon, TrashIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { JsonTree } from '../components/JsonTree';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const HarViewer: React.FC = () => {
  const [harData, setHarData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [search, setSearch] = useState('');
  const [deepSearch, setDeepSearch] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState('time');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'headers' | 'request' | 'response'>('headers');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed?.log?.entries) {
          throw new Error('Invalid HAR file format. Missing log.entries.');
        }
        setHarData(parsed);
        setSelectedEntry(null);
        setError('');
      } catch (err: any) {
        setError(err.message || 'Failed to parse HAR file.');
        setHarData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const clearData = () => {
    setHarData(null);
    setSelectedEntry(null);
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getURLPath = (url: string) => {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    if (bytes < 0 || !bytes) return '-';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getEntryType = (entry: any) => {
    const mime = entry.response?.content?.mimeType?.toLowerCase() || '';
    const url = entry.request?.url?.toLowerCase() || '';
    
    if (mime.includes('json') || mime.includes('xml') || entry.request?.headers?.some((h: any) => h.name.toLowerCase() === 'x-requested-with')) {
      return 'xhr';
    }
    if (mime.includes('javascript') || mime.includes('ecmascript') || url.endsWith('.js')) {
      return 'js';
    }
    if (mime.includes('css') || url.endsWith('.css')) {
      return 'css';
    }
    if (mime.includes('image/')) {
      return 'image';
    }
    if (mime.includes('audio/') || mime.includes('video/')) {
      return 'media';
    }
    if (mime.includes('font/') || url.includes('.woff') || url.includes('.ttf')) {
      return 'font';
    }
    if (mime.includes('html') || mime.includes('text/plain')) {
      return 'document';
    }
    return 'other';
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered and Sorted entries
  const entries = useMemo(() => {
    if (!harData?.log?.entries) return [];
    
    let filtered = harData.log.entries.filter((entry: any) => {
      // 1. URL / Method / Status text matching
      const url = entry.request?.url || '';
      const method = entry.request?.method || '';
      const statusText = entry.response?.statusText || '';
      const statusStr = String(entry.response?.status || '');
      
      let matchesSearch = url.toLowerCase().includes(search.toLowerCase()) ||
                          method.toLowerCase().includes(search.toLowerCase()) ||
                          statusStr.includes(search) ||
                          statusText.toLowerCase().includes(search.toLowerCase());
      
      if (!matchesSearch && deepSearch) {
        // Search request headers, response headers, request body, and response body
        const reqHeaders = entry.request?.headers || [];
        const resHeaders = entry.response?.headers || [];
        const matchHeader = [...reqHeaders, ...resHeaders].some(
          (h: any) => h.name.toLowerCase().includes(search.toLowerCase()) || h.value.toLowerCase().includes(search.toLowerCase())
        );

        const reqBody = entry.request?.postData?.text || '';
        const resBody = entry.response?.content?.text || '';

        matchesSearch = matchHeader || 
                        reqBody.toLowerCase().includes(search.toLowerCase()) || 
                        resBody.toLowerCase().includes(search.toLowerCase());
      }

      if (!matchesSearch) return false;

      // 2. Status filtering
      const status = entry.response?.status || 0;
      if (statusFilter !== 'all') {
        const firstDigit = Math.floor(status / 100);
        if (statusFilter === '2xx' && firstDigit !== 2) return false;
        if (statusFilter === '3xx' && firstDigit !== 3) return false;
        if (statusFilter === '4xx' && firstDigit !== 4) return false;
        if (statusFilter === '5xx' && firstDigit !== 5) return false;
        if (statusFilter === 'err' && status !== 0 && firstDigit >= 2 && firstDigit < 4) return false;
      }

      // 3. Resource category filtering
      if (typeFilter !== 'all') {
        const type = getEntryType(entry);
        if (type !== typeFilter) return false;
      }

      return true;
    });

    // 4. Sorting
    filtered.sort((a: any, b: any) => {
      let valA: any = '';
      let valB: any = '';

      if (sortField === 'status') {
        valA = a.response?.status || 0;
        valB = b.response?.status || 0;
      } else if (sortField === 'method') {
        valA = a.request?.method || '';
        valB = b.request?.method || '';
      } else if (sortField === 'url') {
        valA = a.request?.url || '';
        valB = b.request?.url || '';
      } else if (sortField === 'size') {
        valA = a.response?.content?.size || a.response?.bodySize || 0;
        valB = b.response?.content?.size || b.response?.bodySize || 0;
      } else if (sortField === 'time') {
        valA = a.time || 0;
        valB = b.time || 0;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [harData, search, deepSearch, statusFilter, typeFilter, sortField, sortDirection]);

  const exportFilteredHar = () => {
    if (!harData) return;
    const exportedData = {
      log: {
        version: harData.log?.version || '1.2',
        creator: harData.log?.creator || { name: 'DevUtils Pro HAR Filter' },
        entries: entries
      }
    };
    const blob = new Blob([JSON.stringify(exportedData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `filtered_${new Date().toISOString().slice(0, 10)}.har`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resourceTypes = [
    { id: 'all', label: 'All' },
    { id: 'xhr', label: 'Fetch/XHR' },
    { id: 'document', label: 'Doc' },
    { id: 'js', label: 'JS' },
    { id: 'css', label: 'CSS' },
    { id: 'image', label: 'Img' },
    { id: 'font', label: 'Font' },
    { id: 'other', label: 'Other' },
  ];

  const statusCategories = [
    { id: 'all', label: 'All Statuses' },
    { id: '2xx', label: '2xx Success' },
    { id: '3xx', label: '3xx Redirect' },
    { id: '4xx', label: '4xx Client Err' },
    { id: '5xx', label: '5xx Server Err' },
    { id: 'err', label: 'Failed/Net Err' }
  ];

  return (
    <div className="flex flex-col h-full gap-4 max-w-7xl mx-auto">
      {!harData ? (
        <div 
          className={`flex-1 rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center p-8 text-center ${
            dragActive 
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
              : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <DocumentArrowUpIcon className={`w-16 h-16 mb-4 ${dragActive ? 'text-indigo-500' : 'text-slate-400'}`} />
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">
             Drag & Drop HAR File
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md text-sm">
            Upload an HTTP Archive (.har) format file exported from your browser's developer tools to analyze network requests.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".har,application/json"
            className="hidden"
            onChange={(e) => e.target.files && processFile(e.target.files[0])}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Browse Files
          </button>
          
          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Main Toolbar */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
            <div className="flex flex-wrap gap-4 justify-between items-center">
              <div className="flex items-center gap-4 flex-wrap">
                 <h3 className="font-bold text-slate-800 dark:text-slate-200 border-r border-slate-300 dark:border-slate-700 pr-4">HAR Viewer</h3>
                 
                 <div className="relative">
                   <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input 
                     type="text" 
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     placeholder="Filter by URL/Method..."
                     className="pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 min-w-[280px]"
                   />
                 </div>
                 
                 <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                    <input 
                      type="checkbox"
                      checked={deepSearch}
                      onChange={(e) => setDeepSearch(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 dark:border-slate-600 dark:bg-slate-800"
                    />
                    <span>Search in payloads & headers (Deep)</span>
                 </label>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={exportFilteredHar}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors"
                  title="Export currently filtered requests to a new HAR file"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Export Filtered
                </button>
                <button 
                  onClick={clearData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Clear File
                </button>
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-col md:flex-row gap-4 pt-1 items-stretch md:items-center justify-between border-t border-slate-200/55 dark:border-slate-700/55">
               {/* Resource Type Category Buttons */}
               <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
                  {resourceTypes.map(rt => (
                     <button
                       key={rt.id}
                       onClick={() => setTypeFilter(rt.id)}
                       className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                         typeFilter === rt.id 
                           ? 'bg-indigo-600 text-white' 
                           : 'bg-slate-100 dark:bg-slate-700 text-slate-650 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-705 dark:text-slate-300'
                       }`}
                     >
                       {rt.label}
                     </button>
                  ))}
               </div>

               {/* Status filter dropdown and request counter */}
               <div className="flex items-center gap-3 justify-between md:justify-end">
                  <div className="flex items-center gap-2 text-xs">
                     <span className="text-slate-400 font-medium">Status:</span>
                     <select
                       value={statusFilter}
                       onChange={(e) => setStatusFilter(e.target.value)}
                       className="p-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-xs outline-none dark:text-white cursor-pointer"
                     >
                        {statusCategories.map(sc => (
                           <option key={sc.id} value={sc.id}>{sc.label}</option>
                        ))}
                     </select>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 rounded">
                    {entries.length} of {harData.log?.entries?.length || 0} shown
                  </span>
               </div>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
            {/* List View */}
            <div className="w-full md:w-1/2 lg:w-5/12 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-700 flex flex-col h-1/2 md:h-full">
              <div className="overflow-auto custom-scrollbar flex-1 bg-slate-50 dark:bg-slate-900/30">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 shadow-sm text-slate-550 dark:text-slate-300 font-semibold uppercase tracking-wider select-none">
                    <tr>
                      <th 
                        onClick={() => handleSort('status')}
                        className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                         Status {sortField === 'status' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSort('method')}
                        className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                         Method {sortField === 'method' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSort('url')}
                        className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 w-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                         File/Path {sortField === 'url' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSort('size')}
                        className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                         Size {sortField === 'size' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </th>
                      <th 
                        onClick={() => handleSort('time')}
                        className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 text-right cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                      >
                         Time {sortField === 'time' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                    {entries.map((entry: any, i: number) => {
                      const status = entry.response?.status;
                      const isError = status >= 400 || !status;
                      const sizeVal = entry.response?.content?.size || entry.response?.bodySize || 0;
                      return (
                        <tr 
                          key={i} 
                          onClick={() => setSelectedEntry(entry)}
                          className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-750 ${
                            selectedEntry === entry ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                          }`}
                        >
                          <td className="px-3 py-1.5 font-mono">
                            <span className={`px-1.5 py-0.5 rounded ${
                              isError ? 'bg-red-100 text-red-750 dark:bg-red-900/30 dark:text-red-400' 
                              : (status >= 300 ? 'bg-yellow-105 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
                              : 'text-green-600 dark:text-green-400 font-semibold')
                            }`}>
                              {status || 'Err'}
                            </span>
                          </td>
                          <td className="px-3 py-1.5 font-bold text-slate-600 dark:text-slate-400">
                            {entry.request?.method}
                          </td>
                          <td className="px-3 py-1.5 font-mono truncate max-w-[150px] text-slate-700 dark:text-slate-300" title={entry.request?.url}>
                            {getURLPath(entry.request?.url)}
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={entry.request?.url}>
                              {getDomain(entry.request?.url)}
                            </div>
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-500 dark:text-slate-400">
                            {formatBytes(sizeVal)}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono text-slate-500 dark:text-slate-400">
                            {Math.round(entry.time || 0)}ms
                          </td>
                        </tr>
                      );
                    })}
                    {entries.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                          No matching network requests found for the applied filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Details View */}
            <div className="flex-1 flex flex-col h-1/2 md:h-full bg-white dark:bg-slate-900">
              {selectedEntry ? (
                <div className="flex flex-col h-full overflow-hidden">
                  <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 break-all font-mono text-xs leading-snug">
                     <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-2">{selectedEntry.request?.method}</span>
                     <span className="text-slate-750 dark:text-slate-350">{selectedEntry.request?.url}</span>
                  </div>
                  
                  <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-808 px-2 overflow-x-auto custom-scrollbar">
                    {(['headers', 'request', 'response'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                          activeTab === tab 
                            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                            : 'border-transparent text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                    {activeTab === 'headers' && (
                      <div className="flex flex-col gap-6">
                        <div>
                          <h4 className="text-xs font-bold text-slate-550 uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-slate-750 pb-1">Response Headers</h4>
                          <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-xs font-mono break-all">
                            {(selectedEntry.response?.headers || []).map((h: any, i: number) => (
                              <React.Fragment key={i}>
                                <div className="text-slate-500 dark:text-slate-400 font-semibold">{h.name}:</div>
                                <div className="text-slate-800 dark:text-slate-200 select-all">{h.value}</div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-550 uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-slate-755 pb-1">Request Headers</h4>
                          <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-xs font-mono break-all">
                            {(selectedEntry.request?.headers || []).map((h: any, i: number) => (
                              <React.Fragment key={i}>
                                <div className="text-slate-500 dark:text-slate-400 font-semibold">{h.name}:</div>
                                <div className="text-slate-800 dark:text-slate-200 select-all">{h.value}</div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {activeTab === 'request' && (
                      <div className="flex flex-col gap-6">
                        {selectedEntry.request?.queryString?.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-550 uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-slate-750 pb-1">Query String Parameters</h4>
                            <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-xs font-mono break-all">
                              {selectedEntry.request.queryString.map((q: any, i: number) => (
                                <React.Fragment key={i}>
                                  <div className="text-slate-550 dark:text-slate-400 font-semibold">{q.name}:</div>
                                  <div className="text-slate-800 dark:text-slate-200 select-all">{q.value}</div>
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedEntry.request?.postData && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-550 uppercase tracking-wider mb-2 border-b border-slate-200 dark:border-slate-750 pb-1">Request Payload</h4>
                            {selectedEntry.request.postData.mimeType?.includes('json') && selectedEntry.request.postData.text ? (
                              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{margin: 0, padding: '1rem', fontSize: '0.80rem' }}>
                                  {(() => {
                                     try {
                                       return JSON.stringify(JSON.parse(selectedEntry.request.postData.text), null, 2);
                                     } catch {
                                       return selectedEntry.request.postData.text;
                                     }
                                  })()}
                                </SyntaxHighlighter>
                              </div>
                            ) : (
                               <pre className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs whitespace-pre-wrap break-words text-slate-850 dark:text-slate-200">
                                 {selectedEntry.request.postData.text || '<empty>'}
                               </pre>
                            )}
                          </div>
                        )}
                        {(!selectedEntry.request?.queryString?.length && !selectedEntry.request?.postData) && (
                          <div className="text-slate-500 dark:text-slate-400 italic text-xs">No parameters or payload.</div>
                        )}
                      </div>
                    )}
                    
                    {activeTab === 'response' && (
                      <div className="flex flex-col h-full gap-4">
                        <div className="flex gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 flex-wrap">
                          <span>Real Size: {formatBytes(selectedEntry.response?.content?.size || selectedEntry.response?.bodySize)}</span>
                          <span>Format (MIME): {selectedEntry.response?.content?.mimeType}</span>
                        </div>
                        {selectedEntry.response?.content?.text ? (
                           selectedEntry.response.content.mimeType?.includes('json') ? (
                             <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden flex-1 select-text">
                               <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{margin: 0, padding: '1rem', fontSize: '0.80rem', height: '100%' }}>
                                 {(() => {
                                    try {
                                      return JSON.stringify(JSON.parse(selectedEntry.response.content.text), null, 2);
                                    } catch {
                                      return selectedEntry.response.content.text;
                                    }
                                 })()}
                               </SyntaxHighlighter>
                             </div>
                           ) : (
                             <pre className="p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs whitespace-pre-wrap break-words text-slate-850 dark:text-slate-200 flex-1 overflow-auto select-text">
                               {selectedEntry.response.content.text}
                             </pre>
                           )
                        ) : (
                           <div className="text-slate-400 dark:text-slate-500 italic text-xs">No response body or content is encoded in this log.</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                   <MagnifyingGlassIcon className="w-12 h-12 mb-4 opacity-20" />
                   <p className="text-sm font-medium">Select a network request to load its details context.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
