/**
 * AI Provider Adapters
 *
 * Supported: OpenAI, LM Studio, Ollama, Claude, Gemini
 */

var AI_PROVIDERS = {

  openai: {
    label: 'OpenAI',
    defaults: { baseUrl: 'https://api.openai.com', model: 'gpt-4o' },
    call: async function(settings, messages) {
      var url = rtrim(settings.baseUrl, '/') + '/v1/chat/completions';
      var headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + settings.apiKey };
      var body = { model: settings.model, messages: messages, temperature: 0.7, max_tokens: 8192 };
      var resp = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
      var data = await resp.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.choices[0].message.content;
    }
  },

  lmstudio: {
    label: 'LM Studio',
    defaults: { baseUrl: 'http://localhost:1234', model: 'default' },
    call: async function(settings, messages) {
      var url = rtrim(settings.baseUrl, '/') + '/v1/chat/completions';
      var headers = { 'Content-Type': 'application/json' };
      if (settings.apiKey) headers['Authorization'] = 'Bearer ' + settings.apiKey;
      var body = { model: settings.model, messages: messages, temperature: 0.7, max_tokens: 8192 };
      var resp = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
      var data = await resp.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.choices[0].message.content;
    }
  },

  ollama: {
    label: 'Ollama',
    defaults: { baseUrl: 'http://localhost:11434', model: 'llama3' },
    call: async function(settings, messages) {
      var url = rtrim(settings.baseUrl, '/') + '/api/chat';
      var headers = { 'Content-Type': 'application/json' };
      var body = { model: settings.model, messages: messages, stream: false };
      var resp = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
      var data = await resp.json();
      if (data.error) throw new Error(data.error);
      return data.message.content;
    }
  },

  claude: {
    label: 'Claude',
    defaults: { baseUrl: 'https://api.anthropic.com', model: 'claude-sonnet-4-20250514' },
    call: async function(settings, messages) {
      var url = rtrim(settings.baseUrl, '/') + '/v1/messages';
      var systemPrompt = '';
      var filteredMessages = messages.filter(function(m) {
        if (m.role === 'system') { systemPrompt = m.content; return false; }
        return true;
      });
      var headers = {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      };
      var body = { model: settings.model, max_tokens: 8192, messages: filteredMessages };
      if (systemPrompt) body.system = systemPrompt;
      var resp = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
      var data = await resp.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.content[0].text;
    }
  },

  gemini: {
    label: 'Gemini',
    defaults: { baseUrl: 'https://generativelanguage.googleapis.com', model: 'gemini-2.0-flash' },
    call: async function(settings, messages) {
      var url = rtrim(settings.baseUrl, '/') + '/v1beta/models/' + settings.model + ':generateContent?key=' + settings.apiKey;
      var systemInstruction = null;
      var contents = [];
      for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        if (msg.role === 'system') {
          systemInstruction = { parts: [{ text: msg.content }] };
        } else {
          contents.push({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] });
        }
      }
      var body = { contents: contents };
      if (systemInstruction) body.systemInstruction = systemInstruction;
      var headers = { 'Content-Type': 'application/json' };
      var resp = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body) });
      var data = await resp.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      return data.candidates[0].content.parts[0].text;
    }
  }
};

function rtrim(str, chars) {
  return str.replace(new RegExp('[' + chars + ']+$'), '');
}

function extractHTML(responseText) {
  var htmlMatch = responseText.match(/```html\s*\n([\s\S]*?)```/i);
  if (htmlMatch) return htmlMatch[1].trim();
  var anyMatch = responseText.match(/```\s*\n([\s\S]*?)```/);
  if (anyMatch) {
    var code = anyMatch[1].trim();
    if (code.charAt(0) === '<' || code.toLowerCase().indexOf('<!doctype') === 0) return code;
  }
  return responseText.trim();
}
