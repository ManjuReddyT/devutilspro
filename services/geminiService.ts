import { GoogleGenAI } from "@google/genai";
import { AiConfig, DockerConfig } from "../types";

const apiKey = process.env.API_KEY || '';
const geminiAi = new GoogleGenAI({ apiKey });

// Default Config
let currentConfig: AiConfig = {
  provider: 'gemini',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3'
};

// Load from local storage if available
try {
  const saved = localStorage.getItem('devutils_ai_config');
  if (saved) {
    currentConfig = { ...currentConfig, ...JSON.parse(saved) };
  }
} catch (e) {
  console.error("Failed to load AI config", e);
}

export const getAiConfig = (): AiConfig => ({ ...currentConfig });

export const updateAiConfig = (config: Partial<AiConfig>) => {
  currentConfig = { ...currentConfig, ...config };
  localStorage.setItem('devutils_ai_config', JSON.stringify(currentConfig));
};

// Helper to normalize URL
const normalizeUrl = (url: string) => url.replace(/\/$/, '');

export const testOllamaConnection = async (url: string): Promise<boolean> => {
  try {
    // Try to fetch tags (models list) as a lightweight connectivity check
    const cleanUrl = normalizeUrl(url);
    const response = await fetch(`${cleanUrl}/api/tags`);
    return response.ok;
  } catch (e) {
    console.error("Ollama connection check failed:", e);
    return false;
  }
};

// Helper to call Ollama
const callOllama = async (prompt: string, systemInstruction?: string): Promise<string> => {
  try {
    const fullPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
    const cleanUrl = normalizeUrl(currentConfig.ollamaUrl);
    
    // Note: Ollama API generates a stream by default, we want a single response here for simplicity
    const response = await fetch(`${cleanUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: currentConfig.ollamaModel,
        prompt: fullPrompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama Error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error("Ollama Call Failed:", error);
    throw error;
  }
};

export const explainCronExpression = async (expression: string): Promise<string> => {
  const prompt = `Explain this cron expression in simple, human-readable terms: "${expression}". Keep it concise.`;
  
  try {
    if (currentConfig.provider === 'ollama') {
      return await callOllama(prompt, "You are a helpful developer assistant.");
    } else {
      if (!apiKey) return "API Key not configured.";
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "Could not explain expression.";
    }
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : "AI Service Unavailable"}`;
  }
};

export const fixAndFormatJson = async (input: string): Promise<{ fixed: string; error?: string }> => {
  const prompt = `Fix the following malformed JSON and return ONLY the valid JSON string. Do not add markdown formatting or backticks. Input: ${input}`;
  
  try {
    let text = "";
    if (currentConfig.provider === 'ollama') {
      text = await callOllama(prompt, "You are a JSON repair tool. Output only raw JSON.");
    } else {
      if (!apiKey) return { fixed: input, error: "API Key missing." };
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      text = response.text || "";
    }

    // Clean up potential markdown code blocks
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return { fixed: cleanText };
  } catch (error) {
    return { fixed: input, error: "AI failed to fix JSON." };
  }
};

export const fixAndFormatXml = async (input: string): Promise<{ fixed: string; error?: string }> => {
  const prompt = `Fix the following malformed XML and return ONLY the valid XML string. Do not add markdown formatting or backticks. Input: ${input}`;
  
  try {
    let text = "";
    if (currentConfig.provider === 'ollama') {
      text = await callOllama(prompt, "You are an XML repair tool. Output only raw XML.");
    } else {
      if (!apiKey) return { fixed: input, error: "API Key missing." };
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      text = response.text || "";
    }

    // Clean up potential markdown code blocks
    const cleanText = text.replace(/```xml/g, '').replace(/```/g, '').trim();
    return { fixed: cleanText };
  } catch (error) {
    return { fixed: input, error: "AI failed to fix XML." };
  }
};

export const generateSampleData = async (type: 'json' | 'xml', context: string): Promise<string> => {
    const prompt = `Generate a sample ${type.toUpperCase()} object for: "${context}". Return ONLY the raw code, no markdown.`;
    
    try {
      let text = "";
      if (currentConfig.provider === 'ollama') {
        text = await callOllama(prompt, `You are a data generator. Output only raw ${type.toUpperCase()}.`);
      } else {
        if (!apiKey) return `<!-- API Key missing -->`;
        const response = await geminiAi.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        text = response.text || "";
      }
      
      text = text.replace(/```(json|xml)/g, '').replace(/```/g, '').trim();
      return text;
    } catch (error) {
      return "Error generating data.";
    }
};

export const explainJwt = async (header: any, payload: any): Promise<string> => {
  const prompt = `Analyze this JWT. Header: ${JSON.stringify(header)}. Payload: ${JSON.stringify(payload)}. 
  Explain the key claims (expiry, issuer, audience, roles) in plain English. Warn if it is expired (assume current time is ${new Date().toISOString()}). Keep it concise.`;

  try {
    if (currentConfig.provider === 'ollama') {
      return await callOllama(prompt, "You are a security expert.");
    } else {
      if (!apiKey) return "API Key not configured.";
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "Could not analyze JWT.";
    }
  } catch (error) {
    return "Error analyzing JWT.";
  }
};

export const generateSql = async (instruction: string): Promise<string> => {
  const prompt = `Write a SQL query for: "${instruction}". Return ONLY the raw SQL code, no markdown, no explanation. Use standard SQL syntax.`;
  
  try {
    let text = "";
    if (currentConfig.provider === 'ollama') {
      text = await callOllama(prompt, "You are a SQL expert. Output only raw SQL.");
    } else {
      if (!apiKey) return "-- API Key missing";
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      text = response.text || "";
    }
    
    return text.replace(/```sql/g, '').replace(/```/g, '').trim();
  } catch (error) {
    return "-- Error generating SQL";
  }
};

export const explainSql = async (query: string): Promise<string> => {
  const prompt = `Explain this SQL query in simple terms, focusing on the logic, joins, and filters: "${query}".`;
  
  try {
    if (currentConfig.provider === 'ollama') {
      return await callOllama(prompt, "You are a database instructor.");
    } else {
      if (!apiKey) return "API Key not configured.";
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "Could not explain SQL.";
    }
  } catch (error) {
    return "Error explaining SQL.";
  }
};

export const formatSql = (sql: string): string => {
  // Basic Regex-based formatter
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 
    'INSERT INTO', 'UPDATE', 'DELETE', 'VALUES', 'JOIN', 'LEFT JOIN', 
    'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'ON', 'LIMIT', 'OFFSET', 
    'HAVING', 'CREATE TABLE', 'DROP TABLE', 'ALTER TABLE'
  ];
  
  let formatted = sql.replace(/\s+/g, ' ').trim(); // Normalize spaces
  
  keywords.forEach(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'gi');
    formatted = formatted.replace(regex, `\n${kw.toUpperCase()}`);
  });
  
  // Indent parenthesis slightly (heuristic)
  formatted = formatted.replace(/\(/g, '(\n  ').replace(/\)/g, '\n)');
  
  return formatted.trim();
};

