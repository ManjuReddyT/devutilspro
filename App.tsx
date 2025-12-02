import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { CommandPalette } from './components/CommandPalette';
import { SettingsModal } from './components/SettingsModal';
import { ToolType } from './types';
import { JsonTools } from './views/JsonTools';
import { XmlTools } from './views/XmlTools';
import { YamlJsonTool } from './views/YamlJsonTool';
import { StringTools } from './views/StringTools';
import { EpochTool } from './views/EpochTool';
import { CronTool } from './views/CronTool';
import { JwtDebugger } from './views/JwtDebugger';
import { RegexTester } from './views/RegexTester';
import { SqlTools } from './views/SqlTools';
import { ChmodTool } from './views/ChmodTool';
import { DockerTool } from './views/DockerTool';
import { CurlConverter } from './views/CurlConverter';
import { UrlParser } from './views/UrlParser';
import { HttpStatus } from './views/HttpStatus';

function App() {
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.JSON_TOOLS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const renderTool = () => {
    switch (activeTool) {
      case ToolType.JSON_TOOLS:
        return <JsonTools />;
      case ToolType.XML_TOOLS:
        return <XmlTools />;
      case ToolType.YAML_JSON:
        return <YamlJsonTool />;
      case ToolType.JWT_DEBUGGER:
        return <JwtDebugger />;
      case ToolType.REGEX_TESTER:
        return <RegexTester />;
      case ToolType.SQL_TOOLS:
        return <SqlTools />;
      case ToolType.DOCKERFILE_GENERATOR:
        return <DockerTool />;
      case ToolType.CHMOD_CALCULATOR:
        return <ChmodTool />;
      case ToolType.URL_ENCODER:
        return <StringTools mode={ToolType.URL_ENCODER} />;
      case ToolType.BASE64:
        return <StringTools mode={ToolType.BASE64} />;
      case ToolType.EPOCH:
        return <EpochTool />;
      case ToolType.CRON:
        return <CronTool />;
      case ToolType.CURL_CONVERTER:
        return <CurlConverter />;
      case ToolType.URL_PARSER:
        return <UrlParser />;
      case ToolType.HTTP_STATUS:
        return <HttpStatus />;
      default:
        return <JsonTools />;
    }
  };

  return (
    <>
      <Layout 
        activeTool={activeTool} 
        onToolChange={setActiveTool} 
        onOpenSettings={() => setIsSettingsOpen(true)}
      >
        {renderTool()}
      </Layout>
      <CommandPalette onSelectTool={setActiveTool} />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
}

export default App;