import React, { useState, useEffect } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { marked } from 'marked';
import { DocumentTextIcon, EyeIcon } from '@heroicons/react/24/outline';

export const MarkdownPreview: React.FC = () => {
  const [markdown, setMarkdown] = useState('# Hello World\n\nStart typing your markdown here.\n\n- [x] Task 1\n- [ ] Task 2\n\n```javascript\nconsole.log("Code blocks are supported!");\n```');
  const [html, setHtml] = useState('');

  useEffect(() => {
    // Basic Markdown parsing
    // In a real production app, sanitize this with DOMPurify
    const parse = async () => {
      try {
        const parsed = await marked.parse(markdown);
        setHtml(parsed);
      } catch (e) {
        console.error("Markdown parse error", e);
      }
    };
    parse();
  }, [markdown]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        {/* Editor Side */}
        <div className="flex flex-col gap-4 min-h-0">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
             <DocumentTextIcon className="w-4 h-4" /> Editor
           </div>
           <CodeEditor 
             value={markdown} 
             onChange={setMarkdown} 
             language="markdown" 
             placeholder="# Title..." 
             className="shadow-sm"
           />
        </div>

        {/* Preview Side */}
        <div className="flex flex-col gap-4 min-h-0">
           <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
             <EyeIcon className="w-4 h-4" /> Preview
           </div>
           <div className="flex-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
             <div className="absolute inset-0 p-8 overflow-y-auto custom-scrollbar">
                <div 
                  className="prose prose-slate dark:prose-invert max-w-none prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-200 dark:prose-pre:border-slate-700"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};