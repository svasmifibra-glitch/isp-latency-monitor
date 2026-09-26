# 🌐 ISP Latency & Egress Monitor

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)]()

Un sistema completo de monitoreo de latencias, calidad de red y validación de salidas internacionales en tiempo real diseñado para **Proveedores de Servicios de Internet (ISP)**, redes NOC y Data Centers.

![Dashboard Preview](https://raw.githubusercontent.com/USER/isp-latency-monitor/main/public/preview.png)

---

## ⚡ Características Principales

- 🟢🟠🔴 **Semaforización Visual de Latencias:**
  - **Verde (`< 50 ms`):** Baja latencia / Excelente calidad.
  - **Naranja (`50 - 120 ms`):** Latencia media.
  - **Rojo (`> 120 ms` / Caída):** Alta latencia o servicio inalcanzable.
- 🌐 **Detección de IP Pública WAN y LAN:** Identifica automáticamente la IP Pública Internacional por la que navega tu ISP y la interfaz LAN local.
- ⏱️ **Medición Multicapa en Tiempo Real:**
  - **PING (ICMP / TCP 443):** RTT en ms y % de pérdida de paquetes.
  - **Handshake TCP:** Tiempo de apertura de socket en puerto 443.
  - **Respuesta Web (TTFB):** Tiempo hasta recibir el primer byte por HTTP.
  - **Tiempo Total Web:** Descarga completa HTTP/HTTPS.
  - **Fallos de Conexión (%):** Registro acumulativo de fallos en los últimos 5 minutos.
- 🛤️ **Traceroute Salto a Salto (MTR):** Diagnóstico bajo demanda para inspeccionar saltos de fibra y proveedores transitarios BGP/Peering.
- 📈 **Historial Interactivo:** Gráfico interactivo en vivo con métricas acumuladas (mínima, promedio y máxima).
- ⚡ **WebSockets Push:** Actualización automática cada 6 segundos sin recargar la página.

---

## 🚀 Instalación Automatizada en Linux (1 Solo Comando)

En cualquier servidor **Ubuntu / Debian / CentOS / AlmaLinux / Rocky Linux VPS**:

```bash
curl -fsSL https://raw.githubusercontent.com/TU_USUARIO/isp-latency-monitor/main/install.sh | sudo bash
```

El instalador automático:
1. Instalará las dependencias necesarias (`ping`, `traceroute`, `curl`, `git`, `Node.js`).
2. Clonará e instalará la aplicación en `/opt/isp-latency-monitor`.
3. Creará y activará un servicio `systemd` para que se inicie automáticamente con el sistema.
4. Abrirá el dashboard en el puerto `3005`.

---

## 🐳 Despliegue con Docker / Docker Compose

Si prefieres usar Docker:

```bash
git clone https://github.com/TU_USUARIO/isp-latency-monitor.git
cd isp-latency-monitor
docker compose up -d
```

---

## 💻 Instalación Manual

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/isp-latency-monitor.git
cd isp-latency-monitor

# 2. Instalación de dependencias
npm install

# 3. Iniciar el servidor
npm start
```

Abrir en el navegador: `http://localhost:3005` o `http://<IP_DEL_SERVIDOR>:3005`.

---

## ⚙️ Configuración de Servidores Objetivo (`targets.json`)

Puedes personalizar los destinos o agregar IPs de servidores de juegos o CDNs editando el archivo `targets.json`:

```json
[
  {
    "id": "google",
    "name": "GOOGLE",
    "protocol": "ICMP",
    "host": "8.8.8.8",
    "httpUrl": "https://www.google.com",
    "port": 443,
    "icon": "google"
  },
  {
    "id": "riot_valorant",
    "name": "RIOT VALORANT (EE.UU.)",
    "protocol": "TCP 443",
    "host": "104.160.136.3",
    "httpUrl": "https://104.160.136.3",
    "port": 443,
    "icon": "riotgames"
  }
]
```

---

## 🛠️ Comandos de Servicio en Linux (`systemd`)

- **Ver estado:** `sudo systemctl status isp-monitor`
- **Reiniciar:** `sudo systemctl restart isp-monitor`
- **Ver logs en vivo:** `sudo journalctl -u isp-monitor -f`

---

## 📄 Licencia

MIT License - Desarrollado para uso libre en Proveedores de Internet (ISP) y redes NOC.
