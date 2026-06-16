import React, { useState, useEffect } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

const dataUnits = [
  { id: 'b', label: 'Bytes (B)', multiplier: 1 },
  { id: 'kb', label: 'Kilobytes (KB)', multiplier: 1024 },
  { id: 'mb', label: 'Megabytes (MB)', multiplier: 1024 ** 2 },
  { id: 'gb', label: 'Gigabytes (GB)', multiplier: 1024 ** 3 },
  { id: 'tb', label: 'Terabytes (TB)', multiplier: 1024 ** 4 },
  { id: 'pb', label: 'Petabytes (PB)', multiplier: 1024 ** 5 },
];

const timeUnits = [
  { id: 'ms', label: 'Milliseconds (ms)', multiplier: 1 },
  { id: 's', label: 'Seconds (s)', multiplier: 1000 },
  { id: 'min', label: 'Minutes (min)', multiplier: 1000 * 60 },
  { id: 'h', label: 'Hours (h)', multiplier: 1000 * 60 * 60 },
  { id: 'd', label: 'Days (d)', multiplier: 1000 * 60 * 60 * 24 },
  { id: 'wk', label: 'Weeks (wk)', multiplier: 1000 * 60 * 60 * 24 * 7 },
  { id: 'y', label: 'Years (yr)', multiplier: 1000 * 60 * 60 * 24 * 365 },
];

export const UnitConverterTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'data' | 'time'>('data');
  const [baseData, setBaseData] = useState<number | ''>(1024); // base is bytes
  const [baseTime, setBaseTime] = useState<number | ''>(1000); // base is ms

  const handleDataChange = (unitMultiplier: number, value: string) => {
    if (value === '') {
      setBaseData('');
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setBaseData(num * unitMultiplier);
    }
  };

  const handleTimeChange = (unitMultiplier: number, value: string) => {
    if (value === '') {
      setBaseTime('');
      return;
    }
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setBaseTime(num * unitMultiplier);
    }
  };

  const formatValue = (baseValue: number | '', multiplier: number) => {
    if (baseValue === '') return '';
    const val = baseValue / multiplier;
    // Format to avoid scientific notation for typical values and limit decimals
    return parseFloat(val.toPrecision(10)).toString();
  };

  const currentUnits = activeTab === 'data' ? dataUnits : timeUnits;
  const currentBase = activeTab === 'data' ? baseData : baseTime;
  const handleChange = activeTab === 'data' ? handleDataChange : handleTimeChange;
  const clearAll = () => {
    if (activeTab === 'data') setBaseData('');
    else setBaseTime('');
  };

  return (
    <div className="flex flex-col gap-6 h-full max-w-4xl mx-auto">
      <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'data'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Data Storage
        </button>
        <button
          onClick={() => setActiveTab('time')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'time'
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          Time
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{activeTab} Units</h3>
          <button
            onClick={clearAll}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Clear
          </button>
        </div>
        
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 flex-1 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentUnits.map((unit) => (
              <div key={unit.id} className="flex flex-col gap-2">
                <label htmlFor={unit.id} className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {unit.label}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={unit.id}
                    type="number"
                    value={formatValue(currentBase, unit.multiplier)}
                    onChange={(e) => handleChange(unit.multiplier, e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-600 rounded-lg py-2.5 px-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-shadow shadow-sm min-w-0"
                    placeholder="0"
                  />
                  <div className="absolute right-3 text-slate-400 pointer-events-none select-none text-xs font-mono font-medium">
                    {unit.id.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
