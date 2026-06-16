import React, { useState, useEffect, useRef } from 'react';
import CryptoJS from 'crypto-js';
import { DocumentDuplicateIcon, CheckIcon, DocumentArrowUpIcon, TrashIcon } from '@heroicons/react/24/outline';

const algorithms = [
  { id: 'md5', label: 'MD5', method: CryptoJS.MD5, hmacMethod: CryptoJS.HmacMD5 },
  { id: 'sha1', label: 'SHA-1', method: CryptoJS.SHA1, hmacMethod: CryptoJS.HmacSHA1 },
  { id: 'sha256', label: 'SHA-256', method: CryptoJS.SHA256, hmacMethod: CryptoJS.HmacSHA256 },
  { id: 'sha512', label: 'SHA-512', method: CryptoJS.SHA512, hmacMethod: CryptoJS.HmacSHA512 },
];

enum HashTab {
  TEXT = 'TEXT',
  HMAC = 'HMAC',
  FILE = 'FILE'
}

export const HashGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<HashTab>(HashTab.TEXT);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Text Hash State
  const [textInput, setTextInput] = useState('');
  const [textHashes, setTextHashes] = useState<Record<string, string>>({});

  // HMAC State
  const [hmacInput, setHmacInput] = useState('');
  const [hmacKey, setHmacKey] = useState('');
  const [hmacHashes, setHmacHashes] = useState<Record<string, string>>({});

  // File Checksum State
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileHashes, setFileHashes] = useState<Record<string, string>>({});
  const [isFileHashing, setIsFileHashing] = useState(false);
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute Text Hashes
  useEffect(() => {
    if (!textInput) {
      setTextHashes({});
      return;
    }
    const hashes: Record<string, string> = {};
    algorithms.forEach(algo => {
      hashes[algo.id] = algo.method(textInput).toString();
    });
    setTextHashes(hashes);
  }, [textInput]);

  // Compute HMAC Hashes
  useEffect(() => {
    if (!hmacInput || !hmacKey) {
      setHmacHashes({});
      return;
    }
    const hashes: Record<string, string> = {};
    algorithms.forEach(algo => {
      hashes[algo.id] = algo.hmacMethod(hmacInput, hmacKey).toString();
    });
    setHmacHashes(hashes);
  }, [hmacInput, hmacKey]);

  // Handle Drag Events for File Checksum
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    if (!selectedFile) return;
    if (selectedFile.size > 100 * 1024 * 1024) {
      setFileError('File too large. Maximum supported file size is 100MB.');
      return;
    }

    setFileError('');
    setFile(selectedFile);
    setIsFileHashing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        // Convert ArrayBuffer to WordArray
        const uint8 = new Uint8Array(arrayBuffer);
        const wordArray = CryptoJS.lib.WordArray.create(uint8 as any);

        const hashes: Record<string, string> = {};
        algorithms.forEach(algo => {
          hashes[algo.id] = algo.method(wordArray).toString();
        });
        setFileHashes(hashes);
      } catch (err: any) {
        setFileError(err.message || 'Error occurred while hashing file.');
      } finally {
        setIsFileHashing(false);
      }
    };

    reader.onerror = () => {
      setFileError('Could not read the selected file.');
      setIsFileHashing(false);
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    setFileHashes({});
    setFileError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col h-full gap-4 max-w-6xl mx-auto">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 shrink-0">
        <button
          onClick={() => setActiveTab(HashTab.TEXT)}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
            activeTab === HashTab.TEXT
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Text Hasher
        </button>
        <button
          onClick={() => setActiveTab(HashTab.HMAC)}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
            activeTab === HashTab.HMAC
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          HMAC Generator
        </button>
        <button
          onClick={() => setActiveTab(HashTab.FILE)}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
            activeTab === HashTab.FILE
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          File Checksum
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[500px]">
        {/* Left Input Section */}
        <div className="flex-1 flex flex-col gap-6">
          {activeTab === HashTab.TEXT && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-805">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Input Text</h3>
              </div>
              <div className="p-4 flex-1">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full h-full min-h-[250px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 custom-scrollbar"
                  placeholder="Enter text to hash..."
                />
              </div>
            </div>
          )}

          {activeTab === HashTab.HMAC && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1 gap-4 p-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Secret Key</label>
                <input
                  type="text"
                  value={hmacKey}
                  onChange={(e) => setHmacKey(e.target.value)}
                  placeholder="Enter HMAC authentication key..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div className="flex flex-col flex-1 gap-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Data / Message</label>
                <textarea
                  value={hmacInput}
                  onChange={(e) => setHmacInput(e.target.value)}
                  className="w-full h-full min-h-[200px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm resize-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 custom-scrollbar"
                  placeholder="Enter message to generate signature key keyed-hash..."
                />
              </div>
            </div>
          )}

          {activeTab === HashTab.FILE && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col flex-1 p-4 justify-center">
              {!file ? (
                <div
                  className={`flex-1 rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center p-8 text-center ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                      : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <DocumentArrowUpIcon className={`w-16 h-16 mb-4 ${dragActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Drag & Drop File Here
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm text-xs">
                    Calculate MD5, SHA-1, SHA-256 and SHA-512 values of files safely entirely in your browser. (Max 100MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => e.target.files && processFile(e.target.files[0])}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Select File
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="w-16 h-16 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                    <DocumentArrowUpIcon className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1 max-w-xs truncate">{file.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">{formatBytes(file.size)}</p>

                  <button
                    onClick={clearFile}
                    className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium dark:bg-red-900/10 dark:hover:bg-red-900/20 dark:text-red-400 dark:border-red-900 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Remove File
                  </button>
                </div>
              )}

              {isFileHashing && (
                <div className="mt-4 flex items-center justify-center gap-3 text-sm text-indigo-600 dark:text-indigo-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
                  <span>Computing file hash checksums...</span>
                </div>
              )}

              {fileError && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs border border-red-200 dark:border-red-800">
                  {fileError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Hashes Panel */}
        <div className="w-full lg:w-[500px] flex flex-col gap-4">
          {algorithms.map((algo) => {
            let activeHash = '';
            if (activeTab === HashTab.TEXT) {
              activeHash = textHashes[algo.id] || '';
            } else if (activeTab === HashTab.HMAC) {
              activeHash = hmacHashes[algo.id] || '';
            } else if (activeTab === HashTab.FILE) {
              activeHash = fileHashes[algo.id] || '';
            }

            return (
              <div key={algo.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    {algo.label} {activeTab === HashTab.HMAC ? 'HMAC' : ''}
                  </h3>
                  <button
                    onClick={() => activeHash && copyToClipboard(algo.id, activeHash)}
                    disabled={!activeHash}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copiedId === algo.id ? (
                      <>
                        <CheckIcon className="w-3.5 h-3.5 text-green-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 relative">
                  <div className="font-mono text-xs text-slate-600 dark:text-slate-300 break-all select-all min-h-[1.25rem]">
                    {activeHash || (
                      <span className="text-slate-400 dark:text-slate-500 italic">
                        {activeTab === HashTab.TEXT
                          ? 'Awaiting input text...'
                          : activeTab === HashTab.HMAC
                          ? 'Awaiting key & message...'
                          : 'Awaiting uploaded file...'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
