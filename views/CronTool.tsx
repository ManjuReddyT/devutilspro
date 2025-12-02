import React, { useState, useEffect } from 'react';
import { CronParts } from '../types';
import { explainCronExpression } from '../services/geminiService';
import { SparklesIcon, CalendarIcon } from '@heroicons/react/24/solid';
import cronParser from 'cron-parser';

export const CronTool: React.FC = () => {
  const [parts, setParts] = useState<CronParts>({
    minute: '*',
    hour: '*',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '*'
  });
  const [expression, setExpression] = useState('* * * * *');
  const [aiExplanation, setAiExplanation] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [parseError, setParseError] = useState('');

  useEffect(() => {
    const expr = `${parts.minute} ${parts.hour} ${parts.dayOfMonth} ${parts.month} ${parts.dayOfWeek}`;
    setExpression(expr);
    calculateNextRuns(expr);
  }, [parts]);

  const handleChange = (key: keyof CronParts, val: string) => {
    setParts(prev => ({ ...prev, [key]: val }));
  };

  const handleExpressionInput = (val: string) => {
    setExpression(val);
    const split = val.split(' ');
    if(split.length === 5) {
      setParts({ minute: split[0], hour: split[1], dayOfMonth: split[2], month: split[3], dayOfWeek: split[4] });
    }
    calculateNextRuns(val);
  };

  const calculateNextRuns = (expr: string) => {
    try {
      const interval = cronParser.parseExpression(expr);
      const dates = [];
      for (let i = 0; i < 5; i++) {
        dates.push(interval.next().toDate().toLocaleString());
      }
      setNextRuns(dates);
      setParseError('');
    } catch (e: any) {
      setNextRuns([]);
      setParseError('Invalid cron expression format.');
    }
  };

  const handleAiExplain = async () => {
    setLoadingAi(true);
    const text = await explainCronExpression(expression);
    setAiExplanation(text);
    setLoadingAi(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <input 
          type="text" 
          value={expression}
          onChange={(e) => handleExpressionInput(e.target.value)}
          className="text-5xl font-mono text-center w-full bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 font-bold tracking-widest placeholder-slate-300 dark:placeholder-slate-700"
        />
        <p className="text-slate-400 dark:text-slate-500 mt-2 text-sm">Edit the expression above or use the inputs below</p>
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { k: 'minute', l: 'Minute', range: '0-59' },
          { k: 'hour', l: 'Hour', range: '0-23' },
          { k: 'dayOfMonth', l: 'Day (Month)', range: '1-31' },
          { k: 'month', l: 'Month', range: '1-12' },
          { k: 'dayOfWeek', l: 'Day (Week)', range: '0-6' }
        ].map((field) => (
          <div key={field.k} className="flex flex-col items-center">
            <input 
              type="text" 
              value={parts[field.k as keyof CronParts]}
              onChange={(e) => handleChange(field.k as keyof CronParts, e.target.value)}
              className="w-full text-center p-3 text-xl font-mono border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg focus:border-indigo-500 outline-none transition mb-2"
            />
            <label className="font-bold text-slate-700 dark:text-slate-300 text-sm">{field.l}</label>
            <span className="text-xs text-slate-400 dark:text-slate-500">{field.range}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Explanation */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 border-b border-indigo-100 dark:border-indigo-800 flex items-center justify-between">
            <h3 className="text-indigo-900 dark:text-indigo-200 font-semibold flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-indigo-500" />
              AI Explanation
            </h3>
            <button 
              onClick={handleAiExplain}
              disabled={loadingAi}
              className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loadingAi ? 'Thinking...' : 'Refresh'}
            </button>
          </div>
          <div className="p-6 text-center flex-1 flex items-center justify-center">
            {aiExplanation ? (
              <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed font-medium">"{aiExplanation}"</p>
            ) : (
              <p className="text-slate-400 dark:text-slate-500 italic">Click "Refresh" to get a plain English explanation.</p>
            )}
          </div>
        </div>

        {/* Next Scheduled Runs */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="bg-slate-50 dark:bg-slate-750 p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 className="text-slate-800 dark:text-slate-200 font-semibold flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-slate-500" />
              Next Scheduled Runs
            </h3>
          </div>
          <div className="p-4 flex-1">
             {parseError ? (
               <div className="text-red-500 text-sm text-center mt-4">{parseError}</div>
             ) : (
               <ul className="space-y-3">
                 {nextRuns.length > 0 ? nextRuns.map((date, i) => (
                   <li key={i} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 font-mono text-sm bg-slate-50 dark:bg-slate-900/50 p-2 rounded">
                     <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-xs flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold">
                       {i + 1}
                     </span>
                     {date}
                   </li>
                 )) : (
                   <div className="text-slate-400 text-center italic mt-4">Invalid expression</div>
                 )}
               </ul>
             )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
         <p className="text-slate-500 dark:text-slate-400 text-sm">
           Common: 
           <button onClick={() => { setParts({ minute: '0', hour: '*', dayOfMonth: '*', month: '*', dayOfWeek: '*' }); calculateNextRuns('0 * * * *'); }} className="text-indigo-600 dark:text-indigo-400 hover:underline mx-2">Every Hour</button>
           <button onClick={() => { setParts({ minute: '0', hour: '0', dayOfMonth: '*', month: '*', dayOfWeek: '*' }); calculateNextRuns('0 0 * * *'); }} className="text-indigo-600 dark:text-indigo-400 hover:underline mx-2">Every Day</button>
           <button onClick={() => { setParts({ minute: '0', hour: '0', dayOfMonth: '*', month: '*', dayOfWeek: '1' }); calculateNextRuns('0 0 * * 1'); }} className="text-indigo-600 dark:text-indigo-400 hover:underline mx-2">Every Monday</button>
         </p>
      </div>
    </div>
  );
};