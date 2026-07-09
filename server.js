const express = require('express');
const { stmts } = require('./database');
const { encrypt, decrypt } = require('./crypto');
const { layout, list, card, modalForm, form, reveal, closeModal, escapeHtml } = require('./views/templates');

let _lineQueue = [];
let _lineResolve = null;

function _initStdin() {
  if (!process.stdin.isTTY) {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      buf += chunk;
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (_lineResolve) {
          _lineResolve(line);
          _lineResolve = null;
        } else {
          _lineQueue.push(line);
        }
      }
    });
  }
}

function _getLine() {
  return new Promise((resolve) => {
    if (_lineQueue.length > 0) {
      resolve(_lineQueue.shift());
    } else {
      _lineResolve = resolve;
    }
  });
}

function promptHidden(question) {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      process.stdout.write(question);
      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;
      stdin.setRawMode(true);
      stdin.resume();
      let input = '';
      stdin.on('data', (chunk) => {
        const char = chunk.toString();
        if (char === '\r' || char === '\n') {
          stdin.setRawMode(wasRaw || false);
          stdin.pause();
          process.stdout.write('\n');
          resolve(input);
        } else if (char === '\x7f' || char === '\b') {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        } else if (char === '\x03') {
          process.stdout.write('\n');
          process.exit(0);
        } else {
          input += char;
          process.stdout.write('*');
        }
      });
    } else {
      process.stdout.write(question);
      _getLine().then(resolve);
    }
  });
}

async function main() {
  let masterPassword = process.env.MASTER_PASSWORD;

  if (masterPassword) {
    console.log('  Using MASTER_PASSWORD from environment.\n');
  } else {
    _initStdin();
    console.log('');
    masterPassword = await promptHidden('  Master password: ');

    if (!masterPassword) {
      console.error('Master password is required.');
      process.exit(1);
    }

    const confirm = await promptHidden('  Confirm password: ');

    if (masterPassword !== confirm) {
      console.error('Passwords do not match.');
      process.exit(1);
    }
  }

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.urlencoded({ extended: true }));

  app.get('/', (_req, res) => {
    const passwords = stmts.all.all();
    res.send(layout(list(passwords)));
  });

  app.get('/passwords', (req, res) => {
    const q = (req.query.q || '').trim();
    let passwords;
    if (q) {
      const like = `%${q}%`;
      passwords = stmts.search.all(like, like, like);
    } else {
      passwords = stmts.all.all();
    }
    res.send(list(passwords, q));
  });

  app.get('/passwords/cancel-form', (_req, res) => {
    res.send('<div id="modal" hx-swap-oob="innerHTML"></div>');
  });

  app.get('/passwords/new', (_req, res) => {
    res.send(modalForm());
  });

  app.post('/passwords', (req, res) => {
    const { service, username, password, url, notes } = req.body;
    if (!service || !username || !password) {
      res.status(400).send('<div class="bg-slate-900 border border-red-500/30 rounded-2xl p-6 text-center text-red-400 text-sm">All fields are required.</div>');
      return;
    }
    const encrypted = encrypt(password, masterPassword);
    stmts.insert.run(service.trim(), username.trim(), encrypted, (url || '').trim(), (notes || '').trim());
    const passwords = stmts.all.all();
    res.send(closeModal(passwords));
  });

  app.get('/passwords/:id/reveal', (req, res) => {
    const entry = stmts.getById.get(req.params.id);
    if (!entry) return res.status(404).send('Not found');
    try {
      const decrypted = decrypt(entry.password_encrypted, masterPassword);
      res.send(reveal(decrypted));
    } catch {
      res.status(500).send('<span class="revealed-password"><code>Decrypt failed</code></span>');
    }
  });

  app.get('/passwords/:id/edit', (req, res) => {
    const entry = stmts.getById.get(req.params.id);
    if (!entry) return res.status(404).send('Not found');
    res.send(form(entry));
  });

  app.get('/passwords/:id/card', (req, res) => {
    const entry = stmts.getById.get(req.params.id);
    if (!entry) return res.status(404).send('Not found');
    res.send(card(entry));
  });

  app.put('/passwords/:id', (req, res) => {
    const { service, username, password, url, notes } = req.body;
    const existing = stmts.getById.get(req.params.id);
    if (!existing) return res.status(404).send('Not found');

    if (password && password.trim()) {
      const encrypted = encrypt(password.trim(), masterPassword);
      stmts.update.run(
        (service || existing.service).trim(),
        (username || existing.username).trim(),
        encrypted,
        (url || '').trim(),
        (notes || '').trim(),
        req.params.id
      );
    } else {
      stmts.updateNoPwd.run(
        (service || existing.service).trim(),
        (username || existing.username).trim(),
        (url || '').trim(),
        (notes || '').trim(),
        req.params.id
      );
    }
    const updated = stmts.getById.get(req.params.id);
    res.send(card(updated));
  });

  app.delete('/passwords/:id', (req, res) => {
    stmts.delete.run(req.params.id);
    res.send('');
  });

  app.listen(PORT, () => {
    console.log(`\n  PassManager running at http://localhost:${PORT}\n`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
