FROM node:20-alpine as builder
WORKDIR /app

# Alinhando com o package-lock.json existente
COPY package*.json ./
RUN npm ci

COPY . .

# Corrigindo para o padrão Vite
ARG VITE_BACKEND_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN npm run build

FROM nginx:alpine
# O seu vite.config.ts define 'build' como pasta de saída
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
