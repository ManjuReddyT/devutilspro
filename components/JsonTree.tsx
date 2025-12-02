import React, { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

interface JsonTreeProps {
  data: any;
  name?: string;
  path?: string; // e.g. "store.book[0]"
  isLast?: boolean;
  level?: number;
}

const colors = {
  key: "text-indigo-700 dark:text-indigo-400 font-medium",
  string: "text-emerald-600 dark:text-emerald-400",
  number: "text-orange-600 dark:text-orange-400",
  boolean: "text-rose-600 dark:text-rose-400 font-semibold",
  null: "text-slate-500 dark:text-slate-500 italic",
  meta: "text-slate-400 dark:text-slate-500 text-xs ml-2 select-none"
};

export const JsonTree: React.FC<JsonTreeProps> = ({ data, name, path = '$', isLast = true, level = 0 }) => {
  const [expanded, setExpanded] = useState(level < 2); // Default expand top 2 levels
  const [copied, setCopied] = useState(false);

  const isObject = data !== null && typeof data === 'object';
  const isArray = Array.isArray(data);
  const isEmpty = isObject && Object.keys(data).length === 0;

  const handleCopyPath = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderValue = (val: any) => {
    if (val === null) return <span className={colors.null}>null</span>;
    switch (typeof val) {
      case 'string': return <span className={colors.string}>"{val}"</span>;
      case 'number': return <span className={colors.number}>{val}</span>;
      case 'boolean': return <span className={colors.boolean}>{val ? 'true' : 'false'}</span>;
      default: return <span>{String(val)}</span>;
    }
  };

  if (!isObject) {
    return (
      <div className="font-mono text-sm leading-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded px-1 flex items-center group relative">
        {name && <span className={`${colors.key} mr-1`}>{name}:</span>}
        {renderValue(data)}
        {!isLast && <span className="text-slate-400">,</span>}
        
        {/* Copy Path Button */}
        <button 
          onClick={handleCopyPath}
          className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ${copied ? 'text-green-600' : ''}`}
          title="Copy JSON Path"
        >
          {copied ? <CheckIcon className="w-3 h-3" /> : <ClipboardDocumentIcon className="w-3 h-3" />}
        </button>
      </div>
    );
  }

  const keys = Object.keys(data);
  const brackets = isArray ? ['[', ']'] : ['{', '}'];

  return (
    <div className="font-mono text-sm leading-6">
      <div 
        className={`flex items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded px-1 cursor-pointer group relative select-none`}
        onClick={() => !isEmpty && setExpanded(!expanded)}
      >
        {/* Toggler */}
        <span className={`w-4 h-4 mr-1 text-slate-400 flex items-center justify-center transition-transform ${expanded ? 'rotate-90' : ''}`}>
           {!isEmpty && <ChevronRightIcon className="w-3 h-3" />}
        </span>

        {/* Key Name (if exists) */}
        {name && <span className={`${colors.key} mr-1`}>{name}:</span>}

        {/* Opening Bracket */}
        <span className="text-slate-500">{brackets[0]}</span>

        {/* Collapsed Preview */}
        {!expanded && !isEmpty && (
          <span className="text-slate-400 mx-1 flex items-center gap-1">
             <span className="text-xs">...</span>
             <span className="bg-slate-100 dark:bg-slate-800 px-1.5 rounded text-[10px] border border-slate-200 dark:border-slate-700">
               {isArray ? `${keys.length} items` : `${keys.length} keys`}
             </span>
          </span>
        )}

        {/* Closing Bracket (if collapsed or empty) */}
        {(!expanded || isEmpty) && (
          <span>
            <span className="text-slate-500">{brackets[1]}</span>
            {!isLast && <span className="text-slate-400">,</span>}
          </span>
        )}

         {/* Copy Path Button (Parent) */}
         <button 
          onClick={handleCopyPath}
          className={`absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity ${copied ? 'text-green-600' : ''}`}
          title="Copy JSON Path"
        >
          {copied ? <CheckIcon className="w-3 h-3" /> : <ClipboardDocumentIcon className="w-3 h-3" />}
        </button>
      </div>

      {/* Children */}
      {expanded && !isEmpty && (
        <div className="pl-5 border-l border-slate-200 dark:border-slate-700 ml-2">
          {keys.map((key, index) => {
            const isLastChild = index === keys.length - 1;
            const childPath = isArray 
              ? `${path}[${key}]` 
              : `${path}.${key}`; // Simple dot notation, could be enhanced for special chars

            return (
              <JsonTree 
                key={key} 
                data={data[key]} 
                name={isArray ? undefined : key}
                path={childPath}
                isLast={isLastChild}
                level={level + 1}
              />
            );
          })}
        </div>
      )}

      {/* Closing Bracket (if expanded) */}
      {expanded && !isEmpty && (
        <div className="pl-6">
           <span className="text-slate-500">{brackets[1]}</span>
           {!isLast && <span className="text-slate-400">,</span>}
        </div>
      )}
    </div>
  );
};