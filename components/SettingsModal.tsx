import React, { useState, useEffect } from 'react';
import { XMarkIcon, Cog6ToothIcon, BookOpenIcon, CheckCircleIcon, XCircleIcon, SignalIcon } from '@heroicons/react/24/outline';
import { getAiConfig, updateAiConfig, testOllamaConnection } from '../services/geminiService';
import { AiConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AiConfig>(getAiConfig());
  const [activeTab, setActiveTab] = useState<'config' | 'readme'>('config');
  const [saveStatus, setSaveStatus] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (isOpen) {
      setConfig(getAiConfig());
      setSaveStatus('');
      setTestStatus('idle');
    }
  }, [isOpen]);

  const handleSave = () => {
    updateAiConfig(config);
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    const success = await testOllamaConnection(config.ollamaUrl);
    setTestStatus(success ? 'success' : 'error');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Cog6ToothIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Settings & Setup
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-500 dark:text-slate-400">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'config' 
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 dark:border-indigo-400' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            AI Configuration
          </button>
          <button
            onClick={() => setActiveTab('readme')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'readme' 
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-t-2 border-indigo-600 dark:border-indigo-400' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Local Setup Guide
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 text-slate-700 dark:text-slate-300">
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">AI Provider</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setConfig({ ...config, provider: 'gemini' })}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      config.provider === 'gemini' 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-bold">Google Gemini</div>
                    <div className="text-xs opacity-75 mt-1">Cloud-based, Fast, Zero-setup</div>
                  </button>
                  <button
                    onClick={() => setConfig({ ...config, provider: 'ollama' })}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      config.provider === 'ollama' 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="font-bold">Ollama</div>
                    <div className="text-xs opacity-75 mt-1">Local, Private, Requires Install</div>
                  </button>
                </div>
              </div>

              {config.provider === 'gemini' && (
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300">
                  <p><strong>Status:</strong> Active</p>
                  <p className="mt-1">Using API Key configured in environment.</p>
                </div>
              )}

              {config.provider === 'ollama' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Ollama URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={config.ollamaUrl}
                        onChange={(e) => setConfig({ ...config, ollamaUrl: e.target.value })}
                        className="flex-1 p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                        placeholder="http://localhost:11434"
                      />
                      <button 
                        onClick={handleTestConnection}
                        disabled={testStatus === 'testing'}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded border border-slate-300 dark:border-slate-600 flex items-center gap-2 transition text-sm font-medium"
                      >
                         {testStatus === 'testing' ? (
                           <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                         ) : (
                           <SignalIcon className="w-4 h-4" />
                         )}
                         Test
                      </button>
                    </div>
                    {testStatus === 'success' && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                        <CheckCircleIcon className="w-3.5 h-3.5" /> Connection successful
                      </p>
                    )}
                    {testStatus === 'error' && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                        <XCircleIcon className="w-3.5 h-3.5" /> Connection failed (Check CORS or URL)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">Model Name</label>
                    <input
                      type="text"
                      value={config.ollamaModel}
                      onChange={(e) => setConfig({ ...config, ollamaModel: e.target.value })}
                      className="w-full p-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                      placeholder="llama3"
                    />
                    <p className="text-xs text-slate-400 mt-1">Make sure you have pulled this model via `ollama pull {config.ollamaModel || 'modelname'}`</p>
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs p-3 rounded border border-yellow-200 dark:border-yellow-800">
                    <strong>Important:</strong> You must configure CORS on your local Ollama instance for the browser to connect. See the "Local Setup Guide" tab.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'readme' && (
            <div className="prose prose-sm prose-slate dark:prose-invert max-w-none">
              <div className="flex items-center gap-2 mb-4">
                 <BookOpenIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                 <h3 className="text-lg font-bold m-0 text-slate-900 dark:text-white">How to setup Ollama Locally</h3>
              </div>
              
              <p>Ollama allows you to run open-source large language models, such as Llama 3, locally on your machine.</p>

              <h4 className="font-bold mt-4 text-slate-800 dark:text-slate-200">1. Install Ollama</h4>
              <p>Download and install Ollama from <a href="https://ollama.com" target="_blank" className="text-indigo-600 dark:text-indigo-400 underline">ollama.com</a>.</p>

              <h4 className="font-bold mt-4 text-slate-800 dark:text-slate-200">2. Pull a Model</h4>
              <p>Open your terminal and run the following command to download a model (e.g., Llama 3):</p>
              <pre className="bg-slate-900 dark:bg-slate-800 text-slate-50 p-3 rounded-md overflow-x-auto text-xs mt-2">
                <code>ollama pull llama3</code>
              </pre>

              <h4 className="font-bold mt-4 text-slate-800 dark:text-slate-200">3. Configure CORS (Crucial)</h4>
              <p>By default, Ollama blocks requests from web browsers. You need to set the <code>OLLAMA_ORIGINS</code> environment variable to allow this app to connect.</p>
              
              <div className="mt-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Mac/Linux:</p>
                <pre className="bg-slate-900 dark:bg-slate-800 text-slate-50 p-3 rounded-md overflow-x-auto text-xs">
                  <code>OLLAMA_ORIGINS="*" ollama serve</code>
                </pre>
              </div>

              <div className="mt-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Windows (PowerShell):</p>
                <pre className="bg-slate-900 dark:bg-slate-800 text-slate-50 p-3 rounded-md overflow-x-auto text-xs">
                  <code>$env:OLLAMA_ORIGINS="*"; ollama serve</code>
                </pre>
              </div>

              <h4 className="font-bold mt-4 text-slate-800 dark:text-slate-200">4. Connect</h4>
              <p>Once Ollama is running with CORS enabled, go to the <strong>AI Configuration</strong> tab, select "Ollama", enter your model name, and click "Test" to verify the connection.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'config' && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
            <span className="text-sm font-medium text-green-600 dark:text-green-400">{saveStatus}</span>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white text-sm font-medium">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-sm transition-transform active:scale-95">
                Save Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};