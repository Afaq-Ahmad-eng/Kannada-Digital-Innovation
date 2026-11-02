# One image recipe for every service/worker: docker build --build-arg SERVICE_DIR=services/auth-service .
FROM node:20-bookworm-slim AS build
WORKDIR /repo
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY services ./services
COPY workers ./workers
RUN npm ci --no-audit --no-fund && npm run build

FROM node:20-bookworm-slim
ARG SERVICE_DIR
ENV NODE_ENV=production SERVICE_DIR=${SERVICE_DIR}
WORKDIR /repo
COPY --from=build /repo /repo
USER node
CMD ["sh", "-c", "node ${SERVICE_DIR}/dist/index.js"]