FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile
COPY apps/api apps/api
COPY packages/contracts packages/contracts
RUN pnpm --filter api prisma:generate && pnpm --filter api build

FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=3001
WORKDIR /app
RUN apk add --no-cache tini && addgroup -S clickflow && adduser -S clickflow -G clickflow
COPY --from=builder --chown=clickflow:clickflow /app/node_modules ./node_modules
COPY --from=builder --chown=clickflow:clickflow /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=clickflow:clickflow /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=clickflow:clickflow /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder --chown=clickflow:clickflow /app/apps/api/package.json ./apps/api/package.json
USER clickflow
EXPOSE 3001
STOPSIGNAL SIGTERM
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/api/v1/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/dist/src/main.js"]
