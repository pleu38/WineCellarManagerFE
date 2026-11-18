# Frontend statique React, construit dans une étape Node séparée
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Nginx expose le frontend et transmet /api au backend.
FROM nginx:1.27-alpine
COPY --from=builder /app/dist/ /usr/share/nginx/html/
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY docker/40-frontend-config.sh /docker-entrypoint.d/40-frontend-config.sh
RUN chmod +x /docker-entrypoint.d/40-frontend-config.sh

# Le filtre empêche envsubst de remplacer les variables Nginx intégrées
# telles que $remote_addr ou $proxy_host.
ENV NGINX_ENVSUBST_FILTER="^(API_UPSTREAM|API_KEY)$"
ENV API_UPSTREAM="http://api:8000"
ENV API_KEY=""

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
