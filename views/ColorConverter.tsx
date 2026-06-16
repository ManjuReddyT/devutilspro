import React, { useState, useEffect } from 'react';
import tinycolor from 'tinycolor2';

export const ColorConverter: React.FC = () => {
  const [color, setColor] = useState(tinycolor('#4f46e5'));
  
  const [hex, setHex] = useState(color.toHexString());
  const [rgb, setRgb] = useState(color.toRgbString());
  const [hsl, setHsl] = useState(color.toHslString());

  // CMYK is not natively stringified by tinycolor simply, so let's handle it manually if we want, or just get the values
  const getCmyk = (tinyCb: tinycolor.Instance) => {
    // Basic RGB to CMYK conversion
    const { r, g, b } = tinyCb.toRgb();
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    let k = Math.min(c, Math.min(m, y));
    if (k === 1) {
      c = 0; m = 0; y = 0;
    } else {
      c = Math.round(((c - k) / (1 - k)) * 100);
      m = Math.round(((m - k) / (1 - k)) * 100);
      y = Math.round(((y - k) / (1 - k)) * 100);
    }
    k = Math.round(k * 100);
    return `cmyk(${c}%, ${m}%, ${y}%, ${k}%)`;
  };

  const [cmyk, setCmyk] = useState(getCmyk(color));

  const updateColors = (newColorStr: string, source: 'hex' | 'rgb' | 'hsl' | 'cmyk' | 'picker') => {
    let newColor = tinycolor(newColorStr);
    
    // Tinycolor doesn't parse CMYK strings directly, so if source is CMYK, we handle it
    if (source === 'cmyk') {
      const match = newColorStr.match(/cmyk\(\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*,\s*(\d+)%?\s*\)/i);
      if (match) {
        const c = parseInt(match[1]) / 100;
        const m = parseInt(match[2]) / 100;
        const y = parseInt(match[3]) / 100;
        const k = parseInt(match[4]) / 100;
        
        const r = Math.round(255 * (1 - c) * (1 - k));
        const g = Math.round(255 * (1 - m) * (1 - k));
        const b = Math.round(255 * (1 - y) * (1 - k));
        
        newColor = tinycolor({ r, g, b });
      }
    }

    if (newColor.isValid()) {
      setColor(newColor);
      if (source !== 'hex') setHex(newColor.toHexString());
      if (source !== 'rgb') setRgb(newColor.toRgbString());
      if (source !== 'hsl') setHsl(newColor.toHslString());
      if (source !== 'cmyk') setCmyk(getCmyk(newColor));
    } else {
      if (source === 'hex') setHex(newColorStr);
      if (source === 'rgb') setRgb(newColorStr);
      if (source === 'hsl') setHsl(newColorStr);
      if (source === 'cmyk') setCmyk(newColorStr);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-w-5xl mx-auto">
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
             <h3 className="font-semibold text-slate-800 dark:text-slate-200">Color Conversion</h3>
          </div>
          <div className="p-6 flex flex-col gap-5">
             <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">HEX</label>
                <input 
                  type="text" 
                  value={hex}
                  onChange={(e) => updateColors(e.target.value, 'hex')}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
             </div>
             <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">RGB</label>
                <input 
                  type="text" 
                  value={rgb}
                  onChange={(e) => updateColors(e.target.value, 'rgb')}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
             </div>
             <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">HSL</label>
                <input 
                  type="text" 
                  value={hsl}
                  onChange={(e) => updateColors(e.target.value, 'hsl')}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
             </div>
             <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">CMYK</label>
                <input 
                  type="text" 
                  value={cmyk}
                  onChange={(e) => updateColors(e.target.value, 'cmyk')}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
             </div>
          </div>
        </div>
      </div>
      
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1 min-h-[300px]">
           <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
             <h3 className="font-semibold text-slate-800 dark:text-slate-200">Live Preview</h3>
           </div>
           <div className="flex-1 p-6 flex flex-col items-center justify-center gap-6">
              <div 
                className="w-48 h-48 rounded-2xl shadow-inner border border-slate-200 dark:border-slate-700 transition-colors"
                style={{ backgroundColor: color.isValid() ? color.toRgbString() : 'transparent' }}
              />
              <div className="flex items-center gap-4">
                 <input 
                   type="color" 
                   value={color.isValid() ? color.toHexString() : '#000000'}
                   onChange={(e) => updateColors(e.target.value, 'picker')}
                   className="w-12 h-12 rounded cursor-pointer border-0 p-0 bg-transparent"
                 />
                 <span className="font-medium text-slate-600 dark:text-slate-300 text-sm">
                   Choose Color
                 </span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
