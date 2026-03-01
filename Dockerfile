# Stage 1: Build
FROM node:22-alpine AS build

WORKDIR /app

# Install root dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Install client dependencies
COPY client/package.json client/package-lock.json ./client/
RUN cd client && npm ci

# Copy source
COPY tsconfig.json tsconfig.build.json ./
COPY server/ ./server/
COPY client/ ./client/

# Build server (TypeScript → JavaScript)
RUN npm run build

# Build client (Vite)
RUN cd client && npm run build

# Stage 2: Production
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/client/dist ./client/dist
COPY server/db/migrations ./dist/server/db/migrations

EXPOSE 3000

CMD ["node", "dist/server/index.js"]
