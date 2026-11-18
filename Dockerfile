# Production image for the Oracle VPS (linux/arm64), built by scripts/deploy.sh.
# Node 24 LTS: ts-fsrs v6 needs Node >= 24 (PRD v2).
FROM node:24-bookworm-slim AS base
# Prisma's engines need OpenSSL.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS build
# Same pnpm major that wrote pnpm-lock.yaml.
RUN npm install -g pnpm@10.27.0
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Prisma's install scripts are disabled in pnpm-workspace.yaml, so generate the client explicitly.
RUN npx prisma generate && pnpm build

FROM base AS run
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
# CLI for `migrate deploy` on start; pinned to the schema's Prisma version.
RUN npm install -g prisma@6.19.3
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/prisma ./prisma
USER node
EXPOSE 3000
CMD ["sh", "-c", "prisma migrate deploy && exec node server.js"]
