/**
 * HTML Code Preview — Main Application Logic (Multi-File)
 */

// ─── DOM REFERENCES ───────────────────────────────────
var codeInput       = document.getElementById('codeInput');
var generateBtn     = document.getElementById('generateBtn');
var copyBtn         = document.getElementById('copyBtn');
var downloadBtn     = document.getElementById('downloadBtn');
var downloadZipBtn  = document.getElementById('downloadZipBtn');
var clearBtn        = document.getElementById('clearBtn');
var templateSelect  = document.getElementById('templateSelect');
var themeToggle     = document.getElementById('themeToggle');
var previewFrame    = document.getElementById('previewFrame');
var refreshPreview  = document.getElementById('refreshPreview');
var statusMsg       = document.getElementById('statusMsg');
var toastEl         = document.getElementById('toast');

// File explorer
var fileList        = document.getElementById('fileList');
var newFileBtn      = document.getElementById('newFileBtn');
var newFileInput    = document.getElementById('newFileInput');
var newFileName     = document.getElementById('newFileName');
var newFileConfirm  = document.getElementById('newFileConfirm');
var newFileCancel   = document.getElementById('newFileCancel');
var renameFileInput = document.getElementById('renameFileInput');
var renameFileName  = document.getElementById('renameFileName');
var renameFileConfirm = document.getElementById('renameFileConfirm');
var renameFileCancel  = document.getElementById('renameFileCancel');
var openFolderBtn   = document.getElementById('openFolderBtn');
var openFilesBtn    = document.getElementById('openFilesBtn');
var fileInputHidden = document.getElementById('fileInputHidden');
var folderInputHidden = document.getElementById('folderInputHidden');
var tabBar          = document.getElementById('tabBar');

// AI panel
var aiToggle        = document.getElementById('aiToggle');
var aiPanel         = document.getElementById('aiPanel');
var aiMessages      = document.getElementById('aiMessages');
var aiPrompt        = document.getElementById('aiPrompt');
var aiGenerateBtn   = document.getElementById('aiGenerateBtn');
var providerBadge   = document.getElementById('providerBadge');
var aiIncludeContext = document.getElementById('aiIncludeContext');

// Console
var consoleOutput   = document.getElementById('consoleOutput');
var clearConsoleBtn = document.getElementById('clearConsoleBtn');
var toggleConsoleBtn = document.getElementById('toggleConsoleBtn');
var consolePanel    = document.getElementById('consolePanel');

// Settings modal
var settingsBtn     = document.getElementById('settingsBtn');
var settingsModal   = document.getElementById('settingsModal');
var settingsClose   = document.getElementById('settingsClose');
var settingsSave    = document.getElementById('settingsSave');
var settingsReset   = document.getElementById('settingsReset');
var providerSelect  = document.getElementById('providerSelect');
var apiKeyInput     = document.getElementById('apiKeyInput');
var toggleKeyVis    = document.getElementById('toggleKeyVis');

// Drop overlay
var dropOverlay     = document.getElementById('dropOverlay');

// ─── EDITOR INIT ───────────────────────────────────────
var editor;
var usingCodeMirror = false;
var renamingFile = null;
var collapsedGroups = {};

try {
  if (typeof CodeMirror !== 'undefined') {
    editor = CodeMirror.fromTextArea(codeInput, {
      mode: 'htmlmixed',
      theme: 'dracula',
      lineNumbers: true,
      lineWrapping: true,
      tabSize: 2,
      indentWithTabs: false,
      matchBrackets: true,
      autoCloseTags: true,
      autoCloseBrackets: true
    });
    usingCodeMirror = true;
  } else {
    throw new Error('CodeMirror not loaded');
  }
} catch (err) {
  console.warn('CodeMirror fallback:', err.message);
  editor = {
    getValue: function() { return codeInput.value; },
    setValue: function(v) { codeInput.value = v; },
    setOption: function() {},
    on: function() {}
  };
  codeInput.style.cssText = 'display:block;width:100%;height:100%;font-family:Consolas,monospace;font-size:14px;background:#1e293b;color:#f8fafc;border:none;padding:1rem;resize:none;';
}