// --- DevOps Tools ---

export const validateK8sManifest = async (yaml: string): Promise<string> => {
  const prompt = `Review this Kubernetes YAML manifest for errors, security risks (e.g. root user, missing limits), and best practices. 
  Output a bulleted list of issues. If it looks good, say so. Keep it concise.
  
  YAML:
  ${yaml}`;

  try {
    if (currentConfig.provider === 'ollama') {
      return await callOllama(prompt, "You are a Kubernetes expert.");
    } else {
      if (!apiKey) return "API Key not configured.";
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "Could not validate manifest.";
    }
  } catch (error) {
    return "Error validating K8s manifest.";
  }
};

export const generateDockerfile = async (config: DockerConfig): Promise<string> => {
  const prompt = `Generate a production-ready Dockerfile for a ${config.language} application.
  Base Image: ${config.baseImage || 'default for language'}
  Package Manager: ${config.packageManager || 'npm/pip/etc'}
  Expose Port: ${config.port}
  Entrypoint: ${config.entrypoint}
  
  Include comments explaining the steps. Use multi-stage builds if appropriate for the language. Return ONLY the Dockerfile content (no markdown).`;

  try {
    let text = "";
    if (currentConfig.provider === 'ollama') {
      text = await callOllama(prompt, "You are a DevOps expert. Output only raw Dockerfile content.");
    } else {
      if (!apiKey) return "# API Key not configured";
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      text = response.text || "";
    }
    
    return text.replace(/```dockerfile/g, '').replace(/```/g, '').trim();
  } catch (error) {
    return "# Error generating Dockerfile";
  }
};

// --- Network Tools ---

export const convertCurlToCode = async (curl: string, targetLanguage: string): Promise<string> => {
  const prompt = `Convert the following cURL command to idiomatic ${targetLanguage} code. 
  Handle headers, body, and method correctly. Return ONLY the code, no markdown.
  
  cURL:
  ${curl}`;

  try {
    let text = "";
    if (currentConfig.provider === 'ollama') {
      text = await callOllama(prompt, `You are a code converter. Output only raw ${targetLanguage}.`);
    } else {
      if (!apiKey) return "// API Key not configured";
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      text = response.text || "";
    }
    
    // Remove code blocks if present
    return text.replace(/```[\w]*\n?/g, '').replace(/```/g, '').trim();
  } catch (error) {
    return "// Error converting cURL";
  }
};

export const explainHttpError = async (code: string, text: string): Promise<string> => {
  const prompt = `Explain the HTTP Status Code ${code} (${text}) in the context of web APIs.
  What usually causes it? How do you fix it? Give a real-world example. Keep it concise.`;

  try {
    if (currentConfig.provider === 'ollama') {
      return await callOllama(prompt, "You are an API debugging expert.");
    } else {
      if (!apiKey) return "API Key not configured.";
      const response = await geminiAi.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text || "Could not explain error.";
    }
  } catch (error) {
    return "Error retrieving explanation.";
  }
};