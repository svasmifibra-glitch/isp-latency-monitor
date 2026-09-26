FROM node:20-alpine

# Install network diagnostic tools (ping, traceroute)
RUN apk add --no-cache iputils traceroute curl

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3005

ENV PORT=3005

CMD ["node", "server.js"]
