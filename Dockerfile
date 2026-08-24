FROM node:20.18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/package.json
COPY cloud-api/package.json ./cloud-api/package.json
COPY mcp/export-kb-mcp/package.json ./mcp/export-kb-mcp/package.json
RUN npm ci
COPY packages/core ./packages/core
COPY cloud-api ./cloud-api
COPY mcp/export-kb-mcp ./mcp/export-kb-mcp
RUN npm run build

FROM node:20.18-alpine AS runner
ENV NODE_ENV=production PORT=8080
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/package.json
COPY cloud-api/package.json ./cloud-api/package.json
COPY mcp/export-kb-mcp/package.json ./mcp/export-kb-mcp/package.json
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force
COPY --from=builder /app/packages/core/dist ./packages/core/dist
COPY --from=builder /app/cloud-api/dist ./cloud-api/dist
COPY portal ./portal
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://127.0.0.1:8080/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "cloud-api/dist/server.js"]
