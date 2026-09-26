#!/bin/bash

# ==============================================================================
#  ISP Latency & Egress Monitor - Automated Linux Installer
#  Compatibilidad: Ubuntu / Debian / CentOS / RHEL / AlmaLinux / Rocky / Alpine
# ==============================================================================

set -e

RED='\030[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "===================================================================="
echo "      🌐  ISP LATENCY & EGRESS MONITOR - AUTO INSTALLER"
echo "===================================================================="
echo -e "${NC}"

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Por favor ejecuta este script como root o usando sudo.${NC}"
  exit 1
fi

INSTALL_DIR="/opt/isp-latency-monitor"
PORT=3005

# 2. Update Package Manager & Install Dependencies
echo -e "${YELLOW}[1/5] Actualizando paquetes e instalando herramientas de red (ping, traceroute, git, curl)...${NC}"
if [ -f /etc/debian_version ]; then
  apt-get update -qq
  apt-get install -y -qq curl git traceroute iputils-ping net-tools ca-certificates > /dev/null
elif [ -f /etc/redhat-release ]; then
  yum install -y -q curl git traceroute iputils net-tools > /dev/null
elif [ -f /etc/alpine-release ]; then
  apk add --no-cache curl git traceroute iputils net-tools nodejs npm > /dev/null
fi

# 3. Check and Install Node.js LTS if missing
echo -e "${YELLOW}[2/5] Verificando instalación de Node.js...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${CYAN}Instalando Node.js v20 LTS...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
  apt-get install -y nodejs > /dev/null 2>&1 || yum install -y nodejs > /dev/null 2>&1
fi

NODE_VER=$(node -v)
echo -e "${GREEN}✓ Node.js detectado: ${NODE_VER}${NC}"

# 4. Create App Directory & Setup Files
echo -e "${YELLOW}[3/5] Descargando y configurando ISP Latency Monitor en ${INSTALL_DIR}...${NC}"

if [ -d "$INSTALL_DIR" ]; then
  echo -e "${CYAN}Actualizando instalación existente...${NC}"
  rm -rf "$INSTALL_DIR"
fi

# Clone or copy files
if [ -n "$REPO_URL" ]; then
  git clone "$REPO_URL" "$INSTALL_DIR"
else
  # Default github repository (User can replace with their repo URL)
  git clone https://github.com/USER/isp-latency-monitor.git "$INSTALL_DIR" || mkdir -p "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

# Install Node.js dependencies
echo -e "${YELLOW}[4/5] Instalando dependencias Node.js (Express, WebSockets)...${NC}"
npm install --production --silent

# 5. Create Systemd Service for Auto-start on boot
echo -e "${YELLOW}[5/5] Creando servicio de sistema (systemd) para inicio automático...${NC}"

cat <<'EOF' > /etc/systemd/system/isp-monitor.service
[Unit]
Description=ISP Latency and Egress Monitor Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/isp-latency-monitor
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5
Environment=PORT=3005

[Service]
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable isp-monitor > /dev/null 2>&1
systemctl restart isp-monitor

# Get Public IP
PUBLIC_IP=$(curl -s --max-time 3 https://api.ipify.org || echo "IP_DE_TU_SERVIDOR")

echo -e "${GREEN}"
echo "===================================================================="
echo "  ✅  INSTALACIÓN COMPLETADA EXITOSAMENTE!"
echo "===================================================================="
echo -e "${NC}"
echo -e "🌐 Accede al Dashboard desde cualquier navegador en:"
echo -e "   ${CYAN}http://${PUBLIC_IP}:${PORT}${NC}"
echo -e "   ${CYAN}http://localhost:${PORT}${NC}"
echo ""
echo -e "⚙️  Comandos útiles de administración:"
echo -e "   • Ver estado:     ${YELLOW}systemctl status isp-monitor${NC}"
echo -e "   • Reiniciar:      ${YELLOW}systemctl restart isp-monitor${NC}"
echo -e "   • Ver logs en vivo: ${YELLOW}journalctl -u isp-monitor -f${NC}"
echo "===================================================================="
