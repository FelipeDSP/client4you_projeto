# Estágio de Build
FROM node:20-alpine as builder
WORKDIR /app

# Instalar dependências
COPY package*.json ./
RUN npm ci

# Copiar código fonte
COPY . .

# Receber URL do backend via argumento do Coolify
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

# Buildar o projeto
RUN npm run build

# Estágio de Servidor (Nginx)
FROM nginx:alpine

# Instalar curl para o healthcheck funcionar
RUN apk add --no-cache curl

# Copiar os arquivos gerados no build (pasta 'build' conforme seu vite.config.ts)
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