// ─── TOAST ──────────────────────────────────────────────
var toastTimer = null;
function showToast(msg, dur) {
  dur = dur || 2500;
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { toastEl.classList.remove('show'); }, dur);
}

function setStatus(msg) {
  statusMsg.textContent = msg;
  if (msg) setTimeout(function() { statusMsg.textContent = ''; }, 4000);
}

// ═══════════════════════════════════════════════════════
//   CONSOLE CAPTURE
// ═══════════════════════════════════════════════════════

function addConsoleLine(method, args) {
  var div = document.createElement('div');
  div.className = 'console-line console-' + method;
  div.textContent = method.toUpperCase() + ': ' + args.join(' ');
  consoleOutput.appendChild(div);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function clearConsole() {
  consoleOutput.innerHTML = '<div class="console-line console-info">Console cleared.</div>';
}

window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'console') {
    addConsoleLine(e.data.method, e.data.args || []);
  }
});

clearConsoleBtn.addEventListener('click', clearConsole);
toggleConsoleBtn.addEventListener('click', function() {
  consolePanel.classList.toggle('collapsed');
  var btn = toggleConsoleBtn;
  btn.textContent = consolePanel.classList.contains('collapsed') ? '▲' : '▼';
});

// ═══════════════════════════════════════════════════════
//   FILE EXPLORER & TABS
// ═══════════════════════════════════════════════════════

var saveDebounce = null;

function groupFilesByType(filenames) {
  var groupOrder = ['html', 'css', 'js', 'data', 'other'];
  var groupLabels = {
    'html':  '🌐 HTML',
    'css':   '🎨 CSS',
    'js':    '⚡ JavaScript',
    'data':  '📋 Data',
    'other': '📄 Other'
  };
  var groupExtMap = {
    'html': ['html', 'htm'],
    'css':  ['css'],
    'js':   ['js'],
    'data': ['json', 'xml']
  };

  var fileGroups = {};
  for (var i = 0; i < filenames.length; i++) {
    var name = filenames[i];
    var ext = name.split('.').pop().toLowerCase();
    var groupKey = 'other';
    for (var gk in groupExtMap) {
      if (groupExtMap[gk].indexOf(ext) !== -1) {
        groupKey = gk;
        break;
      }
    }
    if (!fileGroups[groupKey]) fileGroups[groupKey] = [];
    fileGroups[groupKey].push(name);
  }

  var result = [];
  for (var j = 0; j < groupOrder.length; j++) {
    var key = groupOrder[j];
    if (fileGroups[key]) {
      result.push({ key: key, label: groupLabels[key], files: fileGroups[key] });
    }
  }
  return result;
}

