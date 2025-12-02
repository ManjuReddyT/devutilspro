import React, { useState, useEffect } from 'react';
import { LockClosedIcon } from '@heroicons/react/24/solid';

type Permission = { r: boolean; w: boolean; x: boolean };
type Permissions = {
  owner: Permission;
  group: Permission;
  public: Permission;
};

export const ChmodTool: React.FC = () => {
  const [perms, setPerms] = useState<Permissions>({
    owner: { r: true, w: true, x: false }, // 6
    group: { r: true, w: false, x: false }, // 4
    public: { r: true, w: false, x: false }  // 4
  });

  const [octal, setOctal] = useState('644');
  const [symbolic, setSymbolic] = useState('-rw-r--r--');

  useEffect(() => {
    // Calculate values from state
    const calcDigit = (p: Permission) => (p.r ? 4 : 0) + (p.w ? 2 : 0) + (p.x ? 1 : 0);
    const o = calcDigit(perms.owner);
    const g = calcDigit(perms.group);
    const p = calcDigit(perms.public);
    setOctal(`${o}${g}${p}`);

    const calcSym = (p: Permission) => `${p.r ? 'r' : '-'}${p.w ? 'w' : '-'}${p.x ? 'x' : '-'}`;
    setSymbolic(`-${calcSym(perms.owner)}${calcSym(perms.group)}${calcSym(perms.public)}`);
  }, [perms]);

  const toggle = (who: keyof Permissions, what: keyof Permission) => {
    setPerms(prev => ({
      ...prev,
      [who]: { ...prev[who], [what]: !prev[who][what] }
    }));
  };

  const updateFromOctal = (val: string) => {
    if (val.length > 3) return;
    setOctal(val);
    if (val.length === 3) {
       const digits = val.split('').map(Number);
       if (digits.some(d => isNaN(d) || d > 7)) return;

       const decode = (d: number): Permission => ({
         r: (d & 4) !== 0,
         w: (d & 2) !== 0,
         x: (d & 1) !== 0
       });
       
       setPerms({
         owner: decode(digits[0]),
         group: decode(digits[1]),
         public: decode(digits[2])
       });
    }
  };

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 h-full">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 text-center">
         <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2 flex items-center justify-center gap-2">
            <LockClosedIcon className="w-6 h-6 text-indigo-500" />
            Chmod Calculator
         </h2>
         <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
            Check the boxes below to calculate permissions.
         </p>

         <div className="grid grid-cols-4 gap-4 mb-8 text-left">
            <div className="font-semibold text-slate-400 dark:text-slate-500 text-sm uppercase tracking-wider py-2">Role</div>
            <div className="font-semibold text-center text-slate-700 dark:text-slate-300">Read (4)</div>
            <div className="font-semibold text-center text-slate-700 dark:text-slate-300">Write (2)</div>
            <div className="font-semibold text-center text-slate-700 dark:text-slate-300">Execute (1)</div>

            {(['owner', 'group', 'public'] as const).map(role => (
              <React.Fragment key={role}>
                <div className="font-bold text-slate-800 dark:text-slate-200 capitalize py-2">{role}</div>
                <div className="flex justify-center items-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                   <input type="checkbox" checked={perms[role].r} onChange={() => toggle(role, 'r')} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                </div>
                <div className="flex justify-center items-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                   <input type="checkbox" checked={perms[role].w} onChange={() => toggle(role, 'w')} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                </div>
                <div className="flex justify-center items-center bg-slate-50 dark:bg-slate-900 rounded-lg">
                   <input type="checkbox" checked={perms[role].x} onChange={() => toggle(role, 'x')} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                </div>
              </React.Fragment>
            ))}
         </div>

         <div className="grid grid-cols-2 gap-8">
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Octal (0-777)</label>
               <input 
                 type="text" 
                 value={octal} 
                 onChange={(e) => updateFromOctal(e.target.value)}
                 className="w-full text-center text-3xl font-mono font-bold p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none" 
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Symbolic</label>
               <div className="w-full text-center text-3xl font-mono font-bold p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300">
                  {symbolic}
               </div>
            </div>
         </div>
         
         <div className="mt-8 text-sm text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg">
            chmod {octal} filename
         </div>
      </div>
    </div>
  );
};