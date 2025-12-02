import React, { useState, useEffect, useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartBarIcon } from '@heroicons/react/24/solid';

interface SizeData {
  total: number;
  tags: number;
  attributes: number;
  content: number;
  comments: number;
}

const COLORS = {
  tags: '#6366f1',      // Indigo
  attributes: '#d946ef', // Fuchsia
  content: '#10b981',    // Emerald
  comments: '#64748b'    // Slate
};

interface Props {
  input: string;
}

export const XmlAnalyzerPane: React.FC<Props> = ({ input }) => {
  const [stats, setStats] = useState<SizeData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      if (!input.trim()) {
        setStats(null);
        return;
      }
      
      const analysis: SizeData = {
        total: new TextEncoder().encode(input).length,
        tags: 0,
        attributes: 0,
        content: 0,
        comments: 0
      };

      // Simple regex-based sizing (approximate but fast)
      // Comments
      const comments: string[] = input.match(/<!--[\s\S]*?-->/g) || [];
      comments.forEach(c => analysis.comments += c.length);
      const noComments = input.replace(/<!--[\s\S]*?-->/g, '');

      // Tags and Attributes
      const tags: string[] = noComments.match(/<[^>]+>/g) || [];
      tags.forEach(tag => {
        let tagLen = tag.length;
        
        // Extract attributes
        const attrs = tag.match(/(\w+)=("[^"]*")/g);
        if (attrs) {
           attrs.forEach(attr => {
             const attrLen = attr.length;
             analysis.attributes += attrLen;
             tagLen -= attrLen; // Subtract attribute size from tag total
           });
        }
        analysis.tags += tagLen;
      });

      // Content (everything else, minus whitespace)
      const content = noComments.replace(/<[^>]+>/g, '').trim();
      analysis.content = content.length;

      setStats(analysis);
      setError('');
    } catch (e: any) {
      setError("Unable to analyze XML structure.");
      setStats(null);
    }
  }, [input]);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Tags', size: stats.tags, fill: COLORS.tags },
      { name: 'Attributes', size: stats.attributes, fill: COLORS.attributes },
      { name: 'Content', size: stats.content, fill: COLORS.content },
      { name: 'Comments', size: stats.comments, fill: COLORS.comments },
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
       const data = payload[0];
       // Safety check
       if (!data || !data.payload) return null;

      return (
        <div className="bg-slate-900 text-white text-xs p-2 rounded border border-slate-700 shadow-xl">
          <p className="font-bold mb-1">{data.payload.name}</p>
          <p>{formatBytes(data.value)}</p>
          <p className="opacity-70">{((data.value / (stats?.total || 1)) * 100).toFixed(1)}%</p>
        </div>
      );
    }
    return null;
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
          Waiting for XML input...
       </div>
     );
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar p-1">
       {/* Summary Cards */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
          <div className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-indigo-500/20">
             <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Total Size</p>
             <p className="text-2xl font-mono font-bold">{formatBytes(stats.total)}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Gzip Estimate</p>
             <p className="text-2xl font-mono font-bold text-slate-800 dark:text-white">{formatBytes(Math.ceil(stats.total * 0.35))}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Tag Overhead</p>
             <p className="text-2xl font-mono font-bold text-slate-800 dark:text-white">{((stats.tags / stats.total) * 100).toFixed(0)}%</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Content Ratio</p>
             <p className="text-2xl font-mono font-bold text-slate-800 dark:text-white">{((stats.content / stats.total) * 100).toFixed(0)}%</p>
          </div>
       </div>

       {/* Chart */}
       <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col min-h-[300px] flex-1">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
             <ChartBarIcon className="w-5 h-5 text-indigo-500" /> Structure Breakdown
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
    </div>
  );
};