function renderFileList() {
  fileList.innerHTML = '';
  var filenames = Object.keys(project.files);
  filenames.sort();

  if (filenames.length === 0) {
    fileList.innerHTML = '<div style="padding:0.5rem;color:var(--text-muted);font-size:0.78rem;">No files</div>';
    return;
  }

  var groups = groupFilesByType(filenames);

  for (var g = 0; g < groups.length; g++) {
    var group = groups[g];

    var header = document.createElement('div');
    header.className = 'file-group-header' + (collapsedGroups[group.key] ? ' collapsed' : '');
    header.setAttribute('data-group', group.key);
    header.innerHTML = '<span class="collapse-icon">▼</span> ' +
                       '<span class="group-label">' + group.label + '</span>' +
                       '<span class="group-count">(' + group.files.length + ')</span>';
    header.addEventListener('click', (function(gk) {
      return function() {
        var itemsEl = document.getElementById('group-items-' + gk);
        if (itemsEl) {
          itemsEl.classList.toggle('collapsed');
          this.classList.toggle('collapsed');
          collapsedGroups[gk] = itemsEl.classList.contains('collapsed');
        }
      };
    })(group.key));
    fileList.appendChild(header);

    var itemsDiv = document.createElement('div');
    itemsDiv.className = 'file-group-items' + (collapsedGroups[group.key] ? ' collapsed' : '');
    itemsDiv.id = 'group-items-' + group.key;

    for (var i = 0; i < group.files.length; i++) {
      var name = group.files[i];
      var div = document.createElement('div');
      div.className = 'file-item' + (name === project.activeFile ? ' active' : '');
      div.setAttribute('data-file', name);

      var icon = document.createElement('span');
      icon.className = 'file-icon';
      icon.textContent = getFileIcon(name);

      var label = document.createElement('span');
      label.className = 'file-name';
      label.textContent = name;

      var actions = document.createElement('span');
      actions.className = 'file-actions';

      var renameBtn = document.createElement('button');
      renameBtn.textContent = '✏️';
      renameBtn.title = 'Rename';
      renameBtn.addEventListener('click', (function(fn) {
        return function(e) {
          e.stopPropagation();
          startRename(fn);
        };
      })(name));

      var delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.title = 'Delete';
      delBtn.className = 'delete-btn';
      delBtn.addEventListener('click', (function(fn) {
        return function(e) {
          e.stopPropagation();
          if (confirm('Delete "' + fn + '"?')) {
            deleteFile(fn);
            renderFileList();
            renderTabs();
            loadActiveFile();
            updatePreview();
            showToast('🗑️ Deleted ' + fn);
          }
        };
      })(name));

      actions.appendChild(renameBtn);
      actions.appendChild(delBtn);

      div.appendChild(icon);
      div.appendChild(label);
      div.appendChild(actions);

      div.addEventListener('click', (function(fn) {
        return function() {
          openFile(fn);
          renderFileList();
          renderTabs();
          loadActiveFile();
        };
      })(name));

      itemsDiv.appendChild(div);
    }

    fileList.appendChild(itemsDiv);
  }
}

function renderTabs() {
  tabBar.innerHTML = '';
  for (var i = 0; i < project.openTabs.length; i++) {
    var name = project.openTabs[i];
    var tab = document.createElement('div');
    tab.className = 'tab' + (name === project.activeFile ? ' active' : '');
    tab.setAttribute('data-tab', name);

    var icon = document.createElement('span');
    icon.className = 'tab-icon';
    icon.textContent = getFileIcon(name);

    var label = document.createElement('span');
    label.textContent = name;

    var close = document.createElement('button');
    close.className = 'tab-close';
    close.textContent = '✕';
    close.title = 'Close tab';
    close.addEventListener('click', (function(fn) {
      return function(e) {
        e.stopPropagation();
        closeTab(fn);
        renderFileList();
        renderTabs();
        loadActiveFile();
      };
    })(name));

    tab.appendChild(icon);
    tab.appendChild(label);
    tab.appendChild(close);

    tab.addEventListener('click', (function(fn) {
      return function() {
        openFile(fn);
        renderFileList();
        renderTabs();
        loadActiveFile();
      };
    })(name));

    tabBar.appendChild(tab);
  }
}

function loadActiveFile() {
  var content = getFileContent(project.activeFile);
  editor.setValue(content);
  if (usingCodeMirror) {
    var mode = getFileMode(project.activeFile);
    editor.setOption('mode', mode);
  }
  setStatus(project.activeFile);
  saveProject();
}

function saveCurrentFile() {
  var content = editor.getValue();
  setFileContent(project.activeFile, content);
}

function debouncedSave() {
  clearTimeout(saveDebounce);
  saveDebounce = setTimeout(function() {
    saveCurrentFile();
    saveProject();
  }, 500);
}

