const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const targets = require('./targets.json');
const { probeAllTargets, runTraceroute, getTargetHistory } = require('./probeEngine');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3005;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Latest cached metrics
let currentMetrics = [];
let isProbing = false;

// Function to trigger a probe cycle and broadcast via WebSockets
async function runProbeCycle() {
  if (isProbing) return;
  isProbing = true;
  try {
    currentMetrics = await probeAllTargets();
    const payload = JSON.stringify({ type: 'METRICS_UPDATE', data: currentMetrics, timestamp: new Date() });
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  } catch (err) {
    console.error('Error in probe cycle:', err);
  } finally {
    isProbing = false;
  }
}

// REST Endpoints
app.get('/api/targets', (req, res) => {
  res.json(targets);
});

app.get('/api/metrics', (req, res) => {
  res.json({ timestamp: new Date(), metrics: currentMetrics });
});

app.get('/api/history/:id', (req, res) => {
  const history = getTargetHistory(req.params.id);
  res.json({ id: req.params.id, history });
});

app.get('/api/traceroute/:id', async (req, res) => {
  const target = targets.find(t => t.id === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Target not found' });
  }

  const result = await runTraceroute(target.host);
  res.json(result);
});

// WebSocket Connection handler
wss.on('connection', (ws) => {
  console.log('⚡ Nuevo cliente conectado al Dashboard via WebSocket');
  
  // Send current cached metrics immediately upon connection
  if (currentMetrics.length > 0) {
    ws.send(JSON.stringify({ type: 'METRICS_UPDATE', data: currentMetrics, timestamp: new Date() }));
  }

  ws.on('close', () => {
    console.log('Cliente WebSocket desconectado');
  });
});

// Run initial probe immediately and then every 6 seconds
runProbeCycle();
setInterval(runProbeCycle, 6000);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🌐 ISP Latency Monitor Server activo en: http://localhost:${PORT}`);
  console.log(`====================================================`);
});
