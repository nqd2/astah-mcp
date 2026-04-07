FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY tsconfig.json eslint.config.js vitest.config.ts ./
COPY src ./src
COPY tests ./tests
RUN pnpm run build

FROM node:22-alpine AS runtime
WORKDIR /app
RUN corepack enable
COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
COPY bridge.js ./bridge.js
COPY mock-export.js ./mock-export.js
EXPOSE 14405
ENV PORT=14405
ENV HOST=0.0.0.0
CMD ["node", "dist/src/server.js"]
