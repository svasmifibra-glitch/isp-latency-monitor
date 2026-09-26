// App JavaScript for ISP Latency & Egress Monitor

let ws = null;
let currentMetrics = [];

// Service Icons mapping (Inline SVGs or clean Emojis for reliability)
const serviceIcons = {
  google: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/></svg>',
  cloudflare: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#F38020" d="M16.5 10.5c-.3-1.8-1.9-3.2-3.8-3.2-1.5 0-2.8.9-3.4 2.1-.4-.2-.9-.3-1.4-.3-1.7 0-3.1 1.4-3.1 3.1 0 .2 0 .4.1.6-1.7.3-2.9 1.8-2.9 3.5 0 2 1.6 3.6 3.6 3.6h11c2.2 0 4-1.8 4-4 0-2.1-1.6-3.8-3.7-3.9z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#25D366" d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#E4405F" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#000000" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.82.57-1.34 1.54-1.35 2.54-.01 1.05.51 2.08 1.37 2.65.9.59 2.08.68 3.05.24.96-.42 1.63-1.33 1.74-2.37.04-1.89.02-3.79.03-5.68V.02z"/></svg>',
  twitter: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#000000" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#FF0000" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
  steam: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#171a21" d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.524-4.524 4.524h-.105l-4.076 2.911c.002.046.006.092.006.139 0 1.876-1.52 3.396-3.396 3.396-1.637 0-3.007-1.162-3.328-2.713L.412 15.34C1.944 20.35 6.551 24 11.979 24c6.627 0 12-5.373 12-12s-5.373-12-12-12z"/></svg>',
  playstation: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#003791" d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-3.642 17.502c-1.396.34-2.614.182-3.129-.444-.616-.749-.12-2.146 1.109-3.118 1.229-.972 2.671-1.378 3.287-.629.539.657.199 1.838-.971 2.871l-.296.32zm.178-5.302l2.368-1.895v4.542c-.085-.027-.17-.058-.255-.094-1.026-.431-1.621-1.221-1.465-1.927l-.648-.626zm7.808 3.856c-1.229.972-2.671 1.378-3.287.629-.539-.657-.199-1.838.971-2.871l.296-.32 1.396-.34c1.396-.34 2.614-.182 3.129.444.616.749.12 2.146-1.109 3.118z"/></svg>',
  xbox: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#107C41" d="M11.996 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.996 0zm-3.62 3.864c1.192.748 2.457 1.84 3.624 3.25 1.167-1.41 2.432-2.502 3.624-3.25 1.554 1.127 2.923 2.534 4.015 4.148-1.57 1.76-3.797 4.142-6.19 6.837 2.607 3.327 4.966 6.136 6.438 8.046a11.927 11.927 0 0 1-4.717 2.766c-1.748-2.684-4.04-6.194-6.794-10.222-2.754 4.028-5.046 7.538-6.794 10.222a11.927 11.927 0 0 1-4.717-2.766c1.472-1.91 3.831-4.719 6.438-8.046C4.93 12.154 2.703 9.772 1.133 8.012A11.94 11.94 0 0 1 5.148 3.864z"/></svg>',
  twitch: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#9146FF" d="M11.571 1.429L1.429 4.286v14.285h4.285v4.286l4.286-4.286h3.571l7.143-7.143V1.429H11.571zm8.571 9.286l-2.857 2.857h-4.286l-2.857 2.857v-2.857H6.429V3.571h13.713v7.144zM16.429 6.5h-2.143v4.286h2.143V6.5zm-5 0H9.286v4.286h2.143V6.5z"/></svg>',
  riotgames: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#D32929" d="M12 0L1.75 6v12L12 24l10.25-6V6L12 0zm0 2.8l7.5 4.39v8.78L12 20.36 4.5 15.97V7.19L12 2.8z"/></svg>',
  roblox: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#000000" d="M18.8 0L0 5.2 5.2 24 24 18.8 18.8 0zm-6.6 14.8l-3-1 1-3 3 1-1 3z"/></svg>'
};

