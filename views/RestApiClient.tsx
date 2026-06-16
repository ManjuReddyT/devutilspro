import React, { useState, useEffect } from 'react';
import { JsonTree } from '../components/JsonTree';
import { PlayIcon, DocumentDuplicateIcon, ExclamationTriangleIcon, TrashIcon, PlusIcon, RocketLaunchIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from 'react-resizable-panels';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

const formatXml = (xml: string) => {
  let formatted = '';
  const reg = /(>)(<)(\/*)/g;
  xml = xml.replace(reg, '$1\r\n$2$3');
  let pad = 0;
  xml.split('\r\n').forEach(node => {
    let indent = 0;
    if (node.match( /.+<\/\w[^>]*>$/ )) {
      indent = 0;
    } else if (node.match( /^<\/\w/ )) {
      if (pad !== 0) { pad -= 1; }
    } else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) {
      indent = 1;
    } else {
      indent = 0;
    }
    formatted += '  '.repeat(pad) + node + '\r\n';
    pad += indent;
  });
  return formatted.trim();
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

interface ResponseState {
  status: number | null;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  time: number | null;
  size: number | null;
  error?: string;
}

export const RestApiClient: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [method, setMethod] = useState<HttpMethod>('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  
  const [headers, setHeaders] = useState<KeyValue[]>([
    { id: '1', key: 'Accept', value: 'application/json', enabled: true }
  ]);
  const [queryParams, setQueryParams] = useState<KeyValue[]>([
    { id: '1', key: '', value: '', enabled: true }
  ]);
  const [body, setBody] = useState('');
  
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'graphql'>('params');
  const [response, setResponse] = useState<ResponseState | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseViewMode, setResponseViewMode] = useState<'pretty' | 'tree' | 'raw'>('pretty');

  const [apiType, setApiType] = useState<'rest' | 'graphql'>('rest');
  const [graphqlQuery, setGraphqlQuery] = useState('');
  const [graphqlVariables, setGraphqlVariables] = useState('');

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importType, setImportType] = useState('cURL');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');

  const generateId = () => Math.random().toString(36).substring(7);

  const handleImport = () => {
    try {
      setImportError('');
      let resMethod = 'GET';
      let resUrl = '';
      let resHeaders: KeyValue[] = [];
      let resBody = '';

      if (importType === 'cURL') {
        const tokens = importText.match(/(?:[^\s"']+|"[^"]*"|'[^']*')+/g) || [];
        for (let i = 0; i < tokens.length; i++) {
          let token = tokens[i].replace(/^['"]|['"]$/g, '');
          if (token === 'curl') continue;
          if (token === '-X' || token === '--request') {
            resMethod = tokens[++i].replace(/^['"]|['"]$/g, '').toUpperCase();
          } else if (token === '-H' || token === '--header') {
             const headerStr = tokens[++i].replace(/^['"]|['"]$/g, '');
             const idx = headerStr.indexOf(':');
             if (idx > -1) {
               resHeaders.push({ id: generateId(), key: headerStr.slice(0, idx).trim(), value: headerStr.slice(idx + 1).trim(), enabled: true });
             }
          } else if (token === '-d' || token === '--data' || token === '--data-raw') {
             resBody = tokens[++i];
             if (resBody.startsWith('"') || resBody.startsWith("'")) resBody = resBody.substring(1, resBody.length - 1);
             if (resMethod === 'GET') resMethod = 'POST';
          } else if (token.startsWith('http')) {
             resUrl = token;
          }
        }
      } else if (importType === 'Postman') {
        const data = JSON.parse(importText);
        const findReq = (items: any[]): any => {
           for (const item of items) {
             if (item.request) return item.request;
             if (item.item) {
                const found = findReq(item.item);
                if (found) return found;
             }
           }
           return null;
        };
        const req = data.item ? findReq(data.item) : null;
        if (!req) throw new Error('No valid request found in Postman collection.');
        resMethod = req.method || 'GET';
        resUrl = typeof req.url === 'string' ? req.url : req.url?.raw || '';
        resHeaders = (req.header || []).map((h: any) => ({ id: generateId(), key: h.key, value: h.value, enabled: true }));
        resBody = req.body?.raw || '';
      } else if (importType === 'Swagger') {
        const data = JSON.parse(importText);
        let baseUrl = data.servers?.[0]?.url || ((data.schemes?.[0] || 'http') + '://' + data.host + (data.basePath || ''));
        const path = Object.keys(data.paths || {})[0];
        if (!path) throw new Error('No paths found in Swagger document.');
        resMethod = Object.keys(data.paths[path])[0]?.toUpperCase() || 'GET';
        resUrl = `${baseUrl}${path}`;
        resBody = '';
      } else if (importType === 'HAR') {
        const data = JSON.parse(importText);
        const entry = data?.log?.entries?.[0];
        if (!entry?.request) throw new Error('No valid request found in HAR.');
        resMethod = entry.request.method;
        resUrl = entry.request.url;
        resHeaders = (entry.request.headers || []).filter((h: any) => !h.name.startsWith(':')).map((h: any) => ({
           id: generateId(), key: h.name, value: h.value, enabled: true
        }));
        resBody = entry.request.postData?.text || '';
      }

      setMethod((resMethod || 'GET').toUpperCase() as HttpMethod);
      if (resUrl && !resUrl.includes('undefined')) setUrl(resUrl);
      if (resHeaders.length > 0) setHeaders(resHeaders);
      if (resBody) setBody(resBody);
      setImportModalOpen(false);
      setImportText('');
    } catch (e: any) {
      setImportError(e.message || 'Failed to parse format.');
    }
  };

  const addKeyValue = (setter: React.Dispatch<React.SetStateAction<KeyValue[]>>) => {
    setter(prev => [...prev, { id: generateId(), key: '', value: '', enabled: true }]);
  };

  const updateKeyValue = (
    setter: React.Dispatch<React.SetStateAction<KeyValue[]>>, 
    id: string, 
    field: 'key' | 'value' | 'enabled', 
    val: string | boolean
  ) => {
    setter(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const removeKeyValue = (setter: React.Dispatch<React.SetStateAction<KeyValue[]>>, id: string) => {
    setter(prev => prev.filter(item => item.id !== id));
  };

  const buildUrlWithParams = () => {
    try {
      const urlObj = new URL(url);
      queryParams.forEach(p => {
        if (p.enabled && p.key.trim() !== '') {
          urlObj.searchParams.append(p.key, p.value);
        }
      });
      return urlObj.toString();
    } catch {
      return url; // fallback to raw string if invalid URL initially
    }
  };

  const handleSendRequest = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setResponse(null);
    
    const startTime = performance.now();
    
    try {
      const fetchHeaders: HeadersInit = {};
      headers.forEach(h => {
        if (h.enabled && h.key.trim() !== '') {
          fetchHeaders[h.key] = h.value;
        }
      });

      const options: RequestInit = {
        method,
        headers: fetchHeaders,
      };

      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        if (apiType === 'graphql') {
          let parsedVars = {};
          if (graphqlVariables.trim() !== '') {
             parsedVars = JSON.parse(graphqlVariables);
          }
          options.body = JSON.stringify({
             query: graphqlQuery,
             variables: parsedVars
          });
          if (!fetchHeaders['Content-Type'] && !Object.keys(fetchHeaders).some(k => k.toLowerCase() === 'content-type')) {
            fetchHeaders['Content-Type'] = 'application/json';
          }
        } else if (body.trim() !== '') {
          options.body = body;
          if (!fetchHeaders['Content-Type'] && !Object.keys(fetchHeaders).some(k => k.toLowerCase() === 'content-type')) {
            fetchHeaders['Content-Type'] = 'application/json'; // Default to JSON if obvious
          }
        }
      }

      const finalUrl = buildUrlWithParams();
      
      const res = await fetch(finalUrl, options);
      const endTime = performance.now();
      
      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      const contentType = res.headers.get('content-type');
      let responseData;
      let textData = await res.text();
      
      let size = null;
      try {
        size = new TextEncoder().encode(textData).length;
      } catch (e) {
        // ignore
      }
      
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = JSON.parse(textData);
        } catch {
          responseData = textData;
        }
      } else {
        responseData = textData;
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: responseHeaders,
        data: responseData,
        time: Math.round(endTime - startTime),
        size
      });
    } catch (err: any) {
      const endTime = performance.now();
      setResponse({
        status: null,
        statusText: 'Error',
        headers: {},
        data: null,
        time: Math.round(endTime - startTime),
        size: null,
        error: err.message || 'Failed to fetch. CORS restrictions may apply.'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderKeyValueList = (items: KeyValue[], setter: React.Dispatch<React.SetStateAction<KeyValue[]>>) => (
    <div className="flex flex-col gap-2">
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={item.enabled}
            onChange={(e) => updateKeyValue(setter, item.id, 'enabled', e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
          />
          <input 
            type="text" 
            placeholder="Key" 
            value={item.key}
            onChange={(e) => updateKeyValue(setter, item.id, 'key', e.target.value)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 outline-none focus:border-indigo-500 font-mono text-xs text-slate-800 dark:text-slate-100"
          />
          <input 
            type="text" 
            placeholder="Value" 
            value={item.value}
            onChange={(e) => updateKeyValue(setter, item.id, 'value', e.target.value)}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded p-1.5 outline-none focus:border-indigo-500 font-mono text-xs text-slate-800 dark:text-slate-100"
          />
          <button 
            onClick={() => removeKeyValue(setter, item.id)}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded transition-colors"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button 
        onClick={() => addKeyValue(setter)}
        className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2 w-fit px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded"
      >
        <PlusIcon className="w-3.5 h-3.5" />
        Add Line
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full gap-4 max-w-6xl mx-auto">
      {/* URL Bar */}
      <div className="flex gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex-wrap items-center">
        <select
          value={apiType}
          onChange={(e) => {
             const newType = e.target.value as 'rest' | 'graphql';
             setApiType(newType);
             if (newType === 'graphql') {
               setMethod('POST');
               if (activeTab === 'body') setActiveTab('graphql');
             } else {
               if (activeTab === 'graphql') setActiveTab('body');
             }
          }}
          className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-sm"
        >
          <option value="rest">REST</option>
          <option value="graphql">GraphQL</option>
        </select>
        
        <div className="w-[1px] h-6 bg-slate-300 dark:bg-slate-600 mx-1 hidden sm:block"></div>

        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as HttpMethod)}
          className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-sm font-bold rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[100px] text-center"
        >
          {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input 
          type="text" 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 bg-transparent px-3 py-2 outline-none text-slate-800 dark:text-slate-200 font-mono text-sm min-w-[150px]"
          onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
        />
        <button
          onClick={() => setImportModalOpen(true)}
          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2 text-sm"
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Import
        </button>
        <button
          onClick={handleSendRequest}
          disabled={loading || !url.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center gap-2"
        >
          {loading ? (
             <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : (
            <>
              Send
              <PlayIcon className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      <div className="h-[calc(100%-80px)] min-h-[500px]">
        <PanelGroup direction={isMobile ? "vertical" : "horizontal"} className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
          {/* Request Config */}
          <Panel defaultSize={50} minSize={20} className="w-full flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-full">
          <div className="flex bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-2 pt-2">
            {(apiType === 'graphql' ? ['params', 'headers', 'graphql'] : ['params', 'headers', 'body']).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab 
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'params' && renderKeyValueList(queryParams, setQueryParams)}
            {activeTab === 'headers' && renderKeyValueList(headers, setHeaders)}
            {activeTab === 'body' && (
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="{\n  // Request Body JSON\n}"
                className="w-full h-full min-h-[200px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            )}
            {activeTab === 'graphql' && (
              <div className="flex flex-col h-full gap-4">
                <div className="flex-1 flex flex-col">
                   <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Query</label>
                   <textarea 
                     value={graphqlQuery}
                     onChange={(e) => setGraphqlQuery(e.target.value)}
                     placeholder={"query {\n  ...\n}"}
                     className="w-full h-full min-h-[150px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 custom-scrollbar"
                   />
                </div>
                <div className="h-1/3 min-h-[120px] flex flex-col">
                   <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Variables (JSON)</label>
                   <textarea 
                     value={graphqlVariables}
                     onChange={(e) => setGraphqlVariables(e.target.value)}
                     placeholder={"{\n  ...\n}"}
                     className="w-full h-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 custom-scrollbar"
                   />
                </div>
              </div>
            )}
          </div>
          </Panel>

          <PanelResizeHandle className={`flex justify-center items-center group shrink-0 ${isMobile ? 'h-4 my-2 cursor-row-resize' : 'w-4 mx-2 flex-col cursor-col-resize'}`}>
             <div className={`bg-slate-200 dark:bg-slate-700 rounded-full group-hover:bg-indigo-500 transition-colors ${isMobile ? 'h-1.5 w-12' : 'w-1.5 h-12'}`} />
          </PanelResizeHandle>

          {/* Response View */}
          <Panel defaultSize={50} minSize={20} className="w-full flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden h-full">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center gap-2 flex-wrap">
             <div className="flex items-center gap-3">
               <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Response</h3>
               {response && typeof response.data === 'object' && response.data !== null && (
                 <div className="flex bg-slate-200/50 dark:bg-slate-900/50 rounded-lg p-0.5">
                   <button 
                     onClick={() => setResponseViewMode('pretty')} 
                     className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${responseViewMode === 'pretty' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                   >Pretty</button>
                   <button 
                     onClick={() => setResponseViewMode('tree')} 
                     className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${responseViewMode === 'tree' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                   >Tree</button>
                   <button 
                     onClick={() => setResponseViewMode('raw')} 
                     className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${responseViewMode === 'raw' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                   >Raw</button>
                 </div>
               )}
               {response && (typeof response.data === 'string' || typeof response.data === 'boolean' || typeof response.data === 'number') && (
                 <div className="flex bg-slate-200/50 dark:bg-slate-900/50 rounded-lg p-0.5">
                   <button 
                     onClick={() => setResponseViewMode('pretty')} 
                     className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${responseViewMode === 'pretty' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                   >Pretty</button>
                   <button 
                     onClick={() => setResponseViewMode('raw')} 
                     className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${responseViewMode === 'raw' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                   >Raw</button>
                 </div>
               )}
             </div>
             {response && (
               <div className="flex items-center gap-4 text-xs font-mono ml-auto">
                 {response.status && (
                   <a 
                     href={`https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/${response.status}`}
                     target="_blank"
                     rel="noreferrer"
                     className={`px-2 py-0.5 rounded font-bold hover:opacity-80 transition-opacity ${
                       response.status >= 200 && response.status < 300 
                         ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                         : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                     }`}
                     title="View MDN Documentation"
                   >
                     {response.status} {response.statusText}
                   </a>
                 )}
                 {!response.status && (
                   <span className="px-2 py-0.5 rounded font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                     ERR {response.statusText}
                   </span>
                 )}
                 <span className="text-slate-500 dark:text-slate-400 py-0.5 px-2 bg-slate-100 dark:bg-slate-700 rounded" title="Total Response Time">
                   {response.time ? `${response.time} ms` : '-'} 
                 </span>
                 {response.size !== null && (
                   <span className="text-slate-500 dark:text-slate-400 py-0.5 px-2 bg-slate-100 dark:bg-slate-700 rounded" title="Response Size">
                     {formatBytes(response.size)}
                   </span>
                 )}
               </div>
             )}
          </div>
          <div className="flex-1 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 p-4 custom-scrollbar">
            {!response ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-4">
                 <RocketLaunchIcon className="w-12 h-12 opacity-20" />
                 <span className="text-sm">Enter URL and hit Send to fetch data</span>
              </div>
            ) : response.error ? (
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-900/50 mt-4 mx-4 text-sm">
                <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold mb-1">Request failed</h4>
                  <p>{response.error}</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {(() => {
                  const isObj = typeof response.data === 'object' && response.data !== null;
                  const dataStr = String(response.data);
                  const isXml = !isObj && typeof dataStr === 'string' && dataStr.trim().startsWith('<');
                  
                  if (responseViewMode === 'tree' && isObj) {
                    return <JsonTree data={response.data} />;
                  }
                  
                  if (responseViewMode === 'pretty') {
                    const codeString = isObj ? JSON.stringify(response.data, null, 2) : (isXml ? formatXml(dataStr) : dataStr);
                    const lang = isObj ? 'json' : (isXml ? 'xml' : 'text');
                    return (
                      <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950">
                        <SyntaxHighlighter
                          language={lang}
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, padding: '1rem', background: 'transparent', fontSize: '0.875rem' }}
                          className="custom-scrollbar"
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                  
                  return (
                    <pre className="font-mono text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words p-4 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      {isObj ? JSON.stringify(response.data) : dataStr}
                    </pre>
                  );
                })()}
                
                {Object.keys(response.headers).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700/50">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Response Headers</h4>
                    <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs font-mono">
                      {Object.entries(response.headers).map(([key, val]) => (
                        <React.Fragment key={key}>
                          <div className="text-indigo-600 dark:text-indigo-400 font-semibold">{key}:</div>
                          <div className="text-slate-700 dark:text-slate-300 break-all">{val}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </Panel>
        </PanelGroup>
      </div>

      {importModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-800 dark:text-slate-200">Import Request</h3>
              <button onClick={() => setImportModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex gap-4 overflow-x-auto border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
               {['cURL', 'Postman', 'Swagger', 'HAR'].map(type => (
                 <button 
                    key={type} 
                    onClick={() => setImportType(type)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${importType === type ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                 >
                   {type}
                 </button>
               ))}
            </div>
            <div className="p-4 flex-1 overflow-auto flex flex-col gap-4 bg-slate-50 dark:bg-slate-900">
               <textarea
                 value={importText}
                 onChange={(e) => setImportText(e.target.value)}
                 className="w-full flex-1 min-h-[250px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 rounded-lg p-3 font-mono text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                 placeholder={`Paste ${importType} content here...`}
               />
               {importError && (
                 <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-900/50">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    {importError}
                 </div>
               )}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-end gap-3">
               <button onClick={() => setImportModalOpen(false)} className="px-5 py-2 rounded-lg font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">Cancel</button>
               <button onClick={handleImport} className="px-5 py-2 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50" disabled={!importText.trim()}>Import Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
