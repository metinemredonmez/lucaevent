############################
# 1) deps
############################
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json apps/api/
RUN pnpm fetch --filter @novara/api

############################
# 2) build
############################
FROM node:20-alpine AS build
WORKDIR /app
RUN corepack enable
COPY --from=deps /app /app
COPY . .
RUN pnpm install --filter @novara/api --frozen-lockfile --offline
RUN pnpm --filter @novara/api prisma generate
RUN pnpm --filter @novara/api build

############################
# 3) runtime
############################
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache wget tini && addgroup -S app && adduser -S app -G app
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
COPY --from=build /app/apps/api/node_modules ./node_modules
USER app
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
