import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export const QrCodeGenerator: React.FC = () => {
  const [text, setText] = useState('https://aistudio.google.com/');
  const [size, setSize] = useState(256);
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [level, setLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [includeMargin, setIncludeMargin] = useState(true);
  
  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const pngUrl = canvas.toDataURL('image/png');
    let downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = 'qrcode.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      <div className="flex-1 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1 h-[400px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
             <h3 className="font-semibold text-slate-800 dark:text-slate-200">Content</h3>
          </div>
          <div className="p-4 flex-1">
             <textarea 
               value={text}
               onChange={(e) => setText(e.target.value)}
               className="w-full h-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
               placeholder="Enter URL or text to generate QR code..."
             />
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4">
           <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Configuration</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Size (px): {size}</label>
                <input 
                  type="range" 
                  min="128" max="1024" step="8" 
                  value={size} 
                  onChange={(e) => setSize(Number(e.target.value))} 
                  className="w-full accent-indigo-600"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Error Correction</label>
                <select 
                  value={level} 
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                >
                  <option value="L">L - Low (7%)</option>
                  <option value="M">M - Medium (15%)</option>
                  <option value="Q">Q - Quartile (25%)</option>
                  <option value="H">H - High (30%)</option>
                </select>
              </div>
              <div className="flex gap-4 col-span-1 md:col-span-2">
                 <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Foreground Color</label>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2">
                      <input 
                        type="color" 
                        value={fgColor} 
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{fgColor.toUpperCase()}</span>
                    </div>
                 </div>
                 <div className="flex-1">
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Background Color</label>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md p-2">
                      <input 
                        type="color" 
                        value={bgColor} 
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{bgColor.toUpperCase()}</span>
                    </div>
                 </div>
              </div>
              <div className="col-span-1 md:col-span-2 flex items-center gap-2 mt-2">
                 <input 
                   type="checkbox" 
                   id="includeMargin"
                   checked={includeMargin} 
                   onChange={(e) => setIncludeMargin(e.target.checked)}
                   className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-600"
                 />
                 <label htmlFor="includeMargin" className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                   Include safe area margin
                 </label>
              </div>
           </div>
        </div>
      </div>
      
      <div className="w-full lg:w-[450px] flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col flex-1 min-h-[500px]">
           <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
             <h3 className="font-semibold text-slate-800 dark:text-slate-200">Preview</h3>
             <button 
               onClick={downloadQR}
               disabled={!text}
               className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
             >
               <ArrowDownTrayIcon className="w-4 h-4" />
               Download PNG
             </button>
           </div>
           <div className="p-8 flex-1 flex flex-col items-center justify-center bg-slate-100/50 dark:bg-slate-900/50 overflow-hidden relative">
             <div 
               className="shadow-xl rounded-lg overflow-hidden transition-all duration-300 flex items-center justify-center"
               ref={qrRef}
               style={{ backgroundColor: bgColor }}
             >
               <QRCodeCanvas
                  value={text || ' '}
                  size={Math.min(size, 380)} // Cap display size to fit nicely in preview, download keeps real size theoretically, but QRCodeCanvas uses size for both. Let's just use CSS scale or wrapper. Wait, QRCodeCanvas size prop dictates the canvas dimensions. We will use a wrapper.
                  bgColor={bgColor}
                  fgColor={fgColor}
                  level={level}
                  includeMargin={includeMargin}
                  style={{ width: '100%', height: '100%', maxWidth: '380px', maxHeight: '380px', objectFit: 'contain' }}
               />
             </div>
             {!text && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center text-slate-600 dark:text-slate-300 font-medium z-10 text-sm">
                  Enter text to generate QR code
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
};
