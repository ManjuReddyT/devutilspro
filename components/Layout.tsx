import React, { useState, useEffect } from 'react';
import { NavItem, ToolType } from '../types';
import { 
  LinkIcon, 
  CodeBracketIcon, 
  ClockIcon, 
  CalendarDaysIcon,
  CommandLineIcon,
  CubeIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  TableCellsIcon,
  SunIcon,
  MoonIcon,
  DocumentTextIcon,
  LockClosedIcon,
  ServerStackIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  SignalIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

interface LayoutProps {
  activeTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  onOpenSettings: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: ToolType.JSON_TOOLS, label: 'JSON Tools', icon: <CodeBracketIcon className="w-5 h-5" />, description: 'Format, Validate, Convert' },
  { id: ToolType.YAML_JSON, label: 'YAML <> JSON', icon: <DocumentTextIcon className="w-5 h-5" />, description: 'Convert & K8s Validate' },
  { id: ToolType.XML_TOOLS, label: 'XML Tools', icon: <CubeIcon className="w-5 h-5" />, description: 'Format, Validate, Convert' },
  { id: ToolType.JWT_DEBUGGER, label: 'JWT Debugger', icon: <ShieldCheckIcon className="w-5 h-5" />, description: 'Decode & Analyze Tokens' },
  { id: ToolType.REGEX_TESTER, label: 'Regex Tester', icon: <MagnifyingGlassIcon className="w-5 h-5" />, description: 'Test & Debug Patterns' },
  { id: ToolType.SQL_TOOLS, label: 'SQL Tools', icon: <TableCellsIcon className="w-5 h-5" />, description: 'Format, Generate & Explain' },
  { id: ToolType.MARKDOWN_PREVIEW, label: 'Markdown View', icon: <EyeIcon className="w-5 h-5" />, description: 'Edit & Live Preview' },
  { id: ToolType.DOCKERFILE_GENERATOR, label: 'Dockerfile Gen', icon: <ServerStackIcon className="w-5 h-5" />, description: 'AI Generator' },
  { id: ToolType.CURL_CONVERTER, label: 'Curl Converter', icon: <CommandLineIcon className="w-5 h-5" />, description: 'Curl to Fetch/Axios/Python' },
  { id: ToolType.URL_PARSER, label: 'URL Parser', icon: <GlobeAltIcon className="w-5 h-5" />, description: 'Builder & Params Editor' },
  { id: ToolType.HTTP_STATUS, label: 'HTTP Status', icon: <SignalIcon className="w-5 h-5" />, description: 'Codes Reference & Debug' },
  { id: ToolType.CHMOD_CALCULATOR, label: 'Chmod Calc', icon: <LockClosedIcon className="w-5 h-5" />, description: 'Permissions' },
  { id: ToolType.BASE64, label: 'Base64', icon: <CubeIcon className="w-5 h-5" />, description: 'Encode & Decode' },
  { id: ToolType.URL_ENCODER, label: 'URL Encoder', icon: <LinkIcon className="w-5 h-5" />, description: 'Escape & Unescape' },
  { id: ToolType.EPOCH, label: 'Epoch Converter', icon: <ClockIcon className="w-5 h-5" />, description: 'Timestamps & Dates' },
  { id: ToolType.CRON, label: 'Cron Guru', icon: <CalendarDaysIcon className="w-5 h-5" />, description: 'Schedule Editor & AI' },
];

export const Layout: React.FC<LayoutProps> = ({ activeTool, onToolChange, onOpenSettings, children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Initial theme load
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
      localStorage.theme = 'dark';
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      localStorage.theme = 'light';
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden transition-colors duration-200">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col transition-all duration-300 shadow-xl z-20`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-800 dark:border-slate-800">
          {isSidebarOpen && <h1 className="font-bold text-white text-xl tracking-tight">DevUtils<span className="text-indigo-500">Pro</span></h1>}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 rounded-md hover:bg-slate-800 transition-colors">
            {isSidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <ul className="space-y-1 px-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => onToolChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group
                    ${activeTool === item.id 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                      : 'hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <div className={`${activeTool === item.id ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
                    {item.icon}
                  </div>
                  {isSidebarOpen && (
                    <div className="text-left">
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-[10px] opacity-70 truncate max-w-[140px]">{item.description}</p>
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-2 border-t border-slate-800 space-y-2">
           <button 
             onClick={toggleTheme}
             className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-all text-slate-400"
           >
              {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
              {isSidebarOpen && <span className="font-medium text-sm">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
           </button>

           <button 
             onClick={onOpenSettings}
             className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition-all text-slate-400"
           >
              <Cog6ToothIcon className="w-5 h-5" />
              {isSidebarOpen && <span className="font-medium text-sm">Settings</span>}
           </button>
        </div>

        <div className="p-4 border-t border-slate-800">
          {isSidebarOpen ? (
            <div className="flex flex-col gap-1">
              <div className="text-xs text-center opacity-50">v1.7.0 • Local First</div>
              <div className="text-[10px] text-center text-slate-500 font-mono">Cmd + K to search</div>
            </div>
          ) : (
             <div className="text-xs text-center opacity-50">v1.7</div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col relative bg-slate-100 dark:bg-slate-900">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 shadow-sm z-10 transition-colors duration-200">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white">
             {NAV_ITEMS.find(i => i.id === activeTool)?.label}
          </h2>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
               className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-md border border-slate-200 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
             >
               <MagnifyingGlassIcon className="w-3.5 h-3.5" />
               Search tools... 
               <span className="ml-1 px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-500 font-mono text-[10px]">⌘K</span>
             </button>
             <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-medium border border-indigo-100 dark:border-indigo-800">
               Client-side processing
             </span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export { NAV_ITEMS };