// Connect to WebSockets
function initWebSocket() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${location.host}`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    document.getElementById('liveStatusText').innerText = 'Conectado en vivo';
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'METRICS_UPDATE') {
        currentMetrics = msg.data;
        renderCards(currentMetrics);
        updateLastTime(msg.timestamp);
      }
    } catch (e) {
      console.error('Error parsing WS message:', e);
    }
  };

  ws.onclose = () => {
    document.getElementById('liveStatusText').innerText = 'Reconectando...';
    setTimeout(initWebSocket, 3000);
  };
}

// Fallback REST polling if needed
function fetchMetrics() {
  fetch('/api/metrics')
    .then(res => res.json())
    .then(data => {
      if (data.metrics) {
        currentMetrics = data.metrics;
        renderCards(currentMetrics);
        updateLastTime(data.timestamp);
      }
    });
}

function updateLastTime(timestampStr) {
  const date = new Date(timestampStr);
  document.getElementById('lastUpdateTime').innerText = `Última sincro: ${date.toLocaleTimeString()}`;
}

// Render cards into grid
function renderCards(metrics) {
  const container = document.getElementById('cardsGrid');
  if (!container) return;

  container.innerHTML = '';

  // Update header WAN public IP and LAN IP indicator if available
  if (metrics.length > 0) {
    const first = metrics[0];
    const headerIpElem = document.getElementById('outboundIpText');
    if (headerIpElem) {
      headerIpElem.innerHTML = `🌐 <strong>IP Pública (WAN):</strong> ${first.publicIp || 'Detectando...'} <span style="opacity:0.75; font-weight:normal; margin-left:6px;">(LAN: ${first.localIp})</span>`;
    }
  }

  metrics.forEach(target => {
    const iconSvg = serviceIcons[target.icon] || '🌐';

    const card = document.createElement('div');
    card.className = 'service-card';

    const isOnline = target.online;
    const statusClass = isOnline ? 'online-pill' : 'offline-pill';
    const statusText = isOnline ? 'ONLINE' : 'OFFLINE';

    // Color logic: Green (<50ms), Orange (50-120ms), Red (>120ms or offline)
    let pingColorClass = 'ping-low';
    if (!isOnline || target.pingMs > 120) {
      pingColorClass = 'ping-high';
    } else if (target.pingMs >= 50) {
      pingColorClass = 'ping-med';
    }

    card.innerHTML = `
      <div>
        <div class="card-header">
          <div class="service-title">
            <div class="service-icon">${iconSvg}</div>
            <div>
              <span class="service-name">${target.name}</span>
              <div class="local-ip-badge" title="IP Pública WAN (Salida Internacional)">WAN: ${target.publicIp || 'Detectando...'}</div>
              <div style="font-size: 9px; color: #64748b; font-weight: 600; margin-top: 2px;">Target: ${target.host}</div>
            </div>
          </div>
          <span class="protocol-badge">${target.protocol}</span>
        </div>

        <div class="status-row">
          <div class="estado-box">
            <span class="label">Estado</span>
            <span class="${statusClass}">${statusText}</span>
          </div>

          <div class="ping-box ${pingColorClass}">
            <span class="label">PING</span>
            <div class="ping-value">${target.pingMs.toFixed(1)} <span class="ping-unit">ms</span></div>
            <div class="loss-box">
              <span class="loss-label">PÉRDIDA</span>
              <span class="loss-value">${target.lossPercent.toFixed(1)} %</span>
            </div>
          </div>
        </div>

        <div class="metrics-section">
          <div class="metric-row">
            <div class="metric-info">
              <div class="label">TIEMPO DE CONEXIÓN</div>
              <div class="sublabel">Puerto 443 | tiempo de conexión</div>
            </div>
            <div class="metric-value-block">
              <span class="metric-main-val">${target.connectionTimeMs.toFixed(1)}</span>
              <span class="metric-unit">ms</span>
            </div>
          </div>

          <div class="metric-row">
            <div class="metric-info">
              <div class="label">RESPUESTA WEB</div>
              <div class="sublabel">ms | primer byte recibido</div>
            </div>
            <div class="metric-value-block">
              <span class="metric-main-val">${target.ttfbMs.toFixed(1)}</span>
              <span class="metric-unit">ms</span>
            </div>
          </div>
        </div>

        <div class="failures-grid">
          <div class="metric-row" style="margin-bottom: 0;">
            <div class="metric-info">
              <div class="label">TIEMPO TOTAL WEB</div>
              <div class="sublabel">ms | respuesta HTTP completa</div>
            </div>
            <div class="metric-value-block">
              <span class="metric-main-val">${target.totalWebMs.toFixed(1)}</span>
              <span class="metric-unit">ms</span>
            </div>
          </div>

          <div class="failure-box ${target.failurePercent > 0 ? 'has-errors' : ''}">
            <div class="label">FALLOS DE CONEXIÓN</div>
            <div class="failure-val">${target.failurePercent.toFixed(1)} %</div>
            <div style="font-size: 8px; color: #64748b;">últimos 5 min</div>
          </div>
        </div>
      </div>

      <div class="card-actions">
        <a class="action-link" onclick="openHistory('${target.id}', '${target.name}')">HISTORIAL</a>
        <a class="action-link" onclick="openRoute('${target.id}', '${target.name}')">RUTA</a>
      </div>
    `;

    container.appendChild(card);
  });
}

// Modal logic: Historial Chart
function openHistory(targetId, targetName) {
  document.getElementById('historyModalTitle').innerText = `Historial de Latencia - ${targetName}`;
  document.getElementById('historyModal').style.display = 'flex';

  fetch(`/api/history/${targetId}`)
    .then(res => res.json())
    .then(data => {
      drawHistoryChart(data.history || []);
    });
}

function drawHistoryChart(history) {
  const canvas = document.getElementById('historyChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (history.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.font = '14px Inter';
    ctx.fillText('Recopilando datos de historial...', 200, 120);
    return;
  }

  const pings = history.map(h => h.pingMs || 0);
  const maxPing = Math.max(...pings, 50);
  const padding = 40;
  const graphWidth = canvas.width - padding * 2;
  const graphHeight = canvas.height - padding * 2;

  // Draw axes
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  // Draw line
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 2.5;
  ctx.beginPath();

  history.forEach((h, index) => {
    const x = padding + (index / (history.length - 1 || 1)) * graphWidth;
    const y = (canvas.height - padding) - ((h.pingMs || 0) / maxPing) * graphHeight;

    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });

  ctx.stroke();

  // Draw points
  history.forEach((h, index) => {
    const x = padding + (index / (history.length - 1 || 1)) * graphWidth;
    const y = (canvas.height - padding) - ((h.pingMs || 0) / maxPing) * graphHeight;

    ctx.fillStyle = h.online ? '#10b981' : '#ef4444';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Display summary stats
  const avg = (pings.reduce((a, b) => a + b, 0) / pings.length).toFixed(1);
  const min = Math.min(...pings).toFixed(1);
  const max = Math.max(...pings).toFixed(1);

  document.getElementById('historyStats').innerHTML = `
    <div style="display: flex; justify-content: space-around; font-size: 13px; font-weight: 700; color: #334155; margin-top: 15px;">
      <span>Mínima: <strong style="color:#10b981">${min} ms</strong></span>
      <span>Promedio: <strong style="color:#2563eb">${avg} ms</strong></span>
      <span>Máxima: <strong style="color:#ef4444">${max} ms</strong></span>
      <span>Muestras: ${history.length}</span>
    </div>
  `;
}

// Modal logic: Traceroute / Ruta
function openRoute(targetId, targetName) {
  document.getElementById('routeModalTitle').innerText = `Ruta de Red (Traceroute) - ${targetName}`;
  document.getElementById('routeModal').style.display = 'flex';
  document.getElementById('tracerouteLoader').style.display = 'block';
  document.getElementById('tracerouteResults').style.display = 'none';

  fetch(`/api/traceroute/${targetId}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('tracerouteLoader').style.display = 'none';
      document.getElementById('tracerouteResults').style.display = 'block';

      const outputPre = document.getElementById('tracerouteOutput');
      if (data.hops && data.hops.length > 0) {
        outputPre.innerText = data.hops.join('\n');
      } else {
        outputPre.innerText = data.rawOutput || 'No se pudo realizar la traza de ruta.';
      }
    })
    .catch(err => {
      document.getElementById('tracerouteLoader').style.display = 'none';
      document.getElementById('tracerouteResults').style.display = 'block';
      document.getElementById('tracerouteOutput').innerText = `Error ejecutando traceroute: ${err.message}`;
    });
}

function closeModal(modalId) {
  document.getElementById(modalId).style.display = 'none';
}

// Global initialization
window.addEventListener('DOMContentLoaded', () => {
  initWebSocket();
  fetchMetrics();
});
