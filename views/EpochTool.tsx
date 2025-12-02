import React, { useState, useEffect } from 'react';
import { 
  ClockIcon, 
  ClipboardDocumentIcon, 
  PlayIcon, 
  PauseIcon,
  CalendarIcon,
  ListBulletIcon,
  CommandLineIcon,
  GlobeAmericasIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { CodeEditor } from '../components/CodeEditor';

// --- Types & Constants ---

type InputFormat = 'auto' | 'seconds' | 'milliseconds' | 'iso';

interface ConversionResult {
  original: string;
  type: 'seconds' | 'milliseconds' | 'date' | 'invalid';
  tsSeconds: number | null;
  tsMillis: number | null;
  gmt: string;
  local: string;
  relative: string;
  iso: string;
  rfc: string;
  dateObj: Date | null;
}

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Pacific/Auckland'
];

const DATE_FORMATS_REF = [
  { name: 'ISO 8601', example: '2023-10-05T14:48:00.000Z' },
  { name: 'Short Date', example: '10/05/2023' },
  { name: 'Long Date', example: 'October 5, 2023' },
  { name: 'RFC 2822', example: 'Thu, 05 Oct 2023 14:48:00 GMT' },
  { name: 'SQL', example: '2023-10-05 14:48:00' }
];

const LANGUAGES = [
  { name: 'JavaScript', code: 'Math.floor(Date.now() / 1000)' },
  { name: 'Python', code: 'import time\ntime.time()' },
  { name: 'PHP', code: 'time()' },
  { name: 'Java', code: 'System.currentTimeMillis() / 1000' },
  { name: 'Go', code: 'time.Now().Unix()' },
  { name: 'Ruby', code: 'Time.now.to_i' },
  { name: 'C#', code: 'DateTimeOffset.UtcNow.ToUnixTimeSeconds()' },
  { name: 'Swift', code: 'NSDate().timeIntervalSince1970' },
  { name: 'Objective-C', code: '[[NSDate date] timeIntervalSince1970]' },
  { name: 'MySQL', code: 'SELECT unix_timestamp(now())' },
  { name: 'PostgreSQL', code: 'SELECT extract(epoch FROM now());' },
  { name: 'SQLite', code: 'SELECT strftime(\'%s\', \'now\');' }
];

// --- Helpers ---

