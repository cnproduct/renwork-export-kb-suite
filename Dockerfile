# Multi-stage Docker build for RenWork Export KB Cloud API
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY mcp/export-kb-mcp/package*.json ./mcp/export-kb-mcp/
COPY cloud-api/package*.json ./cloud-api/

# Install MCP server dependencies & build
WORKDIR /app/mcp/export-kb-mcp
RUN npm install
COPY mcp/export-kb-mcp/ ./
RUN npm run build

# Install Cloud API dependencies & build
WORKDIR /app/cloud-api
RUN npm install
COPY cloud-api/ ./
COPY skills/ ../skills/
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app/mcp/export-kb-mcp ./mcp/export-kb-mcp
COPY --from=builder /app/cloud-api ./cloud-api
COPY --from=builder /app/skills ./skills

WORKDIR /app/cloud-api

EXPOSE 8080

CMD ["node", "dist/server.js"]
