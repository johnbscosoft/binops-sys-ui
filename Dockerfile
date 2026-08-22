FROM node:22-alpine AS builder

ARG BUILD_VERSION=unknown

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN sed -i "s/__BUILD_VERSION__/${BUILD_VERSION}/g" src/environments/environment.prod.ts
RUN npm run build -- --configuration production

FROM nginx:1.28-alpine AS runtime

ARG BUILD_VERSION=unknown
LABEL com.binops.build-version="${BUILD_VERSION}"

ENV API_UPSTREAM=http://binops-sys-api:8001

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder /app/dist/velzon/browser/ /usr/share/nginx/html/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1