// ─── New File ──────────────────────────────────────────

function showNewFileInput() {
  newFileInput.style.display = 'flex';
  newFileName.value = '';
  newFileName.focus();
}

function hideNewFileInput() {
  newFileInput.style.display = 'none';
}

function createNewFile() {
  var name = newFileName.value.trim();
  if (!name) { showToast('⚠️ Please enter a filename'); return; }
  if (project.files[name]) { showToast('⚠️ File already exists'); return; }
  createFile(name, '');
  openFile(name);
  renderFileList();
  renderTabs();
  loadActiveFile();
  hideNewFileInput();
  showToast('📄 Created ' + name);
}

newFileBtn.addEventListener('click', showNewFileInput);
newFileConfirm.addEventListener('click', createNewFile);
newFileCancel.addEventListener('click', hideNewFileInput);
newFileName.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') createNewFile();
  if (e.key === 'Escape') hideNewFileInput();
});

// ─── Rename File ────────────────────────────────────────

function startRename(oldName) {
  renamingFile = oldName;
  renameFileName.value = oldName;
  renameFileInput.style.display = 'flex';
  renameFileName.focus();
  renameFileName.select();
}

function hideRenameInput() {
  renameFileInput.style.display = 'none';
  renamingFile = null;
}

function confirmRename() {
  var newName = renameFileName.value.trim();
  if (!newName) { showToast('⚠️ Please enter a name'); return; }
  if (!renameFile(renamingFile, newName)) {
    showToast('⚠️ Could not rename (name exists?)');
    return;
  }
  hideRenameInput();
  renderFileList();
  renderTabs();
  loadActiveFile();
  showToast('✏️ Renamed to ' + newName);
}

renameFileConfirm.addEventListener('click', confirmRename);
renameFileCancel.addEventListener('click', hideRenameInput);
renameFileName.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') confirmRename();
  if (e.key === 'Escape') hideRenameInput();
});

// ─── Open Folder (File System Access API) ──────────────

async function openFolder() {
  if ('showDirectoryPicker' in window) {
    try {
      var dirHandle = await window.showDirectoryPicker();
      var count = 0;
      for await (var entry of dirHandle.values()) {
        if (entry.kind === 'file') {
          try {
            var file = await entry.getFile();
            var ext = entry.name.split('.').pop().toLowerCase();
            var textExts = ['html','htm','css','js','json','xml','md','txt','svg','yaml','yml','toml','conf','cfg','ini','sh','bat','py','rb','php','java','c','cpp','h','ts','tsx','jsx','vue','svelte'];
            if (textExts.indexOf(ext) !== -1 || ext === entry.name) {
              var content = await file.text();
              project.files[entry.name] = { content: content, language: getFileMode(entry.name) };
              count++;
            }
          } catch (err) {
            console.warn('Skipping file:', entry.name, err);
          }
        }
      }
      if (count === 0) {
        showToast('⚠️ No text files found in folder');
        return;
      }
      project.openTabs = [Object.keys(project.files)[0]];
      project.activeFile = project.openTabs[0];
      saveProject();
      renderFileList();
      renderTabs();
      loadActiveFile();
      updatePreview();
      showToast('📁 Loaded ' + count + ' file(s) from folder');
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err);
        showToast('❌ Error opening folder: ' + err.message);
      }
    }
  } else {
    folderInputHidden.click();
  }
}

openFolderBtn.addEventListener('click', openFolder);

folderInputHidden.addEventListener('change', function() {
  var files = this.files;
  if (!files || files.length === 0) return;
  var count = 0;
  var processed = 0;
  for (var i = 0; i < files.length; i++) {
    (function(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        project.files[file.name] = { content: e.target.result, language: getFileMode(file.name) };
        count++;
        processed++;
        if (processed === files.length) {
          project.openTabs = [Object.keys(project.files)[0]];
          project.activeFile = project.openTabs[0];
          saveProject();
          renderFileList();
          renderTabs();
          loadActiveFile();
          updatePreview();
          showToast('📁 Loaded ' + count + ' file(s)');
        }
      };
      reader.readAsText(file);
    })(files[i]);
  }
  this.value = '';
});

