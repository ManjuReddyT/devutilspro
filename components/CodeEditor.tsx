import React, { useState, useRef, useLayoutEffect, useMemo } from 'react';
import { 
  ClipboardDocumentIcon, 
  ClipboardDocumentCheckIcon, 
  ClipboardDocumentListIcon 
} from '@heroicons/react/24/outline';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
  readOnly?: boolean;
  label?: string;
  className?: string;
}

const highlightCode = (code: string, lang: string): string => {
  // 1. Escape HTML entities to prevent rendering issues and XSS in the preview layer
  let html = code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  if (!code) return html;

  // Helper to wrap text in a span with Tailwind classes
  const span = (text: string, classes: string) => `<span class="${classes}">${text}</span>`;

  // Color Palette (Light/Dark friendly)
  const colors = {
    key: "text-indigo-700 dark:text-indigo-400 font-semibold",
    string: "text-emerald-600 dark:text-emerald-400",
    number: "text-orange-600 dark:text-orange-400",
    boolean: "text-rose-600 dark:text-rose-400 font-semibold",
    null: "text-slate-500 dark:text-slate-500 italic",
    comment: "text-slate-400 dark:text-slate-500 italic",
    tag: "text-indigo-700 dark:text-indigo-400 font-semibold",
    attr: "text-purple-600 dark:text-purple-400",
    keyword: "text-purple-700 dark:text-purple-400 font-bold",
    function: "text-blue-600 dark:text-blue-400",
    operator: "text-slate-600 dark:text-slate-300"
  };

  switch (lang) {
    case 'json':
      // JSON Highlighting
      return html.replace(
        /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
        (match) => {
          if (/^"/.test(match)) {
            if (/:$/.test(match)) {
              // It's a key (ends with :)
              return span(match, colors.key);
            }
            // It's a string value
            return span(match, colors.string);
          } else if (/true|false/.test(match)) {
            return span(match, colors.boolean);
          } else if (/null/.test(match)) {
            return span(match, colors.null);
          } else {
            return span(match, colors.number);
          }
        }
      );

    case 'xml':
      // Basic XML Highlighting
      return html
        .replace(/(&lt;\/?)(\w+)(.*?)(&gt;)/g, (match, p1, p2, p3, p4) => {
           // p1: < or </
           // p2: tag name
           // p3: attributes
           // p4: >
           let attrs = p3.replace(/(\w+)=("[^"]*")/g, (m: string, attr: string, val: string) => {
             return `${span(attr, colors.attr)}=${span(val, colors.string)}`;
           });
           return `${span(p1, colors.operator)}${span(p2, colors.tag)}${attrs}${span(p4, colors.operator)}`;
        })
        .replace(/(&lt;!--[\s\S]*?--&gt;)/g, (match) => span(match, colors.comment));

    case 'sql':
      // SQL Highlighting
      const keywords = /\b(SELECT|FROM|WHERE|AND|OR|INSERT|UPDATE|DELETE|DROP|CREATE|TABLE|VALUES|INTO|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|ORDER|BY|LIMIT|OFFSET|HAVING|AS|IS|NULL|NOT|DISTINCT)\b/gi;
      return html
        .replace(keywords, (match) => span(match, colors.keyword))
        .replace(/'[^']*'/g, (match) => span(match, colors.string))
        .replace(/`[^`]*`/g, (match) => span(match, colors.attr))
        .replace(/--.*$/gm, (match) => span(match, colors.comment));

    case 'yaml':
      // Simple YAML
      return html
        .replace(/^(\s*)([\w-]+)(:)(.*)$/gm, (match, indent, key, colon, val) => {
           return `${indent}${span(key, colors.key)}${colon}${span(val, colors.string)}`;
        })
        .replace(/#.*$/gm, (match) => span(match, colors.comment));

    case 'dockerfile':
      // Dockerfile
      const instructions = /^(FROM|MAINTAINER|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/gim;
      return html
        .replace(instructions, (match) => span(match, colors.keyword))
        .replace(/#.*$/gm, (match) => span(match, colors.comment));

    default:
      return html;
  }
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ 
  value, 
  onChange, 
  language = 'text', 
  placeholder,
  readOnly = false,
  label,
  className = ""
}) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  
  // Ref to track desired cursor position after render
  const cursorUpdateRef = useRef<number | null>(null);

  // Sync scroll between textarea, highlighter (pre), and line numbers
  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text);
    } catch (err) {
      console.error('Failed to paste', err);
    }
  };

  // Smart Key Handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (readOnly) return;
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;

    // TAB: Insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const newVal = val.substring(0, start) + "  " + val.substring(end);
      onChange(newVal);
      cursorUpdateRef.current = start + 2;
    }
    
    // ENTER: Auto-indent
    else if (e.key === 'Enter') {
      e.preventDefault();
      
      const lines = val.substring(0, start).split('\n');
      const currentLine = lines[lines.length - 1];
      const match = currentLine.match(/^(\s*)/);
      const indent = match ? match[1] : "";
      
      const trimmedLine = currentLine.trim();
      const extraIndent = (trimmedLine.endsWith('{') || trimmedLine.endsWith('[') || trimmedLine.endsWith('(')) ? "  " : "";
      
      const insert = "\n" + indent + extraIndent;
      const newVal = val.substring(0, start) + insert + val.substring(end);
      
      onChange(newVal);
      cursorUpdateRef.current = start + insert.length;
    }

    // Bracket Closing
    else if (['{', '[', '(', '"', "'"].includes(e.key)) {
      if (start === end) {
        const pairMap: Record<string, string> = {
          '{': '}',
          '[': ']',
          '(': ')',
          '"': '"',
          "'": "'"
        };
        const close = pairMap[e.key];
        
        e.preventDefault();
        const newVal = val.substring(0, start) + e.key + close + val.substring(end);
        onChange(newVal);
        cursorUpdateRef.current = start + 1;
      }
    }
  };

  // Restore cursor position after value update if needed
  useLayoutEffect(() => {
    if (cursorUpdateRef.current !== null && textareaRef.current) {
      textareaRef.current.selectionStart = cursorUpdateRef.current;
      textareaRef.current.selectionEnd = cursorUpdateRef.current;
      cursorUpdateRef.current = null;
    }
  });

  // Generate syntax highlighted HTML
  const highlightedCode = useMemo(() => {
    return highlightCode(value, language);
  }, [value, language]);

  // Generate line numbers
  const lineCount = value.split('\n').length;
  // Use a simplified array for line numbers to avoid creating huge arrays on every render
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {label && <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">{label}</label>}
      
      <div className="flex-1 relative rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden transition-all group flex">
        
        {/* Line Numbers */}
        <div 
          ref={lineNumbersRef}
          className="hidden md:block w-12 bg-slate-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs font-mono text-right py-4 pr-3 select-none overflow-hidden custom-scrollbar leading-relaxed"
          aria-hidden="true"
        >
          {lines.map((num) => (
            <div key={num}>{num}</div>
          ))}
        </div>

        {/* Editor Container */}
        <div className="relative flex-1 h-full overflow-hidden">
          
          {/* Syntax Highlighter Layer (Bottom) */}
          <pre
            ref={preRef}
            aria-hidden="true"
            className="absolute inset-0 p-4 font-mono text-sm leading-relaxed whitespace-pre overflow-hidden pointer-events-none z-0 text-slate-800 dark:text-slate-200"
            dangerouslySetInnerHTML={{ __html: highlightedCode + '<br/>' }} 
            // Append <br/> to ensure last empty line renders correctly if present
          />

          {/* Input Layer (Top) */}
          <textarea
            ref={textareaRef}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            className="syntax-editor-textarea absolute inset-0 w-full h-full p-4 font-mono text-sm leading-relaxed whitespace-pre resize-none focus:outline-none z-10 overflow-auto custom-scrollbar"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
        
          <div className="absolute top-2 right-4 flex items-center gap-2 z-20">
            {/* Action Buttons */}
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 border border-slate-200 dark:border-slate-700 shadow-sm rounded-md p-0.5 bg-white/90 dark:bg-slate-750/90 backdrop-blur-sm">
               <button 
                 onClick={handleCopy}
                 className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                 title="Copy to Clipboard"
                 type="button"
               >
                 {copied ? <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 text-green-500" /> : <ClipboardDocumentIcon className="w-3.5 h-3.5" />}
               </button>
               {!readOnly && (
                 <button 
                   onClick={handlePaste}
                   className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                   title="Paste from Clipboard"
                   type="button"
                 >
                   <ClipboardDocumentListIcon className="w-3.5 h-3.5" />
                 </button>
               )}
            </div>

            {/* Language Tag */}
            <div className="px-2 py-1 bg-slate-100/90 dark:bg-slate-700/90 backdrop-blur-sm text-slate-400 dark:text-slate-300 text-xs rounded pointer-events-none border border-slate-200 dark:border-slate-600 font-mono shadow-sm">
              {language}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};