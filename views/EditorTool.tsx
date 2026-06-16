import React, { useState, useRef } from 'react';
import { 
  DocumentDuplicateIcon, 
  CheckIcon, 
  TrashIcon, 
  ArrowDownTrayIcon, 
  DocumentArrowUpIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon,
  BarsArrowUpIcon,
  BarsArrowDownIcon,
  CommandLineIcon
} from '@heroicons/react/24/outline';

export const EditorTool: React.FC = () => {
  const [text, setText] = useState<string>(
`apple_fruit
banana_yellow
grape_sweet
orange_juice
strawberry_fields
HTML <span class="tag">element</span> block
😀 cool developer emoji`
  );
  
  const [copied, setCopied] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [useRegex, setUseRegex] = useState<boolean>(false);
  const [regexCaseInsensitive, setRegexCaseInsensitive] = useState<boolean>(true);
  
  const [prefix, setPrefix] = useState<string>('');
  const [suffix, setSuffix] = useState<string>('');
  
  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [filterType, setFilterType] = useState<'include' | 'exclude'>('include');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stats
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lineCount = text ? text.split('\n').length : 0;

  const triggerCopyFeedback = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
    triggerCopyFeedback();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setText(evt.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devutils_editor_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Transformation helpers
  const toCamelCase = (str: string): string => {
    return str
      .trim()
      .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      .replace(/^./, c => c.toLowerCase());
  };

  const toSnakeCase = (str: string): string => {
    return str
      .trim()
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[-_\s]+/g, '_')
      .toLowerCase();
  };

  const toKebabCase = (str: string): string => {
    return str
      .trim()
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[-_\s]+/g, '-')
      .toLowerCase();
  };

  const toTitleCase = (str: string): string => {
    return str
      .toLowerCase()
      .split(/[\s-_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const toPascalCase = (str: string): string => {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
  };

  const changeCase = (type: 'uppercase' | 'lowercase' | 'camel' | 'snake' | 'kebab' | 'pascal' | 'title') => {
    if (!text) return;
    const lines = text.split('\n');
    const updated = lines.map(line => {
      if (!line.trim()) return line;
      switch (type) {
        case 'uppercase': return line.toUpperCase();
        case 'lowercase': return line.toLowerCase();
        case 'camel': return toCamelCase(line);
        case 'snake': return toSnakeCase(line);
        case 'kebab': return toKebabCase(line);
        case 'pascal': return toPascalCase(line);
        case 'title': return toTitleCase(line);
        default: return line;
      }
    });
    setText(updated.join('\n'));
  };

  const applyFindReplace = () => {
    if (!searchQuery) return;
    try {
      let updated = '';
      if (useRegex) {
        const flags = regexCaseInsensitive ? 'gi' : 'g';
        const rx = new RegExp(searchQuery, flags);
        updated = text.replace(rx, replaceQuery);
      } else {
        updated = text.split(searchQuery).join(replaceQuery);
      }
      setText(updated);
    } catch (e: any) {
      alert(`Regex Error: ${e.message}`);
    }
  };

  const applyAffixes = () => {
    if (!prefix && !suffix) return;
    const lines = text.split('\n');
    const updated = lines.map(line => `${prefix}${line}${suffix}`);
    setText(updated.join('\n'));
    setPrefix('');
    setSuffix('');
  };

  const applyFilter = () => {
    if (!filterKeyword) return;
    const lines = text.split('\n');
    const keywordLwr = filterKeyword.toLowerCase();
    const updated = lines.filter(line => {
      const match = line.toLowerCase().includes(keywordLwr);
      return filterType === 'include' ? match : !match;
    });
    setText(updated.join('\n'));
    setFilterKeyword('');
  };

  // Bulk quick line actions
  const trimLines = () => {
    const updated = text.split('\n').map(l => l.trim());
    setText(updated.join('\n'));
  };

  const removeEmptyLines = () => {
    const updated = text.split('\n').filter(l => l.trim() !== '');
    setText(updated.join('\n'));
  };

  const removeDuplicates = () => {
    const lines = text.split('\n');
    const unique = Array.from(new Set(lines));
    setText(unique.join('\n'));
  };

  const sortLines = (direction: 'asc' | 'desc') => {
    const lines = text.split('\n');
    lines.sort((a, b) => {
      return direction === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    });
    setText(lines.join('\n'));
  };

  const stripHtml = () => {
    const cleaned = text.replace(/<[^>]*>/g, '');
    setText(cleaned);
  };

  const clearWorkspace = () => {
    setText('');
  };

  const handleResetSample = () => {
    setText(
`apple_fruit
banana_yellow
grape_sweet
orange_juice
strawberry_fields
HTML <span class="tag">element</span> block
😀 cool developer emoji`
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[600px] text-slate-800 dark:text-slate-100">
      
      {/* LEFT COLUMN: Workspace Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden min-h-[450px]">
        {/* Header Toolbar */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CommandLineIcon className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-xs tracking-wider uppercase text-slate-500 dark:text-slate-400">Editor Workspace</span>
          </div>

          <div className="flex items-center gap-2">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".txt,.md,.json,.csv" />
            <button
              id="btn-upload-file"
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <DocumentArrowUpIcon className="w-3.5 h-3.5" />
              <span>Import File</span>
            </button>

            <button
              id="btn-download-file"
              onClick={handleDownload}
              className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5"
            >
              <ArrowDownTrayIcon className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            <button
              id="btn-copy-clipboard"
              onClick={copyToClipboard}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs px-2.5 py-1 font-medium transition flex items-center gap-1.5 shadow-sm"
            >
              {copied ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </>
              )}
            </button>

            <button 
              id="btn-clear-workspace"
              onClick={clearWorkspace}
              title="Clear all text"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-red-500 rounded transition"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Text Input Block */}
        <div className="flex-1 relative min-h-[300px]">
          <textarea
            id="editor-workspace-textarea"
            className="w-full h-full p-4 font-mono text-sm leading-6 outline-none bg-white dark:bg-slate-900 border-none resize-none focus:ring-0 dark:text-slate-150"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste text, log outputs, or a list of items here to begin processing line-by-line..."
          />
        </div>

        {/* Stats segment */}
        <div className="px-4 py-2 border-t border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/20 flex items-center justify-between flex-wrap text-xs text-slate-500 font-mono">
          <div className="flex gap-4">
            <span>Lines: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{lineCount}</strong></span>
            <span>Words: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{wordCount}</strong></span>
            <span>Chars: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{charCount}</strong></span>
          </div>
          <button 
            id="btn-reset-sample"
            onClick={handleResetSample} 
            className="text-indigo-650 dark:text-indigo-400 hover:underline flex items-center gap-1"
          >
            <ArrowPathIcon className="w-3 h-3" />
            <span>Load Sample Text</span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Tool Control Panel */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        
        {/* Find and Replace Card */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span>Find & Replace</span>
          </div>
          
          <div className="space-y-2">
            <input
              id="input-find-query"
              type="text"
              className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none dark:text-white placeholder-slate-400 font-mono"
              placeholder="Find pattern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <input
              id="input-replace-query"
              type="text"
              className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none dark:text-white placeholder-slate-400 font-mono"
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Replace with..."
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input
                id="checkbox-use-regex"
                type="checkbox"
                checked={useRegex}
                onChange={(e) => setUseRegex(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Use Regex</span>
            </label>

            {useRegex && (
              <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                <input
                  id="checkbox-regex-case"
                  type="checkbox"
                  checked={regexCaseInsensitive}
                  onChange={(e) => setRegexCaseInsensitive(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Case Insensitive (/i)</span>
              </label>
            )}
          </div>

          <button
            id="btn-apply-find-replace"
            onClick={applyFindReplace}
            disabled={!searchQuery}
            className="w-full py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 disabled:opacity-50 font-medium text-xs rounded transition flex items-center justify-center gap-1.5"
          >
            Replace All
          </button>
        </div>

        {/* Mass Casing Card */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            <span>Mass Lines Case</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-case-upper"
              onClick={() => changeCase('uppercase')}
              className="py-1 px-2.5 text-xs border border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
            >
              UPPERCASE
            </button>
            <button
              id="btn-case-lower"
              onClick={() => changeCase('lowercase')}
              className="py-1 px-2.5 text-xs border border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
            >
              lowercase
            </button>
            <button
              id="btn-case-camel"
              onClick={() => changeCase('camel')}
              className="py-1 px-2.5 text-xs border border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
            >
              camelCase
            </button>
            <button
              id="btn-case-snake"
              onClick={() => changeCase('snake')}
              className="py-1 px-2.5 text-xs border border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
            >
              snake_case
            </button>
            <button
              id="btn-case-kebab"
              onClick={() => changeCase('kebab')}
              className="py-1 px-2.5 text-xs border border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
            >
              kebab-case
            </button>
            <button
              id="btn-case-pascal"
              onClick={() => changeCase('pascal')}
              className="py-1 px-2.5 text-xs border border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
            >
              PascalCase
            </button>
          </div>
          <button
            id="btn-case-title"
            onClick={() => changeCase('title')}
            className="w-full py-1.5 text-xs border border-slate-150 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
          >
            Title Case
          </button>
        </div>

        {/* Affixes Card */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">
            Append Prefix & Suffix
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <input
              id="input-affix-prefix"
              type="text"
              className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none dark:text-white placeholder-slate-400 font-mono"
              placeholder="Prefix (e.g. key_)"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value)}
            />
            <input
              id="input-affix-suffix"
              type="text"
              className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none dark:text-white placeholder-slate-400 font-mono"
              placeholder="Suffix (e.g. _id)"
              value={suffix}
              onChange={(e) => setSuffix(e.target.value)}
            />
          </div>

          <button
            id="btn-apply-affixes"
            onClick={applyAffixes}
            disabled={!prefix && !suffix}
            className="w-full py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 disabled:opacity-50 font-medium text-xs rounded transition flex items-center justify-center"
          >
            Add Affixes
          </button>
        </div>

        {/* Filter Lines Card */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2">
            Filter Lines
          </div>

          <div className="flex gap-2">
            <select
              id="select-filter-type"
              className="p-1 px-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs outline-none dark:text-white cursor-pointer shrink-0"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'include' | 'exclude')}
            >
              <option value="include">Keep Only</option>
              <option value="exclude">Exclude</option>
            </select>
            <input
              id="input-filter-keyword"
              type="text"
              className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded outline-none dark:text-white placeholder-slate-400 font-mono"
              placeholder="Keyword match..."
              value={filterKeyword}
              onChange={(e) => setFilterKeyword(e.target.value)}
            />
          </div>

          <button
            id="btn-apply-filter"
            onClick={applyFilter}
            disabled={!filterKeyword}
            className="w-full py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-700 dark:text-slate-200 disabled:opacity-50 font-medium text-xs rounded transition flex items-center justify-center"
          >
            Apply Filter
          </button>
        </div>

        {/* Quick Clean Actions Card */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-1.5">
            <span>Quick Cleanups & Sort</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="btn-clean-trim"
              onClick={trimLines}
              className="py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-left"
            >
              Trim Lines
            </button>
            <button
              id="btn-clean-remove-empty"
              onClick={removeEmptyLines}
              className="py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-left"
            >
              Remove Empties
            </button>
            <button
              id="btn-clean-duplicates"
              onClick={removeDuplicates}
              className="py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-left"
              title="Remove duplicate lines from selection"
            >
              Remove Dups
            </button>
            <button
              id="btn-clean-html"
              onClick={stripHtml}
              className="py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded text-left"
            >
              Strip HTML Tags
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
            <button
              id="btn-sort-asc"
              onClick={() => sortLines('asc')}
              className="py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded flex items-center justify-between"
            >
              <span>Sort A-Z</span>
              <BarsArrowUpIcon className="w-3.5 h-3.5 opacity-60" />
            </button>
            <button
              id="btn-sort-desc"
              onClick={() => sortLines('desc')}
              className="py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded flex items-center justify-between"
            >
              <span>Sort Z-A</span>
              <BarsArrowDownIcon className="w-3.5 h-3.5 opacity-60" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