// ─── Open Files ────────────────────────────────────────

function openFiles() {
  fileInputHidden.click();
}

openFilesBtn.addEventListener('click', openFiles);

fileInputHidden.addEventListener('change', function() {
  var files = this.files;
  if (!files || files.length === 0) return;
  var count = 0;
  var processed = 0;
  for (var i = 0; i < files.length; i++) {
    (function(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        project.files[file.name] = { content: e.target.result, language: getFileMode(file.name) };
        count++;
        processed++;
        if (processed === files.length) {
          project.activeFile = file.name;
          if (project.openTabs.indexOf(file.name) === -1) {
            project.openTabs.push(file.name);
          }
          saveProject();
          renderFileList();
          renderTabs();
          loadActiveFile();
          updatePreview();
          showToast('📄 Loaded ' + count + ' file(s)');
        }
      };
      reader.readAsText(file);
    })(files[i]);
  }
  this.value = '';
});

// ─── Drag & Drop ──────────────────────────────────────

var dragCounter = 0;

document.addEventListener('dragenter', function(e) {
  e.preventDefault();
  dragCounter++;
  dropOverlay.classList.add('visible');
});

document.addEventListener('dragleave', function(e) {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    dropOverlay.classList.remove('visible');
  }
});

document.addEventListener('dragover', function(e) {
  e.preventDefault();
});

document.addEventListener('drop', function(e) {
  e.preventDefault();
  dragCounter = 0;
  dropOverlay.classList.remove('visible');
  var files = e.dataTransfer.files;
  if (!files || files.length === 0) return;
  var count = 0;
  var processed = 0;
  for (var i = 0; i < files.length; i++) {
    (function(file) {
      var reader = new FileReader();
      reader.onload = function(ev) {
        project.files[file.name] = { content: ev.target.result, language: getFileMode(file.name) };
        count++;
        processed++;
        if (processed === files.length) {
          project.activeFile = file.name;
          if (project.openTabs.indexOf(file.name) === -1) {
            project.openTabs.push(file.name);
          }
          saveProject();
          renderFileList();
          renderTabs();
          loadActiveFile();
          updatePreview();
          showToast('📄 Dropped ' + count + ' file(s)');
        }
      };
      reader.readAsText(file);
    })(files[i]);
  }
});

// ═══════════════════════════════════════════════════════
//   LIVE PREVIEW
// ═══════════════════════════════════════════════════════

var previewDebounce = null;

function updatePreview() {
  saveCurrentFile();
  var composedHTML = composePreview();
  if (!composedHTML.trim()) {
    previewFrame.srcdoc = '<html><body style="background:#fff;color:#999;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><p>No HTML file found</p></body></html>';
    return;
  }
  var blob = new Blob([composedHTML], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  previewFrame.onload = function() { URL.revokeObjectURL(url); };
  previewFrame.src = url;
}

function debouncedPreview() {
  clearTimeout(previewDebounce);
  previewDebounce = setTimeout(updatePreview, 400);
}

// ═══════════════════════════════════════════════════════
//   GENERATE / COPY / DOWNLOAD / CLEAR
// ═══════════════════════════════════════════════════════

function generateInNewTab() {
  saveCurrentFile();
  var composedHTML = composePreview();
  if (!composedHTML.trim()) { showToast('⚠️ No HTML to preview!'); return; }
  var blob = new Blob([composedHTML], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var newTab = window.open(url, '_blank');
  if (!newTab) { showToast('🚫 Pop-up blocked!'); }
  else { showToast('✅ Opened in new tab!'); setStatus('Opened in new tab'); }
  setTimeout(function() { URL.revokeObjectURL(url); }, 10000);
}

function copyCode() {
  var content = editor.getValue();
  if (!content.trim()) { showToast('⚠️ Nothing to copy!'); return; }
  navigator.clipboard.writeText(content).then(function() {
    showToast('📋 Copied ' + project.activeFile + '!');
  }).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = content;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('📋 Copied!');
  });
}

