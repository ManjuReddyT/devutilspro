import React from 'react';

export enum ToolType {
  JSON_TOOLS = 'JSON_TOOLS',
  XML_TOOLS = 'XML_TOOLS',
  YAML_JSON = 'YAML_JSON',
  JWT_DEBUGGER = 'JWT_DEBUGGER',
  REGEX_TESTER = 'REGEX_TESTER',
  SQL_TOOLS = 'SQL_TOOLS',
  DOCKERFILE_GENERATOR = 'DOCKERFILE_GENERATOR',
  CHMOD_CALCULATOR = 'CHMOD_CALCULATOR',
  BASE64 = 'BASE64',
  URL_ENCODER = 'URL_ENCODER',
  EPOCH = 'EPOCH',
  CRON = 'CRON',
  CURL_CONVERTER = 'CURL_CONVERTER',
  URL_PARSER = 'URL_PARSER',
  HTTP_STATUS = 'HTTP_STATUS'
}

export interface NavItem {
  id: ToolType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export type CronParts = {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
};

export interface JsonStats {
  strings: number;
  numbers: number;
  booleans: number;
  objects: number;
  arrays: number;
  nulls: number;
}

export type AiProvider = 'gemini' | 'ollama';

export interface AiConfig {
  provider: AiProvider;
  ollamaUrl: string;
  ollamaModel: string;
}

export interface DockerConfig {
  language: string;
  port: string;
  baseImage: string;
  entrypoint: string;
  packageManager: string;
}