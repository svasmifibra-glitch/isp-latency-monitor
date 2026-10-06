const net = require('net');
const http = require('http');
const https = require('https');
const { exec } = require('child_process');
const os = require('os');
const targets = require('./targets.json');

// Store metrics history in memory (last 60 samples per target)
const metricsHistory = {};
targets.forEach(t => {
  metricsHistory[t.id] = [];
});

// Cached Public IP
let cachedPublicIp = null;
let lastPublicIpFetch = 0;

/**
 * Fetch Public Outbound WAN IP address (IP Pública Internacional)
 */
function getPublicIpAddress() {
  return new Promise((resolve) => {
    // Cache for 30 seconds to avoid spamming the echo service
    if (cachedPublicIp && (Date.now() - lastPublicIpFetch < 30000)) {
      return resolve(cachedPublicIp);
    }

    https.get('https://api.ipify.org?format=json', { timeout: 4000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.ip) {
            cachedPublicIp = json.ip;
            lastPublicIpFetch = Date.now();
            return resolve(json.ip);
          }
        } catch (e) {}
        resolve(cachedPublicIp || 'Detectando WAN...');
      });
    }).on('error', () => {
      resolve(cachedPublicIp || 'Sin conexión WAN');
    });
  });
}

/**
 * Detect local network interfaces and local source IP
 */
function getLocalIpInfo() {
  const interfaces = os.networkInterfaces();
  const list = [];
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal && alias.address !== '127.0.0.1') {
        list.push({ ip: alias.address, name: devName });
      }
    }
  }
  return list.length > 0 ? list[0] : { ip: '127.0.0.1', name: 'localhost' };
}

/**
 * Measure TCP Handshake RTT (Connection Time) and capture local socket IP
 */
function checkTcpPing(host, port = 443, timeout = 3000) {
  return new Promise((resolve) => {
    const start = process.hrtime();
    const socket = new net.Socket();

    socket.setTimeout(timeout);

    socket.on('connect', () => {
      const diff = process.hrtime(start);
      const ms = (diff[0] * 1000 + diff[1] / 1e6);
      const localAddress = socket.localAddress;
      socket.destroy();
      resolve({ success: true, rtt: parseFloat(ms.toFixed(1)), localIp: localAddress });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({ success: false, rtt: null, error: err.message, localIp: null });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ success: false, rtt: null, error: 'Timeout', localIp: null });
    });

    socket.connect(port, host);
  });
}

/**
 * Measure ICMP Ping via system command
 */
function checkIcmpPing(host, count = 3) {
  return new Promise((resolve) => {
    const isWin = os.platform() === 'win32';
    const cmd = isWin ? `ping -n ${count} ${host}` : `ping -c ${count} ${host}`;

    exec(cmd, { timeout: 5000 }, (err, stdout, stderr) => {
      if (err && !stdout) {
        return resolve({ success: false, rtt: null, lossPercent: 100 });
      }

      let rtt = null;
      let lossPercent = 0;

      if (isWin) {
        // Windows ping parsing
        const lossMatch = stdout.match(/\((\d+)%\s+pérdida\)/i) || stdout.match(/\((\d+)%\s+loss\)/i);
        if (lossMatch) lossPercent = parseFloat(lossMatch[1]);

        const avgMatch = stdout.match(/Media = (\d+)ms/i) || stdout.match(/Average = (\d+)ms/i);
        if (avgMatch) {
          rtt = parseFloat(avgMatch[1]);
        } else {
          const timeMatch = stdout.match(/tiempo[=<](\d+)ms/i) || stdout.match(/time[=<](\d+)ms/i);
          if (timeMatch) rtt = parseFloat(timeMatch[1]);
        }
      } else {
        // Linux/macOS ping parsing
        const lossMatch = stdout.match(/(\d+)%\s+packet loss/i);
        if (lossMatch) lossPercent = parseFloat(lossMatch[1]);

        const avgMatch = stdout.match(/min\/avg\/max\/\S+\s+=\s+\S+\/(\S+)\//i);
        if (avgMatch) {
          rtt = parseFloat(avgMatch[1]);
        }
      }

      resolve({
        success: lossPercent < 100,
        rtt: rtt !== null ? parseFloat(rtt.toFixed(1)) : null,
        lossPercent: lossPercent
      });
    });
  });
}

/**
 * Measure HTTP TTFB and Total Download Time
 */
function checkHttpMetrics(httpUrl, timeout = 5000) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(httpUrl);
      const transport = urlObj.protocol === 'https:' ? https : http;

      const startTime = process.hrtime();
      let ttfb = null;
      let totalTime = null;

      const req = transport.get(httpUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ISP-Probe/1.0' },
        timeout: timeout
      }, (res) => {
        const responseStart = process.hrtime(startTime);
        ttfb = parseFloat((responseStart[0] * 1000 + responseStart[1] / 1e6).toFixed(1));

        res.on('data', () => {}); // Consume data
        res.on('end', () => {
          const totalDiff = process.hrtime(startTime);
          totalTime = parseFloat((totalDiff[0] * 1000 + totalDiff[1] / 1e6).toFixed(1));
          resolve({
            success: true,
            statusCode: res.statusCode,
            ttfb: ttfb,
            totalTime: totalTime
          });
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, ttfb: null, totalTime: null, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ success: false, ttfb: null, totalTime: null, error: 'HTTP Timeout' });
      });
    } catch (e) {
      resolve({ success: false, ttfb: null, totalTime: null, error: e.message });
    }
  });
}