function downloadCode() {
  var content = editor.getValue().trim();
  if (!content) { showToast('⚠️ Nothing to download!'); return; }
  var blob = new Blob([content], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = project.activeFile || 'preview.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('💾 Downloaded ' + project.activeFile);
}

function downloadZip() {
  if (typeof JSZip === 'undefined') {
    showToast('⚠️ JSZip not loaded — check internet connection');
    return;
  }
  saveCurrentFile();
  var zip = new JSZip();
  for (var name in project.files) {
    zip.file(name, project.files[name].content);
  }
  zip.generateAsync({ type: 'blob' }).then(function(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'project.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📦 Downloaded project.zip');
  });
}

function clearEditor() {
  if (editor.getValue().trim() && !confirm('Clear ' + project.activeFile + '?')) return;
  editor.setValue('');
  saveCurrentFile();
  saveProject();
  updatePreview();
  showToast('🗑️ Cleared ' + project.activeFile);
}

// ═══════════════════════════════════════════════════════
//   TEMPLATE LOADER
// ═══════════════════════════════════════════════════════

function loadTemplate(key) {
  if (!key || typeof TEMPLATES === 'undefined') return;
  var tpl = TEMPLATES[key];
  if (!tpl) return;
  loadTemplateProject(tpl);
  renderFileList();
  renderTabs();
  loadActiveFile();
  updatePreview();
  showToast('📄 Loaded "' + key + '" template');
}

// ═══════════════════════════════════════════════════════
//   THEME
// ═══════════════════════════════════════════════════════

function toggleTheme() {
  var html = document.documentElement;
  var next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  html.setAttribute('data-theme', next);
  if (usingCodeMirror) editor.setOption('theme', next === 'light' ? 'default' : 'dracula');
  localStorage.setItem('theme', next);
}

function loadSavedTheme() {
  var saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    if (usingCodeMirror) editor.setOption('theme', saved === 'light' ? 'default' : 'dracula');
  }
}

// ═══════════════════════════════════════════════════════
//   AI PANEL LOGIC
// ═══════════════════════════════════════════════════════

var conversationHistory = [];

function resetConversation() {
  var settings = getSettings();
  conversationHistory = [];
  if (settings.systemPrompt) {
    conversationHistory.push({ role: 'system', content: settings.systemPrompt });
  }
}

resetConversation();

function toggleAIPanel() {
  aiPanel.classList.toggle('visible');
  if (aiPanel.classList.contains('visible')) {
    setTimeout(function() { aiPrompt.focus(); }, 100);
  }
}

function updateProviderBadge() {
  if (typeof AI_PROVIDERS === 'undefined') return;
  var settings = getSettings();
  var provider = AI_PROVIDERS[settings.provider];
  if (provider) {
    providerBadge.textContent = provider.label;
    providerBadge.style.display = 'inline-block';
  } else {
    providerBadge.textContent = 'No provider';
  }
}

function addChatMessage(role, content) {
  var welcome = aiMessages.querySelector('.ai-welcome');
  if (welcome) welcome.remove();

  var div = document.createElement('div');
  div.className = 'ai-message ' + role;

  if (role === 'assistant') {
    var extractedCode = extractHTML(content);
    var hasCodeBlock = content.indexOf('```') !== -1;

    if (hasCodeBlock) {
      var preview = content.length > 300 ? content.substring(0, 300) + '…' : content;
      div.textContent = preview;

      var btn = document.createElement('button');
      btn.className = 'use-in-editor-btn';
      btn.textContent = '📋 Use in Editor';
      btn.title = 'Copy the generated HTML into the editor panel';
      btn.setAttribute('data-code', extractedCode);
      btn.addEventListener('click', function() { useInEditor(this.getAttribute('data-code')); });
      div.appendChild(btn);
    } else {
      div.textContent = content;
    }
  } else if (role === 'error') {
    div.textContent = content;
  } else {
    div.textContent = content;
  }

  aiMessages.appendChild(div);
  aiMessages.scrollTop = aiMessages.scrollHeight;
  return div;
}

