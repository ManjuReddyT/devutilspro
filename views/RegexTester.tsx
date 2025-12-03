import React, { useState, useEffect, useMemo } from 'react';
import { MagnifyingGlassIcon, BookOpenIcon, ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

const EXAMPLES = [
  { name: 'Email Address', regex: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', text: 'test@example.com\ninvalid.email\nhello.world@sub.domain.co.uk' },
  { name: 'IPv4 Address', regex: '\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b', text: '192.168.1.1\n10.0.0.1\n256.0.0.1\n127.0.0.1' },
  { name: 'Date (YYYY-MM-DD)', regex: '\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12][0-9]|3[01])', text: '2023-10-05\n2024-02-29\n2023-13-01' },
  { name: 'URL / Website', regex: 'https?:\\/\\/(?:www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b(?:[-a-zA-Z0-9()@:%_\\+.~#?&\\/=]*)', text: 'https://www.google.com\nhttp://example.org/path?q=123\nftp://invalid-protocol.com' },
  { name: 'Phone Number (US)', regex: '\\(?\\d{3}\\)?[-\\s.]?\\d{3}[-\\s.]?\\d{4}', text: '(555) 123-4567\n555-123-4567\n555.123.4567' },
  { name: 'Hex Color', regex: '#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})', text: '#fff\n#4F46E5\n#000000' }
];

const CHEATSHEET = [
  { label: 'Character Classes', items: [
    { code: '.', desc: 'Any character except newline' },
    { code: '\\w', desc: 'Word (a-z, A-Z, 0-9, _)' },
    { code: '\\d', desc: 'Digit (0-9)' },
    { code: '\\s', desc: 'Whitespace' },
    { code: '[abc]', desc: 'Any of a, b, or c' },
    { code: '[^abc]', desc: 'Not a, b, or c' },
  ]},
  { label: 'Quantifiers', items: [
    { code: '*', desc: '0 or more' },
    { code: '+', desc: '1 or more' },
    { code: '?', desc: '0 or 1' },
    { code: '{3}', desc: 'Exactly 3' },
    { code: '{3,}', desc: '3 or more' },
    { code: '{3,5}', desc: '3 to 5' },
  ]},
  { label: 'Anchors', items: [
    { code: '^', desc: 'Start of string/line' },
    { code: '$', desc: 'End of string/line' },
    { code: '\\b', desc: 'Word boundary' },
  ]},
  { label: 'Groups', items: [
    { code: '(...)', desc: 'Capture group' },
    { code: '(?:...)', desc: 'Non-capturing group' },
    { code: '(?<name>...)', desc: 'Named group' },
  ]}
];

interface Match {
  index: number;
  text: string;
  groups: string[];
}

export const RegexTester: React.FC = () => {
  const [regexStr, setRegexStr] = useState('([A-Z])\\w+');
  const [flags, setFlags] = useState('gm');
  const [testString, setTestString] = useState('DevUtils Pro is an Amazing Tool for Developers.\nIt helps with Regex Testing.');
  const [matches, setMatches] = useState<Match[]>([]);
  const [error, setError] = useState('');

  // Calculate matches
  useEffect(() => {
    try {
      if (!regexStr) {
        setMatches([]);
        setError('');
        return;
      }
      const regex = new RegExp(regexStr, flags);
      const newMatches: Match[] = [];
      
      // Prevent infinite loops with empty matches
      let match;
      let loopCheck = 0;
      
      // Use exec in a loop for global search match details
      const isGlobal = flags.includes('g');
      
      if (!isGlobal) {
        match = regex.exec(testString);
        if (match) {
           newMatches.push({
             index: match.index,
             text: match[0],
             groups: match.slice(1)
           });
        }
      } else {
        while ((match = regex.exec(testString)) !== null) {
          if (loopCheck++ > 1000) break; // Safety break
          
          newMatches.push({
             index: match.index,
             text: match[0],
             groups: match.slice(1)
          });

          if (match.index === regex.lastIndex) {
            regex.lastIndex++; // Avoid infinite loop with zero-width matches
          }
        }
      }
      
      setMatches(newMatches);
      setError('');
    } catch (e: any) {
      setError(e.message);
      setMatches([]);
    }
  }, [regexStr, flags, testString]);

  const toggleFlag = (flag: string) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  // Generate Highlighted HTML
  const highlightedHtml = useMemo(() => {
    if (!matches.length || error) {
      return testString
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    let lastIndex = 0;
    let html = '';
    
    // Safety: escape HTML first
    const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    matches.forEach((m, i) => {
      // Content before match
      html += escape(testString.substring(lastIndex, m.index));
      
      // The Match
      const colorClass = i % 2 === 0 ? 'bg-indigo-500/30' : 'bg-blue-500/30';
      const borderClass = i % 2 === 0 ? 'border-b-2 border-indigo-500' : 'border-b-2 border-blue-500';
      
      html += `<span class="${colorClass} ${borderClass} rounded-sm relative group cursor-pointer" title="Match ${i+1}">`;
      html += escape(m.text);
      html += `</span>`;
      
      lastIndex = m.index + m.text.length;
    });

    // Remaining content
    html += escape(testString.substring(lastIndex));
    
    // Handle newlines for pre rendering
    return html; // CSS whitespace-pre-wrap handles the newlines
  }, [testString, matches, error]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
      {/* Top Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full relative">
             <div className="flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
               <span className="pl-3 text-slate-400 font-mono text-lg select-none">/</span>
               <input 
                 type="text" 
                 value={regexStr}
                 onChange={(e) => setRegexStr(e.target.value)}
                 className="flex-1 p-3 bg-transparent outline-none font-mono text-lg text-slate-800 dark:text-white placeholder-slate-400"
                 placeholder="Regular Expression..."
               />
               <span className="pr-3 text-slate-400 font-mono text-lg select-none">/</span>
             </div>
             {error && (
               <div className="absolute -bottom-6 left-0 text-xs text-red-500 flex items-center gap-1">
                 <ExclamationTriangleIcon className="w-3 h-3" /> {error}
               </div>
             )}
          </div>

          <div className="flex items-center gap-2">
            {['g', 'm', 'i', 's', 'u', 'y'].map(flag => (
              <button 
                key={flag}
                onClick={() => toggleFlag(flag)}
                className={`w-8 h-8 rounded text-sm font-bold font-mono transition-colors border ${
                  flags.includes(flag) 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                }`}
                title={`Toggle flag: ${flag}`}
              >
                {flag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Editor Area */}
        <div className="flex-[2] flex flex-col h-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative">
          <div className="bg-slate-50 dark:bg-slate-900/50 p-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
             <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">Test String</span>
             <span className="text-xs text-slate-400 px-2">{matches.length} matches found</span>
          </div>
          
          <div className="flex-1 relative overflow-hidden">
             {/* Highlight Layer */}
             <div 
               className="absolute inset-0 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-auto z-10 pointer-events-none text-transparent"
               aria-hidden="true"
             >
                {testString}
             </div>

             <div 
               className="absolute inset-0 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap overflow-auto z-0 text-slate-800 dark:text-slate-200"
               dangerouslySetInnerHTML={{ __html: highlightedHtml }}
             />

             {/* Input Layer */}
             <textarea 
               value={testString}
               onChange={(e) => setTestString(e.target.value)}
               className="absolute inset-0 w-full h-full p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap bg-transparent text-transparent caret-indigo-600 dark:caret-white resize-none outline-none z-20 overflow-auto"
               spellCheck={false}
             />
          </div>
        </div>

        {/* Sidebar */}
        <div className="flex-1 flex flex-col gap-4 min-h-0">
           {/* Match Info */}
           <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden min-h-0">
             <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
               <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                 <MagnifyingGlassIcon className="w-4 h-4" /> Match Information
               </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
               {matches.length === 0 ? (
                 <p className="text-sm text-slate-400 dark:text-slate-500 italic text-center mt-10">No matches found.</p>
               ) : (
                 matches.map((m, i) => (
                   <div key={i} className="bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 p-3 text-sm">
                     <div className="flex justify-between mb-1">
                       <span className="font-bold text-indigo-600 dark:text-indigo-400">Match {i + 1}</span>
                       <span className="text-xs text-slate-400 font-mono">Index: {m.index}</span>
                     </div>
                     <div className="font-mono bg-white dark:bg-slate-800 p-1 rounded border border-slate-200 dark:border-slate-700 mb-2 text-slate-700 dark:text-slate-300 break-all">
                       {m.text}
                     </div>
                     {m.groups.length > 0 && (
                       <div className="space-y-1">
                         {m.groups.map((g, gi) => (
                           <div key={gi} className="flex gap-2 text-xs">
                             <span className="text-slate-500 dark:text-slate-400 w-12 shrink-0">Group {gi + 1}:</span>
                             <span className="font-mono text-emerald-600 dark:text-emerald-400 break-all">{g || 'undefined'}</span>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>
                 ))
               )}
             </div>
           </div>

           {/* Examples */}
           <div className="h-40 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden shrink-0">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
               <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                 <LightBulbIcon className="w-4 h-4" /> Common Patterns
               </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {EXAMPLES.map((item, i) => (
                  <div 
                    key={i} 
                    className="flex justify-between px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer text-xs group transition-colors"
                    onClick={() => {
                        setRegexStr(item.regex);
                        setTestString(item.text);
                    }}
                  >
                     <span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item.name}</span>
                     <span className="text-slate-400 text-[10px] bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 group-hover:border-indigo-200 dark:group-hover:border-indigo-800">Load</span>
                  </div>
                ))}
             </div>
           </div>

           {/* Quick Ref */}
           <div className="h-56 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden shrink-0">
              <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
               <h3 className="font-bold text-slate-700 dark:text-slate-300 text-sm flex items-center gap-2">
                 <BookOpenIcon className="w-4 h-4" /> Quick Reference
               </h3>
             </div>
             <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
               {CHEATSHEET.map(section => (
                 <div key={section.label} className="mb-3">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 px-2">{section.label}</h4>
                    {section.items.map(item => (
                      <div key={item.code} className="flex justify-between px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer text-xs" onClick={() => setRegexStr(prev => prev + item.code)}>
                         <code className="font-mono text-indigo-600 dark:text-indigo-400">{item.code}</code>
                         <span className="text-slate-600 dark:text-slate-400">{item.desc}</span>
                      </div>
                    ))}
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};