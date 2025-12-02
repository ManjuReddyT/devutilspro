import React, { useState, useEffect, useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartBarIcon } from '@heroicons/react/24/solid';

interface SizeData {
  total: number;
  keys: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  syntax: number; // Brackets, commas, colons
}

const COLORS = {
  keys: '#6366f1',    // Indigo
  strings: '#10b981', // Emerald
  numbers: '#f59e0b', // Amber
  booleans: '#f43f5e', // Rose
  syntax: '#64748b'   // Slate
};

interface Props {
  input: string;
}

export const JsonAnalyzerPane: React.FC<Props> = ({ input }) => {
  const [stats, setStats] = useState<SizeData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (!input.trim()) {
        setStats(null);
        return;
      }
      
      const parsed = JSON.parse(input);
      // We analyze the MINIFIED version as that's what matters for payload size
      const minified = JSON.stringify(parsed);
      
      const analysis: SizeData = {
        total: new TextEncoder().encode(minified).length,
        keys: 0,
        strings: 0,
        numbers: 0,
        booleans: 0,
        nulls: 0,
        syntax: 0
      };

      // Walk the object to calculate size of parts
      const walk = (obj: any) => {
        if (typeof obj === 'string') {
          // String value size: quotes + content
          analysis.strings += new TextEncoder().encode(obj).length + 2; 
        } else if (typeof obj === 'number') {
          analysis.numbers += String(obj).length;
        } else if (typeof obj === 'boolean') {
          analysis.booleans += obj ? 4 : 5;
        } else if (obj === null) {
          analysis.nulls += 4;
        } else if (Array.isArray(obj)) {
          // Syntax: [ and ]
          analysis.syntax += 2; 
          // Syntax: commas
          if (obj.length > 1) analysis.syntax += (obj.length - 1);
          
          obj.forEach(walk);
        } else if (typeof obj === 'object') {
          // Syntax: { and }
          analysis.syntax += 2;
          const keys = Object.keys(obj);
          // Syntax: commas
          if (keys.length > 1) analysis.syntax += (keys.length - 1);

          keys.forEach(key => {
            // Key size: quotes + content
            analysis.keys += new TextEncoder().encode(key).length + 2;
            // Syntax: colon
            analysis.syntax += 1;
            walk(obj[key]);
          });
        }
      };

      walk(parsed);
      setStats(analysis);
      setError('');
    } catch (e: any) {
      setError("Please ensure the JSON is valid in the 'Format & Validate' tab to view analysis.");
      setStats(null);
    }
  }, [input]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Keys', size: stats.keys, fill: COLORS.keys },
      { name: 'Strings', size: stats.strings, fill: COLORS.strings },
      { name: 'Numbers', size: stats.numbers, fill: COLORS.numbers },
      { name: 'Booleans', size: stats.booleans + stats.nulls, fill: COLORS.booleans },
      { name: 'Syntax', size: stats.syntax, fill: COLORS.syntax },
    ].filter(i => i.size > 0);
  }, [stats]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white text-xs p-2 rounded border border-slate-700 shadow-xl">
          <p className="font-bold mb-1">{payload[0].payload.name}</p>
          <p>{formatBytes(payload[0].value)}</p>
          <p className="opacity-70">{((payload[0].value / (stats?.total || 1)) * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  if (error) {
     return (
       <div className="flex items-center justify-center h-full flex-col gap-2 p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400 font-medium">Unable to Analyze</p>
          <p className="text-slate-400 dark:text-slate-500 text-sm">{error}</p>
       </div>
     );
  }

  if (!input.trim() || !stats) {
     return (
       <div className="flex items-center justify-center h-full text-slate-400 italic">
          Waiting for JSON input...
       </div>
     );
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar p-1">
       {/* Summary Cards */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-indigo-500/20">
             <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Total Size (Minified)</p>
             <p className="text-2xl font-mono font-bold">{formatBytes(stats.total)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Gzip Estimate</p>
             <p className="text-2xl font-mono font-bold text-slate-800 dark:text-white">{formatBytes(Math.ceil(stats.total * 0.35))}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Keys Cost</p>
             <p className="text-2xl font-mono font-bold text-slate-800 dark:text-white">{((stats.keys / stats.total) * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Values Cost</p>
             <p className="text-2xl font-mono font-bold text-slate-800 dark:text-white">{(((stats.strings + stats.numbers + stats.booleans) / stats.total) * 100).toFixed(0)}%</p>
          </div>
       </div>

       {/* Chart */}
       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[300px] flex-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
             <ChartBarIcon className="w-5 h-5 text-indigo-500" /> Size Breakdown
          </h3>
          
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={chartData}
              dataKey="size"
              stroke="#fff"
              fill="#8884d8"
              content={<CustomContent />}
            >
              <Tooltip content={<CustomTooltip />} />
            </Treemap>
          </ResponsiveContainer>
       </div>

       {/* Table */}
       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden shrink-0">
         <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Size</th>
                <th className="px-6 py-3 font-semibold">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {chartData.map(row => (
                <tr key={row.name}>
                  <td className="px-6 py-3 flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: row.fill }}></span>
                    {row.name}
                  </td>
                  <td className="px-6 py-3 font-mono text-slate-600 dark:text-slate-400">{formatBytes(row.size)}</td>
                  <td className="px-6 py-3 font-mono text-slate-600 dark:text-slate-400">{((row.size / stats.total) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
         </table>
       </div>
    </div>
  );
};

const CustomContent = (props: any) => {
  const { x, y, width, height, payload, name } = props;
  if (!payload) return null;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: payload.fill || '#8884d8',
          stroke: '#fff',
          strokeWidth: 2,
        }}
      />
      {width > 50 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 7}
          textAnchor="middle"
          fill="#fff"
          fontSize={14}
          fontWeight="bold"
        >
          {name}
        </text>
      )}
    </g>
  );
};