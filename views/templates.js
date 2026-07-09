function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function layout(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PassManager</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          animation: {
            'fade-in': 'fadeIn 0.25s ease-out',
            'slide-down': 'slideDown 0.2s ease-out',
            'modal-in': 'modalIn 0.2s ease-out',
          },
          keyframes: {
            fadeIn: {
              '0%': { opacity: '0', transform: 'translateY(6px)' },
              '100%': { opacity: '1', transform: 'translateY(0)' },
            },
            slideDown: {
              '0%': { opacity: '0', transform: 'translateY(-10px)' },
              '100%': { opacity: '1', transform: 'translateY(0)' },
            },
            modalIn: {
              '0%': { opacity: '0', transform: 'scale(0.95) translateY(-10px)' },
              '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
            },
          },
        },
      },
    }
  </script>
  <script src="https://cdn.jsdelivr.net/npm/htmx.org@2.0.10/dist/htmx.min.js"
          integrity="sha384-H5SrcfygHmAuTDZphMHqBJLc3FhssKjG7w/CeCpFReSfwBWDTKpkzPP8c+cLsK+V"
          crossorigin="anonymous"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .htmx-request { pointer-events: none; opacity: 0.6; }
    .htmx-swapping { opacity: 0; transition: opacity 0.2s; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen antialiased">
  <div id="modal"></div>
  <div class="max-w-5xl mx-auto px-5 py-6 sm:py-8 pb-16">
    <header class="mb-8">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <h1 class="flex items-center gap-3 text-2xl font-bold tracking-tight text-slate-100">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-indigo-500 shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          PassManager
        </h1>
        <button class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors active:scale-95"
                hx-get="/passwords/new"
                hx-target="#modal"
                hx-swap="innerHTML">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add New
        </button>
      </div>
    </header>
    ${content}
  </div>
</body>
</html>`;
}

function list(passwords, query) {
  const q = escapeHtml(query || '');
  const cards = passwords.length
    ? passwords.map(p => card(p)).join('')
    : `<div class="col-span-full flex flex-col items-center gap-4 py-16 text-slate-600">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-40">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p class="text-sm">No passwords found</p>
      </div>`;

  return `
    <div class="mb-6">
      <div class="relative max-w-md">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input type="search"
               name="q"
               placeholder="Search passwords..."
               value="${q}"
               hx-get="/passwords"
               hx-trigger="keyup changed delay:250ms"
               hx-target="#password-grid"
               hx-swap="innerHTML"
               autofocus
               class="w-full pl-10 pr-4 py-3 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-xl text-slate-100 text-sm placeholder:text-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-colors">
      </div>
    </div>
    <div id="password-grid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      ${cards}
    </div>
  `;
}

function card(p) {
  const initial = (p.service || '?')[0].toUpperCase();
  return `
    <div class="group bg-slate-900/80 backdrop-blur border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all hover:shadow-lg hover:shadow-black/30 animate-fade-in"
         id="card-${p.id}">
      <div class="flex items-start gap-3 mb-4">
        <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 select-none">
          ${escapeHtml(initial)}
        </div>
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-sm truncate text-slate-100">${escapeHtml(p.service)}</div>
          <div class="text-xs text-slate-400 truncate">${escapeHtml(p.username)}</div>
          ${p.url ? `<div class="text-xs text-slate-600 truncate mt-0.5">${escapeHtml(p.url)}</div>` : ''}
        </div>
        <div class="shrink-0 pl-2" id="pwd-${p.id}">
          <span class="text-slate-600 tracking-widest text-xs select-none">&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;</span>
        </div>
      </div>
      <div class="flex gap-1 justify-end">
        <button class="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
                title="Reveal"
                hx-get="/passwords/${p.id}/reveal"
                hx-target="#pwd-${p.id}"
                hx-swap="innerHTML">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
                title="Edit"
                hx-get="/passwords/${p.id}/edit"
                hx-target="#card-${p.id}"
                hx-swap="outerHTML">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete"
                hx-delete="/passwords/${p.id}"
                hx-target="#card-${p.id}"
                hx-swap="delete"
                hx-confirm="Delete ${escapeHtml(p.service)}?">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>`;
}

function modalForm(pass) {
  const isEdit = !!pass;
  const method = isEdit ? 'hx-put' : 'hx-post';
  const url = isEdit ? `/passwords/${pass.id}` : '/passwords';
  const service = escapeHtml(pass ? pass.service : '');
  const username = escapeHtml(pass ? pass.username : '');
  const passUrl = escapeHtml(pass ? (pass.url || '') : '');
  const notes = escapeHtml(pass ? (pass.notes || '') : '');

  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
         id="modal-overlay">
      <div class="absolute inset-0 bg-black/60 backdrop-blur-sm"
           onclick="document.getElementById('modal').innerHTML=''"></div>
      <div class="relative z-10 w-full max-w-md animate-modal-in">
        <div class="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-lg font-semibold text-slate-100">${isEdit ? 'Edit Password' : 'New Password'}</h2>
            <button class="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
                    onclick="document.getElementById('modal').innerHTML=''">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <form ${method}="${url}"
                hx-target="#modal"
                hx-swap="innerHTML">
            <div class="flex flex-col gap-4 mb-5">
              <div class="flex flex-col gap-1.5">
                <label for="modal-service" class="text-xs font-medium text-slate-400 uppercase tracking-wider">Service</label>
                <input type="text" id="modal-service" name="service" value="${service}" placeholder="e.g. GitHub" required
                       class="px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors">
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="modal-username" class="text-xs font-medium text-slate-400 uppercase tracking-wider">Username / Email</label>
                <input type="text" id="modal-username" name="username" value="${username}" placeholder="e.g. john@example.com" required
                       class="px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors">
              </div>
              <div class="flex flex-col gap-1.5">
                <label for="modal-password" class="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
                <input type="text" id="modal-password" name="password" placeholder="${isEdit ? 'Leave blank to keep current' : 'Enter password'}"
                       ${isEdit ? '' : 'required'}
                       class="px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors">
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="flex flex-col gap-1.5">
                  <label for="modal-url" class="text-xs font-medium text-slate-400 uppercase tracking-wider">URL</label>
                  <input type="text" id="modal-url" name="url" value="${passUrl}" placeholder="https://..."
                         class="px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors">
                </div>
                <div class="flex flex-col gap-1.5">
                  <label for="modal-notes" class="text-xs font-medium text-slate-400 uppercase tracking-wider">Notes</label>
                  <input type="text" id="modal-notes" name="notes" value="${notes}" placeholder="Optional"
                         class="px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors">
                </div>
              </div>
            </div>
            <div class="flex gap-2 justify-end">
              <button type="button"
                      class="px-5 py-2.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 text-sm font-medium rounded-lg transition-colors"
                      onclick="document.getElementById('modal').innerHTML=''">Cancel</button>
              <button type="submit" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors active:scale-95">
                ${isEdit ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
}

function form(pass) {
  const isEdit = !!pass;
  const method = isEdit ? 'hx-put' : 'hx-post';
  const url = isEdit ? `/passwords/${pass.id}` : '/passwords';
  const service = escapeHtml(pass ? pass.service : '');
  const username = escapeHtml(pass ? pass.username : '');
  const passUrl = escapeHtml(pass ? (pass.url || '') : '');
  const notes = escapeHtml(pass ? (pass.notes || '') : '');
  const cancelUrl = isEdit ? `/passwords/${pass.id}/card` : '/passwords/cancel-form';

  const formId = isEdit ? 'card-' + pass.id : 'card-new';

  return `
    <div class="bg-slate-900/80 backdrop-blur border border-indigo-500/30 rounded-xl p-6 shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/10 animate-slide-down"
         id="${formId}">
      <form ${method}="${url}"
            hx-target="${isEdit ? '#' + formId : '#password-grid'}"
            hx-swap="${isEdit ? 'outerHTML' : 'afterbegin'}">
        <div class="flex flex-col gap-4 mb-5">
          <div class="flex flex-col gap-1.5">
            <label for="service" class="text-xs font-medium text-slate-400 uppercase tracking-wider">Service</label>
            <input type="text" id="service" name="service" value="${service}" placeholder="e.g. GitHub" required
                   class="px-3.5 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors">
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="username" class="text-xs font-medium text-slate-400 uppercase tracking-wider">Username / Email</label>
            <input type="text" id="username" name="username" value="${username}" placeholder="e.g. john@example.com" required
                   class="px-3.5 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors">
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="password" class="text-xs font-medium text-slate-400 uppercase tracking-wider">Password</label>
            <input type="text" id="password" name="password" placeholder="${isEdit ? 'Leave blank to keep current' : 'Enter password'}"
                   ${isEdit ? '' : 'required'}
                   class="px-3.5 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="flex flex-col gap-1.5">
              <label for="url" class="text-xs font-medium text-slate-400 uppercase tracking-wider">URL</label>
              <input type="text" id="url" name="url" value="${passUrl}" placeholder="https://..."
                     class="px-3.5 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors">
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="notes" class="text-xs font-medium text-slate-400 uppercase tracking-wider">Notes</label>
              <input type="text" id="notes" name="notes" value="${notes}" placeholder="Optional"
                     class="px-3.5 py-2.5 bg-slate-950/50 border border-slate-700 rounded-lg text-slate-100 text-sm placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors">
            </div>
          </div>
        </div>
        <div class="flex gap-2 justify-end">
          <button type="submit" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors active:scale-95">
            ${isEdit ? 'Update' : 'Save'}
          </button>
          <button type="button"
                  class="px-5 py-2.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 text-sm font-medium rounded-lg transition-colors"
                  hx-get="${cancelUrl}"
                  hx-target="${isEdit ? '#' + formId : '#card-new'}"
                  hx-swap="delete">Cancel</button>
        </div>
      </form>
    </div>`;
}

function reveal(password) {
  return `
    <span class="inline-flex items-center gap-1.5">
      <code class="bg-slate-950/60 px-2 py-0.5 rounded text-xs text-cyan-300 max-w-[140px] truncate">${escapeHtml(password)}</code>
      <button class="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors"
              title="Copy"
              onclick="navigator.clipboard.writeText('${escapeHtml(password).replace(/'/g, "\\'")}')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
        </svg>
      </button>
    </span>`;
}

function closeModal(passwords) {
  const cards = passwords.map(p => card(p)).join('');
  return (
    `<div id="modal" hx-swap-oob="innerHTML"></div>\n` +
    `<div id="password-grid" hx-swap-oob="innerHTML">${cards || ''}</div>`
  );
}

module.exports = { layout, list, card, modalForm, form, reveal, closeModal, escapeHtml };
