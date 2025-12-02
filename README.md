# DevUtils Pro

**DevUtils Pro** is a production-grade, offline-capable suite of developer utilities. It combines essential formatting and conversion tools with advanced AI-powered analysis (using Google Gemini or Local Ollama) to boost developer productivity.

## 🚀 Features

### 🛠️ Data & Format Tools
- **JSON Tools**: 
  - **Editor**: Format, Validate, Minify, and AI Auto-Fix.
  - **Visualizer**: Explore data via Interactive Tree, Data Grid, or **Charts** (Bar/Line/Area).
  - **Diff Viewer**: Side-by-side visual comparison with synchronized scrolling.
  - **Analyzer**: JSONPath Querying & Payload Size Breakdown (Treemap).
  - **Converter**: Instant JSON to XML conversion.
- **XML Tools**: 
  - **Editor**: Format, Validate, Minify, and AI Auto-Fix.
  - **Visualizer**: DOM Tree view of XML structures.
  - **Diff Viewer**: Visual side-by-side XML comparison.
  - **Analyzer**: Tag vs Content size analysis.
  - **Converter**: Instant XML to JSON conversion.
- **YAML Tools**: Bi-directional YAML <-> JSON converter with **Kubernetes Manifest Validation** (AI).

### 🌐 Network & API
- **cURL Converter**: Convert raw cURL commands to **JavaScript (Fetch)**, **Python (Requests)**, **Go**, **Java**, or **PHP**.
- **URL Parser**: interactive builder to edit Protocol, Host, Path, and Query Parameters individually.
- **HTTP Status Codes**: Searchable reference database with AI-powered debugging and explanations for errors.

### 💻 DevOps & SQL
- **SQL Tools**:
  - **Formatter**: Beautify complex SQL queries.
  - **Generator**: Convert natural language to SQL (e.g., "Get users who bought items yesterday").
  - **Explainer**: AI breakdown of complex JOINs and subqueries.
- **Dockerfile Generator**: AI wizard to generate production-ready Dockerfiles for Node, Python, Go, Java, etc.
- **Regex Tester**: Real-time matching, highlight groups, and integrated cheatsheet.

### 🔒 Security & Encoders
- **JWT Debugger**: Client-side decoding of Headers/Payloads with AI security analysis.
- **Chmod Calculator**: Visual grid for generating Octal (`755`) and Symbolic (`drwxr-xr-x`) permissions.
- **Encoders**: Base64 Encode/Decode, URL Encode/Decode.

### ⏳ Time & Scheduling
- **Epoch Converter**: 
  - **Smart Input**: Auto-detects Unix timestamps (s/ms) or ISO strings.
  - **Visual Timeline**: See where a date falls between 1970 and 2100.
  - **Batch Mode**: Convert multiple timestamps at once.
  - **Timezones**: Convert to/from any global timezone.
- **Cron Guru**: Interactive expression editor with "Next 5 Runs" preview and AI explanation.

---

## 🏗️ Architecture
- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: Tailwind CSS (Dark Mode supported)
- **Charts**: Recharts
- **AI**: Google GenAI SDK (Cloud) & Ollama (Local)
- **Diffing**: jsdiff

---

## ⚡ Quick Start (Local Development)

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Configure API (Optional)**
    Create a `.env` file in the root:
    ```env
    API_KEY=your_google_gemini_api_key
    ```
    *If you skip this, you can use the Local Ollama provider in Settings.*

3.  **Run Dev Server**
    ```bash
    npm run dev
    ```

---

## 🐳 Docker Deployment

DevUtils Pro is Docker-ready. It uses a multi-stage build to serve the static app via Nginx.

1.  **Build Image**
    ```bash
    docker build -t devutils-pro .
    ```

2.  **Run Container**
    ```bash
    docker run -p 8080:80 devutils-pro
    ```
    Access the app at `http://localhost:8080`.

---

## 🤖 Local AI Setup (Ollama)

To use AI features locally without sending data to the cloud:

1.  **Install Ollama**: Download from [ollama.com](https://ollama.com).
2.  **Pull Model**: Run `ollama pull llama3` (or any other model).
3.  **Enable CORS** (Crucial for browser access):
    *   **Mac/Linux**: `OLLAMA_ORIGINS="*" ollama serve`
    *   **Windows**: `$env:OLLAMA_ORIGINS="*"; ollama serve`
4.  **Configure App**: Open DevUtils Pro -> **Settings** -> **AI Configuration**, select **Ollama**, and click **Test Connection**.

---

## 📄 License
MIT License. Free to use for personal and commercial projects.