const getRelativeTime = (d: Date) => {
  const diff = Date.now() - d.getTime();
  const absDiff = Math.abs(diff);
  const prefix = diff > 0 ? '' : 'in ';
  const suffix = diff > 0 ? ' ago' : '';
  
  const seconds = Math.floor(absDiff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const years = Math.floor(days / 365);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${prefix}${minutes} minute${minutes !== 1 ? 's' : ''}${suffix}`;
  if (hours < 24) return `${prefix}${hours} hour${hours !== 1 ? 's' : ''}${suffix}`;
  if (days < 365) return `${prefix}${days} day${days !== 1 ? 's' : ''}${suffix}`;
  return `${prefix}${years} year${years !== 1 ? 's' : ''}${suffix}`;
};

const processInput = (input: string, format: InputFormat = 'auto'): ConversionResult => {
  const clean = input.trim();
  const invalidRes = { 
    original: input, type: 'invalid' as const, tsSeconds: null, tsMillis: null, 
    gmt: '-', local: '-', relative: '-', iso: '-', rfc: '-', dateObj: null 
  };

  if (!clean) return invalidRes;

  let date: Date;
  let type: ConversionResult['type'] = 'invalid';

  const isNumeric = /^-?\d+(\.\d+)?$/.test(clean);

  if (format === 'seconds') {
    if (!isNumeric) return invalidRes;
    date = new Date(parseFloat(clean) * 1000);
    type = 'seconds';
  } else if (format === 'milliseconds') {
    if (!isNumeric) return invalidRes;
    date = new Date(parseFloat(clean));
    type = 'milliseconds';
  } else if (format === 'iso') {
    const parsed = Date.parse(clean);
    if (isNaN(parsed)) return invalidRes;
    date = new Date(parsed);
    type = 'date';
  } else {
    // Auto-detect
    if (isNumeric) {
      const num = parseFloat(clean);
      // Heuristic: If < 100 billion, assume seconds (valid until year 5138)
      if (Math.abs(num) < 100000000000) {
        date = new Date(num * 1000);
        type = 'seconds';
      } else {
        date = new Date(num);
        type = 'milliseconds';
      }
    } else {
      const parsed = Date.parse(clean);
      if (!isNaN(parsed)) {
        date = new Date(parsed);
        type = 'date';
      } else {
        return invalidRes;
      }
    }
  }

  if (isNaN(date.getTime())) {
    return invalidRes;
  }

  return {
    original: input,
    type,
    tsSeconds: Math.floor(date.getTime() / 1000),
    tsMillis: date.getTime(),
    gmt: date.toUTCString(),
    local: date.toLocaleString(),
    relative: getRelativeTime(date),
    iso: date.toISOString(),
    rfc: date.toUTCString(), // simplified
    dateObj: date
  };
};

const formatDateInZone = (date: Date | null, timeZone: string) => {
  if (!date) return '-';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short'
    }).format(date);
  } catch (e) {
    return 'Invalid Timezone';
  }
};

// --- Main Component ---

export const EpochTool: React.FC = () => {
  // Hero Clock State
  const [now, setNow] = useState(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  
  // Smart Converter State
  const [smartInput, setSmartInput] = useState('');
  const [conversion, setConversion] = useState<ConversionResult | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState('UTC');

  // Batch Converter State
  const [batchInput, setBatchInput] = useState('');
  const [batchFormat, setBatchFormat] = useState<InputFormat>('auto');
  const [batchResults, setBatchResults] = useState<ConversionResult[]>([]);

  // Ticker Effect
  useEffect(() => {
    if (isPaused) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [isPaused]);

  // Handle Smart Input
  useEffect(() => {
    if (smartInput.trim()) {
      setConversion(processInput(smartInput, 'auto'));
    } else {
      setConversion(null);
    }
  }, [smartInput]);

  // Handle Batch Input
  useEffect(() => {
    const lines = batchInput.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) {
      const results = lines.map(line => processInput(line, batchFormat));
      setBatchResults(results);
    } else {
      setBatchResults([]);
    }
  }, [batchInput, batchFormat]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Timeline Helper
  const getTimelinePosition = (ts: number | null) => {
    if (!ts) return 0;
    const start = 0; // 1970
    const end = 4102444800; // 2100-01-01
    const percent = Math.max(0, Math.min(100, (ts / end) * 100));
    return percent;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* 1. Hero Clock */}
      <div className="bg-slate-900 dark:bg-black text-white rounded-2xl p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ClockIcon className="w-64 h-64 -rotate-12" />
        </div>
        
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4 text-indigo-400">
             <span className="text-sm font-medium tracking-wider uppercase">Current Unix Epoch</span>
             <button onClick={() => setIsPaused(!isPaused)} className="hover:text-white transition">
               {isPaused ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
             </button>
          </div>
          
          <div className="text-6xl md:text-8xl font-mono font-bold tracking-tighter tabular-nums mb-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            {Math.floor(now / 1000)}
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm md:text-base font-mono text-slate-400">
             <div className="flex flex-col items-center">
               <span className="text-xs text-slate-600 uppercase">GMT / UTC</span>
               <span>{new Date(now).toUTCString()}</span>
             </div>
             <div className="hidden md:block w-px h-8 bg-slate-800"></div>
             <div className="flex flex-col items-center">
               <span className="text-xs text-slate-600 uppercase">Local Time</span>
               <span>{new Date(now).toLocaleString()}</span>
             </div>
          </div>
        </div>
      </div>

      {/* 2. Smart Converter */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                <CalendarIcon className="w-5 h-5 text-indigo-500" />
                Smart Converter
              </h3>
              <div className="flex items-center gap-2">
                 <GlobeAmericasIcon className="w-4 h-4 text-slate-400" />
                 <select 
                   value={selectedTimezone}
                   onChange={(e) => setSelectedTimezone(e.target.value)}
                   className="text-xs p-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
                 >
                   {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                 </select>
              </div>
            </div>
            
            <div className="mb-6">
               <input 
                 type="text" 
                 value={smartInput}
                 onChange={(e) => setSmartInput(e.target.value)}
                 className="w-full text-lg p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-indigo-500 focus:ring-0 outline-none transition font-mono text-slate-800 dark:text-slate-100 placeholder-slate-400"
                 placeholder="Paste timestamp or date string..."
               />
            </div>

            {conversion && conversion.type !== 'invalid' ? (
              <div className="space-y-6">
                {/* Timeline Visualization */}
                <div className="px-1">
                  <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                    <span>1970</span>
                    <span>2035</span>
                    <span>2100</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full relative overflow-hidden">
                    <div 
                      className="absolute top-0 bottom-0 left-0 bg-indigo-500/20" 
                      style={{ width: `${getTimelinePosition(conversion.tsSeconds)}%` }}
                    ></div>
                    <div 
                      className="absolute top-0 bottom-0 w-1 bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.6)] z-10 transition-all duration-500"
                      style={{ left: `${getTimelinePosition(conversion.tsSeconds)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm text-left">
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                       <tr className="bg-slate-50 dark:bg-slate-800/50">
                         <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 w-1/3">Epoch (Seconds)</td>
                         <td className="px-4 py-3 font-mono text-indigo-600 dark:text-indigo-400 font-bold select-all flex items-center justify-between group">
                            {conversion.tsSeconds}
                            <button onClick={() => copyToClipboard(String(conversion.tsSeconds))} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400">
                              <ClipboardDocumentIcon className="w-4 h-4" />
                            </button>
                         </td>
                       </tr>
                       <tr>
                         <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Epoch (Millis)</td>
                         <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300 select-all">{conversion.tsMillis}</td>
                       </tr>
                       <tr className="bg-slate-50 dark:bg-slate-800/50">
                         <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">GMT (UTC)</td>
                         <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{conversion.gmt}</td>
                       </tr>
                       <tr>
                         <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
                            <MapPinIcon className="w-3.5 h-3.5 text-indigo-500" />
                            {selectedTimezone}
                         </td>
                         <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{formatDateInZone(conversion.dateObj, selectedTimezone)}</td>
                       </tr>
                       <tr className="bg-slate-50 dark:bg-slate-800/50">
                         <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Relative</td>
                         <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{conversion.relative}</td>
                       </tr>
                       <tr>
                         <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">ISO 8601</td>
                         <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 select-all">{conversion.iso}</td>
                       </tr>
                       <tr className="bg-slate-50 dark:bg-slate-800/50">
                         <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">RFC 2822</td>
                         <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400 select-all">{conversion.rfc}</td>
                       </tr>
                     </tbody>
                  </table>
                </div>
              </div>
            ) : smartInput ? (
               <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm text-center">
                  Invalid timestamp or date format.
               </div>
            ) : (
               <div className="p-8 text-center text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-lg">
                  Waiting for input...
               </div>
            )}
          </div>

          {/* 3. Batch Converter */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                  <ListBulletIcon className="w-5 h-5 text-indigo-500" />
                  Batch Converter
                </h3>
                <select 
                   value={batchFormat}
                   onChange={(e) => setBatchFormat(e.target.value as InputFormat)}
                   className="text-xs p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-slate-700 dark:text-slate-300 outline-none focus:border-indigo-500"
                 >
                   <option value="auto">Auto-detect</option>
                   <option value="seconds">Seconds (Unix)</option>
                   <option value="milliseconds">Milliseconds</option>
                   <option value="iso">Date String / ISO</option>
                 </select>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-80">
                <div className="flex flex-col gap-2">
                   <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Input (One per line)</label>
                   <CodeEditor 
                     value={batchInput} 
                     onChange={setBatchInput} 
                     language="text" 
                     placeholder={`1678886400\n2023-10-05\n1700000000`}
                   />
                </div>
                
                <div className="flex flex-col gap-2 min-h-0">
                   <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Output Table</label>
                   <div className="flex-1 border border-slate-300 dark:border-slate-700 rounded-lg overflow-auto bg-slate-50 dark:bg-slate-900 custom-scrollbar">
                      {batchResults.length > 0 ? (
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold sticky top-0">
                            <tr>
                              <th className="px-3 py-2">Input</th>
                              <th className="px-3 py-2">Epoch</th>
                              <th className="px-3 py-2">Date (GMT)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {batchResults.map((res, i) => (
                              <tr key={i} className="hover:bg-slate-100 dark:hover:bg-slate-800/50">
                                <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400 truncate max-w-[100px]" title={res.original}>{res.original}</td>
                                <td className="px-3 py-2 font-mono text-indigo-600 dark:text-indigo-400">{res.tsSeconds || 'Invalid'}</td>
                                <td className="px-3 py-2 text-slate-700 dark:text-slate-300 whitespace-nowrap">{res.gmt !== 'Invalid Date' ? res.gmt : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm italic p-4">
                           Results will appear here
                        </div>
                      )}
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* 4. Cheatsheet & Info */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="flex items-center gap-2 font-bold text-slate-800 dark:text-white mb-4">
                <CommandLineIcon className="w-5 h-5 text-indigo-500" />
                Get Current Epoch
              </h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                 {LANGUAGES.map((lang) => (
                   <div key={lang.name} className="group">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">{lang.name}</span>
                        <button onClick={() => copyToClipboard(lang.code)} className="opacity-0 group-hover:opacity-100 text-indigo-600 dark:text-indigo-400 hover:underline">Copy</button>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-700 dark:text-slate-300 break-words whitespace-pre-wrap">
                        {lang.code}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

            {/* Date Format Reference */}
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Common Formats</h3>
              <div className="space-y-3">
                 {DATE_FORMATS_REF.map((fmt) => (
                   <div key={fmt.name} className="text-xs">
                      <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-0.5">
                        <span className="font-semibold">{fmt.name}</span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 font-mono text-slate-600 dark:text-slate-300 truncate">
                        {fmt.example}
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           {/* Reference Table */}
           <div className="bg-indigo-900 text-indigo-100 p-6 rounded-xl shadow-lg">
              <h3 className="font-bold text-white mb-4">Start of...</h3>
              <div className="space-y-2 text-sm">
                 <div className="flex justify-between border-b border-indigo-800 pb-1">
                    <span>Year {new Date().getFullYear()}</span>
                    <span className="font-mono">{Math.floor(new Date(new Date().getFullYear(), 0, 1).getTime() / 1000)}</span>
                 </div>
                 <div className="flex justify-between border-b border-indigo-800 pb-1">
                    <span>Month {new Date().toLocaleString('default', { month: 'short' })}</span>
                    <span className="font-mono">{Math.floor(new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime() / 1000)}</span>
                 </div>
                 <div className="flex justify-between border-b border-indigo-800 pb-1">
                    <span>Today</span>
                    <span className="font-mono">{Math.floor(new Date().setHours(0,0,0,0) / 1000)}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};