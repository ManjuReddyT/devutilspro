import React, { useState } from 'react';
import { CodeEditor } from '../components/CodeEditor';
import { generateDockerfile } from '../services/geminiService';
import { ServerStackIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { DockerConfig } from '../types';

export const DockerTool: React.FC = () => {
  const [config, setConfig] = useState<DockerConfig>({
    language: 'Node.js',
    port: '3000',
    baseImage: 'node:18-alpine',
    entrypoint: 'npm start',
    packageManager: 'npm'
  });
  const [dockerfile, setDockerfile] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    const result = await generateDockerfile(config);
    setDockerfile(result);
    setGenerating(false);
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    const defaults: Record<string, Partial<DockerConfig>> = {
      'Node.js': { baseImage: 'node:18-alpine', port: '3000', entrypoint: 'npm start', packageManager: 'npm' },
      'Python': { baseImage: 'python:3.9-slim', port: '8000', entrypoint: 'python app.py', packageManager: 'pip' },
      'Go': { baseImage: 'golang:1.21-alpine', port: '8080', entrypoint: './main', packageManager: 'go mod' },
      'Java': { baseImage: 'openjdk:17-jdk-slim', port: '8080', entrypoint: 'java -jar app.jar', packageManager: 'maven' },
      'Static HTML': { baseImage: 'nginx:alpine', port: '80', entrypoint: 'nginx -g "daemon off;"', packageManager: 'none' }
    };
    
    setConfig({ ...config, language: lang, ...defaults[lang] });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-6">
       <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
         {/* Config Form */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-fit">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
               <ServerStackIcon className="w-5 h-5 text-indigo-500" /> Configuration
            </h3>
            
            <div className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Language / Stack</label>
                 <select 
                   value={config.language}
                   onChange={handleLanguageChange}
                   className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                 >
                   <option>Node.js</option>
                   <option>Python</option>
                   <option>Go</option>
                   <option>Java</option>
                   <option>Static HTML</option>
                 </select>
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Base Image</label>
                 <input 
                   type="text" 
                   value={config.baseImage}
                   onChange={(e) => setConfig({...config, baseImage: e.target.value})}
                   className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono"
                 />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Expose Port</label>
                 <input 
                   type="text" 
                   value={config.port}
                   onChange={(e) => setConfig({...config, port: e.target.value})}
                   className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono"
                 />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Package Manager</label>
                 <input 
                   type="text" 
                   value={config.packageManager}
                   onChange={(e) => setConfig({...config, packageManager: e.target.value})}
                   className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                 />
               </div>

               <div>
                 <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Entrypoint Command</label>
                 <input 
                   type="text" 
                   value={config.entrypoint}
                   onChange={(e) => setConfig({...config, entrypoint: e.target.value})}
                   className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono"
                 />
               </div>

               <button 
                 onClick={handleGenerate}
                 disabled={generating}
                 className="w-full mt-4 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-500/20"
               >
                 {generating ? 'Generating...' : 'Generate Dockerfile'}
                 {!generating && <SparklesIcon className="w-4 h-4" />}
               </button>
            </div>
         </div>

         {/* Editor */}
         <div className="md:col-span-3 h-full flex flex-col">
            <CodeEditor 
               value={dockerfile} 
               onChange={setDockerfile} 
               language="dockerfile" 
               placeholder="# Generated Dockerfile will appear here..." 
            />
         </div>
       </div>
    </div>
  );
};