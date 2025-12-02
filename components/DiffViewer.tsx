import React, { useMemo, useRef, useEffect } from 'react';
import * as Diff from 'diff';

interface DiffViewerProps {
  original: string;
  modified: string;
}

interface LineData {
  text: string;
  type: 'added' | 'removed' | 'neutral' | 'empty';
  lineNumber?: number;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ original, modified }) => {
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  // Sync scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>, targetRef: React.RefObject<HTMLDivElement>) => {
    if (targetRef.current) {
      targetRef.current.scrollTop = e.currentTarget.scrollTop;
      targetRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const { leftLines, rightLines } = useMemo(() => {
    // Normalize newlines
    const cleanOriginal = original.replace(/\r\n/g, '\n');
    const cleanModified = modified.replace(/\r\n/g, '\n');

    const diff = Diff.diffLines(cleanOriginal, cleanModified);

    let leftLines: LineData[] = [];
    let rightLines: LineData[] = [];
    let leftLineNum = 1;
    let rightLineNum = 1;

    diff.forEach((part) => {
      // Diff returns a 'value' containing one or more lines
      // and flags 'added' or 'removed'
      const lines = part.value.replace(/\n$/, '').split('\n');

      if (part.added) {
        // Added lines go to Right, Left gets padding
        lines.forEach(line => {
          rightLines.push({ text: line, type: 'added', lineNumber: rightLineNum++ });
          leftLines.push({ text: '', type: 'empty' });
        });
      } else if (part.removed) {
        // Removed lines go to Left, Right gets padding
        lines.forEach(line => {
          leftLines.push({ text: line, type: 'removed', lineNumber: leftLineNum++ });
          rightLines.push({ text: '', type: 'empty' });
        });
      } else {
        // Neutral lines go to both
        lines.forEach(line => {
          leftLines.push({ text: line, type: 'neutral', lineNumber: leftLineNum++ });
          rightLines.push({ text: line, type: 'neutral', lineNumber: rightLineNum++ });
        });
      }
    });

    return { leftLines, rightLines };
  }, [original, modified]);

  const renderLine = (line: LineData, side: 'left' | 'right') => {
    if (line.type === 'empty') {
      return (
        <div className="flex bg-slate-100/50 dark:bg-slate-800/50 select-none">
          <div className="w-12 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-transparent text-xs py-0.5 px-2 text-right">.</div>
          <div className="flex-1 py-0.5 px-4">&nbsp;</div>
        </div>
      );
    }

    let bgClass = '';
    let textClass = 'text-slate-700 dark:text-slate-300';
    
    if (line.type === 'added') {
      bgClass = 'bg-green-100 dark:bg-green-900/30';
      textClass = 'text-green-900 dark:text-green-100';
    } else if (line.type === 'removed') {
      bgClass = 'bg-red-50 dark:bg-red-900/20';
      textClass = 'text-red-900 dark:text-red-100 decoration-red-900/30 line-through decoration-1';
    }

    return (
      <div className={`flex ${bgClass} hover:bg-opacity-80`}>
        <div className="w-12 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 text-xs py-0.5 px-2 text-right select-none font-mono">
          {line.lineNumber}
        </div>
        <div className={`flex-1 py-0.5 px-4 font-mono text-sm whitespace-pre ${textClass}`}>
          {line.text}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-1 min-h-0 border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
      {/* Left Pane (Original) */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-slate-300 dark:border-slate-700">
        <div className="bg-slate-50 dark:bg-slate-900 p-2 text-xs font-bold text-slate-500 dark:text-slate-400 text-center uppercase border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
           Original
        </div>
        <div 
          ref={leftScrollRef}
          onScroll={(e) => handleScroll(e, rightScrollRef)}
          className="flex-1 overflow-auto custom-scrollbar"
        >
          {leftLines.map((line, i) => (
             <React.Fragment key={i}>{renderLine(line, 'left')}</React.Fragment>
          ))}
        </div>
      </div>

      {/* Right Pane (Modified) */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-slate-50 dark:bg-slate-900 p-2 text-xs font-bold text-slate-500 dark:text-slate-400 text-center uppercase border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10">
           Modified
        </div>
        <div 
          ref={rightScrollRef}
          onScroll={(e) => handleScroll(e, leftScrollRef)}
          className="flex-1 overflow-auto custom-scrollbar"
        >
          {rightLines.map((line, i) => (
             <React.Fragment key={i}>{renderLine(line, 'right')}</React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};