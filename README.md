# HTML Code Preview

Write or paste HTML, CSS, and JS code across multiple files, preview live, or open in a new tab.
AI integration lets you generate code from natural language prompts.

## Features

### Multi-File Project System
- File Explorer sidebar for creating, renaming, deleting, and switching files
- Tab bar for working across multiple open files
- Smart preview that inlines linked local CSS and JS files
- Open Folder, Open Files, and drag-and-drop import
- Auto-save for project files in `localStorage`
- ZIP export for the whole project

### AI Integration
- Supports OpenAI, LM Studio, Ollama, Claude, and Gemini
- One-click "Use in Editor" flow for generated code
- Multi-turn conversation support
- Cloud API keys are stored for the current browser tab only
- Project file context is opt-in and confirmed before upload

### Core
- CodeMirror editing with syntax highlighting
- Live preview with console capture
- Generate in a new tab
- Copy, download, clear, and template shortcuts
- Dark and light theme toggle

## Quick Start

1. Open `index.html` in a browser.
2. Start editing.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Enter | Generate in new tab |
| Ctrl+S | Save project |
| Ctrl+Enter (in AI prompt) | Send AI prompt |

## AI Setup

1. Open Settings.
2. Choose a provider and enter an API key if the provider requires one.
3. Open the AI panel and enter a prompt.
4. Click Generate Code, then Use in Editor if you want to load the result.

### Local Models

**LM Studio:** Start the local server (default `http://localhost:1234`). No API key is required.

**Ollama:** Start Ollama, then set `OLLAMA_ORIGINS=*` and restart if browser access is needed. No API key is required.

## Security Notes

- The live preview iframe runs in an isolated sandbox.
- Cloud API keys are kept in `sessionStorage` for the current browser tab instead of persistent `localStorage`.
- Project files are not sent to AI providers unless **Include project files as context** is enabled.
- When context sharing is enabled, the app asks for confirmation and redacts common secret patterns before sending.
- If you want stronger protection for cloud-provider credentials, route AI requests through a backend proxy instead of calling providers directly from the browser.
