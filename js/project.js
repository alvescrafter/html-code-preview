/**
 * Project / Multi-File System
 *
 * Manages a virtual filesystem of project files,
 * stored in localStorage for persistence.
 */

var PROJECT_KEY = 'html_preview_project_v2';

// ─── File type icon & language mapping ────────────────

var FILE_ICONS = {
  'html': '🌐',
  'htm':  '🌐',
  'css':  '🎨',
  'js':   '⚡',
  'json': '📋',
  'xml':  '📄',
  'md':   '📝',
  'txt':  '📄'
};

var FILE_MODES = {
  'html': 'htmlmixed',
  'htm':  'htmlmixed',
  'css':  'css',
  'js':   'javascript',
  'json': { name: 'javascript', json: true },
  'xml':  'xml',
  'md':   'markdown',
  'txt':  'text'
};

function getFileIcon(filename) {
  var ext = filename.split('.').pop().toLowerCase();
  return FILE_ICONS[ext] || '📄';
}

function getFileMode(filename) {
  var ext = filename.split('.').pop().toLowerCase();
  return FILE_MODES[ext] || 'htmlmixed';
}

// ─── Project Data Model ───────────────────────────────

var project = {
  files: {
    'index.html': { content: '', language: 'htmlmixed' }
  },
  openTabs: ['index.html'],
  activeFile: 'index.html'
};

function loadProject() {
  try {
    var raw = localStorage.getItem(PROJECT_KEY);
    if (raw) {
      var data = JSON.parse(raw);
      if (data && data.files && Object.keys(data.files).length > 0) {
        project = data;
        return true;
      }
    }
  } catch (e) {
    console.warn('Failed to load project:', e);
  }
  return false;
}

function saveProject() {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(project));
  } catch (e) {
    console.warn('Failed to save project:', e);
  }
}

// ─── File Operations ──────────────────────────────────

function createFile(filename, content) {
  if (!filename) return false;
  filename = filename.trim();
  if (project.files[filename]) {
    return false; // already exists
  }
  project.files[filename] = {
    content: content || '',
    language: getFileMode(filename)
  };
  saveProject();
  return true;
}

function deleteFile(filename) {
  if (!project.files[filename]) return false;
  if (Object.keys(project.files).length <= 1) {
    return false; // can't delete the last file
  }
  delete project.files[filename];

  // Remove from open tabs
  var tabIdx = project.openTabs.indexOf(filename);
  if (tabIdx !== -1) {
    project.openTabs.splice(tabIdx, 1);
  }

  // If it was the active file, switch to first available tab
  if (project.activeFile === filename) {
    if (project.openTabs.length > 0) {
      project.activeFile = project.openTabs[0];
    } else {
      var first = Object.keys(project.files)[0];
      project.activeFile = first;
      project.openTabs = [first];
    }
  }

  saveProject();
  return true;
}

function renameFile(oldName, newName) {
  newName = newName.trim();
  if (!newName || oldName === newName) return false;
  if (project.files[newName]) return false; // name already taken
  if (!project.files[oldName]) return false;

  // Copy file data with new language
  project.files[newName] = {
    content: project.files[oldName].content,
    language: getFileMode(newName)
  };
  delete project.files[oldName];

  // Update tabs
  var tabIdx = project.openTabs.indexOf(oldName);
  if (tabIdx !== -1) {
    project.openTabs[tabIdx] = newName;
  }

  // Update active file
  if (project.activeFile === oldName) {
    project.activeFile = newName;
  }

  saveProject();
  return true;
}

function openFile(filename) {
  if (!project.files[filename]) return;
  if (project.openTabs.indexOf(filename) === -1) {
    project.openTabs.push(filename);
  }
  project.activeFile = filename;
  saveProject();
}

function closeTab(filename) {
  var tabIdx = project.openTabs.indexOf(filename);
  if (tabIdx === -1) return;

  project.openTabs.splice(tabIdx, 1);

  // If we closed the active tab, switch to an adjacent one
  if (project.activeFile === filename) {
    if (project.openTabs.length > 0) {
      var newIdx = Math.min(tabIdx, project.openTabs.length - 1);
      project.activeFile = project.openTabs[newIdx];
    } else {
      // No tabs open — open first file
      var first = Object.keys(project.files)[0];
      project.activeFile = first;
      project.openTabs = [first];
    }
  }
  saveProject();
}

