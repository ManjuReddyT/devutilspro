import React, { useState, useEffect } from 'react';
import { DocumentDuplicateIcon, CheckIcon, ShieldCheckIcon, InformationCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

enum GeneratorTab {
  UUID_GEN = 'UUID_GEN',
  UUID_PARSE = 'UUID_PARSE',
  KEY_GEN = 'KEY_GEN'
}

type UuidVersion = 'v1' | 'v4' | 'v7';

// Word pool for offline XKCD memorable passphrases
const MEMORABLE_WORDS = [
  'apple', 'banana', 'cherry', 'orange', 'grape', 'peach', 'plum0', 'berry', 'melon', 'lemon',
  'river', 'mount', 'forest', 'valley', 'desert', 'ocean', 'canyon', 'island', 'garden', 'meadow',
  'silver', 'golden', 'bronze', 'copper', 'iron', 'steel', 'glass', 'stone', 'wooden', 'marble',
  'bright', 'silent', 'swift', 'brave', 'clever', 'honest', 'gentle', 'vibrant', 'serene', 'calm',
  'wizard', 'knight', 'ranger', 'druid', 'cleric', 'rogue', 'paladin', 'hunter', 'scholar', 'artist',
  'castle', 'temple', 'bridge', 'tower', 'palace', 'harbor', 'cottage', 'station', 'library', 'market',
  'spring', 'summer', 'autumn', 'winter', 'sunrise', 'sunset', 'morning', 'evening', 'midday', 'midnight',
  'quantum', 'nebula', 'galaxy', 'meteor', 'cosmic', 'stellar', 'aurora', 'eclipse', 'gravity', 'vortex',
  'active', 'secure', 'expert', 'global', 'matrix', 'vector', 'beacon', 'anchor', 'shield', 'cipher',
  'phoenix', 'falcon', 'griffin', 'badger', 'panther', 'leopard', 'dolphin', 'sparrow', 'swallow', 'koala'
];

export const UuidGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<GeneratorTab>(GeneratorTab.UUID_GEN);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // --- UUID Generator State ---
  const [uuidVersion, setUuidVersion] = useState<UuidVersion>('v4');
  const [uuidCount, setUuidCount] = useState<number>(5);
  const [uuidUppercase, setUuidUppercase] = useState<boolean>(false);
  const [uuidHyphens, setUuidHyphens] = useState<boolean>(true);
  const [uuidBraces, setUuidBraces] = useState<boolean>(false);
  const [generatedUuids, setGeneratedUuids] = useState<string[]>([]);

  // --- UUID Parser State ---
  const [parseInput, setParseInput] = useState<string>('');
  const [parseMetadata, setParseMetadata] = useState<any>(null);

  // --- Password/Token State ---
  const [keyType, setKeyType] = useState<'password' | 'passphrase' | 'raw_bytes'>('password');
  const [keyCount, setKeyCount] = useState<number>(3);
  const [generatedKeys, setGeneratedKeys] = useState<string[]>([]);
  // Password sub-config
  const [pwLength, setPwLength] = useState<number>(16);
  const [pwUpper, setPwUpper] = useState<boolean>(true);
  const [pwLower, setPwLower] = useState<boolean>(true);
  const [pwNumbers, setPwNumbers] = useState<boolean>(true);
  const [pwSymbols, setPwSymbols] = useState<boolean>(true);
  const [pwExcludeAmbiguous, setPwExcludeAmbiguous] = useState<boolean>(false);
  // Passphrase sub-config
  const [passWordsCount, setPassWordsCount] = useState<number>(4);
  const [passSeparator, setPassSeparator] = useState<string>('-');
  const [passCapitalize, setPassCapitalize] = useState<boolean>(false);
  // Raw Hex/Base64 Token sub-config
  const [tokenStrength, setTokenStrength] = useState<'128' | '256' | '512'>('256');
  const [tokenFormat, setTokenFormat] = useState<'hex' | 'base64'>('hex');

  // Trigger generators
  useEffect(() => {
    if (activeTab === GeneratorTab.UUID_GEN) {
      handleGenerateUuids();
    }
  }, [uuidVersion, uuidCount, uuidUppercase, uuidHyphens, uuidBraces, activeTab]);

  useEffect(() => {
    if (activeTab === GeneratorTab.KEY_GEN) {
      handleGenerateKeys();
    }
  }, [
    keyType, keyCount, pwLength, pwUpper, pwLower, pwNumbers, pwSymbols, pwExcludeAmbiguous,
    passWordsCount, passSeparator, passCapitalize, tokenStrength, tokenFormat, activeTab
  ]);

  // Parse UUID automatically
  useEffect(() => {
    analyzeUuid(parseInput);
  }, [parseInput]);

  // Formatter for raw buffers to UUID strings
  const formatUuidString = (bytes: Uint8Array, hyphens = true, braces = false, uppercase = false) => {
    let hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    
    if (hyphens) {
      hex = `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20)}`;
    }
    if (braces) {
      hex = `{${hex}}`;
    }
    return uppercase ? hex.toUpperCase() : hex.toLowerCase();
  };

  // NATIVE CRYPTO UUID GENERATOR
  const handleGenerateUuids = () => {
    const list: string[] = [];
    for (let c = 0; c < uuidCount; c++) {
      const bytes = new Uint8Array(16);
      window.crypto.getRandomValues(bytes);

      if (uuidVersion === 'v4') {
        // Set Version 4 (0100)
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        // Set Variant RFC 4122 (10xx)
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
      } else if (uuidVersion === 'v7') {
        // Set timestamp (first 48 bits / 6 bytes)
        // Introduce small microsecond offset for uniqueness in bulk generation
        const timeMs = Date.now() + c; 
        const timeHex = timeMs.toString(16).padStart(12, '0');
        for (let i = 0; i < 6; i++) {
          bytes[i] = parseInt(timeHex.substr(i * 2, 2), 16);
        }
        // Set Version 7 (0111)
        bytes[6] = (bytes[6] & 0x0f) | 0x70;
        // Set Variant RFC 4122 (10xx)
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
      } else {
        // UUID v1 (Timestamp & Node Mac)
        // 100-nanoseconds since Gregorian Epoch (Oct 15, 1582)
        const GREGORIAN_OFFSET = 122192928000000000;
        const now100ns = (Date.now() + c) * 10000 + GREGORIAN_OFFSET;
        const timeHex = now100ns.toString(16).padStart(16, '0');

        // low, mid, high-and-version elements
        const timeLow = timeHex.substr(8, 8);
        const timeMid = timeHex.substr(4, 4);
        const timeHigh = timeHex.substr(0, 4);

        const lowBytes = parseInt(timeLow, 16);
        const midBytes = parseInt(timeMid, 16);
        const highBytes = parseInt(timeHigh, 16);

        bytes[0] = (lowBytes >> 24) & 0xff;
        bytes[1] = (lowBytes >> 16) & 0xff;
        bytes[2] = (lowBytes >> 8) & 0xff;
        bytes[3] = lowBytes & 0xff;

        bytes[4] = (midBytes >> 8) & 0xff;
        bytes[5] = midBytes & 0xff;

        bytes[6] = (highBytes >> 8) & 0x0f; // clean version
        bytes[6] |= 0x10; // set UUID version 1
        bytes[7] = highBytes & 0xff;

        // Sequence (random 14-bit)
        const sequence = Math.floor(Math.random() * 0x3fff);
        bytes[8] = ((sequence >> 8) & 0x3f) | 0x80; // Variant RFC 4122
        bytes[9] = sequence & 0xff;

        // IEEE 802 node address (random multicast MAC style)
        bytes[10] = (Math.floor(Math.random() * 255) & 0xfe) | 0x01; // Multicast bit set
        bytes[11] = Math.floor(Math.random() * 255);
        bytes[12] = Math.floor(Math.random() * 255);
        bytes[13] = Math.floor(Math.random() * 255);
        bytes[14] = Math.floor(Math.random() * 255);
        bytes[15] = Math.floor(Math.random() * 255);
      }

      list.push(formatUuidString(bytes, uuidHyphens, uuidBraces, uuidUppercase));
    }
    setGeneratedUuids(list);
  };

  // NATIVE SECURE CREDENTIAL GENERATORS
  const handleGenerateKeys = () => {
    const list: string[] = [];

    for (let c = 0; c < keyCount; c++) {
      if (keyType === 'password') {
        let chars = '';
        if (pwLower) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (pwUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (pwNumbers) chars += '0123456789';
        if (pwSymbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';

        if (pwExcludeAmbiguous) {
          chars = chars.replace(/[oO0iI1l|\s]/g, '');
        }

        if (!chars) {
          list.push('Please select at least one character set.');
          continue;
        }

        let pass = '';
        const randoms = new Uint32Array(pwLength);
        window.crypto.getRandomValues(randoms);
        for (let i = 0; i < pwLength; i++) {
          pass += chars[randoms[i] % chars.length];
        }
        list.push(pass);
      } else if (keyType === 'passphrase') {
        const words: string[] = [];
        const randomValues = new Uint32Array(passWordsCount);
        window.crypto.getRandomValues(randomValues);
        
        for (let i = 0; i < passWordsCount; i++) {
          let word = MEMORABLE_WORDS[randomValues[i] % MEMORABLE_WORDS.length];
          if (passCapitalize) {
            word = word.charAt(0).toUpperCase() + word.slice(1);
          }
          words.push(word);
        }
        list.push(words.join(passSeparator));
      } else {
        // Raw bytes (Symmetric secrets)
        const byteLen = parseInt(tokenStrength) / 8;
        const bytes = new Uint8Array(byteLen);
        window.crypto.getRandomValues(bytes);
        
        if (tokenFormat === 'hex') {
          list.push(Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join(''));
        } else {
          // base64 format safely
          const binString = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
          list.push(window.btoa(binString));
        }
      }
    }
    setGeneratedKeys(list);
  };

  // UUID ANALYZER & TIMESTAMP EXTRACTOR
  const analyzeUuid = (uuidStr: string) => {
    const cleaned = uuidStr.trim().replace(/[{}]/g, '').toLowerCase();
    
    // Regular hex string layout (supporting with/without hyphens)
    const pureHex = cleaned.replace(/-/g, '');
    const uuidRegex = /^[0-9a-f]{32}$/i;

    if (!uuidRegex.test(pureHex)) {
      setParseMetadata(null);
      return;
    }

    // Extract structure components
    const isBraced = uuidStr.startsWith('{') && uuidStr.endsWith('}');
    const hasDashes = uuidStr.includes('-');

    // Version (character at index 12 in hyphenated format, or index 12 in pure hex format)
    // UUID format is: 8-4-4-4-12 -> version starts at character index 12 (hex array position 12)
    const versionDigit = parseInt(pureHex.charAt(12), 16);
    
    // Variant (indexed as 16th hex char)
    const variantDigit = parseInt(pureHex.charAt(16), 16);
    let variantDescription = 'Unknown Variant';
    if ((variantDigit & 0x8) === 0) {
      variantDescription = 'NCS Backward Compatibility';
    } else if ((variantDigit & 0xc) === 0x8) {
      variantDescription = 'RFC 4122 (Standard)';
    } else if ((variantDigit & 0xe) === 0xc) {
      variantDescription = 'Microsoft GUID';
    } else if ((variantDigit & 0xf) === 0xe) {
      variantDescription = 'Future Reserved';
    }

    let timestamp: Date | null = null;
    let macAddress: string | null = null;

    if (versionDigit === 7) {
      // UUID v7 millisecond extraction
      // First 48 bits (12 hex digits) are timestamp
      const msHex = pureHex.substr(0, 12);
      const milliseconds = parseInt(msHex, 16);
      timestamp = new Date(milliseconds);
    } else if (versionDigit === 1) {
      // UUID v1 timestamp extraction
      const lowStr = pureHex.substr(0, 8);
      const midStr = pureHex.substr(8, 4);
      const highStr = pureHex.substr(12, 4);
      
      const highTimeStr = highStr.substr(1, 3); // Clip off version
      const fullTimeHex = highTimeStr + midStr + lowStr;
      
      const intervalsOffset = 122192928000000000; // Intervals between Oct 15 1582 and Jan 1 1970
      const uuidIntervals = parseInt(fullTimeHex, 16);
      const msSinceEpoch = (uuidIntervals - intervalsOffset) / 10000;
      timestamp = new Date(msSinceEpoch);

      // Extract node MAC
      const macHex = pureHex.substr(20, 12);
      const macParts = [];
      for (let i = 0; i < 6; i++) {
        macParts.push(macHex.substr(i * 2, 2));
      }
      macAddress = macParts.join(':').toUpperCase();
    }

    setParseMetadata({
      version: versionDigit,
      variant: variantDescription,
      hasDashes,
      isBraced,
      timestamp,
      macAddress,
      pureHex
    });
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAll = (texts: string[]) => {
    navigator.clipboard.writeText(texts.join('\n'));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Basic Entropy assessment
  const assessPasswordStrength = (pw: string) => {
    if (!pw) return { level: 'None', width: '3%', color: 'bg-slate-300', text: 'Enter text...' };
    
    let charsUsed = 0;
    if (/[a-z]/.test(pw)) charsUsed += 26;
    if (/[A-Z]/.test(pw)) charsUsed += 26;
    if (/[0-9]/.test(pw)) charsUsed += 10;
    if (/[^a-zA-Z0-9]/.test(pw)) charsUsed += 32;

    const entropy = pw.length * Math.log2(charsUsed || 1);
    
    if (entropy < 35) {
      return { level: 'Weak', width: '25%', color: 'bg-red-500', text: `${Math.round(entropy)} bits - Easy to crack` };
    } else if (entropy < 60) {
      return { level: 'Moderate', width: '50%', color: 'bg-amber-500', text: `${Math.round(entropy)} bits - Fair strength` };
    } else if (entropy < 90) {
      return { level: 'Strong', width: '80%', color: 'bg-green-500', text: `${Math.round(entropy)} bits - Highly secure` };
    } else {
      return { level: 'Enterprise', width: '100%', color: 'bg-indigo-600', text: `${Math.round(entropy)} bits - Cryptographically secure` };
    }
  };

  return (
    <div className="flex flex-col h-full gap-4 max-w-6xl mx-auto">
      {/* Sub tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 shrink-0">
        <button
          onClick={() => setActiveTab(GeneratorTab.UUID_GEN)}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
            activeTab === GeneratorTab.UUID_GEN
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          UUID Generator
        </button>
        <button
          onClick={() => setActiveTab(GeneratorTab.UUID_PARSE)}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
            activeTab === GeneratorTab.UUID_PARSE
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          UUID Parser / Analyzer
        </button>
        <button
          onClick={() => setActiveTab(GeneratorTab.KEY_GEN)}
          className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
            activeTab === GeneratorTab.KEY_GEN
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Credential & Key Generator
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-[480px]">
        {/* Left Control Panel */}
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-5">
          {activeTab === GeneratorTab.UUID_GEN && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">UUID Version</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'v4', label: 'v4 (Random)', desc: 'Standard usage' },
                    { id: 'v7', label: 'v7 (Epoch-Ordered)', desc: 'Index/Db friendly' },
                    { id: 'v1', label: 'v1 (Time + MAC)', desc: 'Timestamp based' }
                  ].map(v => (
                    <button
                      key={v.id}
                      onClick={() => setUuidVersion(v.id as UuidVersion)}
                      className={`p-3.5 rounded-lg border text-left transition-all ${
                        uuidVersion === v.id
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-750 dark:text-slate-350'
                      }`}
                    >
                      <div className="font-bold text-sm mb-0.5">{v.label}</div>
                      <div className="text-[10px] opacity-75">{v.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity</label>
                  <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">{uuidCount}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={uuidCount}
                  onChange={(e) => setUuidCount(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 dark:bg-slate-700 h-1.5 rounded-lg cursor-pointer"
                />
              </div>

              <div className="border-t border-slate-150 dark:border-slate-700/80 pt-4 space-y-3">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Formatting Options</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer user-select-none">
                    <input
                      type="checkbox"
                      checked={uuidHyphens}
                      onChange={(e) => setUuidHyphens(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 dark:bg-slate-900"
                    />
                    <span>Include Hyphens</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer user-select-none">
                    <input
                      type="checkbox"
                      checked={uuidUppercase}
                      onChange={(e) => setUuidUppercase(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 dark:bg-slate-900"
                    />
                    <span>Uppercase Hex</span>
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer user-select-none">
                    <input
                      type="checkbox"
                      checked={uuidBraces}
                      onChange={(e) => setUuidBraces(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4 border-slate-300 dark:bg-slate-900"
                    />
                    <span>Wrap in {"{}"} Braces</span>
                  </label>
                </div>
              </div>

              <button
                onClick={handleGenerateUuids}
                className="mt-auto py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Regenerate Fields
              </button>
            </>
          )}

          {activeTab === GeneratorTab.UUID_PARSE && (
            <div className="flex flex-col h-full gap-5">
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paste UUID / GUID</label>
                <input
                  type="text"
                  value={parseInput}
                  onChange={(e) => setParseInput(e.target.value)}
                  placeholder="e.g. 018fbee7-0efc-7000-8000-000000000000"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div className="flex-1 border-t border-slate-150 dark:border-slate-700 pt-4 flex flex-col justify-center">
                {parseMetadata ? (
                  <div className="space-y-4">
                     <div className="flex justify-between items-center bg-green-50 dark:bg-green-950/20 px-4 py-2 border border-green-200 dark:border-green-900 rounded-lg text-xs text-green-700 dark:text-green-300 shrink-0">
                        <span className="font-bold">✓ Valid UUID Formatted</span>
                        <span className="font-mono bg-green-200 dark:bg-green-900/50 px-2 py-0.5 rounded">Format: {parseMetadata.hasDashes ? 'With Hyphens' : 'Hex Only'}</span>
                     </div>

                     <div className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 p-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-700 rounded-lg text-sm">
                       <span className="text-slate-400 font-medium">RFC Version:</span>
                       <span className="font-bold text-slate-800 dark:text-slate-200">
                         Version {parseMetadata.version} ({parseMetadata.version === 1 ? 'Mac/Time-based' : parseMetadata.version === 4 ? 'Random-based' : parseMetadata.version === 7 ? 'Epoch Timestamp-ordered' : 'Unknown / MD5 / SHA'})
                       </span>

                       <span className="text-slate-400 font-medium">Variant Specification:</span>
                       <span className="font-mono text-slate-700 dark:text-slate-300">{parseMetadata.variant}</span>

                       {parseMetadata.timestamp && (
                          <>
                            <span className="text-slate-400 font-medium">Decoded Time:</span>
                            <div className="text-slate-800 dark:text-slate-200">
                              <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{parseMetadata.timestamp.toISOString()}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{parseMetadata.timestamp.toLocaleString()}</p>
                            </div>
                          </>
                       )}

                       {parseMetadata.macAddress && (
                          <>
                            <span className="text-slate-400 font-medium">Mac Hardware ID:</span>
                            <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{parseMetadata.macAddress}</span>
                          </>
                       )}

                       <span className="text-slate-400 font-medium">Compressed Hex:</span>
                       <span className="font-mono text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 break-all select-all">{parseMetadata.pureHex}</span>
                     </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-400 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl">
                    <InformationCircleIcon className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
                    <p className="text-sm font-medium">Waiting for valid UUID input to analyze...</p>
                    <p className="text-xs opacity-65 mt-1">Supports v1, v4, v7 identifiers in brace, dash, or uppercase styles.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === GeneratorTab.KEY_GEN && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Key Style</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'password', label: 'Password' },
                    { id: 'passphrase', label: 'Passphrase' },
                    { id: 'raw_bytes', label: 'Token Key' }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => setKeyType(style.id as any)}
                      className={`p-2 rounded-lg border text-sm font-bold text-center transition-all ${
                        keyType === style.id
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-350'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {keyType === 'password' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Length</label>
                      <span className="text-xs font-bold font-mono text-indigo-605 dark:text-indigo-400">{pwLength} chars</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="128"
                      value={pwLength}
                      onChange={(e) => setPwLength(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-x-2 gap-y-2.5 border-t border-slate-150 dark:border-slate-700 pt-3">
                     <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={pwLower}
                          onChange={(e) => setPwLower(e.target.checked)}
                          className="rounded text-indigo-605 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>a-z (lowercase)</span>
                     </label>
                     <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={pwUpper}
                          onChange={(e) => setPwUpper(e.target.checked)}
                          className="rounded text-indigo-605 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>A-Z (uppercase)</span>
                     </label>
                     <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={pwNumbers}
                          onChange={(e) => setPwNumbers(e.target.checked)}
                          className="rounded text-indigo-605 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>0-9 (numbers)</span>
                     </label>
                     <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={pwSymbols}
                          onChange={(e) => setPwSymbols(e.target.checked)}
                          className="rounded text-indigo-605 focus:ring-indigo-500 h-4 w-4"
                        />
                        <span>!@#$% symbols</span>
                     </label>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none border-t border-slate-150 dark:border-slate-700 pt-2">
                     <input
                       type="checkbox"
                       checked={pwExcludeAmbiguous}
                       onChange={(e) => setPwExcludeAmbiguous(e.target.checked)}
                       className="rounded text-indigo-605 focus:ring-indigo-500 h-3.5 w-3.5"
                     />
                     <span>Exclude confusing chars (e.g. l, i, o, 1, 0, O)</span>
                  </label>
                </div>
              )}

              {keyType === 'passphrase' && (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Word count</label>
                      <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400">{passWordsCount} words</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="12"
                      value={passWordsCount}
                      onChange={(e) => setPassWordsCount(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-150 dark:border-slate-700 pt-3">
                     <div>
                       <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Separator</label>
                       <select
                         value={passSeparator}
                         onChange={(e) => setPassSeparator(e.target.value)}
                         className="p-1 px-2.5 w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-sm outline-none dark:text-white cursor-pointer"
                       >
                         <option value="-">Hyphen (-)</option>
                         <option value=".">Dot (.)</option>
                         <option value="_">Underscore (_)</option>
                         <option value=" ">Space ( )</option>
                       </select>
                     </div>

                     <div className="flex items-end justify-center pb-1">
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={passCapitalize}
                            onChange={(e) => setPassCapitalize(e.target.checked)}
                            className="rounded text-indigo-605 focus:ring-indigo-500 h-4 w-4"
                          />
                          <span>Capitalize Words</span>
                        </label>
                     </div>
                  </div>
                </div>
              )}

              {keyType === 'raw_bytes' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Format</label>
                      <select
                        value={tokenFormat}
                        onChange={(e) => setTokenFormat(e.target.value as any)}
                        className="p-1 px-2.5 w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-sm outline-none dark:text-white"
                      >
                        <option value="hex">Raw Hex string</option>
                        <option value="base64">Base64 string</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Entropy Capacity</label>
                      <select
                        value={tokenStrength}
                        onChange={(e) => setTokenStrength(e.target.value as any)}
                        className="p-1 px-2.5 w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-sm outline-none dark:text-white"
                      >
                        <option value="128">128-bit (Symmetric API)</option>
                        <option value="256">256-bit (Recommended)</option>
                        <option value="512">512-bit (JWT HMAC key)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="border-t border-slate-150 dark:border-slate-700 pt-3">
                 <div className="flex justify-between items-center mb-1.5">
                   <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Number of fields</label>
                   <span className="text-xs font-bold font-mono text-indigo-605 dark:text-indigo-400">{keyCount}</span>
                 </div>
                 <input
                   type="range"
                   min="1"
                   max="20"
                   value={keyCount}
                   onChange={(e) => setKeyCount(parseInt(e.target.value))}
                   className="w-full accent-indigo-600 h-1 rounded-lg cursor-pointer"
                 />
              </div>

              <button
                onClick={handleGenerateKeys}
                className="mt-auto py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                Generate Credentials
              </button>
            </>
          )}
        </div>

        {/* Right Output Panel */}
        <div className="flex-[1.2] flex flex-col gap-4">
          <div className="bg-slate-900 dark:bg-slate-950 rounded-xl overflow-hidden shadow-sm border border-slate-800 flex flex-col flex-1">
             <div className="p-4 border-b border-slate-800 bg-slate-950 flex justify-between items-center shrink-0">
               <h3 className="font-semibold text-slate-200 text-sm">Generated Fields</h3>
               
               <button
                 onClick={() => copyAll(activeTab === GeneratorTab.UUID_GEN ? generatedUuids : generatedKeys)}
                 disabled={activeTab === GeneratorTab.UUID_GEN ? !generatedUuids.length : !generatedKeys.length}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg hover:text-white transition-colors text-xs font-medium disabled:opacity-50"
               >
                 {copiedAll ? (
                   <>
                     <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                     <span>Copied All</span>
                   </>
                 ) : (
                   <>
                     <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                     <span>Copy All</span>
                   </>
                 )}
               </button>
             </div>

             <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-2.5">
               {activeTab === GeneratorTab.UUID_GEN && generatedUuids.map((uuid, index) => (
                  <div key={index} className="flex gap-4 p-3 bg-slate-800/40 rounded-lg border border-slate-800 items-center justify-between group hover:border-slate-700 transition">
                     <span className="font-mono text-xs text-slate-300 select-all truncate max-w-full leading-5 flex-1">{uuid}</span>
                     <button
                       onClick={() => copyToClipboard(uuid, index)}
                       className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 text-slate-400 hover:text-indigo-400 bg-slate-800 border border-slate-700 rounded transition"
                     >
                       {copiedIndex === index ? (
                         <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                       ) : (
                         <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                       )}
                     </button>
                  </div>
               ))}

               {activeTab === GeneratorTab.KEY_GEN && generatedKeys.map((key, index) => {
                  const strength = keyType !== 'raw_bytes' ? assessPasswordStrength(key) : null;
                  return (
                    <div key={index} className="p-3 bg-slate-800/40 rounded-lg border border-slate-800 flex flex-col gap-2 group hover:border-slate-700 transition">
                       <div className="flex items-center justify-between gap-4">
                          <span className="font-mono text-xs text-indigo-300 select-all break-all leading-5 flex-1">{key}</span>
                          <button
                            onClick={() => copyToClipboard(key, index)}
                            className="bg-slate-800 border border-slate-700 p-1 rounded text-slate-400 hover:text-indigo-400"
                          >
                            {copiedIndex === index ? (
                              <CheckIcon className="w-3.5 h-3.5 text-green-400" />
                            ) : (
                              <DocumentDuplicateIcon className="w-3.5 h-3.5" />
                            )}
                          </button>
                       </div>
                       {strength && (
                          <div className="flex items-center gap-3">
                             <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
                             </div>
                             <span className="text-[10px] text-slate-400 font-medium font-mono shrink-0">{strength.text}</span>
                          </div>
                       )}
                    </div>
                  );
               })}

               {activeTab === GeneratorTab.UUID_PARSE && (
                  <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
                     <ShieldCheckIcon className="w-12 h-12 mb-2 opacity-25" />
                     <p className="text-sm font-medium">Parser view does not produce list outputs.</p>
                     <p className="text-xs max-w-xs opacity-65 mt-1">Paste a UUID on the left panel to execute real-time extraction and analysis of version & timestamp components.</p>
                  </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