function useInEditor(htmlCode) {
  editor.setValue(htmlCode);
  saveCurrentFile();
  saveProject();
  updatePreview();
  showToast('📋 Code loaded into editor!');
  setStatus('AI code loaded into ' + project.activeFile);
}

function addLoadingIndicator() {
  var div = document.createElement('div');
  div.className = 'ai-loading';
  div.id = 'aiLoading';
  div.innerHTML = '<div class="spinner"></div> Generating code...';
  aiMessages.appendChild(div);
  aiMessages.scrollTop = aiMessages.scrollHeight;
}

function removeLoadingIndicator() {
  var el = document.getElementById('aiLoading');
  if (el) el.remove();
}

// ─── Build code context from current project files ─────

function buildCodeContext() {
  var MAX_FILE_CHARS = 8000;
  var hasContent = false;

  for (var name in project.files) {
    if (project.files[name].content.trim()) { hasContent = true; break; }
  }

  if (!hasContent) return '';

  var lines = ['[Current project files. Active file: ' + project.activeFile + ']'];
  var filenames = Object.keys(project.files).sort();

  for (var i = 0; i < filenames.length; i++) {
    var fname = filenames[i];
    var content = project.files[fname].content;
    if (content.trim()) {
      var marker = fname === project.activeFile ? ' (active)' : '';
      lines.push('');
      lines.push('--- ' + fname + marker + ' ---');
      if (content.length > MAX_FILE_CHARS) {
        lines.push(content.substring(0, MAX_FILE_CHARS));
        lines.push('... (truncated, ' + content.length + ' total chars)');
      } else {
        lines.push(content);
      }
      lines.push('--- end ' + fname + ' ---');
    }
  }

  return lines.join('\n');
}

// ─── Build API messages with code context ──────────────

