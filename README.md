# 🔧 HTML Code Preview

Write or paste HTML, CSS, and JS code across multiple files, preview live, or open in a new tab.
AI integration lets you generate code from natural language prompts.

## Features

### Multi-File Project System
- 📂 **File Explorer** sidebar — see, create, rename, and delete files
- 🗂️ **Tab Bar** — open multiple files with quick switching
- 🔗 **Smart Preview** — automatically inlines linked `style.css` and `script.js` files
- 📁 **Open Folder** — load an entire folder from disk (File System Access API)
- 📄 **Open Files** — load individual files from disk
- 🖱️ **Drag & Drop** — drop files from your OS onto the app
- 💾 **Auto-save** — project persists in localStorage
- 📦 **Download as ZIP** — export the whole project at once

### AI Integration
- 🤖 Supports OpenAI, LM Studio, Ollama, Claude, and Gemini
- 📋 **Use in Editor** button — one click loads AI-generated code
- Multi-turn conversation with context

### Core
- ✍️ CodeMirror with syntax highlighting & auto-closing tags
- 👁️ Live preview with console capture
- ✨ Generate in New Tab
- 📋 Copy / 💾 Download / 🗑️ Clear
- 📄 Template snippets (including multi-file)
- 🌓 Dark / Light mode
- ⌨️ **Ctrl+Enter** → Generate in new tab, **Ctrl+S** → Save

## Quick Start

1. Open `index.html` in a browser
2. That's it — no server needed

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Enter | Generate in new tab |
| Ctrl+S | Save project |
| Ctrl+Enter (in AI prompt) | Send AI prompt |

## AI Setup

1. Click **⚙️ Settings** → choose **Provider** → enter **API Key**
2. Click **🤖** to open the AI panel
3. Type a prompt → click **🚀 Generate Code**
4. Click **📋 Use in Editor** to load the code

### Local Models

**LM Studio:** Start the local server (default `http://localhost:1234`), no API key needed.

**Ollama:** Start Ollama, then set `OLLAMA_ORIGINS=*` and restart. No API key needed.

## File Structure