/**
 * Run MTR / Traceroute for a host
 */
function runTraceroute(host) {
  return new Promise((resolve) => {
    const isWin = os.platform() === 'win32';
    // Max 15 hops for speed
    const cmd = isWin ? `tracert -d -h 15 ${host}` : `traceroute -n -m 15 ${host}`;

    exec(cmd, { timeout: 20000 }, (err, stdout, stderr) => {
      if (!stdout && err) {
        return resolve({ success: false, host, output: stderr || err.message, hops: [] });
      }

      const lines = stdout.split('\n');
      const hops = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.length > 0) {
          hops.push(trimmed);
        }
      });

      resolve({
        success: true,
        host,
        rawOutput: stdout,
        hops
      });
    });
  });
}

/**
 * Perform a full probe cycle across all targets in parallel
 */
async function probeAllTargets() {
  const publicIp = await getPublicIpAddress();
  const defaultLocalIp = getLocalIpInfo().ip;

  const results = await Promise.all(targets.map(async (target) => {
    // Execute ICMP, TCP 443 handshake, and HTTP metrics in parallel per target
    const [icmpResult, tcpResult, httpResult] = await Promise.all([
      checkIcmpPing(target.host, 1),
      checkTcpPing(target.host, target.port || 443, 2500),
      checkHttpMetrics(target.httpUrl, 3000)
    ]);

    // Determine online status & primary ping RTT
    const isOnline = icmpResult.success || tcpResult.success || httpResult.success;
    
    // Use ICMP RTT if available (matches tracert), otherwise fall back to TCP 443 Handshake RTT
    let pingMs = null;
    if (icmpResult.success && icmpResult.rtt !== null) {
      pingMs = icmpResult.rtt;
    } else if (tcpResult.success && tcpResult.rtt !== null) {
      pingMs = tcpResult.rtt;
    }

    const lossPct = icmpResult.lossPercent !== undefined ? icmpResult.lossPercent : (isOnline ? 0 : 100);
    const connectionTimeMs = tcpResult.rtt;
    const ttfbMs = httpResult.ttfb;
    const totalWebMs = httpResult.totalTime;

    const sample = {
      timestamp: new Date().toISOString(),
      online: isOnline,
      pingMs: pingMs,
      lossPercent: lossPct,
      connectionTimeMs: connectionTimeMs,
      ttfbMs: ttfbMs,
      totalWebMs: totalWebMs
    };

    // Keep history (last 60 samples)
    if (!metricsHistory[target.id]) metricsHistory[target.id] = [];
    metricsHistory[target.id].push(sample);
    if (metricsHistory[target.id].length > 60) {
      metricsHistory[target.id].shift();
    }

    // Calculate connection failures in last 5 min (last 30 samples approx)
    const recentSamples = metricsHistory[target.id].slice(-30);
    const failedCount = recentSamples.filter(s => !s.online).length;
    const failurePercent = recentSamples.length > 0 
      ? parseFloat(((failedCount / recentSamples.length) * 100).toFixed(1)) 
      : 0;

    const localIp = tcpResult.localIp || defaultLocalIp;

    return {
      id: target.id,
      name: target.name,
      protocol: target.protocol,
      host: target.host,
      icon: target.icon,
      publicIp: publicIp,
      localIp: localIp,
      online: isOnline,
      pingMs: pingMs !== null ? pingMs : 0.0,
      lossPercent: lossPct,
      connectionTimeMs: connectionTimeMs !== null ? connectionTimeMs : 0.0,
      ttfbMs: ttfbMs !== null ? ttfbMs : 0.0,
      totalWebMs: totalWebMs !== null ? totalWebMs : 0.0,
      failurePercent: failurePercent
    };
  }));

  return results;
}

function getTargetHistory(targetId) {
  return metricsHistory[targetId] || [];
}

module.exports = {
  probeAllTargets,
  runTraceroute,
  getTargetHistory,
  getLocalIpInfo,
  getPublicIpAddress
};
