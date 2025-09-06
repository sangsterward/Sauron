FROM node:20-slim AS build
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Explicitly install the correct Rollup binary for the platform
RUN pnpm add @rollup/rollup-linux-x64-gnu --save-dev || \
    pnpm add @rollup/rollup-linux-arm64-gnu --save-dev || \
    echo "Rollup binary installation skipped"

# Copy source code
COPY . .

# Build the application
RUN pnpm build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
