import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { pathToFileURL } from 'node:url';

export function renderHomePage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>VEDA Runtime Version 1</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #16211f;
      --muted: #51605c;
      --line: #cad6d1;
      --paper: #f7faf8;
      --panel: #ffffff;
      --green: #0d6b57;
      --red: #9d3d2b;
      --gold: #8b640f;
      --blue: #244f7a;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: var(--paper);
      color: var(--ink);
    }
    header {
      border-bottom: 1px solid var(--line);
      background: #ffffff;
    }
    .wrap {
      width: min(1120px, calc(100% - 32px));
      margin: 0 auto;
    }
    .topbar {
      min-height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .brand {
      font-weight: 760;
      font-size: 18px;
    }
    .schema {
      color: var(--muted);
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 13px;
    }
    main {
      padding: 44px 0 64px;
    }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
      gap: 32px;
      align-items: start;
    }
    h1 {
      margin: 0;
      font-size: clamp(34px, 5vw, 60px);
      line-height: 1;
      letter-spacing: 0;
      max-width: 720px;
    }
    .lead {
      margin: 20px 0 0;
      color: var(--muted);
      font-size: 18px;
      line-height: 1.55;
      max-width: 720px;
    }
    .proof {
      margin-top: 28px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }
    .metric {
      border-top: 3px solid var(--green);
      background: var(--panel);
      padding: 14px;
      min-height: 88px;
    }
    .metric:nth-child(2) { border-top-color: var(--gold); }
    .metric:nth-child(3) { border-top-color: var(--blue); }
    .metric strong {
      display: block;
      font-size: 20px;
    }
    .metric span {
      color: var(--muted);
      font-size: 13px;
    }
    .lanes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .lane {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 20px;
    }
    .lane h2 {
      margin: 0 0 10px;
      font-size: 22px;
      letter-spacing: 0;
    }
    .lane.free h2 { color: var(--green); }
    .lane.paid h2 { color: var(--red); }
    ul {
      margin: 0;
      padding-left: 18px;
      color: var(--muted);
      line-height: 1.7;
      font-size: 14px;
    }
    .actions {
      margin-top: 28px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    button, a.button {
      border: 1px solid var(--ink);
      background: var(--ink);
      color: #fff;
      border-radius: 6px;
      min-height: 40px;
      padding: 0 14px;
      font: inherit;
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
    }
    button.secondary, a.button.secondary {
      background: transparent;
      color: var(--ink);
    }
    pre {
      margin: 18px 0 0;
      background: #101816;
      color: #d6eee4;
      border-radius: 8px;
      padding: 16px;
      overflow: auto;
      min-height: 120px;
      font-size: 13px;
    }
    @media (max-width: 820px) {
      .hero, .lanes, .proof { grid-template-columns: 1fr; }
      main { padding-top: 28px; }
      .topbar { align-items: flex-start; flex-direction: column; justify-content: center; padding: 14px 0; }
    }
  </style>
</head>
<body>
  <header>
    <div class="wrap topbar">
      <div class="brand">VEDA Runtime Version 1</div>
      <div class="schema">HANDOFF_JSON v6.1.1</div>
    </div>
  </header>
  <main class="wrap">
    <section class="hero">
      <div>
        <h1>Governed AI execution with rollback and audit proof.</h1>
        <p class="lead">A standalone runtime extracted from VEDA OS infrastructure. The first release proves one local workflow before paid Supabase automation is enabled.</p>
        <div class="proof">
          <div class="metric"><strong>Version 1</strong><span>Product version</span></div>
          <div class="metric"><strong>Local first</strong><span>Free proof path</span></div>
          <div class="metric"><strong>Paid ready</strong><span>Feature gated</span></div>
        </div>
        <div class="actions">
          <button id="runProof">Run Free Proof</button>
          <button class="secondary" id="loadStatus">Load Status</button>
        </div>
        <pre id="output">API target: http://localhost:3100</pre>
      </div>
      <div class="lanes">
        <article class="lane free">
          <h2>Free</h2>
          <ul>
            <li>Local runtime proof</li>
            <li>JSONL nonce and audit ledger</li>
            <li>Context Governor</li>
            <li>Rollback Engine</li>
            <li>Sandbox shell policy</li>
          </ul>
        </article>
        <article class="lane paid">
          <h2>Paid</h2>
          <ul>
            <li>Supabase audit and nonce adapters</li>
            <li>Pipeline log wiring</li>
            <li>API and web status page</li>
            <li>Audit proof bundle export</li>
            <li>VEDA OS bridge adapter</li>
          </ul>
        </article>
      </div>
    </section>
  </main>
  <script>
    const output = document.getElementById('output');
    async function show(path, options) {
      try {
        const res = await fetch('http://localhost:3100' + path, options);
        output.textContent = JSON.stringify(await res.json(), null, 2);
      } catch (error) {
        output.textContent = 'API unavailable. Start it with: npm run start -w @veda-runtime-v1/api';
      }
    }
    document.getElementById('runProof').addEventListener('click', () => show('/api/demo/free', { method: 'POST' }));
    document.getElementById('loadStatus').addEventListener('click', () => show('/api/status'));
  </script>
</body>
</html>`;
}

export function createWebServer() {
  return createServer((request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? '/', 'http://localhost');
    if (url.pathname === '/' || url.pathname === '/index.html') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(renderHomePage());
      return;
    }
    if (url.pathname === '/health') {
      response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify({ ok: true }));
      return;
    }
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 3101);
  createWebServer().listen(port, () => {
    console.log(`VEDA Runtime Version 1 web listening on http://localhost:${port}`);
  });
}