function buildMessagesWithCodeContext(history, codeContext) {
  var messages = [];

  for (var i = 0; i < history.length; i++) {
    var msg = history[i];
    if (msg.role === 'user' && i === history.length - 1 && codeContext) {
      messages.push({ role: 'user', content: codeContext + '\n\n' + msg.content });
    } else {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  return messages;
}

var isGenerating = false;

async function aiGenerate() {
  if (isGenerating) return;
  var prompt = aiPrompt.value.trim();
  if (!prompt) { showToast('⚠️ Please enter a prompt!'); return; }
  if (typeof AI_PROVIDERS === 'undefined') { showToast('⚠️ AI providers not loaded'); return; }

  var settings = getSettings();
  var provider = AI_PROVIDERS[settings.provider];
  if (!provider) { showToast('⚠️ No AI provider configured'); return; }
  if (!settings.apiKey && settings.provider !== 'lmstudio' && settings.provider !== 'ollama') {
    showToast('⚠️ API key required — open ⚙️ Settings');
    return;
  }

  if (conversationHistory.length <= 1) resetConversation();

  // Save current editor content before building context
  saveCurrentFile();

  // Build code context from current project (if enabled)
  var includeContext = aiIncludeContext ? aiIncludeContext.checked : true;
  var codeContext = includeContext ? buildCodeContext() : '';

  // Store clean user message in conversation history
  conversationHistory.push({ role: 'user', content: prompt });
  addChatMessage('user', prompt);
  aiPrompt.value = '';

  // Build messages for API call, injecting code context into the latest user message
  var messagesForAPI = buildMessagesWithCodeContext(conversationHistory, codeContext);

  isGenerating = true;
  aiGenerateBtn.disabled = true;
  aiGenerateBtn.textContent = '⏳ Generating...';
  addLoadingIndicator();

  try {
    var responseText = await provider.call(settings, messagesForAPI);
    conversationHistory.push({ role: 'assistant', content: responseText });
    removeLoadingIndicator();
    addChatMessage('assistant', responseText);
  } catch (err) {
    removeLoadingIndicator();
    addChatMessage('error', '❌ Error: ' + err.message);
    showToast('❌ AI request failed');
    console.error('AI call failed:', err);
  } finally {
    isGenerating = false;
    aiGenerateBtn.disabled = false;
    aiGenerateBtn.textContent = '🚀 Generate Code';
  }
}

// ═══════════════════════════════════════════════════════
//   SETTINGS MODAL
// ═══════════════════════════════════════════════════════

function openSettings() { populateSettingsForm(); settingsModal.classList.add('visible'); }
function closeSettings() { settingsModal.classList.remove('visible'); }

function handleSettingsSave() {
  var s = readSettingsForm();
  saveSettings(s);
  resetConversation();
  updateProviderBadge();
  closeSettings();
  showToast('💾 Settings saved!');
}

function handleSettingsReset() {
  if (!confirm('Reset all settings to defaults?')) return;
  localStorage.removeItem(SETTINGS_KEY);
  populateSettingsForm();
  resetConversation();
  updateProviderBadge();
  showToast('🔄 Settings reset');
}

function toggleKeyVisibility() {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
}

// ═══════════════════════════════════════════════════════
//   EVENT LISTENERS
// ═══════════════════════════════════════════════════════

generateBtn.addEventListener('click', generateInNewTab);
copyBtn.addEventListener('click', copyCode);
downloadBtn.addEventListener('click', downloadCode);
downloadZipBtn.addEventListener('click', downloadZip);
clearBtn.addEventListener('click', clearEditor);
themeToggle.addEventListener('click', toggleTheme);
refreshPreview.addEventListener('click', updatePreview);

templateSelect.addEventListener('change', function(e) {
  loadTemplate(e.target.value);
  e.target.value = '';
});

if (usingCodeMirror) {
  editor.on('change', function() {
    debouncedSave();
    debouncedPreview();
  });
} else {
  codeInput.addEventListener('input', function() {
    debouncedSave();
    debouncedPreview();
  });
}

document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    generateInNewTab();
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveCurrentFile();
    saveProject();
    showToast('💾 Saved');
  }
});

aiToggle.addEventListener('click', toggleAIPanel);
aiGenerateBtn.addEventListener('click', aiGenerate);
aiPrompt.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); aiGenerate(); }
});

settingsBtn.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);
settingsSave.addEventListener('click', handleSettingsSave);
settingsReset.addEventListener('click', handleSettingsReset);
toggleKeyVis.addEventListener('click', toggleKeyVisibility);
settingsModal.addEventListener('click', function(e) { if (e.target === settingsModal) closeSettings(); });
providerSelect.addEventListener('change', function(e) { updateSettingsHints(e.target.value); });

// ═══════════════════════════════════════════════════════
//   INIT
// ═══════════════════════════════════════════════════════

var projectLoaded = loadProject();
if (!projectLoaded || Object.keys(project.files).length === 0) {
  if (typeof TEMPLATES !== 'undefined' && TEMPLATES.blank) {
    loadTemplateProject(TEMPLATES.blank);
  }
}

loadSavedTheme();
renderFileList();
renderTabs();
loadActiveFile();
updateProviderBadge();

setTimeout(updatePreview, 200);

console.log('✅ HTML Code Preview (multi-file) initialized');
console.log('📂 Project files:', Object.keys(project.files).join(', '));
console.log('📄 Active file:', project.activeFile);
