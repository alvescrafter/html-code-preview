/**
 * Settings Management
 */

var SETTINGS_KEY = 'html_preview_settings';

var PROVIDER_DEFAULTS = {
  openai:   { baseUrl: 'https://api.openai.com',                    model: 'gpt-4o' },
  lmstudio: { baseUrl: 'http://localhost:1234',                    model: 'default' },
  ollama:   { baseUrl: 'http://localhost:11434',                    model: 'llama3' },
  claude:   { baseUrl: 'https://api.anthropic.com',                 model: 'claude-sonnet-4-20250514' },
  gemini:   { baseUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-2.0-flash' }
};

var DEFAULT_SYSTEM_PROMPT = 'You are an expert HTML/CSS/JS developer. When the user asks for code, respond with ONLY a complete, standalone HTML file. Wrap the code in a single ```html code block. Do not include any other explanation outside the code block unless the user specifically asks for it.';

function loadSettings() {
  try {
    var raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { console.warn('Failed to load settings:', e); }
  return {
    provider: 'openai',
    apiKey: '',
    baseUrl: PROVIDER_DEFAULTS.openai.baseUrl,
    model: PROVIDER_DEFAULTS.openai.model,
    systemPrompt: DEFAULT_SYSTEM_PROMPT
  };
}

function saveSettings(settings) {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
  catch (e) { console.warn('Failed to save settings:', e); }
}

function getSettings() { return loadSettings(); }

function populateSettingsForm() {
  var s = loadSettings();
  document.getElementById('providerSelect').value = s.provider;
  document.getElementById('apiKeyInput').value    = s.apiKey || '';
  document.getElementById('baseUrlInput').value   = s.baseUrl;
  document.getElementById('modelInput').value      = s.model;
  document.getElementById('systemPromptInput').value = s.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  updateSettingsHints(s.provider);
}

function readSettingsForm() {
  return {
    provider:     document.getElementById('providerSelect').value,
    apiKey:       document.getElementById('apiKeyInput').value.trim(),
    baseUrl:      document.getElementById('baseUrlInput').value.trim(),
    model:        document.getElementById('modelInput').value.trim(),
    systemPrompt: document.getElementById('systemPromptInput').value.trim()
  };
}

function updateSettingsHints(provider) {
  var defs = PROVIDER_DEFAULTS[provider] || {};
  var baseUrlInput = document.getElementById('baseUrlInput');
  var modelInput   = document.getElementById('modelInput');
  var apiKeyHint   = document.getElementById('apiKeyHint');

  var isDefaultUrl = false, isDefaultModel = false;
  for (var key in PROVIDER_DEFAULTS) {
    if (PROVIDER_DEFAULTS[key].baseUrl === baseUrlInput.value) isDefaultUrl = true;
    if (PROVIDER_DEFAULTS[key].model === modelInput.value) isDefaultModel = true;
  }
  if (!baseUrlInput.value || isDefaultUrl) baseUrlInput.value = defs.baseUrl || '';
  if (!modelInput.value || isDefaultModel) modelInput.value = defs.model || '';

  if (provider === 'lmstudio' || provider === 'ollama') {
    apiKeyHint.textContent = 'Not required for local servers. Leave blank.';
  } else {
    apiKeyHint.textContent = 'Required. Get your key from the provider dashboard.';
  }
}
