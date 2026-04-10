/**
 * Settings Management
 */

var SETTINGS_KEY = 'html_preview_settings_v2';
var LEGACY_SETTINGS_KEY = 'html_preview_settings';
var SESSION_SETTINGS_KEY = 'html_preview_session_settings_v1';

var PROVIDER_DEFAULTS = {
  openai:   { baseUrl: 'https://api.openai.com', model: 'gpt-4o' },
  lmstudio: { baseUrl: 'http://localhost:1234', model: 'default' },
  ollama:   { baseUrl: 'http://localhost:11434', model: 'llama3' },
  claude:   { baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-20250514' },
  gemini:   { baseUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-2.0-flash' }
};

var DEFAULT_SYSTEM_PROMPT = 'You are an expert HTML/CSS/JS developer. When the user asks for code, respond with ONLY a complete, standalone HTML file. Wrap the code in a single ```html code block. Do not include any other explanation outside the code block unless the user specifically asks for it.';

function getDefaultSettings() {
  return {
    provider: 'openai',
    apiKey: '',
    baseUrl: PROVIDER_DEFAULTS.openai.baseUrl,
    model: PROVIDER_DEFAULTS.openai.model,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    includeProjectContext: false
  };
}

function readStoredJSON(storage, key) {
  try {
    var raw = storage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load settings from storage:', e);
  }
  return null;
}

function writeStoredJSON(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Failed to save settings to storage:', e);
  }
}

function getPersistentSettings(settings) {
  return {
    provider: settings.provider,
    baseUrl: settings.baseUrl,
    model: settings.model,
    systemPrompt: settings.systemPrompt,
    includeProjectContext: !!settings.includeProjectContext
  };
}

function migrateLegacySettings() {
  var legacy = readStoredJSON(localStorage, LEGACY_SETTINGS_KEY);
  if (!legacy) return null;

  if (legacy.apiKey) {
    writeStoredJSON(sessionStorage, SESSION_SETTINGS_KEY, { apiKey: legacy.apiKey });
  }

  var migrated = getDefaultSettings();
  for (var key in legacy) {
    if (key !== 'apiKey') {
      migrated[key] = legacy[key];
    }
  }
  migrated.includeProjectContext = !!migrated.includeProjectContext;

  writeStoredJSON(localStorage, SETTINGS_KEY, getPersistentSettings(migrated));
  try {
    localStorage.removeItem(LEGACY_SETTINGS_KEY);
  } catch (e) {
    console.warn('Failed to remove legacy settings:', e);
  }

  return migrated;
}

function loadSettings() {
  var defaults = getDefaultSettings();
  var stored = readStoredJSON(localStorage, SETTINGS_KEY);
  var sessionSettings = readStoredJSON(sessionStorage, SESSION_SETTINGS_KEY) || {};
  var merged = {};
  var key;

  if (!stored) {
    stored = migrateLegacySettings();
  }

  for (key in defaults) merged[key] = defaults[key];
  if (stored) {
    for (key in stored) merged[key] = stored[key];
  }
  if (sessionSettings.apiKey) {
    merged.apiKey = sessionSettings.apiKey;
  }

  merged.includeProjectContext = !!merged.includeProjectContext;
  return merged;
}

function saveSettings(settings) {
  writeStoredJSON(localStorage, SETTINGS_KEY, getPersistentSettings(settings));
  writeStoredJSON(sessionStorage, SESSION_SETTINGS_KEY, { apiKey: settings.apiKey || '' });

  try {
    localStorage.removeItem(LEGACY_SETTINGS_KEY);
  } catch (e) {
    console.warn('Failed to clean up legacy settings:', e);
  }
}

function getSettings() { return loadSettings(); }

function resetSettings() {
  try {
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(LEGACY_SETTINGS_KEY);
    sessionStorage.removeItem(SESSION_SETTINGS_KEY);
  } catch (e) {
    console.warn('Failed to reset settings:', e);
  }
}

function populateSettingsForm() {
  var s = loadSettings();
  document.getElementById('providerSelect').value = s.provider;
  document.getElementById('apiKeyInput').value = s.apiKey || '';
  document.getElementById('baseUrlInput').value = s.baseUrl;
  document.getElementById('modelInput').value = s.model;
  document.getElementById('systemPromptInput').value = s.systemPrompt || DEFAULT_SYSTEM_PROMPT;
  updateSettingsHints(s.provider);
}

function readSettingsForm() {
  var current = loadSettings();
  return {
    provider: document.getElementById('providerSelect').value,
    apiKey: document.getElementById('apiKeyInput').value.trim(),
    baseUrl: document.getElementById('baseUrlInput').value.trim(),
    model: document.getElementById('modelInput').value.trim(),
    systemPrompt: document.getElementById('systemPromptInput').value.trim(),
    includeProjectContext: !!current.includeProjectContext
  };
}

function updateSettingsHints(provider) {
  var defs = PROVIDER_DEFAULTS[provider] || {};
  var baseUrlInput = document.getElementById('baseUrlInput');
  var modelInput = document.getElementById('modelInput');
  var apiKeyHint = document.getElementById('apiKeyHint');

  var isDefaultUrl = false;
  var isDefaultModel = false;
  for (var key in PROVIDER_DEFAULTS) {
    if (PROVIDER_DEFAULTS[key].baseUrl === baseUrlInput.value) isDefaultUrl = true;
    if (PROVIDER_DEFAULTS[key].model === modelInput.value) isDefaultModel = true;
  }
  if (!baseUrlInput.value || isDefaultUrl) baseUrlInput.value = defs.baseUrl || '';
  if (!modelInput.value || isDefaultModel) modelInput.value = defs.model || '';

  if (provider === 'lmstudio' || provider === 'ollama') {
    apiKeyHint.textContent = 'Not required for local servers. Any key entered is stored for this tab only.';
  } else {
    apiKeyHint.textContent = 'Required. Stored for this browser tab only; it is not persisted across sessions.';
  }
}

function setIncludeProjectContextPreference(enabled) {
  var settings = loadSettings();
  settings.includeProjectContext = !!enabled;
  saveSettings(settings);
}
