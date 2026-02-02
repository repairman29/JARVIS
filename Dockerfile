# JARVIS gateway on Railway — Node 22, Vault env, then clawdbot gateway
FROM node:22-bookworm-slim

WORKDIR /app

# Copy package files and install (no dev for smaller image)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy repo (scripts, jarvis, skills — gateway reads from cwd)
COPY . .

# Railway sets PORT at runtime; clawdbot gateway defaults to 18789
EXPOSE 18789

CMD ["node", "scripts/start-gateway-with-vault.js"]
