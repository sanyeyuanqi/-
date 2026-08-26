FROM node:24-bookworm-slim AS dependencies

WORKDIR /app

ENV npm_config_update_notifier=false \
    npm_config_fund=false

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

FROM dependencies AS build

COPY . .
RUN npm run lint && npm run build

FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

COPY --from=build --chown=node:node /app/dist/standalone/ ./
# Vinext beta currently omits these externalized runtimes from standalone tracing.
COPY --from=dependencies --chown=node:node /app/node_modules/react ./node_modules/react
COPY --from=dependencies --chown=node:node /app/node_modules/react-dom ./node_modules/react-dom
COPY --from=dependencies --chown=node:node /app/node_modules/react-server-dom-webpack ./node_modules/react-server-dom-webpack
COPY --from=dependencies --chown=node:node /app/node_modules/scheduler ./node_modules/scheduler

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/login').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"]

STOPSIGNAL SIGTERM

CMD ["node", "server.js"]