function getFileContent(filename) {
  if (!project.files[filename]) return '';
  return project.files[filename].content;
}

function setFileContent(filename, content) {
  if (!project.files[filename]) return;
  project.files[filename].content = content;
  // Note: saveProject is called by the debounced save, not here
}

// ─── Smart Preview Composition ────────────────────────
// Inlines linked CSS/JS files from the project into the HTML

function composePreview() {
  // Find the main HTML file
  var htmlFile = null;
  var htmlContent = '';

  // Prefer index.html, then any .html file, then the active file
  if (project.files['index.html']) {
    htmlFile = 'index.html';
  } else {
    for (var name in project.files) {
      if (name.endsWith('.html') || name.endsWith('.htm')) {
        htmlFile = name;
        break;
      }
    }
  }

  if (!htmlFile) {
    // No HTML file — use the active file
    htmlFile = project.activeFile;
  }

  htmlContent = project.files[htmlFile] ? project.files[htmlFile].content : '';

  if (!htmlContent.trim()) return '';

  // Replace <link rel="stylesheet" href="...">
  htmlContent = htmlContent.replace(/<link\s+[^>]*href=["']([^"']+)["'][^>]*>/gi, function(match, href) {
    var filename = href.split('/').pop();
    if (project.files[filename]) {
      return '<style>\n' + project.files[filename].content + '\n</style>';
    }
    return match;
  });

  // Replace <script src="..."></script>
  htmlContent = htmlContent.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*>\s*<\/script>/gi, function(match, src) {
    var filename = src.split('/').pop();
    if (project.files[filename]) {
      return '<script>\n' + project.files[filename].content + '\n<\/script>';
    }
    return match;
  });

  // Inject console capture script
  var consoleScript = '<script>\n' +
    '(function(){\n' +
    '  var orig={log:console.log,warn:console.warn,error:console.error,info:console.info};\n' +
    '  function send(m,a){\n' +
    '    try{parent.postMessage({type:"console",method:m,args:Array.from(a).map(function(x){\n' +
    '      try{return typeof x==="object"?JSON.stringify(x,null,2):String(x)}catch(e){return String(x)}\n' +
    '    })},"*")}catch(e){}\n' +
    '  }\n' +
    '  ["log","warn","error","info"].forEach(function(m){\n' +
    '    console[m]=function(){orig[m].apply(console,arguments);send(m,arguments)}\n' +
    '  });\n' +
    '  window.addEventListener("error",function(e){\n' +
    '    send("error",["Uncaught "+e.message+" (line "+e.lineno+")"]);\n' +
    '  });\n' +
    '})();\n' +
    '<\/script>';

  // Insert console script right after <head> or at the beginning
  if (htmlContent.indexOf('<head>') !== -1) {
    htmlContent = htmlContent.replace('<head>', '<head>' + consoleScript);
  } else if (htmlContent.indexOf('<html') !== -1) {
    htmlContent = htmlContent.replace(/<html[^>]*>/, function(m) { return m + consoleScript; });
  } else {
    htmlContent = consoleScript + htmlContent;
  }

  return htmlContent;
}

// ─── Find the main HTML file name ─────────────────────

function getMainHtmlFile() {
  if (project.files['index.html']) return 'index.html';
  for (var name in project.files) {
    if (name.endsWith('.html') || name.endsWith('.htm')) return name;
  }
  return project.activeFile;
}

// ─── Load a template into the project ─────────────────

function loadTemplateProject(templateData) {
  // templateData is an object: { 'filename.html': 'content', ... }
  project.files = {};
  project.openTabs = [];
  project.activeFile = '';

  for (var filename in templateData) {
    project.files[filename] = {
      content: templateData[filename],
      language: getFileMode(filename)
    };
  }

  // Set active file to index.html or first file
  if (project.files['index.html']) {
    project.activeFile = 'index.html';
  } else {
    project.activeFile = Object.keys(project.files)[0];
  }
  project.openTabs = [project.activeFile];

  saveProject();
}
